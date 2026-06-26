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

export function useWatchlist() { return { starred, toggle, isStarred, count } }
