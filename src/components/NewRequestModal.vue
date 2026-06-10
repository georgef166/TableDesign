<script setup>
import { reactive, ref } from 'vue'
import { TYPES } from '../data/locates.js'

const emit = defineEmits(['close', 'submit'])

const form = reactive({
  type: 'WEBSERVICE',
  ticker: '',
  sedol: '',
  isin: '',
  cusip: '',
  security: '',
  qtyRequested: null
})

const errors = ref({})

function validate() {
  const e = {}
  if (!form.ticker.trim()) e.ticker = 'Required'
  if (!form.security.trim()) e.security = 'Required'
  if (!form.qtyRequested || form.qtyRequested <= 0) e.qtyRequested = 'Enter a quantity'
  errors.value = e
  return Object.keys(e).length === 0
}

function submit() {
  if (!validate()) return
  emit('submit', { ...form })
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

        <div class="grid-2">
          <div class="field">
            <label>Ticker <span class="req">*</span></label>
            <input v-model="form.ticker" placeholder="e.g. TSLA" :class="{ invalid: errors.ticker }" />
            <small v-if="errors.ticker" class="err">{{ errors.ticker }}</small>
          </div>
          <div class="field">
            <label>Qty Requested <span class="req">*</span></label>
            <input v-model.number="form.qtyRequested" type="number" min="1" placeholder="0"
                   :class="{ invalid: errors.qtyRequested }" />
            <small v-if="errors.qtyRequested" class="err">{{ errors.qtyRequested }}</small>
          </div>
        </div>

        <div class="field">
          <label>Security Name <span class="req">*</span></label>
          <input v-model="form.security" placeholder="e.g. TESLA INC AT NASDAQ GS"
                 :class="{ invalid: errors.security }" />
          <small v-if="errors.security" class="err">{{ errors.security }}</small>
        </div>

        <div class="grid-3">
          <div class="field">
            <label>SEDOL</label>
            <input v-model="form.sedol" placeholder="7-char" />
          </div>
          <div class="field">
            <label>ISIN</label>
            <input v-model="form.isin" placeholder="12-char" />
          </div>
          <div class="field">
            <label>CUSIP</label>
            <input v-model="form.cusip" placeholder="9-char" />
          </div>
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
  background: rgba(10, 31, 68, .45);
  backdrop-filter: blur(3px);
  display: grid; place-items: center;
  padding: 24px; z-index: 50;
  animation: fade .15s ease;
}
.modal {
  width: 100%; max-width: 560px;
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  animation: pop .18s cubic-bezier(.2,.9,.3,1.2);
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
.icon-btn:hover { background: var(--border); }

.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }

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
  transition: border-color .12s, box-shadow .12s, background .12s;
}
.field input:focus, .field select:focus {
  border-color: var(--brand-400);
  background: var(--surface);
  box-shadow: 0 0 0 3px var(--brand-50);
}
.field input.invalid { border-color: var(--bad); }
.err { color: var(--bad); font-size: 11px; }

.modal-foot {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  background: var(--surface-2);
}
.btn {
  border: 1px solid transparent; border-radius: var(--radius-sm);
  padding: 9px 18px; font-size: 13px; font-weight: 600;
  transition: transform .08s, filter .12s;
}
.btn:active { transform: translateY(1px); }
.btn.ghost { background: var(--surface); border-color: var(--border); color: var(--text-soft); }
.btn.ghost:hover { background: var(--border-2); }
.btn.primary { background: var(--brand-500); color: #fff; }
.btn.primary:hover { filter: brightness(1.07); }

@keyframes fade { from { opacity: 0 } }
@keyframes pop { from { opacity: 0; transform: translateY(8px) scale(.98) } }
</style>
