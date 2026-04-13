#!/usr/bin/env bash
# pet-comment Stop hook
# Extracts hidden pet comment from Claude's response.
# Claude writes: <!-- pet: *歪头* 那个 error handler 少了 finally -->
# This hook extracts it and updates the status line bubble.

STATE_DIR="$HOME/.petsonality"
umask 077  # ensure files created by this hook are 0600
SID="${TMUX_PANE#%}"
SID="${SID:-default}"
STATUS_FILE="$STATE_DIR/status.json"
COOLDOWN_FILE="$STATE_DIR/.last_speak.$SID"
CONFIG_FILE="$STATE_DIR/config.json"

[ -f "$STATUS_FILE" ] || exit 0

# Read cooldown from pet's cooldownRange (minutes → seconds), fallback to config
PET_FILE="$STATE_DIR/pet.json"
COOLDOWN=300  # default 5 min
if [ -f "$PET_FILE" ]; then
  CD_MIN=$(jq -r '.cooldownRange[0] // 5' "$PET_FILE" 2>/dev/null)
  CD_MAX=$(jq -r '.cooldownRange[1] // 12' "$PET_FILE" 2>/dev/null)
  # Random between min and max (in seconds)
  CD_RANGE=$(( (CD_MAX - CD_MIN) * 60 ))
  [ "$CD_RANGE" -le 0 ] && CD_RANGE=60
  COOLDOWN=$(( CD_MIN * 60 + RANDOM % CD_RANGE ))
elif [ -f "$CONFIG_FILE" ]; then
  _cd=$(jq -r '.commentCooldown // 300' "$CONFIG_FILE" 2>/dev/null || echo 300)
  [ "$_cd" -gt 0 ] 2>/dev/null && COOLDOWN=$_cd
fi

INPUT=$(cat)

# Extract last_assistant_message from hook input
MSG=$(echo "$INPUT" | jq -r '.last_assistant_message // ""' 2>/dev/null)
[ -z "$MSG" ] && exit 0

# Extract <!-- pet: ... --> comment (macOS compatible, no grep -P)
COMMENT=$(echo "$MSG" | sed -n 's/.*<!-- *pet: *\(.*[^ ]\) *-->.*/\1/p' | tail -1)
[ -z "$COMMENT" ] && exit 0

# Cooldown: configurable (default 30s)
if [ -f "$COOLDOWN_FILE" ]; then
    LAST=$(cat "$COOLDOWN_FILE" 2>/dev/null)
    NOW=$(date +%s)
    [ $(( NOW - ${LAST:-0} )) -lt "$COOLDOWN" ] && exit 0
fi

mkdir -p "$STATE_DIR"
date +%s > "$COOLDOWN_FILE"

# Update status.json with the reaction
TMP=$(mktemp)
jq --arg r "$COMMENT" '.reaction = $r' "$STATUS_FILE" > "$TMP" 2>/dev/null && mv "$TMP" "$STATUS_FILE"

# Calculate bubble width from terminal (hook runs once, can afford detection)
_COLS=0
_PID=$$
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
# bubble_width = terminal - art(9) - gap(5) - margin(8) - box_border(4)
WRAP_W=$(( _COLS - 26 ))
[ "$WRAP_W" -lt 20 ] && WRAP_W=20
[ "$WRAP_W" -gt 60 ] && WRAP_W=60

# Pre-wrap text for statusline bubble (CJK-aware, one-time cost)
WRAP_SCRIPT="$(dirname "$0")/wrap.py"
WRAP_DATA=$(python3 "$WRAP_SCRIPT" "$COMMENT" "$WRAP_W" 4 2>/dev/null || echo '{"lines":[],"widths":[],"maxWidth":0}')

# Write reaction file with pre-wrapped lines + precise widths
jq -n --arg r "$COMMENT" --arg ts "$(date +%s)000" \
  --argjson wrap "$WRAP_DATA" \
  '{reaction: $r, wrapped: $wrap.lines, widths: $wrap.widths, maxWidth: $wrap.maxWidth, timestamp: ($ts | tonumber), reason: "turn"}' \
  > "$STATE_DIR/reaction.$SID.json"

exit 0
