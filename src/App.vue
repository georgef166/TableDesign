<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'

import LocateGrid from './components/LocateGrid.vue'
import StatusFilterCards from './components/StatusFilterCards.vue'
import { makeToggleableCols } from './components/locateColumns.js'
import RequestsInsights from './components/RequestsInsights.vue'
import NewRequestModal from './components/NewRequestModal.vue'
import DetailDrawer from './components/DetailDrawer.vue'
import FileUploadModal from './components/FileUploadModal.vue'
import StandingLists from './components/StandingLists.vue'
import AvailabilityView from './components/AvailabilityView.vue'
import ImpersonationBar from './components/ImpersonationBar.vue'
import LocateHistory from './components/LocateHistory.vue'
import { ADMIN_USER, CLIENT_USERS, userById } from './data/users.js'
import { useSessionStore } from './composables/useSessionStore.js'
import { useTheme } from './composables/useTheme.js'
import { useDensity } from './composables/useDensity.js'
import { useRequests } from './composables/useRequests.js'
import { stamp } from './utils/datetime.js'
import scotiaLogo from './assets/scotiabank-logo.svg'

/* ---------- state ---------- */
const { rows, addRecords, scopeByFirm } = useRequests()
const quickFilter = ref('')
const statusFilter = ref('ALL')
const showModal = ref(false)
const showUpload = ref(false)
const prefillSecurity = ref(null)
// True when the request modal is opened from Availability (locked to one security).
const singleLocate = ref(false)
const selectedRecord = ref(null)
const showColumns = ref(false)
const showInsights = ref(false)
const toast = ref(null)

/* ---------- navigation ---------- */
const VIEWS = [
  { id: 'requests', label: 'Locate Requests' },
  { id: 'standing', label: 'Standing List' },
  { id: 'availability', label: 'Availability' },
  { id: 'history', label: 'Locate History' }
]
const activeView = ref('requests')

/* ---------- user / impersonation ---------- */
const realUser = ADMIN_USER

/* ---------- theme / density ---------- */
const { theme, toggle: toggleTheme } = useTheme()
const { isCompact, toggle: toggleDensity } = useDensity()

const impersonatingId = useSessionStore('impersonating-user-id', null)
const impersonating = computed(() => impersonatingId.value ? userById(impersonatingId.value) : null)
const effectiveUser = computed(() => impersonating.value || realUser)
const showUserMenu = ref(false)

function impersonate(user) {
  impersonatingId.value = user.id
  showUserMenu.value = false
  activeView.value = 'requests'
  showToast(`Now viewing as ${user.name}`, 'info')
}
function exitImpersonation() {
  const was = impersonating.value?.name
  impersonatingId.value = null
  showUserMenu.value = false
  showToast(was ? `Exited — back to ${realUser.name}` : 'Exited impersonation', 'info')
}

// Columns the user can toggle back on (folded into Security / row detail by default).
const toggleableCols = ref(makeToggleableCols())
const extraColCount = computed(() => toggleableCols.value.filter(c => c.visible).length)
const gridRef = ref(null)
const lastRefreshed = ref(stamp())

/* ---------- derived ---------- */
// When impersonating a client, the grid + counts are scoped to that client's
// COMPANY — so two colleagues at the same firm see exactly the same locates.
// The admin (not impersonating) sees every firm.
const scopedRows = computed(() => scopeByFirm(rows.value, impersonating.value))

const filteredRows = computed(() => {
  if (statusFilter.value === 'ALL') return scopedRows.value
  return scopedRows.value.filter(r => r.status === statusFilter.value)
})

const counts = computed(() => {
  const c = { ALL: scopedRows.value.length, APPROVED: 0, PENDING: 0, REJECTED: 0 }
  for (const r of scopedRows.value) c[r.status]++
  return c
})

/* ---------- handlers ---------- */
// The grid watches `quickFilter` and `toggleableCols` (via columnVisibility), so
// these handlers only update local state — no grid-api plumbing here.
function onRowClicked(row) {
  selectedRecord.value = row
}

function toggleColumn(col) {
  col.visible = !col.visible
}

function onQuickFilter(e) {
  quickFilter.value = e.target.value
}

function clearFilters() {
  quickFilter.value = ''
  statusFilter.value = 'ALL'
  showToast('Filters cleared', 'info')
}

function refresh() {
  // simulate a refresh cycle
  lastRefreshed.value = stamp()
  gridRef.value?.flash()
  showToast('Grid refreshed', 'info')
}

// New records are stamped to the effective (possibly impersonated) user so they
// land in the right company pool. buildRecord/addRecords live in useRequests.
// The modal is a basket, so `forms` is an array of one or more locates.
function handleNewRequest(forms) {
  const built = addRecords(forms, effectiveUser.value.id)
  showModal.value = false
  prefillSecurity.value = null
  singleLocate.value = false
  activeView.value = 'requests'
  showToast(`Created ${built.length} locate${built.length === 1 ? '' : 's'}`, 'ok')
}

function handleBulkUpload(records) {
  const built = addRecords(records, effectiveUser.value.id)
  showUpload.value = false
  activeView.value = 'requests'
  showToast(`Imported ${built.length} locate${built.length === 1 ? '' : 's'}`, 'ok')
}

// "Run now" on a standing list — inject each item as a PENDING request.
function runStandingList(list) {
  const built = addRecords(list.items.map(it => ({
    type: 'BULK', ticker: it.ticker, security: it.security, isin: it.isin,
    locateBy: it.locateBy, qtyRequested: it.qtyRequested, marketValue: it.marketValue
  })), effectiveUser.value.id)
  activeView.value = 'requests'
  showToast(`Ran “${list.name}” · ${built.length} locate${built.length === 1 ? '' : 's'} submitted`, 'ok')
}

// "Locate" from the Availability view — open the request modal LOCKED to that one
// security (no add/remove, capped at the available quantity).
function locateFromAvailability(security) {
  prefillSecurity.value = security
  singleLocate.value = true
  showModal.value = true
}

let toastTimer
function showToast(msg, kind = 'ok') {
  toast.value = { msg, kind }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = null), 3200)
}
onBeforeUnmount(() => clearTimeout(toastTimer))
</script>

<template>
  <div class="app">
    <!-- Top bar -->
    <header class="topbar">
      <div class="brand">
        <img class="bank-logo" :src="scotiaLogo" alt="Scotiabank" />
        <span class="brand-divider"></span>
        <div>
          <div class="brand-title">Locates</div>
          <div class="brand-sub">Trading Request Portal</div>
        </div>
      </div>
      <div class="topbar-right">
        <span class="refreshed">Refreshed at <b>{{ lastRefreshed }}</b></span>
        <button class="theme-toggle" @click="toggleTheme"
                :title="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
                :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'">
          <svg v-if="theme === 'dark'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
        </button>
        <div class="user-menu">
          <button class="avatar" :class="{ imp: impersonating }"
                  @click="showUserMenu = !showUserMenu"
                  :aria-expanded="showUserMenu" aria-haspopup="true"
                  :title="effectiveUser.email">{{ effectiveUser.initials }}</button>
          <div v-if="showUserMenu" class="um-catch" @click="showUserMenu = false"></div>
          <div v-if="showUserMenu" class="um-panel">
            <div class="um-head">
              <div class="um-name">{{ realUser.name }}</div>
              <div class="um-mail">{{ realUser.email }}</div>
              <span class="um-role">{{ realUser.role }}</span>
            </div>
            <div v-if="impersonating" class="um-current">
              Viewing as <b>{{ impersonating.name }}</b>
              <button class="um-exit" @click="exitImpersonation">Exit</button>
            </div>
            <div class="um-sec">View as user</div>
            <button v-for="u in CLIENT_USERS" :key="u.id" class="um-opt"
                    :class="{ on: impersonatingId === u.id }" @click="impersonate(u)">
              <span class="um-ini">{{ u.initials }}</span>
              <span class="um-opt-main"><b>{{ u.name }}</b><small>{{ u.firm }}</small></span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Impersonation banner -->
    <ImpersonationBar v-if="impersonating" :user="impersonating" @exit="exitImpersonation" />

    <!-- View navigation -->
    <nav class="viewnav" aria-label="Sections">
      <button v-for="v in VIEWS" :key="v.id" class="vn-tab" :class="{ on: activeView === v.id }"
              :aria-current="activeView === v.id ? 'page' : undefined" @click="activeView = v.id">
        {{ v.label }}
      </button>
    </nav>

    <main class="content">
     <section v-if="activeView === 'requests'" class="view-grid">
      <!-- Page heading + primary action -->
      <div class="page-head">
        <div>
          <h1>Locate Requests</h1>
          <p>Two ways to add locates: <b>upload a file</b> of one or more, or <b>enter one manually</b>.</p>
        </div>
        <div class="head-actions">
          <button class="btn ghost lg" @click="showUpload = true">
            <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M12 3v13" /><path d="M7 8l5-5 5 5" /></svg>
            File Upload (1 or more)
          </button>
          <button class="btn primary lg" @click="singleLocate = false; prefillSecurity = null; showModal = true">
            <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
                 stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            New Locate Request
          </button>
        </div>
      </div>

      <!-- Status filter cards (a toggle group; selection is shown by icon + colour + border, never colour alone) -->
      <StatusFilterCards v-model="statusFilter" :counts="counts" class="stats-row"
                         aria-label="Filter requests by status" />

      <!-- Insights dashboard (collapsible) -->
      <RequestsInsights v-if="showInsights" :rows="scopedRows" />

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
                 aria-label="Search requests by ticker, SEDOL, ISIN or security"
                 placeholder="Search ticker, SEDOL, ISIN, security…" />
        </div>
        <div class="toolbar-actions">
          <button class="btn ghost" :class="{ open: showInsights }" @click="showInsights = !showInsights">
            <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18" /><path d="M7 14l3-4 3 3 4-6" /></svg>
            Insights
          </button>
          <button class="btn ghost" :class="{ open: isCompact }" @click="toggleDensity"
                  :title="isCompact ? 'Switch to comfortable rows' : 'Switch to compact rows'">
            <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
            {{ isCompact ? 'Compact' : 'Comfortable' }}
          </button>
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
      <LocateGrid ref="gridRef" :rows="filteredRows" :quick-filter-text="quickFilter"
                  :column-visibility="toggleableCols" @select="onRowClicked" />
     </section>

      <!-- Standing Lists view -->
      <StandingLists v-else-if="activeView === 'standing'" class="view-scroll" @run="runStandingList" />

      <!-- Availability view -->
      <AvailabilityView v-else-if="activeView === 'availability'" class="view-scroll" @locate="locateFromAvailability" />

      <!-- Locate History view (read-only, company-scoped archive) -->
      <LocateHistory v-else-if="activeView === 'history'" class="view-grid" :viewedUser="impersonating"
                     @select="selectedRecord = $event" />
    </main>

    <!-- Modal -->
    <NewRequestModal v-if="showModal" :prefill="prefillSecurity" :single="singleLocate"
                     @close="showModal = false; prefillSecurity = null; singleLocate = false" @submit="handleNewRequest" />

    <!-- Bulk upload -->
    <FileUploadModal v-if="showUpload" @close="showUpload = false" @submit="handleBulkUpload" />

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
.app { height: 100%; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }

/* Top bar */
.topbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 24px; height: 60px;
  background: var(--brand-500);
  color: #fff;
}
.brand { display: flex; align-items: center; gap: 14px; }
.bank-logo {
  height: 21px; width: auto;
  /* logo ships in Scotia red; render white on the red bar */
  filter: brightness(0) invert(1);
}
.brand-divider { width: 1px; height: 26px; background: rgba(255,255,255,.28); }
.brand-title { font-weight: 700; font-size: 15px; letter-spacing: .02em; }
.brand-sub { font-size: 11px; color: rgba(255,255,255,.72); }
.topbar-right { display: flex; align-items: center; gap: 16px; }
.theme-toggle {
  width: 34px; height: 34px; border-radius: 50%; border: none;
  background: rgba(255,255,255,.16); color: #fff;
  display: grid; place-items: center; transition: background .12s;
}
.theme-toggle:hover { background: rgba(255,255,255,.28); }
.theme-toggle svg { width: 17px; height: 17px; }
.refreshed { font-size: 12px; color: rgba(255,255,255,.78); }
.refreshed b { color: #fff; font-weight: 600; }
.avatar {
  width: 34px; height: 34px; border-radius: 50%; border: none;
  background: rgba(255,255,255,.16); color: #fff;
  display: grid; place-items: center; font-size: 12px; font-weight: 700;
}
.avatar.imp { box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--brand-900); }

/* User / impersonation menu */
.user-menu { position: relative; }
.um-catch { position: fixed; inset: 0; z-index: 39; }
.um-panel {
  position: absolute; right: 0; top: calc(100% + 8px); z-index: 40;
  width: 268px; background: var(--surface); color: var(--text);
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  box-shadow: var(--shadow); padding: 8px;
}
.um-head { padding: 8px 10px 10px; border-bottom: 1px solid var(--border-2); }
.um-name { font-size: 13px; font-weight: 700; }
.um-mail { font-size: 11.5px; color: var(--text-soft); }
.um-role { display: inline-block; margin-top: 6px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--brand-700); background: var(--brand-50); border-radius: 99px; padding: 2px 8px; }
.um-current {
  display: flex; align-items: center; gap: 6px; margin: 8px 0; padding: 8px 10px;
  background: var(--warn-bg); color: var(--warn); border-radius: var(--radius-sm); font-size: 12px;
}
.um-current b { font-weight: 700; }
.um-exit { margin-left: auto; border: none; background: var(--warn); color: #fff; border-radius: var(--radius-sm); padding: 3px 10px; font-size: 11.5px; font-weight: 600; }
.um-sec { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--text-mute); padding: 8px 10px 4px; }
.um-opt { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; background: transparent; border: none; border-radius: var(--radius-sm); padding: 7px 10px; }
.um-opt:hover { background: var(--surface-2); }
.um-opt.on { background: var(--brand-50); }
.um-ini { width: 28px; height: 28px; border-radius: 50%; background: var(--surface-2); border: 1px solid var(--border); display: grid; place-items: center; font-size: 11px; font-weight: 700; color: var(--text-soft); }
.um-opt-main { display: flex; flex-direction: column; line-height: 1.3; }
.um-opt-main b { font-size: 13px; font-weight: 600; }
.um-opt-main small { font-size: 11px; color: var(--text-soft); }

/* View navigation */
.viewnav {
  display: flex; gap: 2px; padding: 0 28px;
  background: var(--surface); border-bottom: 1px solid var(--border);
}
.vn-tab {
  background: transparent; border: none; padding: 13px 16px;
  font-size: 13.5px; font-weight: 600; color: var(--text-soft);
  border-bottom: 2px solid transparent; margin-bottom: -1px;
}
.vn-tab:hover { color: var(--text); }
.vn-tab.on { color: var(--brand-700); border-bottom-color: var(--brand-500); }

.head-actions { display: flex; gap: 10px; }

/* Content */
.content {
  padding: 24px 28px 28px; max-width: 1500px; width: 100%; margin: 0 auto;
  flex: 1; min-height: 0; display: flex; flex-direction: column;
}
/* Grid views fill the viewport and scroll their rows internally (the page itself
   doesn't scroll); other views scroll normally. */
.view-grid { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.view-scroll { flex: 1; min-height: 0; overflow-y: auto; }

.page-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 16px; }
.page-head h1 { margin: 0; font-size: 22px; letter-spacing: -.01em; }
.page-head p { margin: 5px 0 0; color: var(--text-soft); font-size: 13px; }

/* Buttons */
.btn {
  border: 1px solid transparent; border-radius: var(--radius-sm);
  padding: 9px 16px; font-size: 13px; font-weight: 600;
  display: inline-flex; align-items: center; gap: 7px;
  transition: background .12s, border-color .12s, color .12s;
}
.btn.primary { background: var(--brand-500); color: #fff; }
.btn.primary:hover { background: var(--brand-700); }
.btn.lg { padding: 11px 20px; font-size: 14px; }
.btn .ic { width: 15px; height: 15px; flex: none; }
.btn.ghost { background: var(--surface); border-color: var(--border); color: var(--text-soft); }
.btn.ghost:hover { background: var(--surface-2); border-color: var(--text-mute); }

/* Status filter cards live in <StatusFilterCards>; only the page spacing is here.
   (The card root is in this component's scope too, so the class applies.) */
.stats-row { margin-bottom: 16px; }

/* Toolbar */
.toolbar {
  display: flex; justify-content: space-between; align-items: center;
  gap: 12px; margin-bottom: 12px;
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
  transition: border-color .12s;
}
.search input:focus { border-color: var(--brand-500); }
.toolbar-actions { display: flex; gap: 8px; }

/* Discoverability hint */
.grid-hint {
  margin: 0 0 10px; font-size: 12.5px; color: var(--text-soft);
}
.grid-hint b { color: var(--text); font-weight: 600; }

/* Column chooser */
.col-chooser { position: relative; }
.btn.ghost.open { border-color: var(--brand-500); color: var(--brand-700); background: var(--brand-50); }
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
  box-shadow: var(--shadow); padding: 8px;
}
.col-panel-head {
  font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
  color: var(--text-mute); padding: 6px 8px 8px;
}
.col-opt {
  display: flex; align-items: center; gap: 9px;
  padding: 7px 8px; border-radius: var(--radius-sm); font-size: 13px; cursor: pointer;
}
.col-opt:hover { background: var(--surface-2); }
.col-opt input { width: 15px; height: 15px; accent-color: var(--brand-500); cursor: pointer; }
.col-hint {
  margin: 6px 8px 2px; padding-top: 8px; border-top: 1px solid var(--border-2);
  font-size: 11px; color: var(--text-mute); line-height: 1.4;
}

/* Toast */
.toast {
  position: fixed; right: 24px; bottom: 24px;
  display: flex; align-items: center; gap: 10px;
  padding: 13px 18px; border-radius: var(--radius);
  background: var(--surface); color: var(--text);
  box-shadow: var(--shadow); font-size: 13px; font-weight: 500;
  border: 1px solid var(--border); z-index: 60;
}
.toast.ok { border-left: 3px solid var(--ok); }
.toast.info { border-left: 3px solid var(--brand-500); }
.toast-ico {
  width: 22px; height: 22px; border-radius: 50%;
  display: grid; place-items: center; color: #fff; font-size: 12px;
}
.toast-ico svg { width: 13px; height: 13px; }
.toast.ok .toast-ico { background: var(--ok); }
.toast.info .toast-ico { background: var(--brand-500); }
.toast-enter-active, .toast-leave-active { transition: opacity .18s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; }

@media (max-width: 760px) {
  .page-head { flex-direction: column; align-items: stretch; gap: 14px; }
}
</style>
