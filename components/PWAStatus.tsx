import React, { useState, useEffect } from 'react';

export const PWAStatus: React.FC = () => {
  const [status, setStatus] = useState<string>('checking...');
  const [isInstallable, setIsInstallable] = useState<boolean>(false);

  useEffect(() => {
    const checkStatus = async () => {
      // Check if we're in standalone mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      
      if (isStandalone) {
        setStatus('Installed as PWA');
        setIsInstallable(false);
        return;
      }

      // Check if installable
      if ('serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window) {
        setStatus('Ready to install');
        setIsInstallable(true);
      } else {
        setStatus('Not installable in this browser');
        setIsInstallable(false);
      }
    };

    checkStatus();
  }, []);

  return (
    <div className="pwa-status">
      <p>Status: {status}</p>
      {isInstallable && (
        <button 
          onClick={() => {
            // Trigger install prompt
            window.dispatchEvent(new Event('beforeinstallprompt'));
          }}
          className="install-button"
        >
          Install App
        </button>
      )}
    </div>
  );
};