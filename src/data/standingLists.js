// Seed standing lists — a saved, reusable set of securities the desk can run on a
// schedule (the FY26 "create & save a standing list & schedule it" ask). These
// seed the localStorage store on first load; the user's edits persist thereafter.

export const FREQUENCIES = [
  { value: 'DAILY',    label: 'Daily' },
  { value: 'WEEKDAYS', label: 'Weekdays' },
  { value: 'WEEKLY',   label: 'Weekly (Mon)' }
]

const pad = (n) => String(n).padStart(2, '0')
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`

export function scheduleSummary(schedule) {
  if (!schedule) return '—'
  const f = FREQUENCIES.find(x => x.value === schedule.frequency)
  return `${f ? f.label : schedule.frequency} at ${schedule.time}`
}

// Compute the next firing time from "now" for a schedule. Pure date math — runs at
// app runtime (not in a workflow) so `new Date()` is fine here.
export function nextRun(schedule, from = new Date()) {
  if (!schedule || !schedule.time) return null
  const [h, m] = schedule.time.split(':').map(Number)
  const candidate = new Date(from)
  candidate.setHours(h, m, 0, 0)
  if (candidate <= from) candidate.setDate(candidate.getDate() + 1)
  // Advance to the next day that satisfies the frequency.
  for (let i = 0; i < 14; i++) {
    const day = candidate.getDay() // 0 Sun … 6 Sat
    const ok =
      schedule.frequency === 'DAILY' ||
      (schedule.frequency === 'WEEKDAYS' && day >= 1 && day <= 5) ||
      (schedule.frequency === 'WEEKLY' && day === 1)
    if (ok) return fmt(candidate)
    candidate.setDate(candidate.getDate() + 1)
  }
  return fmt(candidate)
}

export const seedStandingLists = [
  {
    id: 'sl-1',
    name: 'Morning Tech Basket',
    owner: 'gf',
    enabled: true,
    schedule: { frequency: 'WEEKDAYS', time: '08:00' },
    lastRun: '2026-06-11 08:00',
    items: [
      { ticker: 'AAPL', security: 'Apple Inc',           isin: 'US0378331005', locateBy: 'SHARES', qtyRequested: 5000, marketValue: null },
      { ticker: 'MSFT', security: 'Microsoft Corp',      isin: 'US5949181045', locateBy: 'SHARES', qtyRequested: 3000, marketValue: null },
      { ticker: 'NVDA', security: 'NVIDIA Corp',         isin: 'US67066G1040', locateBy: 'SHARES', qtyRequested: 4000, marketValue: null }
    ]
  },
  {
    id: 'sl-2',
    name: 'Hard-to-Borrow Watch',
    owner: 'gf',
    enabled: false,
    schedule: { frequency: 'DAILY', time: '06:30' },
    lastRun: null,
    items: [
      { ticker: 'TSLA', security: 'Tesla Inc',     isin: 'US88160R1014', locateBy: 'MARKET_VALUE', qtyRequested: null, marketValue: 1000000 },
      { ticker: 'GME',  security: 'GameStop Corp', isin: '',             locateBy: 'SHARES',       qtyRequested: 2500,  marketValue: null }
    ]
  }
]
