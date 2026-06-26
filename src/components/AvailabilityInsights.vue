<script setup>
import { computed } from 'vue'
import Donut from './Donut.vue'

// Market-overview strip for the Availability snapshot: general-collateral vs
// hard-to-borrow mix, a borrow-rate distribution, and the hardest-to-borrow names.
// Dependency-free SVG + theme tokens (dark-mode aware).
const props = defineProps({
  rows: { type: Array, default: () => [] }
})

const HTB = 10  // rate% at/above which a name is "hard to borrow"

const gcVsHtb = computed(() => {
  let gc = 0, htb = 0
  for (const r of props.rows) (r.rate >= HTB ? htb++ : gc++)
  return { gc, htb }
})
const htbPct = computed(() =>
  props.rows.length ? Math.round((gcVsHtb.value.htb / props.rows.length) * 100) : 0)
const statusSegments = computed(() => [
  { label: 'General collateral', value: gcVsHtb.value.gc, color: 'var(--ok)' },
  { label: 'Hard to borrow', value: gcVsHtb.value.htb, color: 'var(--bad)' }
])

const avgRate = computed(() => {
  if (!props.rows.length) return 0
  return props.rows.reduce((a, r) => a + r.rate, 0) / props.rows.length
})

// Rate distribution buckets.
const buckets = computed(() => {
  const defs = [
    { label: '<2%',   test: r => r < 2,            color: 'var(--ok)' },
    { label: '2–5%',  test: r => r >= 2 && r < 5,  color: 'var(--brand-500)' },
    { label: '5–10%', test: r => r >= 5 && r < 10, color: 'var(--warn)' },
    { label: '≥10%',  test: r => r >= 10,          color: 'var(--bad)' }
  ]
  const counts = defs.map(d => ({ ...d, n: props.rows.filter(r => d.test(r.rate)).length }))
  const max = Math.max(1, ...counts.map(c => c.n))
  return counts.map(c => ({ ...c, pct: Math.round((c.n / max) * 100) }))
})

// Hardest to borrow (highest rate), top 5.
const topHtb = computed(() => {
  const sorted = [...props.rows].sort((a, b) => b.rate - a.rate).slice(0, 5)
  const max = sorted.length ? sorted[0].rate : 1
  return sorted.map(r => ({ ticker: r.ticker, rate: r.rate, pct: Math.round((r.rate / max) * 100) }))
})
</script>

<template>
  <div class="insights">
    <!-- GC vs HTB -->
    <div class="ins-card">
      <div class="ins-title">Borrow difficulty</div>
      <div class="ins-donut">
        <Donut :segments="statusSegments" :size="120" :thickness="15">
          <span class="d-num">{{ htbPct }}%</span>
          <span class="d-cap">hard to borrow</span>
        </Donut>
        <ul class="legend">
          <li v-for="s in statusSegments" :key="s.label">
            <span class="dot" :style="{ background: s.color }"></span>
            {{ s.label }} <b>{{ s.value }}</b>
          </li>
          <li class="avg">Avg rate <b>{{ avgRate.toFixed(2) }}%</b></li>
        </ul>
      </div>
    </div>

    <!-- Rate distribution -->
    <div class="ins-card">
      <div class="ins-title">Rate distribution</div>
      <div class="cols">
        <div v-for="b in buckets" :key="b.label" class="col">
          <span class="col-n">{{ b.n }}</span>
          <div class="col-track">
            <div class="col-fill" :style="{ height: b.pct + '%', background: b.color }"></div>
          </div>
          <span class="col-lbl">{{ b.label }}</span>
        </div>
      </div>
    </div>

    <!-- Hardest to borrow -->
    <div class="ins-card">
      <div class="ins-title">Hardest to borrow</div>
      <ul class="bars">
        <li v-for="t in topHtb" :key="t.ticker">
          <span class="bar-tkr">{{ t.ticker }}</span>
          <span class="bar-track"><span class="bar-fill" :style="{ width: t.pct + '%' }"></span></span>
          <span class="bar-n">{{ t.rate.toFixed(1) }}%</span>
        </li>
        <li v-if="!topHtb.length" class="ins-empty">No inventory.</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.insights { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 18px; }
.ins-card {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  box-shadow: var(--shadow); padding: 14px 16px; min-height: 150px;
}
.ins-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--text-mute); margin-bottom: 12px; }

.ins-donut { display: flex; align-items: center; gap: 16px; }
.d-num { font-size: 22px; font-weight: 700; letter-spacing: -.02em; color: var(--text); }
.d-cap { font-size: 10.5px; color: var(--text-mute); }
.legend { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 7px; }
.legend li { font-size: 12.5px; color: var(--text-soft); display: flex; align-items: center; gap: 7px; }
.legend b { color: var(--text); margin-left: auto; font-variant-numeric: tabular-nums; }
.legend .avg { color: var(--text-mute); margin-top: 2px; }
.dot { width: 9px; height: 9px; border-radius: 2px; flex: none; }

.cols { display: flex; align-items: flex-end; justify-content: space-around; gap: 10px; height: 104px; }
.col { display: flex; flex-direction: column; align-items: center; gap: 5px; height: 100%; justify-content: flex-end; }
.col-n { font-size: 12px; font-weight: 700; color: var(--text); font-variant-numeric: tabular-nums; }
.col-track { width: 26px; flex: 1; display: flex; align-items: flex-end; }
.col-fill { width: 100%; border-radius: 3px 3px 0 0; min-height: 3px; transition: height .5s ease; }
.col-lbl { font-size: 10.5px; color: var(--text-mute); white-space: nowrap; }

.bars { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 9px; }
.bars li { display: grid; grid-template-columns: 48px 1fr 40px; align-items: center; gap: 8px; font-size: 12.5px; }
.bar-tkr { font-weight: 700; }
.bar-track { height: 8px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 99px; overflow: hidden; }
.bar-fill { display: block; height: 100%; background: var(--bad); border-radius: 99px; transition: width .5s ease; }
.bar-n { text-align: right; color: var(--text-soft); font-variant-numeric: tabular-nums; }
.ins-empty { font-size: 12px; color: var(--text-mute); }

@media (max-width: 980px) { .insights { grid-template-columns: 1fr; } }
</style>
