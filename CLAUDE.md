# GlobalNews — Claude Code project instructions

## Goal
Audit, improve, thoroughly test and safely deploy the existing **GlobalNews** news website so its desktop and mobile experiences are independently excellent, fast, usable, accurate and secure. This is an actionable coding assignment: implement fixes and show proof. Do not merely present plans, and do not claim completion before verified tests.

**Repository:** https://github.com/lubiramark50-hue/globalnews (main)  
**Live:** https://globalnews-a0q.pages.dev/  
**Hosting:** Cloudflare Pages project `globalnews`; GitHub source; static output `public`; Pages Functions in `functions/`.  
**Scheduled data:** Cloudflare Worker `globalnews-ingest`, cron `*/10 * * * *`; dedicated D1 `globalnews-db`, binding `DB`.  
**No VPS**; keep user-owned Cloudflare and GitHub accounts. Never touch Troot Window, Ziggo Haul or GenZ deployments and databases.

**Existing code:** `public/index.html`, `styles.css`, `responsive.css`, `app.js`, `ads.js`, `ads-config.js`, `functions/api/news.js`, `functions/api/location.js`, `worker/ingest.js`, `worker/wrangler.toml`, `sql/d1-schema.sql`. Read the current code and README before acting.

## Verified present-state gaps (as of 2026-10-30)
- Some responsive/mobile polishing exists but is not proven across all phone/tablet/desktop dimensions.
- Cron fires every 10 minutes, but currently rotates about **two of 14 countries per cycle**: full rotation approximately **70 minutes**. Don't say every country refreshes every 10 minutes unless code, data and logs prove it.
- Current article feed consists largely of publisher RSS headlines/excerpts and publisher links, not independently verified AI-written news.
- **OpenAI editorial summarization, translation and review are not yet operational.** Language preference controls do not themselves translate any story.
- **GlobalNews has no verified Adsterra approval or website-specific codes.** Current config stages Troot Window identifiers and is disabled intentionally. Do not turn it on without correct approved codes and consent/policy checks.
- Some multimedia is only a direct external publisher link; don't claim live embedded videos, rights or capabilities that haven't been implemented.

## Ordered engineering checklist

### 1. Baseline and test plan
- Inspect every route, component and script, database schema, Workers settings/bindings, Cloudflare cron history, source availability, CI results and current latest production commit; document actual defects, not guesses.
- Obtain real screenshots in browser at 320, 360, 375, 390, 430, 768, 820, 1024, 1280, 1366, 1440 and 1920 pixels (both portrait and landscape where relevant), for Home, World, My Region, Technology, Business, Sports, Science, Videos, Search, Saved, Article, settings and 404/error states.
- Check browser console errors, failed resource requests, images, accessibility tree, horizontal overflow, interaction clickability, blank states, sticky header and bottom navigation.

### 2. Maximum-quality PC design
- Establish a refined, consistent navy/blue editorial identity with disciplined typography, hierarchy, photography, whitespace, cards and source metadata; remove generic AI-template look.
- Fix masthead, desktop top navigation, hero/lead headline, top-story cards, category grid, right sidebar, latest ticker, search, source label, timestamps, bookmark UI, page footer and ad placements.
- Keep important facts and primary source link visible. Ensure balanced composition at 1024–1920 px, smooth breakpoints and useful hover/focus effects.

### 3. Native-feeling mobile and tablet design
- **Never force a PC-width layout onto a phone.** Use a genuinely phone-first design with clean masthead, accessible touch targets (roughly 44x44 px), working mobile bottom tab bar, safe-area padding, responsive hero and readable full-width vertical feed.
- On phones hide oversized desktop-only banners; never put an ad over bottom tabs or news text. Place native in-feed ad only after ~10 stories if and when approved, with clear Sponsored labeling.
- Fix collapsed mobile nav and drawer, dark mode surfaces, scrollable category pills, fixed dock, broken thumbnail ratios, compact typography, tab state synchronization, scrolling/route transitions, modal keyboard/ESC/focus trap, disabled/empty/refresh states.
- Tablet gets deliberate mid-size layout; not stretched phone or squashed desktop.

### 4. Entire functional user journey
- Verify deep links, browser back/forward, article slug reloads, link targets, route filtering, World vs My Region accuracy, country switching, manual vs approximate country detection, timezone/local clock, search queries and no unexpected query resets, persistent saved articles, theme and language preference, keyboard use and reduced motion.
- Implement real loading skeletons, useful errors/retry and last-successful-update timestamps. Do not show stale news as Breaking Now. Preserve scroll on background refresh.
- Fix category screens, source list and video publisher links. Do not embed or copy unlicensed media. Add safe image placeholders if source thumbnails fail.

### 5. Adsterra monetization, safely
- Audit `public/ads-config.js`, `ads.js`, responsive styles and slot insertion. **Do not enable Troot Window's codes on the new domain.** Obtain confirmation that **globalnews-a0q.pages.dev** has been accepted by Adsterra, and get its own assigned approved banner/native tags.
- Prepare responsive, collapsing, accessible banner slots on PC and in-feed native only in permitted areas on mobile. No fake ads, popunders, social-bars, auto redirects, intrusive overlays or forced autoplay.
- Avoid duplicate scripts on SPA route changes. Render real ads only when provider confirms fill; hide vacant spaces. Apply privacy/consent requirements for targeted advertising as applicable. Keep disclosures obvious.

### 6. Worldwide discovery, 10-minute automation and D1 health
- Audit actual Worker schedule, `ingestion_log`, D1 `articles` rows, all failures, out-of-date regions, per-country freshness, source response codes, article duplicates and correction behaviors.
- Set an honest measurable freshness target and make the 10-minute scheduler useful for the important regions without exhaustively polling all feeds on every visitor request. Use ETag/Last-Modified, prioritized source cadence, caching, queues/batches only as warranted by actual quotas.
- Improve source registry beyond a handful of RSS feeds with legal/technical permission, source language, trust and geographic relevance. No paywall bypass or copyright-infringing republication.
- Canonicalize publisher URLs; add dedupe/clustering, update-in-place for corrections, article validity/status flags, withdrawn/deleted content handling, source history, last-checked timestamp, retries/backoff and source health dashboard.
- Route by actual news region/topic rather than simply publisher location; give each reader local news plus high-impact international news without echo chambers.
- Keep database isolated; do schema migrations without destructive drops; provide backup/rollback path.

### 7. OpenAI editorial system (only if authorized and funded)
- User specifically wants **OpenAI as the only live editorial AI provider**. Claude may edit code but must NOT install another production editorial AI model or silently substitute another provider.
- Provide server-only OpenAI API integration after secure key availability, explicit cost budget and verification safeguards. Do not commit or print secrets.
- Design source-grounded ranking and clustering, multilingual original summaries, diversity of publishers, distinction between confirmed and developing stories, original source links, corrections/retractions, reliability/importance scoring and human escalation for high-risk disputes.
- Translation must actually work and be QA-tested (especially Luganda, Kiswahili, Arabic and other supported locales), with original-language toggle. If unavailable, label honestly; never fake translations.
- Track AI costs per story, hard budgets, retries/rate limits, review reasons and model/version provenance. Accuracy takes precedence over number of stories.

### 8. Cost discipline, reliability and security
- Maintain a **static-first / dynamically fed architecture**, not a build every 10 minutes. Measure Workers daily requests/CPU, D1 reads/writes/storage, Pages builds, image traffic and shared Cloudflare account headroom for other user sites.
- Protect cache keys per region/language and prevent cache poisoning. Use stale-but-clearly-dated fallback when sources fail; show last successful timestamp. No unlimited free-service claims.
- Audit XSS from RSS HTML, content injection, untrusted links, URL schemes, SSRF, malformed XML, API rate abuse, Cloudflare Worker secrets, D1 bindings/permissions, CSP/CORS, CSRF as relevant, safe link rel and strict HTTPS.
- Check privacy: coarse location suggestion (not precise GPS), local saved preferences, consent before ad trackers where needed; meaningful Privacy, About, Editorial Standards and Source pages.
- Improve metadata, article permalinks, canonical URLs, robots, XML sitemap, structured data when true, social sharing preview, semantic headings and indexability; never invent bylines or publication dates.
- Aim for real Core Web Vitals (LCP <=2.5s, INP <=200ms, CLS <=0.1 at p75 when possible), Lighthouse mobile & PC accessibility/performance/SEO >=90 as a measured ambition, not a manufactured claim.

### 9. Proof, deployment and reporting
- Set up repeatable tests: Node syntax, lint/format, feed parser/unit tests, simulated RSS failures and retractions, D1 integration smoke tests, browser Playwright E2E for each key user journey and viewport, visual regression screenshots, broken link check, accessibility and secret scanning. CI must not require production keys.
- Work in small commits and PRs, avoiding giant untested rewrites. Do NOT disable existing functionality just to obtain a clean screenshot.
- Keep GlobalNews live. Deploy tested code to the existing user-owned Cloudflare project; verify success and real HTTP/browser behavior, confirm scheduled Worker continues separately, document rollback.
- For each completed phase report changed files, commit/PR links, test results, screenshot evidence for mobile+desktop, live URL, current production status, verified database freshness and unresolved dependencies. **Do not assert 100% perfection, live ads, full OpenAI publishing or global 10-minute freshness without real evidence.**
- If external browser snapshot tooling returns Cloudflare 429, stop retrying aggressively; use a different authorized test approach and explicitly disclose any unverified items.

## Definition of done
A stable world-class, trustworthy news site with intentionally distinct PC/tablet/phone layouts, functional site routes, server-based source updates, source and date attribution, secured API and database, transparent costs and status, ad placements that activate only after **GlobalNews-specific** network approval, and a thorough evidence-backed test report.

**Start now by inspecting the repo and live site, identifying and fixing the largest failures in mobile layout and news freshness.** Continue through phases in priority order, with working deployments and honest progress.
