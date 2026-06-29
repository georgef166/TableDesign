# Locates — Trading Request Portal

A modernized trading **Locates** request portal, built with **Vue 3 + Vite** and **AG Grid**.

A clean redesign of a legacy locate-request grid: a dense, data-rich tabular
workflow wrapped in a modern UI — four views, light/dark themes, an insights
dashboard, accessible dialogs, and a fast security typeahead. Backend-dependent
features run as **working front-end mocks** (seeded data + `sessionStorage`)
pending the future webservice, so the whole flow works end-to-end today.

> **Stack at a glance:** Vue 3 (`<script setup>`) · Vite · AG Grid (Quartz) ·
> SheetJS (`xlsx`) for Excel uploads. Charts, icons and the design system are
> hand-rolled — no UI/charting libraries.

---

## Views

| View | What it does |
|------|--------------|
| **Locate Requests** | The main grid — create, upload, search, filter, and drill into locate requests. |
| **Standing List** | Save reusable security baskets on a schedule (Daily / Weekdays / Weekly), with **Run now**. |
| **Availability** | Client inventory snapshot — search, watchlist, borrow-rate trends, one-click **Locate**. |
| **Locate History** | Read-only, company-scoped archive with a date range and CSV export. |

---

## Features

### The grid (Locate Requests + History)
- **AG Grid** with a compact, flex-fitted scan set (no horizontal scroll): Request
  Date, Status, Ticker, Security, **Qty Req · Qty Appr · Qty Pending** by default.
- **Qty Rejected** and the reference identifiers (BBG Ticker, Batch/Locate ID, SEDOL,
  ISIN, RIC, CUSIP) are demoted by default and brought back via the **column chooser**.
- **Row-detail drawer** — click any row (or press Enter/Space) for the full record.
- **Status filter cards** with live, animated counts, and a **quick search** spanning
  ticker / SEDOL / ISIN / security.
- Sorting, resizing, and pagination out of the box; Refresh / Clear with toast feedback.
- The grid + status cards live in **shared components** (`LocateGrid`, `StatusFilterCards`)
  reused by both grid views.

### Create & import
- **Security free-text lookup** — a Google-Finance-style typeahead searching ticker /
  name / ISIN / SEDOL / CUSIP / RIC, replacing the slow legacy drop-down. One pick
  auto-fills every identifier.
- **Locate by market value** — toggle between Shares and a USD amount, with an
  estimated-share readout from last price.
- **Bulk uploader** — drop a **CSV or XLS/XLSX**; columns are matched **by header name
  in any order**, with a mapping + per-row validation preview before import.

### Availability
- Hourly-style inventory snapshot with search and a **watchlist** — star rows to pin
  them; the **header star bulk-stars everything currently shown** (select-all toggle).
- **Borrow-rate trend** — an in-row sparkline plus an interactive **7-day** trend drawer
  (hover crosshair + tooltip).
- One-click **Locate** prefills the request modal, capped at the available quantity.

### Insights & polish
- **Insights dashboard** (Locate Requests) — status-mix donut, an interactive
  **requests-per-day** bar chart, and top-requested tickers. Dependency-free SVG.
- **Dark mode** — persisted topbar toggle; the whole app and AG Grid adapt.
- **Row density** — Comfortable / Compact toggle for the grids.
- **Standing lists + scheduling** — computed "next run", persistence, confirm dialogs.
- **User impersonation** — admin "view as user" switcher; a banner appears and every
  view scopes to that client's company.
- **CSV export** (Availability + History) with spreadsheet formula-injection hardening.

### Accessibility
- Keyboard-navigable throughout; **Escape / focus-trap / focus-return / scroll-lock**
  on every dialog (`useModal`).
- Status conveyed by **icon + shape, not colour alone**; visible focus rings; a
  contrast-tuned neutral palette in both themes.

---

## Stack

| Layer      | Tech                                   |
|------------|----------------------------------------|
| Framework  | Vue 3 (`<script setup>`)               |
| Build      | Vite                                   |
| Grid       | AG Grid Community (Quartz theme)       |
| Excel      | SheetJS (`xlsx`, lazy-loaded)          |
| State      | Module-singleton composables + `sessionStorage` |
| Charts/UI  | Hand-rolled SVG + a CSS design-token system |

---

## Getting started

```bash
npm install
npm run dev      # dev server (http://localhost:5173)
npm run build    # production build
npm run preview  # preview the production build
```

---

## Project structure

```
src/
  App.vue                    # shell: topbar, theme/impersonation, nav, Locate Requests view
  main.js
  style.css                  # design tokens (light + dark) + global styles

  components/
    LocateGrid.vue           # shared AG Grid wrapper (theme, density, columns)
    StatusFilterCards.vue    # shared status filter card cluster
    locateColumns.js         # shared column definitions + derived-qty helpers
    LocateHistory.vue        # Locate History view (date range + export)
    StandingLists.vue        # Standing List view
    StandingListModal.vue    # create/edit a scheduled basket
    AvailabilityView.vue     # Availability view (search, watchlist, trends)
    AvailabilityTrend.vue    # 7-day borrow-rate trend drawer
    RequestsInsights.vue     # insights dashboard (donut, per-day bars, top tickers)
    NewRequestModal.vue      # create-request basket
    FileUploadModal.vue      # CSV/XLSX bulk uploader
    DetailDrawer.vue         # full row-detail panel
    ConfirmDialog.vue        # reusable confirm dialog
    SecurityTypeahead.vue    # security free-text lookup
    ImpersonationBar.vue     # "viewing as" banner
    StatusBadge.vue          # AG Grid status cell renderer
    StatusIcon.vue           # shape-per-status icon (WCAG)
    AnimatedNumber.vue       # count-up tween for stat numbers
    Donut.vue / Sparkline.vue# dependency-free SVG charts

  composables/
    useRequests.js           # central locate-records store (singleton)
    useSessionStore.js       # sessionStorage-backed reactive ref
    useFileImport.js         # CSV/XLSX parse + header-mapping + validation
    useTheme.js              # light/dark theme (persisted)
    useDensity.js            # row-density preference
    useWatchlist.js          # starred-tickers watchlist
    useModal.js              # dialog a11y (escape, focus trap, scroll lock)

  data/                      # seeded mock data
    users.js                 # admin + client users (impersonation, firm scoping)
    locates.js               # seed locate records
    securities.js            # security master (typeahead + lookup)
    standingLists.js         # seed baskets + schedule math
    availabilitySnapshot.js  # generated inventory + borrow-rate trend series

  utils/
    csv.js                   # CSV export (formula-injection safe)
    datetime.js              # timestamp formatting
```

---

_Mock scope:_ persistence, scheduling, availability and the live data feed are
front-end mocks pending the future webservice — the UI is wired so the mock data
swaps out for real services without a redesign.
