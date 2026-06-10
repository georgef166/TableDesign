<script setup>
import { computed } from 'vue'
import StatusBadge from './StatusBadge.vue'

// Slide-in panel showing the complete locate record. This is the home for the
// fields demoted off the grid, so nothing is lost to the compact column set.
const props = defineProps({ record: { type: Object, required: true } })
const emit = defineEmits(['close'])

const r = computed(() => props.record)

const identifiers = computed(() => [
  { label: 'Ticker', value: r.value.ticker },
  { label: 'BBG Ticker', value: r.value.bbgTicker },
  { label: 'SEDOL', value: r.value.sedol },
  { label: 'ISIN', value: r.value.isin },
  { label: 'CUSIP', value: r.value.cusip },
  { label: 'RIC', value: r.value.ric }
])

const request = computed(() => [
  { label: 'Request Date', value: r.value.requestDate },
  { label: 'Type', value: r.value.type },
  { label: 'Batch ID', value: r.value.batchId },
  { label: 'Locate ID', value: r.value.locateId }
])
</script>

<template>
  <div class="scrim" @click.self="emit('close')">
    <aside class="drawer" role="dialog" aria-modal="true">
      <header class="d-head">
        <div class="d-head-main">
          <span class="d-ticker">{{ r.ticker }}</span>
          <StatusBadge :params="{ value: r.status }" />
        </div>
        <button class="icon-btn" @click="emit('close')" aria-label="Close">✕</button>
      </header>
      <p class="d-sec">{{ r.security }}</p>

      <div class="d-body">
        <section>
          <h4>Quantities</h4>
          <div class="qty-row">
            <div class="qty">
              <span class="qty-num">{{ r.qtyRequested?.toLocaleString() }}</span>
              <span class="qty-lbl">Requested</span>
            </div>
            <div class="qty">
              <span class="qty-num" :class="r.qtyApproved > 0 ? 'pos' : 'zero'">
                {{ r.qtyApproved?.toLocaleString() }}
              </span>
              <span class="qty-lbl">Approved</span>
            </div>
          </div>
        </section>

        <section>
          <h4>Identifiers</h4>
          <dl class="kv">
            <template v-for="i in identifiers" :key="i.label">
              <dt>{{ i.label }}</dt>
              <dd class="mono">{{ i.value || '—' }}</dd>
            </template>
          </dl>
        </section>

        <section>
          <h4>Request Details</h4>
          <dl class="kv">
            <template v-for="i in request" :key="i.label">
              <dt>{{ i.label }}</dt>
              <dd class="mono">{{ i.value || '—' }}</dd>
            </template>
          </dl>
        </section>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.scrim {
  position: fixed; inset: 0; z-index: 55;
  background: rgba(10, 31, 68, .35);
  backdrop-filter: blur(2px);
  display: flex; justify-content: flex-end;
  animation: fade .15s ease;
}
.drawer {
  width: 400px; max-width: 92vw; height: 100%;
  background: var(--surface);
  box-shadow: var(--shadow-lg);
  display: flex; flex-direction: column;
  animation: slide .22s cubic-bezier(.2,.9,.3,1);
  overflow: hidden;
}
.d-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 22px 8px;
}
.d-head-main { display: flex; align-items: center; gap: 12px; }
.d-ticker { font-size: 19px; font-weight: 700; }
.icon-btn {
  border: none; background: var(--surface-2); color: var(--text-soft);
  width: 30px; height: 30px; border-radius: 8px; font-size: 13px;
}
.icon-btn:hover { background: var(--border); }
.d-sec { margin: 0; padding: 0 22px 16px; color: var(--text-soft); font-size: 13px; border-bottom: 1px solid var(--border); }

.d-body { padding: 8px 22px 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 22px; }
section h4 {
  margin: 18px 0 10px; font-size: 11px; letter-spacing: .06em;
  text-transform: uppercase; color: var(--text-mute);
}

.qty-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.qty {
  background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 14px; text-align: center;
  display: flex; flex-direction: column; gap: 4px;
}
.qty-num { font-size: 22px; font-weight: 700; }
.qty-num.pos { color: var(--ok); }
.qty-num.zero { color: var(--text-mute); }
.qty-lbl { font-size: 11px; color: var(--text-soft); }

.kv { display: grid; grid-template-columns: 110px 1fr; gap: 8px 12px; margin: 0; }
.kv dt { font-size: 12px; color: var(--text-soft); }
.kv dd { margin: 0; font-size: 13px; color: var(--text); }
.kv dd.mono { font-family: var(--mono); font-size: 12px; }

@keyframes fade { from { opacity: 0 } }
@keyframes slide { from { transform: translateX(100%) } }
</style>
