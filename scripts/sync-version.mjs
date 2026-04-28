#!/usr/bin/env node
/**
 * Sync version across all files that hold their own copy.
 * Run automatically by `npm version` (see "version" script in package.json).
 *
 * Files synced:
 *   - .claude-plugin/plugin.json   ("version" field)
 *   - server/index.ts              (`version: "x.y.z"` literal in McpServer)
 *
 * The bumped files are git-added so they land in the same commit as the
 * package.json bump npm just made.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const { version } = JSON.parse(readFileSync("package.json", "utf8"));

// 1. plugin.json
const pluginPath = ".claude-plugin/plugin.json";
const plugin = JSON.parse(readFileSync(pluginPath, "utf8"));
plugin.version = version;
writeFileSync(pluginPath, JSON.stringify(plugin, null, 2) + "\n");

// 2. server/index.ts (McpServer literal)
const serverPath = "server/index.ts";
const server = readFileSync(serverPath, "utf8");
const updated = server.replace(/version: "\d+\.\d+\.\d+"/, `version: "${version}"`);
if (updated === server) {
  console.error(`[sync-version] could not find version literal in ${serverPath}`);
  process.exit(1);
}
writeFileSync(serverPath, updated);

execSync(`git add ${pluginPath} ${serverPath}`, { stdio: "inherit" });

console.log(`[sync-version] synced ${pluginPath} and ${serverPath} to ${version}`);
