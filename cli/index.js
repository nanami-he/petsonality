#!/usr/bin/env node
/**
 * petsonality CLI — npx entry point
 *
 * Usage:
 *   npx petsonality          → install
 *   npx petsonality install  → install
 *   npx petsonality doctor   → diagnose
 *   npx petsonality uninstall → remove
 */

import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");

const command = process.argv[2] || "install";

// For now, delegate to bun for TS files (dev mode).
// After full build, these will be dist/*.js files.
function run(script) {
  try {
    execSync(`bun run ${script}`, {
      cwd: PROJECT_ROOT,
      stdio: "inherit",
    });
  } catch (e) {
    process.exit(e.status || 1);
  }
}

switch (command) {
  case "install":
    run("cli/install.ts");
    break;
  case "doctor":
    run("cli/doctor.ts");
    break;
  case "uninstall":
    console.log("Uninstall not yet implemented. Remove manually:");
    console.log("  - Delete petsonality from ~/.claude.json mcpServers");
    console.log("  - Delete petsonality hooks from ~/.claude/settings.json");
    console.log("  - Delete ~/.petsonality/");
    break;
  case "--help":
  case "-h":
    console.log("petsonality — Your type, your pet.\n");
    console.log("Usage: npx petsonality [command]\n");
    console.log("Commands:");
    console.log("  install    Install petsonality (default)");
    console.log("  doctor     Diagnose installation");
    console.log("  uninstall  Remove petsonality");
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.error("Run 'npx petsonality --help' for usage.");
    process.exit(1);
}
