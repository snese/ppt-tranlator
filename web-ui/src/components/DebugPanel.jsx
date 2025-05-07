import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/aws-service';
import Logger from '../utils/logger';
import AppConfig from '../utils/appConfig';
import './DebugPanel.css';

/**
 * Debug panel component for displaying system information and debug controls
 */
const DebugPanel = ({ isVisible }) => {
  const [systemInfo, setSystemInfo] = useState(null);
  const [healthInfo, setHealthInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('system');
  
  const fetchDebugInfo = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch system debug info
      const sysInfo = await ApiService.makeRequest('debug?type=system');
      setSystemInfo(sysInfo);
      
      // Fetch health check info
      const healthData = await ApiService.makeRequest('health');
      setHealthInfo(healthData);
    } catch (err) {
      setError(err.message);
      Logger.error('Failed to fetch debug info', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Don't render if not visible
  if (!isVisible) return null;
  
  return (
    <div className="debug-panel">
      <h2>Debug Information</h2>
      
      <div className="debug-tabs">
        <button 
          className={activeTab === 'system' ? 'active' : ''} 
          onClick={() => setActiveTab('system')}>
          System Info
        </button>
        <button 
          className={activeTab === 'health' ? 'active' : ''} 
          onClick={() => setActiveTab('health')}>
          Health Check
        </button>
        <button 
          className={activeTab === 'logs' ? 'active' : ''} 
          onClick={() => setActiveTab('logs')}>
          Logs
        </button>
        <button 
          className={activeTab === 'actions' ? 'active' : ''} 
          onClick={() => setActiveTab('actions')}>
          Actions
        </button>
      </div>
      
      <div className="debug-actions">
        <button onClick={fetchDebugInfo} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Refresh Debug Info'}
        </button>
        <button 
          onClick={() => AppConfig.toggleDebug()} 
          className={AppConfig.debugMode ? 'active' : ''}>
          {AppConfig.debugMode ? 'Disable Debug Mode' : 'Enable Debug Mode'}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="debug-content">
        {activeTab === 'system' && (
          <div className="debug-section">
            <h3>System Information</h3>
            {systemInfo ? (
              <pre>{JSON.stringify(systemInfo, null, 2)}</pre>
            ) : (
              <p>No system information available. Click "Refresh Debug Info" to load data.</p>
            )}
          </div>
        )}
        
        {activeTab === 'health' && (
          <div className="debug-section">
            <h3>Health Check</h3>
            {healthInfo ? (
              <div>
                <div className={`health-status ${healthInfo.status}`}>
                  Status: {healthInfo.status}
                </div>
                <pre>{JSON.stringify(healthInfo, null, 2)}</pre>
              </div>
            ) : (
              <p>No health information available. Click "Refresh Debug Info" to load data.</p>
            )}
          </div>
        )}
        
        {activeTab === 'logs' && (
          <div className="debug-section">
            <h3>Log Settings</h3>
            <div className="log-controls">
              <button onClick={() => Logger.setLevel(Logger.levels.DEBUG)}>
                Debug Level
              </button>
              <button onClick={() => Logger.setLevel(Logger.levels.INFO)}>
                Info Level
              </button>
              <button onClick={() => Logger.setLevel(Logger.levels.WARN)}>
                Warning Level
              </button>
              <button onClick={() => Logger.setLevel(Logger.levels.ERROR)}>
                Error Level
              </button>
            </div>
            <p>Open the browser console (F12) to view logs.</p>
          </div>
        )}
        
        {activeTab === 'actions' && (
          <div className="debug-section">
            <h3>Debug Actions</h3>
            <div className="debug-actions-grid">
              <button onClick={() => console.clear()}>
                Clear Console
              </button>
              <button onClick={() => localStorage.clear()}>
                Clear Local Storage
              </button>
              <button onClick={() => {
                const testLog = {
                  message: 'Test log message',
                  timestamp: new Date().toISOString(),
                  data: { test: 'data', number: 123 }
                };
                Logger.debug('Debug test', testLog);
                Logger.info('Info test', testLog);
                Logger.warn('Warning test', testLog);
                Logger.error('Error test', testLog);
              }}>
                Generate Test Logs
              </button>
              <button onClick={() => {
                window.location.reload();
              }}>
                Reload Application
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPanel;
