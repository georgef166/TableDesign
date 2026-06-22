<script setup>
import { ref } from 'vue'
import { useLocalStore } from '../composables/useLocalStore.js'
import { seedStandingLists, scheduleSummary, nextRun } from '../data/standingLists.js'
import { stampShort } from '../utils/datetime.js'
import StandingListModal from './StandingListModal.vue'

// Standing Lists view. Lists persist to localStorage (mock — the real scheduler is
// a future webservice). "Run now" injects the list's securities into the live grid
// to demonstrate the schedule firing end-to-end.
const emit = defineEmits(['run'])

const lists = useLocalStore('standing-lists', [], seedStandingLists)
const showModal = ref(false)
const editing = ref(null)
let seq = Date.now()

function openNew() { editing.value = null; showModal.value = true }
function openEdit(list) { editing.value = list; showModal.value = true }

function onSave(list) {
  if (list.id) {
    const i = lists.value.findIndex(l => l.id === list.id)
    if (i !== -1) lists.value[i] = list
  } else {
    list.id = 'sl-' + (++seq)
    lists.value = [list, ...lists.value]
  }
  showModal.value = false
}

function remove(list) { lists.value = lists.value.filter(l => l.id !== list.id) }
function toggle(list) { list.enabled = !list.enabled }

function runNow(list) {
  emit('run', list)
  list.lastRun = stampShort()
}
</script>

<template>
  <div>
    <div class="page-head">
      <div>
        <h1>Schedule List</h1>
        <p>Save reusable baskets and schedule them to submit automatically.</p>
      </div>
      <button class="btn primary lg" @click="openNew">
        <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
             stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14" /></svg>
        New Schedule List
      </button>
    </div>

    <p class="mock-banner">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.5" /></svg>
      Scheduling runs as a local mock for now — automatic submission is wired up with the future webservice. Use <b>Run now</b> to preview a run.
    </p>

    <div v-if="!lists.length" class="empty">No schedule lists yet. Create one to get started.</div>

    <div v-else class="cards">
      <article v-for="list in lists" :key="list.id" class="card" :class="{ off: !list.enabled }">
        <div class="card-top">
          <div>
            <h3>{{ list.name }}</h3>
            <span class="meta">{{ list.items.length }} securit{{ list.items.length === 1 ? 'y' : 'ies' }} · {{ scheduleSummary(list.schedule) }}</span>
          </div>
          <label class="switch" :title="list.enabled ? 'Enabled' : 'Disabled'">
            <input type="checkbox" :checked="list.enabled" @change="toggle(list)" />
            <span class="track"><span class="thumb"></span></span>
          </label>
        </div>

        <div class="tickers">
          <span v-for="it in list.items" :key="it.ticker" class="tk">{{ it.ticker }}</span>
        </div>

        <dl class="runs">
          <div><dt>Next run</dt><dd>{{ list.enabled ? (nextRun(list.schedule) || '—') : 'Paused' }}</dd></div>
          <div><dt>Last run</dt><dd>{{ list.lastRun || 'Never' }}</dd></div>
        </dl>

        <div class="card-actions">
          <button class="btn primary sm" @click="runNow(list)">
            <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
                 stroke-linecap="round" stroke-linejoin="round"><path d="M6 4l14 8-14 8z" /></svg>
            Run now
          </button>
          <button class="btn ghost sm" @click="openEdit(list)">Edit</button>
          <button class="btn ghost sm danger" @click="remove(list)">Delete</button>
        </div>
      </article>
    </div>

    <StandingListModal v-if="showModal" :list="editing" @close="showModal = false" @save="onSave" />
  </div>
</template>

<style scoped>
.page-head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; }
.page-head h1 { margin: 0; font-size: 22px; letter-spacing: -.01em; }
.page-head p { margin: 5px 0 0; color: var(--text-soft); font-size: 13px; }

.mock-banner {
  display: flex; align-items: center; gap: 9px; margin: 0 0 18px;
  padding: 10px 14px; border-radius: var(--radius-sm);
  background: var(--warn-bg); color: var(--warn); font-size: 12.5px;
}
.mock-banner svg { width: 16px; height: 16px; flex: none; }
.mock-banner b { font-weight: 700; }

.empty { padding: 48px; text-align: center; color: var(--text-mute); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }

.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; display: flex; flex-direction: column; gap: 16px; min-height: 220px; }
.card.off { opacity: .72; }
.card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.card-top h3 { margin: 0 0 4px; font-size: 17px; }
.meta { font-size: 12px; color: var(--text-soft); }

.tickers { display: flex; flex-wrap: wrap; gap: 6px; }
.tk { font-family: var(--mono); font-size: 11.5px; font-weight: 600; color: var(--text-soft); background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 3px 8px; }

.runs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 0; }
.runs dt { font-size: 10.5px; text-transform: uppercase; letter-spacing: .04em; color: var(--text-mute); }
.runs dd { margin: 2px 0 0; font-size: 12.5px; font-family: var(--mono); color: var(--text); }

.card-actions { display: flex; gap: 8px; margin-top: auto; }
.btn { border: 1px solid transparent; border-radius: var(--radius-sm); padding: 9px 16px; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; transition: background .12s, border-color .12s; }
.btn .ic { width: 14px; height: 14px; }
.btn.lg { padding: 11px 20px; font-size: 14px; }
.btn.sm { padding: 7px 12px; font-size: 12.5px; }
.btn.primary { background: var(--brand-500); color: #fff; }
.btn.primary:hover { background: var(--brand-700); }
.btn.ghost { background: var(--surface); border-color: var(--border); color: var(--text-soft); }
.btn.ghost:hover { background: var(--surface-2); border-color: var(--text-mute); }
.btn.ghost.danger:hover { background: var(--bad-bg); border-color: var(--bad); color: var(--bad); }

/* Enable/disable switch */
.switch { display: inline-flex; cursor: pointer; }
.switch input { position: absolute; opacity: 0; width: 0; height: 0; }
.track { width: 36px; height: 20px; border-radius: 99px; background: var(--border); position: relative; transition: background .15s; }
.thumb { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: transform .15s; box-shadow: 0 1px 2px rgba(0,0,0,.2); }
.switch input:checked + .track { background: var(--ok); }
.switch input:checked + .track .thumb { transform: translateX(16px); }
.switch input:focus-visible + .track { outline: 2px solid var(--brand-500); outline-offset: 2px; }
</style>
