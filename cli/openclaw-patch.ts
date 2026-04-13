/**
 * OpenClaw statusLine patch — temporary compatibility injection
 *
 * Patches the installed OpenClaw TUI dist file to add statusLine.command support.
 * This is a transitional measure until the upstream PR is merged.
 *
 * - Idempotent: uses PETSONALITY_PATCH markers to detect existing patches
 * - Reversible: backs up original file before patching
 * - Safe: validates injection points before writing
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { execSync } from "child_process";
import { homedir } from "os";

const PATCH_BEGIN = "// PETSONALITY_STATUSLINE_PATCH_BEGIN";
const PATCH_END = "// PETSONALITY_STATUSLINE_PATCH_END";

const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";
const NC = "\x1b[0m";

function ok(msg: string) { console.log(`${GREEN}✓${NC}  ${msg}`); }
function info(msg: string) { console.log(`${CYAN}→${NC}  ${msg}`); }
function warn(msg: string) { console.log(`${YELLOW}⚠${NC}  ${msg}`); }
function err(msg: string) { console.log(`${RED}✗${NC}  ${msg}`); }

// ─── Find OpenClaw installation ────────────────────────────────────────────

export function findOpenClawTuiFile(): string | null {
  // Try: resolve from openclaw binary symlink
  try {
    const bin = execSync("which openclaw", { encoding: "utf8" }).trim();
    if (bin) {
      const resolved = execSync(`readlink "${bin}"`, { encoding: "utf8" }).trim();
      if (resolved) {
        const distDir = join(dirname(resolved), "dist");
        const candidates = execSync(`ls "${distDir}"/tui-*.js 2>/dev/null`, { encoding: "utf8" })
          .trim().split("\n")
          .filter(f => !f.includes("cli") && f.endsWith(".js"));
        if (candidates.length === 1) return candidates[0];
      }
    }
  } catch { /* not found via which */ }

  // Try: common install paths
  const paths = [
    "/opt/homebrew/lib/node_modules/openclaw/dist",
    join(homedir(), ".npm-global/lib/node_modules/openclaw/dist"),
    "/usr/local/lib/node_modules/openclaw/dist",
  ];
  for (const dir of paths) {
    try {
      const files = execSync(`ls "${dir}"/tui-*.js 2>/dev/null`, { encoding: "utf8" })
        .trim().split("\n")
        .filter(f => !f.includes("cli") && f.endsWith(".js"));
      if (files.length === 1) return files[0];
    } catch { /* not here */ }
  }

  return null;
}

// ─── Check if already patched ──────────────────────────────────────────────

export function isPatchApplied(filePath: string): boolean {
  const content = readFileSync(filePath, "utf8");
  return content.includes(PATCH_BEGIN);
}

// ─── Check if OpenClaw has native statusLine support ───────────────────────

export function hasNativeStatusLine(filePath: string): boolean {
  const content = readFileSync(filePath, "utf8");
  // If the file imports from tui-statusline (our PR was merged), it has native support
  return content.includes("tui-statusline");
}

// ─── Validate injection points ─────────────────────────────────────────────

function validateInjectionPoints(content: string): boolean {
  const hasFooterAdd = content.includes("root.addChild(footer);");
  const hasEditorAdd = content.includes("root.addChild(editor);");
  const hasExitReq = content.includes("exitRequested = true;");
  const hasSetFocus = content.includes("tui.setFocus(editor);");
  const hasSpawn = content.includes('from "node:child_process"');
  return hasFooterAdd && hasEditorAdd && hasExitReq && hasSetFocus && hasSpawn;
}

// ─── Generate patch code ───────────────────────────────────────────────────

function generatePatchCode(statusLineScript: string): string {
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

// ─── Apply patch ───────────────────────────────────────────────────────────

export function applyPatch(statusLineScript: string): { success: boolean; message: string } {
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

  // Backup original
  const backupPath = tuiFile + ".petsonality-backup";
  if (!existsSync(backupPath)) {
    copyFileSync(tuiFile, backupPath);
  }

  const patchCode = generatePatchCode(statusLineScript);

  let patched = content;

  // Injection 1: Add statusLine container + code after editor (below input)
  patched = patched.replace(
    "root.addChild(editor);",
    `root.addChild(editor);\n${patchCode}`,
  );

  // Injection 2: Start timer after tui.setFocus(editor)
  patched = patched.replace(
    "tui.setFocus(editor);",
    `tui.setFocus(editor);\n\t${PATCH_BEGIN}_START\n\t__psl_start();\n\t${PATCH_END}_START`,
  );

  // Injection 3: Stop timer on exit
  patched = patched.replace(
    "exitRequested = true;",
    `exitRequested = true;\n\t\t${PATCH_BEGIN}_EXIT\n\t\t__psl_stop();\n\t\t${PATCH_END}_EXIT`,
  );

  writeFileSync(tuiFile, patched);

  return { success: true, message: `Patched: ${tuiFile}` };
}

// ─── Remove patch ──────────────────────────────────────────────────────────

export function removePatch(): { success: boolean; message: string } {
  const tuiFile = findOpenClawTuiFile();
  if (!tuiFile) {
    return { success: false, message: "OpenClaw TUI file not found" };
  }

  const backupPath = tuiFile + ".petsonality-backup";
  if (existsSync(backupPath)) {
    copyFileSync(backupPath, tuiFile);
    unlinkSync(backupPath);
    return { success: true, message: "Restored original OpenClaw TUI file" };
  }

  if (!isPatchApplied(tuiFile)) {
    return { success: true, message: "No patch to remove" };
  }

  return { success: false, message: "Backup not found — cannot safely restore" };
}

// ─── Diagnose patch status ─────────────────────────────────────────────────

export function diagnosePatch(): { status: "native" | "patched" | "unpatched" | "stale" | "not-installed"; file?: string } {
  const tuiFile = findOpenClawTuiFile();
  if (!tuiFile) return { status: "not-installed" };

  if (hasNativeStatusLine(tuiFile)) return { status: "native", file: tuiFile };
  if (isPatchApplied(tuiFile)) return { status: "patched", file: tuiFile };

  // Check if backup exists but patch is gone (OpenClaw updated)
  const backupPath = tuiFile + ".petsonality-backup";
  if (existsSync(backupPath)) return { status: "stale", file: tuiFile };

  return { status: "unpatched", file: tuiFile };
}

// ─── CLI entry point ───────────────────────────────────────────────────────

if (import.meta.main) {
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
      if (result.success) ok(result.message);
      else { err(result.message); process.exit(1); }
      break;
    }
    case "remove": {
      info("Removing Petsonality patch from OpenClaw...");
      const result = removePatch();
      if (result.success) ok(result.message);
      else { err(result.message); process.exit(1); }
      break;
    }
    case "status": {
      const diag = diagnosePatch();
      switch (diag.status) {
        case "not-installed": warn("OpenClaw not found"); break;
        case "native": ok(`OpenClaw has native statusLine support (${diag.file})`); break;
        case "patched": ok(`Patch active (${diag.file})`); break;
        case "stale": warn(`Patch was removed by OpenClaw update — run 'petsonality install' to re-apply (${diag.file})`); break;
        case "unpatched": info(`OpenClaw found but not patched (${diag.file})`); break;
      }
      break;
    }
    default:
      err(`Unknown action: ${action}`);
      process.exit(1);
  }
}
