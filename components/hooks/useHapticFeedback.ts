import { useCallback } from 'react';

export const useHapticFeedback = (isMobile: boolean) => {
  const triggerHapticFeedback = useCallback(
    (type: 'light' | 'medium' | 'heavy' | 'selection' | 'impact' = 'light') => {
      if (!isMobile || typeof navigator === 'undefined') return;

      try {
        // Modern Vibration API
        if ('vibrate' in navigator) {
          const patterns: Record<string, number[]> = {
            light: [10],
            medium: [20],
            heavy: [30],
            selection: [5, 5, 5],
            impact: [15, 10, 15],
          };
          navigator.vibrate(patterns[type]);
        }

        // iOS Taptic Engine (if available)
        // @ts-ignore
        if ('hapticFeedback' in navigator && navigator.hapticFeedback) {
          const hapticTypes: Record<string, string> = {
            light: 'impactLight',
            medium: 'impactMedium',
            heavy: 'impactHeavy',
            selection: 'selectionChanged',
            impact: 'impactMedium',
          };
          // @ts-ignore
          navigator.hapticFeedback.impactOccurred(hapticTypes[type]);
        }
      } catch (e) {
        // Ignore errors – haptics are progressive enhancement
      }
    },
    [isMobile]
  );

  return { triggerHapticFeedback };
};