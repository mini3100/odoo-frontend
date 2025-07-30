import React, { useState, useEffect } from 'react';
import { useOdooConnection } from '../hooks/useOdooConnection';
import { MODULE_CONFIG } from '../config/odooConfig';
import './OdooConnectionManager.css';

const OdooConnectionManager = () => {
  const {
    connectionStatus,
    isConnected,
    loadedModules,
    session,
    loading,
    error,
    moduleLoadProgress,
    connect,
    disconnect,
    loadModules,
    checkModuleStatus
  } = useOdooConnection();

  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [selectedModule, setSelectedModule] = useState('');
  const [moduleStatus, setModuleStatus] = useState(null);

  const handleConnect = async () => {
    if (!credentials.username || !credentials.password) {
      alert('사용자명과 비밀번호를 입력해주세요.');
      return;
    }

    const result = await connect(credentials.username, credentials.password);
    if (result.success) {
      // 연결 성공 후 자동으로 모듈 로드
      await loadModules();
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const handleLoadModules = async () => {
    await loadModules();
  };

  const handleCheckModuleStatus = async () => {
    if (!selectedModule) {
      alert('확인할 모듈을 선택해주세요.');
      return;
    }

    try {
      const status = await checkModuleStatus(selectedModule);
      setModuleStatus(status);
    } catch (err) {
      alert(`모듈 상태 확인 실패: ${err.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return '#4CAF50';
      case 'connecting': return '#FF9800';
      case 'error': return '#F44336';
      case 'disconnected': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'connected': return '연결됨';
      case 'connecting': return '연결 중...';
      case 'error': return '오류';
      case 'disconnected': return '연결 해제됨';
      default: return '알 수 없음';
    }
  };

  return (
    <div className="odoo-connection-manager">
      <div className="connection-header">
        <h2>Odoo 연결 관리자</h2>
        <div className="connection-status">
          <div 
            className="status-indicator" 
            style={{ backgroundColor: getStatusColor(connectionStatus) }}
          />
          <span>{getStatusText(connectionStatus)}</span>
        </div>
      </div>

      {/* 연결 섹션 */}
      <div className="connection-section">
        <h3>데이터베이스 연결</h3>
        
        {!isConnected ? (
          <div className="login-form">
            <div className="form-group">
              <label>사용자명:</label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                placeholder="사용자명을 입력하세요"
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label>비밀번호:</label>
              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="비밀번호를 입력하세요"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="toggle-password"
                >
                  {showPassword ? "숨기기" : "보기"}
                </button>
              </div>
            </div>
            
            <button 
              onClick={handleConnect}
              disabled={loading || !credentials.username || !credentials.password}
              className="connect-btn"
            >
              {loading ? '연결 중...' : '연결'}
            </button>
          </div>
        ) : (
          <div className="connected-info">
            <div className="session-info">
              <p><strong>사용자:</strong> {session?.user?.name || '알 수 없음'}</p>
              <p><strong>사용자 ID:</strong> {session?.uid || '알 수 없음'}</p>
            </div>
            <button onClick={handleDisconnect} className="disconnect-btn">
              연결 해제
            </button>
          </div>
        )}

        {error && (
          <div className="error-message">
            <strong>오류:</strong> {error}
          </div>
        )}
      </div>

      {/* 모듈 로드 섹션 */}
      {isConnected && (
        <div className="modules-section">
          <h3>모듈 로드 관리</h3>
          
          <div className="module-load-controls">
            <button 
              onClick={handleLoadModules}
              disabled={loading}
              className="load-modules-btn"
            >
              {loading ? '모듈 로드 중...' : '필수 모듈 로드'}
            </button>
          </div>

          {/* 모듈 로드 진행률 */}
          {moduleLoadProgress.total > 0 && (
            <div className="module-progress">
              <h4>모듈 로드 진행률</h4>
              <div className="progress-stats">
                <div className="stat-item">
                  <span className="stat-label">전체:</span>
                  <span className="stat-value">{moduleLoadProgress.total}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">로드됨:</span>
                  <span className="stat-value success">{moduleLoadProgress.loaded}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">실패:</span>
                  <span className="stat-value error">{moduleLoadProgress.failed}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">설치되지 않음:</span>
                  <span className="stat-value warning">{moduleLoadProgress.notInstalled}</span>
                </div>
              </div>

              {/* 모듈 로드 결과 */}
              {moduleLoadProgress.results.length > 0 && (
                <div className="module-results">
                  <h5>모듈 로드 결과</h5>
                  <div className="module-list">
                    {moduleLoadProgress.results.map((result, index) => (
                      <div key={index} className={`module-item ${result.status}`}>
                        <span className="module-name">{result.module}</span>
                        <span className="module-status">{result.status}</span>
                        {result.details && (
                          <span className="module-version">v{result.details.version}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 로드된 모듈 목록 */}
          {loadedModules.length > 0 && (
            <div className="loaded-modules">
              <h4>로드된 모듈 ({loadedModules.length})</h4>
              <div className="module-grid">
                {loadedModules.map((module, index) => (
                  <div key={index} className="loaded-module">
                    {module}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 모듈 상태 확인 */}
          <div className="module-status-check">
            <h4>모듈 상태 확인</h4>
            <div className="status-check-controls">
              <select 
                value={selectedModule} 
                onChange={(e) => setSelectedModule(e.target.value)}
                className="module-select"
              >
                <option value="">모듈 선택</option>
                {MODULE_CONFIG.REQUIRED_MODULES.map(module => (
                  <option key={module} value={module}>{module}</option>
                ))}
              </select>
              <button 
                onClick={handleCheckModuleStatus}
                disabled={!selectedModule || loading}
                className="check-status-btn"
              >
                상태 확인
              </button>
            </div>

            {moduleStatus && (
              <div className="module-status-result">
                <h5>모듈 상태: {moduleStatus.name}</h5>
                <div className="status-details">
                  <p><strong>상태:</strong> {moduleStatus.state}</p>
                  <p><strong>설치됨:</strong> {moduleStatus.installed ? '예' : '아니오'}</p>
                  {moduleStatus.version && (
                    <p><strong>버전:</strong> {moduleStatus.version}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OdooConnectionManager; 