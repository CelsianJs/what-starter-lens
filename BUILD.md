# Build notes for agents

Lens is a product analytics dashboard starter. It uses deterministic synthetic events, reactive client filters, CSV export and a bounded serverless report endpoint. It never tracks visitors and does not claim a real ingestion pipeline.

## Smooth path

```sh
npm install
npm run dev
npm test
npm run build
npm run smoke
```

Deploy after a Vura project is linked:

```sh
npx vura-platform projects --team <team-id>
npx vura-platform projects create what-starter-lens --team <team-id>
npx vura-platform projects link <project-id>
npm run deploy
```

## State model

`src/state.js` keeps dashboard controls as small global signals:

```js
export const range = signal('30d');
export const channel = signal('All');
export const cohort = signal('All');
export const report = signal({ status: 'idle', data: null, error: null });
```

The app does not need a store dependency. Any screen can read or write filters directly, and the derived dashboard recomputes from those signals.

## Computed data

The core analytics flow is intentionally copyable:

```js
export const activeFilters = computed(() => parseFilters({
  range: range(),
  channel: channel(),
  cohort: cohort()
}));
export const filteredEvents = computed(() => filterEvents(syntheticEvents, activeFilters()));
export const analytics = computed(() => aggregateEvents(filteredEvents()));
```

`src/data.js` owns deterministic event generation, filter normalization, aggregation and CSV serialization. Both the client and serverless endpoint use the same source of truth.

## Routing

Lens uses a route signal for three screens:

```js
export function navigate(path) {
  if (window.location.pathname !== path) history.pushState({}, '', path);
  routePath(path);
}
```

`src/app.jsx` switches between overview, cohorts and exports. The Vura build copies the shell to `/cohorts` and `/exports`, so deep links hydrate cleanly in production.

## CSV export

CSV export is browser-local:

```js
const csv = toCsv(filteredEvents());
const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
```

No analytics row is uploaded for export. The file reflects the current signals at click time.

## API boundary

`POST /api/report` accepts the same filters as the UI, normalizes them with `parseFilters()`, aggregates deterministic fixture rows, and returns typed report data. `GET /api/report?range=7d&channel=Partner` is also supported for quick smoke checks.

The endpoint exports a Worker-compatible `default.fetch(request)` object and never imports `src/app.jsx` or DOM/client views. Responses use `cache-control: no-store` because reports are request-specific.

```js
const response = await fetch('/api/report', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(activeFilters())
});
```

## Bounded JSON reader

Earlier API drafts used `await request.text()` and checked `text.length`. That was wrong for UTF-8 and for streaming safety.

`src/api/bounded-json.js` now reads the request stream, counts actual bytes, cancels oversized streams before concatenating the full body, and returns typed errors:

- 413: body exceeds the byte cap.
- 400: malformed JSON or invalid UTF-8.

Regression tests cover multibyte emoji byte caps, streamed oversized bodies that cancel after the second chunk, and malformed JSON returning 400.

## UI learning points

The overview is dashboard-first rather than landing-page-first: filters, metrics and chart panels appear immediately above the fold. The generated `/build` page mirrors these notes so agents can learn from the live demo without private project context.

## Vura packaging

`npm run build` produces:

- `dist/static/**` — static/client pages and assets.
- `dist/functions/api_report/index.js` — self-contained serverless Function bundle.
- `dist/manifest.json` — route manifest consumed by `vura-platform deploy`.

The serverless bundle includes its shared data logic; it does not rely on source files being present after upload.

The dashboard UI is still client-rendered after the shell loads, but the Vura manifest marks only the known shell URLs as `mode: "static"` with explicit `config.staticKey` values. Do not switch these page entries to `mode: "client"` unless you want a global SPA fallback: Vura's edge router serves extensionless unknown paths from `index.html` for client-mode deployments. Lens instead publishes `/`, `/cohorts`, `/exports` and `/build` explicitly, sets `notFoundPage: "404.html"`, and lets unknown paths return the generated 404 document.

The local preview server mirrors this static-delivery contract for smoke tests, but it is only a contract check. The provider retry is the proof for hosted HTTP status on unknown routes.

## Production extension

To turn Lens into a real analytics product, add an authenticated ingestion path, durable event storage and tenant isolation. Keep the fixture seed available for demos/tests so contributors can run the dashboard without external services.
