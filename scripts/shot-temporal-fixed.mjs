import { chromium } from "playwright";
import { writeFileSync } from "fs";

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 800 });
await page.goto("http://localhost:3000/temporal", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const buf = await page.screenshot({ fullPage: false });
writeFileSync("scripts/temporal-atlas-fixed.png", buf);
console.log("✓ temporal-atlas-fixed.png");
await browser.close();
