#!/usr/bin/env bun
/**
 * petsonality CLI
 *
 * Usage:
 *   npx petsonality              Interactive install
 *   npx petsonality install      Install MCP + skill + hooks + statusline
 *   npx petsonality show         Show current pet
 *   npx petsonality uninstall    Remove all integrations
 */

const args = process.argv.slice(2);
const command = args[0] || "install";

switch (command) {
  case "install":
    await import("./install.ts");
    break;
  case "show":
    await import("./show.ts");
    break;
  case "uninstall":
    await import("./uninstall.ts");
    break;
  case "doctor":
    await import("./doctor.ts");
    break;
  case "backup":
    await import("./backup.ts");
    break;
  case "--help":
  case "-h":
    console.log(`
petsonality — MBTI-based terminal pet companion for Claude Code

Commands:
  install           Set up MCP server, skill, hooks, and status line
  show              Display your current pet
  doctor            Run diagnostic report
  backup            Snapshot or restore all pet state
  uninstall         Remove all pet integrations

Options:
  --help, -h        Show this help
`);
    break;
  default:
    console.error(`Unknown command: ${command}\nRun 'petsonality --help' for usage.`);
    process.exit(1);
}
