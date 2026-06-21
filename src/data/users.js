// Mock users for the impersonation feature. One admin (the signed-in support
// operator) plus several client users whose requests they may need to view to
// troubleshoot issues — the FY26 "user impersonation" ask.

export const ADMIN_USER = {
  id: 'gf',
  name: 'George Farag',
  initials: 'GF',
  email: 'admin@example.com',
  role: 'admin',
  firm: 'Scotiabank · TALP Desk'
}

export const CLIENT_USERS = [
  { id: 'jdoe', name: 'Jane Doe',      initials: 'JD', email: 'jane.doe@example.com',   role: 'client', firm: 'Meridian Capital' },
  // Marcus shares Jane's firm — two logins at the same company see the same locates.
  { id: 'mwong', name: 'Marcus Wong',  initials: 'MW', email: 'm.wong@example.com',      role: 'client', firm: 'Meridian Capital' },
  { id: 'rsmith', name: 'Robert Smith', initials: 'RS', email: 'r.smith@example.com',    role: 'client', firm: 'Northpeak Advisors' },
  { id: 'achen', name: 'Amy Chen',     initials: 'AC', email: 'amy.chen@example.com',    role: 'client', firm: 'Harborline Asset Mgmt' },
  { id: 'plopez', name: 'Paolo Lopez',  initials: 'PL', email: 'p.lopez@example.com',     role: 'client', firm: 'Vantage FX' }
]

export const ALL_USERS = [ADMIN_USER, ...CLIENT_USERS]

export function userById(id) {
  return ALL_USERS.find(u => u.id === id) || null
}

// Resolve a user's company/firm — the unit the locates grid scopes by, so
// same-firm colleagues share one view.
export function firmOf(userId) {
  return userById(userId)?.firm || null
}
