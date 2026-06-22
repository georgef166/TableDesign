<script setup>
import { reactive, ref, computed } from 'vue'
import SecurityTypeahead from './SecurityTypeahead.vue'

// Manual locate entry — a small basket so one or more securities can be submitted
// in a single session (FY26 note #1: "manual adding multiple locates"). Mirrors the
// Schedule List modal: a typeahead adds rows to an editable list, each with its own
// locate-by + quantity. `prefill` (from Availability / Standing Lists) seeds the
// first row.
const props = defineProps({
  prefill: { type: Object, default: null }
})
const emit = defineEmits(['close', 'submit'])

const items = reactive([])
const errors = ref({})
const taRef = ref(null)

// Add a security row (dedupe by ticker). Accepts a typeahead security ({name,price})
// or an Availability prefill ({security, qtyRequested, locateBy}).
function addItem(sec) {
  if (!sec?.ticker || items.some(i => i.ticker === sec.ticker)) return
  items.push({
    ticker: sec.ticker,
    security: sec.name || sec.security || '',
    sedol: sec.sedol || '',
    isin: sec.isin || '',
    cusip: sec.cusip || '',
    ric: sec.ric || '',
    bbgTicker: sec.bbgTicker || (sec.ticker ? `${sec.ticker} US` : ''),
    price: sec.price ?? null,
    locateBy: sec.locateBy || 'SHARES',
    qtyRequested: sec.qtyRequested ?? null,
    marketValue: sec.marketValue ?? null
  })
  errors.value.items = undefined
}

// From the typeahead: add then clear/refocus so the next security can be searched
// immediately (the multi-add reset that StandingListModal also uses).
function onSelect(sec) {
  addItem(sec)
  taRef.value?.reset()
  taRef.value?.focus()
}

function removeItem(idx) { items.splice(idx, 1) }

// Seed from a prefill (e.g. "Locate" from Availability — carries the available qty).
if (props.prefill) addItem(props.prefill)

// Locate-by-market-value: indicative share count from last price.
function estShares(it) {
  if (it.locateBy !== 'MARKET_VALUE' || !it.marketValue || !it.price) return null
  return Math.round(it.marketValue / it.price)
}

function validate() {
  const e = {}
  if (!items.length) { e.items = 'Add at least one security' }
  else if (items.some(it => it.locateBy === 'SHARES'
    ? !(it.qtyRequested > 0)
    : !(it.marketValue > 0))) {
    e.items = 'Every security needs a quantity or market value'
  }
  errors.value = e
  return Object.keys(e).length === 0
}

function submit() {
  if (!validate()) return
  emit('submit', items.map(it => ({
    ticker: it.ticker,
    security: it.security,
    sedol: it.sedol,
    isin: it.isin,
    cusip: it.cusip,
    ric: it.ric,
    bbgTicker: it.bbgTicker,
    locateBy: it.locateBy,
    // For market-value rows, show the estimated shares on the grid (0 if no price).
    qtyRequested: it.locateBy === 'SHARES' ? it.qtyRequested : (estShares(it) || 0),
    marketValue: it.locateBy === 'MARKET_VALUE' ? it.marketValue : null
  })))
}

const count = computed(() => items.length)
function fmtUsd(n) {
  return n != null ? n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) : ''
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal" role="dialog" aria-modal="true">
      <header class="modal-head">
        <div>
          <h2>New Locate Request</h2>
          <p>Add one or more securities, then submit them to the desk for approval.</p>
        </div>
        <button class="icon-btn" @click="emit('close')" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </header>

      <div class="modal-body">
        <div class="field">
          <label>Add securities <span class="req">*</span></label>
          <SecurityTypeahead ref="taRef" :autofocus="!prefill" :invalid="!!errors.items" @select="onSelect" />
          <small v-if="errors.items" class="err">{{ errors.items }}</small>
        </div>

        <div v-if="!items.length" class="empty-hint">
          Search above to add one or more securities to this request.
        </div>

        <div v-else class="items">
          <div v-for="(it, idx) in items" :key="it.ticker" class="item">
            <div class="it-main">
              <div class="it-head">
                <span class="it-tkr">{{ it.ticker }}</span>
                <span class="it-name" :title="it.security">{{ it.security }}</span>
                <button class="it-del" @click="removeItem(idx)" aria-label="Remove security">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                       stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              </div>
              <div class="it-controls">
                <select v-model="it.locateBy" class="it-by" aria-label="Locate by">
                  <option value="SHARES">Shares</option>
                  <option value="MARKET_VALUE">Market value</option>
                </select>
                <input v-if="it.locateBy === 'SHARES'" v-model.number="it.qtyRequested"
                       type="number" min="1" placeholder="Qty" class="it-qty" aria-label="Quantity" />
                <div v-else class="usd-wrap">
                  <span class="usd-prefix">$</span>
                  <input v-model.number="it.marketValue" type="number" min="1" step="1000"
                         placeholder="1,000,000" class="it-qty usd" aria-label="Market value (USD)" />
                </div>
              </div>
              <small v-if="estShares(it)" class="hint">≈ {{ estShares(it).toLocaleString() }} shares at {{ fmtUsd(it.price) }} last</small>
              <small v-else-if="it.locateBy === 'MARKET_VALUE' && it.marketValue && !it.price" class="hint">Estimated shares unavailable — no last price.</small>
            </div>
          </div>
        </div>
      </div>

      <footer class="modal-foot">
        <button class="btn ghost" @click="emit('close')">Cancel</button>
        <button class="btn primary" :disabled="!count" @click="submit">
          Submit {{ count || '' }} locate{{ count === 1 ? '' : 's' }}
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, .45);
  display: grid; place-items: center;
  padding: 24px; z-index: 50;
}
.modal {
  width: 100%; max-width: 560px;
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  display: flex; flex-direction: column; max-height: 88vh;
}
.modal-head {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 22px 24px 16px;
  border-bottom: 1px solid var(--border);
}
.modal-head h2 { margin: 0; font-size: 17px; }
.modal-head p { margin: 4px 0 0; font-size: 13px; color: var(--text-soft); }
.icon-btn {
  border: none; background: var(--surface-2); color: var(--text-soft);
  width: 30px; height: 30px; border-radius: var(--radius-sm);
  display: grid; place-items: center;
}
.icon-btn svg { width: 14px; height: 14px; }
.icon-btn:hover { background: var(--border); color: var(--text); }

.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 12px; font-weight: 600; color: var(--text-soft); }
.req { color: var(--bad); }
.err { color: var(--bad); font-size: 11px; }
.hint { color: var(--text-mute); font-size: 11px; margin-top: 6px; }

.empty-hint {
  padding: 22px; text-align: center; font-size: 12.5px; color: var(--text-mute);
  background: var(--surface-2); border: 1px dashed var(--border); border-radius: var(--radius-sm);
}

/* Added-security rows */
.items { display: flex; flex-direction: column; gap: 10px; }
.item { background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px 14px; }
.it-head { display: flex; align-items: baseline; gap: 10px; }
.it-tkr { font-weight: 700; font-size: 13.5px; }
.it-name { flex: 1; font-size: 12px; color: var(--text-soft); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.it-del { border: none; background: transparent; color: var(--text-mute); width: 26px; height: 26px; border-radius: var(--radius-sm); display: grid; place-items: center; flex: none; }
.it-del:hover { background: var(--bad-bg); color: var(--bad); }
.it-del svg { width: 13px; height: 13px; }
.it-controls { display: flex; gap: 8px; margin-top: 10px; }
.it-by { flex: none; width: 140px; }
.it-qty { flex: 1; width: 100%; }
.it-by, .it-qty {
  font-family: inherit; font-size: 13px; padding: 8px 10px;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--surface); color: var(--text); outline: none; transition: border-color .12s;
}
.it-by:focus, .it-qty:focus { border-color: var(--brand-500); }

.usd-wrap { position: relative; flex: 1; }
.usd-prefix { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--text-mute); font-size: 13px; }
.usd-wrap .usd { padding-left: 22px; }

.modal-foot {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  background: var(--surface-2);
}
.btn {
  border: 1px solid transparent; border-radius: var(--radius-sm);
  padding: 9px 18px; font-size: 13px; font-weight: 600;
  transition: background .12s, border-color .12s;
}
.btn.ghost { background: var(--surface); border-color: var(--border); color: var(--text-soft); }
.btn.ghost:hover { background: var(--surface-2); border-color: var(--text-mute); }
.btn.primary { background: var(--brand-500); color: #fff; }
.btn.primary:hover { background: var(--brand-700); }
.btn.primary:disabled { background: var(--border); color: var(--text-mute); cursor: not-allowed; }
</style>
