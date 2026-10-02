import { chromium } from 'playwright';
import { collectChildLogs, spawnNodePreview, starterRoot, stopOwnedProcess, waitForOwnedReadiness } from './smoke-harness.mjs';

const port = 4176;
const root = starterRoot(import.meta.url);
const server = spawnNodePreview({ cwd: root, port });
const logs = collectChildLogs(server);

const errors = [];

try {
  await waitForOwnedReadiness(server, {
    logs,
    readyPattern: new RegExp(`Lens preview http://127\\.0\\.0\\.1:${port}`),
    label: 'Lens preview',
  });
  var browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  page.on('console', (msg) => { if (['error', 'warning'].includes(msg.type())) errors.push(msg.text()); });
  await page.goto(`http://127.0.0.1:${port}/`);
  await assertTrendGeometry(page, { range: '7d', expectedColumns: 7, viewport: '1440' });
  await assertTrendGeometry(page, { range: '14d', expectedColumns: 14, viewport: '1440' });
  await assertTrendGeometry(page, { range: '30d', expectedColumns: 30, viewport: '1440' });
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  mobilePage.on('console', (msg) => { if (['error', 'warning'].includes(msg.type())) errors.push(msg.text()); });
  await mobilePage.goto(`http://127.0.0.1:${port}/`);
  await assertTrendGeometry(mobilePage, { range: '7d', expectedColumns: 7, viewport: '390' });
  await assertTrendGeometry(mobilePage, { range: '14d', expectedColumns: 14, viewport: '390' });
  await assertTrendGeometry(mobilePage, { range: '30d', expectedColumns: 30, viewport: '390' });
  await mobilePage.close();
  await page.getByLabel('Channel').selectOption('Partner');
  await page.getByRole('button', { name: 'Exports' }).click();
  await page.getByRole('button', { name: 'Refresh summary' }).click();
  await page.getByText('Rows').waitFor();
  await page.goto(`http://127.0.0.1:${port}/build`);
  await page.getByRole('heading', { name: 'How Lens is built' }).waitFor();
  if (errors.length) throw new Error(`Console problems:\n${errors.join('\n')}`);
  const notFound = await page.goto(`http://127.0.0.1:${port}/missing-route`);
  if (notFound.status() !== 404) throw new Error(`Expected 404, got ${notFound.status()}`);
  console.log('Lens smoke OK: filters, server report, static build page and real 404.');
} finally {
  if (browser) await browser.close().catch(() => {});
  await stopOwnedProcess(server, { logs, label: 'Lens preview' });
}

async function assertTrendGeometry(page, { range, expectedColumns, viewport }) {
  await page.getByLabel('Range').selectOption(range);
  await page.locator('.trend-col').first().waitFor();
  const result = await page.evaluate(() => {
    const chart = document.querySelector('.trend');
    const columns = [...document.querySelectorAll('.trend-col')];
    const bars = columns.map((column) => column.querySelector('i'));
    const chartRect = chart.getBoundingClientRect();
    const barRects = bars.map((bar) => bar.getBoundingClientRect());
    const bottoms = barRects.map((rect) => rect.bottom);
    const last = barRects.at(-1);
    const labels = columns.map((column) => column.getAttribute('aria-label'));
    return {
      columns: columns.length,
      baselineSpread: Math.max(...bottoms) - Math.min(...bottoms),
      lastInsideChart: last.right <= chartRect.right + 0.5,
      chartWidth: chartRect.width,
      lastRight: last.right,
      chartRight: chartRect.right,
      labels,
    };
  });
  if (result.columns !== expectedColumns) throw new Error(`Expected ${expectedColumns} trend columns for ${range} at ${viewport}px, got ${result.columns}`);
  if (result.baselineSpread > 1) throw new Error(`Trend baselines drift by ${result.baselineSpread}px for ${range} at ${viewport}px`);
  if (!result.lastInsideChart) throw new Error(`Last trend bar clips for ${range} at ${viewport}px: last=${result.lastRight}, chart=${result.chartRight}, width=${result.chartWidth}`);
  if (result.labels.some((label) => !label || !label.includes('$'))) throw new Error(`Trend columns missing accessible date and amount labels for ${range} at ${viewport}px`);
}
