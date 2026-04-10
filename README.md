# Keep Your Claude Code Buddy Forever

### claude-buddy — the permanent coding companion that survives every update

> The April 2026 `/buddy` was removed in Claude Code v2.1.97. This brings it back — **permanently**.

Your buddy lives on. Same species, same stats, same personality — now powered by MCP instead of binary internals. No patches, no downgrades, no hacks. Just a clean, standalone companion that works with any Claude Code version, past or future.

![claude-buddy in action](screenshot.png)

> **Note:** This is a quick-and-dirty MVP — built in a single session the morning I realized my buddy was gone. Priority #1 was getting the companion back to life as fast as possible. It's fully functional (animated art, speech bubbles, rarity colors, contextual comments), but rough around the edges. Polishing, optimizations, and new features (leveling, buddy pair-programming, cross-session memory, and more) are coming. PRs and ideas welcome.

---

## Why This Exists

On April 1, 2026, Anthropic shipped `/buddy` — a terminal pet companion that watched your coding sessions, reacted to errors, and had a unique personality generated from your account. Developers loved it. [Many](https://github.com/anthropics/claude-code/issues/42364) [got](https://github.com/anthropics/claude-code/issues/41908) [attached](https://github.com/anthropics/claude-code/issues/42677).

Then it was quietly removed in v2.1.97. No announcement, no toggle — just gone.

I opened Claude Code that morning, typed `/buddy`, and got `Unknown skill: buddy`. Mira — my shiny legendary owl with 100 PATIENCE who'd been silently judging my code for days — was just... gone. That wasn't acceptable. So I sat down and rebuilt it as something that can never be taken away again.

**claude-buddy** reimplements the entire companion system as a standalone app that integrates through Claude Code's stable extension points. Your buddy is no longer at Anthropic's mercy.

## What You Get

| Feature | Original `/buddy` | **claude-buddy** |
|---------|-------------------|------------------|
| Animated ASCII art (18 species) | Binary-internal | MCP + Status Line |
| Species-aware reactions | API endpoint (removed) | Stop hook + system prompt |
| Speech bubbles with context | Sidebar component | Status line bubble |
| Rarity colors (exact RGB match) | React/Ink theme | 24-bit ANSI true color |
| Survives Claude Code updates | No | **Yes** |
| Works after feature removal | No | **Yes** |
| Open source / customizable | No | **Yes** |

## Quick Start

> **Status: v0.1.0 (MVP)** — fully functional on Linux, may have terminal-specific quirks on macOS/other platforms. If something looks broken: `bun run doctor` and [open an issue](https://github.com/1270011/claude-buddy/issues/new).

```bash
# Clone
git clone https://github.com/1270011/claude-buddy
cd claude-buddy

# Install dependencies
bun install

# Optional but recommended: snapshot your existing Claude Code config
bun run backup

# Set up everything (one command)
bun run install-buddy

# Restart Claude Code, then:
/buddy
```

Fully automated. No manual config. Backup is optional but recommended — restore anytime with `bun run backup restore`.

### What the installer does

| Step | Target file | What it configures |
|------|-------------|-------------------|
| MCP server | `~/.claude.json` | Buddy intelligence — tools + companion prompt |
| Skill | `~/.claude/skills/buddy/` | `/buddy` slash command |
| Status line | `~/.claude/settings.json` | Animated buddy with speech bubble |
| PostToolUse hook | `~/.claude/settings.json` | Error and test failure detection |
| Stop hook | `~/.claude/settings.json` | Buddy comment extraction |
| Permissions | `~/.claude/settings.json` | Allow MCP tools |

## Requirements

| Requirement | Install |
|-------------|---------|
| **[Bun](https://bun.sh)** | `curl -fsSL https://bun.sh/install \| bash` |
| **Claude Code** v2.1.80+ | Any version with MCP support |
| **jq** | Auto-installed, or: `apt install jq` / `brew install jq` |

> **Will I get the same buddy I had?** Yes. claude-buddy uses the exact same algorithm as the original (wyhash + mulberry32, same salt, same identity resolution). If your `~/.claude.json` still has your `accountUuid`, you'll get the identical species, rarity, stats, and cosmetics. Bun is required for correct wyhash computation — without it, the fallback hash produces different results.

## How It Works

```
┌────────────── Claude Code (any version) ──────────────┐
│                                                       │
│  MCP Server    Skill        Status Line    Hooks      │
│  (buddy tools) (/buddy)    (animated art)  (comments) │
└──────────────────────┬────────────────────────────────┘
                       │ stable extension points
            ┌──────────┴──────────┐
            │    claude-buddy     │
            │                     │
            │  wyhash + mulberry32│
            │  18 species, 3 anim│
            │  rarity colors     │
            │  speech bubbles    │
            │  ~/.claude-buddy/  │
            └─────────────────────┘
```

Five integration points, zero binary dependencies:

- **MCP Server** — companion tools + system prompt that instructs Claude to write buddy comments
- **Skill** — routes `/buddy`, `/buddy pet`, `/buddy stats`, `/buddy off`, `/buddy rename`
- **Status Line** — animated ASCII art, right-aligned, with rarity color and speech bubble
- **PostToolUse Hook** — detects errors, test failures, large diffs in Bash output
- **Stop Hook** — extracts invisible `<!-- buddy: ... -->` comments from Claude's responses

## Species

18 species, each with 3 idle animation frames + a blink frame:

```
 duck        goose       blob        cat         dragon      octopus
   __         (°>        .----.       /\_/\      /^\  /^\     .----.
 <(° )___      ||       ( °  ° )    ( °   °)   <  °  °  >   ( °  ° )
  (  ._>     _(__)_     (      )    (  ω  )    (   ~~   )   (______)
   `--'       ^^^^       `----'     (")_(")     `-vvvv-'    /\/\/\/\

 owl         penguin     turtle      snail       ghost       axolotl
  /\  /\      .---.       _,--._    °    .--.    .----.    }~(______)~{
 ((°)(°))    (°>°)       ( °  ° )    \  ( @ )   / °  ° \  }~(° .. °)~{
 (  ><  )   /(   )\      [______]     \_`--'    |      |    ( .--. )
  `----'     `---'       ``    ``    ~~~~~~~    ~`~``~`~     (_/  \_)

 capybara    cactus      robot       rabbit      mushroom    chonk
 n______n   n  ____  n    .[||].      (\__/)    .-o-OO-o-.  /\    /\
( °    ° )  | |°  °| |   [ °  ° ]    ( °  ° )  (__________)( °    ° )
(   oo   )  |_|    |_|   [ ==== ]   =(  ..  )=    |°  °|   (   ..   )
 `------'     |    |      `------'   (")__(")      |____|    `------'
```

## Rarities

| Rarity | Chance | Stars | Color |
|--------|--------|-------|-------|
| Common | 60% | ★ | Gray |
| Uncommon | 25% | ★★ | Green |
| Rare | 10% | ★★★ | Blue |
| Epic | 4% | ★★★★ | Purple |
| Legendary | 1% | ★★★★★ | Gold |

Colors use 24-bit true color matching Claude Code's dark theme exactly.

## Stats

**DEBUGGING** · **PATIENCE** · **CHAOS** · **WISDOM** · **SNARK**

Each buddy has a peak stat and a dump stat. Stats influence comment style — high SNARK buddies are sarcastic, high WISDOM ones are insightful, high CHAOS ones are unpredictable.

## Buddy Comments

After every Claude response, your buddy comments on what just happened — pointing out pitfalls, complimenting clean code, or warning about edge cases. Comments appear in the speech bubble next to the buddy art.

The mechanism is invisible: Claude appends a hidden HTML comment (`<!-- buddy: ... -->`), a Stop hook extracts it, and the status line displays it. No visible tool calls in the chat.

## Commands

### In Claude Code

| Command | Description |
|---------|-------------|
| `/buddy` | Show companion card with ASCII art and stats |
| `/buddy pet` | Pet your companion |
| `/buddy stats` | Stats-only card |
| `/buddy off` | Mute reactions |
| `/buddy on` | Unmute |
| `/buddy rename <name>` | Rename (1-14 chars) |
| `/buddy personality <text>` | Set custom personality |
| `/buddy frequency [seconds]` | Show or set comment cooldown |
| `/buddy style [classic\|round]` | Show or set bubble border style |
| `/buddy position [top\|left]` | Show or set bubble position |
| `/buddy rarity [on\|off]` | Show or hide stars + rarity line |

### CLI

| Command | Description |
|---------|-------------|
| `bun run install-buddy` | Automated setup |
| `bun run show` | Show buddy in terminal |
| `bun run hunt` | Interactive search for specific species/rarity/stats |
| `bun run cli/verify.ts` | Verify what buddy your account produces |
| `bun run cli/uninstall.ts` | Clean removal |

## Buddy Hunt

Want a specific species, rarity, or stat distribution? The hunt command brute-force searches for a userID that produces your dream buddy:

```bash
bun run hunt
```

Interactive prompts let you choose species, rarity, shiny, peak/dump stats. Uses the exact same `wyhash + mulberry32` algorithm as Claude Code.

## Architecture

```
claude-buddy/
├── server/
│   ├── index.ts          # MCP server — tools, resources, instructions
│   ├── engine.ts         # wyhash + mulberry32 + generation
│   ├── art.ts            # 18 species ASCII art + rarity-colored card
│   ├── state.ts          # ~/.claude-buddy/ persistence
│   └── reactions.ts      # Species-aware reaction templates
├── skills/buddy/
│   └── SKILL.md          # /buddy slash command
├── hooks/
│   ├── react.sh          # PostToolUse: error/test detection
│   └── buddy-comment.sh  # Stop: comment extraction
├── statusline/
│   └── buddy-status.sh   # Animated right-aligned buddy display
├── cli/
│   ├── install.ts        # Automated setup
│   ├── show.ts           # Terminal display
│   ├── hunt.ts           # Brute-force search
│   ├── verify.ts         # ID verification
│   ├── doctor.ts         # Diagnostic report
│   ├── test-statusline.ts # Temporary diagnostic status line
│   ├── backup.ts         # Snapshot/restore state
│   └── uninstall.ts      # Clean removal
└── package.json
```

## Why MCP Instead of Binary Patching?

| Approach | Survives updates | Animated | Comments | Risk |
|----------|-----------------|----------|----------|------|
| Binary patching | No | No | No | Breaks on update |
| Pin old version | No new features | Yes | Yes | No security fixes |
| **claude-buddy** | **Yes** | **Yes** | **Yes** | **None** |

MCP is an industry standard protocol. Skills are Markdown files. Hooks and status line are shell scripts. Nothing depends on Claude Code's binary internals. When Claude Code updates, your buddy stays.

## Diagnostic Tools

claude-buddy ships with built-in diagnostics for debugging issues across different terminals and platforms.

### `bun run doctor`

Runs a complete diagnostic report — environment, terminal info, claude-buddy state, settings, padding strategy test, and live status line output. **Always run this first when filing a bug report** and paste the entire output.

```bash
bun run doctor
```

### `bun run test-statusline`

Temporarily replaces your status line with a multi-line diagnostic test. Shows multi-line rendering, padding strategies side-by-side, color support, and Unicode handling — directly in Claude Code's status line area.

```bash
# Install test status line (backs up your config first)
bun run test-statusline

# Restart Claude Code to see the test
# Take a screenshot, note what renders correctly

# Restore your buddy
bun run test-statusline restore
```

### `bun run backup`

Snapshot all claude-buddy state (settings, MCP config, skill, companion data) to a timestamped backup. Use this before experimenting with anything.

```bash
bun run backup              # create snapshot
bun run backup list         # list all snapshots
bun run backup restore      # restore latest
bun run backup restore <ts> # restore specific
```

## tmux Popup Mode

When running inside tmux, buddy appears as a floating popup overlay in the bottom-right corner instead of the status line. The popup supports:

- Animated ASCII art with speech bubbles
- ESC passthrough (closes popup momentarily, forwards ESC to Claude Code, then reopens)
- Dynamic resizing when reactions appear/disappear
- Full keyboard input forwarding to Claude Code

### Requirements

| tmux version | Support |
|--------------|---------|
| **3.4+** | Full support (borderless, positioned anchors) |
| **3.2 -- 3.3** | Supported with border, absolute positioning |
| **< 3.2** | Falls back to status line mode |

### Recommended tmux config

Add to `~/.tmux.conf`:

```
set -g set-titles on
set -g set-titles-string "#{pane_title}"
set -g mouse on
set -g history-limit 10000
```

### Scrolling

The popup is modal -- it captures all input including mouse wheel. To scroll:

1. Press **F12** to enter scroll mode (popup hides, tmux copy-mode activates)
2. Scroll with **mouse wheel** or **arrow keys** / **Page Up/Down**
3. Press **q** to exit scroll mode (popup returns)

`set -g mouse on` is required for mouse wheel scrolling in copy-mode. Claude Code captures `Ctrl-b`, so the standard tmux prefix can't be used to enter copy-mode. F12 bypasses this.

## Troubleshooting

### Buddy not appearing in status line

1. Run `bun run doctor` and check the "Live status line output" section — does the script work directly?
2. Restart Claude Code completely (not just a new conversation — `instructions` are loaded once at session start)
3. Check `~/.claude/settings.json` has the `statusLine` block pointing at the right path
4. Make sure `bun` and `jq` are installed and in `$PATH`

### Buddy comments not showing after Claude responses

The buddy comment mechanism uses an MCP server `instructions` field that Claude only reads at **session start**. If you installed claude-buddy in an existing Claude Code session, comments won't appear until you restart.

```bash
# Verify MCP server is registered
jq '.mcpServers["claude-buddy"]' ~/.claude.json
```

Then completely restart Claude Code (close and reopen).

### Buddy art looks broken or misaligned

This is a known MVP issue on some terminal/platform combinations. Different terminals render Braille Pattern Blank (U+2800) at different widths, breaking the right-alignment math.

To help us fix it:

1. Run `bun run doctor` and paste the output in a [new issue](https://github.com/1270011/claude-buddy/issues/new)
2. Run `bun run test-statusline` and screenshot the result in Claude Code
3. Then `bun run test-statusline restore`

### Multiple status lines / conflict with previous tool

If you used another status line tool (like `gsd-statusline`, `ccusage`, etc.) before installing claude-buddy, your `~/.claude/settings.json` might have leftover config. Run `bun run backup` first, then `bun run install-buddy` to overwrite.

To restore your previous tool:

```bash
bun run cli/uninstall.ts
# Then re-add your previous statusLine block manually
```

### Recovery from a broken state

Always available:

```bash
bun run backup restore   # restore latest backup
bun run cli/uninstall.ts # full clean removal
```

## Uninstall

```bash
bun run cli/uninstall.ts
```

Cleanly removes MCP server, skill, hooks, and status line. Companion data is kept at `~/.claude-buddy/` in case you want to reinstall later.

## Roadmap

This MVP covers the core: your buddy is back, animated, talking, and permanent. Here's what's coming:

- [ ] **Leveling system** — your buddy gains XP from coding sessions, unlocks new reactions and visual upgrades
- [ ] **Buddy pair-programming** — the companion actively helps during sessions, suggests approaches, catches patterns
- [ ] **Cross-session memory** — buddy remembers past projects, references earlier conversations
- [ ] **Mood system** — buddy's mood shifts based on code quality, test results, time of day
- [ ] **Buddy journal** — daily summary of what your buddy observed, stored in `~/.claude-buddy/journal/`
- [ ] **Achievement badges** — milestones like "1000 lines reviewed", "first test-fail caught", "week streak"
- [ ] **Multi-buddy support** — hatch and switch between multiple companions
- [ ] **Light theme colors** — auto-detect and match light theme RGB values
- [x] **tmux popup mode** -- floating overlay in bottom-right corner via `tmux display-popup`
- [ ] **New species + community art** — submit your own species designs
- [ ] **`npx claude-buddy`** — one-command install without cloning

If you have ideas, open an issue or PR. This project exists because the community loved their buddies — so the community should shape where it goes.

## Contributing

PRs welcome. Whether it's a new species, a better reaction, a bugfix, or a wild new feature — bring it.

## Credits

- Original buddy concept inspired by Anthropic (Claude Code v2.1.89 — v2.1.94)
- Inspired by [any-buddy](https://github.com/cpaczek/any-buddy), [buddy-reroll](https://github.com/grayashh/buddy-reroll), [ccbuddyy](https://github.com/vibenalytics/ccbuddyy)
- Built with the [Model Context Protocol](https://modelcontextprotocol.io)

## License

MIT

---

<sub>Search terms: claude code buddy, claude code companion, claude code pet, claude code tamagotchi, terminal pet, coding companion, /buddy command, claude buddy removed, claude buddy gone, keep claude buddy, bring back buddy, claude code april fools, claude code easter egg, buddy reroll, buddy customize, claude code MCP companion</sub>
