<script>
// Module-level counter (shared across instances) for unique gradient ids.
let _spkSeq = 0
</script>

<script setup>
import { computed } from 'vue'

// Tiny dependency-free SVG sparkline — a Google-Finance-style mini trend line for
// in-row use (fast even with hundreds of rows; no charting library / Enterprise
// licence needed). Swap in uPlot / Lightweight-Charts later if richer interaction
// is wanted; this is the lightweight default.
const props = defineProps({
  data: { type: Array, default: () => [] },
  width: { type: Number, default: 92 },
  height: { type: Number, default: 26 },
  color: { type: String, default: 'var(--brand-500)' },
  fill: { type: Boolean, default: true },
  strokeWidth: { type: Number, default: 1.5 }
})

const PAD = 2  // keep the stroke + end dot inside the viewBox

const geom = computed(() => {
  const d = props.data
  if (!d || d.length < 2) return null
  const min = Math.min(...d)
  const max = Math.max(...d)
  const span = max - min || 1
  const w = props.width, h = props.height
  const innerW = w - PAD * 2
  const innerH = h - PAD * 2
  const x = (i) => PAD + (i / (d.length - 1)) * innerW
  // invert y so larger values sit higher
  const y = (v) => PAD + innerH - ((v - min) / span) * innerH
  const pts = d.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`)
  const line = `M${pts.join(' L')}`
  const area = `${line} L${x(d.length - 1).toFixed(1)},${(h - PAD).toFixed(1)} L${PAD},${(h - PAD).toFixed(1)} Z`
  const last = { x: x(d.length - 1), y: y(d[d.length - 1]) }
  const up = d[d.length - 1] >= d[0]
  return { line, area, last, up }
})

// Guaranteed-unique gradient id per instance (so a red HTB sparkline and a brand
// one never share a gradient def).
const gradId = 'spk-' + (++_spkSeq)
</script>

<template>
  <svg v-if="geom" :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`"
       class="spark" preserveAspectRatio="none" role="img" aria-hidden="true">
    <defs>
      <linearGradient :id="gradId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="color" stop-opacity="0.22" />
        <stop offset="100%" :stop-color="color" stop-opacity="0" />
      </linearGradient>
    </defs>
    <path v-if="fill" :d="geom.area" :fill="`url(#${gradId})`" stroke="none" />
    <path :d="geom.line" fill="none" :stroke="color" :stroke-width="strokeWidth"
          stroke-linejoin="round" stroke-linecap="round" />
    <circle :cx="geom.last.x" :cy="geom.last.y" :r="strokeWidth + 0.6" :fill="color" />
  </svg>
  <span v-else class="spark-empty">—</span>
</template>

<style scoped>
.spark { display: block; overflow: visible; }
.spark-empty { color: var(--text-mute); font-size: 12px; }
</style>
