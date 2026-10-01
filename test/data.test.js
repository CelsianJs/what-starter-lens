import { describe, expect, it } from 'vitest';
import { aggregateEvents, filterEvents, generateEvents, parseFilters, syntheticEvents, toCsv } from '../src/data.js';

describe('Lens synthetic analytics', () => {
  it('generates a deterministic fixture set', () => {
    expect(generateEvents()).toEqual(generateEvents());
    expect(syntheticEvents.length).toBeGreaterThan(1000);
  });

  it('filters and aggregates typed totals', () => {
    const rows = filterEvents(syntheticEvents, { range: '7d', channel: 'Partner', cohort: 'All' });
    const aggregate = aggregateEvents(rows);
    expect(rows.every((row) => row.channel === 'Partner')).toBe(true);
    expect(aggregate.totals.visitors).toBeGreaterThan(0);
  });

  it('normalizes bad filters and exports CSV', () => {
    expect(parseFilters({ range: 'nope', channel: 'Bad' })).toEqual({ range: '30d', channel: 'All', cohort: 'All' });
    expect(toCsv(syntheticEvents.slice(0, 1))).toContain('date,channel,cohort');
  });
});
