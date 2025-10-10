
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

  // Authentication
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    SOCIAL_LOGIN: '/api/auth/social-login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    VERIFY_EMAIL: '/api/auth/verify-email',
    RESEND_OTP: '/api/auth/resend-otp',
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
    GET: '/api/profile',
    UPDATE: '/api/profile',
    ADDRESSES: {
      LIST: '/api/profile/addresses',
      CREATE: '/api/profile/addresses',
      UPDATE: (id: string) => `/api/profile/addresses/${id}`,
      DELETE: (id: string) => `/api/profile/addresses/${id}`,
    },
    PAYMENT_METHODS: {
      LIST: '/api/profile/payment-methods',
      CREATE: '/api/profile/payment-methods',
      UPDATE: (id: string) => `/api/profile/payment-methods/${id}`,
      DELETE: (id: string) => `/api/profile/payment-methods/${id}`,
    },
    PRIVACY_SETTINGS: {
      GET: '/api/profile/privacy-settings',
      UPDATE: '/api/profile/privacy-settings',
    },
    CHANGE_PASSWORD: '/api/profile/change-password',
  },

  // Products
  PRODUCTS: {
    LIST: '/api/products',
    CREATE: '/api/products',
    BY_ID: (id: string) => `/api/products/${id}`,
    UPDATE: (id: string) => `/api/products/${id}`,
    DELETE: (id: string) => `/api/products/${id}`,
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
    INITIALIZE: '/api/payments/initialize',
    VERIFY: (reference: string) => `/api/payments/verify/${reference}`,
    HISTORY: '/api/payments/history',
    REFUND: '/api/payments/refund',
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
    LIST: '/api/notifications',
    MARK_READ: (id: string) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/read-all',
  },

  // Messages
  MESSAGES: {
    CONVERSATIONS: '/api/conversations',
    BY_CONVERSATION: (conversationId: string) => `/api/conversations/${conversationId}/messages`,
    SEND: '/api/messages',
  },

  // Ratings
  RATINGS: {
    CREATE: '/api/ratings',
    BY_USER: (userId: string) => `/api/ratings/user/${userId}`,
  },

  // Admin
  ADMIN: {
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
