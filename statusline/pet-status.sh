#!/usr/bin/env bash
# mbti-pet status line — animated, right-aligned multi-line companion
#
# Animation: sequence [0,0,0,0,1,0,0,0,-1,0,0,2,0,0,0] with 500ms ticks
#   - Frame -1 = blink (eyes replaced with "-")
#   - Frames 0,1,2 = the 3 idle art variants per animal
#   - refreshInterval: 1s in settings.json cycles the animation
#
# Uses Braille Blank (U+2800) for padding — survives JS .trim()

STATE="$HOME/.mbti-pet/status.json"
SID="${TMUX_PANE#%}"
SID="${SID:-default}"

[ -f "$STATE" ] || exit 0

eval "$(jq -r '
  @sh "MUTED=\(.muted // false)",
  @sh "NAME=\(.name // "")",
  @sh "PET_ID=\(.petId // "")",
  @sh "REACTION=\(.reaction // "")"
' "$STATE" 2>/dev/null)"

[ "$MUTED" = "true" ] && exit 0
[ -z "$NAME" ] && exit 0

# Check for newer session-specific reaction
REACTION_FILE="$HOME/.mbti-pet/reaction.$SID.json"
if [ -f "$REACTION_FILE" ]; then
  NOW_MS=$(($(date +%s) * 1000))
  eval "$(jq -r '@sh "R_TEXT=\(.reaction // "")", @sh "R_TS=\(.timestamp // 0)"' "$REACTION_FILE" 2>/dev/null)"
  R_TS_INT=${R_TS%.*}
  AGE=$(( NOW_MS - R_TS_INT ))
  if [ "$AGE" -lt 10000 ] && [ -n "$R_TEXT" ]; then
    REACTION="$R_TEXT"
  fi
fi

NC=$'\033[0m'

# ─── Animal colors (realistic) ──────────────────────────────────────────────
case "$PET_ID" in
  raven)    C=$'\033[38;2;140;100;180m'  ;;
  owl)      C=$'\033[38;2;160;120;60m'  ;;
  bear)     C=$'\033[38;2;120;72;40m'   ;;
  fox)      C=$'\033[38;2;215;120;40m'  ;;
  wolf)     C=$'\033[38;2;140;140;150m' ;;
  deer)     C=$'\033[38;2;190;150;90m'  ;;
  labrador) C=$'\033[38;2;210;175;80m'  ;;
  dolphin)  C=$'\033[38;2;100;140;180m' ;;
  beaver)   C=$'\033[38;2;140;90;50m'   ;;
  elephant) C=$'\033[38;2;150;155;160m' ;;
  lion)     C=$'\033[38;2;210;170;70m'  ;;
  golden)   C=$'\033[38;2;220;185;90m'  ;;
  cat)      C=$'\033[38;2;230;160;50m'  ;;
  panda)    C=$'\033[38;2;50;50;50m'    ;;
  cheetah)  C=$'\033[38;2;210;180;100m' ;;
  parrot)   C=$'\033[38;2;50;180;80m'   ;;
  *)        C=$'\033[0m' ;;
esac

B=$'\xe2\xa0\x80'  # Braille Blank U+2800

# ─── Animation: per-animal randomized ────────────────────────────────────────
# Each animal has: idle%, move%, blink% (out of 100)
# Evaluated each refresh (1s). $RANDOM gives different value each call.
NOW=$(date +%s)

IDLE_PCT=75; MOVE_PCT=15; BLINK_PCT=10  # defaults

case "$PET_ID" in
  owl)      IDLE_PCT=80; MOVE_PCT=15; BLINK_PCT=5  ;;  # rarely blinks, sometimes shifts
  cat)      IDLE_PCT=85; MOVE_PCT=5;  BLINK_PCT=10 ;;  # lazy, slow blink
  raven)    IDLE_PCT=60; MOVE_PCT=33; BLINK_PCT=7  ;;  # alert, head always turning
  bear)     IDLE_PCT=94; MOVE_PCT=3;  BLINK_PCT=3  ;;  # calm, rare but slow actions
  parrot)   IDLE_PCT=50; MOVE_PCT=30; BLINK_PCT=20 ;;  # hyper
  dolphin)  IDLE_PCT=55; MOVE_PCT=30; BLINK_PCT=15 ;;  # playful
  fox)      IDLE_PCT=65; MOVE_PCT=25; BLINK_PCT=10 ;;  # alert
  panda)    IDLE_PCT=88; MOVE_PCT=5;  BLINK_PCT=7  ;;  # lazy
  cheetah)  IDLE_PCT=60; MOVE_PCT=28; BLINK_PCT=12 ;;  # twitchy
esac

ROLL=$(( RANDOM % 100 ))

# Bear combo: check if mid-action (slam or wave)
BEAR_ACT="$HOME/.mbti-pet/.bear_act"
if [ "$PET_ID" = "bear" ] && [ -f "$BEAR_ACT" ]; then
    # Safe parse: validate format before eval
    _ACT_RAW=$(cat "$BEAR_ACT" 2>/dev/null)
    if echo "$_ACT_RAW" | grep -qE '^ACT_TYPE=(slam|wave|cooldown); ACT_LEFT=[0-9]+; ACT_STEP=[0-9]+$'; then
        eval "$_ACT_RAW"
    else
        rm -f "$BEAR_ACT"  # corrupted, remove
    fi
    ACT_STEP=${ACT_STEP:-0}
    if [ "${ACT_LEFT:-0}" -gt 0 ]; then
        case "$ACT_TYPE" in
          slam)
            if [ $(( ACT_STEP % 2 )) -eq 0 ]; then FRAME=4; else FRAME=5; fi ;;
          wave)
            if [ $(( (ACT_STEP / 2) % 2 )) -eq 0 ]; then FRAME=1; else FRAME=3; fi ;;
          cooldown)
            FRAME=0 ;;  # forced idle after combo
        esac
        NEW_LEFT=$(( ACT_LEFT - 1 ))
        NEW_STEP=$(( ACT_STEP + 1 ))
        if [ $NEW_LEFT -le 0 ]; then
            # Cooldown: write idle marker for 3 seconds
            echo "ACT_TYPE=cooldown; ACT_LEFT=3; ACT_STEP=0" > "$BEAR_ACT"
        else
            echo "ACT_TYPE=$ACT_TYPE; ACT_LEFT=$NEW_LEFT; ACT_STEP=$NEW_STEP" > "$BEAR_ACT"
        fi
    else
        rm -f "$BEAR_ACT"
        FRAME=0
    fi
elif [ $ROLL -lt $BLINK_PCT ]; then
    FRAME=-1
elif [ $ROLL -lt $(( BLINK_PCT + MOVE_PCT )) ]; then
    case "$PET_ID" in
      owl|raven) if [ $(( RANDOM % 2 )) -eq 0 ]; then FRAME=1; else FRAME=3; fi ;;
      bear)
        # Pick action: wave (60%) or slam (40%)
        if [ $(( RANDOM % 100 )) -lt 60 ]; then
            FRAME=1  # wave start
            WAVE_DUR=$(( RANDOM % 4 + 12 ))  # 12-15 seconds
            echo "ACT_TYPE=wave; ACT_LEFT=$WAVE_DUR; ACT_STEP=1" > "$BEAR_ACT"
        else
            FRAME=4  # raise paw first
            SLAM_GROUPS=$(( RANDOM % 3 + 1 ))  # 1-3 groups
            SLAM_DUR=$(( SLAM_GROUPS * 2 ))    # each group = raise+slam
            echo "ACT_TYPE=slam; ACT_LEFT=$SLAM_DUR; ACT_STEP=1" > "$BEAR_ACT"
        fi
        ;;
      *) FRAME=1 ;;
    esac
else
    FRAME=0
    # Bear mouth twitch while idle (only when no combo active)
    if [ "$PET_ID" = "bear" ] && [ ! -f "$BEAR_ACT" ] && [ $(( RANDOM % 100 )) -lt 2 ]; then
        FRAME=7
    fi
fi

BLINK=0
if [ "$FRAME" -eq -1 ]; then
    # Animals with custom blink frames use frame 2 directly
    case "$PET_ID" in
      raven|owl|bear) FRAME=2; BLINK=0 ;;
      *) BLINK=1; FRAME=0 ;;
    esac
fi
# ─── Terminal width (macOS: find TTY from process tree, read real size) ─────
COLS=0
PID=$$
for _ in 1 2 3 4 5; do
    PID=$(ps -o ppid= -p "$PID" 2>/dev/null | tr -d ' ')
    [ -z "$PID" ] || [ "$PID" = "1" ] && break
    TTY=$(ps -o tty= -p "$PID" 2>/dev/null | tr -d ' ')
    if [ -n "$TTY" ] && [ "$TTY" != "??" ] && [ "$TTY" != "-" ]; then
        DEV="/dev/$TTY"
        [ -c "$DEV" ] && COLS=$(stty size < "$DEV" 2>/dev/null | awk '{print $2}')
        [ "${COLS:-0}" -gt 40 ] && break
    fi
done
[ "${COLS:-0}" -lt 40 ] && COLS=${COLUMNS:-0}
[ "${COLS:-0}" -lt 40 ] && COLS=80

# ─── Animal art: 3 frames × 4 lines, 12 display chars wide (matches art.ts) ──
# Synced from server/art.ts — skip first line (hat slot), use lines 2-5
case "$PET_ID" in
  raven)
    case $FRAME in
      0) L1="  <(✦)      "; L2="   (\\ \\_    "; L3="    \\\\//    "; L4="  --\" \"---  " ;;
      1) L1="  <(✦)      "; L2="   (\\\\ \\_   "; L3="    \\\\//    "; L4="  --\" \"---  " ;;
      2) L1="  <(✧)      "; L2="   (\\ \\_    "; L3="    \\\\//    "; L4="  --\" \"---  " ;;
      3) L1="   (✦)>     "; L2="   (\\ \\_    "; L3="    \\\\//    "; L4="  --\" \"---  " ;;
    esac ;;
  owl)
    case $FRAME in
      0) L1="            "; L2="    {◉,◉}   "; L3="    /)_)    "; L4="  ——\" \"——   " ;;
      1) L1="            "; L2="     {◉,◉}  "; L3="    /)_)    "; L4="  ——\" \"——   " ;;
      2) L1="            "; L2="    {-,-}   "; L3="    /)_)    "; L4="  ——\" \"——   " ;;
      3) L1="            "; L2="   {◉,◉}    "; L3="    /)_)    "; L4="  ——\" \"——   " ;;
    esac ;;
  bear)
    case $FRAME in
      0) L1=" c  .-.  C  "; L2="( ʘ  .  ʘ ) "; L3="(   ww    ) "; L4="  d|   |b   " ;;
      1) L1=" c  .-.  C  "; L2="( ʘ  .  ʘ ) "; L3="(d  ww    ) "; L4="   |   |b   " ;;
      2) L1=" c  .-.  C  "; L2="( -  .  - ) "; L3="(   ww    ) "; L4="  d|   |b   " ;;
      3) L1=" c  .-.  C  "; L2="( ʘ  .  ʘ ) "; L3="( d ww    ) "; L4="   |   |b   " ;;
      4) L1=" c  .-.  C  "; L2="( ◉  .  ◉ ) "; L3="( d|   |b  )"; L4=" ---------- " ;;
      5) L1=" c  .-.  C  "; L2="( ◉  .  ◉ ) "; L3="(   ww    ) "; L4="~d|~~~|b~~ " ;;
      7) L1=" c  .-.  C  "; L2="( ʘ  .  ʘ ) "; L3="(   VV    ) "; L4="  d|   |b   " ;;
    esac ;;
  fox)
    case $FRAME in
      0) L1="   /\\  /\\   "; L2="  ( o.o  )  "; L3="   > ^ <    "; L4="   /_\\~~~   " ;;
      1) L1="   /\\  /\\   "; L2="  ( o.o  )  "; L3="   > ^ <    "; L4="   /_\\~~>   " ;;
      2) L1="   /\\  /\\   "; L2="  ( -.o  )  "; L3="   > ^ <    "; L4="   /_\\~~~   " ;;
    esac ;;
  wolf)
    case $FRAME in
      0) L1="   /|  |\\   "; L2="  ( o  o )  "; L3="   ( VV )   "; L4="   /|  |\\   " ;;
      1) L1="   /|  |\\   "; L2="  ( o  o )  "; L3="   ( VV )   "; L4="  ~/|  |\\   " ;;
      2) L1="   /|  |\\   "; L2="  ( -  o )  "; L3="   ( VV )   "; L4="   /|  |\\   " ;;
    esac ;;
  deer)
    case $FRAME in
      0) L1="  }|/  \\|{  "; L2="   (\\__/)   "; L3="   (o  o)   "; L4="    (  )    " ;;
      1) L1="  }|/  \\|{  "; L2="   (\\__/)   "; L3="   (o  o)   "; L4="    (  )~   " ;;
      2) L1="  }|/  \\|{  "; L2="   (\\__/)   "; L3="   (-  o)   "; L4="    (  )    " ;;
    esac ;;
  labrador)
    case $FRAME in
      0) L1="   ___/ \\_  "; L2="  | o   \\   "; L3="  |     _>  "; L4="  |____|/   " ;;
      1) L1="   ___/ \\_  "; L2="  | o   \\   "; L3="  |     _>  "; L4=" ~|____|/   " ;;
      2) L1="   ___/ \\_  "; L2="  | -   \\   "; L3="  |     _>  "; L4="  |____|/   " ;;
    esac ;;
  dolphin)
    case $FRAME in
      0) L1="       ,    "; L2="  _.-~o)    "; L3=" /    /~~   "; L4=" \\___/      " ;;
      1) L1="       ,    "; L2="  _.-~o)    "; L3=" /    /~~   "; L4=" \\___/~     " ;;
      2) L1="       ,    "; L2="  _.-~-)    "; L3=" /    /~~   "; L4=" \\___/      " ;;
    esac ;;
  beaver)
    case $FRAME in
      0) L1="   (\\__/)   "; L2="   (o  o)   "; L3="   (>TT<)   "; L4="   [=====]  " ;;
      1) L1="   (\\__/)   "; L2="   (o  o)   "; L3="   (>TT<)   "; L4="  ~[=====]  " ;;
      2) L1="   (\\__/)   "; L2="   (-  o)   "; L3="   (>TT<)   "; L4="   [=====]  " ;;
    esac ;;
  elephant)
    case $FRAME in
      0) L1="   ___  __  "; L2="  /o   |  ) "; L3="  |   _/    "; L4="  |__|      " ;;
      1) L1="   ___  __  "; L2="  /o   |  ) "; L3="  |   _/    "; L4=" ~|__|      " ;;
      2) L1="   ___  __  "; L2="  /-   |  ) "; L3="  |   _/    "; L4="  |__|      " ;;
    esac ;;
  lion)
    case $FRAME in
      0) L1=" {*|____|*} "; L2="  ( o  o )  "; L3="  ( =w=  )  "; L4="   /|  |\\   " ;;
      1) L1=" {*|____|*} "; L2="  ( o  o )  "; L3="  ( =w=  )  "; L4="  ~/|  |\\   " ;;
      2) L1=" {*|____|*} "; L2="  ( -  o )  "; L3="  ( =w=  )  "; L4="   /|  |\\   " ;;
    esac ;;
  golden)
    case $FRAME in
      0) L1="   _/~\\~~   "; L2="  ( o  \\~~  "; L3="  |     O   "; L4="  \\__(__)   " ;;
      1) L1="   _/~\\~~   "; L2="  ( o  \\~~  "; L3="  |     O   "; L4=" ~\\__(__)   " ;;
      2) L1="   _/~\\~~   "; L2="  ( -  \\~~  "; L3="  |     O   "; L4="  \\__(__)   " ;;
    esac ;;
  cat)
    case $FRAME in
      0) L1="   /\\_/\\    "; L2="  ( o.o )   "; L3="   > ^ <    "; L4="  /|   |\\   " ;;
      1) L1="   /\\_/\\    "; L2="  ( o.o )   "; L3="   > ^ <    "; L4="  /|   |\\~  " ;;
      2) L1="   /\\_/\\    "; L2="  ( -.o )   "; L3="   > ^ <    "; L4="  /|   |\\   " ;;
    esac ;;
  panda)
    case $FRAME in
      0) L1="  (\\__/)    "; L2="  (@  @)    "; L3="  ( ww )    "; L4="  /|  |\\    " ;;
      1) L1="  (\\__/)    "; L2="  (@  @)    "; L3="  ( ww )    "; L4=" ~/|  |\\    " ;;
      2) L1="  (\\__/)    "; L2="  (#  @)    "; L3="  ( ww )    "; L4="  /|  |\\    " ;;
    esac ;;
  cheetah)
    case $FRAME in
      0) L1="   /\\_/\\  ~ "; L2="  (o . o)   "; L3="   >.v.<    "; L4="  /|'.|\\    " ;;
      1) L1="   /\\_/\\  ~ "; L2="  (o . o)   "; L3="   >.v.<    "; L4="  /|'.|\\~   " ;;
      2) L1="   /\\_/\\  ~ "; L2="  (- . o)   "; L3="   >.v.<    "; L4="  /|'.|\\    " ;;
    esac ;;
  parrot)
    case $FRAME in
      0) L1="    ,__     "; L2="  >(o  )    "; L3="   \\\\__/    "; L4="    |||     " ;;
      1) L1="    ,__     "; L2="  >(o  )    "; L3="   \\\\__/    "; L4="    |||~    " ;;
      2) L1="    ,__     "; L2="  >(-  )    "; L3="   \\\\__/    "; L4="    |||     " ;;
    esac ;;
  *)
    L1="    (?)     "; L2="            "; L3="            "; L4="            " ;;
esac

# ─── Blink: replace eyes (o and @) in L1-L3, skip L4 (feet/body) ────────────
if [ "$BLINK" -eq 1 ]; then
    L1="${L1//o/-}"; L2="${L2//o/-}"; L3="${L3//o/-}"
    L2="${L2//@/-}"  # labrador uses @ as eye
fi

# ─── Build all art lines (skip empty lines) ─────────────────────────────────
DIM=$'\033[3m'  # italic only (no dim, easier to read)
ALL_LINES=()
ALL_COLORS=()
for _l in "$L1" "$L2" "$L3" "$L4"; do
    if [ -n "$(echo "$_l" | tr -d ' ')" ]; then
        ALL_LINES+=("$_l")
        ALL_COLORS+=("$C")
    fi
done
# Name line
NAME_LEN=${#NAME}
ART_CENTER=4
NAME_PAD=$(( ART_CENTER - NAME_LEN / 2 ))
[ "$NAME_PAD" -lt 0 ] && NAME_PAD=0
NAME_LINE="$(printf '%*s%s' "$NAME_PAD" '' "$NAME")"
ALL_LINES+=("$NAME_LINE")
ALL_COLORS+=("$DIM")

ART_W=12
ART_COUNT=${#ALL_LINES[@]}

# ─── Speech bubble (read pre-wrapped lines from reaction file) ───────────────
# CJK display width (for box padding)
dw() {
  local c=${#1}
  local b=$(printf '%s' "$1" | LC_ALL=C wc -c | tr -d ' ')
  echo $(( c + (b - c) / 2 ))
}

TEXT_LINES=()
if [ -n "$R_TEXT" ] && [ "${AGE:-999999}" -lt 10000 ] && [ -f "$REACTION_FILE" ]; then
    # Read pre-wrapped lines from hook (CJK-aware wrap done by python3 in hook)
    while IFS= read -r line; do
        [ -n "$line" ] && TEXT_LINES+=("$line")
    done < <(jq -r '.wrapped[]? // empty' "$REACTION_FILE" 2>/dev/null)
    # Read precise max display width from hook
    MAX_DW=$(jq -r '.maxWidth // 0' "$REACTION_FILE" 2>/dev/null)
    # Fallback: if no wrapped field, use raw text as single line
    if [ ${#TEXT_LINES[@]} -eq 0 ] && [ -n "$R_TEXT" ]; then
        TEXT_LINES+=("$R_TEXT")
        MAX_DW=0
    fi
fi
TEXT_COUNT=${#TEXT_LINES[@]}

# Use precise width from python3, or fallback to 28
if [ "${MAX_DW:-0}" -gt 0 ]; then
    INNER_W=$(( MAX_DW + 2 ))  # +2 for left/right padding inside box
else
    INNER_W=28
fi

# Build box
BOX_W=$(( INNER_W + 4 ))
BUBBLE_LINES=()
BUBBLE_TYPES=()
if [ $TEXT_COUNT -gt 0 ]; then
    BORDER=$(printf '%*s' "$(( BOX_W - 2 ))" '' | tr ' ' '-')
    BUBBLE_LINES+=(".${BORDER}.")
    BUBBLE_TYPES+=("border")
    # Read per-line widths from reaction file (precise from python3)
    LINE_WIDTHS=()
    if [ -f "$REACTION_FILE" ]; then
        while IFS= read -r w; do
            LINE_WIDTHS+=("$w")
        done < <(jq -r '.widths[]? // empty' "$REACTION_FILE" 2>/dev/null)
    fi

    for idx in "${!TEXT_LINES[@]}"; do
        tl="${TEXT_LINES[$idx]}"
        # Use precise width if available, fallback to dw()
        if [ "$idx" -lt "${#LINE_WIDTHS[@]}" ] && [ -n "${LINE_WIDTHS[$idx]}" ]; then
            TL_DW=${LINE_WIDTHS[$idx]}
        else
            TL_DW=$(dw "$tl")
        fi
        tpad=$(( INNER_W - TL_DW ))
        [ "$tpad" -lt 0 ] && tpad=0
        padding=$(printf '%*s' "$tpad" '')
        BUBBLE_LINES+=("| ${tl}${padding} |")
        BUBBLE_TYPES+=("text")
    done
    BUBBLE_LINES+=("\`${BORDER}'")
    BUBBLE_TYPES+=("border")
fi
BUBBLE_COUNT=${#BUBBLE_LINES[@]}

# ─── Right-align with bubble box to the left ────────────────────────────────
GAP=2
if [ $BUBBLE_COUNT -gt 0 ]; then
    TOTAL_W=$(( BOX_W + GAP + ART_W ))
else
    TOTAL_W=$ART_W
fi
MARGIN=8
PAD=$(( COLS - TOTAL_W - MARGIN ))
[ "$PAD" -lt 0 ] && PAD=0

SPACER=$(printf "${B}%${PAD}s" "")
GAP_STR=$(printf '%*s' "$GAP" '')

# Bubble starts from top (no vertical centering)
BUBBLE_START=0

# Connector line
CONNECTOR_BI=-1
if [ $BUBBLE_COUNT -gt 2 ]; then
    FIRST_TEXT=1
    LAST_TEXT=$(( BUBBLE_COUNT - 2 ))
    CONNECTOR_BI=$(( (FIRST_TEXT + LAST_TEXT) / 2 ))
fi

# ─── Output: total lines = max(art, bubble) ─────────────────────────────────
TOTAL_LINES=$ART_COUNT
[ $BUBBLE_COUNT -gt $((BUBBLE_START + ART_COUNT)) ] && TOTAL_LINES=$(( BUBBLE_START + BUBBLE_COUNT ))

ART_EMPTY=$(printf '%*s' "${#ALL_LINES[0]}" '')

for (( i=0; i<TOTAL_LINES; i++ )); do
    # Art part (or empty if beyond art lines)
    if [ $i -lt $ART_COUNT ]; then
        art_part="${ALL_COLORS[$i]}${ALL_LINES[$i]}${NC}"
    else
        art_part="$ART_EMPTY"
    fi

    if [ $BUBBLE_COUNT -gt 0 ]; then
        bi=$(( i - BUBBLE_START ))
        if [ $bi -ge 0 ] && [ $bi -lt $BUBBLE_COUNT ]; then
            bline="${BUBBLE_LINES[$bi]}"
            btype="${BUBBLE_TYPES[$bi]}"

            if [ $bi -eq $CONNECTOR_BI ]; then
                gap="${C}--${NC} "
            else
                gap="   "
            fi

            if [ "$btype" = "border" ]; then
                echo "${SPACER}${C}${bline}${NC}${gap}${art_part}"
            else
                pipe_l="${bline:0:1}"
                pipe_r="${bline: -1}"
                inner="${bline:1:$(( ${#bline} - 2 ))}"
                echo "${SPACER}${C}${pipe_l}${NC}${DIM}${inner}${NC}${C}${pipe_r}${NC}${gap}${art_part}"
            fi
        else
            empty=$(printf '%*s' "$BOX_W" '')
            echo "${SPACER}${empty}   ${art_part}"
        fi
    else
        echo "${SPACER}${art_part}"
    fi
done

exit 0
