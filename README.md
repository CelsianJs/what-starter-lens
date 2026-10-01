# Lens — What Framework analytics starter

Lens is a public starter for a synthetic product analytics app built with What Framework and packaged for Vura.

It demonstrates:

- deterministic fixture events instead of fake production tracking;
- signal-driven range/channel/cohort filters;
- computed totals, chart rows and cohort rows;
- client-side CSV export;
- generated static `/build` documentation;
- a real serverless `/api/report` Function-compatible endpoint.

## Run locally

```sh
npm install
npx playwright install chromium
npm run dev
```

## Build and test

```sh
npm run build
npm test
npm run smoke
```

`npm run smoke` starts `dist/` locally, runs a real browser through filters/report/build/404 flows, and fails on relevant console warnings or errors.
On minimal Linux CI images that do not already include browser system libraries, use `npx playwright install --with-deps chromium` instead.

## Data model

All events come from `src/data.js` and the deterministic seed `20261001`. Lens does not track visitors, send beacons, use cookies or call paid services.

## Deploy to Vura

Root/publishing agent links the final project first:

```sh
npx vura-platform projects --team <team-id>
npx vura-platform projects create what-starter-lens --team <team-id>
npx vura-platform projects link <project-id>
npm run deploy
# or
npm run deploy:prod
```

`vura-platform@0.3.0` is installed as a dev dependency, so `npm run deploy` uses the local CLI from `node_modules/.bin`. The deployment upload contains `dist/static`, `dist/functions/api_report/index.js`, and `dist/manifest.json`. Vura serves static assets from its edge/R2 path and places the serverless report route according to the platform runtime map; do not describe the whole runtime as “all Workers.”

## Public source

Planned repository: `https://github.com/CelsianJs/what-starter-lens`
