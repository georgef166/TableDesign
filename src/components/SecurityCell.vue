<script setup>
import { computed } from 'vue'

// Composite cell: folds Ticker + Security name + primary identifier into one
// column so the five redundant identifier columns can be demoted off-grid.
const props = defineProps({ params: { type: Object, required: true } })

const d = computed(() => props.params.data || {})
const primaryId = computed(() => d.value.isin || d.value.sedol || d.value.cusip || '—')
</script>

<template>
  <div class="sec">
    <div class="sec-top">
      <span class="sec-ticker">{{ d.ticker || '—' }}</span>
      <span v-if="d.bbgTicker && d.bbgTicker !== 'NOTINUSE'" class="sec-bbg">{{ d.bbgTicker }}</span>
    </div>
    <div class="sec-name" :title="d.security">{{ d.security }}</div>
    <div class="sec-id">{{ primaryId }}</div>
  </div>
</template>

<style scoped>
.sec { display: flex; flex-direction: column; gap: 1px; line-height: 1.25; padding: 4px 0; }
.sec-top { display: flex; align-items: baseline; gap: 8px; }
.sec-ticker { font-weight: 700; font-size: 13px; color: var(--text); }
.sec-bbg { font-size: 10.5px; color: var(--text-mute); font-weight: 500; letter-spacing: .02em; }
.sec-name {
  font-size: 12px; color: var(--text-soft);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;
}
.sec-id { font-family: var(--mono); font-size: 11px; color: var(--text-mute); }
</style>
