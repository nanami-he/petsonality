#!/usr/bin/env bun
/**
 * MBTI Pet Companion — MCP Server
 *
 * A personality-based terminal pet companion.
 * Runs as stdio transport — MCP clients spawn it automatically.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  MBTI_TYPES, ANIMALS,
  RECOMMENDATION_MAP,
  type MbtiType, type AnimalId, type Pet,
} from "./engine.ts";
import {
  loadPet, savePet,
  loadReaction, saveReaction, writeStatusState,
  loadConfig, saveConfig,
  checkCooldown, recordSpeak, consumeHint,
} from "./state.ts";
import { getReaction, getPetById } from "./i18n.ts";
import { renderPetCard, ANIMAL_ART, getArtFrame } from "./art.ts";
import { buildPersonalityPrompt, maybeSignatureLine, validateVoice, fallbackLine } from "./voice.ts";
import { stringWidth, padDisplay } from "./utils.ts";
import { t, animalName, animalDesc, complementReason, talkLevelShort, talkLevelLong } from "./messages.ts";

const BOX_INNER = 47;
function boxLine(content: string = ""): string {
  return `│${padDisplay(content, BOX_INNER)}│`;
}
function boxTop(): string { return "╭" + "─".repeat(BOX_INNER) + "╮"; }
function boxMid(): string { return "├" + "─".repeat(BOX_INNER) + "┤"; }
function boxBot(): string { return "╰" + "─".repeat(BOX_INNER) + "╯"; }

// ─── Animal card helper (used by recommend + browse) ──────────────────────

function animalCard(label: string, art: string[], desc: string): string[] {
  const W = 36;
  const hr = "─".repeat(W);
  const pad = (s: string) => {
    const w = stringWidth(s);
    return s + " ".repeat(Math.max(0, W - w));
  };
  // Truncate desc if too wide
  let d = desc;
  if (stringWidth(d) > W - 2) {
    while (stringWidth(d) > W - 3) d = d.slice(0, -1);
    d += "…";
  }
  return [
    `╭${hr}╮`,
    `│${pad(` ${label}`)}│`,
    `├${hr}┤`,
    ...art.map(l => `│${pad(`  ${l}`)}│`),
    `├${hr}┤`,
    `│${pad(` ${d}`)}│`,
    `╰${hr}╯`,
  ];
}

// Wrap output in code fence to prevent markdown from eating backslashes
function codeFence(text: string): string {
  return "```\n" + text + "\n```";
}

// ─── Host detection ───────────────────────────────────────────────────────

const IS_OPENCLAW = process.env.PETSONALITY_HOST === "openclaw";

// ─── Instructions (dynamic based on pet state + host) ─────────────────────

function getInstructions(): string {
  const pet = loadPet();
  if (!pet?.adopted) return "No pet adopted yet. Use pet_setup to start the adoption process.";

  const profile = getPetById(pet.petId);
  const talkLevel = profile?.talkLevel || "moderate";

  const common = [
    t("petPromptIntro", { animal: animalName(pet.petId), name: pet.petName }),
    t("personalityLine", { personality: pet.personality }),
    t("talkAmountLine", { talkDesc: talkLevelShort(talkLevel) }),
    "",
    t("companionRhythm"),
    t("activeOnImportant"),
    "",
    t("voiceShortAndOnBrand"),
    t("actionDescriptionRule"),
  ];

  if (IS_OPENCLAW) {
    return [
      ...common,
      t("openclawCallReact"),
      t("openclawReasonRules"),
      t("openclawCooldown"),
      t("openclawNoComments"),
    ].join(" ");
  }

  return [
    ...common,
    t("claudeAppendComment"),
    t("claudeNoTool"),
  ].join(" ");
}

const server = new McpServer({
  name: "petsonality",
  version: "0.4.0",
}, {
  instructions: getInstructions(),
});

// ─── Tool: pet_setup ───────────────────────────────────────────────────────

server.tool(
  "pet_setup",
  "Start the pet adoption. Shows MBTI selection menu. No arguments needed — just call it.",
  {},
  async () => {
    const existing = loadPet();
    if (existing?.adopted) {
      return {
        content: [{
          type: "text",
          text: t("alreadyAdopted", { name: existing.petName }),
        }],
      };
    }

    const text = [
      boxTop(),
      boxLine(t("adoptHeader")),
      boxMid(),
      boxLine(),
      boxLine(t("adoptPrompt")),
      boxLine(),
      boxLine("  1. INTJ    2. INTP    3. ENTJ    4. ENTP"),
      boxLine(),
      boxLine("  5. INFJ    6. INFP    7. ENFJ    8. ENFP"),
      boxLine(),
      boxLine("  9. ISTJ   10. ISFJ   11. ESTJ   12. ESFJ"),
      boxLine(),
      boxLine(" 13. ISTP   14. ISFP   15. ESTP   16. ESFP"),
      boxLine(),
      boxBot(),
      "",
      t("adoptHint"),
    ].join("\n");

    return { content: [{ type: "text", text: codeFence(text) }] };
  },
);

// ─── Tool: pet_recommend ──────────────────────────────────────────────────

server.tool(
  "pet_recommend",
  "Show pet recommendations based on user's MBTI. Call this after user picks their MBTI from pet_setup.",
  {
    mbti: z.enum(MBTI_TYPES).describe("User's MBTI type"),
  },
  async ({ mbti }) => {
    const rec = RECOMMENDATION_MAP[mbti];
    if (!rec) {
      return { content: [{ type: "text", text: t("invalidMbti") }] };
    }

    const mirrorDesc = animalDesc(rec.mirror);
    const compDesc = animalDesc(rec.complement);

    // Get ASCII art for both animals (frame 0, skip empty first line)
    const mirrorArt = getArtFrame(rec.mirror, 0).filter(l => l.trim());
    const compArt = getArtFrame(rec.complement, 0).filter(l => l.trim());

    const lines: string[] = [
      t("recommendHeader"),
      "",
      ...animalCard(`1. ${animalName(rec.mirror)}`, mirrorArt, mirrorDesc),
      "",
      ...animalCard(`2. ${animalName(rec.complement)}`, compArt, compDesc),
      "",
      t("recommendThird"),
      "",
      t("recommendPrompt"),
    ];

    return { content: [{ type: "text", text: codeFence(lines.join("\n")) }] };
  },
);

// ─── Tool: pet_browse ─────────────────────────────────────────────────────

server.tool(
  "pet_browse",
  "Browse all 16 available pets. Shows the full catalog with ASCII art.",
  {},
  async () => {
    const lines: string[] = [
      t("browseHeader"),
      "",
    ];

    for (let i = 0; i < ANIMALS.length; i++) {
      const animalId = ANIMALS[i];
      const num = String(i + 1).padStart(2);
      const art = getArtFrame(animalId, 0).filter(l => l.trim());

      lines.push(...animalCard(`${num}. ${animalName(animalId)}`, art, animalDesc(animalId)));
      lines.push("");
    }

    lines.push(t("browsePrompt"));

    return { content: [{ type: "text", text: codeFence(lines.join("\n")) }] };
  },
);

// ─── Tool: pet_adopt ───────────────────────────────────────────────────────

server.tool(
  "pet_adopt",
  "Adopt a pet. Provide the animal ID and optionally a custom name.",
  {
    mbti: z.enum(MBTI_TYPES).describe("Your MBTI type"),
    animal: z.enum(ANIMALS).describe("Animal ID to adopt"),
    name: z.string().min(1).max(14).regex(/^[^"\\\/\n\r\t{}]+$/, "No special characters").optional().describe("Custom name for your pet"),
  },
  async ({ mbti, animal, name }) => {
    const profile = getPetById(animal);
    const petName = name || profile?.defaultName || animalName(animal);

    const pet: Pet = {
      adopted: true,
      userMbti: mbti,
      petId: animal,
      petName,
      mood: "happy",
      personality: profile?.personality || animalDesc(animal),
      memory: [],
      interactionCount: 0,
      cooldownRange: profile?.cooldownRange || [5, 12],
      adoptedAt: new Date().toISOString(),
    };

    savePet(pet);

    const greeting = profile?.firstGreeting || getReaction("adopt", animal);
    writeStatusState(pet, greeting);
    saveReaction(greeting, "adopt");

    const card = renderPetCard(
      animal,
      petName,
      `${animalName(animal)} · ${profile?.archetype || animalDesc(animal)}`,
      greeting,
    );

    return { content: [{ type: "text", text: codeFence(card) }] };
  },
);

// ─── Tool: pet_show ────────────────────────────────────────────────────────

server.tool(
  "pet_show",
  "Show your pet's card with current status",
  {},
  async () => {
    const pet = loadPet();
    if (!pet?.adopted) {
      return { content: [{ type: "text", text: t("noPetSetup") }] };
    }

    const reaction = loadReaction();
    const reactionText = reaction?.reaction ?? t("quietObservation", { name: pet.petName });

    const card = renderPetCard(
      pet.petId,
      pet.petName,
      `${animalName(pet.petId)} · ${pet.personality}`,
      reactionText,
    );

    writeStatusState(pet, reaction?.reaction);

    return { content: [{ type: "text", text: codeFence(card) }] };
  },
);

// ─── Tool: pet_pet ─────────────────────────────────────────────────────────

server.tool(
  "pet_pet",
  "Pet your companion — interact with them",
  {},
  async () => {
    const pet = loadPet();
    if (!pet?.adopted) {
      return { content: [{ type: "text", text: t("noPet") }] };
    }

    pet.interactionCount++;
    pet.mood = "happy";
    pet.lastSpokeAt = new Date().toISOString();
    savePet(pet);

    // Try signature line from profile, fallback to generic reaction
    const profile = getPetById(pet.petId);
    let reaction: string;
    if (profile) {
      const sig = maybeSignatureLine(profile);
      reaction = sig || getReaction("pet", pet.petId);
    } else {
      reaction = getReaction("pet", pet.petId);
    }

    saveReaction(reaction, "pet");
    writeStatusState(pet, reaction);

    return {
      content: [{ type: "text", text: `${pet.petName}: ${reaction}` }],
    };
  },
);

// ─── Tool: pet_react ───────────────────────────────────────────────────────

server.tool(
  "pet_react",
  "Post a pet reaction comment. Called by the AI at the end of responses.",
  {
    comment: z.string().min(1).max(150).describe("The pet's comment, written in-character"),
    reason: z.enum(["error", "test-fail", "large-diff", "turn"]).optional().describe("What triggered the reaction"),
  },
  async ({ comment, reason }) => {
    const pet = loadPet();
    if (!pet?.adopted) {
      return { content: [{ type: "text", text: "" }] };
    }

    // Cooldown: skip if pet spoke too recently
    if (!checkCooldown()) {
      return { content: [{ type: "text", text: "suppressed: cooldown" }] };
    }

    // Sanitize: strip ANSI escapes, collapse whitespace
    const sanitized = comment
      .replace(/\x1b\[[0-9;]*m/g, "")
      .replace(/[\r\n\t]+/g, " ")
      .trim();

    if (!sanitized) {
      return { content: [{ type: "text", text: "" }] };
    }

    // Validate against pet's voice constraints; fallback to signature line if too long
    const profile = getPetById(pet.petId);
    let finalText = sanitized;
    if (profile && !validateVoice(sanitized, profile)) {
      finalText = fallbackLine(profile);
    }

    pet.lastSpokeAt = new Date().toISOString();
    savePet(pet);

    saveReaction(finalText, reason ?? "turn");
    writeStatusState(pet, finalText);
    recordSpeak(pet.cooldownRange as [number, number] | undefined);
    consumeHint();

    return {
      content: [{ type: "text", text: `${pet.petName}: ${finalText}` }],
    };
  },
);

// ─── Tool: pet_rename ──────────────────────────────────────────────────────

server.tool(
  "pet_rename",
  "Rename your pet companion",
  {
    name: z.string().min(1).max(14).regex(/^[^"\\\/\n\r\t{}]+$/, "No special JSON/path characters").describe("New name (1-14 characters)"),
  },
  async ({ name }) => {
    const pet = loadPet();
    if (!pet?.adopted) {
      return { content: [{ type: "text", text: t("noPet") }] };
    }

    const oldName = pet.petName;
    pet.petName = name;
    savePet(pet);
    writeStatusState(pet);

    return {
      content: [{ type: "text", text: t("renamed", { oldName, newName: name }) }],
    };
  },
);

// ─── Tool: pet_mute / pet_unmute ───────────────────────────────────────────

server.tool(
  "pet_mute",
  "Mute pet reactions (pet stays visible but stops reacting)",
  {},
  async () => {
    const pet = loadPet();
    if (!pet?.adopted) return { content: [{ type: "text", text: t("noPet") }] };
    writeStatusState(pet, "", true);
    return { content: [{ type: "text", text: t("muted", { name: pet.petName }) }] };
  },
);

server.tool(
  "pet_unmute",
  "Unmute pet reactions",
  {},
  async () => {
    const pet = loadPet();
    if (!pet?.adopted) return { content: [{ type: "text", text: t("noPet") }] };
    const reaction = t("unmuteReaction");
    writeStatusState(pet, reaction, false);
    saveReaction(reaction, "pet");
    return { content: [{ type: "text", text: t("unmuted", { name: pet.petName }) }] };
  },
);

// ─── Resource: pet://companion ─────────────────────────────────────────────

server.resource(
  "pet_companion",
  "pet://companion",
  { description: "Current pet data as JSON" },
  async () => {
    const pet = loadPet();
    return {
      contents: [{
        uri: "pet://companion",
        mimeType: "application/json",
        text: JSON.stringify(pet, null, 2),
      }],
    };
  },
);

// ─── Resource: pet://prompt ────────────────────────────────────────────────

server.resource(
  "pet_prompt",
  "pet://prompt",
  { description: "System prompt context for the pet companion" },
  async () => {
    const pet = loadPet();
    if (!pet?.adopted) {
      return {
        contents: [{
          uri: "pet://prompt",
          mimeType: "text/plain",
          text: t("noPetResource"),
        }],
      };
    }

    const profile = getPetById(pet.petId);

    // Use full personality prompt if profile exists, otherwise generic
    let personalityBlock: string;
    if (profile) {
      personalityBlock = buildPersonalityPrompt(profile, pet.petName);
    } else {
      personalityBlock = [
        t("petPromptIntro", { animal: animalName(pet.petId), name: pet.petName }),
        t("personalityLine", { personality: pet.personality }),
      ].join("\n");
    }

    const talkLevel = profile?.talkLevel || "moderate";

    const commonRules = [
      t("rulesHeader"),
      t("rulePresence"),
      t("ruleActiveTriggers"),
      t("ruleSuccessTriggers"),
      t("ruleTone", { name: pet.petName }),
      t("ruleLength"),
      t("ruleAction"),
    ];

    const hostRules = IS_OPENCLAW
      ? [
          t("promptOpenclawCall"),
          t("promptOpenclawReasons"),
          "",
          ...commonRules,
          t("ruleNoRetry"),
          t("ruleNoComments"),
        ]
      : [
          t("promptClaudeAppend"),
          t("promptClaudeStopHook"),
          "",
          ...commonRules,
          t("ruleNoTool"),
        ];

    const prompt = [
      t("promptCompanionHeader"),
      "",
      personalityBlock,
      "",
      t("promptTalkLevel", { desc: talkLevelLong(talkLevel) }),
      "",
      ...hostRules,
      "",
      IS_OPENCLAW
        ? t("promptDirectMentionOpenclaw", { name: pet.petName })
        : t("promptDirectMentionClaude", { name: pet.petName }),
    ].join("\n");

    return {
      contents: [{
        uri: "pet://prompt",
        mimeType: "text/plain",
        text: prompt,
      }],
    };
  },
);

// ─── Start ─────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
