# Design

## Source of truth
- Status: Active
- Last refreshed: 2026-10-08
- Primary product surfaces: compact analytics overview with chart panels above the fold, cohort table, export/server report view, static `/build` explainer.
- Evidence reviewed: What Framework dashboard conventions, Vura build-output shape, and the public starter requirements.

## Brand
- Personality: blue-grey product analytics console; dense but calm, synthetic and clearly labeled.
- Trust signals: deterministic fixture seed, explicit no-tracking copy, typed server report, CSV export.
- Avoid: fake customer data, fake integrations, surveillance vibes, purple AI gradients.

## Product goals
- Goals: demonstrate dashboard-first filters, charts, cohort detail, CSV export and a serverless report endpoint.
- Non-goals: real ingestion, user tracking, external data-platform sync, paid analytics services.
- Success signals: filters update charts instantly, cohort table remains readable, CSV exports current rows, server endpoint mirrors current aggregate.

## Personas and jobs
- Primary personas: agents copying analytics starter patterns; product teams evaluating What/Vura fit.
- User jobs: inspect signal/computed dashboard patterns, test serverless aggregates, reuse a deployable starter.
- Key contexts of use: marketing gallery, source reference, local browser QA.

## Information architecture
- Primary navigation: Overview, Cohorts, Exports, Build.
- Core routes/screens: `/`, `/cohorts`, `/exports`, `/build`, `/404`.
- Content hierarchy: synthetic data disclosure, filters, totals and visual chart panels before long-form explanation.

## Design principles
- Data honesty: always call out synthetic seed data.
- High contrast density: dashboard can hold numbers without becoming grey mush.
- Dashboard first: users should see controls, metrics and charts above the fold, not a marketing hero.
- Copyable internals: data functions and report endpoint are readable and tested.

## Visual language
- Color: dark blue-grey, cyan/lime signal accents.
- Typography: Avenir Next/system sans for a clean analytical feel.
- Spacing/layout rhythm: compact left rail plus dashboard board on desktop; stacked mobile.
- Shape/radius/elevation: flat navy surfaces, 8–12px radii and subtle borders.
- Motion: none required for meaning; reduced-motion guard present.
- Imagery/iconography: no external imagery.

## Components
- Existing components to reuse: none; standalone public starter.
- New/changed components: rail nav, compact product header, filters, stat cards, vertical time-series chart, horizontal category bars, cohort comparison table, export panel.
- Variants and states: report idle/loading/ready/error; filtered empty endpoint state.
- Token/component ownership: CSS variables in `src/styles.css`.

## Accessibility
- Target standard: WCAG AA practical baseline.
- Keyboard/focus behavior: native selects/buttons and focus rings.
- Contrast/readability: bright text/accent against dark background.
- Screen-reader semantics: labels, tables and landmarks.
- Reduced motion and sensory considerations: no required motion; reduced-motion reset included.

## Responsive behavior
- Supported breakpoints/devices: desktop and mobile.
- Layout adaptations: sticky rail becomes top block; cards/filter grid collapse to one column.
- Touch/hover differences: nav and buttons remain large enough for touch.

## Interaction states
- Loading: export page prints `Loading…`.
- Empty: server endpoint has explicit no-match error, though valid UI filters always have data.
- Error: report panel prints typed error JSON.
- Success: report JSON includes filters, rowCount, totals, byChannel, byCohort and byDay.
- Disabled: server summary refresh is disabled while its request is pending; CSV export remains local and available.
- Offline/slow network: client analytics keep working; server report shows fetch error.

## Content voice
- Tone: precise and transparent.
- Terminology: synthetic seed, visitors, activation, retention, cohort, channel.
- Microcopy rules: never imply real user tracking.

## Implementation constraints
- Framework/styling system: What Framework `0.13.10`, Vite, handwritten CSS.
- Design variable constraints: local CSS variables only.
- Performance constraints: fixture set only, no network until server report.
- Compatibility constraints: Vura Function-compatible endpoint, browser Blob CSV export.
- Test/screenshot expectations: unit tests, API tests, build, Playwright smoke where browser is available.

## Operational refinement

At narrow widths the rail, fixture metadata, filters, and metric cards use compact spacing while preserving native labeled controls. Cohorts keep their semantic scrolling table and a visible horizontal-scroll hint. A report shows the filters represented by its server response and warns when controls no longer match that snapshot; refreshing is disabled while a request is pending.

Validation contract: The smoke test requires metrics before650px and the chart card before844px at390px, checks7/14/30-day bar geometry, then confirms report freshness changes when filters change.

## Open questions

- [ ] Root confirms final live Vura URL after deployment.

## Visual QA audit
- External reference: none supplied; design was evaluated against this document rather than a pixel target.
- Current judgment: blue-grey analytics-console direction is distinct from Tempo; the overview is dashboard-first with controls, metrics and chart panels above the fold; day revenue reads as a vertical time-series with fixed plot/axis rows, aligned baselines and unclipped 7/14/30-day ranges; channel visitors remain categorical horizontal bars; cohort values are right-aligned with comparison marks; mobile compacts the rail/cards and fixture seed metadata; reduced-motion is respected.
- Follow-up after deployment: capture desktop/mobile screenshots from the live Vura URL and compare against the product goals above before linking from the marketing gallery.


## Modern interface consistency

The primary workspace, detail views and build guide share a bounded sans-serif hierarchy, natural-case 14px chrome, 44px targets and quiet surfaces. Do not reintroduce poster headings, decorative background grids, heavy shadows or pill-shaped navigation. Brand accents and functional visualizations remain distinct; operational information takes precedence over decoration.
