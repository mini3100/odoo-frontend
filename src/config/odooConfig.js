// Odoo 연결 설정
export const ODOO_CONFIG = {
  // Odoo 서버 URL
  SERVER_URL: process.env.REACT_APP_ODOO_URL || 'http://localhost:8069',
  
  // 데이터베이스 이름
  DATABASE: process.env.REACT_APP_ODOO_DATABASE || 'odoo_db',
  
  // API 엔드포인트
  ENDPOINTS: {
    AUTH: '/web/session/authenticate',
    LOGOUT: '/web/session/destroy',
    CALL_KW: '/web/dataset/call_kw',
    SEARCH_READ: '/web/dataset/search_read',
    READ: '/web/dataset/read',
    CREATE: '/web/dataset/call_kw',
    UPDATE: '/web/dataset/call_kw',
    DELETE: '/web/dataset/call_kw',
  },
  
  // 기본 헤더
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // 세션 타임아웃 (분)
  SESSION_TIMEOUT: 60,
  
  // 재시도 설정
  RETRY_CONFIG: {
    maxRetries: 3,
    retryDelay: 1000,
  },
  
  // 로깅 설정
  LOGGING: {
    enabled: process.env.NODE_ENV === 'development',
    level: 'info', // 'debug', 'info', 'warn', 'error'
  }
};

// 모듈 로드 설정
export const MODULE_CONFIG = {
  // 필수 모듈 목록
  REQUIRED_MODULES: [
    'base',
    'web',
    'mail',
    'sale',
    'purchase',
    'account',
    'stock',
    'hr',
  ],
  
  // 모듈 로드 순서 (의존성 순서)
  LOAD_ORDER: [
    'base',
    'web',
    'mail',
    'hr',
    'account',
    'stock',
    'purchase',
    'sale',
  ],
  
  // 모듈 상태 확인 간격 (ms)
  STATUS_CHECK_INTERVAL: 2000,
  
  // 모듈 로드 타임아웃 (ms)
  LOAD_TIMEOUT: 30000,
};

// 로깅 유틸리티
export const Logger = {
  info: (message, data = null) => {
    if (ODOO_CONFIG.LOGGING.enabled) {
      console.log(`[Odoo] ${message}`, data);
    }
  },
  
  error: (message, error = null) => {
    if (ODOO_CONFIG.LOGGING.enabled) {
      console.error(`[Odoo Error] ${message}`, error);
    }
  },
  
  warn: (message, data = null) => {
    if (ODOO_CONFIG.LOGGING.enabled) {
      console.warn(`[Odoo Warning] ${message}`, data);
    }
  },
  
  debug: (message, data = null) => {
    if (ODOO_CONFIG.LOGGING.enabled && ODOO_CONFIG.LOGGING.level === 'debug') {
      console.debug(`[Odoo Debug] ${message}`, data);
    }
  }
}; 