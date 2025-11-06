// components/hooks/useComponentSelection.ts
import { useCallback } from 'react';
import { WireframeComponent } from '../../library/types';

interface UseComponentSelectionProps {
  components: WireframeComponent[];
  selectComponent: (id: string | null, multiSelect: boolean) => void;
  triggerHapticFeedback: (type?: "light" | "medium" | "heavy" | "selection" | "impact") => void;
}

export const useComponentSelection = ({
  components,
  selectComponent,
  triggerHapticFeedback,
}: UseComponentSelectionProps) => {
  const handleComponentSelection = useCallback((
    componentId: string,
    action: string,
    isLocked: boolean,
    isMultiSelect: boolean
  ) => {
    if (isLocked) {
      selectComponent(componentId, isMultiSelect);
      return;
    }

    // Trigger haptic feedback for manipulation start
    const feedbackType = action === "rotating" ? "medium" : "light";
    triggerHapticFeedback(feedbackType);

    if (!components.some(c => c.id === componentId && c.isSelected)) {
      selectComponent(componentId, false);
      // Trigger haptic feedback for component selection
      triggerHapticFeedback("selection");
    }
  }, [components, selectComponent, triggerHapticFeedback]);

  return { handleComponentSelection };
};