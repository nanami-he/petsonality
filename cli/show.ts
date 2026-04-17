/**
 * petsonality show — display current pet in terminal
 */

import { loadPet, loadReaction } from "../server/state.ts";
import { renderPetCard } from "../server/art.ts";
import { animalName } from "../server/messages.ts";

const pet = loadPet();

if (!pet?.adopted) {
  console.log("No pet found. Run 'petsonality install' first, then use /pet to adopt.");
  process.exit(1);
}

const reaction = loadReaction();
const reactionText = reaction?.reaction;

const card = renderPetCard(
  pet.petId,
  pet.petName,
  `${animalName(pet.petId)} · ${pet.personality}`,
  reactionText,
);

console.log("");
console.log(card);
console.log("");
