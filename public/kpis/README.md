This folder is used to host KPI JSON reports that the DevKPIs dashboard reads in development.

How to generate/update the latest report:

1) From project root, run:

   npm run kpis -- --days=180 --out public/kpis/kpis-latest.json

2) Then visit the route /dashboard/dev-kpis in the app.

Optionally, include --with-build to include bundle size if dist/ exists:

   npm run kpis:build && npm run kpis -- --out public/kpis/kpis-latest.json --with-build
