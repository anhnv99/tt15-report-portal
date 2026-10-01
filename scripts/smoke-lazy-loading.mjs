// Run against `npm run preview -- --host 127.0.0.1 --port 4173` after build.
import assert from 'node:assert/strict';
import { readdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import XLSX from 'xlsx';
import puppeteer from 'puppeteer-core';

const base = process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:4173';
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const downloadPath = await mkdtemp(join(tmpdir(), 'tt15-lazy-smoke-'));
try {
  const page = await browser.newPage();
  const errors = [];
  const scripts = new Set();
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.url().includes('/assets/') && response.url().endsWith('.js')) {
      scripts.add(response.url());
      if (!response.ok()) errors.push(`Chunk HTTP ${response.status()}: ${response.url()}`);
    }
  });
  const routes = ['dashboard', 'reports', 'imports', 'catalog', 'templates', 'workflows', 'settings'];
  await page.goto(`${base}/dashboard`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.querySelector('main')?.innerText.trim().length > 50);
  assert(![...scripts].some(url => /xlsx-|ReportAdjustmentModal-/.test(url)), 'Deferred feature loaded on dashboard');
  for (const route of routes.slice(1)) {
    // Exercise client-side menu navigation and the nested Suspense boundary.
    const href = `/${route}`;
    await page.evaluate(href => {
      window.history.pushState({}, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, href);
    await page.waitForResponse(response => response.url().includes(`/assets/${route[0].toUpperCase() + route.slice(1)}Page-`), { timeout: 15000 });
    await page.waitForFunction(() => !document.querySelector('[aria-label="Đang tải trang"]') && document.querySelector('main')?.innerText.trim().length > 50);
  }
  assert(![...scripts].some(url => /xlsx-/.test(url)), 'Excel loaded before file operation');
  const assets = await readdir(new URL('../dist/assets/', import.meta.url));
  const generator = assets.find(name => name.startsWith('multiSheetTemplateGenerator-'));
  const cdp = await page.createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath, eventsEnabled: true });
  const downloaded = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Excel download timed out')), 15000);
    cdp.on('Browser.downloadProgress', event => {
      if (event.state === 'completed') { clearTimeout(timer); resolve(); }
      if (event.state === 'canceled') { clearTimeout(timer); reject(new Error('Excel download canceled')); }
    });
  });
  await page.evaluate(async ({ base, generator }) => {
    const helpers = await import(`${base}/assets/${generator}`);
    // Internal exports are minified. The download notification key survives
    // minification and identifies the real multi-sheet download handler.
    const handlers = Object.values(helpers).filter(value => typeof value === 'function' && value.toString().includes('dl_excel'));
    if (handlers.length !== 1) throw new Error('Cannot identify Excel download handler');
    await handlers[0]('D31', null, [{ indicatorCode: 'TTC01', jsonPath: 'CNTCTD[].TTC01', dataType: 'STRING' }]);
  }, { base, generator });
  await downloaded;
  const file = (await readdir(downloadPath)).find(name => name.endsWith('.xlsx'));
  assert(file, 'No Excel download');
  const workbook = XLSX.readFile(join(downloadPath, file));
  assert(workbook.SheetNames.length > 1, 'Missing D31 multi-sheet structure');
  assert([...scripts].some(url => /xlsx-/.test(url)), 'Excel chunk was not loaded for download');
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ routesPassed: routes, runtimeErrors: errors, excelDownload: file, sheets: workbook.SheetNames, excelDeferred: true }));
} finally {
  await browser.close();
  assert.equal(dirname(resolve(downloadPath)), resolve(tmpdir()));
  await rm(downloadPath, { recursive: true, force: true });
}
