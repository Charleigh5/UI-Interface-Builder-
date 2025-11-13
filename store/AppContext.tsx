import React, {
  createContext,
  useContext,
  useCallback,
  ReactNode,
} from 'react';
import { useStore } from './store';
import {
  Alignment,
  LayoutSuggestionType,
  MobilePanelType,
} from '../library/types';

export interface AppContextValue {
  // full zustand state snapshot (components expect `state.xxx`)
  state: ReturnType<typeof useStore>;
  // selection
  selectComponent: (id: string | null, multiSelect: boolean) => void;
  // layout toggles (web)
  toggleRightSidebar: () => void;
  toggleLeftSidebar: () => void;
  // mobile UI controls
  toggleMobileToolbar: () => void;
  setActiveMobilePanel: (panel: MobilePanelType) => void;
  // component helpers
  toggleLock: (id: string) => void;
  groupComponents: () => void;
  ungroupComponents: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  duplicateComponents: () => void;
  alignComponents: (alignment: Alignment) => void;
  // AI/layout helper
  generateLayout: (layoutType: LayoutSuggestionType) => Promise<void>;
  // view transform
  setViewTransform: (t: {
    zoom?: number;
    pan?: { x: number; y: number };
  }) => void;
}

export const AppContext = createContext<AppContextValue | undefined>(
  undefined
);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const fullState = useStore();

  // Selection uses zustand setters directly to avoid stale closures
  const selectComponent = useCallback(
    (id: string | null, multiSelect: boolean) => {
      const { selectedComponentIds, setSelectedComponents } =
        useStore.getState();

      if (id === null) {
        setSelectedComponents([]);
        return;
      }

      if (multiSelect) {
        const exists = selectedComponentIds.includes(id);
        const next = exists
          ? selectedComponentIds.filter(x => x !== id)
          : [...selectedComponentIds, id];
        setSelectedComponents(next);
      } else {
        setSelectedComponents([id]);
      }
    },
    []
  );

  const toggleRightSidebar = useCallback(() => {
    useStore.setState(s => ({
      isRightSidebarVisible: !s.isRightSidebarVisible,
    }));
  }, []);

  const toggleLeftSidebar = useCallback(() => {
    useStore.setState(s => ({
      isLeftSidebarVisible: !s.isLeftSidebarVisible,
    }));
  }, []);

  const toggleMobileToolbar = useCallback(() => {
    useStore.setState(s => ({
      isMobileToolbarVisible: !s.isMobileToolbarVisible,
    }));
  }, []);

  const setActiveMobilePanel = useCallback((panel: MobilePanelType) => {
    useStore.setState({ activeMobilePanel: panel });
  }, []);

  // Simple passthroughs to zustand actions
  const toggleLock = useStore(s => s.toggleLock);
  const groupComponents = useStore(s => s.groupComponents);
  const ungroupComponents = useStore(s => s.ungroupComponents);
  const bringToFront = useStore(s => s.bringToFront);
  const sendToBack = useStore(s => s.sendToBack);
  const duplicateComponents = useStore(s => s.duplicateComponents);
  const alignComponents = useStore(s => s.alignComponents);
  const generateLayout = useStore(s => s.generateLayout);
  const setViewTransform = useStore(s => s.setViewTransform);

  const value: AppContextValue = {
    state: fullState,
    selectComponent,
    toggleRightSidebar,
    toggleLeftSidebar,
    toggleMobileToolbar,
    setActiveMobilePanel,
    toggleLock,
    groupComponents,
    ungroupComponents,
    bringToFront,
    sendToBack,
    duplicateComponents,
    alignComponents,
    generateLayout,
    setViewTransform,
  };

  return (
    <AppContext.Provider value={value}>{children}</AppContext.Provider>
  );
};

export const useAppContext = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return ctx;
};