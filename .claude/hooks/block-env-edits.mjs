#!/usr/bin/env node
// PreToolUse hook: refuse Edit/Write/MultiEdit on .env* files (except .env.example).
// Triggered after the .env.example secret-leak incident — DB and API keys had been
// committed there. Exit 2 blocks the tool call and shows stderr to Claude.

import { readFileSync } from "node:fs";

let input;
try {
  input = JSON.parse(readFileSync(0, "utf8"));
} catch {
  process.exit(0); // no stdin / malformed — don't block other tools
}

const filePath = (input?.tool_input?.file_path || "").replace(/\\/g, "/");
if (!filePath) process.exit(0);

const basename = filePath.split("/").pop() ?? "";
const isEnvFile = /^\.env(\..+)?$/.test(basename);
const isAllowed = basename === ".env.example";

if (isEnvFile && !isAllowed) {
  console.error(
    `Refusing to edit ${filePath}.\n` +
      `Env files in this repo have leaked real secrets before. ` +
      `Use the Netlify dashboard / API to manage production env, ` +
      `and edit .env.local yourself outside of Claude.`,
  );
  process.exit(2);
}

process.exit(0);
