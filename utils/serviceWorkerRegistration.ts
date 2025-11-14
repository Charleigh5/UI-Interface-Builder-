interface ServiceWorkerRegistrationConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

class ServiceWorkerRegistrationManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateCheckInterval: number | null = null;

  async register(config: ServiceWorkerRegistrationConfig = {}) {
    if (!('serviceWorker' in navigator)) {
      console.warn('ServiceWorker is not supported in this browser');
      return null;
    }

    try {
      console.log('Registering service worker...');
      
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      this.registration = registration;
      console.log('ServiceWorker registered successfully:', registration.scope);

      // Handle successful registration
      config.onSuccess?.(registration);

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          console.log('Service Worker update found');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('Service Worker update available');
              config.onUpdate?.(registration);
              
              // Optionally notify the user about the update
              this.showUpdateNotification(registration);
            }
          });
        }
      });

      // Start checking for updates periodically
      this.startUpdateChecks();

      // Listen for controller changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed');
        window.location.reload();
      });

      return registration;

    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
      config.onError?.(error as Error);
      return null;
    }
  }

  private startUpdateChecks() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }

    // Check for updates every 5 minutes
    this.updateCheckInterval = window.setInterval(() => {
      if (this.registration) {
        this.registration.update();
      }
    }, 5 * 60 * 1000);
  }

  private showUpdateNotification(registration: ServiceWorkerRegistration) {
    // Create a simple update notification
    const updateNotification = document.createElement('div');
    updateNotification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #2563eb;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 9999;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      max-width: 300px;
    `;
    
    updateNotification.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: 600;">Update Available</div>
      <div style="margin-bottom: 12px; opacity: 0.9;">A new version of the app is ready.</div>
      <div>
        <button id="update-now" style="
          background: white;
          color: #2563eb;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          margin-right: 8px;
        ">Update Now</button>
        <button id="update-later" style="
          background: transparent;
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        ">Later</button>
      </div>
    `;

    document.body.appendChild(updateNotification);

    // Handle update now
    updateNotification.querySelector('#update-now')?.addEventListener('click', () => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });

    // Handle update later
    updateNotification.querySelector('#update-later')?.addEventListener('click', () => {
      document.body.removeChild(updateNotification);
    });

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (document.body.contains(updateNotification)) {
        document.body.removeChild(updateNotification);
      }
    }, 10000);
  }

  unregister() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }

    if (this.registration) {
      return this.registration.unregister();
    }

    return Promise.resolve(false);
  }
}

// Export singleton instance
export const serviceWorkerManager = new ServiceWorkerRegistrationManager();

// Convenience function for easy registration
export const registerServiceWorker = (config?: ServiceWorkerRegistrationConfig) => {
  return serviceWorkerManager.register(config);
};