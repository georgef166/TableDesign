// Single source of truth for locate-request records, shared by the Requests grid
// and the Locate History tab. The store is module-level (a singleton) so both
// views and the create/import handlers mutate the same reactive array.
//
// Persistence: backed by sessionStorage so created/imported locates survive a
// reload within the tab but reset when the tab/session closes — the FY26 "same
// company sees the same stuff" expectation for the mock, without leaving stale
// data across sessions. NOTE: useSessionStore only writes the seed when the key
// is ABSENT, so the key is versioned — bump the suffix whenever `seedLocates`
// changes, or testers reusing a tab will keep their stale `talp-locate:*` data.
import { useSessionStore } from './useSessionStore.js'
import { seedLocates } from '../data/locates.js'
import { firmOf } from '../data/users.js'
import { stamp } from '../utils/datetime.js'

const rows = useSessionStore('locate-requests-v2', [], seedLocates)

// IDs continue past the highest persisted record so reloads don't collide.
let nextId = Math.max(0, ...rows.value.map(r => r.id || 0)) + 1

// Build a PENDING locate from a partial form (shared by the single-request modal,
// the bulk uploader and standing-list runs). `requesterId` stamps ownership to the
// effective (possibly impersonated) user so firm-scoping works.
function buildRecord(form, requesterId) {
  const id = nextId++
  return {
    id,
    requestDate: stamp(),
    type: form.type || 'MANUAL',
    batchId: 608262 + id,
    locateId: 93995504 + id,
    status: 'PENDING',
    sedol: form.sedol || '',
    isin: form.isin || '',
    ric: form.ric || '',
    cusip: form.cusip || '',
    ticker: form.ticker,
    bbgTicker: form.bbgTicker || (form.ticker ? `${form.ticker} US` : ''),
    security: form.security,
    qtyRequested: form.qtyRequested || 0,
    qtyApproved: 0,
    requester: requesterId,
    locateBy: form.locateBy || 'SHARES',
    marketValue: form.marketValue ?? null
  }
}

// Prepend newly-built records to the grid. Returns the built records.
function addRecords(forms, requesterId) {
  const built = forms.map(f => buildRecord(f, requesterId))
  rows.value = [...built, ...rows.value]
  return built
}

// Scope a list to a viewed user's company. `viewedUser` is the impersonated
// client (or null for the admin, who sees every firm).
function scopeByFirm(list, viewedUser) {
  if (!viewedUser) return list
  return list.filter(r => firmOf(r.requester) === viewedUser.firm)
}

export function useRequests() {
  return { rows, buildRecord, addRecords, scopeByFirm }
}
