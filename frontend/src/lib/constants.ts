/**
 * Constantes de la aplicación
 */

// API Endpoints
export const API_ENDPOINTS = {
  // Autenticación
  AUTH: {
    LOGIN: 'auth/login',
    REGISTER: 'auth/register',
    LOGOUT: 'auth/logout',
    PROFILE: 'auth/profile',
    REFRESH: 'auth/refresh',
    VERIFY_EMAIL: 'auth/verify-email',
    RESEND_VERIFICATION: 'auth/resend-verification',
    FORGOT_PASSWORD: 'auth/forgot-password',
    RESET_PASSWORD: 'auth/reset-password',
  },
  
  // Productos
  PRODUCTS: {
    LIST: 'products',
    CREATE: 'products',
    BY_ID: (id: string) => `products/${id}`,
    BY_SLUG: (slug: string) => `products/slug/${slug}`,
    SEARCH: 'products/search',
    MY_PRODUCTS: 'products/my',
    PENDING: 'products/pending',
    PUBLISH: (id: string) => `products/${id}/publish`,
    APPROVE: (id: string) => `products/${id}/approve`,
    REJECT: (id: string) => `products/${id}/reject`,
  },
  
  // Vendedores
  SELLERS: {
    LIST: 'sellers',
    BY_ID: (id: string) => `sellers/id/${id}`,
    BY_SLUG: (slug: string) => `sellers/${slug}`,
    PROFILE: 'sellers/profile',
    UPDATE_PROFILE: 'sellers/profile',
  },
  
  // Pedidos
  ORDERS: {
    LIST: 'orders',
    CREATE: 'orders',
    BY_ID: (id: string) => `orders/${id}`,
    MY_ORDERS: 'orders/my',
    SELLER_ORDERS: 'orders/sales',
    CANCEL: (id: string) => `orders/${id}/cancel`,
  },
  
  // Carrito
  CART: {
    LIST: 'cart',
    ADD: 'cart/add',
    UPDATE: (id: string) => `cart/${id}`,
    REMOVE: (id: string) => `cart/${id}`,
    CLEAR: 'cart/clear',
  },
  
  // Checkout
  CHECKOUT: {
    CREATE_SESSION: 'checkout/create-session',
    VERIFY_SESSION: 'checkout/verify-session',
  },
  
  // Reviews
  REVIEWS: {
    LIST: 'reviews',
    CREATE: 'reviews',
    BY_ID: (id: string) => `reviews/${id}`,
    UPDATE: (id: string) => `reviews/${id}`,
    DELETE: (id: string) => `reviews/${id}`,
    RESPONSE: (id: string) => `reviews/${id}/response`,
    VOTE: (id: string) => `reviews/${id}/vote`,
    ADMIN_PENDING: 'reviews/admin/pending',
    ADMIN_MODERATE: (id: string) => `reviews/admin/${id}/moderate`,
  },
  
  // Favoritos
  FAVORITES: {
    LIST: 'favorites',
    ADD: 'favorites',
    REMOVE: (id: string) => `favorites/${id}`,
  },
  
  // Descargas
  DOWNLOADS: {
    LIST: 'downloads',
    DOWNLOAD: (token: string) => `downloads/${token}`,
  },
  
  // Archivos
  FILES: {
    UPLOAD: 'files/upload',
    IMAGE: (id: string) => `files/image/${id}`,
    THUMBNAIL: (id: string) => `files/thumbnail/${id}`,
    PDF: (id: string) => `files/pdf/${id}`,
  },
  
  // Notificaciones
  NOTIFICATIONS: {
    LIST: 'notifications',
    MARK_READ: (id: string) => `notifications/${id}/read`,
    MARK_ALL_READ: 'notifications/mark-all-read',
    PREFERENCES: 'notifications/preferences',
    UPDATE_PREFERENCES: 'notifications/preferences',
  },
  
  // Analytics
  ANALYTICS: {
    SELLER_DASHBOARD: 'analytics/seller/dashboard',
    SELLER_REVENUE: 'analytics/seller/revenue',
    ADMIN_PLATFORM: 'analytics/admin/platform',
    ADMIN_TOP_PERFORMERS: 'analytics/admin/top-performers',
    EXPORT: 'analytics/export',
  },
  
  // Admin
  ADMIN: {
    DASHBOARD: 'admin/dashboard',
    USERS: 'admin/users',
    UPDATE_USER_STATUS: (id: string) => `admin/users/${id}/status`,
    PRODUCTS_PENDING: 'admin/products/pending',
    MODERATE_PRODUCT: (id: string) => `admin/products/${id}/moderate`,
    HEALTH: 'admin/health',
  },
} as const

// Configuración de paginación
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
} as const

// Límites de archivos
export const FILE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_UPLOAD: 6,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  ALLOWED_PDF_TYPES: ['application/pdf'],
} as const

// Timeouts
export const TIMEOUTS = {
  DEFAULT: 30000, // 30 segundos
  UPLOAD: 60000,  // 60 segundos
  LONG_OPERATION: 120000, // 2 minutos
} as const

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  NETWORK: 'Error de conexión. Verifica tu internet.',
  UNAUTHORIZED: 'Necesitas iniciar sesión para acceder.',
  FORBIDDEN: 'No tienes permisos para realizar esta acción.',
  NOT_FOUND: 'El recurso solicitado no fue encontrado.',
  SERVER_ERROR: 'Error interno del servidor. Intenta más tarde.',
  TIMEOUT: 'La operación tardó demasiado tiempo. Intenta de nuevo.',
  VALIDATION: 'Los datos enviados no son válidos.',
  FILE_TOO_LARGE: `El archivo es demasiado grande. Máximo ${FILE_LIMITS.MAX_SIZE / 1024 / 1024}MB.`,
  INVALID_FILE_TYPE: 'Tipo de archivo no permitido.',
} as const

// Status codes HTTP
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const

// Configuración de cache (para futuro uso con React Query)
export const CACHE_KEYS = {
  PRODUCTS: 'products',
  PRODUCT_DETAIL: 'product-detail',
  SELLERS: 'sellers',
  SELLER_DETAIL: 'seller-detail',
  ORDERS: 'orders',
  CART: 'cart',
  REVIEWS: 'reviews',
  FAVORITES: 'favorites',
  DOWNLOADS: 'downloads',
  NOTIFICATIONS: 'notifications',
  ANALYTICS: 'analytics',
  ADMIN: 'admin',
} as const

// Configuración de retry
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 segundo
  RETRY_MULTIPLIER: 2, // Duplicar delay en cada retry
} as const