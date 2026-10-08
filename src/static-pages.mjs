import { h } from 'what-framework';

export function BuildPage() {
  return h('main', { class: 'build' },
    h('nav', { 'aria-label': 'Starter navigation' }, h('a', { href: '/' }, 'Lens'), h('a', { href: '/cohorts' }, 'Cohorts'), h('a', { href: '/exports' }, 'Exports')),
    h('p', { class: 'eyebrow' }, 'Agent reference'),
    h('h1', null, 'How Lens is built'),
    h('section', null,
      h('h2', null, 'Mobile hierarchy and report freshness'),
      h('p', null, 'The narrow rail and filter layout are compact so metrics precede long scrolling. The cohort table keeps semantic columns and adds a scroll hint. Server summaries display their response filters and warn when current controls differ; a pending request disables refresh. The smoke test pins mobile hierarchy, chart geometry and snapshot freshness.'),
      h('pre', null, "if (report().status === 'loading') return;")
    ),
    h('p', null, 'Lens is a public What Framework starter for analytics dashboards. The app uses a deterministic synthetic event seed, client-side reactive filtering, CSV export, generated static build notes and a serverless report endpoint.'),
    h('section', null,
      h('h2', null, 'State and computed analytics'),
      h('ul', null,
        h('li', null, 'Synthetic data: src/data.js creates immutable fixture events with a deterministic seed.'),
        h('li', null, 'Signals: src/state.js stores range, channel, cohort, route and server report state.'),
        h('li', null, 'Computed values: activeFilters, filteredEvents and analytics recompute typed totals, charts and cohort rows.'),
        h('li', null, 'CSV export: src/state.js converts currently filtered rows into a browser-local Blob download.')
      )
    ),
    h('section', null,
      h('h2', null, 'API boundary to copy'),
      h('p', null, 'POST /api/report accepts the same filter shape as the UI, normalizes it, aggregates deterministic fixture rows and returns no-store JSON. GET query params are also supported for quick smoke checks.'),
      h('pre', null, "await fetch('/api/report', {\\n  method: 'POST',\\n  headers: { 'content-type': 'application/json' },\\n  body: JSON.stringify(activeFilters())\\n});")
    ),
    h('section', null,
      h('h2', null, 'Issue fixed during build'),
      h('p', null, 'The first API draft checked request.text().length. That was unsafe for UTF-8 and streaming bodies. The current bounded reader counts actual bytes, cancels oversized streams before concatenating, returns 413 for body limits and 400 for malformed JSON. Tests cover emoji byte caps, stream cancellation and normal filter reports.')
    ),
    h('section', null,
      h('h2', null, 'Dashboard-first UI'),
      h('p', null, 'The overview intentionally starts with product controls, metrics and chart panels instead of a marketing hero. Agents can copy this pattern for tools where users need operational signal above the fold.')
    ),
    h('section', null,
      h('h2', null, 'Design iteration: chart meaning'),
      h('p', null, 'A review caught that day-by-day revenue was drawn as ranking bars. Lens now uses vertical columns for time-series data, keeps horizontal bars for channels, and aligns cohort table numbers with retained-rate comparison marks.'),
      h('p', null, 'The helper functions in src/data.js return chart orientation and comparison metadata, so future agents can test the data contract before changing the visual layer.')
    ),
    h('section', null,
      h('h2', null, 'Design iteration: chart geometry'),
      h('p', null, 'A follow-up review caught that dense revenue ranges could misalign bar baselines and clip the last column. The chart now uses minmax(0, 1fr) columns plus a fixed label axis row, so every bar shares the same baseline.'),
      h('p', null, 'For dense ranges, Lens shows fewer visual date ticks while preserving a full accessible date-and-amount label on every column. The smoke test checks 7, 14 and 30 day ranges at desktop and true 390px mobile widths.')
    ),
    h('section', null,
      h('h2', null, 'Boundaries'),
      h('p', null, 'Lens never tracks the visitor. All analytics rows are generated fixtures and the serverless report reads only that fixture set.'),
      h('p', null, 'Planned public source: https://github.com/CelsianJs/what-starter-lens')
    )
  );
}

export function NotFoundPage() {
  return h('main', { class: 'build' },
    h('p', { class: 'eyebrow' }, '404'),
    h('h1', null, 'Lens could not find that dashboard.'),
    h('p', null, 'The deployed starter serves a real 404 document for unknown static paths.'),
    h('p', null, h('a', { href: '/' }, 'Return to overview'))
  );
}

export const staticCss = `
  *{box-sizing:border-box}
  body{margin:0;background:#0d1720;color:#eef7ff;font:16px/1.6 'Avenir Next','Segoe UI Variable','Segoe UI',sans-serif}
  .build{width:min(840px,calc(100% - 32px));margin:0 auto;padding:32px 0}
  nav{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:32px}
  nav a{display:inline-flex;align-items:center;min-height:44px;padding:8px 16px;border:1px solid #334757;border-radius:8px;background:#142433;font-size:14px;text-decoration:none}
  .eyebrow{color:#a9ff68;font-size:14px;font-weight:600}
  h1{font-size:32px;line-height:1.2;letter-spacing:-.02em;margin:0 0 16px;font-weight:600}
  h2{font-size:24px;line-height:1.3;margin-top:32px;font-weight:600}
  pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#081018;color:#d9f2ff;border-radius:8px;padding:16px;overflow:auto;font-size:14px;line-height:1.6}
  a{color:#65d3ff} a:focus-visible{outline:2px solid #65d3ff;outline-offset:3px} li{margin:8px 0}
  @media(max-width:600px){h1{font-size:28px}.build{padding:24px 0}}
`;
