import { h } from 'what-framework';

export function BuildPage() {
  return h('main', { class: 'build' },
    h('p', { class: 'eyebrow' }, 'Agent reference'),
    h('h1', null, 'How Lens is built'),
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
  body{margin:0;background:#0d1720;color:#eef7ff;font-family:'Avenir Next',ui-sans-serif,system-ui,sans-serif}
  .build{width:min(840px,calc(100% - 32px));margin:0 auto;padding:72px 0;line-height:1.65}
  .eyebrow{color:#a9ff68;text-transform:uppercase;letter-spacing:.16em;font:900 12px ui-sans-serif,system-ui}
  h1{font-size:clamp(42px,8vw,88px);line-height:.9;letter-spacing:-.075em;margin:0 0 18px}
  h2{font-size:26px;margin-top:36px}
  pre{white-space:pre-wrap;background:#081018;color:#d9f2ff;border-radius:18px;padding:16px;overflow:auto}
  a{color:#65d3ff} li{margin:10px 0}
`;
