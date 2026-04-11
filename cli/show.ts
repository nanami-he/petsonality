/**
 * typet show — display current pet in terminal
 */

import { ANIMAL_DISPLAY, ANIMAL_DESC } from "../server/engine.ts";
import { loadPet, loadReaction } from "../server/state.ts";
import { renderPetCard } from "../server/art.ts";

const pet = loadPet();

if (!pet?.adopted) {
  console.log("No pet found. Run 'typet install' first, then use /pet to adopt.");
  process.exit(1);
}

const display = ANIMAL_DISPLAY[pet.petId];
const reaction = loadReaction();
const reactionText = reaction?.reaction;

const card = renderPetCard(
  pet.petId,
  pet.petName,
  `${display?.cn} · ${pet.personality}`,
  reactionText,
  [
    `mood: ${pet.mood}`,
    `interactions: ${pet.interactionCount}`,
  ],
);

console.log("");
console.log(card);
console.log("");
