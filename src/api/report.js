import { aggregateEvents, filterEvents, parseFilters, syntheticEvents } from '../data.js';
import { readBoundedJson } from './bounded-json.js';

const MAX_BODY_BYTES = 16_384;

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

export function buildLensReport(filtersInput = {}) {
  const filters = parseFilters(filtersInput);
  const rows = filterEvents(syntheticEvents, filters);
  if (rows.length === 0) {
    return { ok: false, error: 'No synthetic events match those filters.', filters, totals: null };
  }
  const aggregate = aggregateEvents(rows);
  return {
    ok: true,
    source: 'synthetic-seed-20261001',
    generatedAt: new Date(Date.UTC(2026, 9, 1, 12, 0, 0)).toISOString(),
    filters,
    rowCount: rows.length,
    ...aggregate
  };
}

export default {
  async fetch(request) {
    if (!['GET', 'POST'].includes(request.method)) {
      return json({ ok: false, error: 'Use GET query params or POST JSON for a Lens report.' }, 405);
    }
    try {
      const url = new URL(request.url);
      const input = request.method === 'POST'
        ? await readBoundedJson(request, MAX_BODY_BYTES)
        : Object.fromEntries(url.searchParams.entries());
      const report = buildLensReport(input);
      return json(report, report.ok ? 200 : 404);
    } catch (error) {
      return json({ ok: false, error: error.status === 413 ? error.message : 'Lens report request must be valid JSON.' }, error.status || 400);
    }
  }
};
