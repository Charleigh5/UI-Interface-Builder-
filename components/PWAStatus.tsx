import React, { useState, useEffect } from 'react';
import { getServiceWorkerStatus } from '../utils/serviceWorkerRegistration';

interface PWAStatusProps {
  showDebugInfo?: boolean;
}

export const PWAStatus: React.FC<PWAStatusProps> = ({ showDebugInfo = false }) => {
  const [status, setStatus] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const swStatus = await getServiceWorkerStatus();
      setStatus(swStatus);
    };

    checkStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!showDebugInfo) return null;

  const toggleVisibility = () => setIsVisible(!isVisible);

  return (
    <div style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 9999 }}>
      <button
        onClick={toggleVisibility}
        style={{
          background: status?.healthy ? '#10b981' : '#f59e0b',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          padding: '8px 12px',
          fontSize: '12px',
          cursor: 'pointer',
          fontFamily: 'monospace'
        }}
      >
        PWA {status?.healthy ? '✓' : '⚠'}
      </button>

      {isVisible && (
        <div style={{
          background: 'rgba(0,0,0,0.9)',
          color: 'white',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '11px',
          fontFamily: 'monospace',
          marginTop: '8px',
          minWidth: '250px',
          maxHeight: '300px',
          overflow: 'auto'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>PWA Status Debug Info</div>
          
          {status && (
            <div>
              <div>Supported: {status.supported ? 'Yes' : 'No'}</div>
              <div>Registered: {status.registered ? 'Yes' : 'No'}</div>
              {status.state && <div>State: {status.state}</div>}
              {status.scope && <div>Scope: {status.scope}</div>}
              {status.reason && <div>Reason: {status.reason}</div>}
              {status.error && <div>Error: {status.error}</div>}
              <div>Time: {new Date().toLocaleTimeString()}</div>
            </div>
          )}
          
          <button
            onClick={() => setIsVisible(false)}
            style={{
              background: 'transparent',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer',
              marginTop: '8px'
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};