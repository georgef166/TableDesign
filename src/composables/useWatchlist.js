import { reactive, computed } from 'vue'

// Shared securities watchlist (a set of starred tickers). Module singleton,
// persisted per tab. Traders star the names they care about so they pin to the top
// of Availability and can be filtered to on their own.
const KEY = 'talp-locate:watchlist'

function read() {
  try { return JSON.parse(sessionStorage.getItem(KEY) || '[]') } catch { return [] }
}

const starred = reactive(new Set(read()))

function persist() {
  try { sessionStorage.setItem(KEY, JSON.stringify([...starred])) } catch { /* non-fatal */ }
}

function toggle(ticker) {
  if (!ticker) return
  starred.has(ticker) ? starred.delete(ticker) : starred.add(ticker)
  persist()
}
function isStarred(ticker) { return starred.has(ticker) }
const count = computed(() => starred.size)

// Bulk star/unstar (persist once) — backs the "star everything currently shown"
// header action on Availability.
function starMany(tickers) {
  let changed = false
  for (const t of tickers) if (t && !starred.has(t)) { starred.add(t); changed = true }
  if (changed) persist()
}
function unstarMany(tickers) {
  let changed = false
  for (const t of tickers) if (starred.has(t)) { starred.delete(t); changed = true }
  if (changed) persist()
}

export function useWatchlist() { return { starred, toggle, isStarred, count, starMany, unstarMany } }
