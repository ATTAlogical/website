import type { NextConfig } from "next";

// Security headers applied to every response.
// These are server-level mitigations; they complement (not replace) input validation.
const securityHeaders = [
  // Prevent MIME-type sniffing — stops browsers from guessing content type
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Block clickjacking by preventing the site from being embedded in iframes
  { key: "X-Frame-Options", value: "DENY" },
  // Limit referrer info sent to third parties
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restrict access to browser APIs that could be abused
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Legacy XSS filter for older browsers (Chrome 78+ removed it, but Edge/IE still respect it)
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Enforce HTTPS for 1 year, include subdomains
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
