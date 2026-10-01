import { mkdir, copyFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { build } from 'esbuild';
import { renderToString } from 'what-framework/server';
import { BuildPage, NotFoundPage, staticCss } from '../src/static-pages.mjs';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
const staticDir = join(dist, 'static');
const functionsDir = join(dist, 'functions', 'api_report');

function html(title, body, status = 200) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="${status === 404 ? 'noindex' : 'index,follow'}"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><title>${title}</title><style>${staticCss}</style></head><body>${body}</body></html>`;
}

async function write(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

if (!existsSync(join(staticDir, 'index.html'))) {
  throw new Error('Vite output missing dist/static/index.html');
}

for (const route of ['cohorts', 'exports']) {
  await mkdir(join(staticDir, route), { recursive: true });
  await copyFile(join(staticDir, 'index.html'), join(staticDir, route, 'index.html'));
}

await write(join(staticDir, 'build', 'index.html'), html('How Lens is built', renderToString(BuildPage())));
await write(join(staticDir, '404', 'index.html'), html('Lens route not found', renderToString(NotFoundPage()), 404));
await copyFile(join(staticDir, '404', 'index.html'), join(staticDir, '404.html'));

await rm(functionsDir, { recursive: true, force: true });
await mkdir(functionsDir, { recursive: true });
await build({
  entryPoints: [join(root, 'src', 'api', 'report.js')],
  bundle: true,
  platform: 'browser',
  format: 'esm',
  outfile: join(functionsDir, 'index.js')
});

await writeFile(join(dist, 'manifest.json'), JSON.stringify({
  version: 1,
  notFoundPage: '404.html',
  pages: [
    { filePath: 'index.html', urlPattern: '/', mode: 'static', hasLoader: false, hasGetServerData: false, config: { mode: 'static', staticKey: 'index.html', title: 'Lens — What Framework analytics starter' } },
    { filePath: 'cohorts/index.html', urlPattern: '/cohorts', mode: 'static', hasLoader: false, hasGetServerData: false, config: { mode: 'static', staticKey: 'cohorts/index.html' } },
    { filePath: 'exports/index.html', urlPattern: '/exports', mode: 'static', hasLoader: false, hasGetServerData: false, config: { mode: 'static', staticKey: 'exports/index.html' } },
    { filePath: 'build/index.html', urlPattern: '/build', mode: 'static', hasLoader: false, hasGetServerData: false, config: { mode: 'static', staticKey: 'build/index.html', title: 'How Lens is built' } }
  ],
  api: [
    { filePath: 'src/api/report.js', urlPattern: '/api/report', methods: ['GET', 'POST'], kind: 'serverless', hasWebsocket: false, config: { kind: 'serverless', compute: { class: 'function', memory: '1gb' } } }
  ],
  timestamp: new Date().toISOString()
}, null, 2));

await writeFile(join(dist, 'package.json'), JSON.stringify({ type: 'module', dependencies: { 'what-framework': '0.13.10' } }, null, 2));
await write(join(dist, 'functions', 'package.json'), JSON.stringify({ type: 'module' }, null, 2));
console.log('Lens Vura build ready: dist/static, dist/functions/api_report, dist/manifest.json');
