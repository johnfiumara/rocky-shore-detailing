#!/usr/bin/env node
// PostToolUse hook: lint TypeScript files after they're edited.
// Reads Claude Code hook payload on stdin; runs ESLint on the edited
// file; surfaces problems to the agent via exit code 2.
//
// Scoped to src/**/*.ts(x) so it doesn't slow down edits to configs,
// docs, or node_modules. .d.ts and node_modules paths are skipped.

import { spawnSync } from "node:child_process";

const raw = await new Promise((resolve) => {
  let buf = "";
  process.stdin.on("data", (c) => (buf += c));
  process.stdin.on("end", () => resolve(buf));
});

let payload;
try {
  payload = JSON.parse(raw || "{}");
} catch {
  process.exit(0);
}

const file = payload?.tool_input?.file_path ?? "";
if (!/\.(ts|tsx)$/i.test(file)) process.exit(0);
if (file.includes("node_modules") || file.endsWith(".d.ts")) process.exit(0);
if (!/[\\/]src[\\/]/.test(file)) process.exit(0);

const useShell = process.platform === "win32";
const fileArg = useShell ? `"${file}"` : file;
const result = spawnSync(
  "npx",
  ["--no-install", "eslint", "--max-warnings=0", fileArg],
  { encoding: "utf8", shell: useShell },
);

if (result.status === 0) process.exit(0);

const out = (result.stdout || "") + (result.stderr || "");
process.stderr.write(`ESLint problems in ${file}:\n${out}\n`);
process.exit(2);
