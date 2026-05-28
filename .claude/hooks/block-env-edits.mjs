#!/usr/bin/env node
// PreToolUse hook: refuse edits to .env* files.
// These hold secrets (e.g. RESEND_API_KEY consumed by
// src/lib/send-booking-email.ts). Agents should ask the user to set
// env values manually instead of writing them.

import path from "node:path";

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
if (!file) process.exit(0);

const base = path.basename(file);
if (!/^\.env(\.|$)/.test(base)) process.exit(0);

process.stderr.write(
  `Blocked: refusing to edit "${file}". This repo's .env* files hold ` +
  `secrets (Resend API key, etc.). Ask the user to add or change env ` +
  `values manually. Reading the file to inspect variable names is fine; ` +
  `mutating it is not.\n`,
);
process.exit(2);
