import { chromium } from "playwright";
import { writeFileSync } from "fs";

const browser = await chromium.launch();

async function shot(url, suffix, width, height) {
  const page = await browser.newPage();
  await page.setViewportSize({ width, height });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1400);
  const buf = await page.screenshot({ fullPage: false });
  writeFileSync(`scripts/${suffix}.png`, buf);
  console.log(`✓ ${suffix}.png`);
  await page.close();
}

await shot("http://localhost:3456/temporal", "temporal-atlas-desktop", 1280, 800);
await shot("http://localhost:3456/temporal", "temporal-deck-mobile", 390, 844);

await browser.close();
