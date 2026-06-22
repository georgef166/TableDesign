import { ref, watch } from 'vue'

// Tiny sessionStorage-backed reactive ref. Mirrors the app's existing mock-data
// pattern (plain `ref()`), but persists for the life of the browser TAB — data
// survives reloads within the same tab and is cleared when the tab/session
// closes. Used for the requests store, standing lists and the current/impersonated
// user so the FE mock behaves end-to-end without leaving stale data behind across
// sessions. If a `seed` is provided and nothing is stored yet, the seed is written
// on first use.
export function useSessionStore(key, fallback, seed = undefined) {
  const initial = read(key, seed !== undefined ? seed : fallback)
  const state = ref(initial)

  // Persist the seed immediately so a fresh load has stable data to show.
  if (seed !== undefined && sessionStorage.getItem(storageKey(key)) === null) {
    write(key, initial)
  }

  watch(state, (val) => write(key, val), { deep: true })
  return state
}

const PREFIX = 'talp-locate:'
const storageKey = (key) => PREFIX + key

function read(key, fallback) {
  try {
    const raw = sessionStorage.getItem(storageKey(key))
    if (raw === null) return clone(fallback)
    return JSON.parse(raw)
  } catch {
    return clone(fallback)
  }
}

function write(key, val) {
  try {
    sessionStorage.setItem(storageKey(key), JSON.stringify(val))
  } catch {
    /* storage full / unavailable — non-fatal for a mock */
  }
}

function clone(v) {
  return v == null ? v : JSON.parse(JSON.stringify(v))
}
