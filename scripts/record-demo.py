#!/usr/bin/env python3
"""
Generate demo GIF using PIL — no asciinema/agg dependency.
Each scene is a frame rendered with Menlo font on dark background.
"""

from PIL import Image, ImageDraw, ImageFont
import os

FONT_PATH = "/System/Library/Fonts/Menlo.ttc"
FONT_SIZE = 18
BG = (30, 30, 30)
FG = (204, 204, 204)
GREEN = (80, 200, 80)
RED = (220, 80, 80)
GOLD = (210, 175, 80)
PINK = (240, 140, 150)
CYAN = (100, 200, 220)
DIM = (120, 120, 120)
BOLD_W = (255, 255, 255)

OUTPUT = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "demo.gif")
os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)

font = ImageFont.truetype(FONT_PATH, FONT_SIZE)
bold_font = ImageFont.truetype(FONT_PATH, FONT_SIZE)
char_w = int(font.getlength("W"))
char_h = int(FONT_SIZE * 1.6)

W = char_w * 50 + 40  # 50 cols
H = char_h * 16 + 40  # 16 rows
PAD = 20


def render_scene(lines_with_color):
    """Render a list of (text, color) tuples per line."""
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    for row, segments in enumerate(lines_with_color):
        x = PAD
        y = PAD + row * char_h
        if isinstance(segments, str):
            draw.text((x, y), segments, font=font, fill=FG)
        else:
            for text, color in segments:
                draw.text((x, y), text, font=font, fill=color)
                x += int(font.getlength(text))
    return img


# ── Scene 1: Install ──────────────────────
scene1 = [
    [("$ ", DIM), ("npx petsonality", FG)],
    [],
    [("  petsonality", BOLD_W), (" — MBTI terminal pet companion", FG)],
    [],
    [("  ✓", GREEN), (" node found", FG)],
    [("  ✓", GREEN), (" Claude Code detected", FG)],
    [("  ✓", GREEN), (" MCP server registered", FG)],
    [("  ✓", GREEN), (" Hooks + status line configured", FG)],
    [],
    [("  Done! Type /pet to adopt.", GREEN)],
]

# ── Scene 2: Adopt ────────────────────────
scene2 = [
    [("$ ", DIM), ("/pet", FG)],
    [],
    [("  Your MBTI? ", FG), ("ENFJ", BOLD_W)],
    [("  Recommended: ", FG), ("Labrador", GOLD), (" — Warm Coach", FG)],
    [],
    [("        __/\\", GOLD)],
    [("      __/@ )", GOLD)],
    [("     O     \\", GOLD)],
    [("      ", GOLD), ("U", PINK), (" \\___\\-", GOLD)],
    [],
    [("  ✓", GREEN), (" Meet ", FG), ("ENFJ", BOLD_W), (" the Labrador!", FG)],
]

# ── Scene 3: Error + reaction ─────────────
scene3 = [
    [("You code. Your pet watches.", DIM)],
    [],
    [("        __/\\", GOLD)],
    [("      __/@ )", GOLD)],
    [("     O     \\", GOLD)],
    [("      ", GOLD), ("U", PINK), (" \\___\\-", GOLD)],
    [],
    [("$ ", DIM), ("npm test", FG)],
    [("  ✗ 2 tests failed", RED)],
    [],
    [("  ", FG), ("ENFJ: ", GOLD), ("*sighs* ...you okay?", FG)],
]

# ── Scene 4: Success ──────────────────────
scene4 = [
    [("$ ", DIM), ("npm test", FG)],
    [("  ✓ 302 tests passed", GREEN)],
    [],
    [("        __/\\", GOLD)],
    [("      __/@ )", GOLD)],
    [("     O     \\", GOLD)],
    [("      ", GOLD), ("U", PINK), (" \\___\\~", GOLD)],
    [],
    [("  ", FG), ("ENFJ: ", GOLD), ("*tail wags* ...hm.", FG)],
    [],
    [],
    [("  ", FG), ("ENFJ: ", GOLD), ("have you had water?", FG)],
]

# ── Scene 5: Tagline ─────────────────────
scene5 = [
    [],
    [],
    [],
    [],
    [("     petsonality", BOLD_W)],
    [("     Your type, your pet.", FG)],
    [],
    [("     npx petsonality", DIM)],
    [],
    [("     16 animals · 1276 reactions", DIM)],
    [("     2 languages · open source", DIM)],
]

frames = []
durations = []

for scene, dur in [
    (scene1, 3000),
    (scene2, 3500),
    (scene3, 4000),
    (scene4, 4000),
    (scene5, 3000),
]:
    frames.append(render_scene(scene))
    durations.append(dur)

frames[0].save(
    OUTPUT,
    save_all=True,
    append_images=frames[1:],
    duration=durations,
    loop=0,
    optimize=True,
)

size_kb = os.path.getsize(OUTPUT) / 1024
print(f"✓ demo.gif — {len(frames)} scenes, {size_kb:.0f}KB")
