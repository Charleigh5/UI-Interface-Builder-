// components/hooks/useHapticFeedback.ts
import { useCallback } from 'react';

export const useHapticFeedback = (isMobileMode: boolean) => {
  const triggerHapticFeedback = useCallback(
    (type: "light" | "medium" | "heavy" | "selection" | "impact" = "light") => {
      if (!isMobileMode || typeof navigator === "undefined") return;

      try {
        // Modern Vibration API with pattern support
        if ("vibrate" in navigator) {
          const patterns = {
            light: [10],
            medium: [20],
            heavy: [30],
            selection: [5, 5, 5],
            impact: [15, 10, 15],
          };

          navigator.vibrate(patterns[type]);
        }

        // iOS Haptic Feedback (if available)
        // @ts-ignore - iOS specific API
        if ("hapticFeedback" in navigator && navigator.hapticFeedback) {
          const hapticTypes = {
            light: "impactLight",
            medium: "impactMedium",
            heavy: "impactHeavy",
            selection: "selectionChanged",
            impact: "impactMedium",
          };

          // @ts-ignore
          navigator.hapticFeedback.impactOccurred(hapticTypes[type]);
        }
      } catch (error) {
        // Silently fail if haptic feedback is not supported
        console.debug("Haptic feedback not supported:", error);
      }
    },
    [isMobileMode]
  );

  return { triggerHapticFeedback };
};