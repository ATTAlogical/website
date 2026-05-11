#!/usr/bin/env node
// Generate a bcrypt hash for ADMIN_PASSWORD_HASH and a random AUTH_SECRET.
// Usage:
//   node scripts/hash-password.mjs <password>
//
// Outputs two lines to paste into .env.local and Vercel env vars:
//   ADMIN_PASSWORD_HASH="..."
//   AUTH_SECRET="..."
//
// The plain password is never written anywhere.

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/hash-password.mjs <password>");
  console.error("Pick a strong password — at least 12 characters.");
  process.exit(1);
}

if (password.length < 8) {
  console.error("Password must be at least 8 characters. Aim for 16+ for real security.");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
const secret = randomBytes(48).toString("hex");

console.log();
console.log("# Paste into .env.local and Vercel project env vars:");
console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
console.log(`AUTH_SECRET="${secret}"`);
console.log();
console.log("(The plain password is not stored anywhere. Memorise it.)");
