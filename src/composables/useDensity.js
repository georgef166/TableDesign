import { ref, computed, watch } from 'vue'

// Shared row-density preference for the grids (Comfortable / Compact). Module
// singleton so both grids share it; persisted per tab. Power users on the desk can
// pack more rows on screen.
const KEY = 'talp-locate:density'

function read() {
  try { return sessionStorage.getItem(KEY) || 'comfortable' } catch { return 'comfortable' }
}

const density = ref(read())
watch(density, (v) => { try { sessionStorage.setItem(KEY, v) } catch { /* non-fatal */ } })

const isCompact = computed(() => density.value === 'compact')
const rowHeight = computed(() => isCompact.value ? 38 : 58)
function toggle() { density.value = isCompact.value ? 'comfortable' : 'compact' }

export function useDensity() { return { density, isCompact, rowHeight, toggle } }
