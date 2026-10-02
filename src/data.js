export const channels = ['Organic', 'Paid', 'Partner', 'Lifecycle'];
export const cohorts = ['Founders', 'Ops teams', 'Design leads', 'Data teams'];

function mulberry32(seed) {
  return function next() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function generateEvents(seed = 20261001) {
  const random = mulberry32(seed);
  const events = [];
  const start = Date.UTC(2026, 8, 1);
  for (let day = 0; day < 31; day++) {
    for (let i = 0; i < 34; i++) {
      const channel = channels[Math.floor(random() * channels.length)];
      const cohort = cohorts[Math.floor(random() * cohorts.length)];
      const visitors = 18 + Math.floor(random() * 180);
      const activationRate = 0.16 + random() * 0.38 + (channel === 'Partner' ? 0.05 : 0);
      const activated = Math.round(visitors * activationRate);
      const retained = Math.round(activated * (0.42 + random() * 0.36));
      const revenue = Math.round((retained * (38 + random() * 140)) * 100) / 100;
      events.push({
        id: `ev_${day}_${i}`,
        date: new Date(start + day * 86400000).toISOString().slice(0, 10),
        channel,
        cohort,
        visitors,
        activated,
        retained,
        revenue
      });
    }
  }
  return events;
}

export const syntheticEvents = generateEvents();

export function filterEvents(events, filters) {
  const range = filters.range || '30d';
  const days = range === '7d' ? 7 : range === '14d' ? 14 : 31;
  const minDate = new Date(Date.UTC(2026, 9, 1));
  minDate.setUTCDate(minDate.getUTCDate() - days + 1);
  const min = minDate.toISOString().slice(0, 10);
  return events.filter((event) => {
    if (event.date < min) return false;
    if (filters.channel && filters.channel !== 'All' && event.channel !== filters.channel) return false;
    if (filters.cohort && filters.cohort !== 'All' && event.cohort !== filters.cohort) return false;
    return true;
  });
}

export function aggregateEvents(events) {
  const totals = events.reduce((acc, event) => {
    acc.visitors += event.visitors;
    acc.activated += event.activated;
    acc.retained += event.retained;
    acc.revenue += event.revenue;
    return acc;
  }, { visitors: 0, activated: 0, retained: 0, revenue: 0 });
  totals.revenue = Math.round(totals.revenue * 100) / 100;
  totals.activationRate = totals.visitors ? totals.activated / totals.visitors : 0;
  totals.retentionRate = totals.activated ? totals.retained / totals.activated : 0;

  const byChannel = channels.map((channel) => aggregateGroup(events.filter((event) => event.channel === channel), channel));
  const byCohort = cohorts.map((cohort) => aggregateGroup(events.filter((event) => event.cohort === cohort), cohort));
  const byDay = Object.values(events.reduce((acc, event) => {
    acc[event.date] ||= { label: event.date, visitors: 0, activated: 0, retained: 0, revenue: 0 };
    acc[event.date].visitors += event.visitors;
    acc[event.date].activated += event.activated;
    acc[event.date].retained += event.retained;
    acc[event.date].revenue += event.revenue;
    return acc;
  }, {})).map((day) => ({ ...day, revenue: Math.round(day.revenue * 100) / 100 }));

  return { totals, byChannel, byCohort, byDay };
}

export function chartSeries(rows, metric, kind = 'category') {
  const ordered = kind === 'time'
    ? [...rows].sort((a, b) => String(a.label).localeCompare(String(b.label)))
    : [...rows];
  const max = Math.max(...ordered.map((row) => Number(row[metric]) || 0), 1);
  return {
    kind,
    metric,
    orientation: kind === 'time' ? 'vertical' : 'horizontal',
    rows: ordered.map((row) => ({
      ...row,
      value: Number(row[metric]) || 0,
      share: Math.max(0.04, (Number(row[metric]) || 0) / max)
    }))
  };
}

export function cohortComparisonRows(rows) {
  const revenueMax = Math.max(...rows.map((row) => row.revenue), 1);
  const retentionMax = Math.max(...rows.map((row) => row.retentionRate), 1);
  return rows.map((row) => ({
    ...row,
    revenueShare: row.revenue / revenueMax,
    retentionShare: row.retentionRate / retentionMax,
    isTopRevenue: row.revenue === revenueMax
  }));
}

function aggregateGroup(rows, label) {
  const totals = aggregateEventsFlat(rows);
  return { label, ...totals };
}

function aggregateEventsFlat(rows) {
  const totals = rows.reduce((acc, event) => {
    acc.visitors += event.visitors;
    acc.activated += event.activated;
    acc.retained += event.retained;
    acc.revenue += event.revenue;
    return acc;
  }, { visitors: 0, activated: 0, retained: 0, revenue: 0 });
  totals.revenue = Math.round(totals.revenue * 100) / 100;
  totals.activationRate = totals.visitors ? totals.activated / totals.visitors : 0;
  totals.retentionRate = totals.activated ? totals.retained / totals.activated : 0;
  return totals;
}

export function toCsv(rows) {
  const header = ['date', 'channel', 'cohort', 'visitors', 'activated', 'retained', 'revenue'];
  return [header.join(','), ...rows.map((row) => header.map((key) => JSON.stringify(row[key] ?? '')).join(','))].join('\n');
}

export function parseFilters(input = {}) {
  const range = ['7d', '14d', '30d'].includes(input.range) ? input.range : '30d';
  const channel = input.channel && ['All', ...channels].includes(input.channel) ? input.channel : 'All';
  const cohort = input.cohort && ['All', ...cohorts].includes(input.cohort) ? input.cohort : 'All';
  return { range, channel, cohort };
}
