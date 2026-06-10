<script setup>
import { computed } from 'vue'

// AG Grid passes a `params` prop to cell renderer components.
const props = defineProps({ params: { type: Object, required: true } })

const status = computed(() => props.params.value)
const cls = computed(() => ({
  APPROVED: 'ok',
  PENDING: 'warn',
  REJECTED: 'bad'
}[status.value] || 'mute'))
</script>

<template>
  <span class="badge" :class="cls">
    <span class="dot"></span>{{ status }}
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px 3px 8px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .03em;
  line-height: 1;
}
.dot { width: 6px; height: 6px; border-radius: 99px; background: currentColor; }
.ok   { color: var(--ok);   background: var(--ok-bg); }
.warn { color: var(--warn); background: var(--warn-bg); }
.bad  { color: var(--bad);  background: var(--bad-bg); }
.mute { color: var(--text-mute); background: var(--surface-2); }
</style>
