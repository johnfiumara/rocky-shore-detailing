#!/usr/bin/env node
// PostToolUse hook: run ESLint on edited TS/TSX files.
// Non-blocking: prints lint findings to stderr so Claude sees them, but does
// not fail the tool call. Skipped for non-TS edits and vendored paths.

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

const isTsOrJs = /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(filePath);
const isVendored = /(?:^|\/)(?:node_modules|\.next|\.netlify|dist|build)\//.test(filePath);
if (!isTsOrJs || isVendored) process.exit(0);

// ESLint flat config (eslint.config.mjs) treats paths from cwd. Pass the file
// as a relative path so it matches any ignore patterns the config defines.
const cwd = process.cwd().replace(/\\/g, "/");
const rel = filePath.startsWith(cwd + "/") ? filePath.slice(cwd.length + 1) : filePath;

const result = spawnSync("npx", ["--no-install", "eslint", "--no-error-on-unmatched-pattern", rel], {
  encoding: "utf8",
  shell: true,
  cwd: process.cwd(),
  timeout: 45_000,
});

if (result.status !== 0) {
  const out = (result.stdout || result.stderr || "").trim();
  if (out) {
    console.error("[eslint]\n" + out);
  }
}

// Always exit 0 — lint findings are advisory, not blocking.
process.exit(0);
