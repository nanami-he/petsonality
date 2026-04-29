# Windows statusline troubleshooting

Investigation log: 2026-04-29 → 2026-04-30. Native Windows install of Claude Code does not invoke the configured `statusLine.command`, so the petsonality pet never appears in the bottom status bar.

## Symptom

- petsonality install completes; `~/.claude/settings.json` has a valid `statusLine` block.
- Pet card via `/pet` works (MCP path is fine).
- Stop / PostToolUse hooks fire (pet reaction comments appear).
- Bottom statusline area stays empty — no pet ASCII, no error.

## Reproduction

Wrapper script `pet-status-win.sh` augmented with logging at the top: every invocation appends to `~/.petsonality/statusline-debug.log`. Manual invocation (`echo '{...}' | bash pet-status-win.sh`) writes the log immediately. After restarting Claude Code in a fresh PowerShell session and exchanging a message, the log file is **not created at all** — the wrapper is never spawned.

Tested versions, all installed via npm:

| Version | settings.json accepted | statusLine command spawned | Log written |
|---------|---|---|---|
| v2.1.123 (current) | yes | no | none |
| v2.1.118 | yes | no | none |
| v2.1.45 (with `defaultMode: "default"`) | yes | no | none |

Evidence is consistent: command never spawns. Not a script bug, not a settings parse error, not a rendering issue.

## What is NOT the cause

Ruled out during investigation:

- **Pet script** — `pet-status-win.sh` and `pet-status.sh` work when invoked manually; produce expected ASCII output, exit 0.
- **bash / jq path** — `C:/PROGRA~1/Git/bin/bash.exe` resolves; `jq` resolves via `$WINGET_LINKS`.
- **settings.json parse** — accepted by all three versions tested (v2.1.45 only after changing `permissions.defaultMode` from the newer `"auto"` value).
- **Project-level settings override** — `system32/.claude/settings.local.json` only contains permissions, no `statusLine` override.
- **Trust dialog (apocalx workaround)** — already true. Real trust file is `~/.claude.json` (in home, **not** `~/.claude/.claude.json`). The actively-used project entry `C:/WINDOWS/system32` has `hasTrustDialogAccepted: true` and `projectOnboardingSeenCount: 5`. The workaround in [anthropics/claude-code#31670](https://github.com/anthropics/claude-code/issues/31670) does not apply to this machine's state.
- **Font / Unicode / ANSI rendering** — bug is upstream of any rendering: command never runs.
- **npm vs native installer** — the npm package (`@anthropic-ai/claude-code`) is a wrapper that installs the native `.exe` via postinstall; running `npm install -g` already gives the native binary. There is no separate "native" path to try.

## Upstream state

- [anthropics/claude-code#31670](https://github.com/anthropics/claude-code/issues/31670) — OPEN, labels `area:statusline + bug + platform:windows + stale`. Same symptom (statusLine command never invoked on Windows). Reporter says v2.1.45 worked for them; it does not on this machine, suggesting the symptom may have multiple sources or environmental factors.
- [anthropics/claude-code#52997](https://github.com/anthropics/claude-code/issues/52997) — CLOSED as duplicate of #31670.
- No fix in flight as of 2026-04-30.

## What still works

The **Stop hook** (`hooks/pet-comment.js`) and **PostToolUse hook** (`hooks/react.js`) both fire correctly on Windows — confirmed via session metrics in `~/.claude.json` showing `hook_duration_ms_count` > 0. So pet reactions still appear inline after responses, even without statusline.

For Windows users today, the pet's main visible surface is the Stop-hook reaction comment, not the statusline.

## Related work

- [petsonality#4](https://github.com/nanami-he/petsonality/issues/4) — contributor `MestreY0d4-Uninter` is implementing a native PowerShell version (`pet-status.ps1`) so Win users no longer need Git Bash + jq. **Independent fix**: even after this lands, the upstream Claude Code bug above must also be resolved before statusline displays.

## Recommended user-facing communication

When a Windows user reports "pet doesn't show in statusline":

1. Do **not** debug their script or `settings.json` first — those are almost certainly fine.
2. Confirm hooks are working (pet reaction comments appear after Claude responses) — this isolates the issue to statusline, not the install.
3. Point at upstream issue #31670 and note the workaround there (`~/.claude/.claude.json` trust file) may help **some** users (it didn't on every machine tested).
4. Long-term: once #31670 is fixed upstream and #4 lands locally, statusline should work natively on Windows without any user-side workaround.
