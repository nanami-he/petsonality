import { describe, test, expect } from "bun:test";
import { ANIMALS, MBTI_TYPES, MBTI_ANIMAL_MAP, type AnimalId } from "./engine.ts";
import { LAUNCH_PETS, getPetById } from "./pets.ts";
import { validateVoice, fallbackLine } from "./voice.ts";
import { getReaction, type ReactionReason } from "./reactions.ts";

// ─── Coverage: all 16 animals have profiles ────────────────────────────────

describe("16/16 pet profiles exist", () => {
  for (const animal of ANIMALS) {
    test(`${animal} has a PetProfile`, () => {
      const profile = getPetById(animal);
      expect(profile).toBeDefined();
      expect(profile!.id).toBe(animal);
    });
  }
});

// ─── MBTI mapping consistency ──────────────────────────────────────────────

describe("MBTI mapping", () => {
  test("16 MBTI types map to 16 unique animals", () => {
    const mapped = MBTI_TYPES.map(m => MBTI_ANIMAL_MAP[m]);
    expect(new Set(mapped).size).toBe(16);
  });

  test("every mapped animal has a profile", () => {
    for (const mbti of MBTI_TYPES) {
      const animalId = MBTI_ANIMAL_MAP[mbti];
      const profile = getPetById(animalId);
      expect(profile).toBeDefined();
      expect(profile!.mbtiRef).toBe(mbti);
    }
  });
});

// ─── Voice constraints are well-formed ─────────────────────────────────────

describe("voice constraints", () => {
  for (const animal of ANIMALS) {
    const profile = getPetById(animal)!;
    const vc = profile.voiceConstraints;

    test(`${animal}: maxLength > minLength`, () => {
      expect(vc.maxLength).toBeGreaterThan(vc.minLength);
    });

    test(`${animal}: maxLength is reasonable (1-50)`, () => {
      expect(vc.maxLength).toBeGreaterThanOrEqual(1);
      expect(vc.maxLength).toBeLessThanOrEqual(50);
    });

    test(`${animal}: quirkFrequency in [0, 1]`, () => {
      expect(vc.quirkFrequency).toBeGreaterThanOrEqual(0);
      expect(vc.quirkFrequency).toBeLessThanOrEqual(1);
    });

    test(`${animal}: has at least 1 forbidden word`, () => {
      expect(vc.forbiddenWords.length).toBeGreaterThan(0);
    });

    test(`${animal}: has sentence patterns`, () => {
      expect(vc.sentencePattern.length).toBeGreaterThan(0);
    });
  }
});

// ─── Signature lines pass own voice validation ─────────────────────────────

describe("signature lines self-validate", () => {
  for (const animal of ANIMALS) {
    const profile = getPetById(animal)!;

    test(`${animal}: all signatureLines pass validateVoice`, () => {
      const failures: string[] = [];
      for (const line of profile.signatureLines) {
        if (!validateVoice(line, profile)) {
          failures.push(line);
        }
      }
      expect(failures).toEqual([]);
    });

    test(`${animal}: has at least 3 signatureLines`, () => {
      expect(profile.signatureLines.length).toBeGreaterThanOrEqual(3);
    });
  }
});

// ─── firstGreeting passes voice validation ─────────────────────────────────

describe("firstGreeting validation", () => {
  for (const animal of ANIMALS) {
    const profile = getPetById(animal)!;

    test(`${animal}: firstGreeting passes validateVoice`, () => {
      expect(validateVoice(profile.firstGreeting, profile)).toBe(true);
    });

    test(`${animal}: firstGreeting is non-empty`, () => {
      expect(profile.firstGreeting.length).toBeGreaterThan(0);
    });
  }
});

// ─── Forbidden words are actually forbidden ────────────────────────────────

describe("forbidden words enforcement", () => {
  const GLOBAL_BANNED = ["加油", "你真棒", "相信自己", "你可以的", "太厉害了", "继续努力", "为你骄傲"];

  for (const animal of ANIMALS) {
    const profile = getPetById(animal)!;

    test(`${animal}: global banned words are in forbiddenWords`, () => {
      for (const word of GLOBAL_BANNED) {
        expect(profile.voiceConstraints.forbiddenWords).toContain(word);
      }
    });

    test(`${animal}: signatureLines don't contain forbidden words`, () => {
      for (const line of profile.signatureLines) {
        for (const word of profile.voiceConstraints.forbiddenWords) {
          expect(line).not.toContain(word);
        }
      }
    });

    test(`${animal}: firstGreeting doesn't contain forbidden words`, () => {
      for (const word of profile.voiceConstraints.forbiddenWords) {
        expect(profile.firstGreeting).not.toContain(word);
      }
    });
  }
});

// ─── Talk level and cooldown range consistency ─────────────────────────────

describe("talkLevel ↔ cooldown consistency", () => {
  const LEVEL_ORDER = { chatty: 0, moderate: 1, quiet: 2, silent: 3 };

  for (const animal of ANIMALS) {
    const profile = getPetById(animal)!;
    const [cdMin, cdMax] = profile.cooldownRange;

    test(`${animal}: cooldownRange is valid [min, max] with min < max`, () => {
      expect(cdMin).toBeGreaterThan(0);
      expect(cdMax).toBeGreaterThan(cdMin);
    });

    test(`${animal}: chatty/moderate pets have short cooldowns, quiet/silent have long`, () => {
      const level = LEVEL_ORDER[profile.talkLevel];
      if (level <= 1) {
        // chatty/moderate: max cooldown should be <= 3 min
        expect(cdMax).toBeLessThanOrEqual(3);
      } else {
        // quiet/silent: min cooldown should be >= 2 min
        expect(cdMin).toBeGreaterThanOrEqual(2);
      }
    });
  }
});

// ─── Reaction templates: animal-specific reactions exist ───────────────────

describe("reaction templates", () => {
  const REASONS: ReactionReason[] = ["error", "test-fail", "large-diff", "turn", "idle", "adopt", "pet"];

  test("getReaction returns non-empty string for all animals x reasons", () => {
    for (const animal of ANIMALS) {
      for (const reason of REASONS) {
        const reaction = getReaction(reason, animal);
        expect(reaction.length).toBeGreaterThan(0);
      }
    }
  });

  // Run multiple times to test randomness doesn't crash
  test("getReaction is stable over 100 random calls", () => {
    for (let i = 0; i < 100; i++) {
      const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
      const reason = REASONS[Math.floor(Math.random() * REASONS.length)];
      const reaction = getReaction(reason, animal);
      expect(typeof reaction).toBe("string");
      expect(reaction.length).toBeGreaterThan(0);
    }
  });
});

// ─── fallbackLine always returns a valid signature line ─────────────────────

describe("fallbackLine", () => {
  for (const animal of ANIMALS) {
    const profile = getPetById(animal)!;

    test(`${animal}: fallbackLine returns one of signatureLines`, () => {
      for (let i = 0; i < 10; i++) {
        const line = fallbackLine(profile);
        expect(profile.signatureLines).toContain(line);
      }
    });
  }
});

// ─── MBTI behavioral pattern checks ────────────────────────────────────────

describe("MBTI behavioral patterns", () => {
  // NT analysts: should be low-emotion, logic-focused
  test("NT animals (raven/owl/bear/fox) don't use high-emotion words", () => {
    const ntAnimals: AnimalId[] = ["raven", "owl", "bear", "fox"];
    const emotionalWords = ["哇", "好耶", "太好了", "好开心"];
    for (const animal of ntAnimals) {
      const profile = getPetById(animal)!;
      for (const line of profile.signatureLines) {
        for (const word of emotionalWords) {
          expect(line).not.toContain(word);
        }
      }
    }
  });

  // Introverts: should have quiet/silent talk level or longer cooldowns
  test("introverts (I types) are quiet or silent, or have longer cooldowns", () => {
    const introvertMbtis = MBTI_TYPES.filter(m => m.startsWith("I"));
    for (const mbti of introvertMbtis) {
      const animal = MBTI_ANIMAL_MAP[mbti];
      const profile = getPetById(animal)!;
      const isQuiet = profile.talkLevel === "quiet" || profile.talkLevel === "silent";
      const hasLongCooldown = profile.cooldownRange[0] >= 3;
      expect(isQuiet || hasLongCooldown).toBe(true);
    }
  });

  // Extroverts: should be chatty or moderate
  test("extroverts (E types) are chatty or moderate", () => {
    const extrovertMbtis = MBTI_TYPES.filter(m => m.startsWith("E"));
    for (const mbti of extrovertMbtis) {
      const animal = MBTI_ANIMAL_MAP[mbti];
      const profile = getPetById(animal)!;
      expect(["chatty", "moderate"]).toContain(profile.talkLevel);
    }
  });

  // Cat (ISTP) special: most silent, shortest maxLength
  test("cat (ISTP) is the most minimal pet", () => {
    const cat = getPetById("cat")!;
    expect(cat.talkLevel).toBe("silent");
    expect(cat.voiceConstraints.maxLength).toBeLessThanOrEqual(12);
  });

  // Parrot (ESFP) special: longest maxLength, chatty
  test("parrot (ESFP) is the most talkative pet", () => {
    const parrot = getPetById("parrot")!;
    expect(parrot.talkLevel).toBe("chatty");
    expect(parrot.voiceConstraints.maxLength).toBeGreaterThanOrEqual(35);
  });

  // Fox (ENTP) special: chatty with highest quirk frequency among NT
  test("fox (ENTP) has highest quirkFrequency among NT group", () => {
    const fox = getPetById("fox")!;
    const ntAnimals: AnimalId[] = ["raven", "owl", "bear"];
    for (const id of ntAnimals) {
      const other = getPetById(id)!;
      expect(fox.voiceConstraints.quirkFrequency).toBeGreaterThan(other.voiceConstraints.quirkFrequency);
    }
  });
});

// ─── Profile completeness ──────────────────────────────────────────────────

describe("profile completeness", () => {
  for (const animal of ANIMALS) {
    const profile = getPetById(animal)!;

    test(`${animal}: all required fields are non-empty`, () => {
      expect(profile.animal.length).toBeGreaterThan(0);
      expect(profile.defaultName.length).toBeGreaterThan(0);
      expect(profile.archetype.length).toBeGreaterThan(0);
      expect(profile.personality.length).toBeGreaterThan(10);
      expect(profile.comfortStyle.length).toBeGreaterThan(0);
      expect(profile.teaseStyle.length).toBeGreaterThan(0);
      expect(profile.encouragementStyle.length).toBeGreaterThan(0);
      expect(profile.voiceConstraints.longThoughtExample.length).toBeGreaterThan(0);
    });
  }
});
