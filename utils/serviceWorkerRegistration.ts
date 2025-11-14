import { isDevelopment, isSafeEnvironment, getServiceWorkerStatus } from './pwaUtils';

interface ServiceWorkerRegistrationConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

class ServiceWorkerRegistrationManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateCheckInterval: number | null = null;
  private isRegistering = false;

  private async checkServiceWorkerFileExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async unregisterExistingServiceWorkers(): Promise<void> {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('Unregistered existing service worker:', registration.scope);
      }
    } catch (error) {
      console.warn('Failed to unregister existing service workers:', error);
    }
  }

  private async waitForServiceWorkerReady(): Promise<ServiceWorkerRegistration | null> {
    return new Promise((resolve) => {
      if (navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(resolve);
      } else {
        resolve(null);
      }
    });
  }

  async register(config: ServiceWorkerRegistrationConfig = {}) {
    // Prevent multiple simultaneous registration attempts
    if (this.isRegistering) {
      console.log('Service worker registration already in progress');
      return null;
    }

    // Only register in safe environments
    if (!isSafeEnvironment()) {
      console.log('🛡️ Service Worker registration skipped (unsafe environment)');
      return null;
    }

    if (!('serviceWorker' in navigator)) {
      console.log('ℹ️ ServiceWorker not supported in this browser');
      return null;
    }

    this.isRegistering = true;

    try {
      console.log('🔄 Starting service worker registration...');

      // First, unregister any existing service workers to prevent conflicts
      await this.unregisterExistingServiceWorkers();

      // Wait a bit for unregistration to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if service worker file exists
      const serviceWorkerExists = await this.checkServiceWorkerFileExists('/service-worker.js');
      if (!serviceWorkerExists) {
        console.warn('⚠️ Service worker file not found - skipping registration');
        this.isRegistering = false;
        return null;
      }

      console.log('✅ Service worker file found, attempting registration...');

      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      });

      this.registration = registration;
      console.log('✅ ServiceWorker registered successfully:', registration.scope);
      console.log('📋 Service worker state:', registration.active?.state || 'installing');

      // Wait for the service worker to be ready
      const readyRegistration = await this.waitForServiceWorkerReady();
      if (readyRegistration) {
        console.log('✅ Service worker is ready and active');
      }

      // Handle successful registration
      config.onSuccess?.(registration);

      // Handle service worker updates (skip verbose logging in development)
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          console.log('🔄 Service Worker update found');
          
          newWorker.addEventListener('statechange', () => {
            console.log('📋 Service worker update state:', newWorker.state);
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('🔄 Service Worker update ready');
                config.onUpdate?.(registration);
                if (!isDevelopment()) {
                  this.showUpdateNotification(registration);
                }
              } else {
                console.log('✅ Service Worker installed (first time)');
              }
            }
          });
        }
      });

      // Start update checks (only in production)
      if (!isDevelopment()) {
        this.startUpdateChecks();
      }

      // Listen for controller changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker controller changed - reloading page');
        window.location.reload();
      });

      this.isRegistering = false;
      return registration;

    } catch (error) {
      console.error('❌ ServiceWorker registration failed:', error);
      config.onError?.(error as Error);
      this.isRegistering = false;
      
      // Don't throw - just return null to indicate failure
      return null;
    }
  }

  private startUpdateChecks() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }

    // Check for updates every 5 minutes (only in production)
    this.updateCheckInterval = window.setInterval(() => {
      if (this.registration && !this.isRegistering) {
        console.log('🔄 Checking for service worker updates...');
        this.registration.update().catch(error => {
          console.warn('⚠️ Service worker update check failed:', error);
        });
      }
    }, 5 * 60 * 1000);
  }

  private showUpdateNotification(registration: ServiceWorkerRegistration) {
    try {
      // Create update notification
      const updateNotification = document.createElement('div');
      updateNotification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        max-width: 320px;
        animation: slideIn 0.3s ease-out;
      `;

      updateNotification.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <div style="
            width: 24px; 
            height: 24px; 
            background: rgba(255,255,255,0.2); 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            margin-right: 12px;
            font-size: 12px;
          ">🚀</div>
          <div style="font-weight: 600; font-size: 15px;">Update Available</div>
        </div>
        <div style="margin-bottom: 16px; opacity: 0.9; line-height: 1.4;">
          A new version of the app is ready with improvements and bug fixes.
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="update-now" style="
            background: white;
            color: #2563eb;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          " onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='white'">
            Update Now
          </button>
          <button id="update-later" style="
            background: transparent;
            color: white;
            border: 1px solid rgba(255,255,255,0.3);
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s ease;
          " onmouseover="this.style.backgroundColor='rgba(255,255,255,0.1)'" onmouseout="this.style.backgroundColor='transparent'">
            Later
          </button>
        </div>
      `;

      // Add CSS for animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);

      document.body.appendChild(updateNotification);

      // Handle update now
      updateNotification.querySelector('#update-now')?.addEventListener('click', () => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        document.body.removeChild(updateNotification);
      });

      // Handle update later
      updateNotification.querySelector('#update-later')?.addEventListener('click', () => {
        if (document.body.contains(updateNotification)) {
          document.body.removeChild(updateNotification);
        }
      });

      // Auto-remove after 15 seconds
      setTimeout(() => {
        if (document.body.contains(updateNotification)) {
          document.body.removeChild(updateNotification);
          document.head.removeChild(style);
        }
      }, 15000);
    } catch (error) {
      console.warn('Failed to show update notification:', error);
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