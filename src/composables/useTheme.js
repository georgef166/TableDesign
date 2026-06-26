import { ref, computed, watch } from 'vue'

// Shared (module-singleton) theme state. useSessionStore hands out a NEW ref per
// call, so App.vue and the grid components couldn't react to the same toggle —
// this owns one ref everyone imports. Persists per tab + reflects on <html> so the
// dark palette (:root[data-theme="dark"]) and the AG Grid dark theme both engage.
const KEY = 'talp-locate:theme'

function read() {
  try { return sessionStorage.getItem(KEY) || 'light' } catch { return 'light' }
}

const theme = ref(read())

watch(theme, (val) => {
  try { sessionStorage.setItem(KEY, val) } catch { /* storage unavailable — non-fatal */ }
  document.documentElement.setAttribute('data-theme', val)
}, { immediate: true })

const isDark = computed(() => theme.value === 'dark')
function toggle() { theme.value = theme.value === 'dark' ? 'light' : 'dark' }

export function useTheme() { return { theme, isDark, toggle } }
