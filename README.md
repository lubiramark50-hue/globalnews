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

## 2026-10-30 hardening: restored bookmarks, deep links and data freshness
- Story page now resolves saved/older stories from `functions/api/story/[id].js` backed by D1; local bookmark stores complete public story metadata so saved stories remain available even after news feeds rotate. It never stores any publisher article body.
- On temporary upstream failure browser shows a clearly labelled saved-feed snapshot rather than blank results; this is not falsely presented as a fresh scrape.
- Background ingest now polls four countries per 10-minute cycle, covering fourteen configured countries across four cycles (~40 minutes, subject to source availability), not all countries every ten minutes. Higher polling rate must be monitored against shared Cloudflare quotas.
- Existing RSS corrections are now allowed to update stored headline/excerpt. Count in ingestion_log represents inserted-or-corrected records, though historical field is named `inserted`.
- Site security headers are configured by Pages `_headers`. Advertising integrations remain **disabled pending GlobalNews-specific provider approval**.

## Source health transparency and tests
The `/api/status` endpoint publishes only aggregate archive metrics (story count, last successful ingestion and countries checked in 24 hours), cached at the edge. Sidebar newsroom status uses actual D1 data, rather than inventing 'live' figures. GitHub CI includes source attribution, archived article ID validation, country validation and safe failure behavior tests with mocked database access.

## 2026-10-30 origin request optimization
Normal client `/api/news?country=UG` requests now use D1's **recent successfully ingested source snapshot** when one exists (up to 50 minutes old, matching four-country rotation), cached at the edge for 5 minutes. The scheduled Worker calls `/api/news?country=UG&fresh=1` to collect upstream feeds; this path has a separate normalized cache key for 10 minutes. If the D1 snapshot is missing or stale, client API falls back to direct sources. This avoids repeatedly requesting nine RSS feeds for each visiting user or Cloudflare POP. Freshness timestamps reflect the **actual last ingestion check**, not merely the webpage request time. `fresh=1` never disables caching and does not allow arbitrary source URLs.

## Full archive search
`GET /api/search?q=...` performs bounded, parameterized D1 searches over attributed headline/excerpt metadata and returns a maximum of 60 matches. The reader-facing Search page now uses this endpoint rather than searching only the current ~120 RSS stories, preserves a shareable `/search?q=` route, and provides loading/empty/error states. No publisher full article bodies are indexed.

### Source excerpt quality
Google News regional RSS often contains nested HTML links instead of licensed editorial summary text. GlobalNews now intentionally omits those aggregator descriptions rather than showing broken markup or pretending to have full article text. Nonregional RSS descriptions are cleaned and publisher attributed. Existing archive records from Google News are normalized in reader/search API outputs while future ingest stores clean metadata.

## 2026-10-31 Gemini editorial integration (key required)
The deployed Worker can prepare Gemini-assisted summaries of *existing publisher headlines/excerpts*. It will **not** ask Gemini to invent news. The source remains attributed. Securely set `GEMINI_API_KEY` as a Cloudflare Worker secret. Never commit or paste the key into public code. Model: `gemini-3.5-flash-lite`, server-side REST API. Generation is disabled when no key exists, limited to 2 articles per cron cycle and **12 attempted calls per UTC day** by default (maximum configurable limit 40 with `GEMINI_DAILY_LIMIT`), with recorded success/failures in D1, conservative factual grounding and manual source-verification caveats. Articles without enough source text are deliberately skipped. D1 tables `article_summaries` and `ai_usage_log` were created separately without altering old records.

Source copy is NOT independent verification; the interface labels Gemini content as an AI-assisted briefing based on a single publisher excerpt. Missing keys do not break the RSS pipeline.

## Editorial redesign, mobile experience and SEO
A separate editorial stylesheet now uses restrained publication typography and avoids excessive card shadows/gradients. Desktop, tablet and Android phone remain distinct at proper breakpoints. The web app includes a minimal install manifest, canonical metadata and clear page indexing policies. `robots.txt` references an expanded sitemap of primary category and policy pages. Saved/search/article aggregation pages aren't submitted as original news content; indexed pages remain attributable. Search Console property verification and actual indexing are separate requirements, and sitemap submission alone never guarantees inclusion in Google results.
