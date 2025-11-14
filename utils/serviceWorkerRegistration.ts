import { isDevelopment, isSafeEnvironment } from './pwaUtils';

interface ServiceWorkerRegistrationConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

class ServiceWorkerRegistrationManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateCheckInterval: number | null = null;

  private async checkServiceWorkerFileExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async register(config: ServiceWorkerRegistrationConfig = {}) {
    // Only register in safe environments
    if (!isSafeEnvironment()) {
      console.log('🛡️ Service Worker registration skipped (unsafe environment)');
      return null;
    }

    if (!('serviceWorker' in navigator)) {
      console.log('ℹ️ ServiceWorker not supported in this browser');
      return null;
    }

    try {
      // Check if service worker file exists
      const serviceWorkerExists = await this.checkServiceWorkerFileExists('/service-worker.js');
      if (!serviceWorkerExists) {
        console.warn('⚠️ Service worker file not found - skipping registration');
        return null;
      }

      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      this.registration = registration;
      console.log('✅ ServiceWorker registered successfully:', registration.scope);

      // Only show verbose logging in development
      if (!isDevelopment()) {
        config.onSuccess?.(registration);
      } else {
        config.onSuccess?.(registration);
      }

      // Handle service worker updates (skip in development)
      if (!isDevelopment()) {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                config.onUpdate?.(registration);
                this.showUpdateNotification(registration);
              }
            });
          }
        });

        this.startUpdateChecks();

        // Listen for controller changes
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
      }

      return registration;

    } catch (error) {
      console.warn('⚠️ ServiceWorker registration failed:', error);
      config.onError?.(error as Error);
      return null;
    }
  }

  private startUpdateChecks() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }

    // Check for updates every 5 minutes (only in production)
    if (!isDevelopment()) {
      this.updateCheckInterval = window.setInterval(() => {
        if (this.registration) {
          this.registration.update().catch(() => {
            // Silently fail update checks
          });
        }
      }, 5 * 60 * 1000);
    }
  }

  private showUpdateNotification(registration: ServiceWorkerRegistration) {
    try {
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

      updateNotification.querySelector('#update-now')?.addEventListener('click', () => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });

      updateNotification.querySelector('#update-later')?.addEventListener('click', () => {
        if (document.body.contains(updateNotification)) {
          document.body.removeChild(updateNotification);
        }
      });

      setTimeout(() => {
        if (document.body.contains(updateNotification)) {
          document.body.removeChild(updateNotification);
        }
      }, 10000);
    } catch (error) {
      // Fail silently
    }
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