import { describe, test, expect } from "bun:test";
import { charWidth, stringWidth, padDisplay } from "./utils.ts";

// ─── charWidth ──────────────────────────────────────────────────────────────

describe("charWidth", () => {
  test("ASCII letters = 1", () => {
    expect(charWidth("a")).toBe(1);
    expect(charWidth("Z")).toBe(1);
    expect(charWidth("0")).toBe(1);
  });

  test("ASCII symbols = 1", () => {
    expect(charWidth("/")).toBe(1);
    expect(charWidth("\\")).toBe(1);
    expect(charWidth("|")).toBe(1);
    expect(charWidth("~")).toBe(1);
    expect(charWidth("_")).toBe(1);
    expect(charWidth("'")).toBe(1);
  });

  test("space = 1", () => {
    expect(charWidth(" ")).toBe(1);
  });

  test("control characters = 0", () => {
    expect(charWidth("\0")).toBe(0);
    expect(charWidth("\t")).toBe(0);
    expect(charWidth("\n")).toBe(0);
  });

  test("CJK characters = 2", () => {
    expect(charWidth("你")).toBe(2);
    expect(charWidth("好")).toBe(2);
    expect(charWidth("猫")).toBe(2);
    expect(charWidth("鹦")).toBe(2);
    expect(charWidth("鹉")).toBe(2);
  });

  test("Korean = 2", () => {
    expect(charWidth("가")).toBe(2);
    expect(charWidth("힣")).toBe(2);
  });

  test("Japanese kana = 2", () => {
    expect(charWidth("あ")).toBe(2);
    expect(charWidth("ア")).toBe(2);
  });

  test("fullwidth = 2", () => {
    expect(charWidth("Ａ")).toBe(2); // fullwidth A
    expect(charWidth("！")).toBe(2); // fullwidth !
  });

  test("emoji = 2", () => {
    expect(charWidth("🐱")).toBe(2);
    expect(charWidth("🦊")).toBe(2);
    expect(charWidth("🐼")).toBe(2);
  });

  test("special ASCII art characters = 1", () => {
    // Characters used in pet ASCII art
    expect(charWidth("·")).toBe(1);  // middle dot (beaver eyes)
    expect(charWidth("◉")).toBe(1);  // bullseye (lion eyes)
    expect(charWidth("•")).toBe(1);  // bullet (golden/elephant eyes)
    expect(charWidth("–")).toBe(1);  // en dash
    expect(charWidth("…")).toBe(1);  // ellipsis
    expect(charWidth("°")).toBe(1);  // degree (beaver slap)
  });

  test("braille blank = 1", () => {
    expect(charWidth("\u2800")).toBe(1);
  });
});

// ─── stringWidth ────────────────────────────────────────────────────────────

describe("stringWidth", () => {
  test("plain ASCII", () => {
    expect(stringWidth("hello")).toBe(5);
    expect(stringWidth("")).toBe(0);
  });

  test("CJK mixed", () => {
    expect(stringWidth("你好")).toBe(4);
    expect(stringWidth("hi你好")).toBe(6);
  });

  test("strips ANSI escape codes", () => {
    expect(stringWidth("\x1b[31mred\x1b[0m")).toBe(3);
    expect(stringWidth("\x1b[38;2;140;90;50mcolor\x1b[0m")).toBe(5);
  });

  test("ANSI codes contribute zero width", () => {
    const plain = "  n____n    ";
    const colored = "  \x1b[38;2;140;100;180mn\x1b[38;2;220;220;215m __ \x1b[38;2;140;100;180mn\x1b[38;2;220;220;215m    ";
    expect(stringWidth(plain)).toBe(12);
    expect(stringWidth(colored)).toBe(12);
  });

  test("pet art lines are 12 display chars", () => {
    // Sample art lines from various pets
    const lines = [
      "   /\\_/\\  ~ ",  // cheetah
      "  (o . o)   ",  // cheetah
      "    ,__     ",  // parrot
      "  >(o  )    ",  // parrot
      " {*|_W_|*}  ",  // lion
      "  n____n    ",  // beaver
      "( --  -- )  ",  // panda
    ];
    for (const line of lines) {
      expect(stringWidth(line)).toBe(12);
    }
  });
});

// ─── padDisplay ─────────────────────────────────────────────────────────────

describe("padDisplay", () => {
  test("pads ASCII string", () => {
    expect(padDisplay("hi", 5)).toBe("hi   ");
    expect(padDisplay("hi", 2)).toBe("hi");
  });

  test("pads CJK-aware", () => {
    expect(padDisplay("你好", 6)).toBe("你好  ");
    expect(padDisplay("你好", 4)).toBe("你好");
  });

  test("no negative padding", () => {
    expect(padDisplay("hello world", 5)).toBe("hello world");
  });
});

// ─── Art grid validation ────────────────────────────────────────────────────

describe("art grid validation", () => {
  test("all animals have 12-char-wide frames", async () => {
    const { ANIMAL_ART } = await import("./art.ts");
    const { ANIMALS } = await import("./engine.ts");

    for (const animal of ANIMALS) {
      const frames = ANIMAL_ART[animal];
      expect(frames.length).toBeGreaterThanOrEqual(3);

      for (let f = 0; f < frames.length; f++) {
        expect(frames[f].length).toBe(5); // 5 lines per frame
        for (let li = 0; li < frames[f].length; li++) {
          const line = frames[f][li];
          expect(line.length).toBe(12);
        }
      }
    }
  });
});
