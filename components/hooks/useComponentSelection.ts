import React, { useCallback } from 'react';
import { WireframeComponent } from '../../library/types';

interface UseComponentSelectionProps {
  components: WireframeComponent[];
  selectedComponentIds: string[];
  selectComponent: (id: string | null, multiSelect: boolean) => void;
  triggerHapticFeedback: (
    type?: 'light' | 'medium' | 'heavy' | 'selection' | 'impact'
  ) => void;
}

export const useComponentSelection = ({
  components,
  selectedComponentIds,
  selectComponent,
  triggerHapticFeedback,
}: UseComponentSelectionProps) => {
  const handleComponentSelection = useCallback(
    (
      componentId: string,
      action: string,
      isLocked: boolean,
      isMultiSelect: boolean
    ) => {
      if (isLocked) {
        selectComponent(componentId, isMultiSelect);
        return;
      }

      const feedbackType = action === 'rotating' ? 'medium' : 'light';
      triggerHapticFeedback(feedbackType);

      if (!selectedComponentIds.includes(componentId)) {
        selectComponent(componentId, false);
        triggerHapticFeedback('selection');
      }
    },
    [selectedComponentIds, selectComponent, triggerHapticFeedback]
  );

  return { handleComponentSelection };
};