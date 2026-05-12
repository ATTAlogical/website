#!/usr/bin/env node
// One-shot: hash a password and write it directly into .env + .env.local.
// Bypasses any clipboard / shell-quoting paste issues.
//
// Usage:
//   node scripts/set-admin-password.mjs <password>
//
// Wrap the password in SINGLE quotes if it contains $ or other shell-special
// characters on POSIX. On PowerShell, always use single quotes:
//   node scripts/set-admin-password.mjs 'MyP@ss$word!'

import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/set-admin-password.mjs <password>");
  console.error("Wrap in SINGLE quotes if it contains $ or special chars.");
  process.exit(1);
}

if (password.length < 6) {
  console.error("Password must be at least 6 characters.");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);

function ensureAuthSecret(content) {
  if (/^AUTH_SECRET\s*=/m.test(content)) return content;
  const secret = randomBytes(48).toString("hex");
  return content + (content.endsWith("\n") ? "" : "\n") + `AUTH_SECRET="${secret}"\n`;
}

function setHashLine(content, hashValue) {
  const line = `ADMIN_PASSWORD_HASH="${hashValue}"`;
  if (/^ADMIN_PASSWORD_HASH\s*=/m.test(content)) {
    return content.replace(/^ADMIN_PASSWORD_HASH\s*=.*$/m, line);
  }
  return content + (content.endsWith("\n") ? "" : "\n") + line + "\n";
}

const files = [".env", ".env.local"];
let touched = 0;
for (const file of files) {
  const fullPath = path.resolve(process.cwd(), file);
  let content = "";
  if (fs.existsSync(fullPath)) {
    content = fs.readFileSync(fullPath, "utf8");
  }
  content = setHashLine(content, hash);
  content = ensureAuthSecret(content);
  fs.writeFileSync(fullPath, content, "utf8");
  console.log(`  ✓ Updated ${file}`);
  touched++;
}

if (touched === 0) {
  console.error("No .env or .env.local files exist. Create at least one first.");
  process.exit(1);
}

console.log();
console.log("Done. The plain password is not stored anywhere.");
console.log("Now restart your dev server (Ctrl+C in the `npm run dev` terminal, then `npm run dev`).");
console.log("Log in with the exact same password you just passed.");
