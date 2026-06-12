<script setup>
import { reactive, ref, computed } from 'vue'
import { FREQUENCIES, nextRun, scheduleSummary } from '../data/standingLists.js'
import SecurityTypeahead from './SecurityTypeahead.vue'

// Create or edit a standing list: a named, reusable basket of securities plus a
// schedule (the FY26 "create & save a standing list & schedule it" ask).
const props = defineProps({ list: { type: Object, default: null } })
const emit = defineEmits(['close', 'save'])

const form = reactive(props.list
  ? JSON.parse(JSON.stringify(props.list))
  : { id: null, name: '', owner: 'gf', enabled: true, schedule: { frequency: 'WEEKDAYS', time: '08:00' }, lastRun: null, items: [] })

const errors = ref({})

function addSecurity(sec) {
  if (form.items.some(i => i.ticker === sec.ticker)) return
  form.items.push({
    ticker: sec.ticker, security: sec.name || '', isin: sec.isin || '',
    locateBy: 'SHARES', qtyRequested: null, marketValue: null
  })
}
function removeItem(idx) { form.items.splice(idx, 1) }

const preview = computed(() => nextRun(form.schedule))
const summary = computed(() => scheduleSummary(form.schedule))

function validate() {
  const e = {}
  if (!form.name.trim()) e.name = 'Name your list'
  if (!form.items.length) e.items = 'Add at least one security'
  errors.value = e
  return Object.keys(e).length === 0
}

function save() {
  if (!validate()) return
  emit('save', JSON.parse(JSON.stringify(form)))
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal" role="dialog" aria-modal="true">
      <header class="modal-head">
        <div>
          <h2>{{ form.id ? 'Edit Standing List' : 'New Standing List' }}</h2>
          <p>Save a reusable basket and schedule it to run automatically.</p>
        </div>
        <button class="icon-btn" @click="emit('close')" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </header>

      <div class="modal-body">
        <div class="field">
          <label>List name <span class="req">*</span></label>
          <input v-model="form.name" placeholder="e.g. Morning Tech Basket" :class="{ invalid: errors.name }" />
          <small v-if="errors.name" class="err">{{ errors.name }}</small>
        </div>

        <div class="grid-2">
          <div class="field">
            <label>Frequency</label>
            <select v-model="form.schedule.frequency">
              <option v-for="f in FREQUENCIES" :key="f.value" :value="f.value">{{ f.label }}</option>
            </select>
          </div>
          <div class="field">
            <label>Time</label>
            <input v-model="form.schedule.time" type="time" />
          </div>
        </div>
        <p class="sched-note">
          Runs <b>{{ summary }}</b> · Next run <b>{{ preview || '—' }}</b>
          <span class="mock-tag">mock schedule</span>
        </p>

        <div class="field">
          <label>Add securities <span class="req">*</span></label>
          <SecurityTypeahead placeholder="Search to add a security…" @select="addSecurity" />
          <small v-if="errors.items" class="err">{{ errors.items }}</small>
        </div>

        <div v-if="form.items.length" class="items">
          <div v-for="(it, idx) in form.items" :key="it.ticker" class="item">
            <span class="it-tkr">{{ it.ticker }}</span>
            <span class="it-name">{{ it.security }}</span>
            <select v-model="it.locateBy" class="it-by">
              <option value="SHARES">Shares</option>
              <option value="MARKET_VALUE">Mkt value</option>
            </select>
            <input v-if="it.locateBy === 'SHARES'" v-model.number="it.qtyRequested" type="number" min="1" placeholder="Qty" class="it-qty" />
            <input v-else v-model.number="it.marketValue" type="number" min="1" step="1000" placeholder="$ value" class="it-qty" />
            <button class="it-del" @click="removeItem(idx)" aria-label="Remove">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
        </div>
      </div>

      <footer class="modal-foot">
        <button class="btn ghost" @click="emit('close')">Cancel</button>
        <button class="btn primary" @click="save">{{ form.id ? 'Save changes' : 'Create list' }}</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, .45); display: grid; place-items: center; padding: 24px; z-index: 50; }
.modal { width: 100%; max-width: 620px; background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow-lg); display: flex; flex-direction: column; max-height: 90vh; }
.modal-head { display: flex; justify-content: space-between; align-items: flex-start; padding: 22px 24px 16px; border-bottom: 1px solid var(--border); }
.modal-head h2 { margin: 0; font-size: 17px; }
.modal-head p { margin: 4px 0 0; font-size: 13px; color: var(--text-soft); }
.icon-btn { border: none; background: var(--surface-2); color: var(--text-soft); width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center; }
.icon-btn svg { width: 14px; height: 14px; }
.icon-btn:hover { background: var(--border); color: var(--text); }

.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 12px; font-weight: 600; color: var(--text-soft); }
.req { color: var(--bad); }
.field input, .field select {
  font-family: inherit; font-size: 14px; padding: 10px 12px;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--surface-2); color: var(--text); outline: none; transition: border-color .12s, background .12s;
}
.field input:focus, .field select:focus { border-color: var(--brand-500); background: var(--surface); }
.field input.invalid { border-color: var(--bad); }
.err { color: var(--bad); font-size: 11px; }

.sched-note { margin: -6px 0 0; font-size: 12.5px; color: var(--text-soft); }
.sched-note b { color: var(--text); }
.mock-tag {
  margin-left: 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
  color: var(--warn); background: var(--warn-bg); border-radius: 99px; padding: 2px 8px;
}

.items { display: flex; flex-direction: column; gap: 8px; }
.item {
  display: grid; grid-template-columns: 54px 1fr 110px 110px 30px; align-items: center; gap: 10px;
  padding: 8px 10px; background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-sm);
}
.it-tkr { font-weight: 700; font-size: 13px; }
.it-name { font-size: 12px; color: var(--text-soft); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.it-by, .it-qty { font-family: inherit; font-size: 12.5px; padding: 6px 8px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); }
.it-del { border: none; background: transparent; color: var(--text-mute); width: 26px; height: 26px; border-radius: 6px; display: grid; place-items: center; }
.it-del:hover { background: var(--bad-bg); color: var(--bad); }
.it-del svg { width: 13px; height: 13px; }

.modal-foot { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid var(--border); background: var(--surface-2); }
.btn { border: 1px solid transparent; border-radius: var(--radius-sm); padding: 9px 18px; font-size: 13px; font-weight: 600; transition: background .12s, border-color .12s; }
.btn.ghost { background: var(--surface); border-color: var(--border); color: var(--text-soft); }
.btn.ghost:hover { background: var(--surface-2); border-color: var(--text-mute); }
.btn.primary { background: var(--brand-500); color: #fff; }
.btn.primary:hover { background: var(--brand-700); }
</style>
