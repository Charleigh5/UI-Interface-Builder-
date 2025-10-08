import React from 'react';

/**
 * Performance Monitor for Mobile UI
 * 
 * Monitors animation performance, battery usage, and provides fallbacks for low-end devices.
 * Ensures 60fps animations and optimizes for battery efficiency.
 */

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  droppedFrames: number;
  batteryLevel?: number;
  isLowPowerMode?: boolean;
}

interface PerformanceConfig {
  targetFPS: number;
  warningThreshold: number;
  criticalThreshold: number;
  enableLogging: boolean;
}

class PerformanceMonitor {
  private config: PerformanceConfig;
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private fps: number = 60;
  private droppedFrames: number = 0;
  private isMonitoring: boolean = false;
  private animationFrameId: number | null = null;
  private performanceObserver: PerformanceObserver | null = null;
  private batteryManager: any = null;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      targetFPS: 60,
      warningThreshold: 45,
      criticalThreshold: 30,
      enableLogging: process.env.NODE_ENV === 'development',
      ...config,
    };
  }

  /**
   * Start monitoring performance
   */
  public start(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.frameCount = 0;
    this.droppedFrames = 0;
    this.lastFrameTime = performance.now();

    // Start FPS monitoring
    this.monitorFPS();

    // Monitor long tasks
    this.monitorLongTasks();

    // Monitor battery if available
    this.monitorBattery();

    if (this.config.enableLogging) {
      console.log('[PerformanceMonitor] Started monitoring');
    }
  }

  /**
   * Stop monitoring performance
   */
  public stop(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }

    if (this.config.enableLogging) {
      console.log('[PerformanceMonitor] Stopped monitoring');
    }
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    return {
      fps: Math.round(this.fps),
      frameTime: 1000 / this.fps,
      droppedFrames: this.droppedFrames,
      batteryLevel: this.batteryManager?.level,
      isLowPowerMode: this.batteryManager?.charging === false && this.batteryManager?.level < 0.2,
    };
  }

  /**
   * Check if performance is acceptable
   */
  public isPerformanceAcceptable(): boolean {
    return this.fps >= this.config.warningThreshold;
  }

  /**
   * Check if performance is critical
   */
  public isPerformanceCritical(): boolean {
    return this.fps < this.config.criticalThreshold;
  }

  /**
   * Get recommended quality level based on performance
   */
  public getRecommendedQuality(): 'high' | 'medium' | 'low' {
    const metrics = this.getMetrics();

    if (metrics.isLowPowerMode || this.isPerformanceCritical()) {
      return 'low';
    }

    if (!this.isPerformanceAcceptable()) {
      return 'medium';
    }

    return 'high';
  }

  /**
   * Apply performance optimizations based on current metrics
   */
  public applyOptimizations(): void {
    const quality = this.getRecommendedQuality();

    switch (quality) {
      case 'low':
        this.applyLowQualityMode();
        break;
      case 'medium':
        this.applyMediumQualityMode();
        break;
      case 'high':
        this.applyHighQualityMode();
        break;
    }
  }

  /**
   * Monitor FPS using requestAnimationFrame
   */
  private monitorFPS(): void {
    const measureFPS = (currentTime: number) => {
      if (!this.isMonitoring) return;

      this.frameCount++;
      const deltaTime = currentTime - this.lastFrameTime;

      // Calculate FPS every second
      if (deltaTime >= 1000) {
        this.fps = (this.frameCount * 1000) / deltaTime;
        
        // Track dropped frames
        const expectedFrames = (deltaTime / 1000) * this.config.targetFPS;
        const dropped = Math.max(0, expectedFrames - this.frameCount);
        this.droppedFrames += dropped;

        // Log performance warnings
        if (this.config.enableLogging) {
          if (this.isPerformanceCritical()) {
            console.warn(`[PerformanceMonitor] Critical FPS: ${Math.round(this.fps)}fps`);
          } else if (!this.isPerformanceAcceptable()) {
            console.warn(`[PerformanceMonitor] Low FPS: ${Math.round(this.fps)}fps`);
          }
        }

        this.frameCount = 0;
        this.lastFrameTime = currentTime;
      }

      this.animationFrameId = requestAnimationFrame(measureFPS);
    };

    this.animationFrameId = requestAnimationFrame(measureFPS);
  }

  /**
   * Monitor long tasks that block the main thread
   */
  private monitorLongTasks(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50 && this.config.enableLogging) {
            console.warn(`[PerformanceMonitor] Long task detected: ${entry.duration.toFixed(2)}ms`);
          }
        }
      });

      this.performanceObserver.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      // PerformanceObserver not supported or longtask not available
      if (this.config.enableLogging) {
        console.debug('[PerformanceMonitor] Long task monitoring not available');
      }
    }
  }

  /**
   * Monitor battery status
   */
  private async monitorBattery(): Promise<void> {
    if (typeof navigator === 'undefined' || !('getBattery' in navigator)) {
      return;
    }

    try {
      this.batteryManager = await (navigator as any).getBattery();

      if (this.config.enableLogging) {
        console.log(`[PerformanceMonitor] Battery level: ${(this.batteryManager.level * 100).toFixed(0)}%`);
      }

      // Listen for battery changes
      this.batteryManager.addEventListener('levelchange', () => {
        if (this.config.enableLogging) {
          console.log(`[PerformanceMonitor] Battery level changed: ${(this.batteryManager.level * 100).toFixed(0)}%`);
        }
        this.applyOptimizations();
      });

      this.batteryManager.addEventListener('chargingchange', () => {
        if (this.config.enableLogging) {
          console.log(`[PerformanceMonitor] Charging status: ${this.batteryManager.charging}`);
        }
        this.applyOptimizations();
      });
    } catch (error) {
      // Battery API not available
      if (this.config.enableLogging) {
        console.debug('[PerformanceMonitor] Battery monitoring not available');
      }
    }
  }

  /**
   * Apply low quality mode optimizations
   */
  private applyLowQualityMode(): void {
    if (this.config.enableLogging) {
      console.log('[PerformanceMonitor] Applying low quality mode');
    }

    // Disable non-essential animations
    document.documentElement.style.setProperty('--animation-duration', '0.01ms');
    document.documentElement.classList.add('low-performance-mode');
  }

  /**
   * Apply medium quality mode optimizations
   */
  private applyMediumQualityMode(): void {
    if (this.config.enableLogging) {
      console.log('[PerformanceMonitor] Applying medium quality mode');
    }

    // Reduce animation duration
    document.documentElement.style.setProperty('--animation-duration', '150ms');
    document.documentElement.classList.remove('low-performance-mode');
    document.documentElement.classList.add('medium-performance-mode');
  }

  /**
   * Apply high quality mode optimizations
   */
  private applyHighQualityMode(): void {
    if (this.config.enableLogging) {
      console.log('[PerformanceMonitor] Applying high quality mode');
    }

    // Full animation duration
    document.documentElement.style.setProperty('--animation-duration', '300ms');
    document.documentElement.classList.remove('low-performance-mode', 'medium-performance-mode');
  }
}

// Singleton instance
let performanceMonitorInstance: PerformanceMonitor | null = null;

/**
 * Get or create the performance monitor instance
 */
export function getPerformanceMonitor(config?: Partial<PerformanceConfig>): PerformanceMonitor {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor(config);
  }
  return performanceMonitorInstance;
}

/**
 * Hook to use performance monitoring in React components
 */
export function usePerformanceMonitoring(enabled: boolean = true): PerformanceMetrics {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics>({
    fps: 60,
    frameTime: 16.67,
    droppedFrames: 0,
  });

  React.useEffect(() => {
    if (!enabled) return;

    const monitor = getPerformanceMonitor();
    monitor.start();

    // Update metrics every second
    const interval = setInterval(() => {
      setMetrics(monitor.getMetrics());
      monitor.applyOptimizations();
    }, 1000);

    return () => {
      clearInterval(interval);
      monitor.stop();
    };
  }, [enabled]);

  return metrics;
}
