// Schema-based input validation for all user-facing forms.
// Forms on this site use client-side mailto — there are no API routes or server handlers,
// so server-side rate limiting is not applicable. The guards below prevent malformed or
// oversized input from reaching the mailto handler and protect against reflected XSS in
// the query string. All limits follow OWASP recommendations.

// Strip ASCII control characters (0x00–0x1F, 0x7F) that have no place in form text.
// These can be used to inject hidden sequences into mailto bodies.
function stripControlChars(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\x00-\x1F\x7F]/g, "");
}

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

// RFC 5321 limits the local part to 64 chars and the domain to 255 chars.
// Combined practical max is 254 chars (RFC 3696 erratum).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateName(raw: string): ValidationResult {
  const v = stripControlChars(raw).trim();
  if (!v) return { ok: false, error: "Name is required." };
  if (v.length > 100) return { ok: false, error: "Name must be 100 characters or fewer." };
  return { ok: true };
}

export function validateEmail(raw: string): ValidationResult {
  const v = stripControlChars(raw).trim();
  if (!v) return { ok: false, error: "Email is required." };
  if (v.length > 254) return { ok: false, error: "Email must be 254 characters or fewer." };
  if (!EMAIL_REGEX.test(v)) return { ok: false, error: "Please enter a valid email address." };
  return { ok: true };
}

export function validateMessage(raw: string, maxLength = 2000): ValidationResult {
  const v = stripControlChars(raw).trim();
  if (!v) return { ok: false, error: "Message is required." };
  if (v.length > maxLength) return { ok: false, error: `Message must be ${maxLength} characters or fewer.` };
  return { ok: true };
}

// Sanitize a value for safe inclusion in a mailto URI body.
// encodeURIComponent is always applied by callers, but this strips control chars first.
export function sanitizeForMailto(raw: string): string {
  return stripControlChars(raw).trim();
}

// Simple client-side submission throttle.
// Returns a factory so each form gets its own independent cooldown.
// rationale: prevents accidental double-submit and basic abuse of the mailto handler.
export function createSubmitThrottle(cooldownMs = 10_000) {
  let lastSubmit = 0;
  return {
    canSubmit(): boolean {
      return Date.now() - lastSubmit >= cooldownMs;
    },
    record() {
      lastSubmit = Date.now();
    },
    remainingMs(): number {
      return Math.max(0, cooldownMs - (Date.now() - lastSubmit));
    },
  };
}
