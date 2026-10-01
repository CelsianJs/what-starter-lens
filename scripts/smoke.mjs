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
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  page.on('console', (msg) => { if (['error', 'warning'].includes(msg.type())) errors.push(msg.text()); });
  await page.goto(`http://127.0.0.1:${port}/`);
  await page.getByLabel('Range').selectOption('7d');
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
