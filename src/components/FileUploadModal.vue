<script setup>
import { ref, computed } from 'vue'
import { readFileToGrid, gridToRecords, FIELD_LABELS } from '../composables/useFileImport.js'

// Bulk file uploader. Core FY26 requirement: read the columns in ANY order as long
// as the header is present (XLS/XLSX or CSV). The parse + header-mapping pipeline
// lives in useFileImport.js so the Schedule List modal can reuse it. A preview
// step shows the detected mapping + per-row validation before anything is submitted.
const emit = defineEmits(['close', 'submit'])

const dragging = ref(false)
const fileName = ref('')
const parsed = ref(null)   // { headers, mapping, rows }
const parseError = ref('')

const mappedFields = computed(() => parsed.value?.mapping.filter(m => m.field) || [])
const unmappedHeaders = computed(() => parsed.value?.mapping.filter(m => !m.field).map(m => m.header) || [])
const validRows = computed(() => parsed.value?.rows.filter(r => r.errors.length === 0) || [])
const invalidCount = computed(() => (parsed.value?.rows.length || 0) - validRows.value.length)

async function onFile(file) {
  if (!file) return
  fileName.value = file.name
  parseError.value = ''
  try {
    const grid = await readFileToGrid(file)
    const result = gridToRecords(grid)
    if (result.error) { parseError.value = result.error; parsed.value = null; return }
    parsed.value = result
  } catch {
    parseError.value = 'Could not read that file. Please upload a valid XLS or CSV.'
    parsed.value = null
  }
}
function onInputChange(e) { onFile(e.target.files?.[0]) }
function onDrop(e) { dragging.value = false; onFile(e.dataTransfer.files?.[0]) }

function reset() { parsed.value = null; fileName.value = ''; parseError.value = '' }

function submit() {
  if (!validRows.value.length) return
  emit('submit', validRows.value.map(r => ({
    type: 'BULK',
    ticker: r.ticker, security: r.security, sedol: r.sedol, isin: r.isin, cusip: r.cusip,
    ric: r.ric, bbgTicker: r.bbgTicker,
    locateBy: r.locateBy, qtyRequested: r.qtyRequested || 0, marketValue: r.marketValue
  })))
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal" role="dialog" aria-modal="true">
      <header class="modal-head">
        <div>
          <h2>File Upload (1 or more)</h2>
          <p>Drop an XLS or CSV — columns are matched by header name, in any order.</p>
        </div>
        <button class="icon-btn" @click="emit('close')" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </header>

      <div class="modal-body">
        <!-- Dropzone -->
        <div v-if="!parsed" class="dropzone" :class="{ over: dragging }"
             @dragover.prevent="dragging = true" @dragleave="dragging = false" @drop.prevent="onDrop">
          <svg class="dz-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M12 3v13" /><path d="M7 8l5-5 5 5" />
          </svg>
          <p class="dz-main">Drag an XLS or CSV here, or <label class="dz-link">browse<input type="file" accept=".csv,.xls,.xlsx,text/csv" @change="onInputChange" hidden /></label></p>
          <p class="dz-sub">Headers can be in any order. Recognised: Ticker, CUSIP, SEDOL, Quantity (plus ISIN / Market Value).</p>
          <p v-if="parseError" class="dz-err">{{ parseError }}</p>
        </div>

        <!-- Preview -->
        <div v-else class="preview">
          <div class="pv-bar">
            <div class="pv-file">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
              {{ fileName }}
            </div>
            <button class="btn ghost sm" @click="reset">Choose another</button>
          </div>

          <div class="map">
            <span class="map-lbl">Detected columns</span>
            <span v-for="m in mappedFields" :key="m.header" class="map-chip ok">
              {{ m.header }} → <b>{{ FIELD_LABELS[m.field] }}</b>
            </span>
            <span v-for="h in unmappedHeaders" :key="h" class="map-chip skip" :title="'Unrecognised header — ignored'">
              {{ h }} → ignored
            </span>
          </div>

          <div class="counts">
            <span class="cnt ok">{{ validRows.length }} ready</span>
            <span v-if="invalidCount" class="cnt bad">{{ invalidCount }} with errors (skipped)</span>
          </div>

          <div class="tbl-wrap">
            <table class="tbl">
              <thead>
                <tr><th>Line</th><th>Ticker</th><th>CUSIP</th><th>SEDOL</th><th>Qty</th><th>Status</th></tr>
              </thead>
              <tbody>
                <tr v-for="r in parsed.rows" :key="r.line" :class="{ bad: r.errors.length }">
                  <td class="mono">{{ r.line }}</td>
                  <td class="mono">{{ r.ticker || '—' }}</td>
                  <td class="mono">{{ r.cusip || '—' }}</td>
                  <td class="mono">{{ r.sedol || '—' }}</td>
                  <td class="mono">
                    <template v-if="r.locateBy === 'MARKET_VALUE' && r.marketValue">${{ r.marketValue.toLocaleString() }}</template>
                    <template v-else-if="r.qtyRequested">{{ r.qtyRequested.toLocaleString() }}</template>
                    <template v-else>—</template>
                  </td>
                  <td>
                    <span v-if="!r.errors.length" class="rowstat ok">OK</span>
                    <span v-else class="rowstat bad">{{ r.errors.join(', ') }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <footer class="modal-foot">
        <button class="btn ghost" @click="emit('close')">Cancel</button>
        <button class="btn primary" :disabled="!validRows.length" @click="submit">
          Import {{ validRows.length }} locate{{ validRows.length === 1 ? '' : 's' }}
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed; inset: 0; background: rgba(15, 23, 42, .45);
  display: grid; place-items: center; padding: 24px; z-index: 50;
}
.modal {
  width: 100%; max-width: 680px; background: var(--surface);
  border-radius: var(--radius); box-shadow: var(--shadow-lg);
  overflow: hidden; display: flex; flex-direction: column; max-height: 88vh;
}
.modal-head {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 22px 24px 16px; border-bottom: 1px solid var(--border);
}
.modal-head h2 { margin: 0; font-size: 17px; }
.modal-head p { margin: 4px 0 0; font-size: 13px; color: var(--text-soft); }
.icon-btn {
  border: none; background: var(--surface-2); color: var(--text-soft);
  width: 30px; height: 30px; border-radius: var(--radius-sm); display: grid; place-items: center;
}
.icon-btn svg { width: 14px; height: 14px; }
.icon-btn:hover { background: var(--border); color: var(--text); }

.modal-body { padding: 20px 24px; overflow-y: auto; }

/* Dropzone */
.dropzone {
  border: 1.5px dashed var(--border); border-radius: var(--radius);
  padding: 36px 24px; text-align: center; background: var(--surface-2);
  transition: border-color .12s, background .12s;
}
.dropzone.over { border-color: var(--brand-500); background: var(--brand-50); }
.dz-ico { width: 34px; height: 34px; color: var(--text-mute); }
.dz-main { margin: 12px 0 4px; font-size: 14px; color: var(--text); }
.dz-link { color: var(--brand-700); font-weight: 600; cursor: pointer; }
.dz-sub { margin: 0; font-size: 12px; color: var(--text-mute); }
.dz-err { margin: 12px 0 0; font-size: 12.5px; color: var(--bad); font-weight: 600; }

/* Preview */
.pv-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.pv-file { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--text); }
.pv-file svg { width: 16px; height: 16px; color: var(--text-mute); }

.map { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 12px; }
.map-lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--text-mute); }
.map-chip { font-size: 11.5px; padding: 4px 10px; border-radius: 99px; border: 1px solid var(--border); }
.map-chip.ok { background: var(--ok-bg); color: var(--ok); border-color: transparent; }
.map-chip.ok b { color: var(--ok); }
.map-chip.skip { background: var(--surface-2); color: var(--text-mute); }

.counts { display: flex; gap: 10px; margin-bottom: 10px; }
.cnt { font-size: 12px; font-weight: 700; }
.cnt.ok { color: var(--ok); }
.cnt.bad { color: var(--bad); }

.tbl-wrap { border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; }
.tbl { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.tbl th {
  text-align: left; padding: 8px 12px; background: var(--surface-2);
  color: var(--text-soft); font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: .03em;
  border-bottom: 1px solid var(--border);
}
.tbl td { padding: 8px 12px; border-bottom: 1px solid var(--border-2); color: var(--text); }
.tbl tr:last-child td { border-bottom: none; }
.tbl tr.bad td { background: var(--bad-bg); }
.tbl .mono { font-family: var(--mono); font-size: 12px; }
.rowstat.ok { color: var(--ok); font-weight: 700; }
.rowstat.bad { color: var(--bad); font-weight: 600; }

.modal-foot {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 24px; border-top: 1px solid var(--border); background: var(--surface-2);
}
.btn {
  border: 1px solid transparent; border-radius: var(--radius-sm);
  padding: 9px 18px; font-size: 13px; font-weight: 600; transition: background .12s, border-color .12s;
}
.btn.sm { padding: 6px 12px; font-size: 12px; }
.btn.ghost { background: var(--surface); border-color: var(--border); color: var(--text-soft); }
.btn.ghost:hover { background: var(--surface-2); border-color: var(--text-mute); }
.btn.primary { background: var(--brand-500); color: #fff; }
.btn.primary:hover { background: var(--brand-700); }
.btn.primary:disabled { background: var(--border); color: var(--text-mute); cursor: not-allowed; }
</style>
