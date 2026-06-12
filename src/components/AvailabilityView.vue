<script setup>
import { ref, computed } from 'vue'
import { availabilityFiles, availabilityRows } from '../data/availability.js'
import { findSecurity } from '../data/securities.js'

// Availability files view (FY26 ask: surface availability inside the portal). The
// live feed is a future webservice, so this renders sample files behind a clear
// banner. "Locate" on a row opens the request modal prefilled with that security.
const emit = defineEmits(['locate'])

const activeFile = ref(availabilityFiles[0].id)
const rows = computed(() => availabilityRows[activeFile.value] || [])

function locate(row) {
  const sec = findSecurity({ ticker: row.ticker }) || { ticker: row.ticker, name: row.security }
  emit('locate', sec)
}
function fmtRate(r) { return r.toFixed(2) + '%' }
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1>Availability</h1>
        <p>Locatable inventory by file. Click <b>Locate</b> to start a request.</p>
      </div>
    </div>

    <p class="mock-banner">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.5" /></svg>
      Sample data — the live availability feed is wired in with the future webservice.
    </p>

    <div class="layout">
      <!-- File list -->
      <aside class="files">
        <div class="files-head">Files</div>
        <button v-for="f in availabilityFiles" :key="f.id"
                class="file" :class="{ active: activeFile === f.id }" @click="activeFile = f.id">
          <span class="f-name">{{ f.name }}</span>
          <span class="f-meta">{{ f.source }} · {{ f.rows }} rows</span>
          <span class="f-asof">As of {{ f.asOf }}</span>
        </button>
      </aside>

      <!-- Availability table -->
      <div class="tbl-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>Ticker</th><th>Security</th>
              <th class="num">Available</th><th class="num">Rate</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.ticker">
              <td class="tkr">{{ r.ticker }}</td>
              <td class="name">{{ r.security }}</td>
              <td class="num mono">{{ r.availableQty.toLocaleString() }}</td>
              <td class="num mono" :class="{ htb: r.rate >= 10 }">{{ fmtRate(r.rate) }}</td>
              <td class="act">
                <button class="btn ghost sm" @click="locate(r)">Locate</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-head { margin-bottom: 16px; }
.page-head h1 { margin: 0; font-size: 22px; letter-spacing: -.01em; }
.page-head p { margin: 5px 0 0; color: var(--text-soft); font-size: 13px; }
.page-head b { color: var(--text); }

.mock-banner {
  display: flex; align-items: center; gap: 9px; margin: 0 0 18px;
  padding: 10px 14px; border-radius: var(--radius-sm);
  background: var(--warn-bg); color: var(--warn); font-size: 12.5px;
}
.mock-banner svg { width: 16px; height: 16px; flex: none; }

.layout { display: grid; grid-template-columns: 260px 1fr; gap: 18px; align-items: start; }

.files { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 8px; }
.files-head { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--text-mute); padding: 8px 10px; }
.file { display: flex; flex-direction: column; gap: 2px; width: 100%; text-align: left; background: transparent; border: 1px solid transparent; border-radius: var(--radius-sm); padding: 10px; }
.file:hover { background: var(--surface-2); }
.file.active { background: var(--brand-50); border-color: var(--brand-500); }
.f-name { font-size: 12.5px; font-weight: 600; color: var(--text); }
.f-meta { font-size: 11px; color: var(--text-soft); }
.f-asof { font-size: 11px; color: var(--text-mute); }

.tbl-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
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
.mono { font-family: var(--mono); font-size: 12.5px; }
.htb { color: var(--bad); font-weight: 700; }
.act { text-align: right; }
.btn { border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 6px 14px; font-size: 12.5px; font-weight: 600; background: var(--surface); color: var(--text-soft); transition: background .12s, border-color .12s, color .12s; }
.btn:hover { background: var(--brand-50); border-color: var(--brand-500); color: var(--brand-700); }

@media (max-width: 720px) { .layout { grid-template-columns: 1fr; } }
</style>
