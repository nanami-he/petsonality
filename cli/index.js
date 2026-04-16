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

import { execFileSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_CLI = resolve(__dirname, "..", "dist", "cli");

const command = process.argv[2] || "install";

function runDist(name) {
  const script = resolve(DIST_CLI, `${name}.js`);
  try {
    execFileSync(process.execPath, [script], { stdio: "inherit" });
  } catch (e) {
    process.exit(e.status || 1);
  }
}

switch (command) {
  case "install":
    runDist("install");
    break;
  case "doctor":
    runDist("doctor");
    break;
  case "uninstall":
    runDist("uninstall");
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
