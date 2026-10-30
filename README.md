# GlobalNews

A regional, multilingual-ready global news platform built for Cloudflare Pages and Workers.

## Project
- `public/` — mobile, tablet, desktop editorial frontend, categories, search, saved articles, reader views, region/language settings, and dark mode.
- `functions/api/news.js` — Cloudflare Pages Function: fetches attributed RSS headlines, deduplicates, provides local country feeds, caches for 10 minutes. The site **does not fabricate headlines**.
- `worker/ingest.js` and `worker/wrangler.toml` — independent, scheduled 10-minute discovery coordinator. Once deployed and configured with database secrets, writes records to Supabase.
- `sql/schema.sql` — SQL migration for a dedicated GlobalNews Supabase database.
- `.github/workflows/validate.yml` — syntax validation for commits.

## Cloudflare Pages
Project `globalnews`, repository `lubiramark50-hue/globalnews`, production branch `main`, build command empty, output directory `public`.

## Deploy the independent 10-minute collector
Deploy the `worker` folder with Wrangler, then set:
```sh
cd worker
npx wrangler deploy
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```
Do not commit or expose credentials in the frontend. Apply `sql/schema.sql` to a **new** Supabase project first.

## Accuracy and media safeguards
Currently the interface displays original RSS **headlines and excerpts**, labelled clearly with external source links. AI-generated original summaries and multilingual article translations are **not enabled** until an OpenAI API key, stronger multi-source verification rules, translation QA and a budget policy are configured. Videos link to official channels and are not copied or hosted. Source-provided thumbnails are used only as remote images; honor source rights and takedown requests.

## Validation
`node --check public/app.js && node --check functions/api/news.js && node --check worker/ingest.js`

The website can serve content without Supabase. The scheduled collector requires deployment and database credentials. Reader location is selected manually; user choices and bookmarks are stored only in their browser.
