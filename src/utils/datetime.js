// Shared timestamp helpers. Consolidates three previously-duplicated inline
// `stamp()` copies (App.vue, StandingLists.vue, standingLists.js). The mock data
// uses two display formats: with seconds (locate `requestDate`) and without
// (schedule run times), so we expose both.

const pad = (n) => String(n).padStart(2, '0')

// `YYYY-MM-DD HH:MM:SS` — matches seedLocates.requestDate exactly.
export function stamp(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// `YYYY-MM-DD HH:MM` — used for schedule next/last-run display.
export function stampShort(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
