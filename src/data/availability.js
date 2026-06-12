// Mock "availability files" data. The FY26 ask is to surface availability inside
// the portal; the real feed is a future webservice, so this is sample data the
// view renders behind a clear "sample data" banner.

export const availabilityFiles = [
  { id: 'avail-2026-06-12', name: 'Availability_2026-06-12.csv', source: 'Prime Broker A', asOf: '2026-06-12 07:30', rows: 6 },
  { id: 'avail-2026-06-11', name: 'Availability_2026-06-11.csv', source: 'Prime Broker A', asOf: '2026-06-11 07:30', rows: 6 },
  { id: 'avail-2026-06-10', name: 'Availability_2026-06-10.csv', source: 'Prime Broker B', asOf: '2026-06-10 07:28', rows: 5 }
]

// rate = indicative borrow rate (annualised %); availableQty = locatable shares.
export const availabilityRows = {
  'avail-2026-06-12': [
    { ticker: 'TSLA',  security: 'Tesla Inc',            availableQty: 120000,  rate: 4.85 },
    { ticker: 'AAPL',  security: 'Apple Inc',            availableQty: 2500000, rate: 0.30 },
    { ticker: 'NVDA',  security: 'NVIDIA Corp',          availableQty: 800000,  rate: 1.10 },
    { ticker: 'AMD',   security: 'Advanced Micro Devices', availableQty: 450000, rate: 0.75 },
    { ticker: 'GME',   security: 'GameStop Corp',        availableQty: 5000,    rate: 28.40 },
    { ticker: 'SHOP',  security: 'Shopify Inc Cl A',     availableQty: 90000,   rate: 2.05 }
  ],
  'avail-2026-06-11': [
    { ticker: 'TSLA',  security: 'Tesla Inc',            availableQty: 95000,   rate: 5.10 },
    { ticker: 'AAPL',  security: 'Apple Inc',            availableQty: 2400000, rate: 0.30 },
    { ticker: 'META',  security: 'Meta Platforms Inc',   availableQty: 310000,  rate: 0.55 },
    { ticker: 'NFLX',  security: 'Netflix Inc',          availableQty: 60000,   rate: 1.85 },
    { ticker: 'INTC',  security: 'Intel Corp',           availableQty: 1800000, rate: 0.25 },
    { ticker: 'GME',   security: 'GameStop Corp',        availableQty: 4000,    rate: 31.20 }
  ],
  'avail-2026-06-10': [
    { ticker: 'AMZN',  security: 'Amazon.com Inc',       availableQty: 700000,  rate: 0.40 },
    { ticker: 'GOOGL', security: 'Alphabet Inc Cl A',    availableQty: 540000,  rate: 0.35 },
    { ticker: 'BA',    security: 'Boeing Co',            availableQty: 220000,  rate: 1.40 },
    { ticker: 'F',     security: 'Ford Motor Co',        availableQty: 3000000, rate: 0.20 },
    { ticker: 'SHOP',  security: 'Shopify Inc Cl A',     availableQty: 85000,   rate: 2.15 }
  ]
}
