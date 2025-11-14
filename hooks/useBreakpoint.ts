import { useState, useEffect } from 'react';

/**
 * Returns booleans for common responsive breakpoints.
 * Uses a mobile‑first approach.
 */
export function useBreakpoint() {
  const [bp, setBp] = useState({
    xs: false,
    sm: false,
    md: false,
    lg: false,
    xl: false,
    '2xl': false,
  });

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setBp({
        xs: w >= 320,
        sm: w >= 375,
        md: w >= 480,
        lg: w >= 768,
        xl: w >= 1024,
        '2xl': w >= 1440,
      });
    };

    update();
    const id = setTimeout(() => {
      window.addEventListener('resize', update, { passive: true });
    }, 100); // debounce 100ms

    return () => {
      clearTimeout(id);
      window.removeEventListener('resize', update);
    };
  }, []);

  return bp;
}