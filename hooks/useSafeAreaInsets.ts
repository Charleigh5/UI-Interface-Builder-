import { useState, useEffect } from 'react';

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Detects safe‑area insets for notches, home indicator, Android cutouts.
 * Falls back to zero insets when CSS env() is not supported.
 */
export function useSafeAreaInsets(): SafeAreaInsets {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const readInsets = () => {
      if (!CSS?.supports?.('padding-top: env(safe-area-inset-top)')) {
        return { top: 0, right: 0, bottom: 0, left: 0 };
      }

      const el = document.createElement('div');
      Object.assign(el.style, {
        position: 'fixed',
        top: 0,
        left: 0,
        width: 0,
        height: 0,
        padding: 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
      });
      document.body.appendChild(el);
      const cs = window.getComputedStyle(el);
      const result = {
        top: parseInt(cs.paddingTop!, 10) || 0,
        right: parseInt(cs.paddingRight!, 10) || 0,
        bottom: parseInt(cs.paddingBottom!, 10) || 0,
        left: parseInt(cs.paddingLeft!, 10) || 0,
      };
      document.body.removeChild(el);
      return result;
    };

    const update = () => setInsets(readInsets());
    update();

    const or = () => setTimeout(update, 100);
    window.addEventListener('orientationchange', or, { passive: true });
    window.addEventListener('resize', update, { passive: true });

    return () => {
      window.removeEventListener('orientationchange', or);
      window.removeEventListener('resize', update);
    };
  }, []);

  return insets;
}