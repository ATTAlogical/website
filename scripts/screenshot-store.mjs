import { chromium } from "playwright";
import { writeFileSync } from "fs";

const browser = await chromium.launch();

async function shot(url, suffix, width, height) {
  const page = await browser.newPage();
  await page.setViewportSize({ width, height });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const buf = await page.screenshot({ fullPage: true });
  writeFileSync(`scripts/store-${suffix}.png`, buf);
  console.log(`✓ store-${suffix}.png`);
  await page.close();
}

await shot("http://localhost:3456/laugical/store", "desktop", 1280, 800);
await shot("http://localhost:3456/laugical/store", "mobile", 390, 844);
await shot("http://localhost:3456/laugical/store", "tablet", 768, 1024);

await browser.close();
