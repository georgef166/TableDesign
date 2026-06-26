<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

// Tweens an integer toward `value` (easeOutCubic) — a small count-up so the stat
// numbers feel alive when filters / impersonation / refresh change the counts.
const props = defineProps({
  value: { type: Number, default: 0 },
  duration: { type: Number, default: 500 }
})

const display = ref(0)
let raf = null

function animate(to) {
  const from = display.value
  if (from === to) { display.value = to; return }
  const start = performance.now()
  cancelAnimationFrame(raf)
  const step = (now) => {
    const t = Math.min(1, (now - start) / props.duration)
    const eased = 1 - Math.pow(1 - t, 3)
    display.value = Math.round(from + (to - from) * eased)
    if (t < 1) raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
}

onMounted(() => animate(props.value))
watch(() => props.value, (v) => animate(v))
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>{{ display.toLocaleString() }}</template>
