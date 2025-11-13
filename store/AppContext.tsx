import React, { createContext, useContext, useCallback } from 'react';
import { useStore } from './store';
import {
  Alignment,
  LayoutSuggestionType,
  MobilePanelType,
} from '../library/types';

// The shape of the context that components expect
export interface AppContextValue {
  // Full state snapshot (components expect `state.xxx`)
  state: ReturnType<typeof useStore>;
  // Selection helpers
  selectComponent: (id: string | null, multiSelect: boolean) => void;
  // Sidebar toggles (web)
  toggleRightSidebar: () => void;
  toggleLeftSidebar: () => void;
  // Mobile UI helpers
  toggleMobileToolbar: () => void;
  setActiveMobilePanel: (panel: MobilePanelType) => void;
  // Component actions
  toggleLock: (id: string) => void;
  groupComponents: () => void;
  ungroupComponents: () => void;
  bringToFront: () => void;
  sendToBack: () => void;
  duplicateComponents: () => void;
  alignComponents: (alignment: Alignment) => void;
  // AI/layout helpers
  generateLayout: (layoutType: LayoutSuggestionType) => Promise<void>;
  // View transform
  setViewTransform: (t: {
    zoom?: number;
    pan?: { x: number; y: number };
  }) => void;
}

// Create the context
export const AppContext = createContext<AppContextValue | undefined>(undefined);

// Provider that wraps the app
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Use the Zustand store directly for the state snapshot
  const fullState = useStore();

  // Selection – use Zustand directly to avoid stale closures
  const selectComponent = useCallback(
    (id: string | null, multiSelect: boolean) => {
      const { selectedComponentIds, setSelectedComponents } = useStore.getState();

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

  // Simple passthroughs to Zustand actions
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

  // Direct delegates to Zustand actions
  const toggleLock = useStore(s => s.toggleLock);
  const groupComponents = useStore(s => s.groupComponents);
  const ungroupComponents = useStore(s => s.ungroupComponents);
  const bringToFront = useStore(s => s.bringToFront);
  const sendToBack = useStore(s => s.sendToBack);
  const duplicateComponents = useStore(s => s.duplicateComponents);
  const alignComponents = useStore(s => s.alignComponents);
  const generateLayout = useStore(s => s.generateLayout);
  const setViewTransform = useStore(s => s.setViewTransform);

  // Assemble the context value
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

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Helper hook – throws if used outside of AppProvider
export const useAppContext = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return ctx;
};