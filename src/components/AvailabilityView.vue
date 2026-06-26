<script setup>
import { ref, computed } from 'vue'
import { generateSnapshot } from '../data/availabilitySnapshot.js'
import { downloadCsv } from '../utils/csv.js'
import { stamp } from '../utils/datetime.js'

// Availability = real-time client inventory (FY26 ask). The live feed is a future
// webservice, so this simulates an hourly fetch: a SINGLE current-hour snapshot,
// regenerated fresh each time the view mounts (i.e. each visit), so only the
// newest inventory is shown and locatable. "Locate" on a row opens the request
// modal prefilled with that security.
const emit = defineEmits(['locate'])

// Generated once per mount, and re-pulled on demand via Refresh. `asOf` stamps the
// exact moment of each fetch (mount or Refresh), so it reflects "now".
const asOf = ref(stamp())
const snapshot = ref(generateSnapshot())

// Only locatable rows are shown — a security with 0 available isn't borrowable, so
// there's no point listing it.
const rows = computed(() => snapshot.value.filter(r => r.availableQty > 0))

// Manual re-pull of the feed — re-stamps "as of" to the current moment.
function refresh() {
  snapshot.value = generateSnapshot()
  asOf.value = stamp()
  page.value = 0
}

// --- pagination (volume effect for the demo) ---
const pageSize = ref(15)
const page = ref(0)
const pageCount = computed(() => Math.max(1, Math.ceil(rows.value.length / pageSize.value)))
const pageRows = computed(() => {
  const start = page.value * pageSize.value
  return rows.value.slice(start, start + pageSize.value)
})
function setPageSize(e) { pageSize.value = Number(e.target.value); page.value = 0 }
function prev() { if (page.value > 0) page.value-- }
function next() { if (page.value < pageCount.value - 1) page.value++ }

function locate(row) {
  // Open the request modal LOCKED to this single security: carry its identifiers,
  // the available quantity as a hard cap, and country. The user can only request
  // this security, up to the available amount.
  emit('locate', {
    ticker: row.ticker, name: row.security, sedol: row.sedol, isin: row.isin,
    country: row.country, locateBy: 'SHARES',
    qtyRequested: row.availableQty, availableQty: row.availableQty
  })
}

function download() {
  downloadCsv(`availability_${asOf.value.replace(/[ :]/g, '-')}.csv`, rows.value, [
    { key: 'ticker', header: 'Ticker' },
    { key: 'sedol', header: 'SEDOL' },
    { key: 'security', header: 'Security' },
    { key: 'country', header: 'Country' },
    { key: 'isin', header: 'ISIN' },
    { key: 'availableQty', header: 'Available Qty' },
    { key: 'rate', header: 'Rate %' }
  ])
}

function fmtRate(r) { return r.toFixed(2) + '%' }
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1>Availability</h1>
        <p>Real-time client inventory. Click <b>Locate</b> to start a request.</p>
      </div>
      <div class="head-actions">
        <span class="asof">As of <b>{{ asOf }}</b> · {{ rows.length }} securities</span>
        <button class="btn ghost lg" @click="refresh">
          <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></svg>
          Refresh
        </button>
        <button class="btn ghost lg" @click="download">
          <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg>
          Download
        </button>
      </div>
    </div>

    <p class="mock-banner">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.5" /></svg>
      Sample data — simulating an hourly inventory fetch. The live availability feed is wired in with the future webservice.
    </p>

    <div class="tbl-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th>Ticker</th><th>SEDOL</th><th>Security</th><th>Country</th>
            <th class="num">Available</th><th class="num">Rate</th><th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in pageRows" :key="r.ticker">
            <td class="tkr">{{ r.ticker }}</td>
            <td class="mono">{{ r.sedol || '—' }}</td>
            <td class="name">{{ r.security }}</td>
            <td class="country">{{ r.country }}</td>
            <td class="num mono">{{ r.availableQty.toLocaleString() }}</td>
            <td class="num mono" :class="{ htb: r.rate >= 10 }">{{ fmtRate(r.rate) }}</td>
            <td class="act">
              <button class="btn ghost sm" @click="locate(r)">Locate</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pager">
      <label class="psize">
        Rows per page
        <select :value="pageSize" @change="setPageSize">
          <option :value="15">15</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
        </select>
      </label>
      <span class="pinfo">Page {{ page + 1 }} of {{ pageCount }}</span>
      <div class="pbtns">
        <button class="btn ghost sm" :disabled="page === 0" @click="prev">Prev</button>
        <button class="btn ghost sm" :disabled="page >= pageCount - 1" @click="next">Next</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; gap: 16px; }
.page-head h1 { margin: 0; font-size: 22px; letter-spacing: -.01em; }
.page-head p { margin: 5px 0 0; color: var(--text-soft); font-size: 13px; }
.page-head b { color: var(--text); }
.head-actions { display: flex; align-items: center; gap: 14px; }
.asof { font-size: 12.5px; color: var(--text-soft); white-space: nowrap; }
.asof b { color: var(--text); font-weight: 600; }

.mock-banner {
  display: flex; align-items: center; gap: 9px; margin: 0 0 18px;
  padding: 10px 14px; border-radius: var(--radius-sm);
  background: var(--warn-bg); color: var(--warn); font-size: 12.5px;
}
.mock-banner svg { width: 16px; height: 16px; flex: none; }

.tbl-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); }
.tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
.tbl th {
  text-align: left; padding: 11px 16px; background: var(--surface-2); color: var(--text-soft);
  font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: .03em; border-bottom: 1px solid var(--border);
}
.tbl th.num, .tbl td.num { text-align: right; }
.tbl td { padding: 11px 16px; border-bottom: 1px solid var(--border-2); }
.tbl tr:last-child td { border-bottom: none; }
.tbl tr:hover td { background: var(--brand-50); }
.tkr { font-weight: 700; }
.name { color: var(--text-soft); }
.country { color: var(--text-soft); font-size: 12.5px; }
.mono { font-family: var(--mono); font-size: 12.5px; }
.htb { color: var(--bad); font-weight: 700; }
.act { text-align: right; }

.btn { border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 6px 14px; font-size: 12.5px; font-weight: 600; background: var(--surface); color: var(--text-soft); display: inline-flex; align-items: center; gap: 6px; transition: background .12s, border-color .12s, color .12s; }
.btn:hover { background: var(--brand-50); border-color: var(--brand-500); color: var(--brand-700); }
.btn.lg { padding: 9px 16px; font-size: 13px; }
.btn .ic { width: 15px; height: 15px; }
.btn:disabled { opacity: .5; cursor: not-allowed; background: var(--surface); border-color: var(--border); color: var(--text-mute); }

.pager { display: flex; align-items: center; gap: 18px; margin-top: 14px; }
.psize { display: inline-flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--text-soft); }
.psize select { font-family: inherit; font-size: 12.5px; padding: 5px 8px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); }
.pinfo { font-size: 12.5px; color: var(--text-soft); margin-left: auto; }
.pbtns { display: flex; gap: 8px; }
</style>
