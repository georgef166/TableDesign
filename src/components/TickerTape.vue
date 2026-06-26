<script setup>
import { computed } from 'vue'

// A scrolling ticker-tape of the current snapshot's borrow rates (Bloomberg-style
// flair). Pure CSS marquee — pauses on hover so it's readable, and respects the
// OS "reduce motion" setting. Opt-in (toggled off by default).
const props = defineProps({ rows: { type: Array, default: () => [] } })

const items = computed(() => props.rows.map(r => {
  const t = r.rateTrend
  const up = t && t.length > 1 ? t[t.length - 1] >= t[0] : true
  return { ticker: r.ticker, rate: r.rate, up }
}))
</script>

<template>
  <div class="tape" aria-label="Borrow-rate ticker">
    <div class="track">
      <template v-for="copy in 2">
        <span v-for="(it, i) in items" :key="copy + '-' + i" class="tk" :aria-hidden="copy === 2 ? 'true' : undefined">
          <b>{{ it.ticker }}</b>
          <span class="rt" :class="it.up ? 'up' : 'down'">{{ it.rate.toFixed(2) }}% {{ it.up ? '▲' : '▼' }}</span>
        </span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.tape {
  overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--surface); margin-bottom: 16px;
}
.track { display: inline-flex; white-space: nowrap; animation: tape-scroll 70s linear infinite; }
.tape:hover .track { animation-play-state: paused; }
.tk {
  display: inline-flex; align-items: baseline; gap: 7px; padding: 9px 18px;
  border-right: 1px solid var(--border-2); font-size: 12.5px;
}
.tk b { font-weight: 700; }
.rt { font-family: var(--mono); font-size: 12px; }
.rt.up { color: var(--ok); }
.rt.down { color: var(--bad); }
@keyframes tape-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce) { .track { animation: none; } }
</style>
