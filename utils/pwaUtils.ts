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
  // Check for secure context
  const isSecure = window.isSecureContext || 
                   window.location.protocol === 'https:' || 
                   window.location.hostname === 'localhost' ||
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname.endsWith('.local');
  
  // Check if we're not in an iframe (some browsers block SW in iframes)
  const notInIframe = window.top === window;
  
  return isSecure && notInIframe;
};

// Check if we're in a development environment
export const isDevelopment = (): boolean => {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.endsWith('.local');
};

// Check if we should attempt PWA features
export const shouldAttemptPWA = (): boolean => {
  return isSafeEnvironment() && 
         !isDevelopment() && // Skip in development to avoid conflicts
         'serviceWorker' in navigator;
};

// Get PWA installation prompt
export const getInstallPrompt = async (): Promise<any | null> => {
  if (!('BeforeInstallPromptEvent' in window)) {
    return null;
  }

  return new Promise((resolve) => {
    let promptEvent: any;
    
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      promptEvent = e;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Clean up after 5 seconds if no event
    setTimeout(() => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      resolve(promptEvent || null);
    }, 5000);
  });
};

// Enhanced service worker status checker
export const getServiceWorkerStatus = async () => {
  if (!('serviceWorker' in navigator)) {
    return { supported: false, registered: false, reason: 'not_supported' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return {
      supported: true,
      registered: true,
      state: registration.active?.state || 'unknown',
      scope: registration.scope
    };
  } catch (error) {
    return {
      supported: true,
      registered: false,
      reason: 'registration_failed',
      error: error.message
    };
  }
};

export const checkServiceWorkerHealth = async () => {
  const status = await getServiceWorkerStatus();
  
  if (!status.supported) {
    return {
      healthy: true,
      message: 'Service Worker not supported (normal on this browser)',
      action: 'none'
    };
  }

  if (!status.registered) {
    return {
      healthy: true,
      message: 'Service Worker not registered',
      action: 'none'
    };
  }

  if (status.state === 'activating' || status.state === 'installing') {
    return {
      healthy: false,
      message: 'Service Worker is installing...',
      action: 'wait'
    };
  }

  if (status.state === 'activated') {
    return {
      healthy: true,
      message: 'Service Worker is active and running',
      action: 'none'
    };
  }

  return {
    healthy: true,
    message: `Service Worker state: ${status.state}`,
    action: 'none'
  };
};