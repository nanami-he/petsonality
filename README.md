# claude-buddy

Permanent coding companion for Claude Code — **survives any update**.

Unlike the built-in `/buddy` (which Anthropic removed in v2.1.97), `claude-buddy` is a standalone app that integrates through **stable extension points** (MCP, Skills, Hooks, Status Line). Your companion persists regardless of Claude Code version changes.

## Quick Start

```bash
# 1. Clone the repo
git clone <repo-url> claude-buddy
cd claude-buddy

# 2. Install dependencies
bun install

# 3. Run the installer (sets up everything automatically)
bun run install-buddy

# 4. Restart Claude Code, then type /buddy
```

The installer checks requirements, registers all integrations, and hatches your companion. One command, fully automated.

## What the Installer Does

The `bun run install-buddy` command automatically configures:

| What | Where | Purpose |
|------|-------|---------|
| MCP server | `~/.claude.json` | Buddy intelligence — tools Claude can call |
| Skill | `~/.claude/skills/buddy/SKILL.md` | `/buddy` slash command |
| Status line | `~/.claude/settings.json` | Animated buddy in terminal with speech bubble |
| PostToolUse hook | `~/.claude/settings.json` | Detect errors/test failures in output |
| Stop hook | `~/.claude/settings.json` | Extract buddy comments from responses |
| MCP permissions | `~/.claude/settings.json` | Allow buddy MCP tools |
| Companion data | `~/.claude-buddy/` | Persistent companion state |

No manual configuration needed. Run the installer, restart Claude Code, done.

## Requirements

- **[Bun](https://bun.sh)** — `curl -fsSL https://bun.sh/install | bash`
- **Claude Code** v2.1.80+ (MCP support)
- **jq** — auto-installed by the installer, or: `apt install jq` / `brew install jq`
- **Linux/macOS** — status line animation uses `/proc` for terminal width detection

## How It Works

```
┌────────────── Claude Code (any version) ──────────────┐
│                                                       │
│  MCP Server    Skill /buddy   Status Line    Hooks    │
│  (tools +      (SKILL.md)    (animated      (Stop +   │
│   resources)                  shell script)  PostTool) │
└──────────────────────┬────────────────────────────────┘
                       │
            ┌──────────┴──────────┐
            │    claude-buddy     │
            │                     │
            │  wyhash → mulberry32│
            │  18 species + art   │
            │  animated + colored │
            │  speech bubbles     │
            │  ~/.claude-buddy/   │
            └─────────────────────┘
```

**Five stable integration points, zero binary patching:**

| Component | Purpose | Stability |
|-----------|---------|-----------|
| **MCP Server** | Buddy tools + companion system prompt | Industry standard (MCP) |
| **Skill** | `/buddy` slash command routing | Markdown file |
| **Status Line** | Animated buddy with speech bubble | Shell script |
| **PostToolUse Hook** | Detect errors/test failures | Shell script |
| **Stop Hook** | Extract contextual buddy comments | Shell script |

## Features

### Animated ASCII Art (18 species)

Your buddy lives in the status line with idle animations — blinking eyes, wiggling feet, swaying tentacles. 3 animation frames per species plus a blink frame, cycling every second. Matches the original Claude Code animation sequence.

### Speech Bubbles

After each response, your buddy comments on what just happened — pointing out pitfalls, complimenting clean code, or warning about edge cases. Comments appear in a bordered speech bubble next to the buddy art.

```
.------------------------------.      [___]
| *adjusts tophat* that error  |      /\  /\
| handler needs a finally      |--   ((°)(°))
| block                        |      (  ><  )
`------------------------------'      `----'
                                       Mira
```

### Rarity Colors (exact match)

Colors match Claude Code's dark theme RGB values exactly:

| Rarity | Color | RGB |
|--------|-------|-----|
| Common | Gray | rgb(153,153,153) |
| Uncommon | Green | rgb(78,186,101) |
| Rare | Blue | rgb(177,185,249) |
| Epic | Purple | rgb(175,135,255) |
| Legendary | Gold | rgb(255,193,7) |

### `/buddy` Command Card

Full companion card with ASCII art, stats, personality:

```
╭──────────────────────────────────────╮
│     [___]                            │
│     /\  /\                           │
│    ((°)(°))                          │
│    (  ><  )                          │
│     `----'                           │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│ Mira  ★★★★★                         │
│ ✨ LEGENDARY owl                     │
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│ DEB █████████░  88                   │
│ PAT ██████████ 100 ▲                 │
│ CHA █████░░░░░  52 ▼                 │
│ WIS ████████░░  81                   │
│ SNA ████████░░  77                   │
╰──────────────────────────────────────╯
```

## Commands

### In Claude Code

| Command | Description |
|---------|-------------|
| `/buddy` | Show companion card with ASCII art + stats |
| `/buddy pet` | Pet your companion |
| `/buddy stats` | Stats-only card |
| `/buddy off` | Mute reactions |
| `/buddy on` | Unmute reactions |
| `/buddy rename <name>` | Rename companion |
| `/buddy personality <text>` | Set custom personality |

### CLI

```bash
bun run install-buddy    # Install all integrations
bun run show             # Show current buddy in terminal
bun run hunt             # Interactive search for specific buddy
cli/verify.ts [id]       # Verify what buddy a user ID produces
```

## Species (18)

duck · goose · blob · cat · dragon · octopus · owl · penguin · turtle · snail · ghost · axolotl · capybara · cactus · robot · rabbit · mushroom · chonk

## Rarities

| Rarity | Chance | Stars |
|--------|--------|-------|
| Common | 60% | ★ |
| Uncommon | 25% | ★★ |
| Rare | 10% | ★★★ |
| Epic | 4% | ★★★★ |
| Legendary | 1% | ★★★★★ |

## Stats

**DEBUGGING** · **PATIENCE** · **CHAOS** · **WISDOM** · **SNARK**

Each buddy has a peak stat (highest) and dump stat (lowest). Rarity determines the stat floor. Stats influence the companion's personality and comment style.

## Architecture

```
claude-buddy/
├── server/
│   ├── index.ts          # MCP server (stdio) — tools, resources, instructions
│   ├── engine.ts         # wyhash + mulberry32 + species/stats generation
│   ├── art.ts            # ASCII art for all 18 species + colored card renderer
│   ├── state.ts          # ~/.claude-buddy/ persistence layer
│   └── reactions.ts      # Species-aware reaction templates
├── skills/buddy/
│   └── SKILL.md          # /buddy slash command definition
├── hooks/
│   ├── react.sh          # PostToolUse: detect errors/test failures
│   └── buddy-comment.sh  # Stop: extract buddy comments from responses
├── statusline/
│   └── buddy-status.sh   # Animated, right-aligned, colored buddy display
├── cli/
│   ├── index.ts          # CLI entry point
│   ├── install.ts        # Automated setup (MCP + skill + hooks + statusline)
│   ├── show.ts           # Terminal display
│   ├── hunt.ts           # Brute-force buddy search
│   ├── verify.ts         # ID → buddy verification
│   └── uninstall.ts      # Clean removal
├── .claude-plugin/
│   └── plugin.json       # Claude Code plugin manifest
├── package.json
└── tsconfig.json
```

## How Buddy Comments Work

Instead of visible MCP tool calls, the buddy comments are invisible:

1. Claude appends `<!-- buddy: *comment* -->` at the end of each response
2. A **Stop hook** extracts the comment from the response text
3. The comment appears in the buddy's speech bubble in the status line
4. No tool call visible in the chat — the comment appears silently

## Why Not Binary Patching?

| Approach | Update-safe | Risk | Animated | Comments |
|----------|-------------|------|----------|----------|
| Binary patching (any-buddy) | Breaks on update | Binary changes | No | No |
| Salt replacement | Breaks on update | Algorithm changes | No | No |
| Pin old version | No new features | Security | Yes | Yes |
| **claude-buddy (MCP)** | **Permanent** | **None** | **Yes** | **Yes** |

MCP is an industry standard. Skills are Markdown. Hooks and status line are shell scripts. None depend on Claude Code internals.

## Uninstall

```bash
bun run cli/uninstall.ts
```

Removes MCP server, skill, hooks, and status line config. Companion data is preserved at `~/.claude-buddy/` — delete manually if not needed.

## Credits

- Hash algorithm analysis from Claude Code v2.1.94 binary reverse engineering
- Original buddy feature by Anthropic (removed in v2.1.97, reimplemented here)
- Inspired by [any-buddy](https://github.com/cpaczek/any-buddy), [buddy-reroll](https://github.com/grayashh/buddy-reroll)
- Built with the [Model Context Protocol](https://modelcontextprotocol.io)

## License

MIT
