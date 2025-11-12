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
    allEffectivelySelectedIds: Set<string>; // Added this property to AppState
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
    // Mobile state
    isMobileMode: false,
    isMobileToolbarVisible: false,
    activeMobilePanel: 'none',
    toolbarPosition: 'bottom',
    allEffectivelySelectedIds: new Set(), // Initialize the new property
};

const appReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
        case 'SET_TOOL':
            return { ...state, currentTool: action.payload };
        case 'SET_THEME': {
            const newTheme = action.payload;
            const updatedComponents = state.components.map(component => {
                const oldThemeDefaults = getDefaultProperties(component.type, state.theme);
                const newThemeDefaults = getDefaultProperties(component.type, newTheme);
                const newProperties = { ...component.properties };
                let propertiesChanged = false;

                const themeProps: (keyof ComponentProperties)[] = [
                    'backgroundColor',
                    'borderColor',
                    'textColor'
                ];

                for (const prop of themeProps) {
                    if (component.properties[prop] === oldThemeDefaults[prop]) {
                        newProperties[prop] = newThemeDefaults[prop];
                        propertiesChanged = true;
                    }
                }

                if (propertiesChanged) {
                    return { ...component, properties: newProperties };
                }

                return component;
            });

            return {
                ...state,
                theme: newTheme,
                components: updatedComponents,
            };
        }
        case 'ADD_COMPONENT':
            return { ...state, components: [...state.components, action.payload] };
        case 'ADD_COMPONENTS':
            return { ...state, components: [...state.components, ...action.payload] };
        case 'UPDATE_COMPONENT': {
            const { id, updates } = action.payload;
            const componentToUpdate = state.components.find(c => c.id === id);
            if (!componentToUpdate) return state;

            // Prevent updates to locked components, except for unlocking them.
            if (componentToUpdate.isLocked && !(updates.isLocked !== undefined && Object.keys(updates).length === 1)) {
                return state;
            }

            const dx = 'x' in updates && updates.x !== undefined ? updates.x - componentToUpdate.x : 0;
            const dy = 'y' in updates && updates.y !== undefined ? updates.y - componentToUpdate.y : 0;

            if ((dx !== 0 || dy !== 0) && componentToUpdate.type === 'group' && componentToUpdate.childIds) {
                const allComponentsById = new Map(state.components.map(c => [c.id, c]));
                const getAllDescendantIds = (groupId: string): string[] => {
                    const group = allComponentsById.get(groupId);
                    if (group && group.type === 'group' && group.childIds) return group.childIds.flatMap(childId => [childId, ...getAllDescendantIds(childId)]); // Added type guard
                    return [];
                };
                const descendantIds = new Set(getAllDescendantIds(id));
                
                return {
                    ...state,
                    components: state.components.map(c => {
                        if (c.id === id) return { ...c, ...updates };
                        if (descendantIds.has(c.id)) return { ...c, x: c.x + dx, y: c.y + dy };
                        return c;
                    })
                };
            }
            return { ...state, components: state.components.map(c => c.id === id ? { ...c, ...updates } : c) };
        }
        case 'DELETE_COMPONENT': {
            const component = state.components.find(c => c.id === action.payload);
            if (component?.isLocked) return state;

            const toDelete = new Set<string>();
            const addDescendantsToDelete = (groupId: string) => {
                toDelete.add(groupId);
                const group = state.components.find(c => c.id === groupId);
                if (group && group.type === 'group' && group.childIds) { // Added type guard
                    group.childIds.forEach(childId => addDescendantsToDelete(childId));
                }
            };
            if (component) addDescendantsToDelete(action.payload);
            
            return {
                ...state,
                components: state.components.filter(c => !toDelete.has(c.id)),
                selectedComponentIds: state.selectedComponentIds.filter(id => !toDelete.has(id)),
            };
        }
        case 'SET_SELECTED_COMPONENTS':
            return { ...state, selectedComponentIds: action.payload };
        case 'GROUP_COMPONENTS':
            return {
                ...state,
                components: [...state.components.map(c => state.selectedComponentIds.includes(c.id) ? { ...c, groupId: action.payload.id } : c), action.payload],
                selectedComponentIds: [action.payload.id],
            };
        case 'UNGROUP_COMPONENTS':
             return {
                ...state,
                components: state.components
                    .map(c => action.payload.childrenToSelect.includes(c.id) ? { ...c, groupId: undefined } : c)
                    .filter(c => c.id !== action.payload.groupToRemove),
                selectedComponentIds: action.payload.childrenToSelect,
            };
        case 'SET_COMPONENTS':
            return { ...state, components: action.payload };
        case 'ANALYZE_SKETCH_START':
            return { ...state, isAnalyzing: true };
        case 'ANALYZE_SKETCH_SUCCESS':
            const newComponents = action.payload.map(c => ({...c, id: Date.now().toString() + Math.random().toString(36).substring(2, 9) }));
            return { ...state, isAnalyzing: false, components: [...state.components, ...newComponents], selectedComponentIds: newComponents.map(c => c.id) };
        case 'ANALYZE_SKETCH_FAILURE':
            return { ...state, isAnalyzing: false };
        case 'CONVERT_IMAGE_START':
            return { ...state, isConvertingImage: true };
        case 'CONVERT_IMAGE_SUCCESS':
            return { 
                ...state, 
                isConvertingImage: false, 
                components: [...state.components, action.payload], 
                selectedComponentIds: [action.payload.id] 
            };
        case 'CONVERT_IMAGE_FAILURE':
            return { ...state, isConvertingImage: false };
        case 'GENERATE_STYLES_START':
            return { ...state, isGeneratingStyles: true };
        case 'GENERATE_STYLES_SUCCESS':
            return { ...state, isGeneratingStyles: false, styleSuggestions: action.payload };
        case 'GENERATE_STYLES_FAILURE':
            return { ...state, isGeneratingStyles: false };
        case 'CLEAR_STYLE_SUGGESTIONS':
            return { ...state, styleSuggestions: [] };
        case 'GENERATE_LAYOUT_START':
            return { ...state, isGeneratingLayout: true };
        case 'GENERATE_LAYOUT_SUCCESS':
        case 'GENERATE_LAYOUT_FAILURE':
            return { ...state, isGeneratingLayout: false };
        case 'GENERATE_THEME_START':
            return { ...state, isGeneratingTheme: true };
        case 'GENERATE_THEME_SUCCESS':
        case 'GENERATE_THEME_FAILURE':
            return { ...state, isGeneratingTheme: false };
        case 'SET_VIEW_TRANSFORM':
            return {
                ...state,
                zoom: action.payload.zoom ?? state.zoom,
                pan: action.payload.pan ?? state.pan,
            };
        case 'TOGGLE_RIGHT_SIDEBAR':
            return { ...state, isRightSidebarVisible: !state.isRightSidebarVisible };
        case 'TOGGLE_LEFT_SIDEBAR':
            return { ...state, isLeftSidebarVisible: !state.isLeftSidebarVisible };
        case 'SET_DRAWING_SETTING':
            return {
                ...state,
                drawingSettings: {
                    ...state.drawingSettings,
                    [action.payload.key]: action.payload.value,
                },
            };
        case 'SET_MOBILE_MODE':
            return { ...state, isMobileMode: action.payload };
        case 'TOGGLE_MOBILE_TOOLBAR':
            return { ...state, isMobileToolbarVisible: !state.isMobileToolbarVisible };
        case 'SET_ACTIVE_MOBILE_PANEL':
            return { ...state, activeMobilePanel: action.payload };
        case 'SET_MOBILE_TOOLBAR_POSITION':
            return { ...state, toolbarPosition: action.payload };
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

    const addComponent = useCallback((component: Omit<WireframeComponent, 'id'>) => {
        const newComponent: WireframeComponent = { ...component, id: Date.now().toString() + Math.random().toString(36).substring(2, 9), isLocked: false };
        dispatch({ type: 'ADD_COMPONENT', payload: newComponent });
        return newComponent;
    }, []);

    const addLibraryComponent = useCallback((name: string, position: { x: number; y: number }) => {
        const item = libraryItems[name];
        if (!item) return;

        const newGroupId = `group-${Date.now()}`;
        const childIds: string[] = [];
        const idSuffix = Math.random().toString(36).substring(2, 7);

        const newChildren: WireframeComponent[] = item.components.map((compDef, index) => {
            const newId = `${newGroupId}-${index}-${idSuffix}`;
            childIds.push(newId);
            return {
                ...compDef,
                id: newId,
                x: position.x + compDef.x, y: position.y + compDef.y,
                properties: { ...getDefaultProperties(compDef.type, state.theme), ...compDef.properties },
                rotation: 0, isLocked: false, groupId: newGroupId,
            };
        });

        const groupComponent: WireframeComponent = {
            id: newGroupId, type: 'group', x: position.x, y: position.y,
            width: item.width, height: item.height, label: item.name,
            properties: {}, childIds: childIds, rotation: 0, isLocked: false,
        };

        dispatch({ type: 'ADD_COMPONENTS', payload: [groupComponent, ...newChildren] });
        dispatch({ type: 'SET_SELECTED_COMPONENTS', payload: [newGroupId] });
    }, [state.theme]);

    const selectComponent = useCallback((id: string | null, multiSelect: boolean = false) => {
        const allComponentsById = new Map(state.components.map(c => [c.id, c]));
        
        const findTopLevelGroup = (componentId: string): string => {
            const component = allComponentsById.get(componentId);
            if (component && component.groupId) { // Added type guard
                return findTopLevelGroup(component.groupId);
            }
            return componentId;
        };
        
        if (id === null) {
            dispatch({ type: 'SET_SELECTED_COMPONENTS', payload: [] });
            return;
        }

        const topLevelId = findTopLevelGroup(id);

        if (multiSelect) {
            const currentTopLevelSelection = new Set(state.selectedComponentIds.map(findTopLevelGroup));
             if (currentTopLevelSelection.has(topLevelId)) {
                const newSelection = state.selectedComponentIds.filter(selId => findTopLevelGroup(selId) !== topLevelId);
                 dispatch({ type: 'SET_SELECTED_COMPONENTS', payload: newSelection });
            } else {
                dispatch({ type: 'SET_SELECTED_COMPONENTS', payload: [...state.selectedComponentIds, topLevelId] });
            }
        } else {
             dispatch({ type: 'SET_SELECTED_COMPONENTS', payload: [topLevelId] });
        }
    }, [state.components, state.selectedComponentIds]);
    
    const toggleLock = useCallback((id: string) => {
        const component = state.components.find(c => c.id === id);
        if (component) {
            const newLockState = !component.isLocked;
            // Recursively toggle lock state for children of a group
            const componentsToUpdate = new Map<string, { isLocked: boolean }>();
            
            const updateLockStateRecursive = (componentId: string) => {
                const comp = allComponentsById.get(componentId); // Use allComponentsById here
                if (comp) {
                    componentsToUpdate.set(comp.id, { isLocked: newLockState });
                    if (comp.type === 'group' && comp.childIds) {
                        comp.childIds.forEach(childId => updateLockStateRecursive(childId));
                    }
                }
            };
            
            const allComponentsById = new Map(state.components.map(c => [c.id, c])); // Define here
            updateLockStateRecursive(id);

            componentsToUpdate.forEach((updates, componentId) => {
                 dispatch({ type: 'UPDATE_COMPONENT', payload: { id: componentId, updates } });
            });
        }
    }, [state.components]);

    const groupComponents = useCallback(() => {
        if (state.selectedComponentIds.length < 2) return;
        
        const selected = state.components.filter(c => state.selectedComponentIds.includes(c.id));
        if (selected.some(c => c.isLocked)) {
            alert("Cannot modify locked components. Please unlock them first.");
            return;
        }
        const minX = Math.min(...selected.map(c => c.x));
        const minY = Math.min(...selected.map(c => c.y));
        const maxX = Math.max(...selected.map(c => c.x + c.width));
        const maxY = Math.max(...selected.map(c => c.y + c.height));

        const newGroup: WireframeComponent = {
            id: `group-${Date.now()}`, type: 'group',
            x: minX, y: minY, width: maxX - minX, height: maxY - minY,
            label: 'New Group', properties: {},
            childIds: state.selectedComponentIds, rotation: 0, isLocked: false,
        };
        dispatch({ type: 'GROUP_COMPONENTS', payload: newGroup });
    }, [state.components, state.selectedComponentIds]);

    const ungroupComponents = useCallback(() => {
        const group = state.components.find(c => state.selectedComponentIds.length === 1 && c.id === state.selectedComponentIds[0]);
        if (!group || group.type !== 'group' || !group.childIds) return;

        if (group.isLocked) {
            alert("Cannot ungroup a locked group. Please unlock it first.");
            return;
        }

        dispatch({ type: 'UNGROUP_COMPONENTS', payload: { groupToRemove: group.id, childrenToSelect: [...group.childIds] } });
    }, [state.components, state.selectedComponentIds]);

    const bringToFront = useCallback(() => {
        const selectedComponents = state.components.filter(c => state.selectedComponentIds.includes(c.id));
        if (selectedComponents.some(c => c.isLocked)) {
            alert("Cannot reorder locked components.");
            return;
        }

        const selected = new Set(state.selectedComponentIds);
        const toMove = state.components.filter(c => selected.has(c.id) || (c.groupId && selected.has(c.groupId)));
        const rest = state.components.filter(c => !selected.has(c.id) && !(c.groupId && selected.has(c.groupId)));
        dispatch({ type: 'SET_COMPONENTS', payload: [...rest, ...toMove] });
    }, [state.components, state.selectedComponentIds]);

    const sendToBack = useCallback(() => {
        const selectedComponents = state.components.filter(c => state.selectedComponentIds.includes(c.id));
        if (selectedComponents.some(c => c.isLocked)) {
            alert("Cannot reorder locked components.");
            return;
        }
        const selected = new Set(state.selectedComponentIds);
        const toMove = state.components.filter(c => selected.has(c.id) || (c.groupId && selected.has(c.groupId)));
        const rest = state.components.filter(c => !selected.has(c.id) && !(c.groupId && selected.has(c.groupId)));
        dispatch({ type: 'SET_COMPONENTS', payload: [...toMove, ...rest] });
    }, [state.components, state.selectedComponentIds]);

    const alignComponents = useCallback((alignment: Alignment) => {
        if (state.selectedComponentIds.length < 2) return;
        
        const allComponentsById = new Map(state.components.map(c => [c.id, c]));
        const selected = state.selectedComponentIds.map(id => allComponentsById.get(id)!).filter(Boolean);
        if (selected.length < 2) return;

        if (selected.some(c => c.isLocked)) {
            alert("Cannot align locked components. Please unlock them first.");
            return;
        }
        
        const first = selected[0];
        
        selected.forEach(c => {
            if (c.id === first.id) return;
            let updates: Partial<WireframeComponent> = {};
             switch (alignment) {
                case 'left': updates = { x: first.x }; break;
                case 'center-horizontal': updates = { x: (first.x + first.width / 2) - c.width / 2 }; break;
                case 'right': updates = { x: (first.x + first.width) - c.width }; break;
                case 'top': updates = { y: first.y }; break;
                case 'center-vertical': updates = { y: (first.y + first.height / 2) - c.height / 2 }; break;
                case 'bottom': updates = { y: (first.y + first.height) - c.height }; break;
            }
             dispatch({ type: 'UPDATE_COMPONENT', payload: { id: c.id, updates } });
        });

    }, [state.components, state.selectedComponentIds]);
    
    const analyzeSketch = useCallback(async (imageDataUrl: string) => {
        dispatch({ type: 'ANALYZE_SKETCH_START' });
        try {
            const newComponents = await geminiService.analyzeSketch(imageDataUrl, state.theme);
            dispatch({ type: 'ANALYZE_SKETCH_SUCCESS', payload: newComponents });
        } catch (error) {
            console.error("Failed to analyze sketch:", error);
            alert("Sorry, I couldn't understand that sketch. Please try again with a clearer drawing.");
            dispatch({ type: 'ANALYZE_SKETCH_FAILURE' });
        }
    }, [state.theme]);

    const convertImageToComponent = useCallback(async (imageDataUrl: string) => {
        dispatch({ type: 'CONVERT_IMAGE_START' });
        try {
            const componentData = await geminiService.convertImageToComponent(imageDataUrl, state.theme);
            
            const canvasElement = document.querySelector('canvas');
            const canvasWidth = canvasElement ? canvasElement.clientWidth : window.innerWidth * 0.7;
            const canvasHeight = canvasElement ? canvasElement.clientHeight : window.innerHeight;
            const centerX = (canvasWidth / 2 - state.pan.x) / state.zoom;
            const centerY = (canvasHeight / 2 - state.pan.y) / state.zoom;
            
            const newComponent: WireframeComponent = {
                ...componentData,
                id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
                x: centerX - (componentData.width || 100) / 2,
                y: centerY - (componentData.height || 100) / 2,
            };
            
            dispatch({ type: 'CONVERT_IMAGE_SUCCESS', payload: newComponent });
        } catch (error) {
            console.error("Failed to convert image to component:", error);
            alert("Sorry, I couldn't convert that image. Please try again with a clearer image of a single component.");
            dispatch({ type: 'CONVERT_IMAGE_FAILURE' });
        }
    }, [state.theme, state.pan, state.zoom]);
    
    const generateContent = useCallback(async (prompt: string) => {
        const selected = state.components.filter(c => state.selectedComponentIds.includes(c.id));
        if (!prompt || selected.length === 0) return;
        try {
            const contentUpdates = await geminiService.generateContentForComponents(prompt, selected);
            contentUpdates.forEach(({ id, updates }) => {
                const currentComp = state.components.find(c => c.id === id);
                if (currentComp) {
                    const newProps = { ...currentComp.properties, ...updates.properties };
                    dispatch({ type: 'UPDATE_COMPONENT', payload: { id, updates: { ...updates, properties: newProps } } });
                }
            });
        } catch (error) {
            console.error("Content generation failed:", error);
            alert("Failed to generate content. Please try again.");
        }
    }, [state.components, state.selectedComponentIds]);

    const generateStyles = useCallback(async (prompt: string) => {
        const selected = state.components.filter(c => state.selectedComponentIds.includes(c.id));
        if (!prompt || selected.length === 0) return;
        dispatch({ type: 'GENERATE_STYLES_START' });
        try {
            const suggestions = await geminiService.generateStyleVariations(prompt, selected);
            dispatch({ type: 'GENERATE_STYLES_SUCCESS', payload: suggestions });
        } catch (error) {
            console.error("Style generation failed:", error);
            dispatch({ type: 'GENERATE_STYLES_FAILURE' });
            alert("Failed to generate styles. Please try again.");
        }
    }, [state.components, state.selectedComponentIds]);
    
    const applyStyle = useCallback((style: Partial<ComponentProperties>) => {
        state.selectedComponentIds.forEach(id => {
            const component = state.components.find(c => c.id === id);
            if (component) {
                 dispatch({ type: 'UPDATE_COMPONENT', payload: { id, updates: { properties: { ...component.properties, ...style } } });
            }
        });
    }, [state.components, state.selectedComponentIds]);
    
    const generateLayout = useCallback(async (layoutType: LayoutSuggestionType) => {
        const selected = state.components.filter(c => state.selectedComponentIds.includes(c.id));
        if (selected.length < 2) return;
        if (selected.some(c => c.isLocked)) {
            alert("Cannot generate layout for locked components.");
            return;
        }
        dispatch({ type: 'GENERATE_LAYOUT_START' });
        try {
            const layoutUpdates = await geminiService.generateLayoutSuggestions(selected, layoutType);
            layoutUpdates.forEach(({ id, updates }) => dispatch({ type: 'UPDATE_COMPONENT', payload: { id, updates } }));
            dispatch({ type: 'GENERATE_LAYOUT_SUCCESS' });
        } catch (error) {
            console.error("Layout generation failed:", error);
            alert("Failed to generate layout. Please try again.");
            dispatch({ type: 'GENERATE_LAYOUT_FAILURE' });
        }
    }, [state.components, state.selectedComponentIds]);

    const generateTheme = useCallback(async (imageDataUrl: string) => {
        dispatch({ type: 'GENERATE_THEME_START' });
        try {
            const theme = await geminiService.generateThemeFromImage(imageDataUrl);
            const { colors, borderRadius, fontWeight } = theme;
            
            const updatedComponents = state.components.map(component => {
                 const newProperties: Partial<ComponentProperties> = {
                    borderRadius,
                    fontWeight,
                 };
                switch (component.type) {
                    case 'button':
                        newProperties.backgroundColor = colors.primary;
                        newProperties.borderColor = colors.primary;
                        newProperties.textColor = colors.textLight;
                        break;
                    case 'input':
                        newProperties.backgroundColor = colors.backgroundLight;
                        newProperties.borderColor = colors.secondary;
                        newProperties.textColor = colors.textDark;
                        break;
                    case 'text':
                        newProperties.textColor = colors.textDark;
                        break;
                    default:
                        newProperties.backgroundColor = colors.backgroundLight;
                        newProperties.borderColor = colors.secondary;
                        break;
                }
                
                return { ...component, properties: { ...component.properties, ...newProperties } };
            });

            dispatch({ type: 'SET_COMPONENTS', payload: updatedComponents });
            dispatch({ type: 'GENERATE_THEME_SUCCESS' });
        } catch (error) {
            console.error("Theme generation failed:", error);
            dispatch({ type: 'GENERATE_THEME_FAILURE' });
            alert("Failed to generate theme from image. Please try again.");
        }
    }, [state.components]);

    const setViewTransform = useCallback((transform: { zoom?: number; pan?: { x: number; y: number } }) => {
        dispatch({ type: 'SET_VIEW_TRANSFORM', payload: transform });
    }, []);

    const toggleRightSidebar = useCallback(() => {
        dispatch({ type: 'TOGGLE_RIGHT_SIDEBAR' });
    }, []);

    const toggleLeftSidebar = useCallback(() => {
        dispatch({ type: 'TOGGLE_LEFT_SIDEBAR' });
    }, []);

    const setDrawingSetting = useCallback((key: keyof DrawingSettings, value: number | boolean) => {
        dispatch({ type: 'SET_DRAWING_SETTING', payload: { key, value } });
    }, []);

    const setMobileMode = useCallback((isMobile: boolean) => {
        dispatch({ type: 'SET_MOBILE_MODE', payload: isMobile });
    }, []);

    const toggleMobileToolbar = useCallback(() => {
        dispatch({ type: 'TOGGLE_MOBILE_TOOLBAR' });
    }, []);

    const setActiveMobilePanel = useCallback((panel: MobilePanelType) => {
        dispatch({ type: 'SET_ACTIVE_MOBILE_PANEL', payload: panel });
    }, []);

    const setMobileToolbarPosition = useCallback((position: 'bottom' | 'side') => {
        dispatch({ type: 'SET_MOBILE_TOOLBAR_POSITION', payload: position });
    }, []);

    const allEffectivelySelectedIds = useMemo(() => {
        const selectedIds = new Set<string>();
        const allComponentsById = new Map(state.components.map(c => [c.id, c]));

        const addAllChildren = (componentId: string) => {
            selectedIds.add(componentId);
            const component = allComponentsById.get(componentId);
            if (component && component.type === 'group' && component.childIds) { // Added type guard
                component.childIds.forEach(childId => addAllChildren(childId));
            }
        };

        state.selectedComponentIds.forEach(id => {
            addAllChildren(id);
        });
        
        return selectedIds;
    }, [state.components, state.selectedComponentIds]);

    const duplicateComponents = useCallback(() => {
        if (state.selectedComponentIds.length === 0) return;

        const allComponentsById = new Map(state.components.map(c => [c.id, c]));
        // Fix: Use a type guard with `.filter()` to ensure correct type inference and prevent errors with `unknown` types.
        const componentsToDuplicate = Array.from(allEffectivelySelectedIds)
            .map(id => allComponentsById.get(id as string)) // Cast id to string
            .filter((c): c is WireframeComponent => !!c);
        
        if (componentsToDuplicate.some(c => c.isLocked)) {
            alert("Cannot duplicate locked components.");
            return;
        }

        const idMap = new Map<string, string>();
        componentsToDuplicate.forEach(c => {
            idMap.set(c.id, Date.now().toString() + Math.random().toString(36).substring(2, 9));
        });

        const newComponents = componentsToDuplicate.map(c => ({
            ...c,
            id: idMap.get(c.id)!,
            x: c.x + 20,
            y: c.y + 20,
            label: `${c.label} (Copy)`,
            groupId: c.groupId ? idMap.get(c.groupId) : undefined,
            childIds: c.childIds?.map(childId => idMap.get(childId)!).filter(Boolean),
        }));

        const newTopLevelSelectedIds = state.selectedComponentIds.map(id => idMap.get(id)!).filter(Boolean);

        dispatch({ type: 'ADD_COMPONENTS', payload: newComponents });
        dispatch({ type: 'SET_SELECTED_COMPONENTS', payload: newTopLevelSelectedIds });
    }, [state.components, state.selectedComponentIds, allEffectivelySelectedIds]);

    return (
        <AppContext.Provider value={{ 
            state, 
            dispatch, 
            addComponent,
            addLibraryComponent,
            selectComponent, 
            toggleLock,
            groupComponents,
            ungroupComponents,
            alignComponents,
            bringToFront,
            sendToBack,
            analyzeSketch,
            convertImageToComponent,
            duplicateComponents,
            generateContent,
            generateStyles,
            applyStyle,
            generateLayout,
            generateTheme,
            setViewTransform,
            toggleRightSidebar,
            toggleLeftSidebar,
            setDrawingSetting,
            setMobileMode,
            toggleMobileToolbar,
            setActiveMobilePanel,
            setMobileToolbarPosition,
            allEffectivelySelectedIds,
        }}>
            {children}
        </AppContext.Provider>
    );
};