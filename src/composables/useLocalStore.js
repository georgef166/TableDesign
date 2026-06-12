import { ref, watch } from 'vue'

// Tiny localStorage-backed reactive ref. Mirrors the app's existing mock-data
// pattern (plain `ref()`), but persists across reloads — used for standing lists
// and the current/impersonated user so the FE mock behaves end-to-end. If a
// `seed` is provided and nothing is stored yet, the seed is written on first use.
export function useLocalStore(key, fallback, seed = undefined) {
  const initial = read(key, seed !== undefined ? seed : fallback)
  const state = ref(initial)

  // Persist the seed immediately so a fresh load has stable data to show.
  if (seed !== undefined && localStorage.getItem(storageKey(key)) === null) {
    write(key, initial)
  }

  watch(state, (val) => write(key, val), { deep: true })
  return state
}

const PREFIX = 'talp-locate:'
const storageKey = (key) => PREFIX + key

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(storageKey(key))
    if (raw === null) return clone(fallback)
    return JSON.parse(raw)
  } catch {
    return clone(fallback)
  }
}

function write(key, val) {
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(val))
  } catch {
    /* storage full / unavailable — non-fatal for a mock */
  }
}

function clone(v) {
  return v == null ? v : JSON.parse(JSON.stringify(v))
}
