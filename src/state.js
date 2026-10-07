import { computed, signal } from 'what-framework';
import { aggregateEvents, filterEvents, parseFilters, syntheticEvents, toCsv } from './data.js';

export const routePath = signal(window.location.pathname);
export const range = signal('30d');
export const channel = signal('All');
export const cohort = signal('All');
export const report = signal({ status: 'idle', data: null, error: null });

const onPopState = () => routePath(window.location.pathname);
window.addEventListener('popstate', onPopState);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.removeEventListener('popstate', onPopState);
  });
}

export function navigate(path) {
  if (window.location.pathname !== path) history.pushState({}, '', path);
  routePath(path);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
}

export const activeFilters = computed(() => parseFilters({ range: range(), channel: channel(), cohort: cohort() }));
export const filteredEvents = computed(() => filterEvents(syntheticEvents, activeFilters()));
export const analytics = computed(() => aggregateEvents(filteredEvents()));

export function downloadCsv() {
  const csv = toCsv(filteredEvents());
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `lens-${range()}-${channel().toLowerCase()}-${cohort().toLowerCase()}.csv`.replace(/\s+/g, '-');
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function fetchServerReport() {
  if (report().status === 'loading') return;
  report({ status: 'loading', data: null, error: null });
  try {
    const response = await fetch('/api/report', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(activeFilters())
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      report({ status: 'error', data, error: data.error || 'Report failed' });
      return;
    }
    report({ status: 'ready', data, error: null });
  } catch (error) {
    report({ status: 'error', data: null, error: error.message });
  }
}
