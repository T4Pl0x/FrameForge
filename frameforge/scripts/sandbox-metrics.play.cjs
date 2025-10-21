#!/usr/bin/env node
/* Collects four sandbox runs (OFF idle, OFF pan, ON idle, ON pan) against a running preview server. */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function ensurePreview() {
  const base = 'http://localhost:4173';
  try {
    const res = await fetch(base);
    if (!res.ok) throw new Error('preview not OK');
  } catch (e) {
    console.error('[sandbox-metrics] Preview server not responding at', base);
    process.exit(1);
  }
}

async function run() {
  await ensurePreview();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  page.on('console', (msg) => { try { console.log('[console]', msg.type(), msg.text()); } catch {} });
  page.on('pageerror', (err) => { try { console.error('[pageerror]', err); } catch {} });
  const base = 'http://localhost:4173/#sandbox-large-graph';
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForSelector('.sandbox-hud', { timeout: 20000 });

  async function setKnobs({ batch = 20, move = 28, heavy = false }) {
    await page.evaluate(({ batch, move, heavy }) => {
      try { window.__WF_TUNE?.setBatch?.(batch); } catch {}
      try { window.__WF_TUNE?.setMove?.(move); } catch {}
      try { window.__WF_TUNE?.heavy?.(heavy); } catch {}
      try {
        const labels = Array.from(document.querySelectorAll('label'));
        const lab = labels.find(l => /heavier compute/i.test(l.textContent || ''));
        if (lab) {
          const cb = lab.querySelector('input[type="checkbox"]');
          if (cb && cb.checked !== heavy) cb.click();
        }
      } catch {}
    }, { batch, move, heavy });
  }

  async function record10sIdle() {
    await page.getByRole('button', { name: /Record 10s/i }).click({ force: true });
    await page.waitForTimeout(11000);
    const metrics = await page.evaluate(() => window.__SANDBOX_LAST_METRICS || null);
    if (!metrics) throw new Error('No metrics collected (idle)');
    return metrics;
  }

  async function record10sPan() {
    await page.getByRole('button', { name: /Record 10s/i }).click({ force: true });
    const start = Date.now();
    const region = await page.$('div[style*="position: absolute"][style*="inset: 0"]');
    const box = region ? await region.boundingBox() : { x: 200, y: 200, width: 800, height: 600 };
    const centerX = (box?.x || 200) + (box?.width || 800) / 2;
    const centerY = (box?.y || 200) + (box?.height || 600) / 2;
    await page.mouse.move(centerX, centerY);
    while (Date.now() - start < 10000) {
      await page.mouse.wheel(0, 120);
      await page.waitForTimeout(120);
      await page.mouse.wheel(120, 0);
      await page.waitForTimeout(120);
      await page.mouse.wheel(0, -120);
      await page.waitForTimeout(120);
      await page.mouse.wheel(-120, 0);
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(1000);
    await page.waitForTimeout(11000);
    const metrics = await page.evaluate(() => window.__SANDBOX_LAST_METRICS || null);
    if (!metrics) throw new Error('No metrics collected (pan)');
    return metrics;
  }

  const out = {};
  await setKnobs({ batch: 20, move: 28, heavy: false });
  out.off_idle = await record10sIdle();
  out.off_pan = await record10sPan();
  await setKnobs({ batch: 20, move: 28, heavy: true });
  out.on_idle = await record10sIdle();
  out.on_pan = await record10sPan();

  await browser.close();

  const outPath = path.join(process.cwd(), 'sandbox-metrics.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));

  function print(label, obj) {
    console.log(`\n--- ${label} ---`);
    console.log(JSON.stringify(obj, null, 2));
  }
  print('Heavy OFF (idle)', out.off_idle);
  print('Heavy OFF (pan)', out.off_pan);
  print('Heavy ON (idle)', out.on_idle);
  print('Heavy ON (pan)', out.on_pan);
}

run().catch((e) => { console.error(e); process.exit(1); });
