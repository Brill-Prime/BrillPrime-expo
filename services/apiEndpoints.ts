
// API Endpoints Configuration
// Maps all backend API endpoints with type safety

export const API_ENDPOINTS = {
  // Health Check
  HEALTH: {
    ROOT: '/',
    BASIC: '/health',
    API: '/api/health',
    DETAILED: '/api/health/detailed',
  },

  // Users
  USERS: {
    LIST: '/api/users',
    BY_ID: (id: string) => `/api/users/${id}`,
    UPDATE: (id: string) => `/api/users/${id}`,
    DELETE: (id: string) => `/api/users/${id}`,
  },

  // Profile
  PROFILE: {
    GET: '/functions/v1/profile',
    UPDATE: '/functions/v1/profile',
    ADDRESSES: {
      LIST: '/functions/v1/account/addresses',
      CREATE: '/functions/v1/account/addresses',
      UPDATE: (id: string) => `/functions/v1/account/addresses/${encodeURIComponent(id)}`,
      DELETE: (id: string) => `/functions/v1/account/addresses/${encodeURIComponent(id)}`,
    },
    PAYMENT_METHODS: {
      LIST: '/functions/v1/account/payment-methods',
      CREATE: '/functions/v1/account/payment-methods',
      UPDATE: (id: string) => `/functions/v1/account/payment-methods/${encodeURIComponent(id)}`,
      DELETE: (id: string) => `/functions/v1/account/payment-methods/${encodeURIComponent(id)}`,
    },
    PRIVACY_SETTINGS: {
      GET: '/functions/v1/account/privacy-settings',
      UPDATE: '/functions/v1/account/privacy-settings',
    },
    CHANGE_PASSWORD: '/api/profile/change-password',
  },
  FAVORITES: {
    LIST: '/functions/v1/favorites',
    CREATE: '/functions/v1/favorites',
    REMOVE: (itemId: string) => `/functions/v1/favorites?itemId=${encodeURIComponent(itemId)}`,
  },

  // Products
  PRODUCTS: {
    LIST: '/api/products',
    CREATE: '/api/products',
    BY_ID: (id: string) => `/api/products/${id}`,
    UPDATE: (id: string) => `/api/products/${id}`,
    DELETE: (id: string) => `/api/products/${id}`,
  },

  // Merchant catalog and operations
  MERCHANTS: {
    LIST: '/functions/v1/catalog/merchants',
    BY_ID: (id: string) => `/functions/v1/catalog/merchants/${encodeURIComponent(id)}`,
    COMMODITIES: '/functions/v1/catalog/commodities',
    BY_ID_COMMODITIES: (id: string) => `/functions/v1/catalog/merchants/${encodeURIComponent(id)}/commodities`,
    SETTINGS: (id: string) => `/functions/v1/catalog/merchants/${encodeURIComponent(id)}/settings`,
    ORDERS: (id: string) => `/functions/v1/catalog/merchants/${encodeURIComponent(id)}/orders`,
    CUSTOMERS: (id: string) => `/functions/v1/catalog/merchants/${encodeURIComponent(id)}/customers`,
    ANALYTICS: (id: string) => `/functions/v1/catalog/merchants/${encodeURIComponent(id)}/analytics`,
  },

  // Categories
  CATEGORIES: {
    LIST: '/api/categories',
    CREATE: '/api/categories',
  },

  // Cart
  CART: {
    GET: '/api/cart',
    ADD: '/api/cart',
    UPDATE: (itemId: string) => `/api/cart/${itemId}`,
    REMOVE: (itemId: string) => `/api/cart/${itemId}`,
    CLEAR: '/api/cart',
  },

  // Orders
  ORDERS: {
    LIST: '/api/orders',
    CREATE: '/api/orders',
    BY_ID: (id: string) => `/api/orders/${id}`,
    UPDATE_STATUS: (id: string) => `/api/orders/${id}/status`,
    CANCEL: (id: string) => `/api/orders/${id}/cancel`,
    ETA: (id: string) => `/api/orders/${id}/eta`,
  },

  // Payments
  PAYMENTS: {
    INITIALIZE: '/functions/v1/payment-process',
    VERIFY: (reference: string) => `/functions/v1/payment-process/verify/${encodeURIComponent(reference)}`,
    HISTORY: '/functions/v1/transactions',
    REFUND: '/functions/v1/payment-process/refund',
  },

  // Escrow
  ESCROW: {
    LIST: '/api/escrows',
    BY_ID: (id: string) => `/api/escrows/${id}`,
    RELEASE: (id: string) => `/api/escrows/${id}/release`,
    DISPUTE: (id: string) => `/api/escrows/${id}/dispute`,
  },

  // Drivers
  DRIVERS: {
    LIST: '/api/drivers',
    BY_ID: (id: string) => `/api/drivers/${id}`,
    REGISTER: '/api/drivers/register',
    UPDATE_STATUS: (id: string) => `/api/drivers/${id}/status`,
    UPDATE_LOCATION: '/api/drivers/location',
  },

  // Tracking
  TRACKING: {
    ORDER: (orderId: string) => `/api/tracking/order/${orderId}`,
    UPDATE_LOCATION: (orderId: string) => `/api/tracking/${orderId}/location`,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/functions/v1/account/notifications',
    MARK_READ: (id: string) => `/functions/v1/account/notifications/${encodeURIComponent(id)}/read`,
    MARK_ALL_READ: '/functions/v1/account/notifications/read-all',
    UNREAD_COUNT: '/functions/v1/account/notifications/unread-count',
  },

  // Messages
  MESSAGES: {
    CONVERSATIONS: '/api/conversations',
    BY_CONVERSATION: (conversationId: string) => `/api/conversations/${conversationId}/messages`,
    SEND: '/api/messages',
  },

  // Ratings
  RATINGS: {
    CREATE: '/functions/v1/catalog/ratings',
    BY_USER: (userId: string) => `/functions/v1/catalog/ratings/user/${encodeURIComponent(userId)}`,
  },

  // KYC
  KYC: {
    PROFILE: '/functions/v1/kyc/profile',
    STATUS: '/functions/v1/kyc/status',
    ROLE_STATUS: '/functions/v1/kyc/role-status',
    REGISTER_ROLE: '/functions/v1/kyc/register-role',
    PERSONAL_INFO: '/functions/v1/kyc/personal-info',
    BUSINESS_INFO: '/functions/v1/kyc/business-info',
    DRIVER_INFO: '/functions/v1/kyc/driver-info',
    DOCUMENTS: '/functions/v1/kyc/documents',
    SUBMIT: '/functions/v1/kyc/submit',
  },

  // Admin
  ADMIN: {
    ANNOUNCEMENTS: '/functions/v1/admin/announcements',
    MAINTENANCE: '/functions/v1/admin/maintenance',
    USERS: {
      LIST: '/api/admin-users',
      CREATE: '/api/admin-users',
    },
    DASHBOARD: {
      OVERVIEW: '/api/admin-dashboard/overview',
      ALERTS: '/api/admin-dashboard/alerts',
    },
    MODERATION: {
      LIST: '/api/admin/moderation',
      ACTION: (reportId: string) => `/api/admin/moderation/${reportId}/action`,
    },
    CONTROL_CENTER: {
      DASHBOARD: '/api/admin/control-center',
      ACTION: '/api/admin/control-center/action',
    },
    ESCROW: {
      LIST: '/api/admin/escrow-management',
      ACTION: (escrowId: string) => `/api/admin/escrow-management/${escrowId}/action`,
    },
    KYC: {
      LIST: '/api/admin/kyc-verification',
    },
    REPORTS: {
      FINANCIAL: '/api/admin/reports/financial',
      USER_GROWTH: '/api/admin/reports/user-growth',
      PERFORMANCE: '/api/admin/reports/performance',
      EXPORT: (reportType: string) => `/api/admin/reports/export/${reportType}`,
    },
    SYSTEM_METRICS: {
      OVERVIEW: '/api/admin/system-metrics',
      HEALTH: '/api/admin/system-metrics/health',
    },
  },

  // Webhooks
  WEBHOOKS: {
    PAYSTACK: '/api/webhooks/paystack',
  },

  // WebSocket
  WEBSOCKET: '/ws',
} as const;

// Export types for type safety
export type ApiEndpoints = typeof API_ENDPOINTS;
