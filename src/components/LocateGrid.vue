<script setup>
import { ref, shallowRef, watch } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import { makeLocateColumns, defaultColDef } from './locateColumns.js'
import { useTheme } from '../composables/useTheme.js'
import { useDensity } from '../composables/useDensity.js'

// Shared locate grid used by both Locate Requests and Locate History. Owns the AG
// Grid instance, the column definitions, the light/dark theme class and the row
// density wiring — so a change to any of those is a single-file edit. The page
// supplies the rows, the quick-filter text and which reference columns are
// visible; the grid emits `select` when a row is opened (click or Enter/Space).
const props = defineProps({
  rows: { type: Array, default: () => [] },
  quickFilterText: { type: String, default: '' },
  // [{ field, visible }] — the column-chooser state to mirror onto the grid.
  columnVisibility: { type: Array, default: () => [] }
})
const emit = defineEmits(['select'])

const { isDark } = useTheme()
const { rowHeight } = useDensity()

const columnDefs = ref(makeLocateColumns())
const gridApi = shallowRef(null)

function onGridReady(params) {
  gridApi.value = params.api
  applyColumnVisibility()
  applyQuickFilter()
}
function onRowClicked(e) { emit('select', e.data) }
// Keyboard parity: open the row with Enter/Space on the focused cell.
function onCellKeyDown(e) {
  if (e.event?.key === 'Enter' || e.event?.key === ' ') {
    e.event.preventDefault()
    emit('select', e.data)
  }
}

function applyQuickFilter() {
  gridApi.value?.setGridOption('quickFilterText', props.quickFilterText)
}
function applyColumnVisibility() {
  for (const c of props.columnVisibility) gridApi.value?.setColumnsVisible([c.field], c.visible)
}

watch(() => props.quickFilterText, applyQuickFilter)
watch(() => props.columnVisibility, applyColumnVisibility, { deep: true })
// Re-flow rows when the density (row height) changes so they pick up the new size.
watch(rowHeight, () => gridApi.value?.resetRowHeights())

// Flash the rendered rows — a subtle "data refreshed" cue (used by Requests).
function flash() {
  gridApi.value?.flashCells({ rowNodes: gridApi.value.getRenderedNodes?.() })
}
defineExpose({ flash })
</script>

<template>
  <!-- The grid sizes to its rows (autoHeight → no empty space below them); this
       area takes the remaining height and scrolls internally so the page itself
       doesn't scroll. -->
  <div class="lg-area">
    <div class="lg-wrap" :class="isDark ? 'ag-theme-quartz-dark' : 'ag-theme-quartz'">
      <!-- NOTE: domLayout="autoHeight" renders every row (no virtualization); safe
           while pagination caps the page at 10–50 rows. Revisit (fixed height +
           domLayout="normal") before this backs a large, unpaginated dataset. -->
      <AgGridVue
        class="grid"
        :columnDefs="columnDefs"
        :rowData="rows"
        :defaultColDef="defaultColDef"
        :rowHeight="rowHeight"
        :headerHeight="46"
        :pagination="true"
        :paginationPageSize="10"
        :paginationPageSizeSelector="[10, 25, 50]"
        domLayout="autoHeight"
        :animateRows="true"
        rowSelection="single"
        @grid-ready="onGridReady"
        @row-clicked="onRowClicked"
        @cell-key-down="onCellKeyDown"
      />
    </div>
  </div>
</template>

<style scoped>
.lg-area { flex: 1; min-height: 0; overflow-y: auto; }
.lg-wrap {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  /* Lift the white table off the tinted page background so it reads as a
     distinct surface, not floating numbers. */
  box-shadow: var(--shadow);
}
.grid { width: 100%;
  --ag-font-family: var(--font);
  --ag-font-size: 13px;
  --ag-foreground-color: var(--text);
  /* Darker text on a distinctly tinted band so the header reads as a header. */
  --ag-header-foreground-color: var(--text);
  --ag-background-color: var(--surface);
  --ag-header-background-color: var(--grid-header-bg);
  /* Stronger zebra + row borders to help the eye track a row across to the
     right-hand quantity columns. */
  --ag-odd-row-background-color: var(--grid-zebra);
  --ag-row-hover-color: var(--brand-50);
  --ag-selected-row-background-color: var(--brand-50);
  --ag-border-color: var(--border);
  --ag-cell-horizontal-padding: 14px;
  --ag-borders: none;
  --ag-row-border-color: var(--border);
}
</style>

<style>
/* Global AG Grid cell helpers + theme overrides (un-scoped so they reach
   grid-rendered cells, which live outside this component's scoped styles). */
.mono-cell { font-family: var(--mono); font-size: 12.5px; color: var(--text-soft); }
/* Right-align numeric cell VALUES without flipping the header (label stays left, filter right). */
.num-cell { text-align: right; }
.strong-cell { font-weight: 600; }
.appr-pos { color: var(--ok); font-weight: 600; }
.appr-zero { color: var(--text-mute); }
.pend-pos { color: var(--warn); font-weight: 600; }
.rej-pos  { color: var(--bad);  font-weight: 600; }
/* Status word colored by value (also a fallback if the badge renderer is bypassed) */
.status-ok   { color: var(--ok);   font-weight: 700; }
.status-warn { color: var(--warn); font-weight: 700; }
.status-bad  { color: var(--bad);  font-weight: 700; }
/* Quartz rounds its own .ag-root-wrapper (8px), mismatching the wrap radius and
   showing a notch at the top corners. Flatten the inner wrapper so .lg-wrap
   (overflow:hidden + --radius) owns the single rounding. Selectors target BOTH
   the light and dark Quartz themes. */
:is(.ag-theme-quartz, .ag-theme-quartz-dark) .ag-root-wrapper { border: none; border-radius: 0; }
/* Ease the row-height change on the density toggle so it glides instead of snapping. */
:is(.ag-theme-quartz, .ag-theme-quartz-dark) .ag-row { transition: height .28s ease, transform .28s ease; }
:is(.ag-theme-quartz, .ag-theme-quartz-dark) .ag-cell { transition: height .28s ease; }
@media (prefers-reduced-motion: reduce) {
  :is(.ag-theme-quartz, .ag-theme-quartz-dark) .ag-row,
  :is(.ag-theme-quartz, .ag-theme-quartz-dark) .ag-cell { transition: none; }
}
:is(.ag-theme-quartz, .ag-theme-quartz-dark) .ag-header-cell-text { font-weight: 700; letter-spacing: .02em; color: var(--text); }
/* A firm 2px rule under the header band so it clearly separates from the rows. */
:is(.ag-theme-quartz, .ag-theme-quartz-dark) .ag-header { border-bottom: 2px solid var(--border); }
/* Faint vertical guides between header columns to anchor the right-hand numbers. */
:is(.ag-theme-quartz, .ag-theme-quartz-dark) .ag-header-cell:not(:last-child)::after {
  content: ''; position: absolute; right: 0; top: 25%; height: 50%;
  width: 1px; background: var(--border);
}
:is(.ag-theme-quartz, .ag-theme-quartz-dark) .ag-row { cursor: pointer; }
</style>
