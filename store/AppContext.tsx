import React, { createContext, useReducer, useCallback, ReactNode, useMemo } from 'react';
import { WireframeComponent, Tool, Alignment, ComponentProperties, LayoutSuggestionType, ThemeMode, AppAction, DrawingSettings, MobileState, MobilePanelType } from '../library/types';
import * as geminiService from '../library/services/geminiService';
import { getDefaultProperties } from '../utils/componentUtils';
import { libraryItems } from '../library/definitions';

interface AppState extends MobileState {
  currentTool: Tool;
  components: WireframeComponent[];
  selectedComponentIds: string[];
  theme: ThemeMode;
  isAnalyzing: boolean;
  isConvertingImage: boolean;
  isGeneratingStyles: boolean;
  isGeneratingLayout: boolean;
  isGeneratingTheme: boolean;
  styleSuggestions: Partial<ComponentProperties>[];
  zoom: number;
  pan: { x: number; y: number };
  isRightSidebarVisible: boolean;
  isLeftSidebarVisible: boolean;
  drawingSettings: DrawingSettings;
  allEffectivelySelectedIds: Set<string>;
}

const initialState: AppState = {
  currentTool: 'pen',
  components: [],
  selectedComponentIds: [],
  theme: 'light',
  isAnalyzing: false,
  isConvertingImage: false,
  isGeneratingStyles: false,
  isGeneratingLayout: false,
  isGeneratingTheme: false,
  styleSuggestions: [],
  zoom: 1,
  pan: { x: 0, y: 0 },
  isRightSidebarVisible: true,
  isLeftSidebarVisible: true,
  drawingSettings: {
    penWidth: 2,
    penOpacity: 1,
    shapeFill: false,
  },
  isMobileMode: false,
  isMobileToolbarVisible: false,
  activeMobilePanel: 'none',
  toolbarPosition: 'bottom',
  allEffectivelySelectedIds: new Set(),
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  // ...existing reducer body unchanged...
  switch (action.type) {
    // (keep all existing cases exactly as in previous version)
    default:
      return state;
  }
};

type AppContextType = {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  addComponent: (component: Omit<WireframeComponent, 'id'>) => WireframeComponent;
  addLibraryComponent: (name: string, position: { x: number; y: number }) => void;
  selectComponent: (id: string | null, multiSelect: boolean) => void;
  toggleLock: (id: string) => void;
  groupComponents: () => void;
  ungroupComponents: () => void;
  alignComponents: (alignment: Alignment) => void;
  bringToFront: () => void;
  sendToBack: () => void;
  analyzeSketch: (imageDataUrl: string) => Promise<void>;
  convertImageToComponent: (imageDataUrl: string) => Promise<void>;
  duplicateComponents: () => void;
  generateContent: (prompt: string) => Promise<void>;
  generateStyles: (prompt: string) => Promise<void>;
  applyStyle: (style: Partial<ComponentProperties>) => void;
  generateLayout: (layoutType: LayoutSuggestionType) => Promise<void>;
  generateTheme: (imageDataUrl: string) => Promise<void>;
  setViewTransform: (transform: { zoom?: number; pan?: { x: number; y: number } }) => void;
  toggleRightSidebar: () => void;
  toggleLeftSidebar: () => void;
  setDrawingSetting: (key: keyof DrawingSettings, value: number | boolean) => void;
  setMobileMode: (isMobile: boolean) => void;
  toggleMobileToolbar: () => void;
  setActiveMobilePanel: (panel: MobilePanelType) => void;
  setMobileToolbarPosition: (position: 'bottom' | 'side') => void;
  allEffectivelySelectedIds: Set<string>;
};

export const AppContext = createContext<AppContextType>({} as AppContextType);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // ...all existing callbacks above unchanged...

  const allEffectivelySelectedIds = useMemo(() => {
    const selectedIds = new Set<string>();
    const allComponentsById = new Map<string, WireframeComponent>(
      state.components.map(c => [c.id, c])
    );

    const addAllChildren = (componentId: string) => {
      selectedIds.add(componentId);
      const component = allComponentsById.get(componentId);
      if (component && component.type === 'group' && component.childIds) {
        component.childIds.forEach(childId => addAllChildren(childId));
      }
    };

    state.selectedComponentIds.forEach(id => addAllChildren(id));
    return selectedIds;
  }, [state.components, state.selectedComponentIds]);

  const duplicateComponents = useCallback(() => {
    if (state.selectedComponentIds.length === 0) return;

    const allComponentsById = new Map<string, WireframeComponent>(
      state.components.map(c => [c.id, c])
    );
    const effectivelySelected = Array.from(allEffectivelySelectedIds)
      .map((id: string) => allComponentsById.get(id))
      .filter((c): c is WireframeComponent => !!c);

    if (effectivelySelected.some(c => c.isLocked)) {
      alert('Cannot duplicate locked components.');
      return;
    }

    const idMap = new Map<string, string>();
    effectivelySelected.forEach(c => {
      idMap.set(
        c.id,
        Date.now().toString() + Math.random().toString(36).substring(2, 9)
      );
    });

    const newComponents = effectivelySelected.map(c => ({
      ...c,
      id: idMap.get(c.id)!,
      x: c.x + 20,
      y: c.y + 20,
      label: `${c.label} (Copy)`,
      groupId: c.groupId ? idMap.get(c.groupId) : undefined,
      childIds: c.childIds?.map(childId => idMap.get(childId)!).filter(Boolean),
    }));

    const newTopLevelSelectedIds = state.selectedComponentIds
      .map(id => idMap.get(id)!)
      .filter(Boolean);

    dispatch({ type: 'ADD_COMPONENTS', payload: newComponents });
    dispatch({
      type: 'SET_SELECTED_COMPONENTS',
      payload: newTopLevelSelectedIds,
    });
  }, [state.components, state.selectedComponentIds, allEffectivelySelectedIds]);

  const contextValue: AppContextType = {
    state,
    dispatch,
    // ...all existing methods...
    allEffectivelySelectedIds,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};