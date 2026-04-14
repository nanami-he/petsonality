#!/usr/bin/env python3
"""
Generate animated GIFs for all 16 petsonality animals.
Reads frame data from /tmp/pet-frames-color.json (exported by bun).
Outputs to assets/gifs/<animal>.gif
"""

import json
import os
from PIL import Image, ImageDraw, ImageFont

# Config
FONT_PATH = "/System/Library/Fonts/Menlo.ttc"
FONT_SIZE = 28
BG_COLOR = (30, 30, 30)  # dark terminal background
PADDING = 16
FRAME_DURATION = 400  # ms per frame
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assets", "gifs")

# Load data
with open("/tmp/pet-frames-color.json") as f:
    data = json.load(f)

font = ImageFont.truetype(FONT_PATH, FONT_SIZE)

# Measure character dimensions — use advance width, not bbox
char_w = int(font.getlength("W"))
char_h = int(FONT_SIZE * 1.5)  # line height

os.makedirs(OUTPUT_DIR, exist_ok=True)


def build_accent_map(accents):
    """Build a map: (art_line_index, char_pattern) → accent_rgb.
    art lines are 0-indexed from the SECOND line (line 1-4 in the 5-line frame,
    since line 0 is the hat slot which is always empty)."""
    accent_map = {}  # line_index → [(pattern, rgb)]
    for acc in accents:
        rgb = tuple(acc["rgb"])
        for rule in acc["rules"]:
            line_idx = rule["line"]  # 0=L1(art line 2), 1=L2, 2=L3, 3=L4
            actual_line = line_idx + 1  # offset by 1 since frame[0] is hat slot
            if actual_line not in accent_map:
                accent_map[actual_line] = []
            for pat_pair in rule["patterns"]:
                pattern = pat_pair[0]  # the raw text to find
                accent_map[actual_line].append((pattern, rgb))
    return accent_map


def render_frame(lines, color, width_chars=12, height_lines=5, accents=None):
    """Render a single ASCII frame to a PIL Image with accent colors."""
    img_w = width_chars * char_w + PADDING * 2
    img_h = height_lines * char_h + PADDING * 2

    img = Image.new("RGB", (img_w, img_h), BG_COLOR)
    draw = ImageDraw.Draw(img)

    body_color = tuple(color)
    accent_map = build_accent_map(accents) if accents else {}

    for row, line in enumerate(lines):
        if row >= height_lines:
            break
        y = PADDING + row * char_h

        # Check if this line has any accent colors
        has_accents = row in accent_map and any(
            line.find(pat) != -1 for pat, _ in accent_map.get(row, [])
        )

        if not has_accents:
            # Fast path: draw entire line in body color
            draw.text((PADDING, y), line, font=font, fill=body_color)
        else:
            # Slow path: per-character coloring for accents
            char_colors = [body_color] * len(line)
            for pattern, rgb in accent_map[row]:
                start = 0
                while True:
                    idx = line.find(pattern, start)
                    if idx == -1:
                        break
                    for i in range(idx, idx + len(pattern)):
                        char_colors[i] = rgb
                    start = idx + 1

            x = PADDING
            for i, ch in enumerate(line):
                if ch != " ":
                    draw.text((x, y), ch, font=font, fill=char_colors[i])
                x += char_w

    return img


def make_gif(animal, info):
    """Generate a looping GIF for one animal."""
    frames_data = info["frames"]
    color = tuple(info["color"])
    accents = info.get("accents", [])

    images = []
    for frame_lines in frames_data:
        img = render_frame(frame_lines, color, accents=accents)
        images.append(img)

    if not images:
        return

    # For animals with few frames (3), repeat idle to make GIF longer
    if len(images) <= 3:
        # Repeat the sequence 3x
        images = images * 3

    out_path = os.path.join(OUTPUT_DIR, f"{animal}.gif")
    images[0].save(
        out_path,
        save_all=True,
        append_images=images[1:],
        duration=FRAME_DURATION,
        loop=0,  # infinite loop
        optimize=True,
    )
    size_kb = os.path.getsize(out_path) / 1024
    print(f"  {animal}.gif — {len(images)} frames, {size_kb:.0f}KB")


print(f"Generating GIFs to {OUTPUT_DIR}/\n")

for animal, info in data.items():
    make_gif(animal, info)

# Also make a hero GIF with multiple animals side by side
print("\nGenerating hero.gif...")

hero_animals = ["cat", "fox", "labrador", "raven", "dolphin", "parrot"]
hero_frames = []
gap = 8  # pixels between animals

# Get max frame count across hero animals
max_frames = max(len(data[a]["frames"]) for a in hero_animals)

single_w = 12 * char_w + PADDING * 2
hero_w = single_w * len(hero_animals) + gap * (len(hero_animals) - 1)
hero_h = 5 * char_h + PADDING * 2

for fi in range(max_frames):
    img = Image.new("RGB", (hero_w, hero_h), BG_COLOR)
    for ai, animal in enumerate(hero_animals):
        frames = data[animal]["frames"]
        frame = frames[fi % len(frames)]
        color = tuple(data[animal]["color"])
        single = render_frame(frame, color)
        x_offset = ai * (single_w + gap)
        img.paste(single, (x_offset, 0))
    hero_frames.append(img)

if hero_frames:
    hero_path = os.path.join(OUTPUT_DIR, "hero.gif")
    hero_frames[0].save(
        hero_path,
        save_all=True,
        append_images=hero_frames[1:],
        duration=FRAME_DURATION,
        loop=0,
        optimize=True,
    )
    size_kb = os.path.getsize(hero_path) / 1024
    print(f"  hero.gif — {len(hero_frames)} frames, {size_kb:.0f}KB")

print("\nDone!")
