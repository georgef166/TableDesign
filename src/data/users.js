// Mock users for the impersonation feature. One admin (the signed-in support
// operator) plus several client users whose requests they may need to view to
// troubleshoot issues — the FY26 "user impersonation" ask.

export const ADMIN_USER = {
  id: 'gf',
  name: 'George Farag',
  initials: 'GF',
  email: 'george.farag166@gmail.com',
  role: 'admin',
  firm: 'Scotiabank · TALP Desk'
}

export const CLIENT_USERS = [
  { id: 'jdoe', name: 'Jane Doe',      initials: 'JD', email: 'jane.doe@meridiancap.com',   role: 'client', firm: 'Meridian Capital' },
  { id: 'rsmith', name: 'Robert Smith', initials: 'RS', email: 'r.smith@northpeak.com',      role: 'client', firm: 'Northpeak Advisors' },
  { id: 'achen', name: 'Amy Chen',     initials: 'AC', email: 'amy.chen@harborline.com',     role: 'client', firm: 'Harborline Asset Mgmt' },
  { id: 'plopez', name: 'Paolo Lopez',  initials: 'PL', email: 'p.lopez@vantagefx.com',       role: 'client', firm: 'Vantage FX' }
]

export const ALL_USERS = [ADMIN_USER, ...CLIENT_USERS]

export function userById(id) {
  return ALL_USERS.find(u => u.id === id) || null
}
