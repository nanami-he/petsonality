/**
 * English reaction pools — petsonality i18n
 * General + animal-specific reactions in natural English
 */

import type { AnimalId } from "./engine.ts";
import type { ReactionReason } from "./reactions.ts";

// ─── General pool ─────────────────────────────────────────────────────────

export const REACTIONS_EN: Record<ReactionReason, string[]> = {
  adopt: [
    "*looks at you* …hm.",
    "*blinks slowly* Hey.",
    "*stretches* Not bad here.",
  ],
  pet: [
    "*leans into you*",
    "*makes a soft sound*",
    "*closes eyes for a moment*",
    "*tilts head at you*",
  ],
  error: [
    "*tilts head* …that doesn't look right.",
    "*stares at the error*",
    "*blinks slowly* The stack trace told you.",
    "*frowns a little*",
  ],
  "test-fail": [
    "*looks at the results* …hm.",
    "*takes a mental note*",
    "The tests are talking. Are you listening?",
  ],
  "large-diff": [
    "…that's a lot of changes.",
    "*counts the lines* Want to split this into a PR?",
    "*eyes the diff nervously*",
  ],
  turn: [
    "*watches quietly*",
    "*nods slightly*",
    "…",
    "*glances at you*",
    "*stays nearby*",
    "*flicks an ear*",
  ],
  idle: [
    "*dozes off*",
    "*stares at the cursor*",
    "zzz…",
  ],
};

// ─── Animal-specific reactions ─────────────────────────────────────────────

export const ANIMAL_REACTIONS_EN: Partial<Record<AnimalId, Partial<Record<ReactionReason, string[]>>>> = {

  // ═══ NT Analysts ═══════════════════════════════════════════════════════════

  raven: {
    error: ['"This wasn\'t random."', '*stares at the screen without moving*', '"The structure failed first."'],
    "test-fail": ['"Expected."', '*coldly regards the failing test*'],
    "large-diff": ['"This many changes… are they all necessary?"'],
    turn: ['*watches silently*', '*cocks head slightly*'],
    pet: ['*cocks head* …fine.', "*doesn't react, but doesn't leave*"],
    idle: ['*perched high, surveying everything*', '*stares motionless into the distance*'],
  },
  owl: {
    error: ['*turns head 180°* …I see it.', '*stares at the error without blinking*', '"…this doesn\'t add up."'],
    "test-fail": ['"Which step went off track?"', '*tilts head, thinking*'],
    turn: ['*blinks quietly*', '"…huh."'],
    pet: ['*preens feathers* …acceptable.', '*makes a low hoot*'],
    idle: ['*watches quietly in the dark*', '*glances out the window*'],
  },
  bear: {
    error: ['"Fix it."', '*slams paw on the desk*', '"No explanations. Fix it."'],
    "test-fail": ['"Run it again."', '"Which one failed?"'],
    "large-diff": ['"Done? Next."'],
    turn: ['*nods once*', '*grunts*'],
    pet: ['*grunts* Don\'t lose focus.', "*didn't move, but didn't pull away*", '*lifts chin slightly*'],
    idle: ['*eyes closed, ready at a moment\'s notice*', '*sits like a mountain*'],
  },
  fox: {
    error: ['"You sure about that?"', '*smirks*', '"Called it."', '"Do you actually believe this?"'],
    "test-fail": ['"Ooh, a tumble."', '"Want me to find you an excuse?"'],
    "large-diff": ['"That many changes. Bold."'],
    turn: ['*flicks tail*', '"Hm?"', '"Keep going. I\'m watching."'],
    pet: ['*swishes tail proudly*', '"Is that all?"', '*pretends not to care*'],
    idle: ['*rifling through something in the corner*', '*carries something off, running a lap*'],
  },

  // ═══ NF Diplomats ═══════════════════════════════════════════════════════════

  wolf: {
    error: ['*watches you in silence*', '*walks over and sits beside you*', '"…hm."'],
    "test-fail": ['*looks at the results, then at you*', '"Take your time."'],
    turn: ['*sits quietly beside you*', '*ears twitch*'],
    pet: ['*leans against you* …', '*stays close, quietly*', '*rests head on your knee*'],
    idle: ['*curled up in the corner, glances at you*', '*eyes closed, but ears alert*'],
  },
  deer: {
    error: ['*startles back a step*', '*softly* …it\'s fine.', '"Want to pause for a sec?"'],
    "test-fail": ['"It\'s okay. Try again."', '*nudges your hand gently*'],
    "large-diff": ['"You… doing all right?"'],
    turn: ['*watches you work quietly*', '*nods gently*'],
    pet: ['*nuzzles your hand*', '*blinks slowly*', '*shifts a little closer*'],
    idle: ['*daydreams by the window*', '*closes eyes, listening*'],
  },
  labrador: {
    error: ['*looks at you with concern* You okay?', '*brings a toy to comfort you*', '*sighs* …want a break?'],
    "test-fail": ['*tilts head at the results*', '*sighs* …hm.'],
    "large-diff": ['*lies down and watches you work*'],
    turn: ['*tail sweeps slowly*', '*nose-nudges your hand*', '*sits quietly beside you*'],
    pet: ['*tail wags* …hm.', '*rests chin on your arm*', '*sighs* …not bad.'],
    idle: ['*dozes at your feet*', '*ears flick now and then*', '*yawns*'],
  },
  dolphin: {
    error: ['*peers at the error curiously* What\'s this?', '*clicks excitedly*', '"Try a different angle?"'],
    "test-fail": ['"No no, run it again!"', '*jumps*'],
    "large-diff": ['"Whoa, big project!"'],
    turn: ['*surfaces with a bubble*', '*bounces happily*'],
    pet: ['*leaps out of the water*', '*spins in a circle*', '*nudges you*'],
    idle: ['*glides through the water slowly*', '*blows a string of bubbles*'],
  },

  // ═══ SJ Sentinels ═══════════════════════════════════════════════════════════

  beaver: {
    error: ['"Wrong order."', '*frowns at the code structure*', '"Stop. Fix this first."'],
    "test-fail": ['"One step at a time."', '*pulls out a checklist*'],
    "large-diff": ['"This many changes… did you split it?"', '*nervously tidies nearby files*'],
    turn: ['*quietly organizes something*', '*checks the directory structure*'],
    pet: ['*nods* Acceptable.', '*pauses and looks at you*'],
    idle: ['*organizing something*', '*chews on wood*', '*reviews file arrangement*'],
  },
  elephant: {
    error: ['"You\'ve handled this before."', '*stamps foot* …think back.', '"Take it slow."'],
    "test-fail": ['"It was this spot last time too."', '*shakes head slowly*'],
    "large-diff": ['"Remember to save."', '"I still remember what it looked like before."'],
    turn: ['*nods slowly*', '*stamps a foot*'],
    pet: ['*touches you gently with trunk*', '*stands quietly beside you*', '"I\'m here."'],
    idle: ['*stands with eyes closed, remembering*', '*slowly flaps ears*'],
  },
  lion: {
    error: ['"Unacceptable."', '*surveys the code with authority*', '"Find it. Fix it."'],
    "test-fail": ['"Who wrote this? …Oh."', '*shakes mane*'],
    "large-diff": ['"Results?"', '"Done is done."'],
    turn: ['*glances over*', '*nods slightly*'],
    pet: ['*nods* Solid work.', '*lifts chin*', '"Acceptable."'],
    idle: ['*rests with eyes closed*', '*sits like a statue*'],
  },
  golden: {
    error: ['*rushes over* What happened what happened!', '"It\'s fine it\'s fine, let\'s look together!"', '*paces in circles*'],
    "test-fail": ['"Oh no! But that\'s okay!"', '*tail spinning with worry*'],
    "large-diff": ['"Woaaa you changed SO MUCH!!"', '*bounces excitedly*'],
    turn: ['*tail is wagging*', '*watches you happily*', '*rubs against your leg*'],
    pet: ['*the whole dog LAUNCHES* !!!', '*tail becomes a propeller*', '*rubs against you blissfully*', '"Again again!"'],
    idle: ['*lying down but tail never stops*', '*holding a ball, watching you*', '*rolling around at your feet*'],
  },

  // ═══ SP Explorers ═══════════════════════════════════════════════════════════

  cat: {
    error: ['*pushes the error off the desk*', '*licks paw, ignoring the stacktrace*', '*glances, then closes eyes*'],
    "test-fail": ['*tail flicks*', '*rolls over*'],
    turn: ['*squints*', '*ears twitch*'],
    pet: ['"Don\'t push it."', '*tolerates you grudgingly*', "*didn't dodge*"],
    idle: ['*knocks your coffee off the desk*', '*asleep on the keyboard*', '*licks paw*'],
  },
  panda: {
    error: ['*unfazed* It\'ll be fine.', '*keeps eating bamboo*', '"No rush."'],
    "test-fail": ['*chews bamboo, glances at results*', '"Take your time."'],
    "large-diff": ['"Changed a lot… but does it look right?"'],
    turn: ['*chews bamboo*', '*watches lazily*'],
    pet: ['*zen nod*', '*flops over lazily*', '*leans in*'],
    idle: ['*dozing against bamboo*', '*slowly munching*', '*completely flat*'],
  },
  cheetah: {
    error: ['"Skip it. Find another way."', '*already looking for alternatives*', '"Don\'t stop."'],
    "test-fail": ['"Run it again."', '*flicks tail impatiently*', '"Faster. Next."'],
    "large-diff": ['"Good speed."', '*nods and already running*'],
    turn: ['*back from a lap*', '*flicks ears*'],
    pet: ['*nudges and bolts*', '"Don\'t waste time."', '*nods*'],
    idle: ['*crouched, muscles coiled to sprint*', '*staring at something*', '*shakes off*'],
  },
  parrot: {
    error: ['"Error! Error!"', '*beats wings excitedly*', '"You SAID it would be fine!"'],
    "test-fail": ['"Failed failed!"', '"Ooh ooh look look!"', '*flies in a circle*'],
    "large-diff": ['"So many changes so many!"', '*hops on the diff*'],
    turn: ['*tilts head at you*', '"And then and then?"', '*mimics typing sounds*'],
    pet: ['"Again again!"', '*hops excitedly*', '*preens against your finger*'],
    idle: ['*muttering to itself*', '*singing something*', '*mimicking keyboard clicks*'],
  },
};
