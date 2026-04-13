#!/usr/bin/env bash
# petsonality PostToolUse hook
# Detects errors, test failures, and large diffs in tool output
# Writes reaction to ~/.petsonality/reaction.json for the status line

STATE_DIR="$HOME/.petsonality"
umask 077  # ensure files created by this hook are 0600

SID="${TMUX_PANE#%}"
SID="${SID:-default}"
REACTION_FILE="$STATE_DIR/reaction.$SID.json"
PET_FILE="$STATE_DIR/pet.json"
COOLDOWN_FILE="$STATE_DIR/.last_speak.$SID"

# Exit if no pet
[ -f "$PET_FILE" ] || exit 0

INPUT=$(cat)

# Read cooldown from pet's cooldownRange (shared with pet-comment.sh)
COOLDOWN=300
if [ -f "$PET_FILE" ]; then
  CD_MIN=$(jq -r '.cooldownRange[0] // 5' "$PET_FILE" 2>/dev/null)
  CD_MAX=$(jq -r '.cooldownRange[1] // 12' "$PET_FILE" 2>/dev/null)
  CD_RANGE=$(( (CD_MAX - CD_MIN) * 60 ))
  [ "$CD_RANGE" -le 0 ] && CD_RANGE=60
  COOLDOWN=$(( CD_MIN * 60 + RANDOM % CD_RANGE ))
fi

# Cooldown
if [ -f "$COOLDOWN_FILE" ]; then
    LAST=$(cat "$COOLDOWN_FILE" 2>/dev/null)
    NOW=$(date +%s)
    DIFF=$(( NOW - ${LAST:-0} ))
    [ "$DIFF" -lt "$COOLDOWN" ] && exit 0
fi

RESULT=$(echo "$INPUT" | jq -r '.tool_response // ""' 2>/dev/null)
[ -z "$RESULT" ] && exit 0

REASON=""
REACTION=""

# ─── Detect test failures ────────────────────────────────────────────────────
if echo "$RESULT" | grep -qiE '\b[1-9][0-9]* (failed|failing)\b|tests? failed|^FAIL(ED)?|✗|✘'; then
    REASON="test-fail"
    REACTIONS=(
        "*看了看测试结果* ……嗯。"
        "*默默记下来*"
        "测试在跟你说话，你在听吗？"
    )
    REACTION="${REACTIONS[$((RANDOM % ${#REACTIONS[@]}))]}"

# ─── Detect errors ───────────────────────────────────────────────────────────
elif echo "$RESULT" | grep -qiE '\berror:|\bexception\b|\btraceback\b|\bpanicked at\b|\bfatal:|exit code [1-9]'; then
    REASON="error"
    REACTIONS=(
        "*歪头* ……这看起来不太对。"
        "*盯着报错信息*"
        "*慢慢眨眼* stack trace 已经告诉你了。"
        "*皱眉*"
    )
    REACTION="${REACTIONS[$((RANDOM % ${#REACTIONS[@]}))]}"

# ─── Detect large diffs ─────────────────────────────────────────────────────
elif echo "$RESULT" | grep -qiE '^\+.*[0-9]+ insertions|[0-9]+ files? changed'; then
    LINES=$(echo "$RESULT" | grep -oE '[0-9]+ insertions' | grep -oE '[0-9]+' | head -1)
    if [ "${LINES:-0}" -gt 80 ]; then
        REASON="large-diff"
        REACTIONS=(
            "这……改得有点多。"
            "*数了数行数* 要不要拆个 PR？"
            "*紧张地看着 diff*"
        )
        REACTION="${REACTIONS[$((RANDOM % ${#REACTIONS[@]}))]}"
    fi
fi

# Write reaction if detected
if [ -n "$REASON" ]; then
    mkdir -p "$STATE_DIR"
    date +%s > "$COOLDOWN_FILE"

    # Calculate bubble width (same TTY detection as pet-comment.sh)
    _COLS=0; _PID=$$
    for _ in 1 2 3 4 5; do
        _PID=$(ps -o ppid= -p "$_PID" 2>/dev/null | tr -d ' ')
        [ -z "$_PID" ] || [ "$_PID" = "1" ] && break
        _TTY=$(ps -o tty= -p "$_PID" 2>/dev/null | tr -d ' ')
        if [ -n "$_TTY" ] && [ "$_TTY" != "??" ] && [ "$_TTY" != "-" ]; then
            _DEV="/dev/$_TTY"
            [ -c "$_DEV" ] && _COLS=$(stty size < "$_DEV" 2>/dev/null | awk '{print $2}')
            [ "${_COLS:-0}" -gt 40 ] && break
        fi
    done
    [ "${_COLS:-0}" -lt 40 ] && _COLS=80
    WRAP_W=$(( _COLS - 26 ))
    [ "$WRAP_W" -lt 20 ] && WRAP_W=20
    [ "$WRAP_W" -gt 60 ] && WRAP_W=60

    # Pre-wrap for statusline bubble
    WRAP_SCRIPT="$(dirname "$0")/wrap.py"
    WRAP_DATA=$(python3 "$WRAP_SCRIPT" "$REACTION" "$WRAP_W" 4 2>/dev/null || echo '{"lines":[],"widths":[],"maxWidth":0}')

    jq -n --arg r "$REACTION" --arg ts "$(date +%s)000" --arg reason "$REASON" \
      --argjson wrap "$WRAP_DATA" \
      '{reaction: $r, wrapped: $wrap.lines, widths: $wrap.widths, maxWidth: $wrap.maxWidth, timestamp: ($ts | tonumber), reason: $reason}' \
      > "$REACTION_FILE"

    if [ -f "$STATE_DIR/status.json" ]; then
        TMP=$(mktemp)
        jq --arg r "$REACTION" '.reaction = $r' "$STATE_DIR/status.json" > "$TMP" 2>/dev/null && mv "$TMP" "$STATE_DIR/status.json"
    fi
fi

exit 0
