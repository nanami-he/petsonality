#!/usr/bin/env bash
# claude-buddy PostToolUse hook
# Detects errors, test failures, and large diffs in tool output
# Writes reaction to ~/.claude-buddy/reaction.json for the status line

STATE_DIR="$HOME/.claude-buddy"
# Session ID: sanitized tmux pane number, or "default" outside tmux
SID="${TMUX_PANE#%}"
SID="${SID:-default}"
REACTION_FILE="$STATE_DIR/reaction.$SID.json"
COMPANION_FILE="$STATE_DIR/companion.json"
COOLDOWN_FILE="$STATE_DIR/.last_reaction.$SID"
CONFIG_FILE="$STATE_DIR/config.json"

# Exit if no companion
[ -f "$COMPANION_FILE" ] || exit 0

# Read hook input from stdin
INPUT=$(cat)

# Read cooldown from config (default 30s)
COOLDOWN=30
if [ -f "$CONFIG_FILE" ]; then
  _cd=$(jq -r '.commentCooldown // 30' "$CONFIG_FILE" 2>/dev/null || echo 30)
  [ "$_cd" -gt 0 ] 2>/dev/null && COOLDOWN=$_cd
fi

# Cooldown: configurable
if [ -f "$COOLDOWN_FILE" ]; then
    LAST=$(cat "$COOLDOWN_FILE" 2>/dev/null)
    NOW=$(date +%s)
    DIFF=$(( NOW - ${LAST:-0} ))
    [ "$DIFF" -lt "$COOLDOWN" ] && exit 0
fi

# Extract tool result
RESULT=$(echo "$INPUT" | jq -r '.tool_result // ""' 2>/dev/null)
[ -z "$RESULT" ] && exit 0

# Read species for species-aware reactions
SPECIES=$(jq -r '.bones.species // "blob"' "$COMPANION_FILE" 2>/dev/null)
NAME=$(jq -r '.name // "buddy"' "$COMPANION_FILE" 2>/dev/null)

REASON=""
REACTION=""

# ─── Detect test failures ────────────────────────────────────────────────────
if echo "$RESULT" | grep -qiE '\b[1-9][0-9]* (failed|failing)\b|tests? failed|^FAIL(ED)?|✗|✘'; then
    REASON="test-fail"
    REACTIONS=(
        "*slow blink* ...that test."
        "bold of you to assume that would pass."
        "the tests are trying to tell you something."
        "*sips tea* interesting."
    )
    REACTION="${REACTIONS[$((RANDOM % ${#REACTIONS[@]}))]}"

# ─── Detect errors ───────────────────────────────────────────────────────────
elif echo "$RESULT" | grep -qiE '\berror:|\bexception\b|\btraceback\b|\bpanicked at\b|\bfatal:|exit code [1-9]'; then
    REASON="error"
    REACTIONS=(
        "*head tilts* ...that doesn't look right."
        "saw that one coming."
        "*slow blink* the stack trace told you everything."
        "*winces*"
    )
    REACTION="${REACTIONS[$((RANDOM % ${#REACTIONS[@]}))]}"

# ─── Detect large diffs ─────────────────────────────────────────────────────
elif echo "$RESULT" | grep -qiE '^\+.*[0-9]+ insertions|[0-9]+ files? changed'; then
    LINES=$(echo "$RESULT" | grep -oE '[0-9]+ insertions' | grep -oE '[0-9]+' | head -1)
    if [ "${LINES:-0}" -gt 80 ]; then
        REASON="large-diff"
        REACTIONS=(
            "that's... a lot of changes."
            "*counts lines* are you refactoring or rewriting?"
            "might want to split that PR."
            "bold move. let's see if CI agrees."
        )
        REACTION="${REACTIONS[$((RANDOM % ${#REACTIONS[@]}))]}"
    fi
fi

# Write reaction if detected
if [ -n "$REASON" ]; then
    mkdir -p "$STATE_DIR"
    date +%s > "$COOLDOWN_FILE"

    # Write reaction for status line (use jq for safe JSON encoding)
    jq -n --arg r "$REACTION" --arg ts "$(date +%s)000" --arg reason "$REASON" \
      '{reaction: $r, timestamp: ($ts | tonumber), reason: $reason}' \
      > "$REACTION_FILE"

    # Update status.json with reaction
    if [ -f "$STATE_DIR/status.json" ]; then
        TMP=$(mktemp)
        jq --arg r "$REACTION" '.reaction = $r' "$STATE_DIR/status.json" > "$TMP" 2>/dev/null && mv "$TMP" "$STATE_DIR/status.json"
    fi
fi

exit 0
