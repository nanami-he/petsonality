# Petsonality FAQ

Honest answers to predictable questions. If something here feels wrong or incomplete, [open an issue](https://github.com/nanami-he/petsonality/issues) — I'd rather hear it now than have it linger.

---

## Is this just another useless toy?

Fair. It is a toy — in the same sense a terminal theme, a typing-sound config, or a custom shell prompt is a toy. It doesn't make code compile faster. What it changes is *how the hours feel* when you're inside Claude Code or OpenClaw all day. Built for people who already live in those tools.

If "make me 10% more productive" is what you're shopping for, this isn't it. If "make 2am bug hunting feel slightly less alone" sounds appealing, give it a try.

---

## Why doesn't it work in the Claude desktop app or claude.ai/code?

Terminal-native by design. The pet renders in the **status line** — a feature that exists in the Claude Code CLI and OpenClaw TUI but not in the desktop or web clients. A desktop or web version would be a different product, not a port.

What does still work in the desktop/web app: MCP tool output. So `/pet show` and the adoption flow render fine, you just don't get the live status-line presence.

---

## MBTI is pseudoscience. Why use it?

I'm not claiming MBTI is psychology. It's used here as a **personality design language** — a compact, recognizable shorthand for giving each of the 16 pets a distinct voice that someone can identify in a few interactions. "Raven is INTJ" tells you it's quiet, structural, and a little cold; "Golden is ESFJ" tells you it's warm and effusive. That's the whole reason MBTI is on the side of the box.

If you don't care about MBTI, you can ignore the labels entirely and just pick the animal whose voice you like. The product still works.

---

## What does the installer modify on my system?

Honest list of every file petsonality touches. Backups noted where applicable.

When you run `npx petsonality`:

- **`~/.claude.json`** — adds a `petsonality` entry under `mcpServers` so Claude Code can spawn the MCP server. Existing mcpServers entries are left alone.
- **`~/.claude/settings.json`** — adds a `statusLine` and two hooks (`PostToolUse`, `Stop`). If you already had a `statusLine`, the original is backed up to `~/.petsonality/statusline.bak` before being replaced. Hook entries that mention `petsonality` or the legacy `typet` name are removed first to prevent duplicates.
- **`~/.claude/skills/pet/SKILL.md`** — copies the `/pet` command skill so Claude Code can route the slash command to the MCP server.
- **`~/.petsonality/`** — runtime directory holding the pet state (`pet.json`), reactions cache (`reactions-pool.json`), the bundled MCP server, hooks, and the bash status-line script.

If OpenClaw is detected, additionally:

- **`~/.openclaw/openclaw.json`** — adds a `petsonality` entry under `mcp.servers` (with `PETSONALITY_HOST=openclaw` env var) and a `ui.statusLine` config if OpenClaw has native status-line support.
- **OpenClaw's TUI source file** — applies a small patch to enable the status line, until [OpenClaw PR #65886](https://github.com/openclaw/openclaw/pull/65886) merges native support. The original is backed up beside the file.

To remove everything: `npx petsonality uninstall`. This reverts the MCP/hook/statusLine entries (restoring backups where present), removes the OpenClaw patch, and cleans up runtime files. Pet state in `~/.petsonality/` is intentionally preserved in case you want to re-adopt later — delete the directory manually if you don't.

To check what got changed and whether anything looks off: `npx petsonality doctor`.

---

## I see some Chinese in the output — is petsonality fully internationalized?

As of v0.4.0, all user-facing tool responses, system prompts, animal names, and the `/pet` skill flow switch to English when `LANG` doesn't start with `zh`. The first-time setup, adoption, and daily interaction paths should be fully English for English-locale users.

If you do encounter Chinese mid-flow on an English-locale system, that's a bug — please [open an issue](https://github.com/nanami-he/petsonality/issues) with the command you ran and your `LANG` value.

The Chinese reactions catalog still ships inside the npm package (`reactions.ts`), but it's only loaded when `LANG` indicates Chinese. English users never see it.

---

## How chatty is it really? Will it spam me?

Each personality has a baseline talk rhythm:

- **Chatty** (Fox, Dolphin, Cheetah, Parrot) — speaks every 2-4 replies, chimes in during normal work
- **Moderate** (most pets) — every 3-6 replies
- **Quiet** (Raven, Wolf, Owl) — every 6-10 replies, but always speaks at key moments
- **Silent** (Cat) — only every 10-15 replies, mostly through actions

There's also a cooldown timer per pet and a silent-streak guardrail so the rhythm stays roughly even across a session. If it still feels too noisy, `/pet off` mutes reactions without removing the pet; `/pet on` brings it back.

---

## Can I rename my pet? Switch animals?

- **Rename:** `/pet rename <new name>` — keeps the same pet, just a new name.
- **Switch animals:** `/pet setup` again. It will warn you that the current pet will be replaced.

Multi-pet collection (keep multiple pets, switch between them) is on the Phase 2 roadmap but not implemented yet.

---

## Where does my pet's state live? Is anything sent over the network?

State lives in `~/.petsonality/` on your machine, written with `0o600` permissions (owner read/write only). Nothing is sent to any external server — there's no telemetry, no analytics, no calls to my infrastructure. The only network call petsonality ever makes is `npx`'s initial download from npm.

When the pet "speaks" through Claude, the model itself is generating the reaction in-context — that's the same Claude Code session you're already using, no separate model calls.
