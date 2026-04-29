#!/usr/bin/env bun
// @bun
import { createRequire } from "node:module";
var __defProp = Object.defineProperty;
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// cli/which.ts
import { existsSync as existsSync2, statSync, realpathSync } from "fs";
import { join as join2, delimiter } from "path";
import { platform } from "os";
function whichSync(name) {
  if (name.includes("/") || name.includes("\\")) {
    return existsAndFile(name) ? name : null;
  }
  const dirs = (process.env.PATH || "").split(delimiter).filter(Boolean);
  for (const dir of dirs) {
    for (const ext of PATH_EXT) {
      const candidate = join2(dir, name + ext);
      if (existsAndFile(candidate))
        return candidate;
    }
  }
  return null;
}
function existsAndFile(p) {
  try {
    return existsSync2(p) && statSync(p).isFile();
  } catch {
    return false;
  }
}
function realPathOf(name) {
  const found = whichSync(name);
  if (!found)
    return null;
  try {
    return realpathSync(found);
  } catch {
    return found;
  }
}
var IS_WIN, PATH_EXT;
var init_which = __esm(() => {
  IS_WIN = platform() === "win32";
  PATH_EXT = IS_WIN ? (process.env.PATHEXT || ".COM;.EXE;.BAT;.CMD").split(";").map((e) => e.toLowerCase()) : [""];
});

// cli/openclaw-patch.ts
var exports_openclaw_patch = {};
__export(exports_openclaw_patch, {
  removePatch: () => removePatch,
  isPatchApplied: () => isPatchApplied,
  hasNativeStatusLine: () => hasNativeStatusLine,
  findOpenClawTuiFile: () => findOpenClawTuiFile,
  diagnosePatch: () => diagnosePatch,
  autoUpgrade: () => autoUpgrade,
  applyPatch: () => applyPatch
});
import { readFileSync, writeFileSync, existsSync as existsSync3, copyFileSync, unlinkSync, readdirSync } from "fs";
import { join as join3, dirname as dirname2 } from "path";
import { homedir, platform as platform2 } from "os";
import { fileURLToPath as fileURLToPath2 } from "url";
function ok(msg) {
  console.log(`${GREEN}✓${NC}  ${msg}`);
}
function info(msg) {
  console.log(`${CYAN}→${NC}  ${msg}`);
}
function warn(msg) {
  console.log(`${YELLOW}⚠${NC}  ${msg}`);
}
function err(msg) {
  console.log(`${RED}✗${NC}  ${msg}`);
}
function findTuiFiles(distDir) {
  try {
    return readdirSync(distDir).filter((f) => f.startsWith("tui-") && f.endsWith(".js") && !f.includes("cli")).map((f) => join3(distDir, f));
  } catch {
    return [];
  }
}
function findOpenClawTuiFile() {
  const resolved = realPathOf("openclaw");
  if (resolved) {
    const distDir = join3(dirname2(resolved), "dist");
    const candidates = findTuiFiles(distDir);
    if (candidates.length === 1)
      return candidates[0];
  }
  const paths = IS_WIN2 ? [
    join3(process.env.APPDATA || "", "npm", "node_modules", "openclaw", "dist"),
    join3(process.env.LOCALAPPDATA || "", "pnpm", "global", "5", "node_modules", "openclaw", "dist")
  ] : [
    "/opt/homebrew/lib/node_modules/openclaw/dist",
    join3(homedir(), ".npm-global/lib/node_modules/openclaw/dist"),
    "/usr/local/lib/node_modules/openclaw/dist"
  ];
  for (const dir of paths) {
    if (!dir)
      continue;
    const files = findTuiFiles(dir);
    if (files.length === 1)
      return files[0];
  }
  return null;
}
function isPatchApplied(filePath) {
  const content = readFileSync(filePath, "utf8");
  return content.includes(PATCH_BEGIN);
}
function hasNativeStatusLine(filePath) {
  const content = readFileSync(filePath, "utf8");
  return content.includes("tui-statusline");
}
function validateInjectionPoints(content) {
  const hasFooterAdd = content.includes("root.addChild(footer);");
  const hasEditorAdd = content.includes("root.addChild(editor);");
  const hasExitReq = content.includes("exitRequested = true;");
  const hasSetFocus = content.includes("tui.setFocus(editor);");
  const hasSpawn = content.includes('from "node:child_process"');
  return hasFooterAdd && hasEditorAdd && hasExitReq && hasSetFocus && hasSpawn;
}
function generatePatchCode(statusLineScript) {
  return `
${PATCH_BEGIN}
// Petsonality statusLine — temporary compatibility patch
// This will be removed once openclaw/openclaw PR #65886 is merged.
const __psl_Container = Container;
const __psl_Text = Text;
const __psl_statusLineContainer = new __psl_Container();
let __psl_text = null;
let __psl_timer = null;
let __psl_executing = false;
let __psl_lastOutput = "";
let __psl_currentChild = null;
const __psl_command = ${JSON.stringify(statusLineScript)};
__psl_text = new __psl_Text("", 1, 0);
__psl_statusLineContainer.addChild(__psl_text);
function __psl_execute() {
  if (__psl_executing) return;
  __psl_executing = true;
  let stdout = "";
  let killed = false;
  const child = spawn(__psl_command, { shell: true, cwd: process.cwd(),
    env: { ...process.env, STATUSLINE: "1", STATUSLINE_HOST: "openclaw" },
    stdio: ["ignore", "pipe", "ignore"] });
  __psl_currentChild = child;
  const kt = setTimeout(() => { if (!killed) { killed = true; child.kill("SIGTERM"); } }, 500);
  child.stdout?.on("data", (buf) => { stdout += buf.toString("utf8"); if (stdout.length > 4096) stdout = stdout.slice(0, 4096); });
  child.on("close", (code) => { clearTimeout(kt); __psl_executing = false; __psl_currentChild = null;
    if (killed) return;
    if (code === 0 && stdout.length > 0) { __psl_lastOutput = stdout; if (__psl_text) { __psl_text.setText(stdout.trimEnd()); tui.requestRender(); } }
    else if (code !== 0 && __psl_lastOutput.length > 0) { if (__psl_text) { __psl_text.setText(__psl_lastOutput.trimEnd()); tui.requestRender(); } }
  });
  child.on("error", () => { clearTimeout(kt); __psl_executing = false; __psl_currentChild = null; });
}
function __psl_start() { __psl_execute(); __psl_timer = setInterval(__psl_execute, 1000); }
function __psl_stop() { if (__psl_timer) { clearInterval(__psl_timer); __psl_timer = null; } if (__psl_currentChild) { __psl_currentChild.kill("SIGTERM"); __psl_currentChild = null; } }
root.addChild(__psl_statusLineContainer);
${PATCH_END}`;
}
function applyPatch(statusLineScript) {
  const tuiFile = findOpenClawTuiFile();
  if (!tuiFile) {
    return { success: false, message: "OpenClaw TUI file not found" };
  }
  if (hasNativeStatusLine(tuiFile)) {
    return { success: true, message: "OpenClaw already has native statusLine support — no patch needed" };
  }
  if (isPatchApplied(tuiFile)) {
    return { success: true, message: "Patch already applied" };
  }
  const content = readFileSync(tuiFile, "utf8");
  if (!validateInjectionPoints(content)) {
    return { success: false, message: "OpenClaw version incompatible — injection points not found" };
  }
  const backupPath = tuiFile + ".petsonality-backup";
  if (!existsSync3(backupPath)) {
    copyFileSync(tuiFile, backupPath);
  }
  const patchCode = generatePatchCode(statusLineScript);
  let patched = content;
  patched = patched.replace("root.addChild(editor);", `root.addChild(editor);
${patchCode}`);
  patched = patched.replace("tui.setFocus(editor);", `tui.setFocus(editor);
	${PATCH_BEGIN}_START
	__psl_start();
	${PATCH_END}_START`);
  patched = patched.replace("exitRequested = true;", `exitRequested = true;
		${PATCH_BEGIN}_EXIT
		__psl_stop();
		${PATCH_END}_EXIT`);
  writeFileSync(tuiFile, patched);
  return { success: true, message: `Patched: ${tuiFile}` };
}
function removePatch() {
  const tuiFile = findOpenClawTuiFile();
  if (!tuiFile) {
    return { success: false, message: "OpenClaw TUI file not found" };
  }
  const backupPath = tuiFile + ".petsonality-backup";
  if (existsSync3(backupPath)) {
    copyFileSync(backupPath, tuiFile);
    unlinkSync(backupPath);
    return { success: true, message: "Restored original OpenClaw TUI file" };
  }
  if (!isPatchApplied(tuiFile)) {
    return { success: true, message: "No patch to remove" };
  }
  return { success: false, message: "Backup not found — cannot safely restore" };
}
function diagnosePatch() {
  const tuiFile = findOpenClawTuiFile();
  if (!tuiFile)
    return { status: "not-installed" };
  if (hasNativeStatusLine(tuiFile))
    return { status: "native", file: tuiFile };
  if (isPatchApplied(tuiFile))
    return { status: "patched", file: tuiFile };
  const backupPath = tuiFile + ".petsonality-backup";
  if (existsSync3(backupPath))
    return { status: "stale", file: tuiFile };
  return { status: "unpatched", file: tuiFile };
}
function autoUpgrade() {
  const diag = diagnosePatch();
  if (diag.status === "native" && diag.file) {
    const backupPath = diag.file + ".petsonality-backup";
    if (existsSync3(backupPath)) {
      unlinkSync(backupPath);
      return { upgraded: true, message: "Native statusLine detected — removed old patch backup" };
    }
    return { upgraded: false, message: "Native statusLine detected — already clean" };
  }
  if (diag.status === "stale" && diag.file) {
    const backupPath = diag.file + ".petsonality-backup";
    if (existsSync3(backupPath)) {
      unlinkSync(backupPath);
    }
    return { upgraded: false, message: "Stale patch detected — cleaned backup, needs re-patch or native upgrade" };
  }
  return { upgraded: false, message: `No upgrade needed (status: ${diag.status})` };
}
var IS_WIN2, PATCH_BEGIN = "// PETSONALITY_STATUSLINE_PATCH_BEGIN", PATCH_END = "// PETSONALITY_STATUSLINE_PATCH_END", GREEN = "\x1B[32m", YELLOW = "\x1B[33m", RED = "\x1B[31m", CYAN = "\x1B[36m", DIM = "\x1B[2m", NC = "\x1B[0m", __isMain;
var init_openclaw_patch = __esm(() => {
  init_which();
  IS_WIN2 = platform2() === "win32";
  __isMain = process.argv[1] === fileURLToPath2(import.meta.url);
  if (__isMain) {
    const action = process.argv[2] || "status";
    const scriptPath = process.argv[3];
    switch (action) {
      case "apply": {
        if (!scriptPath) {
          err("Usage: openclaw-patch apply <path-to-pet-status.sh>");
          process.exit(1);
        }
        info("Applying Petsonality statusLine patch to OpenClaw...");
        const result = applyPatch(scriptPath);
        if (result.success)
          ok(result.message);
        else {
          err(result.message);
          process.exit(1);
        }
        break;
      }
      case "remove": {
        info("Removing Petsonality patch from OpenClaw...");
        const result = removePatch();
        if (result.success)
          ok(result.message);
        else {
          err(result.message);
          process.exit(1);
        }
        break;
      }
      case "status": {
        const diag = diagnosePatch();
        switch (diag.status) {
          case "not-installed":
            warn("OpenClaw not found");
            break;
          case "native":
            ok(`OpenClaw has native statusLine support (${diag.file})`);
            break;
          case "patched":
            ok(`Patch active (${diag.file})`);
            break;
          case "stale":
            warn(`Patch was removed by OpenClaw update — run 'petsonality install' to re-apply (${diag.file})`);
            break;
          case "unpatched":
            info(`OpenClaw found but not patched (${diag.file})`);
            break;
        }
        break;
      }
      case "doctor": {
        console.log(`
${CYAN}Petsonality OpenClaw Doctor${NC}
`);
        const diag = diagnosePatch();
        if (diag.status === "not-installed") {
          err("OpenClaw not found");
          console.log(`${DIM}  Install OpenClaw or check your PATH${NC}`);
          process.exit(1);
        }
        ok(`OpenClaw found: ${diag.file}`);
        switch (diag.status) {
          case "native":
            ok("StatusLine: native support (PR merged)");
            if (diag.file && existsSync3(diag.file + ".petsonality-backup")) {
              warn("Leftover patch backup found — run 'install' to clean up");
            }
            break;
          case "patched":
            ok("StatusLine: patch active");
            info("This is a temporary patch — will auto-switch when OpenClaw adds native support");
            break;
          case "stale":
            warn("StatusLine: patch was removed by OpenClaw update");
            console.log(`${DIM}  Run 'bun cli/openclaw-patch.ts apply <path>' or reinstall to fix${NC}`);
            break;
          case "unpatched":
            warn("StatusLine: not configured");
            console.log(`${DIM}  Run 'bun cli/install.ts' to set up${NC}`);
            break;
        }
        const ocConfigPath = join3(homedir(), ".openclaw", "openclaw.json");
        try {
          const ocConfig = JSON.parse(readFileSync(ocConfigPath, "utf8"));
          const petServer = ocConfig?.mcp?.servers?.petsonality;
          if (petServer) {
            ok("MCP server: registered");
            if (petServer.env?.PETSONALITY_HOST === "openclaw") {
              ok("Host env: PETSONALITY_HOST=openclaw");
            } else {
              warn("Host env: PETSONALITY_HOST not set — pet_react instructions won't activate");
            }
          } else {
            warn("MCP server: not registered in OpenClaw config");
          }
        } catch {
          warn("OpenClaw config not found or unreadable");
        }
        const statusPath = join3(homedir(), ".petsonality", "status.json");
        try {
          const status = JSON.parse(readFileSync(statusPath, "utf8"));
          ok(`Pet: ${status.name} (${status.petId})${status.muted ? " [muted]" : ""}`);
        } catch {
          info("No pet adopted yet");
        }
        console.log("");
        break;
      }
      default:
        err(`Unknown action: ${action}`);
        console.log(`${DIM}  Usage: openclaw-patch [status|apply|remove|doctor]${NC}`);
        process.exit(1);
    }
  }
});

// cli/doctor.ts
import { readFileSync as readFileSync2, existsSync as existsSync4 } from "fs";
import { execSync } from "child_process";
import { join as join4 } from "path";
import { homedir as homedir2, platform as platform3 } from "os";

// cli/find-package-root.ts
import { existsSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";
function findPackageRoot(startUrl) {
  let dir = resolve(dirname(fileURLToPath(startUrl)));
  while (!existsSync(join(dir, "package.json"))) {
    const parent = dirname(dir);
    if (parent === dir)
      break;
    dir = parent;
  }
  return dir;
}

// cli/doctor.ts
var PROJECT_ROOT = findPackageRoot(import.meta.url);
var HOME = homedir2();
var IS_WIN3 = platform3() === "win32";
var STATUS_SCRIPT = join4(PROJECT_ROOT, "statusline", IS_WIN3 ? "pet-status.ps1" : "pet-status.sh");
var RED2 = "\x1B[31m";
var GREEN2 = "\x1B[32m";
var YELLOW2 = "\x1B[33m";
var CYAN2 = "\x1B[36m";
var BOLD = "\x1B[1m";
var DIM2 = "\x1B[2m";
var NC2 = "\x1B[0m";
function section(title) {
  console.log(`
${CYAN2}${BOLD}\u2501\u2501\u2501 ${title} ${"\u2501".repeat(Math.max(0, 60 - title.length))}${NC2}`);
}
function row(label, value) {
  console.log(`  ${DIM2}${label.padEnd(28)}${NC2} ${value}`);
}
function ok2(msg) {
  console.log(`  ${GREEN2}\u2713${NC2} ${msg}`);
}
function warn2(msg) {
  console.log(`  ${YELLOW2}\u26A0${NC2} ${msg}`);
}
function err2(msg) {
  console.log(`  ${RED2}\u2717${NC2} ${msg}`);
}
function info2(msg) {
  console.log(`  ${CYAN2}\u2192${NC2} ${msg}`);
}
function tryExec(cmd, fallback = "(failed)") {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return fallback;
  }
}
function tryRead(path) {
  try {
    return readFileSync2(path, "utf8");
  } catch {
    return null;
  }
}
function tryParseJson(text) {
  if (!text)
    return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
var STATE_DIR = existsSync4(join4(HOME, ".petsonality")) ? join4(HOME, ".petsonality") : join4(HOME, ".mbti-pet");
console.log(`${CYAN2}${BOLD}
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
\u2551  petsonality doctor \u2014 diagnostic report            \u2551
\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D${NC2}`);
console.log(`
${DIM2}Copy this entire output into your GitHub issue.${NC2}`);
section("Environment");
if (IS_WIN3) {
  row("OS", tryExec("cmd.exe /c ver", process.platform));
  row("Hostname", process.env.COMPUTERNAME ?? "(unset)");
  row("User shell", process.env.ComSpec ?? process.env.COMSPEC ?? "(unset)");
  row("PowerShell version", tryExec('powershell.exe -NoProfile -Command "$PSVersionTable.PSVersion.ToString()"', "(not in PATH)"));
} else {
  row("OS", tryExec("uname -srm"));
  row("Hostname", tryExec("uname -n"));
  row("User shell", process.env.SHELL ?? "(unset)");
  row("Bash version", tryExec("bash --version | head -1"));
}
row("Bun version", tryExec("bun --version"));
row("Node version", tryExec("node --version", "(not installed)"));
if (IS_WIN3) {
  row("JSON parser", "PowerShell ConvertFrom-Json");
} else {
  row("jq version", tryExec("jq --version", "(not installed)"));
}
row("Claude Code version", tryExec("claude --version", "(not in PATH)"));
section("Terminal");
row("TERM", process.env.TERM ?? "(unset)");
row("COLORTERM", process.env.COLORTERM ?? "(unset)");
row("TERM_PROGRAM", process.env.TERM_PROGRAM ?? "(unset)");
row("LANG", process.env.LANG ?? "(unset)");
row("COLUMNS env var", process.env.COLUMNS ?? "(unset in subprocess)");
if (IS_WIN3) {
  row("WT_SESSION", process.env.WT_SESSION ?? "(unset)");
  row("ConEmuANSI", process.env.ConEmuANSI ?? "(unset)");
} else {
  row("stty size", tryExec("stty size 2>/dev/null", "(no tty)"));
  row("tput cols", tryExec("tput cols 2>/dev/null", "(failed)"));
}
section("Filesystem");
var procExists = existsSync4("/proc");
if (IS_WIN3) {
  row("Windows profile", HOME);
} else {
  row("/proc exists", procExists ? `${GREEN2}yes${NC2} (Linux)` : `${RED2}no${NC2} (macOS/BSD)`);
}
row("~/.claude/ exists", existsSync4(join4(HOME, ".claude")) ? "yes" : "no");
row("~/.claude.json exists", existsSync4(join4(HOME, ".claude.json")) ? "yes" : "no");
row("~/.petsonality/ exists", existsSync4(join4(HOME, ".petsonality")) ? "yes" : "no");
row("~/.mbti-pet/ exists (legacy)", existsSync4(join4(HOME, ".mbti-pet")) ? "yes" : "no");
row("Project root", PROJECT_ROOT);
row("Status script exists", existsSync4(STATUS_SCRIPT) ? "yes" : `${RED2}no${NC2}`);
section("petsonality state");
var pet = tryParseJson(tryRead(join4(STATE_DIR, "pet.json")));
var status = tryParseJson(tryRead(join4(STATE_DIR, "status.json")));
if (pet) {
  row("State directory", STATE_DIR);
  row("Pet name", pet.petName ?? "(none)");
  row("Animal", pet.petId ?? "(none)");
  row("MBTI", pet.userMbti ?? "(none)");
  row("Mood", pet.mood ?? "(none)");
  row("Interactions", String(pet.interactionCount ?? 0));
  row("Adopted", pet.adopted ? "yes" : "no");
  row("Adopted at", pet.adoptedAt ?? "(none)");
} else {
  err2(`No pet data found at ${STATE_DIR}/pet.json`);
}
if (status) {
  row("Status muted", String(status.muted ?? false));
  row("Current reaction", status.reaction || "(none)");
} else {
  warn2(`No status state at ${STATE_DIR}/status.json`);
}
section("Claude Code config");
var settings = tryParseJson(tryRead(join4(HOME, ".claude", "settings.json")));
var claudeJson = tryParseJson(tryRead(join4(HOME, ".claude.json")));
if (settings?.statusLine) {
  console.log(`  ${DIM2}statusLine:${NC2}`);
  console.log(`    ${JSON.stringify(settings.statusLine, null, 2).split(`
`).join(`
    `)}`);
} else {
  warn2("No statusLine in ~/.claude/settings.json");
}
if (settings?.hooks) {
  console.log(`  ${DIM2}hooks:${NC2}`);
  for (const event of Object.keys(settings.hooks)) {
    const count = settings.hooks[event]?.length ?? 0;
    row(`  ${event}`, `${count} entr${count === 1 ? "y" : "ies"}`);
  }
} else {
  warn2("No hooks configured");
}
var mcpKey = claudeJson?.mcpServers?.["petsonality"] ? "petsonality" : claudeJson?.mcpServers?.["typet"] ? "typet" : null;
if (mcpKey) {
  ok2(`MCP server registered in ~/.claude.json (key: ${mcpKey})`);
  console.log(`    ${JSON.stringify(claudeJson.mcpServers[mcpKey], null, 2).split(`
`).join(`
    `)}`);
  if (mcpKey === "typet")
    warn2("Using legacy key 'typet' \u2014 re-run installer to update");
} else {
  err2("MCP server NOT registered in ~/.claude.json");
}
var skillPath = join4(HOME, ".claude", "skills", "pet", "SKILL.md");
if (existsSync4(skillPath)) {
  ok2(`Skill installed: ${skillPath}`);
} else {
  err2(`Skill missing: ${skillPath}`);
}
section("OpenClaw");
try {
  const { diagnosePatch: diagnosePatch2 } = await Promise.resolve().then(() => (init_openclaw_patch(), exports_openclaw_patch));
  const diag = diagnosePatch2();
  switch (diag.status) {
    case "not-installed":
      row("OpenClaw", "not found");
      break;
    case "native":
      ok2(`Native statusLine support (${diag.file})`);
      break;
    case "patched":
      ok2(`Patch active (${diag.file})`);
      break;
    case "stale":
      warn2(`Patch lost \u2014 OpenClaw updated. Run 'petsonality install' to re-apply`);
      break;
    case "unpatched":
      info2(`Found but not patched (${diag.file}). Run 'petsonality install' to enable`);
      break;
  }
} catch {
  row("OpenClaw", "check skipped");
}
section("Live status line output");
var liveCommand = IS_WIN3 ? `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${STATUS_SCRIPT}"` : `echo '{}' | bash "${STATUS_SCRIPT}" 2>&1`;
console.log(`  ${DIM2}(running: ${liveCommand})${NC2}
`);
var liveOutput = tryExec(liveCommand, "(script failed)");
var lines = liveOutput.split(`
`);
console.log(lines.map((l) => `  \u2502 ${l}`).join(`
`));
console.log(`  ${DIM2}(${lines.length} lines, total ${liveOutput.length} bytes)${NC2}`);
section("Padding strategy test");
console.log(`  ${DIM2}Each row should appear right-aligned with marker '|END'.${NC2}`);
console.log(`  ${DIM2}If a row is misaligned, that strategy is broken in this terminal.${NC2}
`);
var PAD = 40;
var strategies = [
  ["space (will be trimmed!)", " "],
  ["braille blank U+2800", "\u2800"],
  ["non-breaking space U+00A0", "\xA0"],
  ["dot .", "."],
  ["middle dot \xB7", "\xB7"]
];
for (const [name, ch] of strategies) {
  const padding = ch.repeat(PAD);
  console.log(`  ${padding}|END  ${DIM2}\u2190 ${name}${NC2}`);
}
section("Display width vs string-width (npm)");
console.log(`  ${DIM2}Most terminals render Braille Blank as 2 columns.${NC2}`);
console.log(`  ${DIM2}But the npm 'string-width' package counts it as 1.${NC2}`);
console.log(`  ${DIM2}Claude Code uses string-width for layout calculations.${NC2}
`);
try {
  const sw = (await import("string-width")).default;
  row("string-width(' ')", String(sw(" ")));
  row("string-width('\\u2800')", String(sw("\u2800")));
  row("string-width('\\u00A0')", String(sw("\xA0")));
  row("string-width('-o-OO-o-')", String(sw("-o-OO-o-")));
  row("string-width('\u2800\u2800\u2800\u2800\u2800-o-OO-o-')", String(sw("\u2800\u2800\u2800\u2800\u2800-o-OO-o-")));
} catch {
  warn2("string-width not installed \u2014 skipping comparison");
}
console.log(`
${CYAN2}${BOLD}\u2501\u2501\u2501 End of report ${"\u2501".repeat(46)}${NC2}
`);
console.log(`${DIM2}Copy everything above into your GitHub issue.${NC2}
`);
