# GlobalNews

**Live website:** https://globalnews-a0q.pages.dev/  
**GitHub:** https://github.com/lubiramark50-hue/globalnews

GlobalNews is a source-attributed, location-aware, responsive news discovery website running on Cloudflare Pages and Workers. It is a **first release**, not yet a production-hardened AI news publisher.

## Implemented
- Responsive editorial frontend with world, regional, technology, business, sports, science and video pages, article reader, search, bookmarks, theme and locale settings.
- Automatic **country suggestion** from Cloudflare's approximate country metadata. Readers may override location; no device GPS is required. Supports 14 country choices.
- Cloudflare Pages Functions fetch public RSS headlines/excerpts from a small vetted list of feeds, including BBC, the Guardian, Al Jazeera and Google News RSS search for selected countries.
- Publisher names and original article links are displayed; source snippets are **not** portrayed as AI-generated editorial reporting.
- News API cached at Cloudflare edge for 10 minutes, client refreshes every 10 minutes without rebuilding the website.
- Separate `globalnews-ingest` Cloudflare Worker with Cron Trigger `*/10 * * * *`. It rotates over two countries per run to reduce quotas; a full 14-country rotation therefore spans approximately 70 minutes.
- Independent Cloudflare D1 database `globalnews-db`, with tables `articles` and `ingestion_log`. Cron writes new source entries using INSERT OR IGNORE. The frontend API can use D1 as fallback if all upstream feeds fail.
- GitHub Actions JavaScript syntax validation. GitHub-to-Cloudflare Pages auto deployments of code updates.

## Deployment configuration
Cloudflare account: managed via its own dashboard. Project `globalnews`, GitHub owner `lubiramark50-hue`, repo `globalnews`, production branch `main`, static output `public`, no build step. `functions/` are published as Pages Functions. This project does not require Supabase or a VPS.

Worker source: `worker/ingest.js`, Wrangler config: `worker/wrangler.toml`. Database migration: `sql/d1-schema.sql`. Set D1 binding `DB` with the database UUID from the Wrangler config. Do not commit secrets.

## Limits and safeguards
- Curated RSS discovery is **not comprehensive worldwide coverage**. Publishers can be delayed, inaccessible, or restrict reuse.
- The app currently shows **original source excerpts**, **not** OpenAI summaries. OpenAI editorial processing and translation are NOT enabled without a funded OpenAI API key, server-only secrets, reliable source verification, review controls and budget protection. Never expose API keys to the browser.
- Language options currently save a preference but do **not** translate articles. The interface explicitly tells users this.
- Videos link to original news channels; full videos or copyrighted publisher assets are not hosted without permission.
- Verify editorial facts with primary sources and ensure corrections/withdrawals are supported before scaling.
- D1 and Worker quotas, RSS publisher rights, and Cloudflare account usage must be monitored, especially alongside other hosted projects.

## Testing
```sh
node --check public/app.js
node --check functions/api/news.js
node --check functions/api/location.js
node --check worker/ingest.js
```

Live smoke tests: `/`, `/api/news?country=UG`, `/api/location`. Inspect Cloudflare Worker Cron logs and D1 `ingestion_log` for successful scheduled execution.

Ad placement refinement: the responsive native slot appears in the desktop sidebar or after the tenth card on mobile; the desktop-only 468×60 banner is suppressed for narrow viewports. These ad units remain disabled until the new domain is approved by Adsterra.
