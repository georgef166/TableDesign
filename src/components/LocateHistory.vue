<script setup>
import { ref, computed, shallowRef, markRaw } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
import StatusBadge from './StatusBadge.vue'
import StatusIcon from './StatusIcon.vue'
import AnimatedNumber from './AnimatedNumber.vue'
import { useRequests } from '../composables/useRequests.js'
import { downloadCsv } from '../utils/csv.js'
import { stampShort } from '../utils/datetime.js'

// Comma-group quantities; blank for null/empty.
const fmtQty = (p) => (p.value || p.value === 0) ? p.value.toLocaleString() : ''
const mono = { cellClass: 'mono-cell' }

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

const today = stampShort().slice(0, 10)
const quickFilter = ref('')
const statusFilter = ref('ALL')
// The date inputs (`from`/`to`) are edited freely, but only take effect on Apply —
// the `applied*` values are what actually filter, mimicking a backend round-trip.
const fromDate = ref(today)
const toDate = ref(today)
const appliedFrom = ref(today)
const appliedTo = ref(today)
const fetching = ref(false)
const gridApi = shallowRef(null)

// Columns the user can toggle on (defaults below are always shown).
const toggleableCols = ref([
  { field: 'bbgTicker', label: 'BBG Ticker', visible: false },
  { field: 'batchId', label: 'Batch ID', visible: false },
  { field: 'locateId', label: 'Locate ID', visible: false },
  { field: 'sedol', label: 'SEDOL', visible: false },
  { field: 'isin', label: 'ISIN', visible: false },
  { field: 'ric', label: 'RIC', visible: false },
  { field: 'cusip', label: 'CUSIP', visible: false }
])
const showColumns = ref(false)
const extraColCount = computed(() => toggleableCols.value.filter(c => c.visible).length)

// Company scope → applied date range. The status cards filter on top of this, and
// their counts are computed over this (pre-status) set.
const dateScopedRows = computed(() => {
  let list = scopeByFirm(rows.value, props.viewedUser)
  if (appliedFrom.value) list = list.filter(r => (r.requestDate || '').slice(0, 10) >= appliedFrom.value)
  if (appliedTo.value)   list = list.filter(r => (r.requestDate || '').slice(0, 10) <= appliedTo.value)
  return list
})
const counts = computed(() => {
  const c = { ALL: dateScopedRows.value.length, APPROVED: 0, PENDING: 0, REJECTED: 0 }
  for (const r of dateScopedRows.value) c[r.status]++
  return c
})
const historyRows = computed(() =>
  statusFilter.value === 'ALL'
    ? dateScopedRows.value
    : dateScopedRows.value.filter(r => r.status === statusFilter.value)
)

const columnDefs = ref([
  // --- Default columns (always visible) ---
  { headerName: 'Request Date', field: 'requestDate', flex: 1.1, minWidth: 160 },
  { headerName: 'Status', field: 'status', flex: 0.9, minWidth: 130,
    cellRenderer: markRaw(StatusBadge),
    cellRendererParams: (p) => ({ params: p }),
    cellClassRules: {
      'status-ok': p => p.value === 'APPROVED',
      'status-warn': p => p.value === 'PENDING',
      'status-bad': p => p.value === 'REJECTED'
    } },
  { headerName: 'Ticker', field: 'ticker', flex: 0.8, minWidth: 100, cellClass: 'strong-cell' },
  { headerName: 'Security', field: 'security', flex: 1.6, minWidth: 200,
    getQuickFilterText: (p) =>
      [p.data.ticker, p.data.bbgTicker, p.data.security, p.data.sedol, p.data.isin, p.data.cusip, p.data.ric].join(' ') },
  { headerName: 'Qty Req', field: 'qtyRequested', type: 'rightAligned', flex: 0.7, minWidth: 100,
    cellClass: 'mono-cell num-cell', valueFormatter: fmtQty },
  { headerName: 'Qty Appr', field: 'qtyApproved', type: 'rightAligned', flex: 0.7, minWidth: 100,
    valueFormatter: fmtQty,
    cellClass: (p) => p.value > 0 ? 'mono-cell num-cell appr-pos' : 'mono-cell num-cell appr-zero' },

  // --- Reference set (hidden by default; toggle via the column chooser) ---
  { headerName: 'BBG Ticker', field: 'bbgTicker', minWidth: 120, hide: true },
  { headerName: 'Batch ID', field: 'batchId', minWidth: 110, hide: true, ...mono },
  { headerName: 'Locate ID', field: 'locateId', minWidth: 120, hide: true, ...mono },
  { headerName: 'SEDOL', field: 'sedol', minWidth: 110, hide: true, ...mono },
  { headerName: 'ISIN', field: 'isin', minWidth: 140, hide: true, ...mono },
  { headerName: 'RIC', field: 'ric', minWidth: 110, hide: true, ...mono },
  { headerName: 'CUSIP', field: 'cusip', minWidth: 120, hide: true, ...mono }
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
function toggleColumn(col) {
  col.visible = !col.visible
  gridApi.value?.setColumnsVisible([col.field], col.visible)
}

// Apply the edited date range (mocks a backend fetch with a brief loading state).
let fetchTimer
function applyDates() {
  fetching.value = true
  appliedFrom.value = fromDate.value
  appliedTo.value = toDate.value
  clearTimeout(fetchTimer)
  fetchTimer = setTimeout(() => { fetching.value = false }, 450)
}

// Reset the range to today (both edited + applied). The button is always shown.
function clearDates() {
  fromDate.value = today
  toDate.value = today
  applyDates()
}

// Toolbar "Clear" — reset every filter (search, status, dates) like Locate Requests.
function clearAll() {
  quickFilter.value = ''
  gridApi.value?.setGridOption('quickFilterText', '')
  statusFilter.value = 'ALL'
  clearDates()
}

// Toolbar "Refresh" — re-pull the current range (shows the brief fetching state).
function refreshHistory() { applyDates() }

// Export reflects what's shown: the always-on defaults + any toggled-on columns.
const DEFAULT_EXPORT = [
  { key: 'requestDate', header: 'Request Date' },
  { key: 'status', header: 'Status' },
  { key: 'ticker', header: 'Ticker' },
  { key: 'security', header: 'Security' },
  { key: 'qtyRequested', header: 'Qty Requested' },
  { key: 'qtyApproved', header: 'Qty Approved' }
]
function download() {
  const tag = (props.viewedUser?.firm || 'all-firms').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const extra = toggleableCols.value.filter(c => c.visible).map(c => ({ key: c.field, header: c.label }))
  downloadCsv(`locate-history_${tag}_${today}.csv`, historyRows.value, [...DEFAULT_EXPORT, ...extra])
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

    <!-- Filters row: status cards (left) + date range (right) -->
    <div class="filters-row">
      <div class="stats" role="group" aria-label="Filter history by status">
        <button class="stat" :class="{ active: statusFilter === 'ALL' }"
                :aria-pressed="statusFilter === 'ALL'" @click="statusFilter = 'ALL'">
          <span class="stat-top"><StatusIcon status="ALL" :size="17" /><span class="stat-num"><AnimatedNumber :value="counts.ALL" /></span></span>
          <span class="stat-lbl">All Requests</span>
        </button>
        <button class="stat ok" :class="{ active: statusFilter === 'APPROVED' }"
                :aria-pressed="statusFilter === 'APPROVED'" @click="statusFilter = 'APPROVED'">
          <span class="stat-top"><StatusIcon status="APPROVED" :size="17" /><span class="stat-num"><AnimatedNumber :value="counts.APPROVED" /></span></span>
          <span class="stat-lbl">Approved</span>
        </button>
        <button class="stat warn" :class="{ active: statusFilter === 'PENDING' }"
                :aria-pressed="statusFilter === 'PENDING'" @click="statusFilter = 'PENDING'">
          <span class="stat-top"><StatusIcon status="PENDING" :size="17" /><span class="stat-num"><AnimatedNumber :value="counts.PENDING" /></span></span>
          <span class="stat-lbl">Pending</span>
        </button>
        <button class="stat bad" :class="{ active: statusFilter === 'REJECTED' }"
                :aria-pressed="statusFilter === 'REJECTED'" @click="statusFilter = 'REJECTED'">
          <span class="stat-top"><StatusIcon status="REJECTED" :size="17" /><span class="stat-num"><AnimatedNumber :value="counts.REJECTED" /></span></span>
          <span class="stat-lbl">Rejected</span>
        </button>
      </div>
      <div class="dates">
        <label>From <input type="date" v-model="fromDate" /></label>
        <label>To <input type="date" v-model="toDate" /></label>
        <button class="btn primary" :disabled="fetching" @click="applyDates">
          <span v-if="fetching" class="spin" aria-hidden="true"></span>
          {{ fetching ? 'Fetching…' : 'Apply' }}
        </button>
        <button class="btn ghost" @click="clearDates">Clear dates</button>
      </div>
    </div>

    <!-- Toolbar: search (left) + add columns / clear / refresh (right) -->
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
      <div class="toolbar-actions">
        <div class="col-chooser">
          <button class="btn ghost" :class="{ open: showColumns }" @click="showColumns = !showColumns">
            <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="1.5" /><path d="M9 4v16M15 4v16" /></svg>
            Add columns
            <span v-if="extraColCount" class="col-badge">{{ extraColCount }}</span>
          </button>
          <div v-if="showColumns" class="col-catch" @click="showColumns = false"></div>
          <div v-if="showColumns" class="col-panel">
            <div class="col-panel-head">Show more columns</div>
            <label v-for="c in toggleableCols" :key="c.field" class="col-opt">
              <input type="checkbox" :checked="c.visible" @change="toggleColumn(c)" />
              <span>{{ c.label }}</span>
            </label>
            <p class="col-hint">Toggled columns are also included in the download.</p>
          </div>
        </div>
        <button class="btn ghost" @click="clearAll">Clear</button>
        <button class="btn ghost" @click="refreshHistory">
          <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></svg>
          Refresh
        </button>
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
        :alwaysShowVerticalScroll="true"
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

/* Filters row: status cards (left) + date range (right). */
.filters-row { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
/* Status filter cards — mirrors the Locate Requests page. */
.stats {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px; max-width: 760px; flex: 1 1 560px;
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

.toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
.toolbar-actions { display: flex; align-items: center; gap: 8px; }

/* Column chooser */
.col-chooser { position: relative; }
.col-chooser .ic { width: 15px; height: 15px; }
.col-chooser .btn.open { border-color: var(--brand-500); color: var(--brand-700); }
.col-badge { background: var(--brand-500); color: #fff; font-size: 10.5px; font-weight: 700; border-radius: 99px; padding: 1px 6px; margin-left: 2px; }
.col-catch { position: fixed; inset: 0; z-index: 20; }
.col-panel {
  position: absolute; right: 0; top: calc(100% + 6px); z-index: 30; width: 220px;
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm);
  box-shadow: var(--shadow); padding: 6px;
}
.col-panel-head { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--text-mute); padding: 6px 8px 4px; }
.col-opt { display: flex; align-items: center; gap: 9px; padding: 7px 8px; border-radius: var(--radius-sm); font-size: 13px; cursor: pointer; }
.col-opt:hover { background: var(--surface-2); }
.col-opt input { width: 15px; height: 15px; accent-color: var(--brand-500); cursor: pointer; }
.col-hint { margin: 6px 8px 2px; padding-top: 8px; border-top: 1px solid var(--border-2); font-size: 11px; color: var(--text-mute); line-height: 1.4; }

.search { position: relative; flex: 1; max-width: 420px; min-width: 240px; }
.search-ico { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--text-mute); display: grid; place-items: center; }
.search-ico svg { width: 16px; height: 16px; }
.search input {
  width: 100%; font-family: inherit; font-size: 13px; padding: 10px 12px 10px 34px;
  border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); outline: none; transition: border-color .12s;
}
.search input:focus { border-color: var(--brand-500); }

.dates { display: flex; align-items: center; gap: 10px; flex: 0 0 auto; }
.toolbar-actions .btn .ic { width: 15px; height: 15px; }
.dates label { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--text-soft); }
.dates input { font-family: inherit; font-size: 12.5px; padding: 8px 10px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); color: var(--text); }
.dates input:focus { border-color: var(--brand-500); outline: none; }
.btn { border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 9px 16px; font-size: 13px; font-weight: 600; background: var(--surface); color: var(--text-soft); display: inline-flex; align-items: center; gap: 7px; }
.btn.ghost:hover { background: var(--surface-2); border-color: var(--text-mute); }
.btn.primary { background: var(--brand-500); border-color: transparent; color: #fff; }
.btn.primary:hover { background: var(--brand-700); }
.btn.primary:disabled { opacity: .7; cursor: default; }
.spin { width: 12px; height: 12px; border: 2px solid rgba(255,255,255,.45); border-top-color: #fff; border-radius: 50%; animation: spin .6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.count { margin: 0 0 10px; font-size: 12.5px; color: var(--text-soft); }

.grid-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); }
.grid { width: 100%; height: 560px;
  --ag-font-family: var(--font);
  --ag-font-size: 13px;
  --ag-foreground-color: var(--text);
  --ag-header-foreground-color: var(--text);
  --ag-background-color: var(--surface);
  --ag-header-background-color: var(--grid-header-bg);
  --ag-odd-row-background-color: var(--grid-zebra);
  --ag-row-hover-color: var(--brand-50);
  --ag-selected-row-background-color: var(--brand-50);
  --ag-border-color: var(--border);
  --ag-cell-horizontal-padding: 14px;
  --ag-borders: none;
  --ag-row-border-color: var(--border);
}
</style>
