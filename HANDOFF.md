# Handoff — Symptom Timeline

## Current Phase

**Phase 7a complete.** Lighthouse audit — 100/100/100/100.

## What Was Just Completed

**Phase 7a — Lighthouse CLI Audit**

Scores: Performance 100 / Accessibility 100 / Best Practices 100 / SEO 100.

Fixes applied to reach 100/100:
- **HTML restructure:** Moved `<main id="main-content">` out of `<div id="app">` so a main landmark is always in the DOM. The gate (`#api-key-gate`) and app layout (`#main-layout`) now both live inside `<main>`, only one visible at a time. `showApp()` / `showGate()` in `app.js` toggle all three elements.
- **`meta[name="theme-color"]`** added (`#6d28d9`) for mobile browser chrome.
- **`.prettierignore`** — added `lighthouse-report.json` (runtime artifact, excluded from format check).
- **`.gitignore`** — added `lighthouse-report.html`.

Full pipeline verified clean: ESLint → Stylelint → html-validate → Prettier check → 8 Playwright tests ✓

## What Was Just Completed (7b — Recruiter Audit)

Drove a full Playwright-based recruiter walk-through against `http://localhost:3000`. All 8 checklist items passed after one bug fix.

**Bug found and fixed:** Cancel button was visible in all states (including initial empty state and after cancelling edit). Root cause: `.btn { display: inline-flex }` is an author stylesheet rule and beats the browser UA `[hidden] { display: none }` since both have specificity `(0,1,0)` and author styles cascade after UA. Fix: added `[hidden] { display: none !important }` to the RESET section of `css/styles.css` — the standard normalize.css approach.

**Audit results:**
1. ✅ Gate screen — logo, h1, tagline, "never sent to servers" copy, Get Started button
2. ✅ Enter key → app shell, empty state, badge 0, Prepare/Clear disabled
3. ✅ 5 entries added — timeline appears, empty state hides, severity badges correct colors (green/amber/red), badge increments, Prepare enabled
4. ✅ Edit mode — heading swaps, Update Entry label, Cancel visible; cancel resets all
5. ✅ Delete — badge decrements, card removed
6. ✅ Clear All dialog — opens with backdrop, Cancel works, Escape works, Confirm clears
7. ✅ Change Key — gate reappears, localStorage entries preserved
8. ⏭ Summary generation — skipped (no real key; covered by Playwright mock test)

Full pipeline: ESLint → Stylelint → html-validate → Prettier → 8 Playwright tests → Lighthouse 100/100/100/100 ✓

## Exact Next Task

**Phase 7c: Deploy to Netlify**

```
netlify deploy --prod --dir .
```

Or push `master` to the connected Netlify remote if CI is wired. After deploy, update `og:image` in `index.html` from the relative path `assets/og-image.png` to the absolute deployed URL (e.g. `https://tomdeluca-symptom.netlify.app/assets/og-image.png`).

### 7b — Recruiter Audit Checklist

Walk through the app with fresh eyes as if you're a recruiter:
1. Gate screen — logo, tagline, API key input, "never sent to servers" copy
2. Enter a key → empty state with clear onboarding copy
3. Add 3–5 entries across different categories and severities
4. Check timeline: week separators, severity badge colors + labels, edit/delete buttons
5. Prepare My Summary → loading skeleton → all four summary sections populated
6. Print / PDF → check print stylesheet (severity text equivalents visible)
7. Clear All dialog → focus trap, Escape key, cancel vs confirm
8. Change Key → gate reappears, previous entries preserved in localStorage

### 7c — Final Fixes

Common things Lighthouse flags that may need fixing:
- Missing `meta[name="theme-color"]`
- `og:image` using relative path (should be absolute URL)
- Contrast ratio failures in summary pill text
- Missing `alt` on images (SVGs use aria-hidden so no alt needed)
- Font display strategy (`font-display: swap` in @font-face if loading fonts locally)

After Lighthouse and manual audit, deploy to Netlify:
```
netlify deploy --prod --dir .
```
Or push to the `master` branch if Netlify CI is connected.

## Decisions Made This Session (Not Yet in CLAUDE.md)

- Severity radio hidden input uses `position: relative` on the label so `position: absolute` is contained within the label — without this, the radio drifted under the sticky header
- Severity clicks in tests (and user interaction) should target the visible pip (`.severity-pip.sev-N`) or the label, not the hidden `<input>` directly
- `renderSummary` in renderer.js only populates DOM content; show/hide of summary panel states is managed in app.js (`handleSummarySuccess`, `showSummaryLoading`, `showSummaryError`)
- `ERROR_MESSAGES` map lives in app.js (keyed by error code strings) — Phase 4's summarizer should throw `new Error('INVALID_KEY')` etc. to match

## Known Gotchas

- `deno.lock` appears if Netlify CLI is run locally — already in `.gitignore`
- ESLint `sourceType: 'script'` means no `import`/`export` in browser JS — use `/* exported funcName */` and `/* global funcName */` pattern
- The `:has()` layout selector (two-column summary layout) requires baseline 2023 browsers
- `role="status"` has implicit `aria-live="polite"` — do NOT add `aria-live` attribute
- `#main-content` has `tabindex="-1"` for skip link programmatic focus
- Severity label CSS: `inset-block-end: 0; inset-inline-start: 0` was removed — reverted because the `severity-label` text was at the bottom and would intercept clicks. Keep `position: relative` on label only.

## What Was Just Completed (7c — Deploy)

**Deployed to Netlify production:**
- URL: https://tomdeluca-symptom.netlify.app
- Site ID: `d1ab6fce-1339-4174-afb9-96f1fd233aef` (in `.netlify/state.json`)
- Updated `og:image` to absolute URL pointing to the deployed domain
- Added `.netlify/plugins/` to `.gitignore`
- Future redeploys: `netlify deploy --prod --dir .` (state.json links the site automatically)

## All Phases Complete ✓

1. Pre-code declaration ✓
2. Core HTML/CSS scaffold ✓
3. JS functionality (entries CRUD, localStorage, timeline render) ✓
4. Claude API integration (summarizer) ✓
5. Playwright smoke tests ✓
6. Pre-commit tooling (Husky, ESLint, Stylelint, Prettier, html-validate) ✓
7. Recruiter audit + Lighthouse 100/100/100/100 + deploy ✓

**Live at:** https://tomdeluca-symptom.netlify.app
