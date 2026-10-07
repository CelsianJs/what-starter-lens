# Build notes for agents

## Mobile hierarchy and report snapshots

At narrow widths the rail, fixture metadata, filters, and metric cards use compact spacing while preserving native labeled controls. Cohorts keep their semantic scrolling table and a visible horizontal-scroll hint. A report shows the filters represented by its server response and warns when controls no longer match that snapshot; refreshing is disabled while a request is pending.

The relevant source pattern is:

```js
if (report().status === 'loading') return;
```

The smoke test requires metrics before650px and the chart card before844px at390px, checks7/14/30-day bar geometry, then confirms report freshness changes when filters change.

Keep the product anonymous and local/synthetic. These workflow improvements do not add authentication, collaboration, payments, ingestion, or durable server storage.


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

## Iteration note: chart semantics

The first dashboard drew revenue-by-day as horizontal bars, which made a time series read like a category ranking. Lens now prepares chart metadata in `src/data.js`:

```js
export function chartSeries(rows, metric, kind = 'category') {
  return {
    kind,
    orientation: kind === 'time' ? 'vertical' : 'horizontal',
    rows: ordered.map((row) => ({
      ...row,
      value: Number(row[metric]) || 0,
      share: Math.max(0.04, (Number(row[metric]) || 0) / max)
    }))
  };
}
```

`Revenue by day` passes `kind: "time"` and renders vertical columns. `Visitors by channel` stays horizontal because channels are categories. Cohort rows use `cohortComparisonRows()` for right-aligned values, retained-rate bars, and a top-revenue marker. That gives future agents a small pattern for choosing chart form from data meaning rather than applying one chart everywhere.

## Iteration note: chart baselines and range width

A follow-up visual audit caught a subtler chart issue: the revenue columns had different baselines because each column's label could take a different amount of vertical space, and a 30-day range could over-allocate width with `minmax(22px, 1fr)` plus large gaps. The far-right bar then risked clipping at narrow card widths.

Lens now gives the time-series chart a stable plot/axis split:

```css
.trend { grid-template-columns: repeat(var(--count), minmax(0, 1fr)); }
.trend-col { grid-template-rows: minmax(0, 1fr) 3.4em; }
```

The fixed axis row means every bar bottom lands on the same baseline, `minmax(0, 1fr)` keeps all active-range columns inside the card, and visual tick labels are thinned for dense ranges while each column keeps a full accessible `YYYY-MM-DD: $amount` label. The smoke test asserts that all bar bottoms are within 1px and that the last bar is inside the chart at both 1440px and true 390px for 7, 14 and 30 day ranges.

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

The overview is dashboard-first rather than landing-page-first: filters, metrics and chart panels appear immediately above the fold. The brand mark stays quiet, while the cyan/lime gradient is reserved for data. The generated `/build` page mirrors these notes so agents can learn from the live demo without private project context.

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
