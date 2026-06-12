// Mock security master backing the free-text security lookup (the FY26 ask for a
// fast, Google-Finance-style typeahead to replace the slow legacy drop-down).
// `price` (last) drives the "locate by market value → estimated shares" helper.

export const securities = [
  { ticker: 'TSLA',  name: 'Tesla Inc',                exchange: 'NASDAQ GS', bbgTicker: 'TSLA US',  sedol: 'B616C79', isin: 'US88160R1014', cusip: '88160R101', ric: 'TSLA.OQ',  price: 248.50 },
  { ticker: 'AAPL',  name: 'Apple Inc',                exchange: 'NASDAQ GS', bbgTicker: 'AAPL US',  sedol: '2588173', isin: 'US0378331005', cusip: '037833100', ric: 'AAPL.OQ',  price: 212.20 },
  { ticker: 'MSFT',  name: 'Microsoft Corp',           exchange: 'NASDAQ GS', bbgTicker: 'MSFT US',  sedol: '2588173', isin: 'US5949181045', cusip: '594918104', ric: 'MSFT.OQ',  price: 462.90 },
  { ticker: 'AMZN',  name: 'Amazon.com Inc',           exchange: 'NASDAQ GS', bbgTicker: 'AMZN US',  sedol: '2046251', isin: 'US0231351067', cusip: '023135106', ric: 'AMZN.OQ',  price: 198.40 },
  { ticker: 'META',  name: 'Meta Platforms Inc',       exchange: 'NASDAQ GS', bbgTicker: 'META US',  sedol: '2886907', isin: 'US30303M1027', cusip: '30303M102', ric: 'META.OQ',  price: 712.10 },
  { ticker: 'NVDA',  name: 'NVIDIA Corp',              exchange: 'NASDAQ GS', bbgTicker: 'NVDA US',  sedol: 'BYVY8G0', isin: 'US67066G1040', cusip: '67066G104', ric: 'NVDA.OQ',  price: 138.75 },
  { ticker: 'GOOGL', name: 'Alphabet Inc Cl A',        exchange: 'NASDAQ GS', bbgTicker: 'GOOGL US', sedol: '2491831', isin: 'US02079K3059', cusip: '02079K305', ric: 'GOOGL.OQ', price: 178.30 },
  { ticker: 'NFLX',  name: 'Netflix Inc',              exchange: 'NASDAQ GS', bbgTicker: 'NFLX US',  sedol: 'B4TX8S1', isin: 'US64110L1061', cusip: '64110L106', ric: 'NFLX.OQ',  price: 1024.60 },
  { ticker: 'AMD',   name: 'Advanced Micro Devices',   exchange: 'NASDAQ GS', bbgTicker: 'AMD US',   sedol: '2007849', isin: 'US0079031078', cusip: '007903107', ric: 'AMD.OQ',   price: 142.85 },
  { ticker: 'INTC',  name: 'Intel Corp',               exchange: 'NASDAQ GS', bbgTicker: 'INTC US',  sedol: '2463247', isin: 'US4581401001', cusip: '458140100', ric: 'INTC.OQ',  price: 21.40 },
  { ticker: 'JPM',   name: 'JPMorgan Chase & Co',      exchange: 'NYSE',      bbgTicker: 'JPM US',   sedol: '2190385', isin: 'US46625H1005', cusip: '46625H100', ric: 'JPM.N',    price: 268.10 },
  { ticker: 'BAC',   name: 'Bank of America Corp',     exchange: 'NYSE',      bbgTicker: 'BAC US',   sedol: '2295677', isin: 'US0605051046', cusip: '060505104', ric: 'BAC.N',    price: 46.20 },
  { ticker: 'XOM',   name: 'Exxon Mobil Corp',         exchange: 'NYSE',      bbgTicker: 'XOM US',   sedol: '2326618', isin: 'US30231G1022', cusip: '30231G102', ric: 'XOM.N',    price: 112.65 },
  { ticker: 'WMT',   name: 'Walmart Inc',              exchange: 'NYSE',      bbgTicker: 'WMT US',   sedol: '2936921', isin: 'US9311421039', cusip: '931142103', ric: 'WMT.N',    price: 97.30 },
  { ticker: 'KO',    name: 'Coca-Cola Co',             exchange: 'NYSE',      bbgTicker: 'KO US',    sedol: '2206657', isin: 'US1912161007', cusip: '191216100', ric: 'KO.N',     price: 71.85 },
  { ticker: 'DIS',   name: 'Walt Disney Co',           exchange: 'NYSE',      bbgTicker: 'DIS US',   sedol: '2270726', isin: 'US2546871060', cusip: '254687106', ric: 'DIS.N',    price: 113.40 },
  { ticker: 'BA',    name: 'Boeing Co',                exchange: 'NYSE',      bbgTicker: 'BA US',    sedol: '2108601', isin: 'US0970231058', cusip: '097023105', ric: 'BA.N',     price: 209.90 },
  { ticker: 'GS',    name: 'Goldman Sachs Group Inc',  exchange: 'NYSE',      bbgTicker: 'GS US',    sedol: '2407966', isin: 'US38141G1040', cusip: '38141G104', ric: 'GS.N',     price: 678.20 },
  { ticker: 'V',     name: 'Visa Inc Cl A',            exchange: 'NYSE',      bbgTicker: 'V US',     sedol: 'B2PZN04', isin: 'US92826C8394', cusip: '92826C839', ric: 'V.N',      price: 358.70 },
  { ticker: 'PFE',   name: 'Pfizer Inc',               exchange: 'NYSE',      bbgTicker: 'PFE US',   sedol: '2684703', isin: 'US7170811035', cusip: '717081103', ric: 'PFE.N',    price: 24.95 },
  { ticker: 'T',     name: 'AT&T Inc',                 exchange: 'NYSE',      bbgTicker: 'T US',     sedol: '2079638', isin: 'US00206R1023', cusip: '00206R102', ric: 'T.N',      price: 28.15 },
  { ticker: 'F',     name: 'Ford Motor Co',            exchange: 'NYSE',      bbgTicker: 'F US',     sedol: '2615468', isin: 'US3453708600', cusip: '345370860', ric: 'F.N',      price: 11.05 },
  { ticker: 'SHOP',  name: 'Shopify Inc Cl A',         exchange: 'NYSE',      bbgTicker: 'SHOP US',  sedol: 'BXGD2W4', isin: 'CA82509L1076', cusip: '82509L107', ric: 'SHOP.N',   price: 118.60 },
  { ticker: 'RY',    name: 'Royal Bank of Canada',     exchange: 'TSX',       bbgTicker: 'RY CN',    sedol: '2731510', isin: 'CA7800871021', cusip: '780087102', ric: 'RY.TO',    price: 174.55 },
  { ticker: 'BNS',   name: 'Bank of Nova Scotia',      exchange: 'TSX',       bbgTicker: 'BNS CN',   sedol: '2076281', isin: 'CA0641491075', cusip: '064149107', ric: 'BNS.TO',   price: 78.40 }
]

const NORM = (s) => (s || '').toString().toLowerCase()

// Client-side typeahead search across ticker, name and every identifier.
// Capped + ranked so the dropdown stays fast (the perf complaint on the old one).
export function searchSecurities(query, limit = 8) {
  const q = NORM(query).trim()
  if (!q) return []
  const scored = []
  for (const s of securities) {
    const ticker = NORM(s.ticker)
    const name = NORM(s.name)
    let score = -1
    if (ticker === q) score = 0
    else if (ticker.startsWith(q)) score = 1
    else if (name.startsWith(q)) score = 2
    else if (ticker.includes(q) || name.includes(q)) score = 3
    else if ([s.sedol, s.isin, s.cusip, s.ric, s.bbgTicker].some(id => NORM(id).includes(q))) score = 4
    if (score >= 0) scored.push({ s, score })
  }
  scored.sort((a, b) => a.score - b.score || a.s.ticker.localeCompare(b.s.ticker))
  return scored.slice(0, limit).map(x => x.s)
}

// Look up a security by any exact identifier (used by the file uploader to
// enrich a row that only supplies, say, an ISIN).
export function findSecurity({ ticker, sedol, isin, cusip } = {}) {
  const t = NORM(ticker), se = NORM(sedol), i = NORM(isin), c = NORM(cusip)
  return securities.find(s =>
    (t && NORM(s.ticker) === t) ||
    (se && NORM(s.sedol) === se) ||
    (i && NORM(s.isin) === i) ||
    (c && NORM(s.cusip) === c)
  ) || null
}
