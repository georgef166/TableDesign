// Mock locate-request records. Mirrors the columns shown in the legacy grid
// (Request Date, Type, Batch ID, Locate ID, Status, SEDOL, ISIN, RIC, CUSIP,
// Ticker, BBG Ticker, Security, Qty Requested, Qty Approved).
//
// `requester` ties each record to a user (see data/users.js) so the impersonation
// feature can filter the grid to a given client's requests. `locateBy` /
// `marketValue` support the "locate by market value, not shares" option — older
// records default to SHARES.

export const TYPES = ['WEBSERVICE', 'MANUAL', 'API', 'BULK']
export const STATUSES = ['APPROVED', 'PENDING', 'REJECTED']

export const seedLocates = [
  {
    id: 1, requestDate: '2026-06-09 20:22:20', type: 'WEBSERVICE', batchId: 608262, locateId: 93995504,
    status: 'REJECTED', sedol: 'BJZ2C96', isin: 'US88160R1014', ric: 'TSLA.MX', cusip: '88160R101',
    ticker: 'TSLA*', bbgTicker: 'TSLA* MM', security: 'TESLA INC AT LU_EQUITY.MF', qtyRequested: 4, qtyApproved: 0,
    requester: 'jdoe', locateBy: 'SHARES', marketValue: null
  },
  {
    id: 2, requestDate: '2026-06-09 15:53:28', type: 'WEBSERVICE', batchId: 608261, locateId: 93995503,
    status: 'REJECTED', sedol: 'BF1SNQ4', isin: 'US88160R1014', ric: '', cusip: '88160R101',
    ticker: 'TSLA', bbgTicker: 'TSLA AV', security: 'TESLA INC AT AUSTRIAVIENNA', qtyRequested: 3, qtyApproved: 0,
    requester: 'rsmith', locateBy: 'SHARES', marketValue: null
  },
  {
    id: 3, requestDate: '2026-06-09 14:56:21', type: 'WEBSERVICE', batchId: 608256, locateId: 93995498,
    status: 'PENDING', sedol: 'BSY6HW0', isin: 'JP3126410004', ric: 'APPLF.PK', cusip: 'J0128W106',
    ticker: 'APPLF', bbgTicker: 'APPLF US', security: 'ALPHAPOLIS CO LTD AT OTC US', qtyRequested: 2, qtyApproved: 0,
    requester: 'jdoe', locateBy: 'SHARES', marketValue: null
  },
  {
    id: 4, requestDate: '2026-06-09 14:48:59', type: 'WEBSERVICE', batchId: 608255, locateId: 93995497,
    status: 'APPROVED', sedol: 'BM9DJ73', isin: 'US594918CC64', ric: '', cusip: '594918CC6',
    ticker: 'MSFT', bbgTicker: 'NOTINUSE', security: 'MICROSOFT CORP MSFT 2.525 06/01/50', qtyRequested: 1, qtyApproved: 1,
    requester: 'achen', locateBy: 'SHARES', marketValue: null
  },
  {
    id: 5, requestDate: '2026-06-09 14:06:26', type: 'WEBSERVICE', batchId: 608253, locateId: 93995495,
    status: 'APPROVED', sedol: 'B616C79', isin: 'US88160R1014', ric: 'TSLA.OQ', cusip: '88160R101',
    ticker: 'TSLA', bbgTicker: 'TSLA US', security: 'TESLA INC AT NASDAQ GS', qtyRequested: 2, qtyApproved: 2,
    requester: 'rsmith', locateBy: 'SHARES', marketValue: null
  },
  {
    id: 6, requestDate: '2026-06-09 08:04:13', type: 'WEBSERVICE', batchId: 608249, locateId: 93995451,
    status: 'REJECTED', sedol: 'BKTN281', isin: 'CH0419041436', ric: '', cusip: '',
    ticker: 'KBAARG', bbgTicker: 'NOTINUSE', security: 'AARGAUISCHE KANTONALBANK KBAARG 0 09/17/29', qtyRequested: 1, qtyApproved: 0,
    requester: 'plopez', locateBy: 'SHARES', marketValue: null
  },
  {
    id: 7, requestDate: '2026-06-08 16:41:02', type: 'API', batchId: 608201, locateId: 93995402,
    status: 'APPROVED', sedol: '2588173', isin: 'US0378331005', ric: 'AAPL.OQ', cusip: '037833100',
    ticker: 'AAPL', bbgTicker: 'AAPL US', security: 'APPLE INC AT NASDAQ GS', qtyRequested: 1200, qtyApproved: 1200,
    requester: 'achen', locateBy: 'SHARES', marketValue: null
  },
  {
    id: 8, requestDate: '2026-06-08 11:18:47', type: 'MANUAL', batchId: 608188, locateId: 93995377,
    status: 'PENDING', sedol: '2046251', isin: 'US0231351067', ric: 'AMZN.OQ', cusip: '023135106',
    ticker: 'AMZN', bbgTicker: 'AMZN US', security: 'AMAZON.COM INC AT NASDAQ GS', qtyRequested: 850, qtyApproved: 0,
    requester: 'jdoe', locateBy: 'SHARES', marketValue: null
  },
  {
    id: 9, requestDate: '2026-06-08 09:55:10', type: 'WEBSERVICE', batchId: 608170, locateId: 93995340,
    status: 'APPROVED', sedol: '2886907', isin: 'US30303M1027', ric: 'META.OQ', cusip: '30303M102',
    ticker: 'META', bbgTicker: 'META US', security: 'META PLATFORMS INC AT NASDAQ GS', qtyRequested: 600, qtyApproved: 540,
    requester: 'plopez', locateBy: 'SHARES', marketValue: null
  },
  {
    id: 10, requestDate: '2026-06-07 17:30:55', type: 'BULK', batchId: 608144, locateId: 93995299,
    status: 'REJECTED', sedol: 'BYVY8G0', isin: 'US67066G1040', ric: 'NVDA.OQ', cusip: '67066G104',
    ticker: 'NVDA', bbgTicker: 'NVDA US', security: 'NVIDIA CORP AT NASDAQ GS', qtyRequested: 2000, qtyApproved: 0,
    requester: 'rsmith', locateBy: 'SHARES', marketValue: null
  },
  {
    id: 11, requestDate: '2026-06-07 13:12:33', type: 'API', batchId: 608120, locateId: 93995241,
    status: 'APPROVED', sedol: '2491831', isin: 'US02079K3059', ric: 'GOOGL.OQ', cusip: '02079K305',
    ticker: 'GOOGL', bbgTicker: 'GOOGL US', security: 'ALPHABET INC CL A AT NASDAQ GS', qtyRequested: 300, qtyApproved: 300,
    requester: 'achen', locateBy: 'SHARES', marketValue: null
  },
  {
    id: 12, requestDate: '2026-06-07 10:02:09', type: 'WEBSERVICE', batchId: 608098, locateId: 93995188,
    status: 'PENDING', sedol: 'B4TX8S1', isin: 'US64110L1061', ric: 'NFLX.OQ', cusip: '64110L106',
    ticker: 'NFLX', bbgTicker: 'NFLX US', security: 'NETFLIX INC AT NASDAQ GS', qtyRequested: 150, qtyApproved: 0,
    requester: 'jdoe', locateBy: 'SHARES', marketValue: null
  }
]
