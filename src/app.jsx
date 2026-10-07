import { mount } from 'what-framework';
import './styles.css';
import { channels, chartSeries, cohortComparisonRows, cohorts } from './data.js';
import { analytics, channel, cohort, downloadCsv, fetchServerReport, navigate, range, report, routePath } from './state.js';

function NavLink({ href, children }) {
  return <button class={() => routePath() === href ? 'nav-link active' : 'nav-link'} onClick={() => navigate(href)}>{children}</button>;
}

function Shell({ children }) {
  return (
    <div class="shell">
      <aside class="rail">
        <button class="logo" onClick={() => navigate('/')}><span></span>Lens</button>
        <nav aria-label="Primary">
          <NavLink href="/">Overview</NavLink>
          <NavLink href="/cohorts">Cohorts</NavLink>
          <NavLink href="/exports">Exports</NavLink>
          <a class="nav-link" href="/build">Build</a>
        </nav>
        <p class="rail-note">Synthetic data only. No tracking script, no paid services.</p>
      </aside>
      <main>{children}</main>
    </div>
  );
}

function Filters() {
  return (
    <section class="filters" aria-label="Analytics filters">
      <label>Range<select value={() => range()} onChange={(event) => range(event.target.value)}><option value="7d">7 days</option><option value="14d">14 days</option><option value="30d">30 days</option></select></label>
      <label>Channel<select value={() => channel()} onChange={(event) => channel(event.target.value)}><option>All</option>{channels.map((item) => <option>{item}</option>)}</select></label>
      <label>Cohort<select value={() => cohort()} onChange={(event) => cohort(event.target.value)}><option>All</option>{cohorts.map((item) => <option>{item}</option>)}</select></label>
    </section>
  );
}

function StatCards() {
  return (
    <section class="stats" aria-label="Totals">
      <div><small>Visitors</small><strong>{() => analytics().totals.visitors.toLocaleString()}</strong></div>
      <div><small>Activation</small><strong>{() => pct(analytics().totals.activationRate)}</strong></div>
      <div><small>Retention</small><strong>{() => pct(analytics().totals.retentionRate)}</strong></div>
      <div><small>Revenue</small><strong>{() => money(analytics().totals.revenue)}</strong></div>
    </section>
  );
}

function OverviewPage() {
  return (
    <Shell>
      <header class="product-header">
        <div>
          <p class="eyebrow">Synthetic product analytics</p>
          <h1>Activation, retention, and revenue in one working dashboard.</h1>
          <p>Filter deterministic demo events, inspect live chart panels, then compare the client aggregate with the serverless report.</p>
        </div>
        <aside aria-label="Dataset status">
          <span>Fixture seed 20261001</span>
          <strong>{() => analytics().totals.visitors.toLocaleString()}</strong>
          <small>filtered visitors · no tracking script</small>
        </aside>
      </header>
      <Filters />
      <section class="dashboard-board">
        <StatCards />
        <ChartCard title="Revenue by day" rows={() => analytics().byDay.slice(-rangeDayCount(range()))} metric="revenue" />
        <ChartCard title="Visitors by channel" rows={() => analytics().byChannel} metric="visitors" />
      </section>
    </Shell>
  );
}

function ChartCard({ title, rows, metric }) {
  return (
    <article class={() => chartSeries(rows(), metric, title.includes('day') ? 'time' : 'category').orientation === 'vertical' ? 'card trend-card' : 'card'}>
      <h2>{title}</h2>
      {() => {
        const series = chartSeries(rows(), metric, title.includes('day') ? 'time' : 'category');
        return series.orientation === 'vertical' ? <VerticalSeries series={series} metric={metric} /> : <HorizontalSeries series={series} metric={metric} />;
      }}
    </article>
  );
}

function HorizontalSeries({ series, metric }) {
  return (
    <div class="bars">
      {series.rows.map((row) => (
        <div class="bar-row">
          <span>{shortLabel(row.label)}</span>
          <div class="bar"><i style={`width:${row.share * 100}%`}></i></div>
          <b>{metric === 'revenue' ? money(row.value) : row.value.toLocaleString()}</b>
        </div>
      ))}
    </div>
  );
}

function VerticalSeries({ series, metric }) {
  const tickEvery = visualTickEvery(series.rows.length);
  return (
    <div class="trend" style={`--count:${series.rows.length}`}>
      {series.rows.map((row, index) => (
        <div class="trend-col" tabindex="0" aria-label={`${row.label}: ${metric === 'revenue' ? money(row.value) : row.value.toLocaleString()}`}>
          <div class="trend-value">{metric === 'revenue' ? money(row.value) : row.value.toLocaleString()}</div>
          <i style={`--share:${row.share}`}></i>
          <span aria-hidden="true" data-visible={isVisualTick(index, series.rows.length, tickEvery) ? 'true' : 'false'}>{shortLabel(row.label)}</span>
        </div>
      ))}
    </div>
  );
}

function CohortsPage() {
  return (
    <Shell>
      <div class="section-heading"><p class="eyebrow">Cohort detail</p><h1>Segment health updates as filters change.</h1></div>
      <Filters />
      <section class="card">
        <p class="table-hint">Scroll the comparison to see every metric →</p>
        <table>
          <thead><tr><th>Cohort</th><th>Visitors</th><th>Activated</th><th>Retained</th><th>Revenue</th></tr></thead>
          <tbody>
            {() => cohortComparisonRows(analytics().byCohort).map((row) => (
              <tr>
                <td>{row.label}</td>
                <td>{row.visitors.toLocaleString()}</td>
                <td>{pct(row.activationRate)}</td>
                <td><span class="compare-cell"><i style={`width:${row.retentionShare * 100}%`}></i>{pct(row.retentionRate)}</span></td>
                <td><span class={row.isTopRevenue ? 'revenue-cell top' : 'revenue-cell'}>{money(row.revenue)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Shell>
  );
}

function ExportsPage() {
  return (
    <Shell>
      <div class="section-heading"><p class="eyebrow">Exports</p><h1>Download the filtered rows or ask the server for a fresh summary.</h1></div>
      <Filters />
      <section class="card export-card">
        <button class="button primary" onClick={downloadCsv}>Download CSV</button>
        <button class="button" disabled={() => report().status === 'loading'} onClick={fetchServerReport}>{() => report().status === 'loading' ? 'Refreshing…' : 'Refresh summary'}</button>
        <ReportResult />
      </section>
    </Shell>
  );
}

function ReportResult() {
  return () => {
    const state = report();
    if (state.status === 'idle') return <p class="report-note">No server summary yet. Refresh when you want a checked read on the current filters.</p>;
    if (state.status === 'loading') return <p class="report-note" role="status">Refreshing summary…</p>;
    if (state.status === 'error') return <p class="report-note error">Summary error: {state.error}</p>;
    return (
      <div class="server-summary">
        <p class="report-snapshot" role="status">{state.data.filters.range} · {state.data.filters.channel} · {state.data.filters.cohort} snapshot. {() => JSON.stringify(state.data.filters) === JSON.stringify({ range: range(), channel: channel(), cohort: cohort() }) ? 'Matches current filters.' : 'Filters changed — refresh to update this summary.'}</p>
        <div><small>Rows</small><strong>{state.data.rowCount.toLocaleString()}</strong></div>
        <div><small>Visitors</small><strong>{state.data.totals.visitors.toLocaleString()}</strong></div>
        <div><small>Activation</small><strong>{pct(state.data.totals.activationRate)}</strong></div>
        <div><small>Revenue</small><strong>{money(state.data.totals.revenue)}</strong></div>
        <details>
          <summary>Developer JSON</summary>
          <pre>{JSON.stringify(state.data, null, 2)}</pre>
        </details>
      </div>
    );
  };
}

function NotFoundPage() {
  return <Shell><section class="hero"><p class="eyebrow">404</p><h1>Lens has no chart for this route.</h1><button class="button primary" onClick={() => navigate('/')}>Return to overview</button></section></Shell>;
}

function App() {
  return () => {
    const path = routePath().replace(/\/$/, '') || '/';
    if (path === '/') return <OverviewPage />;
    if (path === '/cohorts') return <CohortsPage />;
    if (path === '/exports') return <ExportsPage />;
    return <NotFoundPage />;
  };
}

function pct(value) { return `${Math.round(value * 1000) / 10}%`; }
function money(value) { return `$${Math.round(value).toLocaleString()}`; }
function shortLabel(label) { return label.includes('-') ? label.slice(5) : label; }
function rangeDayCount(value) { return value === '7d' ? 7 : value === '14d' ? 14 : 30; }
function visualTickEvery(count) { return count > 14 ? 5 : count > 7 ? 2 : 1; }
function isVisualTick(index, count, every) {
  if (count > 14) return index > 0 && index < count - 1 && (index + 1) % every === 0;
  if (count > 7) return index > 0 && index < count - 1 && index % every === 1;
  return true;
}

mount(<App />, '#app');
