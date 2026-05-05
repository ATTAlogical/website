import { chromium } from "playwright";
import { writeFileSync } from "fs";

const browser = await chromium.launch();

async function shot(url, suffix, width, height) {
  const page = await browser.newPage();
  await page.setViewportSize({ width, height });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000); // wait for chips to fade in
  const buf = await page.screenshot({ fullPage: false });
  writeFileSync(`scripts/home-${suffix}.png`, buf);
  console.log(`✓ home-${suffix}.png`);
  await page.close();
}

await shot("http://localhost:3456", "desktop", 1280, 800);
await shot("http://localhost:3456", "mobile", 390, 844);

await browser.close();
