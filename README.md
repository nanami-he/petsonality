# Petsonality

> Your type, your pet.

A personality-based terminal pet companion. Each pet has a unique MBTI personality, speaks in character, and lives in your terminal status line.

## Features

- **16 MBTI Animals** — Each with distinct personality, voice, and behavior
- **ASCII Art** — Animated pets with blinking, head movement, paw gestures
- **Speech Bubbles** — Pets react to your code with in-character comments
- **MBTI Matching** — Mirror (like you) and Complement (balances you) recommendations
- **MCP Server** — Works with any MCP-compatible client

## Quick Start

```bash
# Clone and install
git clone https://github.com/nanami-he/petsonality.git
cd petsonality
bun install

# Register with your MCP client
bun run install-petsonality
```

Restart your MCP client, then type `/pet` to adopt your companion.

## Commands

| Command | Action |
|---------|--------|
| `/pet` | Show your pet or start adoption |
| `/pet pet` | Interact with your pet |
| `/pet setup` | Start adoption flow |
| `/pet browse` | Browse all 16 pets |
| `/pet off` | Mute reactions |
| `/pet on` | Unmute reactions |
| `/pet rename <name>` | Rename your pet |

## The 16 Animals

| Group | Animals |
|-------|---------|
| NT Analysts | Raven (INTJ), Owl (INTP), Bear (ENTJ), Fox (ENTP) |
| NF Diplomats | Wolf (INFJ), Deer (INFP), Labrador (ENFJ), Dolphin (ENFP) |
| SJ Sentinels | Beaver (ISTJ), Elephant (ISFJ), Lion (ESTJ), Golden Retriever (ESFJ) |
| SP Explorers | Cat (ISTP), Panda (ISFP), Cheetah (ESTP), Parrot (ESFP) |

## How It Works

1. **MCP Server** — Runs as stdio transport, spawned automatically by the client
2. **Status Line** — Animated pet with speech bubble in your terminal
3. **Companion Rhythm** — Pets speak on errors, milestones (test pass, commit), and daily events
4. **Multi-Host** — Works with Claude Code (hooks) and OpenClaw (pet_react MCP tool)

## Roadmap

- [x] 16 MBTI animals with full personality profiles (113 animation frames)
- [x] Animated status line with speech bubbles (Claude Code + OpenClaw)
- [x] Companion rhythm: daily triggers, milestone reactions, silent streak guardrail
- [x] Animal-specific reaction pool (420 reactions from 16 animals x 7 event types)
- [x] Voice validation: forbidden words, length constraints, style enforcement
- [x] OpenClaw support: statusLine patch + PR [#65886](https://github.com/openclaw/openclaw/pull/65886)
- [x] Three-state OpenClaw detection + `doctor` diagnostic command
- [x] 302 tests / 2645 assertions
- [ ] `npx petsonality` one-command install (remove bun/python/jq deps)
- [ ] Multi-language support (English first, then others)
- [ ] README with terminal GIF demo
- [ ] Growth system (interaction count -> level/mood evolution)
- [ ] Hat/skin DLC (unlockable accessories)
- [ ] Multi-pet collection + switching
- [ ] Vibe-pick: MBTI quiz for users who don't know their type

## Requirements

- [Bun](https://bun.sh) runtime
- [jq](https://jqlang.github.io/jq/) for JSON processing
- Any MCP-compatible client (Claude Code, OpenClaw)

## Architecture

```
~/.petsonality/
├── pet.json          — Pet state (adopted, mood, interactions)
├── status.json       — Compact state for status line
├── reaction.*.json   — Session-specific speech bubbles
└── config.json       — User preferences

petsonality/
├── server/           — MCP server (TypeScript)
│   ├── index.ts      — Tools: setup, adopt, show, pet, react
│   ├── engine.ts     — MBTI mappings, types, colors
│   ├── art.ts        — ASCII art (16 animals x 3 frames)
│   ├── pets.ts       — Full personality profiles
│   ├── voice.ts      — Speech constraints + validation
│   ├── reactions.ts  — Event-based reaction templates
│   ├── state.ts      — Persistence layer
│   └── utils.ts      — CJK display width helpers
├── statusline/       — Terminal status line (bash)
├── hooks/            — Stop + PostToolUse hooks
├── skills/           — Skill routing
└── cli/              — Install, doctor, show, backup
```

## License

MIT
