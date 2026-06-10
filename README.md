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
- **New Locate Request** modal with validation.
- Refresh / Clear controls and toast feedback.
- Sorting, resizing, and pagination out of the box.

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
