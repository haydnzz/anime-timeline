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
await new Promise(r => setTimeout(r, 1000));

// Force-reveal the main content without waiting for video
await page.evaluate(() => {
  const vi = document.getElementById('video-intro');
  if (vi) vi.classList.add('hidden');
  const main = document.getElementById('main-content');
  if (main) main.style.opacity = '1';
  // Force all hero elements visible immediately
  const kicker = document.querySelector('.hero-kicker');
  const title  = document.querySelector('.hero-title');
  const stats  = document.querySelector('.hero-stats');
  const cue    = document.querySelector('.hero-scroll-cue');
  if (kicker) { kicker.style.opacity='1'; kicker.style.transform='none'; kicker.style.transition='none'; }
  if (title)  { title.style.opacity='1';  title.style.transform='none';  title.style.transition='none'; }
  if (stats)  { stats.style.opacity='1';  stats.style.transform='none';  stats.style.transition='none'; }
  if (cue)    { cue.style.opacity='1'; }
  document.getElementById('hero-bg')?.classList.add('loaded');
  // Also trigger init
  if (typeof initPage === 'function') initPage();
});

await new Promise(r => setTimeout(r, 1500));

const p1 = join(outDir, `screenshot-${existing+1}-hero-full.png`);
await page.screenshot({ path: p1, fullPage: false });
console.log(`Saved: ${p1}`);

// Also scroll to see bottom of hero / start of first era
await page.evaluate(() => window.scrollTo(0, 600));
await new Promise(r => setTimeout(r, 500));
const p2 = join(outDir, `screenshot-${existing+2}-hero-bottom.png`);
await page.screenshot({ path: p2, fullPage: false });
console.log(`Saved: ${p2}`);

await browser.close();
