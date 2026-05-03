import puppeteer from 'puppeteer';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const outDir = join(__dirname, 'temporary screenshots');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const existing = existsSync(outDir)
  ? readdirSync(outDir).filter(f => f.endsWith('.png')).length
  : 0;

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page    = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 800));

// Force reveal immediately
await page.evaluate(() => {
  document.getElementById('video-intro')?.classList.add('hidden');
  const main = document.getElementById('main-content');
  if (main) main.style.opacity = '1';
  document.querySelectorAll('.era-light').forEach(el => el.classList.add('visible'));
  document.getElementById('hero-bg')?.classList.add('loaded');
});
await new Promise(r => setTimeout(r, 500));

// Scroll to each wave divider / section boundary
const checkpoints = [
  { scroll: 'origins', label: 'wave-origins-to-tv' },
  { scroll: 'tv-revolution', label: 'wave-tv-to-media' },
  { scroll: 'media-mix', label: 'wave-media-to-global' },
  { scroll: 'global', label: 'wave-global-to-streaming' },
  { scroll: 'streaming', label: 'wave-streaming-to-dark' },
];

let idx = existing + 1;
for (const c of checkpoints) {
  // Scroll to the bottom half of the section (where wave divider is)
  await page.evaluate((id) => {
    const el = document.getElementById(id);
    if (el) {
      const bottom = el.getBoundingClientRect().bottom + window.scrollY;
      window.scrollTo(0, bottom - 600);
    }
  }, c.scroll);
  await new Promise(r => setTimeout(r, 500));
  const path = join(outDir, `screenshot-${idx}-${c.label}.png`);
  await page.screenshot({ path, fullPage: false });
  console.log(`Saved: ${path}`);
  idx++;
}

await browser.close();
