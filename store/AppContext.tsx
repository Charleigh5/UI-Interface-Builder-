import React, { createContext, useReducer, useCallback, ReactNode } from 'react';
import { WireframeComponent, Tool, Alignment, ComponentProperties, LayoutSuggestionType, ThemeMode, AppAction } from '../library/types';
import * as geminiService from '../library/services/geminiService';
import { getDefaultProperties } from '../utils/componentUtils';
import { libraryItems } from '../library/definitions';

interface AppState {
    currentTool: Tool;
    components: WireframeComponent[];
    selectedComponentIds: string[];
    theme: ThemeMode;
    isAnalyzing: boolean;
    isGeneratingStyles: boolean;
    isGeneratingLayout: boolean;
    isGeneratingTheme: boolean;
    styleSuggestions: Partial<ComponentProperties>[];
}

const initialState: AppState = {
    currentTool: 'pen',
    components: [],
    selectedComponentIds: [],
    theme: 'light',
    isAnalyzing: false,
    isGeneratingStyles: false,
    isGeneratingLayout: false,
    isGeneratingTheme: false,
    styleSuggestions: [],
};

const appReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
        case 'SET_TOOL':
            return { ...state, currentTool: action.payload };
        case 'SET_THEME':
            return { ...state, theme: action.payload };
        case 'ADD_COMPONENT':
            return { ...state, components: [...state.components, action.payload] };
        case 'ADD_COMPONENTS':
            return { ...state, components: [...state.components, ...action.payload] };
        case 'UPDATE_COMPONENT': {
            const { id, updates } = action.payload;
            const componentToUpdate = state.components.find(c => c.id === id);
            if (!componentToUpdate) return state;

            const dx = 'x' in updates && updates.x !== undefined ? updates.x - componentToUpdate.x : 0;
            const dy = 'y' in updates && updates.y !== undefined ? updates.y - componentToUpdate.y : 0;

            if ((dx !== 0 || dy !== 0) && componentToUpdate.type === 'group' && componentToUpdate.childIds) {
                const allComponentsById = new Map(state.components.map(c => [c.id, c]));
                const getAllDescendantIds = (groupId: string): string[] => {
                    const group = allComponentsById.get(groupId);
                    if (!group?.childIds) return [];
                    return group.childIds.flatMap(childId => [childId, ...getAllDescendantIds(childId)]);
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
            const toDelete = new Set<string>();
            const component = state.components.find(c => c.id === action.payload);

            const addDescendantsToDelete = (groupId: string) => {
                toDelete.add(groupId);
                const group = state.components.find(c => c.id === groupId);
                if (group?.type === 'group' && group.childIds) {
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
            return { ...state, isAnalyzing: false, components: newComponents, selectedComponentIds: newComponents.map(c => c.id) };
        case 'ANALYZE_SKETCH_FAILURE':
            return { ...state, isAnalyzing: false };
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
    generateContent: (prompt: string) => Promise<void>;
    generateStyles: (prompt: string) => Promise<void>;
    applyStyle: (style: Partial<ComponentProperties>) => void;
    generateLayout: (layoutType: LayoutSuggestionType) => Promise<void>;
    generateTheme: (imageDataUrl: string) => Promise<void>;
};

export const AppContext = createContext<AppContextType>({} as AppContextType);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    const addComponent = useCallback((component: Omit<WireframeComponent, 'id'>) => {
        const newComponent: WireframeComponent = { ...component, id: Date.now().toString() + Math.random().toString(36).substring(2, 9) };
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
        if (id === null) {
            dispatch({ type: 'SET_SELECTED_COMPONENTS', payload: [] });
            return;
        }
        if (multiSelect) {
            const newSelection = state.selectedComponentIds.includes(id) ? state.selectedComponentIds.filter(i => i !== id) : [...state.selectedComponentIds, id];
            dispatch({ type: 'SET_SELECTED_COMPONENTS', payload: newSelection });
        } else {
            dispatch({ type: 'SET_SELECTED_COMPONENTS', payload: [id] });
        }
    }, [state.selectedComponentIds]);
    
    const toggleLock = useCallback((id: string) => {
        const component = state.components.find(c => c.id === id);
        if (component) {
            dispatch({ type: 'UPDATE_COMPONENT', payload: { id, updates: { isLocked: !component.isLocked } } });
        }
    }, [state.components]);

    const groupComponents = useCallback(() => {
        if (state.selectedComponentIds.length < 2) return;
        
        const selected = state.components.filter(c => state.selectedComponentIds.includes(c.id));
        const minX = Math.min(...selected.map(c => c.x));
        const minY = Math.min(...selected.map(c => c.y));
        const maxX = Math.max(...selected.map(c => c.x + c.width));
        const maxY = Math.max(...selected.map(c => c.y + c.height));

        const newGroup: WireframeComponent = {
            id: `group-${Date.now()}`, type: 'group',
            x: minX, y: minY, width: maxX - minX, height: maxY - minY,
            label: 'New Group', properties: {},
            childIds: state.selectedComponentIds, rotation: 0
        };
        dispatch({ type: 'GROUP_COMPONENTS', payload: newGroup });
    }, [state.components, state.selectedComponentIds]);

    const ungroupComponents = useCallback(() => {
        const group = state.components.find(c => state.selectedComponentIds.length === 1 && c.id === state.selectedComponentIds[0]);
        if (!group || group.type !== 'group' || !group.childIds) return;

        dispatch({ type: 'UNGROUP_COMPONENTS', payload: { groupToRemove: group.id, childrenToSelect: [...group.childIds] } });
    }, [state.components, state.selectedComponentIds]);

    const bringToFront = useCallback(() => {
        const selected = new Set(state.selectedComponentIds);
        const toMove = state.components.filter(c => selected.has(c.id) || (c.groupId && selected.has(c.groupId)));
        const rest = state.components.filter(c => !selected.has(c.id) && !(c.groupId && selected.has(c.groupId)));
        dispatch({ type: 'SET_COMPONENTS', payload: [...rest, ...toMove] });
    }, [state.components, state.selectedComponentIds]);

    const sendToBack = useCallback(() => {
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
                 dispatch({ type: 'UPDATE_COMPONENT', payload: { id, updates: { properties: { ...component.properties, ...style } } } });
            }
        });
    }, [state.components, state.selectedComponentIds]);
    
    const generateLayout = useCallback(async (layoutType: LayoutSuggestionType) => {
        const selected = state.components.filter(c => state.selectedComponentIds.includes(c.id));
        if (selected.length < 2) return;
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
            const themePalette = await geminiService.generateThemeFromImage(imageDataUrl);
            const updatedComponents = state.components.map(c => {
                let newProps = { ...c.properties };
                const isDark = state.theme === 'dark';
                
                newProps.backgroundColor = isDark ? themePalette.colors.secondary : themePalette.colors.backgroundLight;
                newProps.borderColor = isDark ? themePalette.colors.primary : themePalette.colors.secondary;
                newProps.textColor = isDark ? themePalette.colors.textLight : themePalette.colors.textDark;
                newProps.borderRadius = themePalette.borderRadius;
                newProps.fontWeight = themePalette.fontWeight;

                if(c.type === 'button') {
                    newProps.backgroundColor = themePalette.colors.primary;
                    newProps.borderColor = themePalette.colors.primary;
                    newProps.textColor = themePalette.colors.textLight;
                }
                
                return { ...c, properties: newProps };
            });
            dispatch({ type: 'SET_COMPONENTS', payload: updatedComponents });
            dispatch({ type: 'GENERATE_THEME_SUCCESS' });
        } catch (error) {
            console.error("Theme generation failed:", error);
            alert("Failed to generate theme from image. Please try again.");
            dispatch({ type: 'GENERATE_THEME_FAILURE' });
        }
    }, [state.components, state.theme]);

    const value = {
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
        generateContent,
        generateStyles,
        applyStyle,
        generateLayout,
        generateTheme,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};