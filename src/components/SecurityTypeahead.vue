<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { searchSecurities } from '../data/securities.js'

// Google-Finance-style free-text security lookup. A single fast input that
// searches ticker / name / every identifier and returns a ranked, capped list —
// replacing the slow legacy drop-down and the five separate identifier fields.
// Emits the chosen security object via `select`.
const props = defineProps({
  placeholder: { type: String, default: 'Search ticker, name, ISIN, SEDOL, CUSIP…' },
  autofocus: { type: Boolean, default: false },
  invalid: { type: Boolean, default: false }
})
const emit = defineEmits(['select'])

const query = ref('')
const open = ref(false)
const active = ref(0)
const inputEl = ref(null)
const results = computed(() => searchSecurities(query.value, 8))

watch(query, () => { active.value = 0; open.value = true })

function onInput(e) {
  query.value = e.target.value
}

function choose(sec) {
  if (!sec) return
  emit('select', sec)
  query.value = `${sec.ticker} · ${sec.name}`
  open.value = false
}

function onKeydown(e) {
  if (!open.value && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { open.value = true; return }
  if (e.key === 'ArrowDown') { e.preventDefault(); active.value = Math.min(active.value + 1, results.value.length - 1) }
  else if (e.key === 'ArrowUp') { e.preventDefault(); active.value = Math.max(active.value - 1, 0) }
  else if (e.key === 'Enter') { e.preventDefault(); choose(results.value[active.value]) }
  else if (e.key === 'Escape') { open.value = false }
}

function focus() {
  nextTick(() => inputEl.value?.focus())
}
if (props.autofocus) focus()
defineExpose({ focus })

function fmtPrice(p) {
  return p != null ? p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''
}
</script>

<template>
  <div class="ta" @focusout="open = false" tabindex="-1">
    <span class="ta-ico">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
      </svg>
    </span>
    <input
      ref="inputEl"
      :value="query"
      @input="onInput"
      @keydown="onKeydown"
      @focus="open = true"
      :class="{ invalid }"
      :placeholder="placeholder"
      role="combobox"
      :aria-expanded="open"
      aria-autocomplete="list"
      autocomplete="off"
    />
    <ul v-if="open && results.length" class="ta-menu" role="listbox">
      <li v-for="(s, i) in results" :key="s.ticker"
          role="option" :aria-selected="i === active"
          class="ta-opt" :class="{ active: i === active }"
          @mousedown.prevent="choose(s)" @mousemove="active = i">
        <span class="o-ticker">{{ s.ticker }}</span>
        <span class="o-name">{{ s.name }}</span>
        <span class="o-exch">{{ s.exchange }}</span>
        <span class="o-price">{{ fmtPrice(s.price) }}</span>
      </li>
    </ul>
    <div v-else-if="open && query.trim()" class="ta-empty">No securities match “{{ query }}”.</div>
  </div>
</template>

<style scoped>
.ta { position: relative; }
.ta-ico {
  position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
  color: var(--text-mute); display: grid; place-items: center; pointer-events: none;
}
.ta-ico svg { width: 16px; height: 16px; }
.ta input {
  width: 100%; font-family: inherit; font-size: 14px;
  padding: 10px 12px 10px 34px;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--surface-2); color: var(--text); outline: none;
  transition: border-color .12s, background .12s;
}
.ta input:focus { border-color: var(--brand-500); background: var(--surface); }
.ta input.invalid { border-color: var(--bad); }

.ta-menu {
  position: absolute; left: 0; right: 0; top: calc(100% + 4px); z-index: 30;
  margin: 0; padding: 4px; list-style: none;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-sm); box-shadow: var(--shadow);
  max-height: 320px; overflow-y: auto;
}
.ta-opt {
  display: grid; grid-template-columns: 62px 1fr auto auto; align-items: baseline; gap: 10px;
  padding: 8px 10px; border-radius: 6px; cursor: pointer;
}
.ta-opt.active { background: var(--brand-50); }
.o-ticker { font-weight: 700; font-size: 13px; color: var(--text); }
.o-name { font-size: 12.5px; color: var(--text-soft); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.o-exch { font-size: 11px; color: var(--text-mute); }
.o-price { font-family: var(--mono); font-size: 12px; color: var(--text-soft); }
.ta-empty {
  position: absolute; left: 0; right: 0; top: calc(100% + 4px); z-index: 30;
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm);
  box-shadow: var(--shadow); padding: 12px; font-size: 12.5px; color: var(--text-mute);
}
</style>
