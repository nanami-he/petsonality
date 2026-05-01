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

// cli/install.ts
init_openclaw_patch();
init_which();
import { readFileSync as readFileSync2, writeFileSync as writeFileSync2, mkdirSync, existsSync as existsSync4, cpSync } from "fs";
import { execSync } from "child_process";
import { join as join5 } from "path";
import { homedir as homedir2, platform as platform3 } from "os";

// cli/hook-command.ts
function formatHookCommand(nodePath, hookPath) {
  return `"${nodePath}" "${hookPath}"`;
}

// cli/find-package-root.ts
import { existsSync as existsSync3 } from "fs";
import { join as join3, resolve, dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
function findPackageRoot(startUrl) {
  let dir = resolve(dirname2(fileURLToPath2(startUrl)));
  while (!existsSync3(join3(dir, "package.json"))) {
    const parent = dirname2(dir);
    if (parent === dir)
      break;
    dir = parent;
  }
  return dir;
}

// cli/statusline-config.ts
import { join as join4, win32 } from "path";
function statusLineScriptPath(currentPlatform, runtimeDir) {
  const scriptName = currentPlatform === "win32" ? "pet-status.ps1" : "pet-status.sh";
  const pathJoin = currentPlatform === "win32" ? win32.join : join4;
  return pathJoin(runtimeDir, "statusline", scriptName);
}
function quoteWindowsCommandArg(value) {
  return `"${value.replaceAll('"', "\\\"")}"`;
}
function formatStatusLineCommand(currentPlatform, runtimeDir) {
  const scriptPath = statusLineScriptPath(currentPlatform, runtimeDir);
  if (currentPlatform === "win32") {
    return `powershell.exe -NoProfile -ExecutionPolicy Bypass -File ${quoteWindowsCommandArg(scriptPath)}`;
  }
  return scriptPath;
}
function statusLineConfigForPlatform(currentPlatform, runtimeDir) {
  return {
    type: "command",
    command: formatStatusLineCommand(currentPlatform, runtimeDir),
    padding: 1,
    refreshInterval: 1
  };
}

// cli/install.ts
import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "process";

// cli/install-transparency.ts
function isPetsonalityCommand(command) {
  return typeof command === "string" && (command.includes("petsonality") || command.includes("typet"));
}
function statusLineReplacementPreview(existing, next) {
  if (!existing || typeof existing !== "object")
    return null;
  const command = existing.command;
  if (!command || isPetsonalityCommand(command))
    return null;
  return { existing, next };
}
function findPetsonalityHookEntries(entries) {
  if (!Array.isArray(entries))
    return [];
  return entries.filter((entry) => Array.isArray(entry.hooks) && entry.hooks.some((hook) => isPetsonalityCommand(hook.command)));
}
function formatReplacementPreview(title, preview) {
  return [
    title,
    "Current:",
    JSON.stringify(preview.existing, null, 2),
    "Petsonality will write:",
    JSON.stringify(preview.next, null, 2)
  ].join(`
`);
}

// cli/install.ts
var CURRENT_PLATFORM = platform3();
var IS_WIN3 = CURRENT_PLATFORM === "win32";
var CYAN2 = "\x1B[36m";
var GREEN2 = "\x1B[32m";
var YELLOW2 = "\x1B[33m";
var RED2 = "\x1B[31m";
var BOLD = "\x1B[1m";
var DIM2 = "\x1B[2m";
var NC2 = "\x1B[0m";
var CLAUDE_DIR = join5(homedir2(), ".claude");
var SETTINGS_FILE = join5(CLAUDE_DIR, "settings.json");
var SKILL_DIR = join5(CLAUDE_DIR, "skills", "pet");
var PROJECT_ROOT = findPackageRoot(import.meta.url);
function banner() {
  console.log(`
${CYAN2}╔══════════════════════════════════════════════════════════╗${NC2}
${CYAN2}║${NC2}  ${BOLD}petsonality${NC2} — MBTI terminal pet companion       ${CYAN2}║${NC2}
${CYAN2}║${NC2}  ${DIM2}MCP + Skill + StatusLine + Hooks${NC2}                  ${CYAN2}║${NC2}
${CYAN2}╚══════════════════════════════════════════════════════════╝${NC2}
`);
}
function ok2(msg) {
  console.log(`${GREEN2}✓${NC2}  ${msg}`);
}
function info2(msg) {
  console.log(`${CYAN2}→${NC2}  ${msg}`);
}
function warn2(msg) {
  console.log(`${YELLOW2}⚠${NC2}  ${msg}`);
}
function err2(msg) {
  console.log(`${RED2}✗${NC2}  ${msg}`);
}
async function confirmChange(title, existing, next) {
  console.log("");
  console.log(formatReplacementPreview(`${YELLOW2}${title}${NC2}`, { existing, next }));
  if (process.env.PETSONALITY_ASSUME_YES === "1") {
    info2("PETSONALITY_ASSUME_YES=1 set — continuing");
    return true;
  }
  if (!input.isTTY) {
    warn2("Non-interactive install — continuing for backwards compatibility");
    return true;
  }
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question("Replace this config? [y/N] ");
    return answer.trim().toLowerCase() === "y" || answer.trim().toLowerCase() === "yes";
  } finally {
    rl.close();
  }
}
function detectHosts() {
  const claude = existsSync4(CLAUDE_DIR) && existsSync4(join5(homedir2(), ".claude.json"));
  let openclaw = false;
  try {
    openclaw = !!findOpenClawTuiFile();
  } catch {
    openclaw = !!whichSync("openclaw");
  }
  return { claude, openclaw };
}
function preflight() {
  let pass = true;
  try {
    const nodeVer = execSync("node --version", { encoding: "utf8" }).trim();
    ok2(`node found (${nodeVer})`);
  } catch {
    err2("node not found. Install: https://nodejs.org/");
    pass = false;
  }
  if (IS_WIN3) {
    ok2("PowerShell status line available (no jq required on Windows)");
  } else {
    try {
      execSync("jq --version", { stdio: "ignore" });
      ok2("jq found (used by status line)");
    } catch {
      warn2("jq not found — status line bubbles will be limited");
      info2("Install: brew install jq (optional)");
    }
  }
  const hosts = detectHosts();
  if (hosts.claude)
    ok2("Claude Code detected");
  if (hosts.openclaw)
    ok2("OpenClaw detected");
  if (!hosts.claude && !hosts.openclaw) {
    err2("No supported host found.");
    info2("Install Claude Code (https://claude.ai/code) or OpenClaw (https://github.com/openclaw/openclaw)");
    pass = false;
  }
  return pass;
}
function loadSettings() {
  try {
    return JSON.parse(readFileSync2(SETTINGS_FILE, "utf8"));
  } catch {
    return {};
  }
}
function saveSettings(settings) {
  mkdirSync(CLAUDE_DIR, { recursive: true });
  writeFileSync2(SETTINGS_FILE, JSON.stringify(settings, null, 2) + `
`);
}
function installMcp() {
  const nodePath = process.execPath;
  const serverPath = join5(RUNTIME_DIR, "dist", "server.js");
  const claudeJsonPath = join5(homedir2(), ".claude.json");
  let claudeJson = {};
  try {
    claudeJson = JSON.parse(readFileSync2(claudeJsonPath, "utf8"));
  } catch {}
  if (!claudeJson.mcpServers)
    claudeJson.mcpServers = {};
  if (claudeJson.mcpServers["typet"]) {
    delete claudeJson.mcpServers["typet"];
  }
  claudeJson.mcpServers["petsonality"] = {
    command: nodePath,
    args: [serverPath]
  };
  writeFileSync2(claudeJsonPath, JSON.stringify(claudeJson, null, 2));
  ok2("MCP server registered in ~/.claude.json");
}
function installSkill() {
  const srcSkill = join5(PROJECT_ROOT, "skills", "pet", "SKILL.md");
  mkdirSync(SKILL_DIR, { recursive: true });
  cpSync(srcSkill, join5(SKILL_DIR, "SKILL.md"), { force: true });
  ok2("Skill installed: ~/.claude/skills/pet/SKILL.md");
}
async function installStatusLine(settings) {
  const nextStatusLine = statusLineConfigForPlatform(CURRENT_PLATFORM, RUNTIME_DIR);
  const preview = statusLineReplacementPreview(settings.statusLine, nextStatusLine);
  if (preview) {
    warn2("Existing non-petsonality statusLine found.");
    const confirmed = await confirmChange("Petsonality statusLine replacement", preview.existing, preview.next);
    if (!confirmed) {
      warn2("Skipped status line configuration at your request");
      return;
    }
    mkdirSync(join5(homedir2(), ".petsonality"), { recursive: true });
    writeFileSync2(join5(homedir2(), ".petsonality", "statusline.bak"), JSON.stringify(settings.statusLine, null, 2));
    warn2("Old config backed up in ~/.petsonality/statusline.bak");
  }
  settings.statusLine = nextStatusLine;
  ok2(IS_WIN3 ? "PowerShell status line configured" : "Status line configured");
  if (IS_WIN3) {
    info2("If Claude Code does not render the status line, accept the project trust dialog and restart Claude Code.");
  }
}
function installRuntimeFiles() {
  const runtimeDir = join5(homedir2(), ".petsonality");
  mkdirSync(join5(runtimeDir, "hooks"), { recursive: true });
  mkdirSync(join5(runtimeDir, "statusline"), { recursive: true });
  cpSync(join5(PROJECT_ROOT, "hooks", "react.js"), join5(runtimeDir, "hooks", "react.js"), { force: true });
  cpSync(join5(PROJECT_ROOT, "hooks", "pet-comment.js"), join5(runtimeDir, "hooks", "pet-comment.js"), { force: true });
  cpSync(join5(PROJECT_ROOT, "statusline", "pet-status.sh"), join5(runtimeDir, "statusline", "pet-status.sh"), { force: true });
  cpSync(join5(PROJECT_ROOT, "statusline", "pet-status.ps1"), join5(runtimeDir, "statusline", "pet-status.ps1"), { force: true });
  cpSync(join5(PROJECT_ROOT, "statusline", "pet-art.json"), join5(runtimeDir, "statusline", "pet-art.json"), { force: true });
  try {
    execSync(`chmod +x "${join5(runtimeDir, "statusline", "pet-status.sh")}"`);
  } catch {}
  mkdirSync(join5(runtimeDir, "dist"), { recursive: true });
  cpSync(join5(PROJECT_ROOT, "dist", "server.js"), join5(runtimeDir, "dist", "server.js"), { force: true });
  ok2("Runtime files copied to ~/.petsonality/");
}
var RUNTIME_DIR = join5(homedir2(), ".petsonality");
async function replacePetsonalityHookEntries(settings, hookType, nextEntry) {
  if (!settings.hooks[hookType])
    settings.hooks[hookType] = [];
  const existingEntries = findPetsonalityHookEntries(settings.hooks[hookType]);
  if (existingEntries.length > 0) {
    const confirmed = await confirmChange(`Petsonality ${hookType} hook replacement`, existingEntries, nextEntry);
    if (!confirmed) {
      warn2(`Skipped ${hookType} hook replacement at your request`);
      return false;
    }
  }
  settings.hooks[hookType] = settings.hooks[hookType].filter((h) => !h.hooks?.some((hh) => hh.command?.includes("petsonality") || hh.command?.includes("typet")));
  settings.hooks[hookType].push(nextEntry);
  return true;
}
async function installHooks(settings) {
  const reactHook = join5(RUNTIME_DIR, "hooks", "react.js");
  const commentHook = join5(RUNTIME_DIR, "hooks", "pet-comment.js");
  if (!settings.hooks)
    settings.hooks = {};
  const nodePath = process.execPath;
  const postToolUseEntry = {
    hooks: [{ type: "command", command: formatHookCommand(nodePath, reactHook) }]
  };
  const stopEntry = {
    hooks: [{ type: "command", command: formatHookCommand(nodePath, commentHook) }]
  };
  const postToolUseInstalled = await replacePetsonalityHookEntries(settings, "PostToolUse", postToolUseEntry);
  const stopInstalled = await replacePetsonalityHookEntries(settings, "Stop", stopEntry);
  if (postToolUseInstalled || stopInstalled)
    ok2("Hooks registered: PostToolUse + Stop");
}
function ensurePermissions(settings) {
  if (!settings.permissions)
    settings.permissions = {};
  if (!settings.permissions.allow)
    settings.permissions.allow = [];
  const allow = settings.permissions.allow;
  const legacyIdx = allow.findIndex((p) => p.includes("typet"));
  if (legacyIdx !== -1)
    allow.splice(legacyIdx, 1);
  if (!allow.some((p) => p.includes("petsonality"))) {
    allow.push("mcp__petsonality__*");
    ok2("Permission added: mcp__petsonality__*");
  } else {
    ok2("MCP permissions already configured");
  }
}
async function installOpenClaw() {
  const { diagnosePatch: diagnosePatch2, applyPatch: applyPatch2, autoUpgrade: autoUpgrade2 } = await Promise.resolve().then(() => (init_openclaw_patch(), exports_openclaw_patch));
  const diag = diagnosePatch2();
  if (diag.status === "not-installed")
    return;
  info2("OpenClaw detected");
  const ocConfigPath = join5(homedir2(), ".openclaw", "openclaw.json");
  let ocConfig = {};
  try {
    ocConfig = JSON.parse(readFileSync2(ocConfigPath, "utf8"));
  } catch {}
  const ocNodePath = process.execPath;
  const ocServerPath = join5(RUNTIME_DIR, "dist", "server.js");
  if (!ocConfig.mcp)
    ocConfig.mcp = {};
  if (!ocConfig.mcp.servers)
    ocConfig.mcp.servers = {};
  ocConfig.mcp.servers["petsonality"] = {
    command: ocNodePath,
    args: [ocServerPath],
    env: {
      PETSONALITY_HOST: "openclaw"
    }
  };
  ok2("MCP server registered in OpenClaw config (with host env)");
  const statusLineCommand = formatStatusLineCommand(CURRENT_PLATFORM, RUNTIME_DIR);
  switch (diag.status) {
    case "native": {
      if (!ocConfig.ui)
        ocConfig.ui = {};
      ocConfig.ui.statusLine = {
        command: statusLineCommand,
        refreshInterval: 1000
      };
      ok2("OpenClaw has native statusLine support — using config");
      const upgrade = autoUpgrade2();
      if (upgrade.upgraded)
        ok2(upgrade.message);
      break;
    }
    case "patched": {
      ok2("Patch already active");
      break;
    }
    case "stale": {
      warn2("OpenClaw updated — patch was removed, re-applying...");
      const result = applyPatch2(statusLineCommand);
      if (result.success)
        ok2(result.message);
      else
        warn2(result.message);
      break;
    }
    case "unpatched": {
      info2("Applying temporary statusLine patch...");
      warn2("This is a compatibility patch until OpenClaw merges statusLine support");
      const result = applyPatch2(statusLineCommand);
      if (result.success)
        ok2(result.message);
      else
        warn2(result.message);
      break;
    }
  }
  try {
    writeFileSync2(ocConfigPath, JSON.stringify(ocConfig, null, 2));
  } catch {
    warn2("Could not write OpenClaw config");
  }
}
banner();
info2(`Checking requirements...
`);
if (!preflight()) {
  console.log(`
${RED2}Installation aborted. Fix the issues above and retry.${NC2}
`);
  process.exit(1);
}
console.log("");
info2(`Installing petsonality...
`);
var hosts = detectHosts();
installRuntimeFiles();
if (hosts.claude) {
  info2(`Installing for Claude Code...
`);
  const settings = loadSettings();
  installMcp();
  installSkill();
  await installStatusLine(settings);
  await installHooks(settings);
  ensurePermissions(settings);
  saveSettings(settings);
} else {
  info2("Claude Code not detected — skipping Claude-specific setup");
}
try {
  const builtPool = join5(PROJECT_ROOT, "dist", "reactions-pool.json");
  const runtimePool = join5(RUNTIME_DIR, "reactions-pool.json");
  if (existsSync4(builtPool)) {
    cpSync(builtPool, runtimePool, { force: true });
    ok2("Reactions pool installed (638/lang)");
  } else {
    warn2("dist/reactions-pool.json missing — hooks will use fallback reactions");
    info2("(this should not happen for npm-installed copies; rebuild with `bun run build:reactions` if developing locally)");
  }
} catch (e) {
  warn2(`Could not install reactions pool — hooks will use fallback reactions (${e.message})`);
}
await installOpenClaw();
var hostNames = [];
if (hosts.claude)
  hostNames.push("Claude Code");
if (hosts.openclaw)
  hostNames.push("OpenClaw");
console.log(`
${GREEN2}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC2}
${GREEN2}  Done! Restart ${hostNames.join(" / ")} and type /pet${NC2}
${GREEN2}  Your pet will guide you through adoption.${NC2}
${GREEN2}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC2}

${DIM2}  /pet          adopt or show your pet
  /pet pet      interact with your pet
  /pet off      mute reactions
  /pet on       unmute reactions${NC2}
`);
