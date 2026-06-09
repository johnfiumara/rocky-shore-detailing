#!/usr/bin/env node
// PostToolUse hook: run `tsc --noEmit` after edits to TS/TSX files in src/.
// Non-blocking: prints type errors to stderr so Claude sees them, but does
// not fail the tool call. Skipped for non-TS edits and node_modules/.next.

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

let input;
try {
  input = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0);
}

const filePath = (input?.tool_input?.file_path || "").replace(/\\/g, "/");
if (!filePath) process.exit(0);

const isTs = /\.(ts|tsx)$/.test(filePath);
const isVendored = /(?:^|\/)(?:node_modules|\.next|\.netlify|dist|build)\//.test(filePath);
if (!isTs || isVendored) process.exit(0);

const result = spawnSync("npx", ["--no-install", "tsc", "--noEmit", "--pretty", "false"], {
  encoding: "utf8",
  shell: true,
  cwd: process.cwd(),
  timeout: 60_000,
});

if (result.status !== 0) {
  const out = (result.stdout || result.stderr || "").trim();
  if (out) {
    console.error("[tsc]\n" + out);
  }
}

// Always exit 0 — type errors are advisory, not blocking.
process.exit(0);
