<script setup>
import { ref, computed } from 'vue'
import Donut from './Donut.vue'

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

// Requests per day (chronological), capped to the most recent days so the bars
// stay readable. Each bar is labelled with its date + count and highlights on hover.
const MAX_DAYS = 14
const volume = computed(() => {
  const byDay = new Map()
  for (const r of props.rows) {
    const day = (r.requestDate || '').slice(0, 10)
    if (day) byDay.set(day, (byDay.get(day) || 0) + 1)
  }
  const days = [...byDay.keys()].sort().slice(-MAX_DAYS)
  const series = days.map(d => byDay.get(d))
  return { days, series, max: series.length ? Math.max(...series) : 0 }
})
// Total over the shown window, so the headline number matches the bars.
const volTotal = computed(() => volume.value.series.reduce((a, b) => a + b, 0))

const volHover = ref(null)   // index of the hovered day, or null
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
// '2026-06-26' → 'Jun 26' (parse the string parts; avoids Date/timezone shifts).
function shortDay(d) {
  return `${MONTHS[Number(d.slice(5, 7)) - 1] || ''} ${Number(d.slice(8, 10))}`
}
// Bar height as a % of the tallest day; floor so a 1-count day is still a visible nub.
function barH(i) {
  return Math.max(6, Math.round((volume.value.series[i] / (volume.value.max || 1)) * 100)) + '%'
}

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

    <!-- Requests per day -->
    <div class="ins-card">
      <div class="ins-title">Requests per day</div>
      <div class="ins-vol">
        <span class="vol-num">{{ volTotal }}</span>
        <span class="vol-cap">requests · last {{ volume.days.length }} day{{ volume.days.length === 1 ? '' : 's' }}</span>
      </div>
      <div v-if="volume.days.length" class="vbars"
           role="img" :aria-label="`Requests per day over the last ${volume.days.length} days`">
        <div v-for="(d, i) in volume.days" :key="d" class="vbar-col"
             @mouseenter="volHover = i" @mouseleave="volHover = null"
             :title="`${shortDay(d)} — ${volume.series[i]} request${volume.series[i] === 1 ? '' : 's'}`">
          <span class="vbar-val" :class="{ hot: volHover === i }">{{ volume.series[i] }}</span>
          <div class="vbar-track"><div class="vbar-fill" :class="{ hot: volHover === i }" :style="{ height: barH(i) }"></div></div>
          <span class="vbar-lbl" :class="{ hot: volHover === i }">{{ shortDay(d) }}</span>
        </div>
      </div>
      <div v-else class="ins-empty">No requests yet.</div>
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

.ins-vol { display: flex; align-items: baseline; gap: 8px; margin-bottom: 10px; }
.vol-num { font-size: 24px; font-weight: 700; letter-spacing: -.02em; }
.vol-cap { font-size: 12px; color: var(--text-mute); }

/* Interactive per-day bars: count on top, date below, highlight on hover. */
.vbars { display: flex; align-items: flex-end; gap: 6px; height: 96px; }
.vbar-col { flex: 1 1 0; min-width: 0; height: 100%; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: default; }
.vbar-val { font-size: 11px; font-weight: 700; color: var(--text-soft); font-variant-numeric: tabular-nums; transition: color .12s; }
.vbar-track { flex: 1; width: 100%; display: flex; align-items: flex-end; }
.vbar-fill { width: 100%; min-height: 3px; background: var(--brand-400); border-radius: 3px 3px 0 0; transition: height .4s ease, background .12s; }
.vbar-lbl { font-size: 10px; color: var(--text-mute); white-space: nowrap; transition: color .12s; }
.vbar-val.hot { color: var(--brand-700); }
.vbar-fill.hot { background: var(--brand-500); }
.vbar-lbl.hot { color: var(--text); font-weight: 600; }

.bars { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 9px; }
.bars li { display: grid; grid-template-columns: 52px 1fr 26px; align-items: center; gap: 8px; font-size: 12.5px; }
.bar-tkr { font-weight: 700; }
.bar-track { height: 8px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 99px; overflow: hidden; }
.bar-fill { display: block; height: 100%; background: var(--brand-500); border-radius: 99px; transition: width .5s ease; }
.bar-n { text-align: right; color: var(--text-soft); font-variant-numeric: tabular-nums; }

.ins-empty { font-size: 12px; color: var(--text-mute); }

@media (max-width: 980px) { .insights { grid-template-columns: 1fr; } }
</style>
