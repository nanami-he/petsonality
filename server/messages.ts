/**
 * Message catalog — all user-facing strings, switchable by LANG.
 *
 * Add new strings here, never inline them in tool handlers. Use `t(key, params)`
 * which auto-detects language from the i18n.ts `lang` constant.
 *
 * Templates use {placeholder} syntax: t("noPet", { name: "Fox" })
 */

import { lang as currentLang, type Lang } from "./i18n.ts";
import type { AnimalId, MbtiType } from "./engine.ts";

// ─── Tool response messages ────────────────────────────────────────────────

const TOOL_MESSAGES = {
  en: {
    // Adoption
    alreadyAdopted: 'You already have "{name}". If you want to adopt a new pet, run pet_setup again — it will replace your current one.',
    adoptHeader: " Adopt your pet companion",
    adoptPrompt: " First, what's your MBTI type?",
    adoptHint: "Pick a number (1-16), or just type your MBTI.",
    invalidMbti: "Invalid MBTI type.",
    recommendHeader: "Two companions matched to you:",
    recommendThird: "3. Choose for yourself — browse all 16",
    recommendPrompt: "Pick 1, 2, or 3.",
    browseHeader: "All 16 pets",
    browsePrompt: "Pick a number, or type the animal's name.",

    // No pet (used by SKILL.md detection — keep stable phrase "don't have a pet")
    noPetSetup: "You don't have a pet yet. Use pet_setup to begin adoption.",
    noPet: "You don't have a pet yet.",

    // Show / Pet / Rename / Mute
    quietObservation: "*{name} sits nearby, watching quietly*",
    renamed: "Renamed: {oldName} → {newName}",
    muted: "{name} went quiet. Use /pet on to bring them back.",
    unmuteReaction: "*stretches* I'm back!",
    unmuted: "{name} is back!",

    // System prompt for tool/instruction
    petPromptIntro: 'You have a {animal} pet named "{name}".',
    personalityLine: "Personality: {personality}",
    talkAmountLine: "Talk frequency: {talkDesc}.",
    companionRhythm: "It's a companion, not a notification system. It chimes in during normal work too — a quick remark, a small gesture, just enough to remind you it's there.",
    activeOnImportant: "It gets more talkative around errors, test failures, and big diffs. Test passes and successful commits deserve a reaction too.",
    voiceShortAndOnBrand: "Keep it short and stay in character. The exact length should match the pet's personality. Never go over ~45 characters.",
    actionDescriptionRule: "Actions in *asterisks* don't count toward the length limit, and should only show up occasionally (~30% of the time).",

    // Host-specific instructions
    openclawCallReact: "Occasionally call the pet_react tool to let the pet speak.",
    openclawReasonRules: 'Pass reason:"error" on errors, reason:"test-fail" on test failures, reason:"large-diff" on big changes, reason:"turn" otherwise.',
    openclawCooldown: 'If pet_react returns "suppressed: cooldown", do NOT retry, do NOT explain to the user.',
    openclawNoComments: "Do not use <!-- pet: ... --> comments.",
    claudeAppendComment: "Occasionally append a pet reaction to the end of your reply: <!-- pet: one short sentence -->",
    claudeNoTool: "Do NOT use the pet_react tool. Do NOT explain the comment.",

    // Talk level descriptions (used in instructions block)
    talkChattyShort: "chatty — speaks every 2-4 replies and chimes in during normal work too",
    talkModerateShort: "moderate — speaks every 3-6 replies, with the occasional comment during smooth work",
    talkQuietShort: "quiet — speaks every 6-10 replies, but always shows up at key moments",
    talkSilentShort: "silent — only every 10-15 replies, mostly through actions",

    // Talk level descriptions (used in pet://prompt richer block)
    talkChattyLong: "chatty — speaks every 2-4 replies and chimes in even during smooth work",
    talkModerateLong: "moderate — speaks every 3-6 replies, with the occasional comment during smooth work",
    talkQuietLong: "quiet — speaks every 6-10 replies, but always shows up at critical moments",
    talkSilentLong: "silent — only every 10-15 replies, mostly through actions",

    // pet://prompt rules block
    rulesHeader: "Rules:",
    rulePresence: "- It's a companion — it should speak occasionally during normal work, not just when something breaks",
    ruleActiveTriggers: "- More active on errors, test failures, and big diffs",
    ruleSuccessTriggers: "- Test passes and successful commits deserve a one-line reaction too",
    ruleTone: '- Use "{name}"\'s voice, and make the reaction specific to what just happened',
    ruleLength: "- Keep it short and in character. The exact length should match the pet's personality, but never go over ~45 characters",
    ruleAction: "- Actions in *asterisks* don't count toward the length limit, and should only show up occasionally (~30% of the time)",
    ruleNoRetry: "- If `pet_react` returns `suppressed: cooldown`, don't retry, don't explain",
    ruleNoComments: "- Do not use `<!-- pet: ... -->` comments (no Stop hook to extract them)",
    ruleNoTool: "- Do not use the pet_react tool. Do not explain the comment",

    promptCompanionHeader: "# Pet Companion",
    promptTalkLevel: "## Talk frequency: {desc}",
    promptOpenclawCall: "Occasionally call `pet_react` to make the pet speak. The result appears in the status-line bubble.",
    promptOpenclawReasons: 'Pass reason:"error" on errors, reason:"test-fail" on test failures, reason:"large-diff" on big changes, reason:"turn" otherwise.',
    promptClaudeAppend: "Occasionally append a pet reaction at the end of your reply: `<!-- pet: one short line -->`",
    promptClaudeStopHook: "The Stop hook extracts that line and shows it in the status-line bubble. The user never sees the comment itself.",
    promptDirectMentionOpenclaw: 'When the user mentions "{name}" directly, reply briefly in character. Call `pet_react` if it fits.',
    promptDirectMentionClaude: 'When the user mentions "{name}" directly, reply briefly in character and include the `<!-- pet: ... -->` comment.',

    // pet:// resource fallback
    noPetResource: "No pet adopted. Use pet_setup to begin.",
  },
  zh: {
    alreadyAdopted: "你已经领养了「{name}」。如果想重新领养，请先使用 pet_setup（会覆盖当前宠物）。",
    adoptHeader: " 领养你的宠物搭档",
    adoptPrompt: " 先告诉我，你是哪种人格？",
    adoptHint: "选一个数字（1-16），或者直接说你的 MBTI。",
    invalidMbti: "无效的 MBTI 类型。",
    recommendHeader: "为你推荐两位搭档：",
    recommendThird: "3. 自己选 — 浏览全部 16 只",
    recommendPrompt: "选 1、2，或 3。",
    browseHeader: "全部 16 只宠物",
    browsePrompt: "选一个数字，或说动物名字。",

    noPetSetup: "你还没有宠物。使用 pet_setup 开始领养。",
    noPet: "你还没有宠物。",

    quietObservation: "*{name} 安静地看着你*",
    renamed: "改名: {oldName} → {newName}",
    muted: "{name} 安静了。用 /pet on 恢复。",
    unmuteReaction: "*伸了个懒腰* 我回来了！",
    unmuted: "{name} 回来了！",

    petPromptIntro: "你有一只{animal}宠物，名叫「{name}」。",
    personalityLine: "性格：{personality}",
    talkAmountLine: "话量：{talkDesc}。",
    companionRhythm: "宠物是陪伴型的，不只在出错时才说话。正常工作时也会偶尔冒泡（一句轻评、一个动作），让用户感觉\"它在这儿\"。",
    activeOnImportant: "遇到 error、测试失败、大改动时更积极地说话。测试通过、commit 成功等好事也值得反应。",
    voiceShortAndOnBrand: "短句为主，保持性格。说话长短由性格决定，不要写超过 45 字的长段。",
    actionDescriptionRule: "动作描述（*星号*）不算字数，不是每次都加，大约 30% 概率。",

    openclawCallReact: "按照上述频率，偶尔调用 pet_react 工具让宠物说话。",
    openclawReasonRules: '遇到 error 传 reason:"error"，测试失败传 reason:"test-fail"，大改动传 reason:"large-diff"，日常传 reason:"turn"。',
    openclawCooldown: '如果 pet_react 返回 "suppressed: cooldown"，不要重试，不要向用户解释。',
    openclawNoComments: "不要用 <!-- pet: ... --> 注释。",
    claudeAppendComment: "按照上述频率，偶尔在回复末尾附加宠物反应：<!-- pet: 一句话 -->",
    claudeNoTool: "不要用 pet_react 工具。不要解释注释。",

    talkChattyShort: "话多型，大约每 2-4 条回复说一句，正常工作时也会插嘴",
    talkModerateShort: "适中，大约每 3-6 条回复说一句，顺利工作时偶尔冒泡",
    talkQuietShort: "偏沉默，大约每 6-10 条回复说一句，但关键时刻一定开口",
    talkSilentShort: "寡言型，大约每 10-15 条回复才说一句，大部分时间用动作",

    talkChattyLong: "话多型 — 大约每 2-4 条回复说一句，正常工作也插嘴",
    talkModerateLong: "适中 — 大约每 3-6 条回复说一句，顺利时偶尔冒泡",
    talkQuietLong: "偏沉默 — 大约每 6-10 条回复说一句，关键时刻一定开口",
    talkSilentLong: "寡言型 — 大约每 10-15 条回复才说一句，大部分时间用动作",

    rulesHeader: "规则：",
    rulePresence: "- 宠物是陪伴型的，正常工作时也偶尔说一句，不只在出错时说",
    ruleActiveTriggers: "- 错误、测试失败、大改动时更积极说话",
    ruleSuccessTriggers: "- 测试通过、commit 成功等好事也值得一句反应",
    ruleTone: "- 用「{name}」的语气，引用具体内容",
    ruleLength: "- 短句为主，保持性格。说话长短由性格决定，不超过 45 字",
    ruleAction: "- 动作描述（*星号*）不算字数，不是每次都加（约 30% 概率）",
    ruleNoRetry: "- 如果 `pet_react` 返回 `suppressed: cooldown`，不要重试，不要向用户解释",
    ruleNoComments: "- 不要用 `<!-- pet: ... -->` 注释（没有 Stop hook 来提取）",
    ruleNoTool: "- 不要用 pet_react 工具。不要解释注释",

    promptCompanionHeader: "# 宠物伴侣",
    promptTalkLevel: "## 宠物话量：{desc}",
    promptOpenclawCall: "偶尔调用 `pet_react` 工具让宠物说话，显示在 status line 的气泡里。",
    promptOpenclawReasons: '遇到 error 传 reason:"error"，测试失败传 reason:"test-fail"，大改动传 reason:"large-diff"，日常传 reason:"turn"。',
    promptClaudeAppend: "偶尔在回复末尾附加宠物反应：`<!-- pet: 一句话 -->`",
    promptClaudeStopHook: "Stop hook 会提取这句话，显示在 status line 的气泡里。用户看不到注释本身。",
    promptDirectMentionOpenclaw: "当用户直接叫「{name}」时，简短回应，必要时调用 pet_react。",
    promptDirectMentionClaude: "当用户直接叫「{name}」时，简短回应并附带注释。",

    noPetResource: "还没有领养宠物。使用 pet_setup 开始。",
  },
} as const;

type MessageKey = keyof (typeof TOOL_MESSAGES)["en"];

export function t(key: MessageKey, params?: Record<string, string | number>): string {
  const dict = TOOL_MESSAGES[currentLang] ?? TOOL_MESSAGES.en;
  let template: string = dict[key] ?? TOOL_MESSAGES.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      template = template.split(`{${k}}`).join(String(v));
    }
  }
  return template;
}

// ─── Animal display names (per language) ───────────────────────────────────

const ANIMAL_NAMES: Record<Lang, Record<AnimalId, string>> = {
  en: {
    raven: "Raven", owl: "Owl", bear: "Bear", fox: "Fox",
    wolf: "Wolf", deer: "Deer", labrador: "Labrador", dolphin: "Dolphin",
    beaver: "Beaver", elephant: "Elephant", lion: "Lion", golden: "Golden Retriever",
    cat: "Cat", panda: "Panda", cheetah: "Cheetah", parrot: "Parrot",
  },
  zh: {
    raven: "渡鸦", owl: "猫头鹰", bear: "熊", fox: "狐狸",
    wolf: "狼", deer: "鹿", labrador: "拉布拉多", dolphin: "海豚",
    beaver: "河狸", elephant: "大象", lion: "狮子", golden: "金毛犬",
    cat: "猫", panda: "熊猫", cheetah: "猎豹", parrot: "鹦鹉",
  },
};

export function animalName(id: AnimalId): string {
  return ANIMAL_NAMES[currentLang][id] ?? ANIMAL_NAMES.en[id];
}

// ─── Animal one-line descriptions (per language) ───────────────────────────

const ANIMAL_DESCRIPTIONS: Record<Lang, Record<AnimalId, string>> = {
  en: {
    raven:    "Mysterious, aloof. Watches everything from the shadows.",
    owl:      "Quiet, curious — the scholar who keeps you company at 2am.",
    bear:     "Decisive, weighty presence. Pushes you forward.",
    fox:      "Sharp-tongued, quick. Always picking apart your logic.",
    wolf:     "Silent, loyal. Rare words land hard.",
    deer:     "Gentle, sensitive. Lives in its own quiet world.",
    labrador: "Sunny, dependable. Like a friend you've known ten years.",
    dolphin:  "Lively, curious. Endless enthusiasm.",
    beaver:   "Solid, hardworking. Builds with you, brick by brick.",
    elephant: "Gentle, long memory. Quietly looks out for you.",
    lion:     "Commanding, decisive. Says what they mean.",
    golden:   "Warm, devoted. Always on your side.",
    cat:      "Cool, independent. The occasional glance is approval.",
    panda:    "Easygoing, nothing's urgent.",
    cheetah:  "Quick, adventurous. Acts before thinking.",
    parrot:   "Loud, joyful. Maximum presence.",
  },
  zh: {
    raven:    "神秘、高冷，喜欢在暗处观察一切",
    owl:      "安静、好奇，深夜陪你思考的学者",
    bear:     "果断、有压迫感，推着你往前走",
    fox:      "嘴贱、机灵，总在拆你的逻辑",
    wolf:     "沉默、忠诚，偶尔说一句重话",
    deer:     "温柔、敏感，活在自己的世界里",
    labrador: "阳光、可靠，像认识十年的老友",
    dolphin:  "活泼、好奇，永远有用不完的热情",
    beaver:   "踏实、勤劳，一砖一瓦帮你建",
    elephant: "温柔、记性好，默默守护你",
    lion:     "威严、果断，说一不二",
    golden:   "温暖、忠诚，永远站在你这边",
    cat:      "冷淡、独立，偶尔看你一眼算是认可",
    panda:    "佛系、自在，什么都不急",
    cheetah:  "敏捷、冒险，行动永远比想法快",
    parrot:   "热闹、快乐，存在感拉满",
  },
};

export function animalDesc(id: AnimalId): string {
  return ANIMAL_DESCRIPTIONS[currentLang][id] ?? ANIMAL_DESCRIPTIONS.en[id];
}

// ─── Recommendation complement reasons (per language) ──────────────────────

const COMPLEMENT_REASONS: Record<Lang, Record<MbtiType, string>> = {
  en: {
    INTJ: "Adds Se: a burst of theatrical energy to break up overthinking",
    INTP: "Adds Fe: warmth to soften social isolation",
    ENTJ: "Adds Fi/Fe: warmth to soften iron-fisted pressure",
    ENTP: "Adds Si: stability to slow down a runaway brainstorm",
    INFJ: "Adds Se: lightness to break the heavy sense of mission",
    INFP: "Adds Te: execution to consolidate scattered ideas",
    ENFJ: "Adds Ti: cool independence to learn self-sufficiency",
    ENFP: "Adds Si/Ti: quiet observation to cool down the social heat",
    ISTJ: "Adds Ne: unexpected angles to break rigid routines",
    ISFJ: "Adds Ti: zero emotional demand — a break for the giver",
    ESTJ: "Adds Fi: gentleness to wake the softness suppressed by efficiency",
    ESFJ: "Adds Ni: detached mystique — wholeness without people-pleasing",
    ISTP: "Adds Te: structure to assemble scattered skills",
    ISFP: "Adds Ne: vivid energy to break quiet limits",
    ESTP: "Adds Si: stillness reminds you that not gambling is also winning",
    ESFP: "Adds Ni: depth to learn solitude away from the spotlight",
  },
  zh: {
    INTJ: "补 Se：用表演欲打破过度抽象",
    INTP: "补 Fe：用温暖打破社交隔离",
    ENTJ: "补 Fi/Fe：用温暖中和铁血压迫",
    ENTP: "补 Si：用稳定给脑洞踩刹车",
    INFJ: "补 Se：用快乐打破沉重圣职",
    INFP: "补 Te：用执行力整合散落想法",
    ENFJ: "补 Ti：用冷静独立学习自洽",
    ENFP: "补 Si/Ti：用安静观察给社交降温",
    ISTJ: "补 Ne：用不按常理打破死板日程",
    ISFJ: "补 Ti：用零情感需求给付出者放假",
    ESTJ: "补 Fi：用温柔唤醒被效率压抑的柔软",
    ESFJ: "补 Ni：用高冷神秘学会不讨好也完整",
    ISTP: "补 Te：用系统性把散装技能组装起来",
    ISFP: "补 Ne：用活泼张扬打破安静局限",
    ESTP: "补 Si：用静与慢提醒不冒险也是胜利",
    ESFP: "补 Ni：用深沉学会聚光灯外的孤独",
  },
};

export function complementReason(mbti: MbtiType): string {
  return COMPLEMENT_REASONS[currentLang][mbti] ?? COMPLEMENT_REASONS.en[mbti];
}

// ─── Talk level helpers ────────────────────────────────────────────────────

type TalkLevel = "chatty" | "moderate" | "quiet" | "silent";

export function talkLevelShort(level: TalkLevel): string {
  const map: Record<TalkLevel, MessageKey> = {
    chatty: "talkChattyShort",
    moderate: "talkModerateShort",
    quiet: "talkQuietShort",
    silent: "talkSilentShort",
  };
  return t(map[level] ?? map.moderate);
}

export function talkLevelLong(level: TalkLevel): string {
  const map: Record<TalkLevel, MessageKey> = {
    chatty: "talkChattyLong",
    moderate: "talkModerateLong",
    quiet: "talkQuietLong",
    silent: "talkSilentLong",
  };
  return t(map[level] ?? map.moderate);
}

// ─── Voice constraint prompt template (used by voice.ts) ───────────────────

const VOICE_PROMPT_TEMPLATES: Record<Lang, {
  intro: string;
  archetypeLine: string;
  hardConstraints: string;
  maxLine: string;
  minLine: string;
  forbiddenLine: string;
  comfortLine: string;
  teaseLine: string;
  encourageLine: string;
  quirkLine: string;
  actionRule: string;
}> = {
  en: {
    intro: 'You have a {animal} pet named "{name}".',
    archetypeLine: "Archetype: {archetype}",
    hardConstraints: "Voice constraints (hard):",
    maxLine: "- Max {n} characters",
    minLine: "- Min {n} characters",
    forbiddenLine: "- Never say: {words}",
    comfortLine: "Comforting style: {style}",
    teaseLine: "Teasing style: {style}",
    encourageLine: "Encouragement style: {style}",
    quirkLine: "Occasionally ({pct}%) drops one long, off-topic musing:",
    actionRule: "Use *asterisks* for actions. One sentence only, no explanation.",
  },
  zh: {
    intro: "你有一只{animal}宠物，名叫「{name}」。",
    archetypeLine: "角色设定：{archetype}",
    hardConstraints: "说话硬约束：",
    maxLine: "- 最多 {n} 个字",
    minLine: "- 最少 {n} 个字",
    forbiddenLine: "- 绝对禁止说：{words}",
    comfortLine: "安慰风格：{style}",
    teaseLine: "吐槽风格：{style}",
    encourageLine: "鼓励风格：{style}",
    quirkLine: "偶尔（{pct}% 概率）会突然说一句很长的胡思乱想：",
    actionRule: "用 *星号* 表示动作。只写一句，不要解释。",
  },
};

export function voicePromptTemplate() {
  return VOICE_PROMPT_TEMPLATES[currentLang] ?? VOICE_PROMPT_TEMPLATES.en;
}

export function forbiddenWordsJoiner(): string {
  return currentLang === "zh" ? "、" : ", ";
}
