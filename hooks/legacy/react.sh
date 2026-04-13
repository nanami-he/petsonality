#!/usr/bin/env bash
# petsonality PostToolUse hook — companion rhythm
#
# Triggers on: errors, test failures, large diffs, milestones, AND daily events.
# Reads animal-specific reactions from ~/.petsonality/reactions-pool.json
# Frequency controlled by talkLevel (chatty/moderate/quiet/silent).

STATE_DIR="$HOME/.petsonality"
umask 077

SID="${TMUX_PANE#%}"
SID="${SID:-default}"
REACTION_FILE="$STATE_DIR/reaction.$SID.json"
PET_FILE="$STATE_DIR/pet.json"
COOLDOWN_FILE="$STATE_DIR/.last_speak.$SID"
STREAK_FILE="$STATE_DIR/.silent_streak.$SID"
POOL_FILE="$STATE_DIR/reactions-pool.json"

# Exit if no pet or no pool
[ -f "$PET_FILE" ] || exit 0
[ -f "$POOL_FILE" ] || exit 0

INPUT=$(cat)

# ─── Read pet config ────────────────────────────────────────────────────────

PET_ID=$(jq -r '.petId // ""' "$PET_FILE" 2>/dev/null)
[ -z "$PET_ID" ] && exit 0

TALK_LEVEL=$(jq -r --arg id "$PET_ID" '.meta[$id].talkLevel // "moderate"' "$POOL_FILE" 2>/dev/null)

# ─── Frequency parameters by talkLevel ──────────────────────────────────────
# Format: DAILY_PCT MILESTONE_PCT STREAK_MAX COOLDOWN_MIN COOLDOWN_MAX
case "$TALK_LEVEL" in
  chatty)   DAILY_PCT=15; MILE_PCT=30; STREAK_MAX=7;  CD_MIN=30;  CD_MAX=75  ;;
  moderate) DAILY_PCT=10; MILE_PCT=20; STREAK_MAX=10; CD_MIN=60;  CD_MAX=120 ;;
  quiet)    DAILY_PCT=5;  MILE_PCT=12; STREAK_MAX=14; CD_MIN=120; CD_MAX=240 ;;
  silent)   DAILY_PCT=3;  MILE_PCT=8;  STREAK_MAX=18; CD_MIN=180; CD_MAX=360 ;;
  *)        DAILY_PCT=10; MILE_PCT=20; STREAK_MAX=10; CD_MIN=60;  CD_MAX=120 ;;
esac

# ─── Cooldown check ─────────────────────────────────────────────────────────

CD_RANGE=$(( CD_MAX - CD_MIN ))
[ "$CD_RANGE" -le 0 ] && CD_RANGE=30
COOLDOWN=$(( CD_MIN + RANDOM % CD_RANGE ))

if [ -f "$COOLDOWN_FILE" ]; then
    LAST=$(cat "$COOLDOWN_FILE" 2>/dev/null)
    NOW=$(date +%s)
    DIFF=$(( NOW - ${LAST:-0} ))
    [ "$DIFF" -lt "$COOLDOWN" ] && exit 0
fi

# ─── Parse tool output ──────────────────────────────────────────────────────

RESULT=$(echo "$INPUT" | jq -r '.tool_response // ""' 2>/dev/null)
[ -z "$RESULT" ] && exit 0

# ─── Silent streak tracking ─────────────────────────────────────────────────

STREAK=0
[ -f "$STREAK_FILE" ] && STREAK=$(cat "$STREAK_FILE" 2>/dev/null)
STREAK=$(( ${STREAK:-0} + 1 ))

FORCE_SPEAK=0
[ "$STREAK" -ge "$STREAK_MAX" ] && FORCE_SPEAK=1

# ─── Event detection ────────────────────────────────────────────────────────

REASON=""
PRIORITY=0  # 0=skip, 1=daily, 2=milestone, 3=error

# Priority 3: Errors and failures
if echo "$RESULT" | grep -qiE '\b[1-9][0-9]* (failed|failing)\b|tests? failed|^FAIL(ED)?|✗|✘'; then
    REASON="test-fail"
    PRIORITY=3
elif echo "$RESULT" | grep -qiE '\berror:|\bexception\b|\btraceback\b|\bpanicked at\b|\bfatal:|exit code [1-9]'; then
    REASON="error"
    PRIORITY=3
elif echo "$RESULT" | grep -qiE '^\+.*[0-9]+ insertions|[0-9]+ files? changed'; then
    LINES=$(echo "$RESULT" | grep -oE '[0-9]+ insertions' | grep -oE '[0-9]+' | head -1)
    [ "${LINES:-0}" -gt 80 ] && REASON="large-diff" && PRIORITY=3
fi

# Priority 2: Milestones (only if no error detected)
if [ "$PRIORITY" -lt 2 ]; then
    if echo "$RESULT" | grep -qiE '\b(0 fail|all pass|tests? passed|✓.*pass)\b|^ok\b.*tests?'; then
        REASON="turn"
        PRIORITY=2
    elif echo "$RESULT" | grep -qiE 'create mode|^\[.*\]\s'; then
        # git commit output pattern
        REASON="turn"
        PRIORITY=2
    fi
fi

# Priority 1: Daily existence (anything else)
if [ "$PRIORITY" -eq 0 ]; then
    REASON="turn"
    PRIORITY=1
fi

# ─── Probability gate ───────────────────────────────────────────────────────

SHOULD_SPEAK=0

if [ "$FORCE_SPEAK" -eq 1 ]; then
    # Silent streak exceeded — must speak
    SHOULD_SPEAK=1
elif [ "$PRIORITY" -ge 3 ]; then
    # Errors always trigger
    SHOULD_SPEAK=1
elif [ "$PRIORITY" -ge 2 ]; then
    # Milestones: MILE_PCT% chance
    ROLL=$(( RANDOM % 100 ))
    [ "$ROLL" -lt "$MILE_PCT" ] && SHOULD_SPEAK=1
else
    # Daily: DAILY_PCT% chance
    ROLL=$(( RANDOM % 100 ))
    [ "$ROLL" -lt "$DAILY_PCT" ] && SHOULD_SPEAK=1
fi

if [ "$SHOULD_SPEAK" -eq 0 ]; then
    # Update streak and exit
    echo "$STREAK" > "$STREAK_FILE"
    exit 0
fi

# ─── Pick reaction from animal-specific pool ─────────────────────────────────

# Read all reactions for this animal + reason from JSON pool
POOL_COUNT=$(jq -r --arg id "$PET_ID" --arg r "$REASON" '.pool[$id][$r] | length' "$POOL_FILE" 2>/dev/null)
[ "${POOL_COUNT:-0}" -eq 0 ] && POOL_COUNT=$(jq -r --arg r "$REASON" '.pool.labrador[$r] | length' "$POOL_FILE" 2>/dev/null)

if [ "${POOL_COUNT:-0}" -gt 0 ]; then
    IDX=$(( RANDOM % POOL_COUNT ))
    REACTION=$(jq -r --arg id "$PET_ID" --arg r "$REASON" --argjson i "$IDX" '.pool[$id][$r][$i] // ""' "$POOL_FILE" 2>/dev/null)
fi

# Fallback if pool read failed
[ -z "$REACTION" ] && REACTION="*看了看你*"

# ─── Write reaction ──────────────────────────────────────────────────────────

mkdir -p "$STATE_DIR"
date +%s > "$COOLDOWN_FILE"
echo "0" > "$STREAK_FILE"

# Calculate bubble width
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

exit 0
