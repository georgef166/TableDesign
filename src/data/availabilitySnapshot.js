// Availability = real-time client inventory. The live feed is a future webservice;
// this mock simulates an HOURLY fetch: each call to generateSnapshot() returns the
// CURRENT hour's locatable inventory with freshly jittered quantities/rates, as if
// the portal re-pulled the feed. The view regenerates on every visit so only the
// newest snapshot is ever shown (and locatable).
import { securities } from './securities.js'
import { stampShort } from '../utils/datetime.js'

// A wider locatable universe than the typeahead master, so the grid has enough
// rows to demonstrate pagination ("volume effect" for the demo). Each carries a
// SEDOL + ISIN so the download can include Ticker & SEDOL.
const EXTRA = [
  { ticker: 'ORCL', name: 'Oracle Corp',            sedol: '2661568', isin: 'US68389X1054' },
  { ticker: 'CRM',  name: 'Salesforce Inc',         sedol: '2310525', isin: 'US79466L3024' },
  { ticker: 'ADBE', name: 'Adobe Inc',              sedol: '2008154', isin: 'US00724F1012' },
  { ticker: 'CSCO', name: 'Cisco Systems Inc',      sedol: '2198163', isin: 'US17275R1023' },
  { ticker: 'QCOM', name: 'Qualcomm Inc',           sedol: '2714923', isin: 'US7475251036' },
  { ticker: 'TXN',  name: 'Texas Instruments Inc',  sedol: '2885409', isin: 'US8825081040' },
  { ticker: 'AVGO', name: 'Broadcom Inc',           sedol: 'BDZ78H9', isin: 'US11135F1012' },
  { ticker: 'PYPL', name: 'PayPal Holdings Inc',    sedol: 'BYW6443', isin: 'US70450Y1038' },
  { ticker: 'UBER', name: 'Uber Technologies Inc',  sedol: 'BG1WPN5', isin: 'US90353T1007' },
  { ticker: 'ABNB', name: 'Airbnb Inc Cl A',        sedol: 'BMGYYH4', isin: 'US0090661010' },
  { ticker: 'COIN', name: 'Coinbase Global Inc',    sedol: 'BMGYNB9', isin: 'US19260Q1076' },
  { ticker: 'PLTR', name: 'Palantir Technologies',  sedol: 'BNJJ7W4', isin: 'US69608A1088' },
  { ticker: 'SNOW', name: 'Snowflake Inc Cl A',     sedol: 'BMGGN73', isin: 'US8334451098' },
  { ticker: 'SQ',   name: 'Block Inc Cl A',         sedol: 'BVPV6F4', isin: 'US8522341036' },
  { ticker: 'GME',  name: 'GameStop Corp Cl A',     sedol: 'B7QK2P7', isin: 'US36467W1099' },
  { ticker: 'AMC',  name: 'AMC Entertainment Hldgs', sedol: 'BMC6JP7', isin: 'US00165C3025' },
  { ticker: 'C',    name: 'Citigroup Inc',          sedol: '2297907', isin: 'US1729674242' },
  { ticker: 'WFC',  name: 'Wells Fargo & Co',       sedol: '2649100', isin: 'US9497461015' },
  { ticker: 'MS',   name: 'Morgan Stanley',         sedol: '2546603', isin: 'US6174464486' },
  { ticker: 'CVX',  name: 'Chevron Corp',           sedol: '2838555', isin: 'US1667641005' },
  { ticker: 'NKE',  name: 'Nike Inc Cl B',          sedol: '2640147', isin: 'US6541061031' },
  { ticker: 'SBUX', name: 'Starbucks Corp',         sedol: '2842278', isin: 'US8552441094' },
  { ticker: 'MCD',  name: "McDonald's Corp",        sedol: '2550707', isin: 'US5801351017' },
  { ticker: 'PEP',  name: 'PepsiCo Inc',            sedol: '2681511', isin: 'US7134481081' },
  { ticker: 'COST', name: 'Costco Wholesale Corp',  sedol: '2197183', isin: 'US22160K1051' },
  { ticker: 'INTU', name: 'Intuit Inc',             sedol: '2459020', isin: 'US4612021034' }
]

// Master securities (carry sedol/isin already) + the extra universe.
const UNIVERSE = [
  ...securities.map(s => ({ ticker: s.ticker, name: s.name, sedol: s.sedol, isin: s.isin })),
  ...EXTRA
]

// Pseudo-random spread so each hourly fetch looks fresh.
const jitter = (base, spread) => Math.max(0, Math.round(base + (Math.random() - 0.5) * spread))

export function currentHourLabel(d = new Date()) {
  const top = new Date(d)
  top.setMinutes(0, 0, 0)
  return stampShort(top)   // YYYY-MM-DD HH:00
}

// Build the current-hour inventory snapshot. ~50 rows, quantities/rates jittered.
export function generateSnapshot() {
  return UNIVERSE.map(s => {
    const rate = +(0.25 + Math.random() * 14).toFixed(2)   // borrow rate %
    return {
      ticker: s.ticker,
      security: s.name,
      sedol: s.sedol,
      isin: s.isin,
      availableQty: jitter(120000, 480000),
      rate
    }
  })
}
