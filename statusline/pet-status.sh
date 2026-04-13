#!/usr/bin/env bash
# mbti-pet status line — animated, right-aligned multi-line companion
#
# Animation: sequence [0,0,0,0,1,0,0,0,-1,0,0,2,0,0,0] with 500ms ticks
#   - Frame -1 = blink (eyes replaced with "-")
#   - Frames 0,1,2 = the 3 idle art variants per animal
#   - refreshInterval: 1s in settings.json cycles the animation
#
# Uses Braille Blank (U+2800) for padding — survives JS .trim()

STATE="$HOME/.petsonality/status.json"
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
REACTION_FILE="$HOME/.petsonality/reaction.$SID.json"
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

# <<< GENERATED: COLORS >>>
case "$PET_ID" in
  raven)     C=$'\033[38;2;140;100;180m' ;;
  owl)       C=$'\033[38;2;160;120;60m' ;;
  bear)      C=$'\033[38;2;120;72;40m' ;;
  fox)       C=$'\033[38;2;215;120;40m' ;;
  wolf)      C=$'\033[38;2;140;140;150m' ;;
  deer)      C=$'\033[38;2;190;150;90m' ;;
  labrador)  C=$'\033[38;2;210;175;80m' ;;
  dolphin)   C=$'\033[38;2;160;165;170m' ;;
  beaver)    C=$'\033[38;2;140;90;50m' ;;
  elephant)  C=$'\033[38;2;150;155;160m' ;;
  lion)      C=$'\033[38;2;210;170;70m' ;;
  golden)    C=$'\033[38;2;220;185;90m' ;;
  cat)       C=$'\033[38;2;230;160;50m' ;;
  panda)     C=$'\033[38;2;220;220;215m' ;;
  cheetah)   C=$'\033[38;2;210;180;100m' ;;
  parrot)    C=$'\033[38;2;50;180;80m' ;;
  *)         C=$'\033[0m' ;;
esac
# <<< END GENERATED: COLORS >>>

# <<< GENERATED: BUBBLE COLORS >>>
BC="$C"  # default: same as pet
case "$PET_ID" in
  dolphin) BC=$'\033[38;2;70;130;200m' ;;  # blue sea bubble
esac
# <<< END GENERATED: BUBBLE COLORS >>>

B=$'\xe2\xa0\x80'  # Braille Blank U+2800

# ─── Animation: per-animal randomized ────────────────────────────────────────
# Each animal has: idle%, move%, blink% (out of 100)
# Evaluated each refresh (1s). $RANDOM gives different value each call.
NOW=$(date +%s)

IDLE_PCT=75; MOVE_PCT=15; BLINK_PCT=10  # defaults

case "$PET_ID" in
  owl)      IDLE_PCT=80; MOVE_PCT=15; BLINK_PCT=5  ;;  # rarely blinks, sometimes shifts
  cat)      IDLE_PCT=88; MOVE_PCT=7;  BLINK_PCT=5  ;;  # lazy, aloof ISTP
  raven)    IDLE_PCT=60; MOVE_PCT=33; BLINK_PCT=7  ;;  # alert, head always turning
  bear)     IDLE_PCT=94; MOVE_PCT=3;  BLINK_PCT=3  ;;  # calm, rare but slow actions
  parrot)   IDLE_PCT=50; MOVE_PCT=30; BLINK_PCT=20 ;;  # hyper
  dolphin)  IDLE_PCT=55; MOVE_PCT=30; BLINK_PCT=15 ;;  # playful
  fox)      IDLE_PCT=65; MOVE_PCT=25; BLINK_PCT=10 ;;  # alert
  panda)    IDLE_PCT=88; MOVE_PCT=7;  BLINK_PCT=5  ;;  # slow, aesthetic ISFP
  cheetah)  IDLE_PCT=60; MOVE_PCT=28; BLINK_PCT=12 ;;  # twitchy
  wolf)     IDLE_PCT=97; MOVE_PCT=3;  BLINK_PCT=0  ;;  # very calm, rare actions
  deer)     IDLE_PCT=92; MOVE_PCT=5;  BLINK_PCT=3  ;;  # gentle, occasional dreamy actions
  labrador) IDLE_PCT=90; MOVE_PCT=6;  BLINK_PCT=4  ;;  # warm, gentle actions
  beaver)   IDLE_PCT=90; MOVE_PCT=7;  BLINK_PCT=3  ;;  # steady, purposeful ISTJ
  elephant) IDLE_PCT=92; MOVE_PCT=5;  BLINK_PCT=3  ;;  # slow, gentle ISFJ
  lion)     IDLE_PCT=80; MOVE_PCT=15; BLINK_PCT=5  ;;  # active, commanding ESTJ
  golden)   IDLE_PCT=70; MOVE_PCT=22; BLINK_PCT=8  ;;  # hyper, affectionate ESFJ
esac

ROLL=$(( RANDOM % 1000 ))  # per-mille: values designed for 1fps work at ~10fps
SKIP_ART=0

# Dolphin: continuous swim cycle (bypasses normal idle/move logic)
if [ "$PET_ID" = "dolphin" ]; then
    SKIP_ART=1
    SEA=$'\033[38;2;70;130;200m'
    GRY=$'\033[38;2;160;165;170m'  # dolphin body grey
    _DF="$HOME/.petsonality/.dolph_step"
    _E="${B}           "
    # Check if bubble is active — freeze cycle if so
    _BUBBLE_ON=0
    if [ -f "$REACTION_FILE" ]; then
        _BTS=$(jq -r '.timestamp // 0' "$REACTION_FILE" 2>/dev/null)
        _BAGE=$(( $(date +%s) * 1000 - ${_BTS%.*} ))
        [ "$_BAGE" -lt 10000 ] && _BUBBLE_ON=1
    fi
    # Check if cycle is active
    if [ -f "$_DF" ]; then
        _DS=$(cat "$_DF" 2>/dev/null | tr -dc '0-9')
        _DS=${_DS:-0}
    else
        _DS=-1
    fi
    # Freeze to idle when bubble is showing
    if [ "$_BUBBLE_ON" -eq 1 ] && [ "$_DS" -ge 0 ]; then
        rm -f "$_DF"
        _DS=-1
    fi
    # When bubble active: plain art without ANSI (saves bytes for statusline limit)
    if [ "$_BUBBLE_ON" -eq 1 ]; then
        L1="  _.-~ʘ)    "; L2=" <(   ^ /   "
        L3="  \\_.  /${SEA}~~~ "; L4="${SEA}   ~~~      "
    elif [ "$_DS" -ge 0 ]; then
        # Cycle is running
        # Flowing sea for cycle (timestamp-based)
        _CW=$(( $(date +%s) % 5 ))
        case $_CW in
            0) _S3="${SEA}~~~   ~~~   "; _S4="${SEA} ~~~   ~~~  " ;;
            1) _S3="${SEA}~~   ~~~    "; _S4="${SEA}~~~   ~~~   " ;;
            2) _S3="${SEA}~   ~~~   ~ "; _S4="${SEA}~~   ~~~  ~ " ;;
            3) _S3="${SEA}   ~~~   ~~ "; _S4="${SEA}~   ~~~  ~~ " ;;
            4) _S3="${SEA}  ~~~   ~~~ "; _S4="${SEA}   ~~~  ~~~ " ;;
        esac
        case $_DS in
            # Shift right 3 — sea blue, then dolphin grey
            0|1) L1="     _.-~ʘ) "; L2="    <(   ^ /"
                 L3="${SEA}~~ ${C}\\_.  /  "; L4="$_S4" ;;
            # Shift right 7
            2|3) L1="        _.- "; L2="       <(   "
                 L3="${SEA}~~  ~~ ${C}\\_.  "; L4="$_S4" ;;
            # Shift right 10
            4|5) L1="           _"; L2="          <("
                 L3="${SEA}~~~  ~~~  ${C}\\\\"; L4="$_S4" ;;
            # Sea only (stay longer)
            6|7|8|9|10|11) L1="$_E"; L2="$_E"
                   L3="$_S3"; L4="$_S4" ;;
            # Head emerges
            12|13) L1="$_E"; L2="  _.-~ʘ)    "
                   L3="$_S3"; L4="$_S4" ;;
            # Half body
            14|15) L1="  _.-~ʘ)    "; L2=" <(   ^ /   "
                   L3="$_S3"; L4="$_S4" ;;
            # Full body rising → cycle done
            16|17) L1="  _.-~ʘ)    "; L2=" <(   ^ /   "
                   L3="  \\_.  /${SEA}~~~ "; L4="${SEA}   ~~~      " ;;
            # Tail splash (triggered from idle)
            20|21|22) L1="  _.-~ʘ)    "; L2=" <(   ^ /   "
                   L3="  \\_.  /    "; L4="${SEA}    \\   ~~* " ;;
            # Blow spout (triggered from idle)
            30|31|32) L1="  _.-~ʘ) ${SEA}*${C}  "; L2=" <(   ^ / ${SEA}*${C} "
                   L3="  \\_.  /${SEA}~~~  "; L4="${SEA}~~~    ~~~  " ;;
        esac
        _DS=$(( _DS + 1 ))
        # End conditions for different action types
        if [ $_DS -ge 18 ] && [ $_DS -lt 20 ]; then
            rm -f "$_DF"
        elif [ $_DS -ge 23 ] && [ $_DS -lt 30 ]; then
            rm -f "$_DF"
        elif [ $_DS -ge 33 ]; then
            rm -f "$_DF"
        else
            echo "$_DS" > "$_DF"
        fi
    else
        # Idle: default position with variations
        _DI=$(( RANDOM % 1000 ))
        if [ $_DI -lt 10 ]; then
            # ~1%/s tail splash (lasts 3s via state file)
            echo "20" > "$_DF"  # 20=splash, 21, 22 then done
            L1="  _.-~ʘ)    "; L2=" <(   ^ /   "
            L3="  \\_.  /    "; L4="${SEA}    \\   ~~* "
        elif [ $_DI -lt 20 ]; then
            # ~1%/s blow spout (lasts 3s via state file)
            echo "30" > "$_DF"  # 30=spout, 31, 32 then done
            L1="  _.-~ʘ) ${SEA}*${C}  "; L2=" <(   ^ / ${SEA}*${C} "
            _WT=$(( $(date +%s) % 8 ))
            case $_WT in
                0) L3="  ${C}\\_.  / ${SEA}~~~ "; L4="${SEA} ~~~    ~~~ " ;;
                *) L3="  ${C}\\_.  /${SEA}~~~  "; L4="${SEA}~~~    ~~~  " ;;
            esac
        elif [ $_DI -lt 40 ]; then
            # ~2%/s chance to trigger swim cycle
            echo "0" > "$_DF"
            L1="     _.-~ʘ) "; L2="    <(   ^ /"
            L3="${SEA}~~ ${C} \\_.  / "; L4="${SEA}~~~~~~~~~~  "
        elif [ $_DI -lt 50 ]; then
            # ~1%/s Blink
            L1="  _.-~-)    "; L2=" <(   ^ /   "
            _WT=$(( $(date +%s) % 6 ))
            case $_WT in
                0) L3="  \\_.  /${SEA}~~~~"; L4="${SEA} ~~~~~      " ;;
                1) L3="  \\_.  /${SEA}~~~ "; L4="${SEA}~~~~~       " ;;
                *) L3="  \\_.  /${SEA}~~~ "; L4="${SEA}~~~~        " ;;
            esac
        else
            # Normal idle: waves flow right-to-left past dolphin
            L1="  _.-~ʘ)    "; L2=" <(   ^ /   "
            _WT=$(( $(date +%s) % 8 ))
            case $_WT in
                0) L3="  \\_.  / ${SEA}~~~ "; L4="${SEA} ~~~    ~~~ " ;;
                1) L3="  \\_.  /${SEA}~~~  "; L4="${SEA}~~~    ~~~  " ;;
                2) L3="  \\_.  /${SEA}~~   "; L4="${SEA}~~    ~~~   " ;;
                3) L3="  \\_.  /${SEA}~    "; L4="${SEA}~    ~~~    " ;;
                4) L3="  \\_.  /     "; L4="${SEA}    ~~~   ~~" ;;
                5) L3="  \\_.  /     "; L4="${SEA}   ~~~   ~~ " ;;
                6) L3="  \\_.  /     "; L4="${SEA}  ~~~   ~~  " ;;
                7) L3="  \\_.  /  ${SEA}~~ "; L4="${SEA} ~~~   ~~~  " ;;
            esac
        fi
    fi
elif
# Labrador action: check if mid-action
LAB_ACT="$HOME/.petsonality/.lab_act"; [ "$PET_ID" = "labrador" ] && [ -f "$LAB_ACT" ]; then
    _ACT_RAW=$(cat "$LAB_ACT" 2>/dev/null)
    if echo "$_ACT_RAW" | grep -qE '^ACT_TYPE=(nuzzle|yawn|pant|liedown); ACT_LEFT=[0-9]+$'; then
        eval "$_ACT_RAW"
    else
        rm -f "$LAB_ACT"
    fi
    if [ "${ACT_LEFT:-0}" -gt 0 ]; then
        case "$ACT_TYPE" in
          nuzzle)  FRAME=3 ;;
          yawn)    FRAME=4 ;;
          pant)    FRAME=5 ;;
          liedown)
            # While lying down: 80% normal, 10% blink, 10% tail wag
            _LI=$(( RANDOM % 100 ))
            if [ $_LI -lt 10 ]; then FRAME=7
            elif [ $_LI -lt 20 ]; then FRAME=8
            else FRAME=6
            fi ;;
        esac
        NEW_LEFT=$(( ACT_LEFT - 1 ))
        if [ $NEW_LEFT -le 0 ]; then
            rm -f "$LAB_ACT"
        else
            echo "ACT_TYPE=$ACT_TYPE; ACT_LEFT=$NEW_LEFT" > "$LAB_ACT"
        fi
    else
        rm -f "$LAB_ACT"
        FRAME=0
    fi
elif
# Deer action: check if mid-action
DEER_ACT="$HOME/.petsonality/.deer_act"; [ "$PET_ID" = "deer" ] && [ -f "$DEER_ACT" ]; then
    _ACT_RAW=$(cat "$DEER_ACT" 2>/dev/null)
    if echo "$_ACT_RAW" | grep -qE '^ACT_TYPE=(graze|tilt|gaze|nuzzle); ACT_LEFT=[0-9]+$'; then
        eval "$_ACT_RAW"
    else
        rm -f "$DEER_ACT"
    fi
    if [ "${ACT_LEFT:-0}" -gt 0 ]; then
        case "$ACT_TYPE" in
          graze)   FRAME=3 ;;
          tilt)    FRAME=4 ;;
          gaze)    FRAME=5 ;;
          nuzzle)  FRAME=6 ;;
        esac
        NEW_LEFT=$(( ACT_LEFT - 1 ))
        if [ $NEW_LEFT -le 0 ]; then
            rm -f "$DEER_ACT"
        else
            echo "ACT_TYPE=$ACT_TYPE; ACT_LEFT=$NEW_LEFT" > "$DEER_ACT"
        fi
    else
        rm -f "$DEER_ACT"
        FRAME=0
    fi
elif
# Wolf action: check if mid-action
WOLF_ACT="$HOME/.petsonality/.wolf_act"; [ "$PET_ID" = "wolf" ] && [ -f "$WOLF_ACT" ]; then
    _ACT_RAW=$(cat "$WOLF_ACT" 2>/dev/null)
    if echo "$_ACT_RAW" | grep -qE '^ACT_TYPE=(walk|howl|alert|stretch|sniff); ACT_LEFT=[0-9]+$'; then
        eval "$_ACT_RAW"
    else
        rm -f "$WOLF_ACT"
    fi
    if [ "${ACT_LEFT:-0}" -gt 0 ]; then
        case "$ACT_TYPE" in
          walk)    FRAME=3 ;;
          howl)    FRAME=4 ;;
          alert)   FRAME=5 ;;
          stretch) FRAME=6 ;;
          sniff)   FRAME=7 ;;
        esac
        NEW_LEFT=$(( ACT_LEFT - 1 ))
        if [ $NEW_LEFT -le 0 ]; then
            rm -f "$WOLF_ACT"
        else
            echo "ACT_TYPE=$ACT_TYPE; ACT_LEFT=$NEW_LEFT" > "$WOLF_ACT"
        fi
    else
        rm -f "$WOLF_ACT"
        FRAME=0
    fi
elif
# Bear combo: check if mid-action (slam or wave)
BEAR_ACT="$HOME/.petsonality/.bear_act"
[ "$PET_ID" = "bear" ] && [ -f "$BEAR_ACT" ]; then
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
            if [ $(( (ACT_STEP / 5) % 2 )) -eq 0 ]; then FRAME=4; else FRAME=5; fi ;;
          wave)
            if [ $(( (ACT_STEP / 5) % 2 )) -eq 0 ]; then FRAME=1; else FRAME=3; fi ;;
          cooldown)
            FRAME=0 ;;  # forced idle after combo
        esac
        NEW_LEFT=$(( ACT_LEFT - 1 ))
        NEW_STEP=$(( ACT_STEP + 1 ))
        if [ $NEW_LEFT -le 0 ]; then
            if [ "$ACT_TYPE" = "cooldown" ]; then
                rm -f "$BEAR_ACT"  # cooldown done, back to normal
            else
                # Combo done → cooldown for 3 seconds
                echo "ACT_TYPE=cooldown; ACT_LEFT=30; ACT_STEP=0" > "$BEAR_ACT"
            fi
        else
            echo "ACT_TYPE=$ACT_TYPE; ACT_LEFT=$NEW_LEFT; ACT_STEP=$NEW_STEP" > "$BEAR_ACT"
        fi
    else
        rm -f "$BEAR_ACT"
        FRAME=0
    fi
elif
# Beaver action: check if mid-action
BEAVER_ACT="$HOME/.petsonality/.beaver_act"; [ "$PET_ID" = "beaver" ] && [ -f "$BEAVER_ACT" ]; then
    _ACT_RAW=$(cat "$BEAVER_ACT" 2>/dev/null)
    if echo "$_ACT_RAW" | grep -qE '^ACT_TYPE=(gnaw|slap|inspect|sigh); ACT_LEFT=[0-9]+; ACT_STEP=[0-9]+$'; then
        eval "$_ACT_RAW"
    else
        rm -f "$BEAVER_ACT"
    fi
    ACT_STEP=${ACT_STEP:-0}
    if [ "${ACT_LEFT:-0}" -gt 0 ]; then
        case "$ACT_TYPE" in
          gnaw)
            if [ $(( (ACT_STEP / 5) % 2 )) -eq 0 ]; then FRAME=3; else FRAME=7; fi ;;
          slap)    FRAME=4 ;;
          inspect)
            if [ $(( (ACT_STEP / 5) % 2 )) -eq 0 ]; then FRAME=5; else FRAME=8; fi ;;
          sigh)    FRAME=6 ;;
        esac
        NEW_LEFT=$(( ACT_LEFT - 1 ))
        NEW_STEP=$(( ACT_STEP + 1 ))
        if [ $NEW_LEFT -le 0 ]; then
            rm -f "$BEAVER_ACT"
        else
            echo "ACT_TYPE=$ACT_TYPE; ACT_LEFT=$NEW_LEFT; ACT_STEP=$NEW_STEP" > "$BEAVER_ACT"
        fi
    else
        rm -f "$BEAVER_ACT"
        FRAME=0
    fi
elif
# Elephant action: check if mid-action
ELEPH_ACT="$HOME/.petsonality/.eleph_act"; [ "$PET_ID" = "elephant" ] && [ -f "$ELEPH_ACT" ]; then
    _ACT_RAW=$(cat "$ELEPH_ACT" 2>/dev/null)
    if echo "$_ACT_RAW" | grep -qE '^ACT_TYPE=(stomp|trunk|listen|nod); ACT_LEFT=[0-9]+; ACT_STEP=[0-9]+$'; then
        eval "$_ACT_RAW"
    else
        rm -f "$ELEPH_ACT"
    fi
    ACT_STEP=${ACT_STEP:-0}
    if [ "${ACT_LEFT:-0}" -gt 0 ]; then
        case "$ACT_TYPE" in
          stomp)
            if [ $(( (ACT_STEP / 5) % 2 )) -eq 0 ]; then FRAME=3; else FRAME=4; fi ;;
          trunk)   FRAME=5 ;;
          listen)  FRAME=6 ;;
          nod)     FRAME=7 ;;
        esac
        NEW_LEFT=$(( ACT_LEFT - 1 ))
        NEW_STEP=$(( ACT_STEP + 1 ))
        if [ $NEW_LEFT -le 0 ]; then
            rm -f "$ELEPH_ACT"
        else
            echo "ACT_TYPE=$ACT_TYPE; ACT_LEFT=$NEW_LEFT; ACT_STEP=$NEW_STEP" > "$ELEPH_ACT"
        fi
    else
        rm -f "$ELEPH_ACT"
        FRAME=0
    fi
elif
# Lion action: check if mid-action
LION_ACT="$HOME/.petsonality/.lion_act"; [ "$PET_ID" = "lion" ] && [ -f "$LION_ACT" ]; then
    _ACT_RAW=$(cat "$LION_ACT" 2>/dev/null)
    if echo "$_ACT_RAW" | grep -qE '^ACT_TYPE=(roar|shake|glare|yawn); ACT_LEFT=[0-9]+; ACT_STEP=[0-9]+$'; then
        eval "$_ACT_RAW"
    else
        rm -f "$LION_ACT"
    fi
    ACT_STEP=${ACT_STEP:-0}
    if [ "${ACT_LEFT:-0}" -gt 0 ]; then
        case "$ACT_TYPE" in
          roar)    FRAME=3 ;;
          shake)
            if [ $(( (ACT_STEP / 5) % 2 )) -eq 0 ]; then FRAME=4; else FRAME=5; fi ;;
          glare)   FRAME=6 ;;
          yawn)    FRAME=7 ;;
        esac
        NEW_LEFT=$(( ACT_LEFT - 1 ))
        NEW_STEP=$(( ACT_STEP + 1 ))
        if [ $NEW_LEFT -le 0 ]; then
            rm -f "$LION_ACT"
        else
            echo "ACT_TYPE=$ACT_TYPE; ACT_LEFT=$NEW_LEFT; ACT_STEP=$NEW_STEP" > "$LION_ACT"
        fi
    else
        rm -f "$LION_ACT"
        FRAME=0
    fi
elif
# Golden action: check if mid-action
GOLD_ACT="$HOME/.petsonality/.gold_act"; [ "$PET_ID" = "golden" ] && [ -f "$GOLD_ACT" ]; then
    _ACT_RAW=$(cat "$GOLD_ACT" 2>/dev/null)
    if echo "$_ACT_RAW" | grep -qE '^ACT_TYPE=(wag|jump|lick|spin); ACT_LEFT=[0-9]+; ACT_STEP=[0-9]+$'; then
        eval "$_ACT_RAW"
    else
        rm -f "$GOLD_ACT"
    fi
    ACT_STEP=${ACT_STEP:-0}
    if [ "${ACT_LEFT:-0}" -gt 0 ]; then
        case "$ACT_TYPE" in
          wag)
            if [ $(( (ACT_STEP / 5) % 2 )) -eq 0 ]; then FRAME=3; else FRAME=1; fi ;;
          jump)    FRAME=4 ;;
          lick)
            if [ $(( (ACT_STEP / 5) % 2 )) -eq 0 ]; then FRAME=5; else FRAME=7; fi ;;
          spin)
            if [ $(( (ACT_STEP / 5) % 2 )) -eq 0 ]; then FRAME=6; else FRAME=0; fi ;;
        esac
        NEW_LEFT=$(( ACT_LEFT - 1 ))
        NEW_STEP=$(( ACT_STEP + 1 ))
        if [ $NEW_LEFT -le 0 ]; then
            rm -f "$GOLD_ACT"
        else
            echo "ACT_TYPE=$ACT_TYPE; ACT_LEFT=$NEW_LEFT; ACT_STEP=$NEW_STEP" > "$GOLD_ACT"
        fi
    else
        rm -f "$GOLD_ACT"
        FRAME=0
    fi
elif
# Cat action: check if mid-action
CAT_ACT="$HOME/.petsonality/.cat_act"; [ "$PET_ID" = "cat" ] && [ -f "$CAT_ACT" ]; then
    _ACT_RAW=$(cat "$CAT_ACT" 2>/dev/null)
    if echo "$_ACT_RAW" | grep -qE '^ACT_TYPE=(stare|lick|stretch); ACT_LEFT=[0-9]+; ACT_STEP=[0-9]+$'; then
        eval "$_ACT_RAW"
    else
        rm -f "$CAT_ACT"
    fi
    ACT_STEP=${ACT_STEP:-0}
    if [ "${ACT_LEFT:-0}" -gt 0 ]; then
        case "$ACT_TYPE" in
          stare)   FRAME=3 ;;
          lick)    FRAME=4 ;;
          stretch) FRAME=5 ;;
        esac
        NEW_LEFT=$(( ACT_LEFT - 1 ))
        NEW_STEP=$(( ACT_STEP + 1 ))
        if [ $NEW_LEFT -le 0 ]; then
            rm -f "$CAT_ACT"
        else
            echo "ACT_TYPE=$ACT_TYPE; ACT_LEFT=$NEW_LEFT; ACT_STEP=$NEW_STEP" > "$CAT_ACT"
        fi
    else
        rm -f "$CAT_ACT"
        FRAME=0
    fi
elif
# Panda action: check if mid-action (eating bamboo)
PANDA_ACT="$HOME/.petsonality/.panda_act"; [ "$PET_ID" = "panda" ] && [ -f "$PANDA_ACT" ]; then
    _ACT_RAW=$(cat "$PANDA_ACT" 2>/dev/null)
    if echo "$_ACT_RAW" | grep -qE '^ACT_TYPE=(eat|roll|stare|frown); ACT_LEFT=[0-9]+; ACT_STEP=[0-9]+$'; then
        eval "$_ACT_RAW"
    else
        rm -f "$PANDA_ACT"
    fi
    ACT_STEP=${ACT_STEP:-0}
    if [ "${ACT_LEFT:-0}" -gt 0 ]; then
        case "$ACT_TYPE" in
          eat)
            _ES=$(( ACT_STEP / 10 ))
            case "$_ES" in
              0) FRAME=3 ;; 1) FRAME=4 ;; 2) FRAME=5 ;; 3) FRAME=6 ;; 4) FRAME=7 ;;
              *) FRAME=0 ;;
            esac ;;
          roll)   FRAME=8 ;;
          stare)  FRAME=9 ;;
          frown)  FRAME=10 ;;
        esac
        NEW_LEFT=$(( ACT_LEFT - 1 ))
        NEW_STEP=$(( ACT_STEP + 1 ))
        if [ $NEW_LEFT -le 0 ]; then
            rm -f "$PANDA_ACT"
        else
            echo "ACT_TYPE=eat; ACT_LEFT=$NEW_LEFT; ACT_STEP=$NEW_STEP" > "$PANDA_ACT"
        fi
    else
        rm -f "$PANDA_ACT"
        FRAME=0
    fi
elif
# Cheetah action: check if mid-action
CHEETAH_ACT="$HOME/.petsonality/.cheetah_act"; [ "$PET_ID" = "cheetah" ] && [ -f "$CHEETAH_ACT" ]; then
    _ACT_RAW=$(cat "$CHEETAH_ACT" 2>/dev/null)
    if echo "$_ACT_RAW" | grep -qE '^ACT_TYPE=(sprint|pounce|twitch|yawn); ACT_LEFT=[0-9]+; ACT_STEP=[0-9]+$'; then
        eval "$_ACT_RAW"
    else
        rm -f "$CHEETAH_ACT"
    fi
    ACT_STEP=${ACT_STEP:-0}
    if [ "${ACT_LEFT:-0}" -gt 0 ]; then
        case "$ACT_TYPE" in
          sprint)
            if [ $(( (ACT_STEP / 5) % 2 )) -eq 0 ]; then FRAME=3; else FRAME=4; fi ;;
          pounce)  FRAME=5 ;;
          twitch)
            if [ $(( (ACT_STEP / 5) % 2 )) -eq 0 ]; then FRAME=6; else FRAME=7; fi ;;
          yawn)    FRAME=8 ;;
        esac
        NEW_LEFT=$(( ACT_LEFT - 1 ))
        NEW_STEP=$(( ACT_STEP + 1 ))
        if [ $NEW_LEFT -le 0 ]; then
            rm -f "$CHEETAH_ACT"
        else
            echo "ACT_TYPE=$ACT_TYPE; ACT_LEFT=$NEW_LEFT; ACT_STEP=$NEW_STEP" > "$CHEETAH_ACT"
        fi
    else
        rm -f "$CHEETAH_ACT"
        FRAME=0
    fi
elif
# Parrot action: check if mid-action
PARROT_ACT="$HOME/.petsonality/.parrot_act"; [ "$PET_ID" = "parrot" ] && [ -f "$PARROT_ACT" ]; then
    _ACT_RAW=$(cat "$PARROT_ACT" 2>/dev/null)
    if echo "$_ACT_RAW" | grep -qE '^ACT_TYPE=(sing|flap|bob|preen); ACT_LEFT=[0-9]+; ACT_STEP=[0-9]+$'; then
        eval "$_ACT_RAW"
    else
        rm -f "$PARROT_ACT"
    fi
    ACT_STEP=${ACT_STEP:-0}
    if [ "${ACT_LEFT:-0}" -gt 0 ]; then
        case "$ACT_TYPE" in
          sing)
            if [ $(( (ACT_STEP / 5) % 2 )) -eq 0 ]; then FRAME=3; else FRAME=4; fi ;;
          flap)
            if [ $(( (ACT_STEP / 5) % 2 )) -eq 0 ]; then FRAME=5; else FRAME=6; fi ;;
          bob)
            if [ $(( (ACT_STEP / 5) % 2 )) -eq 0 ]; then FRAME=7; else FRAME=8; fi ;;
          preen)   FRAME=9 ;;
        esac
        NEW_LEFT=$(( ACT_LEFT - 1 ))
        NEW_STEP=$(( ACT_STEP + 1 ))
        if [ $NEW_LEFT -le 0 ]; then
            rm -f "$PARROT_ACT"
        else
            echo "ACT_TYPE=$ACT_TYPE; ACT_LEFT=$NEW_LEFT; ACT_STEP=$NEW_STEP" > "$PARROT_ACT"
        fi
    else
        rm -f "$PARROT_ACT"
        FRAME=0
    fi
elif
# Blink persistence: check if mid-blink
BLINK_FILE="$HOME/.petsonality/.blink"; [ -f "$BLINK_FILE" ]; then
    _BL=$(cat "$BLINK_FILE" 2>/dev/null)
    if [ "${_BL:-0}" -gt 0 ]; then
        FRAME=-1
        echo $(( _BL - 1 )) > "$BLINK_FILE"
    else
        rm -f "$BLINK_FILE"
        FRAME=0
    fi
elif [ $ROLL -lt $BLINK_PCT ]; then
    FRAME=-1
    echo 4 > "$HOME/.petsonality/.blink"  # blink lasts 5 ticks (~0.5s)
elif [ $ROLL -lt $(( BLINK_PCT + MOVE_PCT )) ]; then
    case "$PET_ID" in
      owl|raven) if [ $(( RANDOM % 2 )) -eq 0 ]; then FRAME=1; else FRAME=3; fi ;;
      labrador)
        # nuzzle 25%, yawn 25%, pant 25%, liedown 25% (×10 for ~10fps)
        _LR=$(( RANDOM % 100 ))
        if [ $_LR -lt 25 ]; then
            FRAME=3; echo "ACT_TYPE=nuzzle; ACT_LEFT=$(( RANDOM % 10 + 10 ))" > "$LAB_ACT"
        elif [ $_LR -lt 50 ]; then
            FRAME=4; echo "ACT_TYPE=yawn; ACT_LEFT=$(( RANDOM % 10 + 20 ))" > "$LAB_ACT"
        elif [ $_LR -lt 75 ]; then
            FRAME=5; echo "ACT_TYPE=pant; ACT_LEFT=$(( RANDOM % 10 + 20 ))" > "$LAB_ACT"
        else
            FRAME=6; echo "ACT_TYPE=liedown; ACT_LEFT=$(( RANDOM % 600 + 1500 ))" > "$LAB_ACT"
        fi
        ;;
      deer)
        # graze 30%, tilt 25%, gaze 30%, nuzzle 15%
        _DR=$(( RANDOM % 100 ))
        if [ $_DR -lt 30 ]; then
            FRAME=3; echo "ACT_TYPE=graze; ACT_LEFT=$(( RANDOM % 10 + 20 ))" > "$DEER_ACT"
        elif [ $_DR -lt 55 ]; then
            FRAME=4; echo "ACT_TYPE=tilt; ACT_LEFT=$(( RANDOM % 10 + 10 ))" > "$DEER_ACT"
        elif [ $_DR -lt 85 ]; then
            FRAME=5; echo "ACT_TYPE=gaze; ACT_LEFT=$(( RANDOM % 10 + 20 ))" > "$DEER_ACT"
        else
            FRAME=6; echo "ACT_TYPE=nuzzle; ACT_LEFT=$(( RANDOM % 10 + 10 ))" > "$DEER_ACT"
        fi
        ;;
      wolf)
        # walk 30%, howl 25%, alert 25%, sniff 15%, stretch 5%
        _WR=$(( RANDOM % 100 ))
        if [ $_WR -lt 30 ]; then
            FRAME=3; echo "ACT_TYPE=walk; ACT_LEFT=$(( RANDOM % 10 + 20 ))" > "$WOLF_ACT"
        elif [ $_WR -lt 55 ]; then
            FRAME=4; echo "ACT_TYPE=howl; ACT_LEFT=$(( RANDOM % 10 + 15 ))" > "$WOLF_ACT"
        elif [ $_WR -lt 80 ]; then
            FRAME=5; echo "ACT_TYPE=alert; ACT_LEFT=$(( RANDOM % 10 + 20 ))" > "$WOLF_ACT"
        elif [ $_WR -lt 95 ]; then
            FRAME=7; echo "ACT_TYPE=sniff; ACT_LEFT=$(( RANDOM % 10 + 10 ))" > "$WOLF_ACT"
        else
            FRAME=6; echo "ACT_TYPE=stretch; ACT_LEFT=$(( RANDOM % 10 + 20 ))" > "$WOLF_ACT"
        fi
        ;;
      bear)
        # Pick action: wave (60%) or slam (40%)
        if [ $(( RANDOM % 100 )) -lt 60 ]; then
            FRAME=1  # wave start
            WAVE_DUR=$(( RANDOM % 40 + 120 ))  # ~12-16 seconds
            echo "ACT_TYPE=wave; ACT_LEFT=$WAVE_DUR; ACT_STEP=1" > "$BEAR_ACT"
        else
            FRAME=4  # raise paw first
            SLAM_GROUPS=$(( RANDOM % 3 + 2 ))  # 2-4 groups
            SLAM_DUR=$(( SLAM_GROUPS * 20 ))   # each group ~2s
            echo "ACT_TYPE=slam; ACT_LEFT=$SLAM_DUR; ACT_STEP=0" > "$BEAR_ACT"
        fi
        ;;
      beaver)
        # gnaw 30%, inspect 35%, sigh 20%, slap 15%
        _BR=$(( RANDOM % 100 ))
        if [ $_BR -lt 30 ]; then
            FRAME=3; echo "ACT_TYPE=gnaw; ACT_LEFT=$(( RANDOM % 20 + 40 )); ACT_STEP=0" > "$BEAVER_ACT"
        elif [ $_BR -lt 65 ]; then
            FRAME=5; echo "ACT_TYPE=inspect; ACT_LEFT=$(( RANDOM % 10 + 20 )); ACT_STEP=0" > "$BEAVER_ACT"
        elif [ $_BR -lt 85 ]; then
            FRAME=6; echo "ACT_TYPE=sigh; ACT_LEFT=$(( RANDOM % 10 + 20 )); ACT_STEP=0" > "$BEAVER_ACT"
        else
            FRAME=4; echo "ACT_TYPE=slap; ACT_LEFT=$(( RANDOM % 10 + 10 )); ACT_STEP=0" > "$BEAVER_ACT"
        fi
        ;;
      panda)
        # eat 40%, stare 25%, frown 20%, roll 15%
        _PR=$(( RANDOM % 100 ))
        if [ $_PR -lt 40 ]; then
            FRAME=3; echo "ACT_TYPE=eat; ACT_LEFT=50; ACT_STEP=0" > "$PANDA_ACT"
        elif [ $_PR -lt 65 ]; then
            FRAME=9; echo "ACT_TYPE=stare; ACT_LEFT=$(( RANDOM % 20 + 50 )); ACT_STEP=0" > "$PANDA_ACT"
        elif [ $_PR -lt 85 ]; then
            FRAME=10; echo "ACT_TYPE=frown; ACT_LEFT=$(( RANDOM % 10 + 15 )); ACT_STEP=0" > "$PANDA_ACT"
        else
            FRAME=8; echo "ACT_TYPE=roll; ACT_LEFT=$(( RANDOM % 10 + 10 )); ACT_STEP=0" > "$PANDA_ACT"
        fi
        ;;
      cat)
        # lick 40%, stare 35%, stretch 25%
        _CR=$(( RANDOM % 100 ))
        if [ $_CR -lt 40 ]; then
            FRAME=4; echo "ACT_TYPE=lick; ACT_LEFT=$(( RANDOM % 10 + 30 )); ACT_STEP=0" > "$CAT_ACT"
        elif [ $_CR -lt 75 ]; then
            FRAME=3; echo "ACT_TYPE=stare; ACT_LEFT=$(( RANDOM % 10 + 20 )); ACT_STEP=0" > "$CAT_ACT"
        else
            FRAME=5; echo "ACT_TYPE=stretch; ACT_LEFT=$(( RANDOM % 10 + 20 )); ACT_STEP=0" > "$CAT_ACT"
        fi
        ;;
      golden)
        # wag 35%, jump 25%, lick 25%, spin 15%
        _GR=$(( RANDOM % 100 ))
        if [ $_GR -lt 35 ]; then
            FRAME=3; echo "ACT_TYPE=wag; ACT_LEFT=$(( RANDOM % 20 + 40 )); ACT_STEP=0" > "$GOLD_ACT"
        elif [ $_GR -lt 60 ]; then
            FRAME=4; echo "ACT_TYPE=jump; ACT_LEFT=$(( RANDOM % 10 + 10 )); ACT_STEP=0" > "$GOLD_ACT"
        elif [ $_GR -lt 85 ]; then
            FRAME=5; echo "ACT_TYPE=lick; ACT_LEFT=$(( RANDOM % 10 + 20 )); ACT_STEP=0" > "$GOLD_ACT"
        else
            FRAME=6; echo "ACT_TYPE=spin; ACT_LEFT=$(( RANDOM % 20 + 80 )); ACT_STEP=0" > "$GOLD_ACT"
        fi
        ;;
      lion)
        # roar 30%, shake 25%, yawn 25%, glare 20%
        _LNR=$(( RANDOM % 100 ))
        if [ $_LNR -lt 30 ]; then
            FRAME=3; echo "ACT_TYPE=roar; ACT_LEFT=$(( RANDOM % 10 + 30 )); ACT_STEP=0" > "$LION_ACT"
        elif [ $_LNR -lt 55 ]; then
            FRAME=4; echo "ACT_TYPE=shake; ACT_LEFT=$(( RANDOM % 20 + 40 )); ACT_STEP=0" > "$LION_ACT"
        elif [ $_LNR -lt 80 ]; then
            FRAME=7; echo "ACT_TYPE=yawn; ACT_LEFT=$(( RANDOM % 10 + 30 )); ACT_STEP=0" > "$LION_ACT"
        else
            FRAME=6; echo "ACT_TYPE=glare; ACT_LEFT=$(( RANDOM % 10 + 20 )); ACT_STEP=0" > "$LION_ACT"
        fi
        ;;
      elephant)
        # listen 35%, nod 25%, trunk 25%, stomp 15%
        _ER=$(( RANDOM % 100 ))
        if [ $_ER -lt 35 ]; then
            FRAME=6; echo "ACT_TYPE=listen; ACT_LEFT=$(( RANDOM % 10 + 20 )); ACT_STEP=0" > "$ELEPH_ACT"
        elif [ $_ER -lt 60 ]; then
            FRAME=7; echo "ACT_TYPE=nod; ACT_LEFT=$(( RANDOM % 10 + 20 )); ACT_STEP=0" > "$ELEPH_ACT"
        elif [ $_ER -lt 85 ]; then
            FRAME=5; echo "ACT_TYPE=trunk; ACT_LEFT=$(( RANDOM % 10 + 20 )); ACT_STEP=0" > "$ELEPH_ACT"
        else
            FRAME=3; echo "ACT_TYPE=stomp; ACT_LEFT=$(( RANDOM % 20 + 40 )); ACT_STEP=0" > "$ELEPH_ACT"
        fi
        ;;
      cheetah)
        # sprint 30%, pounce 25%, twitch 25%, yawn 20%
        _CHR=$(( RANDOM % 100 ))
        if [ $_CHR -lt 30 ]; then
            FRAME=3; echo "ACT_TYPE=sprint; ACT_LEFT=$(( RANDOM % 20 + 30 )); ACT_STEP=0" > "$CHEETAH_ACT"
        elif [ $_CHR -lt 55 ]; then
            FRAME=5; echo "ACT_TYPE=pounce; ACT_LEFT=$(( RANDOM % 10 + 15 )); ACT_STEP=0" > "$CHEETAH_ACT"
        elif [ $_CHR -lt 80 ]; then
            FRAME=6; echo "ACT_TYPE=twitch; ACT_LEFT=$(( RANDOM % 10 + 10 )); ACT_STEP=0" > "$CHEETAH_ACT"
        else
            FRAME=8; echo "ACT_TYPE=yawn; ACT_LEFT=$(( RANDOM % 10 + 20 )); ACT_STEP=0" > "$CHEETAH_ACT"
        fi
        ;;
      parrot)
        # sing 30%, flap 25%, bob 25%, preen 20%
        _PAR=$(( RANDOM % 100 ))
        if [ $_PAR -lt 30 ]; then
            FRAME=3; echo "ACT_TYPE=sing; ACT_LEFT=$(( RANDOM % 20 + 30 )); ACT_STEP=0" > "$PARROT_ACT"
        elif [ $_PAR -lt 55 ]; then
            FRAME=5; echo "ACT_TYPE=flap; ACT_LEFT=$(( RANDOM % 10 + 15 )); ACT_STEP=0" > "$PARROT_ACT"
        elif [ $_PAR -lt 80 ]; then
            FRAME=7; echo "ACT_TYPE=bob; ACT_LEFT=$(( RANDOM % 20 + 20 )); ACT_STEP=0" > "$PARROT_ACT"
        else
            FRAME=9; echo "ACT_TYPE=preen; ACT_LEFT=$(( RANDOM % 10 + 20 )); ACT_STEP=0" > "$PARROT_ACT"
        fi
        ;;
      *) FRAME=1 ;;
    esac
else
    FRAME=0
    # Idle micro-animations (per-mille to match ~10fps)
    # Labrador idle: tail wag
    if [ "$PET_ID" = "labrador" ] && [ $(( RANDOM % 1000 )) -lt 10 ]; then
        FRAME=1
    fi
    # Deer idle: tail wag
    if [ "$PET_ID" = "deer" ] && [ $(( RANDOM % 1000 )) -lt 8 ]; then
        FRAME=1
    fi
    # Wolf idle: blink, tail wag
    if [ "$PET_ID" = "wolf" ]; then
        _WI=$(( RANDOM % 1000 ))
        if [ $_WI -lt 5 ]; then FRAME=2
        elif [ $_WI -lt 10 ]; then FRAME=1
        fi
    fi
    # Bear mouth twitch while idle
    if [ "$PET_ID" = "bear" ] && [ ! -f "$BEAR_ACT" ] && [ $(( RANDOM % 1000 )) -lt 2 ]; then
        FRAME=7
    fi
    # Elephant idle: trunk sway
    if [ "$PET_ID" = "elephant" ] && [ $(( RANDOM % 1000 )) -lt 6 ]; then
        FRAME=1
    fi
    # Cheetah idle: tail twitch
    if [ "$PET_ID" = "cheetah" ] && [ $(( RANDOM % 1000 )) -lt 8 ]; then
        FRAME=1
    fi
    # Parrot idle: tail sway
    if [ "$PET_ID" = "parrot" ] && [ $(( RANDOM % 1000 )) -lt 15 ]; then
        FRAME=1
    fi
fi

BLINK=0
if [ "${FRAME:-0}" -eq -1 ]; then
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
if [ "$SKIP_ART" -eq 1 ]; then
    : # L1-L4 already set (dolphin cycle)
else
# <<< GENERATED: ART >>>
case "$PET_ID" in
  raven)
    case $FRAME in
       0) L1="  <(◉)      "; L2="   (\\ \\_    "; L3="    \\\\//    "; L4="  --\" \"---  " ;;
       1) L1="  <(●)      "; L2="   (\\ \\_    "; L3="    \\\\//    "; L4="  --\" \"---  " ;;
       2) L1="  <(-)      "; L2="   (\\ \\_    "; L3="    \\\\//    "; L4="  --\" \"---  " ;;
    esac ;;
  owl)
    case $FRAME in
       0) L1="            "; L2="    {◉,◉}   "; L3="    /)_)    "; L4="  ——\" \"——   " ;;
       1) L1="            "; L2="     {◉,◉}  "; L3="    /)_)    "; L4="  ——\" \"——   " ;;
       2) L1="            "; L2="    {-,-}   "; L3="    /)_)    "; L4="  ——\" \"——   " ;;
    esac ;;
  bear)
    case $FRAME in
       0) L1="  c(\\__/)o  "; L2="  ( o  o )  "; L3="  (  ww  )  "; L4="   /|  |\\   " ;;
       1) L1="  c(\\__/)o  "; L2="  ( o  o )  "; L3="  (  ww  )  "; L4="  ~/|  |\\   " ;;
       2) L1="  c(\\__/)o  "; L2="  ( -  o )  "; L3="  (  ww  )  "; L4="   /|  |\\   " ;;
    esac ;;
  fox)
    case $FRAME in
       0) L1="   /\\  /\\   "; L2="  ( >.<  )  "; L3="   > ^ <    "; L4="   /_\\~~~   " ;;
       1) L1="   /\\  /\\   "; L2="  ( >.<  )  "; L3="   > ^ <    "; L4="   /_\\~~>   " ;;
       2) L1="   /\\  /\\   "; L2="  ( o.o  )  "; L3="   > ^ <    "; L4="   /_\\~~~   " ;;
    esac ;;
  wolf)
    case $FRAME in
       0) L1="  _/|/|     "; L2=" (·   |__  )"; L3="  \\\\   / -  "; L4="   |  |  || " ;;
       1) L1="  _/|/|     "; L2=" (·   |__  )"; L3="  \\\\   / ~  "; L4="   |  |  || " ;;
       2) L1="  _/|/|     "; L2=" (-   |__  )"; L3="  \\\\   / -  "; L4="   |  |  || " ;;
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
    TH=$'\033[38;2;200;195;185m'  # grey for teeth
    case $FRAME in
       0) L1="  n____n    "; L2=" (·    ·)   "; L3=" ( >${TH}TT${C}< )   "; L4="  \`----'    " ;;
       1) L1="  n____n    "; L2=" (·    ·)   "; L3=" ( >${TH}TT${C}< )~  "; L4="  \`----'    " ;;
       2) L1="  n____n    "; L2=" (-    ·)   "; L3=" ( >${TH}TT${C}< )   "; L4="  \`----'    " ;;
       3) L1="  n____n    "; L2=" (·    ·)   "; L3=" (=>${TH}TT${C}<=)   "; L4="  \`----'    " ;;
       4) L1="  n____n    "; L2=" (°    °)   "; L3=" ( >${TH}TT${C}< )!! "; L4="  \`----'    " ;;
       5) L1="  n____n    "; L2=" (>    >)   "; L3=" ( >${TH}TT${C}< )   "; L4="  \`----'    " ;;
       6) L1="  n____n    "; L2=" (<    <)   "; L3=" ( >${TH}TT${C}< )   "; L4="  \`----'    " ;;
       7) L1="  n____n    "; L2=" (-    -)   "; L3=" ( >${TH}TT${C}< )…  "; L4="  \`----'    " ;;
       8) L1="  n____n    "; L2=" (·    ·)   "; L3=" (= ${TH}T T${C}=)   "; L4="  \`----'    " ;;
    esac ;;
  elephant)
    case $FRAME in
       0) L1="    __  ___ "; L2="   ( •  |  )"; L3="    \\ |_  | "; L4="    _) |__| " ;;
       1) L1="    __  ___ "; L2="   ( •  |  )"; L3="    \\ |_  | "; L4="   _)  |__| " ;;
       2) L1="    __  ___ "; L2="   ( -  |  )"; L3="    \\ |_  | "; L4="    _) |__| " ;;
       3) L1="    __  ___ "; L2="   ( •  |  )"; L3="    \\ |_  | "; L4="    _) |_ | " ;;
       4) L1="    __  ___ "; L2="   ( •  |  )"; L3="    \\ |_  | "; L4="    _) | _| " ;;
       5) L1="    __  ___ "; L2="   ( •  |  )"; L3="    \\ |_  | "; L4="   _/  |__| " ;;
       6) L1="   __ _____ "; L2="   ( •  |  )"; L3="    \\ |_  | "; L4="    _) |__| " ;;
       7) L1="    __  ___ "; L2="   ( –  |  )"; L3="    \\ |_  | "; L4="    _) |__| " ;;
    esac ;;
  lion)
    case $FRAME in
       0) L1=" {*|_W_|*}  "; L2=" ( ◉   ◉ )  "; L3=" { = ^ = }  "; L4="  * *~~* *  " ;;
       1) L1=" {*|_W_|*}  "; L2=" ( ◉   ◉ )  "; L3=" { = ^ = }~ "; L4="  * *~~* *  " ;;
       2) L1=" {*|_W_|*}  "; L2=" ( -   ◉ )  "; L3=" { = ^ = }  "; L4="  * *~~* *  " ;;
       3) L1=" {*|_W_|*}  "; L2=" ( ◉   ◉ )  "; L3=" { = V = }  "; L4="  * *~~* *  " ;;
       4) L1=" }*|_W_|*{  "; L2=" ( ◉   ◉ )  "; L3=" } = ^ = {  "; L4="  * *~~* *  " ;;
       5) L1=" {*|_W_|*}  "; L2=" ( ◉   ◉ )  "; L3=" { = ^ = }  "; L4="  * *~~* *  " ;;
       6) L1=" {*|_W_|*}  "; L2=" ( >   < )  "; L3=" { = ^ = }  "; L4="  * *~~* *  " ;;
       7) L1=" {*|_W_|*}  "; L2=" ( -   - )  "; L3=" { = O = }  "; L4="  * *~~* *  " ;;
    esac ;;
  golden)
    TG=$'\033[38;2;240;140;150m'  # pink tongue
    case $FRAME in
       0) L1="  _/~\\~~    "; L2=" ( •  \\~~   "; L3="  ${TG}U${C}    |    "; L4="  \\__(__)~  " ;;
       1) L1="  _/~\\~~    "; L2=" ( •  \\~~   "; L3="  ${TG}U${C}    |    "; L4="  \\__(__)~~ " ;;
       2) L1="  _/~\\~~    "; L2=" ( -  \\~~   "; L3="  ${TG}U${C}    |    "; L4="  \\__(__)~  " ;;
       3) L1="  _/~\\~~    "; L2=" ( •  \\~~   "; L3="  ${TG}U${C}    |    "; L4="  \\__(__)~~~" ;;
       4) L1="  _/~\\~~    "; L2=" ( •  \\~~   "; L3="  ${TG}U${C}    |    "; L4=" ~\\__( )~   " ;;
       5) L1="  _/~\\~~    "; L2=" ( •  \\~~   "; L3=" ${TG}U${C}     |    "; L4="  \\__(__)~  " ;;
       6) L1="  _/~\\~~    "; L2=" ( •  \\~~   "; L3="  ${TG}U${C}    |    "; L4="  \\__(__)~  " ;;
       7) L1="   ~~/ ~\\_  "; L2="  (~~  • )  "; L3="   |    ${TG}U${C}   "; L4=" ~(__)__/~  " ;;
    esac ;;
  cat)
    case $FRAME in
       0) L1="   /\\_/\\    "; L2="  ( •.• )   "; L3="   > ^ <    "; L4="  (_____)~  " ;;
       1) L1="   /\\_/\\    "; L2="  ( •.• )   "; L3="   > ^ <    "; L4="  (_____)~~ " ;;
       2) L1="   /\\_/\\    "; L2="  ( -.• )   "; L3="   > ^ <    "; L4="  (_____)~  " ;;
       3) L1="   /\\_/\\    "; L2="  ( ◉.◉ )   "; L3="   > ^ <    "; L4="  (_____)~  " ;;
       4) L1="   /\\_/\\    "; L2="  ( –.– )   "; L3="   > ^_<    "; L4="  (_____)~  " ;;
       5) L1="   /\\_/\\  ~ "; L2="  ( –.– )   "; L3="   > ^ <    "; L4="  (_____)   " ;;
    esac ;;
  panda)
    PP=$'\033[38;2;140;100;180m'  # purple for ears & eye circles
    BM=$'\033[38;2;80;180;80m'  # green bamboo
    case $FRAME in
       0) L1="  ${PP}n${C} __ ${PP}n${C}    "; L2=" / ${PP}@${C}  ${PP}@${C} \\   "; L3=" (  ww  )   "; L4="( --  -- )  " ;;
       1) L1="  ${PP}n${C} __ ${PP}n${C}    "; L2=" / ${PP}@${C}  ${PP}@${C} \\   "; L3=" (  ww  )   "; L4="( --  -- )  " ;;
       2) L1="  ${PP}n${C} __ ${PP}n${C}    "; L2=" / ${PP}@${C}  - \\   "; L3=" (  ww  )   "; L4="( --  -- )  " ;;
       3) L1="  ${PP}n${C} __ ${PP}n${C}    "; L2=" / ${PP}@${C}  ${PP}@${C} \\   "; L3=" (  ww  ${BM}${BM}${BM}=${C}${BM}=${C}${C}${BM}${BM}=${C}${BM}=${C}${C}${C}"; L4="( --  -- )  " ;;
       4) L1="  ${PP}n${C} __ ${PP}n${C}    "; L2=" / ${PP}@${C}  ${PP}@${C} \\   "; L3=" (  ${BM}${BM}${BM}=${C}${BM}=${C}${C}${BM}${BM}=${C}${BM}=${C}${C}${C})   "; L4="( ||  || )  " ;;
       5) L1="  ${PP}n${C} __ ${PP}n${C}    "; L2=" / ${PP}@${C}  ${PP}@${C} \\   "; L3=" (  ww${BM}${BM}=${C}${BM}=${C}${C})   "; L4="( ||  || )  " ;;
       6) L1="  ${PP}n${C} __ ${PP}n${C}    "; L2=" / ${PP}@${C}  ${PP}@${C} \\   "; L3=" (  ww ${BM}=${C})   "; L4="( --  -- )  " ;;
       7) L1="  ${PP}n${C} __ ${PP}n${C}    "; L2="  \\ ${PP}@${C}  ${PP}@${C} /  "; L3=" (  ww  )   "; L4=" ( --  -- ) " ;;
       8) L1="  ${PP}n${C} __ ${PP}n${C}    "; L2=" / ·  · \\   "; L3=" (  ww  )   "; L4="( --  -- )  " ;;
       9) L1="  ${PP}n${C} __ ${PP}n${C}    "; L2=" / >  < \\   "; L3=" (  ww  )   "; L4="( --  -- )  " ;;
    esac ;;
  cheetah)
    case $FRAME in
       0) L1="   /\\_/\\  ~ "; L2="  (o . o)   "; L3="   >.v.<    "; L4="  /|'.|\\    " ;;
       1) L1="   /\\_/\\  ~ "; L2="  (o . o)   "; L3="   >.v.<    "; L4="  /|'.|\\~   " ;;
       2) L1="   /\\_/\\  ~ "; L2="  (- . o)   "; L3="   >.v.<    "; L4="  /|'.|\\    " ;;
       3) L1="   /\\_/\\~~~~"; L2="  (o . o)   "; L3="   >.v.<    "; L4="  _/' .\\_   " ;;
       4) L1=" ~/\\_/\\ ~~~ "; L2="  (o . o)   "; L3="   >.v.<    "; L4="   \\_'. /   " ;;
       5) L1="   /\\_/\\    "; L2="  (◉ . ◉)   "; L3="   >.v.<    "; L4="  _|'._|_   " ;;
       6) L1="   __ __  ~ "; L2="  (o . o)   "; L3="   >.v.<    "; L4="  /|'.|\\    " ;;
       7) L1="  /\\_ __  ~ "; L2="  (o . o)   "; L3="   >.v.<    "; L4="  /|'.|\\    " ;;
       8) L1="   /\\_/\\    "; L2="  (- . -)   "; L3="   >.O.<    "; L4="  /|'.|\\    " ;;
    esac ;;
  parrot)
    CR=$'\033[38;2;230;80;50m'  # warm red crest
    case $FRAME in
       0) L1="    ${CR},__${C}     "; L2="  >(o  )    "; L3="   \\\\__/    "; L4="    |||     " ;;
       1) L1="    ${CR},__${C}     "; L2="  >(o  )    "; L3="   \\\\__/    "; L4="    |||~    " ;;
       2) L1="    ${CR},__${C}     "; L2="  >(-  )    "; L3="   \\\\__/    "; L4="    |||     " ;;
       3) L1="    ${CR},__${C}   ~ "; L2="  >(o  )    "; L3="   \\\\__/    "; L4="    |||     " ;;
       4) L1="    ${CR},__${C}  ~  "; L2="  >(o  )    "; L3="   \\\\__/    "; L4="    |||     " ;;
       5) L1="    ${CR},__${C}     "; L2=" ~>(o  )~   "; L3="   \\\\__/    "; L4="    |||     " ;;
       6) L1="    ${CR},__${C}     "; L2="~ >(o  ) ~  "; L3="   \\\\__/    "; L4="    |||     " ;;
       7) L1="   ${CR},__${C}      "; L2=" >(o  )     "; L3="   \\\\__/    "; L4="    |||     " ;;
       8) L1="     ${CR},__${C}    "; L2="   >(o  )   "; L3="   \\\\__/    "; L4="    |||     " ;;
       9) L1="    ${CR},__${C}     "; L2="   (o >)    "; L3="   \\\\__/    "; L4="    |||     " ;;
    esac ;;
  *)
    L1="    (?)     "; L2="            "; L3="            "; L4="            " ;;
esac
# <<< END GENERATED: ART >>>
fi # end SKIP_ART

# ─── Blink: replace eyes (o and @) in L1-L3, skip L4 (feet/body) ────────────
if [ "${BLINK:-0}" -eq 1 ] && [ "$SKIP_ART" -eq 0 ]; then
    L1="${L1//o/-}"; L2="${L2//o/-}"; L3="${L3//o/-}"
    L2="${L2//@/-}"  # labrador, panda
    L2="${L2//•/-}"  # golden, elephant
    L2="${L2//·/-}"  # beaver
    L2="${L2//◉/-}"  # lion
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

# Build box (all animals use bordered bubble; dolphin gets blue via $BC)
BOX_W=$(( INNER_W + 4 ))
BUBBLE_LINES=()
BUBBLE_TYPES=()
if [ $TEXT_COUNT -gt 0 ]; then
    BORDER=$(printf '%*s' "$(( BOX_W - 2 ))" '' | tr ' ' '-')
    BUBBLE_LINES+=(".${BORDER}.")
    BUBBLE_TYPES+=("border")
    LINE_WIDTHS=()
    if [ -f "$REACTION_FILE" ]; then
        while IFS= read -r w; do
            LINE_WIDTHS+=("$w")
        done < <(jq -r '.widths[]? // empty' "$REACTION_FILE" 2>/dev/null)
    fi
    for idx in "${!TEXT_LINES[@]}"; do
        tl="${TEXT_LINES[$idx]}"
        if [ "$idx" -lt "${#LINE_WIDTHS[@]}" ] && [ -n "${LINE_WIDTHS[$idx]}" ]; then
            TL_DW=${LINE_WIDTHS[$idx]}
        else
            TL_DW=$(dw "$tl")
        fi
        tpad=$(( INNER_W - TL_DW ))
        [ "$tpad" -lt 0 ] && tpad=0
        padding=$(printf '%*s' "$tpad" '')
        BUBBLE_LINES+=("${tl}${padding}")
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

# Connector line (middle text line gets the -- connector to pet art)
CONNECTOR_BI=-1
if [ $BUBBLE_COUNT -gt 2 ]; then
    FIRST_TEXT=1
    LAST_TEXT=$(( BUBBLE_COUNT - 2 ))
    CONNECTOR_BI=$(( (FIRST_TEXT + LAST_TEXT) / 2 ))
fi

# ─── Output: total lines = max(art, bubble) ─────────────────────────────────
TOTAL_LINES=$ART_COUNT
[ $BUBBLE_COUNT -gt $((BUBBLE_START + ART_COUNT)) ] && TOTAL_LINES=$(( BUBBLE_START + BUBBLE_COUNT ))

ART_EMPTY=$(printf '%*s' "$ART_W" '')

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
                gap="${BC}--${NC} "
            else
                gap="   "
            fi

            if [ "$btype" = "border" ]; then
                echo "${SPACER}${BC}${bline}${NC}${gap}${art_part}"
            else
                echo "${SPACER}${BC}|${NC} ${DIM}${bline}${NC} ${BC}|${NC}${gap}${art_part}"
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
