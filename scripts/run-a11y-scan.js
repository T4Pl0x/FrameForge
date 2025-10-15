#!/usr/bin/env node
/* eslint-env node */
import { chromium } from 'playwright';
import { injectAxe, checkA11y } from '@axe-core/playwright';
import fs from 'node:fs';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const url = process.env.A11Y_URL || 'http://localhost:5173/';
  await page.goto(url);
  await injectAxe(page);
  const results = await checkA11y(page, undefined, {
    detailedReport: true,
    detailedReportOptions: { html: true },
  });
  fs.mkdirSync('reports', { recursive: true });
  fs.writeFileSync('reports/a11y-report.json', JSON.stringify(results, null, 2));
  await browser.close();
})().catch((err) => {
  console.error('A11y scan failed:', err);
  process.exit(1);
});
