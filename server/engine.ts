/**
 * MBTI Pet engine — animal selection + recommendation
 * Replaces buddy's hash-based generation with MBTI-driven adoption.
 */

// ─── Animal IDs ────────────────────────────────────────────────────────────

export const ANIMALS = [
  "raven", "owl", "bear", "fox",
  "wolf", "deer", "labrador", "dolphin",
  "beaver", "elephant", "lion", "golden",
  "cat", "panda", "cheetah", "parrot",
] as const;

export type AnimalId = typeof ANIMALS[number];

// ─── MBTI types ────────────────────────────────────────────────────────────

export const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
] as const;

export type MbtiType = typeof MBTI_TYPES[number];

// ─── MBTI → Animal mapping ────────────────────────────────────────────────

export const MBTI_ANIMAL_MAP: Record<MbtiType, AnimalId> = {
  INTJ: "raven",    INTP: "owl",      ENTJ: "bear",     ENTP: "fox",
  INFJ: "wolf",     INFP: "deer",     ENFJ: "labrador", ENFP: "dolphin",
  ISTJ: "beaver",   ISFJ: "elephant", ESTJ: "lion",     ESFJ: "golden",
  ISTP: "cat",      ISFP: "panda",    ESTP: "cheetah",  ESFP: "parrot",
};

// ─── Recommendation (mirror + complement) ─────────────────────────────────

export interface Recommendation {
  mirror: AnimalId;
  complement: AnimalId;
  complementReason: string;
}

export const RECOMMENDATION_MAP: Record<MbtiType, Recommendation> = {
  INTJ: { mirror: "raven",    complement: "parrot",   complementReason: "补 Se：用表演欲打破过度抽象" },
  INTP: { mirror: "owl",      complement: "labrador", complementReason: "补 Fe：用温暖打破社交隔离" },
  ENTJ: { mirror: "bear",     complement: "golden",   complementReason: "补 Fi/Fe：用温暖中和铁血压迫" },
  ENTP: { mirror: "fox",      complement: "beaver",   complementReason: "补 Si：用稳定给脑洞踩刹车" },
  INFJ: { mirror: "wolf",     complement: "parrot",   complementReason: "补 Se：用快乐打破沉重圣职" },
  INFP: { mirror: "deer",     complement: "lion",     complementReason: "补 Te：用执行力整合散落想法" },
  ENFJ: { mirror: "labrador", complement: "cat",      complementReason: "补 Ti：用冷静独立学习自洽" },
  ENFP: { mirror: "dolphin",  complement: "owl",      complementReason: "补 Si/Ti：用安静观察给社交降温" },
  ISTJ: { mirror: "beaver",   complement: "fox",      complementReason: "补 Ne：用不按常理打破死板日程" },
  ISFJ: { mirror: "elephant", complement: "cat",      complementReason: "补 Ti：用零情感需求给付出者放假" },
  ESTJ: { mirror: "lion",     complement: "deer",     complementReason: "补 Fi：用温柔唤醒被效率压抑的柔软" },
  ESFJ: { mirror: "golden",   complement: "raven",    complementReason: "补 Ni：用高冷神秘学会不讨好也完整" },
  ISTP: { mirror: "cat",      complement: "bear",     complementReason: "补 Te：用系统性把散装技能组装起来" },
  ISFP: { mirror: "panda",    complement: "dolphin",  complementReason: "补 Ne：用活泼张扬打破安静局限" },
  ESTP: { mirror: "cheetah",  complement: "beaver",   complementReason: "补 Si：用静与慢提醒不冒险也是胜利" },
  ESFP: { mirror: "parrot",   complement: "wolf",     complementReason: "补 Ni：用深沉学会聚光灯外的孤独" },
};

// ─── Animal display names ─────────────────────────────────────────────────

export const ANIMAL_DISPLAY: Record<AnimalId, { cn: string; emoji: string }> = {
  raven:    { cn: "渡鸦",     emoji: "" },
  owl:      { cn: "猫头鹰",   emoji: "" },
  bear:     { cn: "熊",       emoji: "" },
  fox:      { cn: "狐狸",     emoji: "" },
  wolf:     { cn: "狼",       emoji: "" },
  deer:     { cn: "鹿",       emoji: "" },
  labrador: { cn: "拉布拉多", emoji: "" },
  dolphin:  { cn: "海豚",     emoji: "" },
  beaver:   { cn: "河狸",     emoji: "" },
  elephant: { cn: "大象",     emoji: "" },
  lion:     { cn: "狮子",     emoji: "" },
  golden:   { cn: "金毛犬",   emoji: "" },
  cat:      { cn: "猫",       emoji: "" },
  panda:    { cn: "熊猫",     emoji: "" },
  cheetah:  { cn: "猎豹",     emoji: "" },
  parrot:   { cn: "鹦鹉",     emoji: "" },
};

// ─── Animal one-line descriptions ─────────────────────────────────────────

export const ANIMAL_DESC: Record<AnimalId, string> = {
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
};

// ─── Animal realistic colors (for card borders + statusline) ──────────────

export const ANIMAL_COLOR: Record<AnimalId, string> = {
  raven:    "\x1b[38;2;140;100;180m",  // 深紫（深色终端可见）
  owl:      "\x1b[38;2;160;120;60m",   // 棕褐
  bear:     "\x1b[38;2;120;72;40m",    // 深棕
  fox:      "\x1b[38;2;215;120;40m",   // 橘红
  wolf:     "\x1b[38;2;140;140;150m",  // 灰
  deer:     "\x1b[38;2;190;150;90m",   // 浅棕
  labrador: "\x1b[38;2;210;175;80m",   // 金黄
  dolphin:  "\x1b[38;2;160;165;170m",  // 灰（蓝色仅用于气泡和海浪）
  beaver:   "\x1b[38;2;140;90;50m",    // 深棕
  elephant: "\x1b[38;2;150;155;160m",  // 灰
  lion:     "\x1b[38;2;210;170;70m",   // 金棕
  golden:   "\x1b[38;2;220;185;90m",   // 金色
  cat:      "\x1b[38;2;230;160;50m",   // 橘黄
  panda:    "\x1b[38;2;220;220;215m",  // 暖白
  cheetah:  "\x1b[38;2;210;180;100m",  // 沙黄
  parrot:   "\x1b[38;2;50;180;80m",    // 翠绿
};

// ─── Pet companion state ──────────────────────────────────────────────────

export interface PetMemory {
  type: "event" | "milestone";
  text: string;
  createdAt: string;
}

export interface Pet {
  adopted: boolean;
  userMbti: MbtiType;
  petId: AnimalId;
  petName: string;
  mood: "happy" | "calm" | "sleepy" | "worried" | "proud";
  personality: string;
  memory: PetMemory[];
  interactionCount: number;
  cooldownRange?: [number, number]; // [min, max] minutes between speech
  lastSpokeAt?: string;
  adoptedAt: string;
}
