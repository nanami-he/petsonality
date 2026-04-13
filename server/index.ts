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
  MBTI_ANIMAL_MAP, RECOMMENDATION_MAP, ANIMAL_DISPLAY, ANIMAL_DESC,
  type MbtiType, type AnimalId, type Pet,
} from "./engine.ts";
import {
  loadPet, savePet,
  loadReaction, saveReaction, writeStatusState,
  loadConfig, saveConfig,
  checkCooldown, recordSpeak,
} from "./state.ts";
import { getReaction } from "./reactions.ts";
import { renderPetCard, ANIMAL_ART, getArtFrame } from "./art.ts";
import { getPetById } from "./pets.ts";
import { buildPersonalityPrompt, maybeSignatureLine, validateVoice, fallbackLine } from "./voice.ts";
import { stringWidth, padDisplay } from "./utils.ts";

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

  const display = ANIMAL_DISPLAY[pet.petId];
  const profile = getPetById(pet.petId);
  const talkLevel = profile?.talkLevel || "moderate";
  const talkDesc: Record<string, string> = {
    chatty: "话多型，大约每 3-5 条回复说一句",
    moderate: "适中，大约每 5-8 条回复说一句",
    quiet: "偏沉默，大约每 10-15 条回复说一句",
    silent: "寡言型，大约每 15-20 条回复才说一句",
  };

  const common = [
    `你有一只${display?.cn || pet.petId}宠物，名叫「${pet.petName}」。`,
    `性格：${pet.personality}`,
    `话量：${talkDesc[talkLevel] || talkDesc.moderate}。`,
    "",
    `不是每条都要！根据话量频率和对话内容判断要不要说。`,
    `遇到 bug、测试失败、大改动等关键时刻更可能说话。闲聊时少说。`,
    "",
    `短句为主，保持性格。说话长短由性格决定，不要写超过 45 字的长段。`,
    `动作描述（*星号*）不算字数，不是每次都加，大约 30% 概率。`,
  ];

  if (IS_OPENCLAW) {
    return [
      ...common,
      `按照上述频率，偶尔调用 pet_react 工具让宠物说话。`,
      `遇到 error 传 reason:"error"，测试失败传 reason:"test-fail"，大改动传 reason:"large-diff"，日常传 reason:"turn"。`,
      `如果 pet_react 返回 "suppressed: cooldown"，不要重试，不要向用户解释。`,
      `不要用 <!-- pet: ... --> 注释。`,
    ].join(" ");
  }

  return [
    ...common,
    `按照上述频率，偶尔在回复末尾附加宠物反应：<!-- pet: 一句话 -->`,
    `不要用 pet_react 工具。不要解释注释。`,
  ].join(" ");
}

const server = new McpServer({
  name: "petsonality",
  version: "0.2.0",
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
          text: `你已经领养了「${existing.petName}」。如果想重新领养，请先使用 pet_setup（会覆盖当前宠物）。`,
        }],
      };
    }

    const text = [
      boxTop(),
      boxLine(" 领养你的宠物搭档"),
      boxMid(),
      boxLine(),
      boxLine(" 先告诉我，你是哪种人格？"),
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
      "选一个数字（1-16），或者直接说你的 MBTI。",
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
      return { content: [{ type: "text", text: "无效的 MBTI 类型。" }] };
    }

    const mirrorInfo = ANIMAL_DISPLAY[rec.mirror];
    const compInfo = ANIMAL_DISPLAY[rec.complement];
    const mirrorDesc = ANIMAL_DESC[rec.mirror];
    const compDesc = ANIMAL_DESC[rec.complement];

    // Get ASCII art for both animals (frame 0, skip empty first line)
    const mirrorArt = getArtFrame(rec.mirror, 0).filter(l => l.trim());
    const compArt = getArtFrame(rec.complement, 0).filter(l => l.trim());

    const lines: string[] = [
      "为你推荐两位搭档：",
      "",
      ...animalCard(`1. ${mirrorInfo.cn}`, mirrorArt, mirrorDesc),
      "",
      ...animalCard(`2. ${compInfo.cn}`, compArt, compDesc),
      "",
      "3. 自己选 — 浏览全部 16 只",
      "",
      "选 1、2，或 3。",
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
      "全部 16 只宠物",
      "",
    ];

    for (let i = 0; i < ANIMALS.length; i++) {
      const animalId = ANIMALS[i];
      const d = ANIMAL_DISPLAY[animalId];
      const desc = ANIMAL_DESC[animalId];
      const num = String(i + 1).padStart(2);
      const art = getArtFrame(animalId, 0).filter(l => l.trim());

      lines.push(...animalCard(`${num}. ${d.cn}`, art, desc));
      lines.push("");
    }

    lines.push("选一个数字，或说动物名字。");

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
    name: z.string().min(1).max(14).optional().describe("Custom name for your pet"),
  },
  async ({ mbti, animal, name }) => {
    const display = ANIMAL_DISPLAY[animal];
    const profile = getPetById(animal);
    const petName = name || profile?.defaultName || display.cn;

    const pet: Pet = {
      adopted: true,
      userMbti: mbti,
      petId: animal,
      petName,
      mood: "happy",
      personality: profile?.personality || ANIMAL_DESC[animal],
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
      `${display.cn} · ${profile?.archetype || ANIMAL_DESC[animal]}`,
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
      return { content: [{ type: "text", text: "你还没有宠物。使用 pet_setup 开始领养。" }] };
    }

    const display = ANIMAL_DISPLAY[pet.petId];
    const reaction = loadReaction();
    const reactionText = reaction?.reaction ?? `*${pet.petName} 安静地看着你*`;

    const moodEmoji: Record<string, string> = {
      happy: "😊", calm: "😌", sleepy: "😴", worried: "😟", proud: "😤",
    };

    const card = renderPetCard(
      pet.petId,
      pet.petName,
      `${display?.cn} · ${pet.personality}`,
      reactionText,
      [
        `心情: ${moodEmoji[pet.mood] || "?"} ${pet.mood}`,
        `互动: ${pet.interactionCount} 次`,
      ],
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
      return { content: [{ type: "text", text: "你还没有宠物。" }] };
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
    name: z.string().min(1).max(14).describe("New name (1-14 characters)"),
  },
  async ({ name }) => {
    const pet = loadPet();
    if (!pet?.adopted) {
      return { content: [{ type: "text", text: "你还没有宠物。" }] };
    }

    const oldName = pet.petName;
    pet.petName = name;
    savePet(pet);
    writeStatusState(pet);

    return {
      content: [{ type: "text", text: `改名: ${oldName} → ${name}` }],
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
    if (!pet?.adopted) return { content: [{ type: "text", text: "你还没有宠物。" }] };
    writeStatusState(pet, "", true);
    return { content: [{ type: "text", text: `${pet.petName} 安静了。用 /pet on 恢复。` }] };
  },
);

server.tool(
  "pet_unmute",
  "Unmute pet reactions",
  {},
  async () => {
    const pet = loadPet();
    if (!pet?.adopted) return { content: [{ type: "text", text: "你还没有宠物。" }] };
    const reaction = "*伸了个懒腰* 我回来了！";
    writeStatusState(pet, reaction, false);
    saveReaction(reaction, "pet");
    return { content: [{ type: "text", text: `${pet.petName} 回来了！` }] };
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
          text: "No pet adopted. Use pet_setup to begin.",
        }],
      };
    }

    const display = ANIMAL_DISPLAY[pet.petId];
    const profile = getPetById(pet.petId);

    // Use full personality prompt if profile exists, otherwise generic
    let personalityBlock: string;
    if (profile) {
      personalityBlock = buildPersonalityPrompt(profile, pet.petName);
    } else {
      personalityBlock = [
        `你有一只${display?.cn || pet.petId}宠物，名叫「${pet.petName}」。`,
        `性格：${pet.personality}`,
      ].join("\n");
    }

    const talkLevel = profile?.talkLevel || "moderate";
    const talkGuide: Record<string, string> = {
      chatty: "话多型 — 大约每 3-5 条回复说一句，闲聊也可以插嘴",
      moderate: "适中 — 大约每 5-8 条回复说一句，有意义的时候才说",
      quiet: "偏沉默 — 大约每 10-15 条回复说一句，只在关键时刻开口",
      silent: "寡言型 — 大约每 15-20 条回复才说一句，大部分时间沉默",
    };

    const commonRules = [
      "规则：",
      "- 不是每条回复都要！按上述话量频率判断",
      "- 遇到 bug、测试失败、大改动等关键时刻更可能说话",
      "- 闲聊、简短问答时通常不说",
      `- 用「${pet.petName}」的语气，引用具体内容`,
      "- 短句为主，保持性格。说话长短由性格决定，不超过 45 字",
      "- 动作描述（*星号*）不算字数，不是每次都加（约 30% 概率）",
    ];

    const hostRules = IS_OPENCLAW
      ? [
          "偶尔调用 `pet_react` 工具让宠物说话，显示在 status line 的气泡里。",
          "遇到 error 传 reason:\"error\"，测试失败传 reason:\"test-fail\"，大改动传 reason:\"large-diff\"，日常传 reason:\"turn\"。",
          "",
          ...commonRules,
          "- 如果 `pet_react` 返回 `suppressed: cooldown`，不要重试，不要向用户解释",
          "- 不要用 `<!-- pet: ... -->` 注释（没有 Stop hook 来提取）",
        ]
      : [
          "偶尔在回复末尾附加宠物反应：`<!-- pet: 一句话 -->`",
          "Stop hook 会提取这句话，显示在 status line 的气泡里。用户看不到注释本身。",
          "",
          ...commonRules,
          "- 不要用 pet_react 工具。不要解释注释",
        ];

    const prompt = [
      "# 宠物伴侣",
      "",
      personalityBlock,
      "",
      `## 宠物话量：${talkGuide[talkLevel] || talkGuide.moderate}`,
      "",
      ...hostRules,
      "",
      IS_OPENCLAW
        ? `当用户直接叫「${pet.petName}」时，简短回应，必要时调用 pet_react。`
        : `当用户直接叫「${pet.petName}」时，简短回应并附带注释。`,
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
