import { mount } from 'what-framework';
import './styles.css';
import { channels, cohorts } from './data.js';
import { analytics, channel, cohort, downloadCsv, fetchServerReport, navigate, range, report, routePath } from './state.js';

function NavLink({ href, children }) {
  return <button class={() => routePath() === href ? 'nav-link active' : 'nav-link'} onClick={() => navigate(href)}>{children}</button>;
}

function Shell({ children }) {
  return (
    <div class="shell">
      <aside class="rail">
        <button class="logo" onClick={() => navigate('/')}>Lens</button>
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
          <span>Fixture seed</span>
          <strong>20261001</strong>
          <small>{() => `${analytics().totals.visitors.toLocaleString()} filtered visitors`}</small>
        </aside>
      </header>
      <Filters />
      <section class="dashboard-board">
        <StatCards />
        <ChartCard title="Revenue by day" rows={() => analytics().byDay.slice(-14)} metric="revenue" />
        <ChartCard title="Visitors by channel" rows={() => analytics().byChannel} metric="visitors" />
      </section>
    </Shell>
  );
}

function ChartCard({ title, rows, metric }) {
  return (
    <article class="card">
      <h2>{title}</h2>
      <div class="bars">
        {() => {
          const data = rows();
          const max = Math.max(...data.map((row) => row[metric]), 1);
          return data.map((row) => (
            <div class="bar-row">
              <span>{shortLabel(row.label)}</span>
              <div class="bar"><i style={`width:${Math.max(4, (row[metric] / max) * 100)}%`}></i></div>
              <b>{metric === 'revenue' ? money(row[metric]) : row[metric].toLocaleString()}</b>
            </div>
          ));
        }}
      </div>
    </article>
  );
}

function CohortsPage() {
  return (
    <Shell>
      <div class="section-heading"><p class="eyebrow">Cohort detail</p><h1>Segment health updates as filters change.</h1></div>
      <Filters />
      <section class="card">
        <table>
          <thead><tr><th>Cohort</th><th>Visitors</th><th>Activated</th><th>Retained</th><th>Revenue</th></tr></thead>
          <tbody>{() => analytics().byCohort.map((row) => <tr><td>{row.label}</td><td>{row.visitors.toLocaleString()}</td><td>{pct(row.activationRate)}</td><td>{pct(row.retentionRate)}</td><td>{money(row.revenue)}</td></tr>)}</tbody>
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
        <button class="button" onClick={fetchServerReport}>Refresh summary</button>
        <ReportResult />
      </section>
    </Shell>
  );
}

function ReportResult() {
  return () => {
    const state = report();
    if (state.status === 'idle') return <p class="report-note">No server summary yet. Refresh when you want a checked read on the current filters.</p>;
    if (state.status === 'loading') return <p class="report-note">Refreshing summary…</p>;
    if (state.status === 'error') return <p class="report-note error">Summary error: {state.error}</p>;
    return (
      <div class="server-summary">
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

mount(<App />, '#app');
