# Contributing to petsonality

Thanks for the interest. petsonality is small, and most contributions land in
under a day. Below is everything you need to go from clone → merged PR.

If anything here is wrong, unclear, or missing — **that itself is a valid PR**.

---

## TL;DR

```bash
git clone https://github.com/nanami-he/petsonality.git
cd petsonality
bun install         # uses Bun >= 1.3 (https://bun.sh)
bun test            # ~70ms, 302 tests, all green
bun run build       # rebuilds dist/, regenerates art + reactions
```

Then edit, commit with a `<type>: <description>` message (see below), open a PR.
That's it.

---

## Setup

### Prerequisites

- **Bun ≥ 1.3** — `curl -fsSL https://bun.sh/install | bash`
- **Node ≥ 20** — for the bundled CLI's runtime path; the source builds with Bun
  but ships as a Node-compatible bundle
- **jq** _(optional)_ — used by `statusline/pet-status.sh` at runtime, not by the
  build. Install via `brew install jq` on macOS.

### One-time setup

```bash
bun install
```

That's the entire setup. No env vars, no API keys — petsonality runs fully local.

### Run the test suite

```bash
bun test
```

302 tests. They run in ~70ms. If yours don't pass on a fresh clone of `main`,
that's a bug — please open an issue.

### Build the bundle

```bash
bun run build
```

Runs four steps in sequence: build the MCP server (`server/index.ts` → `dist/server.js`),
build the CLI entries (`install`, `doctor`, `uninstall` → `dist/cli/*.js`), regenerate
ASCII art (`scripts/build-art.ts`), and regenerate the reactions pool
(`scripts/build-reactions.ts`).

### Try the installer locally

After `bun run build`, you can dry-run the installer against your own
`~/.claude/` directory (it's idempotent — safe to re-run):

```bash
node dist/cli/install.js
```

To inspect what got installed:

```bash
node dist/cli/doctor.js
```

---

## Commit messages

petsonality follows lightweight conventional commits. Look at recent history
(`git log --oneline`) for the patterns. Common prefixes:

| Prefix | When to use |
|--------|-------------|
| `feat:` | New user-visible capability |
| `fix:` | Bug fix |
| `fix(ci):` | CI / build-only fix |
| `docs:` | README, CONTRIBUTING, PRD, comments |
| `refactor:` | Internal restructure, no behavior change |
| `test:` | Tests only |
| `chore:` | Release prep, deps, .gitignore, etc. |

Keep the subject line under ~70 chars. Body paragraphs (optional) explain the
"why," not the "what" — the diff already shows what changed.

Don't add `Co-Authored-By` trailers from AI tools.

---

## Pull request flow

1. **Open an issue first if the change is non-trivial.** A 5-line bugfix doesn't
   need one. A new feature, a behavior change, or anything affecting ~50+ lines
   should start with an issue so we can align on scope before you spend time.

2. **Fork, branch, push.** Branch name: `fix/<short-slug>`, `feat/<short-slug>`,
   or just `<short-slug>`.

3. **Run `bun test` and `bun run build` before opening the PR.** Both should be
   clean. CI also runs a version-consistency check (package.json, plugin.json,
   server/index.ts must match) — `npm version` handles this for you, but if you
   touch versions manually, run `node scripts/sync-version.mjs`.

4. **PR description**: link the issue, describe the change in 2-3 sentences,
   note anything you're unsure about. Screenshots welcome for status-line / art
   changes.

5. **Reviews are quick.** Expect a response within a day or two for small PRs.

---

## What's a good first contribution?

Issues labeled
[`good first issue`](https://github.com/nanami-he/petsonality/labels/good%20first%20issue)
are scoped, well-defined, and don't require reading the whole codebase. Pick one
and comment "I'd like to take this" — I'll assign it to you.

If nothing labeled fits, other low-friction places to contribute:

- **Reactions** — add new lines to the reactions pool for a personality whose
  voice you know well. Each pet has its own pool; see
  `scripts/build-reactions.ts` for the structure.
- **Personality openers** — Phase 2 backlog item (`PRD-v3.md`) has a spec for
  per-personality session-opening lines. PRs welcome ahead of schedule.
- **Docs** — README clarity, FAQ entries, troubleshooting steps.
- **Cross-platform** — petsonality was built on macOS; Windows + Linux edge
  cases keep surfacing. If you hit one, file an issue with `bug` label.

---

## Project layout (orientation)

```
petsonality/
├── server/             ← MCP server (the "brain"; runs in Claude Code)
│   ├── index.ts        ← all MCP tools (pet_adopt, pet_react, etc.)
│   ├── pets.ts         ← 16 personalities + their reaction styles
│   ├── art.ts          ← ASCII art (5 lines × 12 chars/frame, source of truth)
│   ├── voice.ts        ← personality prompt builder
│   └── messages.ts     ← i18n catalog (zh + en)
├── cli/                ← npx petsonality entry point
│   ├── install.ts      ← installer (cross-platform)
│   ├── which.ts        ← cross-platform binary lookup
│   └── openclaw-patch.ts ← OpenClaw TUI patch (transitional)
├── hooks/              ← Claude Code hook scripts (PostToolUse, Stop)
├── statusline/         ← bash + PowerShell status lines
├── skills/             ← Claude Code skill definition (pet/SKILL.md)
├── scripts/            ← build-time tools
└── dist/               ← bundled output (tracked for plugin installs)
```

The `dist/` directory is the bundled runtime used by npm and plugin installs — see
`package.json` `"files"` for the actual ship list.

---

## Style conventions

- **ASCII art** must follow the fixed grid: 5 lines × 12 characters. All pets face
  left (right-aligned in the status line). `server/art.ts` is the single source
  of truth — `statusline/pet-status.sh` is regenerated from it via
  `bun run build:art`.
- **Test on dark terminal backgrounds** — that's the default assumption. Light
  terminals are supported but secondary.
- **Shell scripts**: keep macOS-compatible (bash 3.x baseline; no bash 4+
  features).
- **TypeScript**: project uses Bun's bundled tsc settings; no separate ESLint
  config — Bun's strictness is the bar.

---

## Where to ask questions

- **Bug reports & feature requests**: GitHub Issues with the appropriate label
- **Anything else**: open a Discussion or file a question-tagged issue

---

Thanks for reading this far. Looking forward to your PR.
