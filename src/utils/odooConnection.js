import axios from 'axios';
import { ODOO_CONFIG, MODULE_CONFIG, Logger } from '../config/odooConfig';

class OdooConnection {
  constructor() {
    this.session = null;
    this.isConnected = false;
    this.loadedModules = new Set();
    this.connectionStatus = 'disconnected'; // 'connecting', 'connected', 'error'
    this.retryCount = 0;
    this.retryTimer = null;
  }

  // 연결 상태 가져오기
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      status: this.connectionStatus,
      loadedModules: Array.from(this.loadedModules),
      session: this.session ? { uid: this.session.uid, user: this.session.user } : null
    };
  }

  // Odoo 서버에 연결
  async connect(username, password) {
    try {
      Logger.info('Odoo 서버에 연결을 시도합니다...', { username, server: ODOO_CONFIG.SERVER_URL });
      this.connectionStatus = 'connecting';

      const response = await axios.post(`${ODOO_CONFIG.SERVER_URL}${ODOO_CONFIG.ENDPOINTS.AUTH}`, {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          db: ODOO_CONFIG.DATABASE,
          login: username,
          password: password,
        }
      }, {
        headers: ODOO_CONFIG.DEFAULT_HEADERS,
        timeout: 10000
      });

      if (response.data.result && response.data.result.uid) {
        this.session = response.data.result;
        this.isConnected = true;
        this.connectionStatus = 'connected';
        this.retryCount = 0;
        
        Logger.info('Odoo 서버 연결 성공', { uid: this.session.uid, user: this.session.user });
        
        // 세션 쿠키 설정
        if (response.headers['set-cookie']) {
          axios.defaults.headers.common['Cookie'] = response.headers['set-cookie'].join('; ');
        }
        
        return { success: true, session: this.session };
      } else {
        throw new Error('인증 실패: 잘못된 사용자명 또는 비밀번호');
      }
    } catch (error) {
      this.connectionStatus = 'error';
      this.isConnected = false;
      
      Logger.error('Odoo 서버 연결 실패', error);
      
      if (this.retryCount < ODOO_CONFIG.RETRY_CONFIG.maxRetries) {
        this.retryCount++;
        Logger.warn(`연결 재시도 중... (${this.retryCount}/${ODOO_CONFIG.RETRY_CONFIG.maxRetries})`);
        
        this.retryTimer = setTimeout(() => {
          this.connect(username, password);
        }, ODOO_CONFIG.RETRY_CONFIG.retryDelay);
      }
      
      return { 
        success: false, 
        error: error.message || '연결 실패',
        retryCount: this.retryCount 
      };
    }
  }

  // 연결 해제
  async disconnect() {
    try {
      if (this.session) {
        await axios.post(`${ODOO_CONFIG.SERVER_URL}${ODOO_CONFIG.ENDPOINTS.LOGOUT}`, {
          jsonrpc: '2.0',
          method: 'call',
          params: {}
        });
        
        Logger.info('Odoo 서버 연결 해제됨');
      }
    } catch (error) {
      Logger.error('연결 해제 중 오류 발생', error);
    } finally {
      this.session = null;
      this.isConnected = false;
      this.connectionStatus = 'disconnected';
      this.loadedModules.clear();
      this.retryCount = 0;
      
      if (this.retryTimer) {
        clearTimeout(this.retryTimer);
        this.retryTimer = null;
      }
    }
  }

  // 모듈 상태 확인
  async checkModuleStatus(moduleName) {
    try {
      const response = await this.callMethod('ir.module.module', 'search_read', [
        [['name', '=', moduleName]],
        ['name', 'state', 'installed_version']
      ]);

      if (response && response.length > 0) {
        const module = response[0];
        return {
          name: module.name,
          state: module.state, // 'installed', 'uninstalled', 'to install', 'to upgrade'
          installed: module.state === 'installed',
          version: module.installed_version
        };
      }
      
      return { name: moduleName, state: 'not_found', installed: false };
    } catch (error) {
      Logger.error(`모듈 상태 확인 실패: ${moduleName}`, error);
      return { name: moduleName, state: 'error', installed: false, error: error.message };
    }
  }

  // 필수 모듈 로드
  async loadRequiredModules() {
    Logger.info('필수 모듈 로드를 시작합니다...', { modules: MODULE_CONFIG.REQUIRED_MODULES });
    
    const loadResults = [];
    const loadOrder = MODULE_CONFIG.LOAD_ORDER.filter(module => 
      MODULE_CONFIG.REQUIRED_MODULES.includes(module)
    );

    for (const moduleName of loadOrder) {
      try {
        Logger.info(`모듈 로드 중: ${moduleName}`);
        
        const status = await this.checkModuleStatus(moduleName);
        
        if (status.installed) {
          this.loadedModules.add(moduleName);
          loadResults.push({
            module: moduleName,
            status: 'loaded',
            details: status
          });
          Logger.info(`모듈 로드 완료: ${moduleName}`, status);
        } else {
          loadResults.push({
            module: moduleName,
            status: 'not_installed',
            details: status
          });
          Logger.warn(`모듈이 설치되지 않음: ${moduleName}`, status);
        }
        
        // 모듈 간 로드 간격
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        loadResults.push({
          module: moduleName,
          status: 'error',
          error: error.message
        });
        Logger.error(`모듈 로드 실패: ${moduleName}`, error);
      }
    }

    const summary = {
      total: loadOrder.length,
      loaded: this.loadedModules.size,
      failed: loadResults.filter(r => r.status === 'error').length,
      notInstalled: loadResults.filter(r => r.status === 'not_installed').length,
      results: loadResults
    };

    Logger.info('모듈 로드 완료', summary);
    return summary;
  }

  // Odoo 메서드 호출
  async callMethod(model, method, args = [], kwargs = {}) {
    if (!this.isConnected) {
      throw new Error('Odoo 서버에 연결되지 않았습니다.');
    }

    try {
      const response = await axios.post(`${ODOO_CONFIG.SERVER_URL}${ODOO_CONFIG.ENDPOINTS.CALL_KW}`, {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: model,
          method: method,
          args: args,
          kwargs: kwargs
        }
      }, {
        headers: ODOO_CONFIG.DEFAULT_HEADERS,
        timeout: 15000
      });

      if (response.data.error) {
        throw new Error(response.data.error.data.message || response.data.error.message);
      }

      return response.data.result;
    } catch (error) {
      Logger.error(`메서드 호출 실패: ${model}.${method}`, error);
      throw error;
    }
  }

  // 데이터 검색
  async searchRead(model, domain = [], fields = [], limit = 0, offset = 0) {
    try {
      const response = await axios.post(`${ODOO_CONFIG.SERVER_URL}${ODOO_CONFIG.ENDPOINTS.SEARCH_READ}`, {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: model,
          method: 'search_read',
          args: [domain, fields],
          kwargs: {
            limit: limit,
            offset: offset
          }
        }
      }, {
        headers: ODOO_CONFIG.DEFAULT_HEADERS,
        timeout: 15000
      });

      if (response.data.error) {
        throw new Error(response.data.error.data.message || response.data.error.message);
      }

      return response.data.result;
    } catch (error) {
      Logger.error(`데이터 검색 실패: ${model}`, error);
      throw error;
    }
  }

  // 연결 상태 모니터링
  startConnectionMonitoring() {
    const monitorInterval = setInterval(async () => {
      if (this.isConnected) {
        try {
          // 간단한 핑 테스트
          await this.callMethod('res.users', 'search', [[['id', '=', this.session.uid]]]);
        } catch (error) {
          Logger.warn('연결 상태 확인 실패, 재연결 시도...');
          this.isConnected = false;
          this.connectionStatus = 'error';
        }
      }
    }, 30000); // 30초마다 확인

    return () => clearInterval(monitorInterval);
  }
}

// 싱글톤 인스턴스 생성
const odooConnection = new OdooConnection();

export default odooConnection; 