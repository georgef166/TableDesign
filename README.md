# TableDesign

A modernized trading **Locates** request portal — built with **Vue 3 + Vite** and **AG Grid**.

A clean redesign of a legacy locate-request grid: dense, data-rich tabular workflow
wrapped in a modern UI (status chips, quick search, a polished "New Locate Request"
modal, and toast notifications).

## Features

- **AG Grid** table with a compact, flex-fitted column set (no horizontal scroll) —
  Request Date, Status, Type, Security and Qty Requested / Approved by default.
- **Composite Security cell** that folds Ticker, BBG Ticker, SEDOL, ISIN, CUSIP and
  RIC into one column to keep the grid within the viewport.
- **Row-detail drawer** — click any row for the complete record.
- **Column chooser** to bring the demoted identifier columns back individually.
- **Status badges** — color-coded Approved / Pending / Rejected pills.
- **Quick search** across ticker, SEDOL, ISIN and security name.
- **Status filter chips** with live counts.
- Refresh / Clear controls and toast feedback.
- Sorting, resizing, and pagination out of the box.

### FY26 feedback features

These map the TALP FY26 improvement list onto the redesign. Backend-dependent parts
run as **working front-end mocks** (in-memory + `localStorage`) pending the future webservice.

- **Security free-text lookup** — a Google-Finance-style typeahead (`SecurityTypeahead.vue`)
  searching ticker / name / ISIN / SEDOL / CUSIP / RIC, replacing the slow legacy drop-down.
  One selection auto-fills every identifier.
- **Locate by market value** — the New Request modal toggles between Shares and a USD
  amount (with an estimated-share readout from last price).
- **Bulk file uploader** — drop a CSV; columns are matched **by header name in any order**,
  with a mapping + per-row validation preview before import.
- **Standing lists + scheduling** — save reusable security baskets with a
  Daily / Weekdays / Weekly schedule, computed "next run", persistence, and **Run now**.
- **User impersonation** — admin "view as user" switcher; an impersonation banner appears
  and the grid scopes to that client's requests, for troubleshooting.
- **Availability files** — an in-portal availability view (sample data) with a one-click
  **Locate** shortcut that prefills the request modal.

_Out of scope:_ the session timeout (Scotia infra) and the TBD extra columns
(Div Level, Min holding period, Uncallable, Long/short-sale, Trading stock — need more info).

## Stack

| Layer     | Tech                  |
|-----------|-----------------------|
| Framework | Vue 3 (`<script setup>`) |
| Build     | Vite                  |
| Grid      | AG Grid (Quartz theme) |

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build
npm run preview  # preview the production build
```

## Project structure

```
src/
  App.vue                  # portal shell: topbar, stats, toolbar, grid
  main.js
  style.css                # design tokens + global styles
  components/
    StatusBadge.vue        # AG Grid cell renderer for status pills
    NewRequestModal.vue    # create-request dialog
  data/
    locates.js             # mock locate records
```
