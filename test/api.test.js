import { describe, expect, it } from 'vitest';
import { readBoundedJson } from '../src/api/bounded-json.js';
import reportWorker, { buildLensReport } from '../src/api/report.js';

function oversizedStream(chunks) {
  let reads = 0;
  let cancelled = false;

  const stream = new ReadableStream({
    pull(controller) {
      const chunk = chunks[reads];
      reads += 1;
      if (chunk) {
        controller.enqueue(chunk);
      } else {
        controller.close();
      }
    },
    cancel() {
      cancelled = true;
    }
  });

  return {
    stream,
    stats: () => ({ reads, cancelled })
  };
}

describe('Lens serverless report', () => {
  it('builds typed synthetic reports', () => {
    const report = buildLensReport({ range: '14d', channel: 'Organic' });
    expect(report.ok).toBe(true);
    expect(report.filters.channel).toBe('Organic');
    expect(report.totals.visitors).toBeGreaterThan(0);
  });

  it('supports GET query params through the Worker entry', async () => {
    const response = await reportWorker.fetch(new Request('http://local/api/report?range=7d&channel=Partner'));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.filters.range).toBe('7d');
  });

  it('counts UTF-8 bytes instead of JavaScript string length', async () => {
    const body = JSON.stringify({ channel: '😀😀' });
    expect(body.length).toBeLessThan(22);
    await expect(readBoundedJson(new Request('http://local/api/report', {
      method: 'POST',
      body
    }), 21)).rejects.toMatchObject({ status: 413 });
  });

  it('returns 413 and cancels oversized streamed report bodies', async () => {
    const encoder = new TextEncoder();
    const { stream, stats } = oversizedStream([
      encoder.encode('{"channel":"'),
      new Uint8Array(17_000).fill(65),
      encoder.encode('"}')
    ]);
    const response = await reportWorker.fetch(new Request('http://local/api/report', {
      method: 'POST',
      body: stream,
      duplex: 'half'
    }));

    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({ ok: false, error: 'Request body is too large.' });
    expect(stats()).toMatchObject({ reads: 2, cancelled: true });
  });

  it('returns 400 for malformed report JSON', async () => {
    const response = await reportWorker.fetch(new Request('http://local/api/report', {
      method: 'POST',
      body: '{"range":'
    }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ ok: false, error: 'Lens report request must be valid JSON.' });
  });
});
