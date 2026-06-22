<script setup>
import { ref, computed, shallowRef, markRaw } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
import StatusBadge from './StatusBadge.vue'
import SecurityCell from './SecurityCell.vue'
import { useRequests } from '../composables/useRequests.js'
import { downloadCsv } from '../utils/csv.js'
import { stampShort } from '../utils/datetime.js'

// Locate History — a read-only, company-scoped archive of every locate request.
// Same store as the Requests grid (useRequests), but presented as an audit/lookup
// view with search + a date range, scoped to the viewed user's firm (admin sees
// all). Clicking a row opens the shared DetailDrawer (via the `select` event).
const props = defineProps({
  // The impersonated client, or null for the admin (who sees every firm).
  viewedUser: { type: Object, default: null }
})
const emit = defineEmits(['select'])

const { rows, scopeByFirm } = useRequests()

const quickFilter = ref('')
const fromDate = ref('')
const toDate = ref('')
const gridApi = shallowRef(null)

// Company scope first, then the date range (compares the YYYY-MM-DD prefix).
const historyRows = computed(() => {
  let list = scopeByFirm(rows.value, props.viewedUser)
  if (fromDate.value) list = list.filter(r => (r.requestDate || '').slice(0, 10) >= fromDate.value)
  if (toDate.value)   list = list.filter(r => (r.requestDate || '').slice(0, 10) <= toDate.value)
  return list
})

const columnDefs = ref([
  { headerName: 'Request Date', field: 'requestDate', flex: 1.1, minWidth: 160, sort: 'desc' },
  { headerName: 'Status', field: 'status', flex: 0.9, minWidth: 130,
    cellRenderer: markRaw(StatusBadge),
    cellRendererParams: (p) => ({ params: p }),
    cellClassRules: {
      'status-ok': p => p.value === 'APPROVED',
      'status-warn': p => p.value === 'PENDING',
      'status-bad': p => p.value === 'REJECTED'
    } },
  { headerName: 'Security', field: 'security', flex: 1.8, minWidth: 220,
    cellRenderer: markRaw(SecurityCell),
    cellRendererParams: (p) => ({ params: p }),
    getQuickFilterText: (p) =>
      [p.data.ticker, p.data.bbgTicker, p.data.security, p.data.sedol, p.data.isin, p.data.cusip, p.data.ric].join(' ') },
  { headerName: 'Qty Req', field: 'qtyRequested', flex: 0.7, minWidth: 90, cellClass: 'mono-cell num-cell' },
  { headerName: 'Qty Appr', field: 'qtyApproved', flex: 0.7, minWidth: 90,
    cellClass: (p) => p.value > 0 ? 'mono-cell num-cell appr-pos' : 'mono-cell num-cell appr-zero' }
])

const defaultColDef = { sortable: true, resizable: true, filter: true }

function onGridReady(params) { gridApi.value = params.api }
function onQuickFilter(e) {
  quickFilter.value = e.target.value
  gridApi.value?.setGridOption('quickFilterText', e.target.value)
}
function onRowClicked(e) { emit('select', e.data) }
function onCellKeyDown(e) {
  if (e.event?.key === 'Enter' || e.event?.key === ' ') {
    e.event.preventDefault()
    emit('select', e.data)
  }
}
function clearDates() { fromDate.value = ''; toDate.value = '' }

// Export the current (company-scoped + date-filtered) view to CSV.
function download() {
  const tag = (props.viewedUser?.firm || 'all-firms').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const day = stampShort().slice(0, 10)
  downloadCsv(`locate-history_${tag}_${day}.csv`, historyRows.value, [
    { key: 'requestDate', header: 'Request Date' },
    { key: 'status', header: 'Status' },
    { key: 'ticker', header: 'Ticker' },
    { key: 'sedol', header: 'SEDOL' },
    { key: 'security', header: 'Security' },
    { key: 'qtyRequested', header: 'Qty Requested' },
    { key: 'qtyApproved', header: 'Qty Approved' }
  ])
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1>Locate History</h1>
        <p>
          Read-only archive of past locate requests<template v-if="viewedUser"> for <b>{{ viewedUser.firm }}</b></template>.
          Search or filter by date, and click a row for the full record.
        </p>
      </div>
      <button class="btn ghost lg" :disabled="!historyRows.length" @click="download">
        <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg>
        Download
      </button>
    </div>

    <!-- Toolbar: search + date range -->
    <div class="toolbar">
      <div class="search">
        <span class="search-ico">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
        </span>
        <input :value="quickFilter" @input="onQuickFilter"
               aria-label="Search history by ticker, SEDOL, ISIN or security"
               placeholder="Search ticker, SEDOL, ISIN, security…" />
      </div>
      <div class="dates">
        <label>From <input type="date" v-model="fromDate" /></label>
        <label>To <input type="date" v-model="toDate" /></label>
        <button v-if="fromDate || toDate" class="btn ghost" @click="clearDates">Clear dates</button>
      </div>
    </div>

    <p class="count">{{ historyRows.length }} request{{ historyRows.length === 1 ? '' : 's' }}</p>

    <div class="grid-wrap ag-theme-quartz">
      <AgGridVue
        class="grid"
        :columnDefs="columnDefs"
        :rowData="historyRows"
        :defaultColDef="defaultColDef"
        :rowHeight="58"
        :headerHeight="46"
        :pagination="true"
        :paginationPageSize="10"
        :paginationPageSizeSelector="[10, 25, 50]"
        rowSelection="single"
        @grid-ready="onGridReady"
        @row-clicked="onRowClicked"
        @cell-key-down="onCellKeyDown"
      />
    </div>
  </div>
</template>

<style scoped>
.page-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 16px; }
.page-head h1 { margin: 0; font-size: 22px; letter-spacing: -.01em; }
.page-head p { margin: 5px 0 0; color: var(--text-soft); font-size: 13px; }
.page-head b { color: var(--text); font-weight: 600; }
.btn.lg { padding: 9px 16px; font-size: 13px; display: inline-flex; align-items: center; gap: 7px; }
.btn.lg .ic { width: 15px; height: 15px; }
.btn:disabled { opacity: .5; cursor: not-allowed; }

.toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
.search { position: relative; flex: 1; max-width: 420px; min-width: 240px; }
.search-ico { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--text-mute); display: grid; place-items: center; }
.search-ico svg { width: 16px; height: 16px; }
.search input {
  width: 100%; font-family: inherit; font-size: 13px; padding: 10px 12px 10px 34px;
  border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); outline: none; transition: border-color .12s;
}
.search input:focus { border-color: var(--brand-500); }

.dates { display: flex; align-items: center; gap: 10px; }
.dates label { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--text-soft); }
.dates input { font-family: inherit; font-size: 12.5px; padding: 8px 10px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); color: var(--text); }
.dates input:focus { border-color: var(--brand-500); outline: none; }
.btn { border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 8px 14px; font-size: 12.5px; font-weight: 600; background: var(--surface); color: var(--text-soft); }
.btn.ghost:hover { background: var(--surface-2); border-color: var(--text-mute); }

.count { margin: 0 0 10px; font-size: 12.5px; color: var(--text-soft); }

.grid-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); }
.grid { width: 100%; height: 560px;
  --ag-font-family: var(--font);
  --ag-font-size: 13px;
  --ag-foreground-color: var(--text);
  --ag-header-foreground-color: var(--text);
  --ag-header-background-color: #e7edf6;
  --ag-odd-row-background-color: #f4f7fb;
  --ag-row-hover-color: var(--brand-50);
  --ag-selected-row-background-color: var(--brand-50);
  --ag-border-color: var(--border);
  --ag-cell-horizontal-padding: 14px;
  --ag-borders: none;
  --ag-row-border-color: var(--border);
}
</style>
