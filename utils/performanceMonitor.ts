import React from 'react';

/**
 * Performance Monitor – ensures 60 fps on mobile, provides fallbacks.
 */
class PerformanceMonitor {
  private isMonitoring = false;
  private frameCount = 0;
  private lastTime = 0;
  private fps = 60;
  private dropped = 0;
  private raf: number | null = null;

  start() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.measure(0);
  }

  stop() {
    this.isMonitoring = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
  }

  private measure = (t: number) => {
    if (!this.isMonitoring) return;
    this.frameCount++;
    const delta = t - this.lastTime;
    if (delta >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / delta);
      this.dropped += Math.max(0, Math.round((delta / 1000) * 60) - this.frameCount);
      this.frameCount = 0;
      this.lastTime = t;

      // Apply optimizations if needed
      if (this.fps < 45) {
        document.documentElement.style.setProperty('--animation-duration', '150ms');
        document.documentElement.classList.add('low-fps');
      } else {
        document.documentElement.style.setProperty('--animation-duration', '300ms');
        document.documentElement.classList.remove('low-fps');
      }
    }
    this.raf = requestAnimationFrame(this.measure);
  };

  getMetrics() {
    return { fps: this.fps, dropped: this.dropped };
  }
}

let instance: PerformanceMonitor | null = null;
export function getPerformanceMonitor() {
  if (!instance) instance = new PerformanceMonitor();
  return instance;
}

export function usePerformanceMonitoring(enabled = true) {
  const [metrics, setMetrics] = React.useState(() => getPerformanceMonitor().getMetrics());

  React.useEffect(() => {
    if (!enabled) return;
    const m = getPerformanceMonitor();
    m.start();
    const id = setInterval(() => setMetrics(m.getMetrics()), 1000);
    return () => {
      clearInterval(id);
      m.stop();
    };
  }, [enabled]);

  return metrics;
}