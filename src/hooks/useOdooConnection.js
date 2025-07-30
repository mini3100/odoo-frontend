import { useState, useEffect, useCallback } from 'react';
import odooConnection from '../utils/odooConnection';
import { Logger } from '../config/odooConfig';

export const useOdooConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isConnected, setIsConnected] = useState(false);
  const [loadedModules, setLoadedModules] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [moduleLoadProgress, setModuleLoadProgress] = useState({
    total: 0,
    loaded: 0,
    failed: 0,
    notInstalled: 0,
    results: []
  });

  const updateConnectionStatus = useCallback(() => {
    const status = odooConnection.getConnectionStatus();
    setConnectionStatus(status.status);
    setIsConnected(status.isConnected);
    setLoadedModules(status.loadedModules);
    setSession(status.session);
  }, []);

  const connect = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await odooConnection.connect(username, password);
      
      if (result.success) {
        updateConnectionStatus();
        return { success: true, session: result.session };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [updateConnectionStatus]);

  const disconnect = useCallback(async () => {
    setLoading(true);
    try {
      await odooConnection.disconnect();
      updateConnectionStatus();
      setModuleLoadProgress({
        total: 0,
        loaded: 0,
        failed: 0,
        notInstalled: 0,
        results: []
      });
    } catch (err) {
      Logger.error('연결 해제 중 오류', err);
    } finally {
      setLoading(false);
    }
  }, [updateConnectionStatus]);

  const loadModules = useCallback(async () => {
    if (!isConnected) {
      setError('연결되지 않은 상태에서 모듈을 로드할 수 없습니다.');
      return { success: false, error: '연결되지 않은 상태' };
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await odooConnection.loadRequiredModules();
      setModuleLoadProgress(result);
      updateConnectionStatus();
      return { success: true, result };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [isConnected, updateConnectionStatus]);

  const checkModuleStatus = useCallback(async (moduleName) => {
    if (!isConnected) {
      throw new Error('연결되지 않은 상태입니다.');
    }
    
    try {
      const status = await odooConnection.checkModuleStatus(moduleName);
      return status;
    } catch (err) {
      throw err;
    }
  }, [isConnected]);

  const callMethod = useCallback(async (model, method, args = [], kwargs = {}) => {
    if (!isConnected) {
      throw new Error('연결되지 않은 상태입니다.');
    }
    
    try {
      const result = await odooConnection.callMethod(model, method, args, kwargs);
      return result;
    } catch (err) {
      throw err;
    }
  }, [isConnected]);

  const searchRead = useCallback(async (model, domain = [], fields = [], limit = 0, offset = 0) => {
    if (!isConnected) {
      throw new Error('연결되지 않은 상태입니다.');
    }
    
    try {
      const result = await odooConnection.searchRead(model, domain, fields, limit, offset);
      return result;
    } catch (err) {
      throw err;
    }
  }, [isConnected]);

  useEffect(() => {
    if (isConnected) {
      const stopMonitoring = odooConnection.startConnectionMonitoring();
      return stopMonitoring;
    }
  }, [isConnected]);

  useEffect(() => {
    updateConnectionStatus();
  }, [updateConnectionStatus]);

  return {
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
    checkModuleStatus,
    callMethod,
    searchRead,
    updateConnectionStatus
  };
}; 