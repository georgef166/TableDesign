<script setup>
import { ref, computed } from 'vue'

// Interactive trend drawer for a security's borrow rate / availability over the
// last 24h. Dependency-free SVG with a hover crosshair + tooltip — the "click a
// row to see the chart" interaction, Google-Finance style. (Swap in
// Lightweight-Charts here later for candles/zoom; the data shape is ready.)
const props = defineProps({
  row: { type: Object, required: true },
  asOf: { type: String, default: '' }
})
const emit = defineEmits(['close', 'locate'])

const mode = ref('rate')   // 'rate' | 'qty'
const series = computed(() => mode.value === 'rate' ? props.row.rateTrend : props.row.qtyTrend)

// --- chart geometry (viewBox units) ---
const W = 560, H = 200, PAD_L = 6, PAD_R = 6, PAD_T = 14, PAD_B = 16
const geom = computed(() => {
  const d = series.value || []
  if (d.length < 2) return null
  const min = Math.min(...d), max = Math.max(...d), span = (max - min) || 1
  const innerW = W - PAD_L - PAD_R, innerH = H - PAD_T - PAD_B
  const x = (i) => PAD_L + (i / (d.length - 1)) * innerW
  const y = (v) => PAD_T + innerH - ((v - min) / span) * innerH
  const pts = d.map((v, i) => ({ x: x(i), y: y(v), v }))
  const line = 'M' + pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${H - PAD_B} L${PAD_L},${H - PAD_B} Z`
  return { pts, line, area, min, max, baseY: H - PAD_B }
})

// --- hover ---
const hover = ref(null)   // index
function onMove(e) {
  const d = series.value
  if (!d || d.length < 2) return
  const rect = e.currentTarget.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  hover.value = Math.round(ratio * (d.length - 1))
}
function onLeave() { hover.value = null }

const hoverPt = computed(() => (hover.value != null && geom.value) ? geom.value.pts[hover.value] : null)
const hoverLabel = computed(() => {
  if (hover.value == null) return ''
  const back = (series.value.length - 1) - hover.value
  return back === 0 ? 'now' : `${back}h ago`
})

const current = computed(() => mode.value === 'rate' ? props.row.rate : props.row.availableQty)
const startVal = computed(() => series.value?.[0] ?? current.value)
const delta = computed(() => current.value - startVal.value)
const deltaPct = computed(() => startVal.value ? (delta.value / startVal.value) * 100 : 0)
const up = computed(() => delta.value >= 0)

// Directional colour (green if the series rose over the window, red if it fell) —
// matches the ▲/▼ headline. Brand red would otherwise make every chart red.
const color = computed(() => up.value ? 'var(--ok)' : 'var(--bad)')

function fmt(v) {
  return mode.value === 'rate' ? v.toFixed(2) + '%' : Math.round(v).toLocaleString()
}
function tooltipLeftPct(px) { return (px / W) * 100 }
</script>

<template>
  <div class="scrim" @click.self="emit('close')">
    <aside class="drawer" role="dialog" aria-modal="true" :aria-label="`${row.ticker} trend`">
      <header class="d-head">
        <div class="d-head-main">
          <span class="d-ticker">{{ row.ticker }}</span>
          <span class="d-country">{{ row.country }}</span>
        </div>
        <button class="icon-btn" @click="emit('close')" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </header>
      <p class="d-sec">{{ row.security }} · SEDOL {{ row.sedol || '—' }}</p>

      <div class="d-body">
        <!-- Metric toggle -->
        <div class="seg">
          <button :class="{ on: mode === 'rate' }" @click="mode = 'rate'">Borrow rate</button>
          <button :class="{ on: mode === 'qty' }" @click="mode = 'qty'">Availability</button>
        </div>

        <!-- Headline value + change -->
        <div class="headline">
          <span class="hl-val">{{ fmt(current) }}</span>
          <span class="hl-chg" :class="up ? 'up' : 'down'">
            {{ up ? '▲' : '▼' }} {{ fmt(Math.abs(delta)) }} ({{ deltaPct >= 0 ? '+' : '' }}{{ deltaPct.toFixed(1) }}%)
          </span>
          <span class="hl-span">last 24h</span>
        </div>

        <!-- Interactive chart -->
        <div class="chart-wrap">
          <svg v-if="geom" :viewBox="`0 0 ${W} ${H}`" class="chart" preserveAspectRatio="none"
               @mousemove="onMove" @mouseleave="onLeave">
            <defs>
              <linearGradient id="trendfill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" :stop-color="color" stop-opacity="0.20" />
                <stop offset="100%" :stop-color="color" stop-opacity="0" />
              </linearGradient>
            </defs>
            <path :d="geom.area" fill="url(#trendfill)" stroke="none" />
            <path :d="geom.line" fill="none" :stroke="color" stroke-width="2"
                  stroke-linejoin="round" stroke-linecap="round" />
            <!-- crosshair -->
            <g v-if="hoverPt">
              <line :x1="hoverPt.x" :y1="PAD_T - 6" :x2="hoverPt.x" :y2="geom.baseY"
                    stroke="var(--text-mute)" stroke-width="1" stroke-dasharray="3 3" />
              <circle :cx="hoverPt.x" :cy="hoverPt.y" r="4" :fill="color" stroke="#fff" stroke-width="1.5" />
            </g>
          </svg>
          <!-- tooltip -->
          <div v-if="hoverPt" class="tip" :style="{ left: tooltipLeftPct(hoverPt.x) + '%' }">
            <b>{{ fmt(hoverPt.v) }}</b><span>{{ hoverLabel }}</span>
          </div>
        </div>

        <p class="rangecap">
          Range {{ fmt(geom?.min ?? 0) }} – {{ fmt(geom?.max ?? 0) }} · as of {{ asOf }}
        </p>

        <button class="btn primary locate" @click="emit('locate')">
          Locate {{ row.ticker }}
        </button>
        <p class="mocknote">Sample trend — the live history wires in with the future webservice.</p>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.scrim { position: fixed; inset: 0; z-index: 55; background: rgba(15, 23, 42, .35); display: flex; justify-content: flex-end; }
.drawer { width: 440px; max-width: 94vw; height: 100%; background: var(--surface); border-left: 1px solid var(--border); box-shadow: var(--shadow); display: flex; flex-direction: column; overflow: hidden; }
.d-head { display: flex; justify-content: space-between; align-items: center; padding: 20px 22px 8px; }
.d-head-main { display: flex; align-items: baseline; gap: 10px; }
.d-ticker { font-size: 19px; font-weight: 700; }
.d-country { font-size: 12.5px; color: var(--text-soft); }
.icon-btn { border: none; background: var(--surface-2); color: var(--text-soft); width: 30px; height: 30px; border-radius: var(--radius-sm); display: grid; place-items: center; }
.icon-btn svg { width: 14px; height: 14px; }
.icon-btn:hover { background: var(--border); color: var(--text); }
.d-sec { margin: 0; padding: 0 22px 16px; color: var(--text-soft); font-size: 13px; border-bottom: 1px solid var(--border); }
.d-body { padding: 16px 22px 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }

.seg { display: inline-flex; background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 2px; align-self: flex-start; }
.seg button { border: none; background: transparent; color: var(--text-soft); font-size: 12.5px; font-weight: 600; padding: 6px 12px; border-radius: 2px; cursor: pointer; }
.seg button.on { background: var(--surface); color: var(--brand-700); box-shadow: var(--shadow); }

.headline { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.hl-val { font-size: 28px; font-weight: 700; letter-spacing: -.02em; }
.hl-chg { font-size: 13px; font-weight: 700; }
.hl-chg.up { color: var(--ok); }
.hl-chg.down { color: var(--bad); }
.hl-span { font-size: 12px; color: var(--text-mute); }

.chart-wrap { position: relative; }
.chart { width: 100%; height: 200px; display: block; overflow: visible; }
.tip { position: absolute; top: -2px; transform: translateX(-50%); background: var(--text); color: #fff; border-radius: var(--radius-sm); padding: 4px 8px; font-size: 11.5px; white-space: nowrap; pointer-events: none; display: flex; gap: 6px; align-items: baseline; }
.tip b { font-weight: 700; }
.tip span { opacity: .7; }

.rangecap { margin: 0; font-size: 11.5px; color: var(--text-mute); }
.btn { border: 1px solid transparent; border-radius: var(--radius-sm); padding: 10px 16px; font-size: 13px; font-weight: 600; }
.btn.primary { background: var(--brand-500); color: #fff; }
.btn.primary:hover { background: var(--brand-700); }
.locate { margin-top: 4px; }
.mocknote { margin: 0; font-size: 11px; color: var(--text-mute); }
</style>
