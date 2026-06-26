<script setup>
import { computed } from 'vue'
import Donut from './Donut.vue'
import Sparkline from './Sparkline.vue'

// A compact "desk insights" dashboard over the (already company-scoped) locate
// requests: status mix donut, request volume over time, and top requested names.
// Dependency-free SVG, theme-token colours (adapts to dark mode).
const props = defineProps({
  rows: { type: Array, default: () => [] }
})

const counts = computed(() => {
  const c = { APPROVED: 0, PENDING: 0, REJECTED: 0 }
  for (const r of props.rows) if (c[r.status] != null) c[r.status]++
  return c
})
const total = computed(() => props.rows.length)
const approvalRate = computed(() =>
  total.value ? Math.round((counts.value.APPROVED / total.value) * 100) : 0)

const statusSegments = computed(() => [
  { label: 'Approved', value: counts.value.APPROVED, color: 'var(--ok)' },
  { label: 'Pending',  value: counts.value.PENDING,  color: 'var(--warn)' },
  { label: 'Rejected', value: counts.value.REJECTED, color: 'var(--bad)' }
])

// Request volume per day (ascending), for the trend area.
const volume = computed(() => {
  const byDay = new Map()
  for (const r of props.rows) {
    const day = (r.requestDate || '').slice(0, 10)
    if (day) byDay.set(day, (byDay.get(day) || 0) + 1)
  }
  const days = [...byDay.keys()].sort()
  return { days, series: days.map(d => byDay.get(d)) }
})

// Top requested securities by count.
const topTickers = computed(() => {
  const byTicker = new Map()
  for (const r of props.rows) {
    if (!r.ticker) continue
    byTicker.set(r.ticker, (byTicker.get(r.ticker) || 0) + 1)
  }
  const sorted = [...byTicker.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  const max = sorted.length ? sorted[0][1] : 1
  return sorted.map(([ticker, n]) => ({ ticker, n, pct: Math.round((n / max) * 100) }))
})
</script>

<template>
  <div class="insights">
    <!-- Status mix -->
    <div class="ins-card">
      <div class="ins-title">Status mix</div>
      <div class="ins-donut">
        <Donut :segments="statusSegments" :size="120" :thickness="15">
          <span class="d-num">{{ approvalRate }}%</span>
          <span class="d-cap">approved</span>
        </Donut>
        <ul class="legend">
          <li v-for="s in statusSegments" :key="s.label">
            <span class="dot" :style="{ background: s.color }"></span>
            {{ s.label }} <b>{{ s.value }}</b>
          </li>
        </ul>
      </div>
    </div>

    <!-- Volume over time -->
    <div class="ins-card">
      <div class="ins-title">Request volume</div>
      <div class="ins-vol">
        <span class="vol-num">{{ total }}</span>
        <span class="vol-cap">requests · {{ volume.days.length }} day{{ volume.days.length === 1 ? '' : 's' }}</span>
      </div>
      <Sparkline v-if="volume.series.length > 1" :data="volume.series"
                 :width="240" :height="56" color="var(--brand-500)" :stroke-width="2" />
      <div v-else class="ins-empty">Not enough history to chart.</div>
    </div>

    <!-- Top requested -->
    <div class="ins-card">
      <div class="ins-title">Top requested</div>
      <ul class="bars">
        <li v-for="t in topTickers" :key="t.ticker">
          <span class="bar-tkr">{{ t.ticker }}</span>
          <span class="bar-track"><span class="bar-fill" :style="{ width: t.pct + '%' }"></span></span>
          <span class="bar-n">{{ t.n }}</span>
        </li>
        <li v-if="!topTickers.length" class="ins-empty">No requests yet.</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.insights {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 16px;
}
.ins-card {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  box-shadow: var(--shadow); padding: 14px 16px; min-height: 150px;
}
.ins-title {
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
  color: var(--text-mute); margin-bottom: 12px;
}

.ins-donut { display: flex; align-items: center; gap: 16px; }
.d-num { font-size: 22px; font-weight: 700; letter-spacing: -.02em; color: var(--text); }
.d-cap { font-size: 10.5px; color: var(--text-mute); }
.legend { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 7px; }
.legend li { font-size: 12.5px; color: var(--text-soft); display: flex; align-items: center; gap: 7px; }
.legend b { color: var(--text); margin-left: auto; font-variant-numeric: tabular-nums; }
.dot { width: 9px; height: 9px; border-radius: 2px; flex: none; }

.ins-vol { display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px; }
.vol-num { font-size: 24px; font-weight: 700; letter-spacing: -.02em; }
.vol-cap { font-size: 12px; color: var(--text-mute); }

.bars { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 9px; }
.bars li { display: grid; grid-template-columns: 52px 1fr 26px; align-items: center; gap: 8px; font-size: 12.5px; }
.bar-tkr { font-weight: 700; }
.bar-track { height: 8px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 99px; overflow: hidden; }
.bar-fill { display: block; height: 100%; background: var(--brand-500); border-radius: 99px; transition: width .5s ease; }
.bar-n { text-align: right; color: var(--text-soft); font-variant-numeric: tabular-nums; }

.ins-empty { font-size: 12px; color: var(--text-mute); }

@media (max-width: 980px) { .insights { grid-template-columns: 1fr; } }
</style>
