<script setup>
import { computed } from 'vue'

// Reusable dependency-free SVG donut/ring. `segments`: [{ value, color, label }].
// Center content is provided via the default slot (e.g. a total + caption).
const props = defineProps({
  segments: { type: Array, default: () => [] },
  size: { type: Number, default: 132 },
  thickness: { type: Number, default: 16 }
})

const total = computed(() => props.segments.reduce((a, s) => a + (s.value || 0), 0))

const arcs = computed(() => {
  const r = (props.size - props.thickness) / 2
  const c = 2 * Math.PI * r
  let offset = 0
  return props.segments
    .filter(s => s.value > 0)
    .map(s => {
      const frac = total.value ? s.value / total.value : 0
      const dash = frac * c
      const arc = { r, c, dash, gap: c - dash, offset: -offset, color: s.color }
      offset += dash
      return arc
    })
})
const cx = computed(() => props.size / 2)
</script>

<template>
  <div class="donut" :style="{ width: size + 'px', height: size + 'px' }">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
      <g :transform="`rotate(-90 ${cx} ${cx})`">
        <!-- track -->
        <circle :cx="cx" :cy="cx" :r="(size - thickness) / 2" fill="none"
                :stroke-width="thickness" stroke="var(--border)" />
        <!-- segments -->
        <circle v-for="(a, i) in arcs" :key="i" :cx="cx" :cy="cx" :r="a.r" fill="none"
                :stroke="a.color" :stroke-width="thickness"
                :stroke-dasharray="`${a.dash} ${a.gap}`" :stroke-dashoffset="a.offset"
                stroke-linecap="butt" class="seg" />
      </g>
    </svg>
    <div class="center"><slot /></div>
  </div>
</template>

<style scoped>
.donut { position: relative; flex: none; }
.center {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; text-align: center; gap: 1px;
}
.seg { transition: stroke-dasharray .5s ease, stroke-dashoffset .5s ease; }
</style>
