export const isStandalone = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
};

export const isInWebAppiOS = (): boolean => {
  return (window.navigator as any).standalone === true;
};

export const isInstallable = (): boolean => {
  return 'serviceWorker' in navigator && 
         'BeforeInstallPromptEvent' in window;
};

export const getPWAMode = (): 'standalone' | 'browser' | 'unknown' => {
  if (isStandalone()) return 'standalone';
  if (isInWebAppiOS()) return 'standalone';
  return 'browser';
};

export const isSafeEnvironment = (): boolean => {
  // Only enable PWA features in safe environments
  return window.location.protocol === 'https:' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
};

// Check if we're in a development environment
export const isDevelopment = (): boolean => {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1';
};

// Register service worker with environment checks
export const registerPWAServiceWorker = async (): Promise<boolean> => {
  // Only try to register service worker in safe environments
  if (!isSafeEnvironment()) {
    console.log('🛡️ PWA features disabled in unsafe environment');
    return false;
  }

  try {
    if ('serviceWorker' in navigator) {
      // Check if service worker file exists before attempting registration
      const response = await fetch('/service-worker.js', { method: 'HEAD' });
      if (!response.ok) {
        console.warn('⚠️ Service worker file not found');
        return false;
      }

      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('✅ PWA ServiceWorker registered:', registration.scope);
      return true;
    }
  } catch (error) {
    console.warn('⚠️ PWA ServiceWorker registration failed:', error);
  }

  return false;
};