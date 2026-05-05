import puppeteer from 'puppeteer';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const outDir = join(__dirname, 'temporary screenshots');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const base = readdirSync(outDir).filter(f => f.endsWith('.png')).length;

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });

// Skip video
await page.evaluate(() => document.getElementById('video-skip').click());
await new Promise(r => setTimeout(r, 2200));

async function goToSlide(n) {
  await page.evaluate((n) => {
    const vh = window.innerHeight;
    window.targetY = n * vh;
    window.virtualY = n * vh;
    // call updateSlides directly
    const bgs = Array.from(document.querySelectorAll('.sbg'));
    const cts = Array.from(document.querySelectorAll('.sct'));
    bgs.forEach((el, i) => el.style.opacity = i === n ? 1 : 0);
    cts.forEach((el, i) => {
      el.style.opacity = i === n ? 1 : 0;
      el.classList.toggle('active-slide', i === n);
    });
  }, n);
  await new Promise(r => setTimeout(r, 600));
}

const slides = [0, 1, 2, 3, 5, 7, 9, 11, 13, 14];
const labels = ['s0-hero', 's1-origins', 's2-wartime', 's3-studios', 's5-mediamix', 's7-akira', 's9-ghibli', 's11-streaming', 's13-market', 's14-worldmap'];

for (let i = 0; i < slides.length; i++) {
  await goToSlide(slides[i]);
  const num = base + i + 1;
  const path = join(outDir, `screenshot-${num}-ghibli-${labels[i]}.png`);
  await page.screenshot({ path, fullPage: false });
  console.log(`Saved: ${path}`);
}

await browser.close();
console.log('All screenshots done.');
