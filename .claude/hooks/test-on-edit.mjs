#!/usr/bin/env node
// PostToolUse hook: run Vitest "related" mode for the edited file — only tests
// whose import graph touches the changed file are executed. Usually sub-second.
// Non-blocking: prints failures to stderr but never fails the tool call.
//
// Skipped for non-source files, vendored paths, and test files themselves (the
// `--run` mode picks them up via the related-graph scan anyway).

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

const isSource = /\.(ts|tsx|js|jsx)$/.test(filePath);
const isVendored = /(?:^|\/)(?:node_modules|\.next|\.netlify|dist|build|prisma\/migrations|supabase\/migrations)\//.test(filePath);
if (!isSource || isVendored) process.exit(0);

const cwd = process.cwd().replace(/\\/g, "/");
const rel = filePath.startsWith(cwd + "/") ? filePath.slice(cwd.length + 1) : filePath;

const result = spawnSync(
  "npx",
  ["--no-install", "vitest", "related", "--run", "--reporter=basic", rel],
  {
    encoding: "utf8",
    shell: true,
    cwd: process.cwd(),
    timeout: 60_000,
  },
);

if (result.status !== 0) {
  const out = (result.stdout || result.stderr || "").trim();
  if (out) {
    console.error("[vitest related]\n" + out);
  }
}

// Always exit 0 — test failures are advisory at the hook level.
process.exit(0);
