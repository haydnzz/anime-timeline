import puppeteer from 'puppeteer';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const outDir = join(__dirname, 'temporary screenshots');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const url = process.argv[2] || 'http://localhost:3000';

const existing = existsSync(outDir)
  ? readdirSync(outDir).filter(f => f.endsWith('.png')).length
  : 0;

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page    = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 800));

// Skip video intro
try {
  const skipBtn = await page.$('#video-skip');
  if (skipBtn) { await skipBtn.click(); await new Promise(r => setTimeout(r, 1200)); }
} catch(e) {}

const sections = [
  { id: 'hero', label: 'hero', scroll: 0 },
  { id: 'origins', label: 'era-origins', scroll: null },
  { id: 'tv-revolution', label: 'era-tv', scroll: null },
  { id: 'media-mix', label: 'era-media', scroll: null },
  { id: 'global-tv', label: 'era-global', scroll: null },
  { id: 'streaming-rise', label: 'era-streaming', scroll: null },
];

let idx = existing + 1;
for (const s of sections) {
  if (s.scroll !== null) {
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), s.scroll);
  } else {
    await page.evaluate((id) => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    }, s.id);
  }
  await new Promise(r => setTimeout(r, 600));
  const path = join(outDir, `screenshot-${idx}-${s.label}.png`);
  await page.screenshot({ path, fullPage: false });
  console.log(`Saved: ${path}`);
  idx++;
}

await browser.close();
