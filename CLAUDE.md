# Symptom Timeline — CLAUDE.md

## Project Overview

**Tagline:** Build your health timeline. Walk into appointments prepared.

Symptom Timeline is an AI-powered medical appointment prep tool. Users log symptoms, events, and observations over time using a simple journal-style interface. Before a doctor's appointment, they hit "Prepare Summary" and Claude generates a concise, structured symptom narrative organized by onset, pattern, triggers, and severity.

## Tech Stack

- **Vanilla HTML/CSS/JS** — no framework
- **localStorage** — all data persists client-side
- **Claude API** (`claude-sonnet-4-20250514`) — appointment summary generation
- **Lucide Icons** via CDN
- **Netlify** — deployment target

## API Key Pattern

User provides their own Anthropic API key via an in-page gate. Key is stored in `localStorage` under `st_api_key`. All API calls use `anthropic-dangerous-direct-browser-access: true` header. No backend/Netlify Functions — follows the same pattern as `offer-lens`.

## Design Tokens

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#faf9fc` | Page background |
| `--color-surface` | `#ffffff` | Card white |
| `--color-surface-soft` | `#f3f0f8` | Timeline rail bg |
| `--color-ink` | `#1a1523` | Body text |
| `--color-ink-muted` | `#6b5f7a` | Muted text (WCAG AA on all 3 surfaces) |
| `--color-accent` | `#6d28d9` | Violet CTA |
| `--color-accent-hover` | `#5b21b6` | Deep violet |
| `--color-accent-soft` | `#ede9fe` | Card highlight |
| `--color-severity-low` | `#166534` | Mild (1–2) |
| `--color-severity-mid` | `#b45309` | Moderate (3) |
| `--color-severity-high` | `#991b1b` | Severe (4–5) |
| `--color-border` | `#e5e0ef` | Borders |

Typefaces: **Lora** (headings, serif) + **Nunito** (body, rounded)

## File Structure

```
sympton-timeline/
├── index.html
├── css/styles.css
├── js/
│   ├── app.js           — wires form, events, API key gate
│   ├── entries.js       — CRUD for localStorage entries
│   ├── renderer.js      — timeline DOM rendering
│   └── summarizer.js    — Claude API + prompt engineering
├── assets/
│   ├── favicon.svg
│   └── og-image.png
├── tests/
│   └── timeline.spec.js — Playwright smoke tests
├── .husky/
├── .vscode/settings.json
├── netlify.toml
├── _redirects
├── package.json
├── eslint.config.js
├── stylelint.config.js
├── .htmlvalidate.json
├── .prettierrc
├── CLAUDE.md
├── HANDOFF.md
└── README.md
```

## Entry Data Schema

```js
{
  id: string,          // crypto.randomUUID()
  symptom: string,     // required
  severity: number,    // 1–5
  category: string,    // pain|fatigue|digestive|respiratory|mood|other
  datetime: string,    // ISO 8601
  notes: string        // optional
}
```

## Claude Output Schema

```json
{
  "overview": {
    "duration": "string",
    "chief_complaint": "string",
    "entry_count": 0
  },
  "patterns": [{ "observation": "string", "detail": "string" }],
  "progression": { "trend": "worsening|improving|stable", "detail": "string" },
  "questions": [{ "question": "string", "rationale": "string" }]
}
```

## Accessibility Requirements

- Severity scale uses color + numeric + text label — never color alone
- Timeline entries are `<li>` in a `<ul role="list">`
- Entry form has full label association, errors via `aria-describedby`
- `role="status"` on loading region (implicit `aria-live="polite"` — do NOT add `aria-live`)
- Skip link targets `<main tabindex="-1">`
- `aria-hidden="true"` on SVG/icon elements directly, not on text wrappers
- Clear All dialog: `role="dialog"` with `aria-modal="true"` and focus trap
- Print summary: severity text equivalents in print stylesheet
- `--color-ink-muted` verified WCAG AA on all three surface colors

## ESLint Config Notes

- `sourceType: 'script'` for browser JS files (no `type: module` in package.json)
- Use `/* exported funcName */` for browser globals
- Scoped override for `tests/**/*.spec.js` with `sourceType: 'module'` (Playwright)

## Runtime Decisions

- **Severity radio positioning:** `.severity-option` must have `position: relative` so the `position: absolute` hidden radio is contained within the label. Without it, the radio drifts to the top of the viewport and ends up behind the sticky header.
- **Severity interaction:** users (and tests) should click the visible `.severity-pip` or the `label.severity-option`, never the hidden `<input>` directly.
- **Cross-file globals:** `app.js` declares `/* global getEntries, saveEntry, … */` to tell ESLint about functions loaded from other script tags. `entries.js`, `renderer.js`, and `summarizer.js` use `/* exported funcName */` for their public functions.
- **Summary panel state:** `renderSummary()` in renderer.js only populates DOM content. All show/hide of `#summary-loading`, `#summary-error`, `#summary-content`, and `#summary-panel` is managed in `app.js` (`showSummaryLoading`, `handleSummarySuccess`, `showSummaryError`).
- **Error codes:** `ERROR_MESSAGES` map in `app.js` is keyed by string codes (`NO_KEY`, `INVALID_KEY`, `NETWORK_ERROR`, `PARSE_ERROR`, `NO_ENTRIES`). `summarizer.js` must throw `new Error('<CODE>')` to match.

## Phases

1. Pre-code declaration — **DONE**
2. Core HTML/CSS scaffold — **DONE**
3. JS functionality (entries CRUD, localStorage, timeline render) — **DONE**
4. Claude API integration (summarizer) — **next**
5. Playwright smoke tests
6. Pre-commit tooling (Husky, ESLint, Stylelint, Prettier)
7. Recruiter audit + pre-deploy audit (Lighthouse CLI)
