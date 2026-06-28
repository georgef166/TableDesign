<script setup>
import StatusIcon from './StatusIcon.vue'
import AnimatedNumber from './AnimatedNumber.vue'

// Shared status filter cards — the four-card toggle group (All / Approved /
// Pending / Rejected) used by both Locate Requests and Locate History. Selection
// is shown by icon + colour + border (never colour alone). v-model is the active
// status string; `counts` supplies the per-status totals.
defineProps({
  modelValue: { type: String, default: 'ALL' },
  counts: { type: Object, required: true },   // { ALL, APPROVED, PENDING, REJECTED }
  ariaLabel: { type: String, default: 'Filter by status' }
})
const emit = defineEmits(['update:modelValue'])

const CARDS = [
  { status: 'ALL', cls: '', label: 'All Requests' },
  { status: 'APPROVED', cls: 'ok', label: 'Approved' },
  { status: 'PENDING', cls: 'warn', label: 'Pending' },
  { status: 'REJECTED', cls: 'bad', label: 'Rejected' }
]
</script>

<template>
  <div class="stats" role="group" :aria-label="ariaLabel">
    <button v-for="c in CARDS" :key="c.status" class="stat" :class="[c.cls, { active: modelValue === c.status }]"
            :aria-pressed="modelValue === c.status" @click="emit('update:modelValue', c.status)">
      <span class="stat-top">
        <StatusIcon :status="c.status" :size="17" />
        <span class="stat-num"><AnimatedNumber :value="counts[c.status]" /></span>
      </span>
      <span class="stat-lbl">{{ c.label }}</span>
    </button>
  </div>
</template>

<style scoped>
/* Compact, balanced cluster (capped width so the cards don't stretch edge-to-edge
   and strand the number in empty space). Flex sizing for the History filters-row
   is applied by the parent (see LocateHistory `.hist-stats`); the cap lives here. */
.stats {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px; max-width: 760px;
}
.stat {
  text-align: left; background: var(--surface);
  border: 1px solid var(--border); border-radius: var(--radius);
  padding: 12px 16px; display: flex; align-items: center; gap: 11px;
  transition: border-color .12s; position: relative; overflow: hidden;
}
.stat::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  background: var(--brand-500); opacity: 0; transition: opacity .12s;
}
.stat:hover { border-color: var(--text-mute); }
.stat.active { border-color: var(--brand-500); border-width: 2px; padding: 11px 15px; }
.stat.active::before { opacity: 1; }
.stat .status-ic { color: var(--text-mute); flex: none; }
.stat.ok.active::before, .stat.ok .stat-num, .stat.ok .status-ic { color: var(--ok); }
.stat.warn.active::before, .stat.warn .stat-num, .stat.warn .status-ic { color: var(--warn); }
.stat.bad.active::before, .stat.bad .stat-num, .stat.bad .status-ic { color: var(--bad); }
.stat.ok::before { background: var(--ok); }
.stat.warn::before { background: var(--warn); }
.stat.bad::before { background: var(--bad); }
.stat-top { display: flex; align-items: center; gap: 9px; flex: none; }
.stat-num { font-size: 26px; font-weight: 700; letter-spacing: -.02em; line-height: 1; }
.stat-lbl { font-size: 12px; color: var(--text-soft); font-weight: 600; line-height: 1.2; }

@media (max-width: 760px) {
  .stats { grid-template-columns: repeat(2, 1fr); }
}
</style>
