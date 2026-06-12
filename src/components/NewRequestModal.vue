<script setup>
import { reactive, ref, computed } from 'vue'
import { TYPES } from '../data/locates.js'
import SecurityTypeahead from './SecurityTypeahead.vue'

// `prefill` lets other views (Availability, Standing Lists) open the modal with a
// security already chosen, cutting clicks.
const props = defineProps({
  prefill: { type: Object, default: null }
})
const emit = defineEmits(['close', 'submit'])

const form = reactive({
  type: 'WEBSERVICE',
  ticker: '',
  sedol: '',
  isin: '',
  cusip: '',
  ric: '',
  bbgTicker: '',
  security: '',
  price: null,
  locateBy: 'SHARES',     // SHARES | MARKET_VALUE
  qtyRequested: null,
  marketValue: null
})

const picked = ref(false)
const errors = ref({})

// Seed from a prefill (e.g. "Locate from availability").
if (props.prefill) selectSecurity(props.prefill)

function selectSecurity(sec) {
  form.ticker = sec.ticker
  form.security = sec.name || sec.security || ''
  form.sedol = sec.sedol || ''
  form.isin = sec.isin || ''
  form.cusip = sec.cusip || ''
  form.ric = sec.ric || ''
  form.bbgTicker = sec.bbgTicker || (sec.ticker ? `${sec.ticker} US` : '')
  form.price = sec.price ?? null
  picked.value = true
  errors.value.security = undefined
}

// Locate-by-market-value: derive an indicative share count from last price.
const estShares = computed(() => {
  if (form.locateBy !== 'MARKET_VALUE' || !form.marketValue || !form.price) return null
  return Math.round(form.marketValue / form.price)
})

function validate() {
  const e = {}
  if (!picked.value || !form.ticker) e.security = 'Select a security'
  if (form.locateBy === 'SHARES') {
    if (!form.qtyRequested || form.qtyRequested <= 0) e.qty = 'Enter a share quantity'
  } else {
    if (!form.marketValue || form.marketValue <= 0) e.qty = 'Enter a dollar amount'
  }
  errors.value = e
  return Object.keys(e).length === 0
}

function submit() {
  if (!validate()) return
  // Normalise to a qtyRequested the grid can show: for market-value requests use
  // the estimated shares (or 0 if no price), and carry the dollar amount through.
  const qty = form.locateBy === 'SHARES'
    ? form.qtyRequested
    : (estShares.value || 0)
  emit('submit', {
    type: form.type,
    ticker: form.ticker,
    security: form.security,
    sedol: form.sedol,
    isin: form.isin,
    cusip: form.cusip,
    ric: form.ric,
    bbgTicker: form.bbgTicker,
    locateBy: form.locateBy,
    qtyRequested: qty,
    marketValue: form.locateBy === 'MARKET_VALUE' ? form.marketValue : null
  })
}

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
          <p>Submit a new security locate to the desk for approval.</p>
        </div>
        <button class="icon-btn" @click="emit('close')" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </header>

      <div class="modal-body">
        <div class="field">
          <label>Request Type</label>
          <select v-model="form.type">
            <option v-for="t in TYPES" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>

        <div class="field">
          <label>Security <span class="req">*</span></label>
          <SecurityTypeahead :autofocus="!prefill" :invalid="!!errors.security" @select="selectSecurity" />
          <small v-if="errors.security" class="err">{{ errors.security }}</small>
        </div>

        <!-- Identifiers auto-filled by the lookup (read-only confirmation chips). -->
        <div v-if="picked" class="id-chips">
          <span class="chip"><b>ISIN</b> {{ form.isin || '—' }}</span>
          <span class="chip"><b>SEDOL</b> {{ form.sedol || '—' }}</span>
          <span class="chip"><b>CUSIP</b> {{ form.cusip || '—' }}</span>
          <span v-if="form.price" class="chip"><b>Last</b> {{ fmtUsd(form.price) }}</span>
        </div>

        <div class="field">
          <label>Locate by</label>
          <div class="seg" role="radiogroup" aria-label="Locate by">
            <button type="button" class="seg-btn" :class="{ on: form.locateBy === 'SHARES' }"
                    :aria-pressed="form.locateBy === 'SHARES'" @click="form.locateBy = 'SHARES'">Shares</button>
            <button type="button" class="seg-btn" :class="{ on: form.locateBy === 'MARKET_VALUE' }"
                    :aria-pressed="form.locateBy === 'MARKET_VALUE'" @click="form.locateBy = 'MARKET_VALUE'">Market value</button>
          </div>
        </div>

        <div v-if="form.locateBy === 'SHARES'" class="field">
          <label>Qty Requested <span class="req">*</span></label>
          <input v-model.number="form.qtyRequested" type="number" min="1" placeholder="0"
                 :class="{ invalid: errors.qty }" />
          <small v-if="errors.qty" class="err">{{ errors.qty }}</small>
        </div>

        <div v-else class="field">
          <label>Market Value (USD) <span class="req">*</span></label>
          <div class="usd-wrap">
            <span class="usd-prefix">$</span>
            <input v-model.number="form.marketValue" type="number" min="1" step="1000" placeholder="1,000,000"
                   :class="{ invalid: errors.qty }" />
          </div>
          <small v-if="errors.qty" class="err">{{ errors.qty }}</small>
          <small v-else-if="estShares" class="hint">≈ {{ estShares.toLocaleString() }} shares at {{ fmtUsd(form.price) }} last</small>
          <small v-else-if="form.marketValue && !form.price" class="hint">Estimated shares unavailable — no last price.</small>
        </div>
      </div>

      <footer class="modal-foot">
        <button class="btn ghost" @click="emit('close')">Cancel</button>
        <button class="btn primary" @click="submit">Submit Request</button>
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
  overflow: visible;
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
  width: 30px; height: 30px; border-radius: 8px;
  display: grid; place-items: center;
}
.icon-btn svg { width: 14px; height: 14px; }
.icon-btn:hover { background: var(--border); color: var(--text); }

.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 12px; font-weight: 600; color: var(--text-soft); }
.req { color: var(--bad); }
.field input, .field select {
  font-family: inherit; font-size: 14px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-2);
  color: var(--text);
  outline: none;
  transition: border-color .12s, background .12s;
}
.field input:focus, .field select:focus {
  border-color: var(--brand-500);
  background: var(--surface);
}
.field input.invalid { border-color: var(--bad); }
.err { color: var(--bad); font-size: 11px; }
.hint { color: var(--text-mute); font-size: 11px; }

/* Auto-filled identifier chips */
.id-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: -4px; }
.chip {
  font-size: 11.5px; color: var(--text-soft);
  background: var(--surface-2); border: 1px solid var(--border);
  border-radius: 99px; padding: 4px 10px;
}
.chip b { color: var(--text-mute); font-weight: 700; margin-right: 5px; letter-spacing: .03em; }

/* Segmented toggle */
.seg { display: inline-flex; border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; width: fit-content; }
.seg-btn {
  border: none; background: var(--surface); color: var(--text-soft);
  padding: 9px 18px; font-size: 13px; font-weight: 600;
}
.seg-btn + .seg-btn { border-left: 1px solid var(--border); }
.seg-btn.on { background: var(--brand-500); color: #fff; }

/* USD input */
.usd-wrap { position: relative; }
.usd-prefix { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-mute); font-size: 14px; }
.usd-wrap input { padding-left: 24px; width: 100%; }

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
</style>
