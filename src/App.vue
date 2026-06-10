<script setup>
import { ref, computed, shallowRef, markRaw } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'

import StatusBadge from './components/StatusBadge.vue'
import SecurityCell from './components/SecurityCell.vue'
import NewRequestModal from './components/NewRequestModal.vue'
import DetailDrawer from './components/DetailDrawer.vue'
import { seedLocates, STATUSES } from './data/locates.js'

/* ---------- state ---------- */
const rows = ref([...seedLocates])
const quickFilter = ref('')
const statusFilter = ref('ALL')
const showModal = ref(false)
const selectedRecord = ref(null)
const showColumns = ref(false)
const toast = ref(null)

// Columns the user can toggle back on (folded into Security / row detail by default).
const toggleableCols = ref([
  { field: 'ticker', label: 'Ticker', visible: false },
  { field: 'bbgTicker', label: 'BBG Ticker', visible: false },
  { field: 'batchId', label: 'Batch ID', visible: false },
  { field: 'locateId', label: 'Locate ID', visible: false },
  { field: 'sedol', label: 'SEDOL', visible: false },
  { field: 'isin', label: 'ISIN', visible: false },
  { field: 'ric', label: 'RIC', visible: false },
  { field: 'cusip', label: 'CUSIP', visible: false }
])
const extraColCount = computed(() => toggleableCols.value.filter(c => c.visible).length)
const gridApi = shallowRef(null)
const lastRefreshed = ref('2026-06-09 16:22:21')
let nextId = seedLocates.length + 1

/* ---------- columns ----------
 * Two tiers: a compact, flex-sized SCAN set shown by default (fills the width,
 * so there is no horizontal scroll), and demoted REFERENCE columns hidden by
 * default — the redundant identifiers are folded into the Security cell and
 * remain reachable via the row-detail drawer and column chooser.
 */
const mono = { cellClass: 'mono-cell' }

const columnDefs = ref([
  // --- Scan set (visible, flex-sized) ---
  { headerName: 'Request Date', field: 'requestDate', flex: 1.1, minWidth: 150 },
  { headerName: 'Status', field: 'status', flex: 0.9, minWidth: 130,
    cellRenderer: markRaw(StatusBadge),
    cellRendererParams: (p) => ({ params: p }) },
  { headerName: 'Type', field: 'type', flex: 0.8, minWidth: 110, cellClass: 'type-cell' },
  { headerName: 'Security', field: 'security', flex: 1.8, minWidth: 220,
    cellRenderer: markRaw(SecurityCell),
    cellRendererParams: (p) => ({ params: p }),
    getQuickFilterText: (p) =>
      [p.data.ticker, p.data.bbgTicker, p.data.security, p.data.sedol, p.data.isin, p.data.cusip, p.data.ric].join(' ') },
  // Numbers right-aligned in the body, but the HEADER stays default (label left,
  // filter icon right) — so we right-align the cell only, not via type:'rightAligned'.
  { headerName: 'Qty Req', field: 'qtyRequested', flex: 0.7, minWidth: 90, cellClass: 'mono-cell num-cell' },
  { headerName: 'Qty Appr', field: 'qtyApproved', flex: 0.7, minWidth: 90,
    cellClass: (p) => p.value > 0 ? 'mono-cell num-cell appr-pos' : 'mono-cell num-cell appr-zero' },

  // --- Reference set (hidden by default; toggle via column chooser) ---
  { headerName: 'Ticker', field: 'ticker', minWidth: 100, hide: true, cellClass: 'strong-cell' },
  { headerName: 'BBG Ticker', field: 'bbgTicker', minWidth: 120, hide: true },
  { headerName: 'Batch ID', field: 'batchId', minWidth: 110, hide: true, ...mono },
  { headerName: 'Locate ID', field: 'locateId', minWidth: 120, hide: true, ...mono },
  { headerName: 'SEDOL', field: 'sedol', minWidth: 110, hide: true, ...mono },
  { headerName: 'ISIN', field: 'isin', minWidth: 140, hide: true, ...mono },
  { headerName: 'RIC', field: 'ric', minWidth: 110, hide: true, ...mono },
  { headerName: 'CUSIP', field: 'cusip', minWidth: 120, hide: true, ...mono }
])

const defaultColDef = {
  sortable: true,
  resizable: true,
  filter: true,
  suppressHeaderMenuButton: false
}

/* ---------- derived ---------- */
const filteredRows = computed(() => {
  if (statusFilter.value === 'ALL') return rows.value
  return rows.value.filter(r => r.status === statusFilter.value)
})

const counts = computed(() => {
  const c = { ALL: rows.value.length, APPROVED: 0, PENDING: 0, REJECTED: 0 }
  for (const r of rows.value) c[r.status]++
  return c
})

/* ---------- handlers ---------- */
function onGridReady(params) {
  gridApi.value = params.api
}

function onRowClicked(e) {
  selectedRecord.value = e.data
}

function toggleColumn(col) {
  col.visible = !col.visible
  gridApi.value?.setColumnsVisible([col.field], col.visible)
}

function onQuickFilter(e) {
  quickFilter.value = e.target.value
  gridApi.value?.setGridOption('quickFilterText', e.target.value)
}

function clearFilters() {
  quickFilter.value = ''
  statusFilter.value = 'ALL'
  gridApi.value?.setGridOption('quickFilterText', '')
  showToast('Filters cleared', 'info')
}

function refresh() {
  // simulate a refresh cycle
  lastRefreshed.value = stamp()
  gridApi.value?.flashCells({ rowNodes: gridApi.value.getRenderedNodes?.() })
  showToast('Grid refreshed', 'info')
}

function handleNewRequest(form) {
  const record = {
    id: nextId++,
    requestDate: stamp(),
    type: form.type,
    batchId: 608262 + nextId,
    locateId: 93995504 + nextId,
    status: 'PENDING',
    sedol: form.sedol || '',
    isin: form.isin || '',
    ric: '',
    cusip: form.cusip || '',
    ticker: form.ticker,
    bbgTicker: form.ticker ? `${form.ticker} US` : '',
    security: form.security,
    qtyRequested: form.qtyRequested,
    qtyApproved: 0
  }
  rows.value = [record, ...rows.value]
  showModal.value = false
  showToast(`Successfully created locate · ${form.ticker}`, 'ok')
}

function stamp() {
  // deterministic-ish display stamp for the mock environment
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

let toastTimer
function showToast(msg, kind = 'ok') {
  toast.value = { msg, kind }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = null), 3200)
}
</script>

<template>
  <div class="app">
    <!-- Top bar -->
    <header class="topbar">
      <div class="brand">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 3v16a2 2 0 0 0 2 2h16" />
            <path d="M7 14l4-4 3 3 5-6" />
            <path d="M17 7h4v4" />
          </svg>
        </div>
        <div>
          <div class="brand-title">Locates</div>
          <div class="brand-sub">Trading Request Portal</div>
        </div>
      </div>
      <div class="topbar-right">
        <span class="refreshed">Refreshed at <b>{{ lastRefreshed }}</b></span>
        <div class="avatar" title="george.farag166@gmail.com">GF</div>
      </div>
    </header>

    <main class="content">
      <!-- Page heading + primary action -->
      <div class="page-head">
        <div>
          <h1>Locate Requests</h1>
          <p>Review, filter and submit security locate requests to the desk.</p>
        </div>
        <button class="btn primary lg" @click="showModal = true">
          <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
               stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          New Locate Request
        </button>
      </div>

      <!-- Status stat chips -->
      <div class="stats">
        <button class="stat" :class="{ active: statusFilter === 'ALL' }" @click="statusFilter = 'ALL'">
          <span class="stat-num">{{ counts.ALL }}</span><span class="stat-lbl">All Requests</span>
        </button>
        <button class="stat ok" :class="{ active: statusFilter === 'APPROVED' }" @click="statusFilter = 'APPROVED'">
          <span class="stat-num">{{ counts.APPROVED }}</span><span class="stat-lbl">Approved</span>
        </button>
        <button class="stat warn" :class="{ active: statusFilter === 'PENDING' }" @click="statusFilter = 'PENDING'">
          <span class="stat-num">{{ counts.PENDING }}</span><span class="stat-lbl">Pending</span>
        </button>
        <button class="stat bad" :class="{ active: statusFilter === 'REJECTED' }" @click="statusFilter = 'REJECTED'">
          <span class="stat-num">{{ counts.REJECTED }}</span><span class="stat-lbl">Rejected</span>
        </button>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="search">
          <span class="search-ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </span>
          <input :value="quickFilter" @input="onQuickFilter"
                 placeholder="Search ticker, SEDOL, ISIN, security…" />
        </div>
        <div class="toolbar-actions">
          <div class="col-chooser">
            <button class="btn ghost" :class="{ open: showColumns }" @click="showColumns = !showColumns">
              <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="1.5" />
                <path d="M9 4v16M15 4v16" />
              </svg>
              Add columns
              <span v-if="extraColCount" class="col-badge">{{ extraColCount }}</span>
              <svg class="caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                   stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            <div v-if="showColumns" class="col-catch" @click="showColumns = false"></div>
            <div v-if="showColumns" class="col-panel">
              <div class="col-panel-head">Show more columns</div>
              <label v-for="c in toggleableCols" :key="c.field" class="col-opt">
                <input type="checkbox" :checked="c.visible" @change="toggleColumn(c)" />
                <span>{{ c.label }}</span>
              </label>
              <p class="col-hint">These identifiers are folded into the Security column by default — tick any to add it as its own column, or click a row to see them all.</p>
            </div>
          </div>
          <button class="btn ghost" @click="clearFilters">Clear</button>
          <button class="btn ghost" @click="refresh">
            <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <path d="M21 3v6h-6" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <!-- Discoverability hint -->
      <p class="grid-hint">
        Showing key columns. <b>Click a row</b> for the full record, or use
        <b>“Add columns”</b> to bring back SEDOL, ISIN, CUSIP and other identifiers.
      </p>

      <!-- Grid -->
      <div class="grid-wrap ag-theme-quartz">
        <AgGridVue
          class="grid"
          :columnDefs="columnDefs"
          :rowData="filteredRows"
          :defaultColDef="defaultColDef"
          :rowHeight="58"
          :headerHeight="44"
          :pagination="true"
          :paginationPageSize="10"
          :paginationPageSizeSelector="[10, 25, 50]"
          :animateRows="true"
          rowSelection="single"
          @grid-ready="onGridReady"
          @row-clicked="onRowClicked"
        />
      </div>
    </main>

    <!-- Modal -->
    <NewRequestModal v-if="showModal" @close="showModal = false" @submit="handleNewRequest" />

    <!-- Row-detail drawer -->
    <DetailDrawer v-if="selectedRecord" :record="selectedRecord" @close="selectedRecord = null" />

    <!-- Toast -->
    <transition name="toast">
      <div v-if="toast" class="toast" :class="toast.kind">
        <span class="toast-ico">
          <svg v-if="toast.kind === 'ok'" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7" /></svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5v.5" />
          </svg>
        </span>
        {{ toast.msg }}
      </div>
    </transition>
  </div>
</template>

<style scoped>
.app { min-height: 100%; display: flex; flex-direction: column; }

/* Top bar */
.topbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 24px; height: 60px;
  background: linear-gradient(100deg, var(--brand-900), var(--brand-700));
  color: #fff;
  box-shadow: 0 1px 0 rgba(255,255,255,.06);
}
.brand { display: flex; align-items: center; gap: 12px; }
.logo {
  width: 36px; height: 36px; border-radius: 10px;
  background: rgba(255,255,255,.12);
  display: grid; place-items: center; color: #fff;
}
.logo svg { width: 20px; height: 20px; }
.brand-title { font-weight: 700; font-size: 15px; letter-spacing: .02em; }
.brand-sub { font-size: 11px; color: #aebfe0; }
.topbar-right { display: flex; align-items: center; gap: 16px; }
.refreshed { font-size: 12px; color: #c4d0ec; }
.refreshed b { color: #fff; font-weight: 600; }
.avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--brand-400); color: #fff;
  display: grid; place-items: center; font-size: 12px; font-weight: 700;
}

/* Content */
.content { padding: 24px 28px 40px; max-width: 1500px; width: 100%; margin: 0 auto; }

.page-head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; }
.page-head h1 { margin: 0; font-size: 22px; letter-spacing: -.01em; }
.page-head p { margin: 5px 0 0; color: var(--text-soft); font-size: 13px; }

/* Buttons */
.btn {
  border: 1px solid transparent; border-radius: var(--radius-sm);
  padding: 9px 16px; font-size: 13px; font-weight: 600;
  display: inline-flex; align-items: center; gap: 7px;
  transition: transform .08s, filter .12s, background .12s;
}
.btn:active { transform: translateY(1px); }
.btn.primary { background: var(--brand-500); color: #fff; box-shadow: 0 6px 16px rgba(31,95,209,.28); }
.btn.primary:hover { filter: brightness(1.08); }
.btn.lg { padding: 11px 20px; font-size: 14px; }
.btn .ic { width: 15px; height: 15px; flex: none; }
.btn.ghost { background: var(--surface); border-color: var(--border); color: var(--text-soft); }
.btn.ghost:hover { background: var(--border-2); }

/* Stat chips */
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px; }
.stat {
  text-align: left; background: var(--surface);
  border: 1px solid var(--border); border-radius: var(--radius);
  padding: 14px 16px; display: flex; flex-direction: column; gap: 2px;
  box-shadow: var(--shadow); transition: border-color .12s, transform .08s;
  position: relative; overflow: hidden;
}
.stat::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  background: var(--text-mute); opacity: 0; transition: opacity .12s;
}
.stat:hover { transform: translateY(-1px); }
.stat.active { border-color: var(--brand-400); }
.stat.active::before { opacity: 1; }
.stat.ok.active::before, .stat.ok .stat-num { color: var(--ok); }
.stat.warn.active::before, .stat.warn .stat-num { color: var(--warn); }
.stat.bad.active::before, .stat.bad .stat-num { color: var(--bad); }
.stat.ok::before { background: var(--ok); }
.stat.warn::before { background: var(--warn); }
.stat.bad::before { background: var(--bad); }
.stat-num { font-size: 24px; font-weight: 700; letter-spacing: -.02em; }
.stat-lbl { font-size: 12px; color: var(--text-soft); font-weight: 500; }

/* Toolbar */
.toolbar {
  display: flex; justify-content: space-between; align-items: center;
  gap: 12px; margin-bottom: 14px;
}
.search { position: relative; flex: 1; max-width: 420px; }
.search-ico {
  position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
  color: var(--text-mute); display: grid; place-items: center;
}
.search-ico svg { width: 16px; height: 16px; }
.search input {
  width: 100%; font-family: inherit; font-size: 13px;
  padding: 10px 12px 10px 34px;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--surface); outline: none;
  transition: border-color .12s, box-shadow .12s;
}
.search input:focus { border-color: var(--brand-400); box-shadow: 0 0 0 3px var(--brand-50); }
.toolbar-actions { display: flex; gap: 8px; }

/* Discoverability hint */
.grid-hint {
  margin: 0 0 10px; font-size: 12.5px; color: var(--text-soft);
}
.grid-hint b { color: var(--text); font-weight: 600; }

/* Column chooser */
.col-chooser { position: relative; }
.btn.ghost.open { border-color: var(--brand-400); color: var(--brand-700); background: var(--brand-50); }
.caret { width: 12px; height: 12px; color: var(--text-mute); flex: none; }
.col-badge {
  display: inline-grid; place-items: center; min-width: 17px; height: 17px;
  padding: 0 4px; margin-left: 2px; border-radius: 99px;
  background: var(--brand-500); color: #fff; font-size: 10px; font-weight: 700;
}
.col-catch { position: fixed; inset: 0; z-index: 19; }
.col-panel {
  position: absolute; right: 0; top: calc(100% + 6px); z-index: 20;
  width: 230px; background: var(--surface);
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  box-shadow: var(--shadow-lg); padding: 8px;
  animation: pop .14s ease;
}
.col-panel-head {
  font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
  color: var(--text-mute); padding: 6px 8px 8px;
}
.col-opt {
  display: flex; align-items: center; gap: 9px;
  padding: 7px 8px; border-radius: 7px; font-size: 13px; cursor: pointer;
}
.col-opt:hover { background: var(--surface-2); }
.col-opt input { width: 15px; height: 15px; accent-color: var(--brand-500); cursor: pointer; }
.col-hint {
  margin: 6px 8px 2px; padding-top: 8px; border-top: 1px solid var(--border-2);
  font-size: 11px; color: var(--text-mute); line-height: 1.4;
}
@keyframes pop { from { opacity: 0; transform: translateY(-4px) } }

/* Grid */
.grid-wrap {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}
.grid { width: 100%; height: 560px;
  --ag-font-family: var(--font);
  --ag-font-size: 13px;
  --ag-foreground-color: var(--text);
  --ag-header-foreground-color: var(--text-soft);
  --ag-header-background-color: var(--surface-2);
  --ag-odd-row-background-color: #fbfcfe;
  --ag-row-hover-color: var(--brand-50);
  --ag-selected-row-background-color: var(--brand-50);
  --ag-border-color: var(--border-2);
  --ag-header-column-resize-handle-color: var(--border);
  --ag-cell-horizontal-padding: 14px;
  --ag-borders: none;
  --ag-row-border-color: var(--border-2);
}

/* Toast */
.toast {
  position: fixed; right: 24px; bottom: 24px;
  display: flex; align-items: center; gap: 10px;
  padding: 13px 18px; border-radius: 12px;
  background: var(--surface); color: var(--text);
  box-shadow: var(--shadow-lg); font-size: 13px; font-weight: 500;
  border: 1px solid var(--border); z-index: 60;
}
.toast.ok { border-left: 4px solid var(--ok); }
.toast.info { border-left: 4px solid var(--brand-400); }
.toast-ico {
  width: 22px; height: 22px; border-radius: 50%;
  display: grid; place-items: center; color: #fff; font-size: 12px;
}
.toast-ico svg { width: 13px; height: 13px; }
.toast.ok .toast-ico { background: var(--ok); }
.toast.info .toast-ico { background: var(--brand-400); }
.toast-enter-active, .toast-leave-active { transition: all .25s cubic-bezier(.2,.9,.3,1.1); }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(12px); }

@media (max-width: 760px) {
  .stats { grid-template-columns: repeat(2, 1fr); }
  .page-head { flex-direction: column; align-items: stretch; gap: 14px; }
}
</style>

<style>
/* Global AG Grid cell helpers (un-scoped so they reach grid-rendered cells) */
.mono-cell { font-family: var(--mono); font-size: 12.5px; color: var(--text-soft); }
/* Right-align numeric cell VALUES without flipping the header (label stays left, filter right). */
.num-cell { text-align: right; }
.strong-cell { font-weight: 600; }
.type-cell { color: var(--brand-700); font-weight: 600; font-size: 12px; letter-spacing: .02em; }
.appr-pos { color: var(--ok); font-weight: 600; }
.appr-zero { color: var(--text-mute); }
.ag-theme-quartz .ag-header-cell-text { font-weight: 600; letter-spacing: .01em; }
.ag-theme-quartz .ag-row { cursor: pointer; }
</style>
