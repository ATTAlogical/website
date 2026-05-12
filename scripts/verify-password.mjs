#!/usr/bin/env node
// Diagnostic: read ADMIN_PASSWORD_HASH from .env and test a password against it.
// Same logic the server uses. If this says NO, the server will also say NO.
//
// Usage:
//   node scripts/verify-password.mjs 'YourPassword'

import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/verify-password.mjs 'YourPassword'");
  process.exit(1);
}

function loadEnv(file) {
  const fullPath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(fullPath)) return null;
  const content = fs.readFileSync(fullPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.replace(/^﻿/, "");
    const m = line.match(/^\s*ADMIN_PASSWORD_HASH\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let value = m[1];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Unescape \$ → $  (matches Next.js's dotenv-expand behavior)
    value = value.replace(/\\\$/g, "$");
    return value;
  }
  return null;
}

const hashEnv = loadEnv(".env");
const hashLocal = loadEnv(".env.local");

console.log();
console.log("Hash in .env       :", hashEnv ? `${hashEnv.slice(0, 24)}... (length ${hashEnv.length})` : "(not found)");
console.log("Hash in .env.local :", hashLocal ? `${hashLocal.slice(0, 24)}... (length ${hashLocal.length})` : "(not found)");
console.log("Password length    :", password.length);
console.log();

const activeHash = hashLocal ?? hashEnv;
if (!activeHash) {
  console.error("No ADMIN_PASSWORD_HASH found in either file.");
  process.exit(1);
}

console.log("Using:", hashLocal ? ".env.local" : ".env", "(Next.js loads .env.local last → wins)");

if (activeHash.length !== 60) {
  console.warn();
  console.warn(`⚠  Hash length is ${activeHash.length}, expected 60.`);
  console.warn(`   Bcrypt hashes are always exactly 60 chars: $2[ab]$NN$<22 chars salt><31 chars hash>`);
  console.warn(`   Your hash is corrupted. Re-run: npm run auth:set 'yourpassword'`);
}

const match = await bcrypt.compare(password, activeHash);
console.log();
if (match) {
  console.log("✓ Password MATCHES the hash. The server should accept it.");
  console.log("  If login still fails in the browser, the issue is elsewhere (caching, dev server not restarted, etc.).");
} else {
  console.log("✗ Password does NOT match the hash.");
  console.log("  Either the hash got corrupted on write, or the password you passed differs from the one used to generate the hash.");
  console.log("  Try: npm run auth:set 'yourpassword'  (regenerate)");
  console.log("  Then: npm run auth:verify 'yourpassword'  (confirm)");
}
