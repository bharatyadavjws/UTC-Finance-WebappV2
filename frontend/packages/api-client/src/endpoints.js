export const ENDPOINTS = {
    AUTH: {
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout',
      PROFILE: '/auth/profile',
    },
    RETAILERS: {
      LIST: '/retailers',
      CREATE: '/retailers',
      DETAILS: (id) => `/retailers/${id}`,
    },
    LOANS: {
      LIST: '/loans',
      CREATE: '/loans',
      DETAILS: (id) => `/loans/${id}`,
    },
    ELIGIBILITY: {
      CHECK: '/eligibility/check',
    },
    DISBURSEMENT: {
      CREATE_REQUEST: '/disbursement-requests',
    },
    COMMISSION: {
      CREATE_REQUEST: '/commission-requests',
    },
  }