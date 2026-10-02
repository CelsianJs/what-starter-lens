import { describe, expect, it } from 'vitest';
import { aggregateEvents, chartSeries, cohortComparisonRows, filterEvents, generateEvents, parseFilters, syntheticEvents, toCsv } from '../src/data.js';

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

  it('prepares day series as ordered vertical columns and channels as categorical bars', () => {
    const aggregate = aggregateEvents(filterEvents(syntheticEvents, { range: '14d', channel: 'All', cohort: 'All' }));
    const daySeries = chartSeries(aggregate.byDay.slice(-14), 'revenue', 'time');
    const channelSeries = chartSeries(aggregate.byChannel, 'visitors', 'category');

    expect(daySeries.kind).toBe('time');
    expect(daySeries.orientation).toBe('vertical');
    expect(daySeries.rows).toHaveLength(14);
    expect(daySeries.rows.map((row) => row.label)).toEqual([...daySeries.rows.map((row) => row.label)].sort());
    expect(channelSeries.kind).toBe('category');
    expect(channelSeries.orientation).toBe('horizontal');
  });

  it('adds cohort comparison metadata for aligned tables', () => {
    const aggregate = aggregateEvents(filterEvents(syntheticEvents, { range: '30d', channel: 'All', cohort: 'All' }));
    const rows = cohortComparisonRows(aggregate.byCohort);

    expect(rows).toHaveLength(4);
    expect(rows.every((row) => row.retentionShare >= 0 && row.retentionShare <= 1)).toBe(true);
    expect(rows.some((row) => row.isTopRevenue)).toBe(true);
  });
});
