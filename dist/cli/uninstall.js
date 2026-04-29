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
import { existsSync, statSync, realpathSync } from "fs";
import { join, delimiter } from "path";
import { platform } from "os";
function whichSync(name) {
  if (name.includes("/") || name.includes("\\")) {
    return existsAndFile(name) ? name : null;
  }
  const dirs = (process.env.PATH || "").split(delimiter).filter(Boolean);
  for (const dir of dirs) {
    for (const ext of PATH_EXT) {
      const candidate = join(dir, name + ext);
      if (existsAndFile(candidate))
        return candidate;
    }
  }
  return null;
}
function existsAndFile(p) {
  try {
    return existsSync(p) && statSync(p).isFile();
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
import { readFileSync, writeFileSync, existsSync as existsSync2, copyFileSync, unlinkSync, readdirSync } from "fs";
import { join as join2, dirname } from "path";
import { homedir, platform as platform2 } from "os";
import { fileURLToPath } from "url";
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
    return readdirSync(distDir).filter((f) => f.startsWith("tui-") && f.endsWith(".js") && !f.includes("cli")).map((f) => join2(distDir, f));
  } catch {
    return [];
  }
}
function findOpenClawTuiFile() {
  const resolved = realPathOf("openclaw");
  if (resolved) {
    const distDir = join2(dirname(resolved), "dist");
    const candidates = findTuiFiles(distDir);
    if (candidates.length === 1)
      return candidates[0];
  }
  const paths = IS_WIN2 ? [
    join2(process.env.APPDATA || "", "npm", "node_modules", "openclaw", "dist"),
    join2(process.env.LOCALAPPDATA || "", "pnpm", "global", "5", "node_modules", "openclaw", "dist")
  ] : [
    "/opt/homebrew/lib/node_modules/openclaw/dist",
    join2(homedir(), ".npm-global/lib/node_modules/openclaw/dist"),
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
  if (!existsSync2(backupPath)) {
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
  if (existsSync2(backupPath)) {
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
  if (existsSync2(backupPath))
    return { status: "stale", file: tuiFile };
  return { status: "unpatched", file: tuiFile };
}
function autoUpgrade() {
  const diag = diagnosePatch();
  if (diag.status === "native" && diag.file) {
    const backupPath = diag.file + ".petsonality-backup";
    if (existsSync2(backupPath)) {
      unlinkSync(backupPath);
      return { upgraded: true, message: "Native statusLine detected — removed old patch backup" };
    }
    return { upgraded: false, message: "Native statusLine detected — already clean" };
  }
  if (diag.status === "stale" && diag.file) {
    const backupPath = diag.file + ".petsonality-backup";
    if (existsSync2(backupPath)) {
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
  __isMain = process.argv[1] === fileURLToPath(import.meta.url);
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
            if (diag.file && existsSync2(diag.file + ".petsonality-backup")) {
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
        const ocConfigPath = join2(homedir(), ".openclaw", "openclaw.json");
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
        const statusPath = join2(homedir(), ".petsonality", "status.json");
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

// cli/uninstall.ts
import { readFileSync as readFileSync2, writeFileSync as writeFileSync2, existsSync as existsSync3, rmSync, readdirSync as readdirSync2 } from "fs";
import { join as join3 } from "path";
import { homedir as homedir2 } from "os";
var GREEN2 = "\x1B[32m";
var YELLOW2 = "\x1B[33m";
var NC2 = "\x1B[0m";
function ok2(msg) {
  console.log(`${GREEN2}✓${NC2}  ${msg}`);
}
function warn2(msg) {
  console.log(`${YELLOW2}⚠${NC2}  ${msg}`);
}
var CLAUDE_DIR = join3(homedir2(), ".claude");
var SETTINGS_FILE = join3(CLAUDE_DIR, "settings.json");
var SKILL_DIR = join3(CLAUDE_DIR, "skills", "pet");
var STATE_DIR = join3(homedir2(), ".petsonality");
var LEGACY_STATE_DIR = join3(homedir2(), ".mbti-pet");
console.log(`
petsonality uninstall
`);
try {
  for (const dir of [STATE_DIR, LEGACY_STATE_DIR]) {
    if (!existsSync3(dir))
      continue;
    for (const f of readdirSync2(dir).filter((f2) => f2.startsWith("popup-reopen-pid."))) {
      const pidPath = join3(dir, f);
      const pid = parseInt(readFileSync2(pidPath, "utf8").trim(), 10);
      if (pid > 0) {
        try {
          process.kill(pid);
        } catch {}
      }
      rmSync(pidPath, { force: true });
    }
    const patterns = [
      "popup-stop.",
      "popup-resize.",
      "popup-env.",
      "popup-scroll.",
      "reaction.",
      ".last_reaction.",
      ".last_comment."
    ];
    for (const f of readdirSync2(dir)) {
      if (patterns.some((p) => f.startsWith(p))) {
        rmSync(join3(dir, f), { force: true });
      }
    }
  }
  if (process.env.TMUX) {
    const { execSync } = await import("child_process");
    execSync("tmux display-popup -C 2>/dev/null", { stdio: "ignore" });
  }
  ok2("Popup stopped");
} catch {}
try {
  const claudeJsonPath = join3(homedir2(), ".claude.json");
  const claudeJson = JSON.parse(readFileSync2(claudeJsonPath, "utf8"));
  let removed = false;
  for (const key of ["petsonality", "typet"]) {
    if (claudeJson.mcpServers?.[key]) {
      delete claudeJson.mcpServers[key];
      removed = true;
    }
  }
  if (removed) {
    if (Object.keys(claudeJson.mcpServers ?? {}).length === 0)
      delete claudeJson.mcpServers;
    writeFileSync2(claudeJsonPath, JSON.stringify(claudeJson, null, 2));
    ok2("MCP server removed from ~/.claude.json");
  }
} catch {
  warn2("Could not update ~/.claude.json");
}
try {
  const settings = JSON.parse(readFileSync2(SETTINGS_FILE, "utf8"));
  let changed = false;
  if (settings.statusLine?.command?.includes("pet")) {
    delete settings.statusLine;
    ok2("Status line removed");
    changed = true;
  }
  for (const hookType of ["PostToolUse", "Stop", "SessionStart", "SessionEnd"]) {
    if (settings.hooks?.[hookType]) {
      const before = settings.hooks[hookType].length;
      settings.hooks[hookType] = settings.hooks[hookType].filter((h) => !h.hooks?.some((hh) => hh.command?.includes("petsonality") || hh.command?.includes("typet")));
      if (settings.hooks[hookType].length < before) {
        ok2(`${hookType} hooks removed`);
        changed = true;
      }
      if (settings.hooks[hookType].length === 0)
        delete settings.hooks[hookType];
    }
  }
  if (settings.hooks && Object.keys(settings.hooks).length === 0)
    delete settings.hooks;
  if (changed) {
    writeFileSync2(SETTINGS_FILE, JSON.stringify(settings, null, 2) + `
`);
  }
} catch {
  warn2("Could not update settings.json");
}
if (existsSync3(SKILL_DIR)) {
  rmSync(SKILL_DIR, { recursive: true });
  ok2("Skill removed");
} else {
  warn2("Skill not found (already removed)");
}
try {
  const { removePatch: removePatch2 } = await Promise.resolve().then(() => (init_openclaw_patch(), exports_openclaw_patch));
  const result = removePatch2();
  if (result.success && result.message !== "No patch to remove") {
    ok2(result.message);
  }
  const ocConfigPath = join3(homedir2(), ".openclaw", "openclaw.json");
  if (existsSync3(ocConfigPath)) {
    const ocConfig = JSON.parse(readFileSync2(ocConfigPath, "utf8"));
    let changed = false;
    if (ocConfig.mcp?.servers?.["petsonality"]) {
      delete ocConfig.mcp.servers["petsonality"];
      if (Object.keys(ocConfig.mcp.servers).length === 0)
        delete ocConfig.mcp.servers;
      if (Object.keys(ocConfig.mcp).length === 0)
        delete ocConfig.mcp;
      changed = true;
    }
    if (ocConfig.ui?.statusLine) {
      delete ocConfig.ui.statusLine;
      if (Object.keys(ocConfig.ui).length === 0)
        delete ocConfig.ui;
      changed = true;
    }
    if (changed) {
      writeFileSync2(ocConfigPath, JSON.stringify(ocConfig, null, 2));
      ok2("OpenClaw MCP + statusLine config removed");
    }
  }
} catch {}
if (existsSync3(STATE_DIR)) {
  warn2(`Pet data kept at ${STATE_DIR} — delete manually if not needed`);
} else if (existsSync3(LEGACY_STATE_DIR)) {
  warn2(`Pet data kept at ${LEGACY_STATE_DIR} — delete manually if not needed`);
}
console.log(`
${GREEN2}Done.${NC2} Restart Claude Code to apply changes.
`);
