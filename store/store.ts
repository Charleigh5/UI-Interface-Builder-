import { create } from 'zustand';
import { WireframeComponent, Tool, Alignment, ComponentProperties, LayoutSuggestionType, ThemeMode, DrawingSettings, MobilePanelType } from '../library/types';
import * as geminiService from '../library/services/geminiService';
import { getDefaultProperties } from '../utils/componentUtils';
import { libraryItems } from '../library/definitions';

interface AppState {
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
    isMobileMode: boolean;
    isMobileToolbarVisible: boolean;
    activeMobilePanel: MobilePanelType;
    toolbarPosition: 'bottom' | 'side';
    allEffectivelySelectedIds: Set<string>; // Added this property to AppState
    
    setTool: (tool: Tool) => void;
    setTheme: (theme: ThemeMode) => void;
    addComponent: (component: Omit<WireframeComponent, 'id'>) => WireframeComponent;
    addComponents: (components: WireframeComponent[]) => void;
    updateComponent: (id: string, updates: Partial<WireframeComponent>) => void;
    deleteComponent: (id: string) => void;
    setSelectedComponents: (ids: string[]) => void;
    groupComponents: () => void;
    ungroupComponents: () => void;
    bringToFront: () => void;
    sendToBack: () => void;
    duplicateComponents: () => void;
    addLibraryComponent: (name: string, position: { x: number; y: number }) => void;
    setViewTransform: (transform: { zoom?: number; pan?: { x: number; y: number } }) => void;
    toggleLock: (id: string) => void;
    alignComponents: (alignment: Alignment) => void;
    generateContent: (prompt: string) => Promise<void>;
    generateStyles: (prompt: string) => Promise<void>;
    applyStyle: (style: Partial<ComponentProperties>) => void;
    clearStyleSuggestions: () => void;
    generateLayout: (layoutType: LayoutSuggestionType) => Promise<void>;
    generateTheme: (imageDataUrl: string) => Promise<void>;
    analyzeSketch: (imageDataUrl: string) => Promise<void>;
    setDrawingSetting: (key: keyof DrawingSettings, value: number | boolean) => void;
    convertImageToComponent: (imageDataUrl: string) => Promise<void>;
    setMobileMode: (isMobile: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
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
    allEffectivelySelectedIds: new Set(), // Initialize the new property

    setTool: (tool) => set({ currentTool: tool }),

    setTheme: (theme) => {
        const { components } = get();
        const updatedComponents = components.map(component => {
            const oldThemeDefaults = getDefaultProperties(component.type, get().theme);
            const newThemeDefaults = getDefaultProperties(component.type, theme);
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

        set({ theme, components: updatedComponents });
    },

    addComponent: (component) => {
        const newComponent: WireframeComponent = { ...component, id: Date.now().toString() + Math.random().toString(36).substring(2, 9), isLocked: false };
        set(state => ({ components: [...state.components, newComponent] }));
        return newComponent;
    },

    addComponents: (components) => set(state => ({ components: [...state.components, ...components] })),

    updateComponent: (id, updates) => set(state => ({
        components: state.components.map(c => (c.id === id ? { ...c, ...updates } : c))
    })),

    deleteComponent: (id) => set(state => {
        const component = state.components.find(c => c.id === id);
        if (component?.isLocked) return state;

        const toDelete = new Set<string>();
        const addDescendantsToDelete = (groupId: string) => {
            toDelete.add(groupId);
            const group = state.components.find(c => c.id === groupId);
            if (group && group.type === 'group' && group.childIds) { // Added type guard
                group.childIds.forEach(childId => addDescendantsToDelete(childId));
            }
        };
        if (component) addDescendantsToDelete(id);
        
        return {
            components: state.components.filter(c => !toDelete.has(c.id)),
            selectedComponentIds: state.selectedComponentIds.filter(id => !toDelete.has(id)),
        };
    }),

    setSelectedComponents: (ids) => set({ selectedComponentIds: ids }),

    setMobileMode: (isMobile) => set({ isMobileMode: isMobile }),

    groupComponents: () => set(state => {
        if (state.selectedComponentIds.length < 2) return state;
        
        const selected = state.components.filter(c => state.selectedComponentIds.includes(c.id));
        if (selected.some(c => c.isLocked)) {
            alert("Cannot modify locked components. Please unlock them first.");
            return state;
        }
        const minX = Math.min(...selected.map(c => c.x));
        const minY = Math.min(...selected.map(c => c.y));
        const maxX = Math.max(...selected.map(c => c.x + c.width));
        const maxY = Math.max(...selected.map(c => c.y + c.height));

        const newGroup: WireframeComponent = {
            id: `group-${Date.now()}`,
            type: 'group',
            x: minX, y: minY, width: maxX - minX, height: maxY - minY,
            label: 'New Group', properties: {},
            childIds: state.selectedComponentIds, rotation: 0, isLocked: false,
        };

        return {
            components: [...state.components.map(c => state.selectedComponentIds.includes(c.id) ? { ...c, groupId: newGroup.id } : c), newGroup],
            selectedComponentIds: [newGroup.id],
        };
    }),

    ungroupComponents: () => set(state => {
        const group = state.components.find(c => state.selectedComponentIds.length === 1 && c.id === state.selectedComponentIds[0]);
        if (!group || group.type !== 'group' || !group.childIds) return state;

        if (group.isLocked) {
            alert("Cannot ungroup a locked group. Please unlock it first.");
            return state;
        }

        return {
            components: state.components
                .map(c => group.childIds!.includes(c.id) ? { ...c, groupId: undefined } : c)
                .filter(c => c.id !== group.id),
            selectedComponentIds: [...group.childIds!],
        };
    }),

    bringToFront: () => set(state => {
        const selectedComponents = state.components.filter(c => state.selectedComponentIds.includes(c.id));
        if (selectedComponents.some(c => c.isLocked)) {
            alert("Cannot reorder locked components.");
            return state;
        }

        const selected = new Set(state.selectedComponentIds);
        const toMove = state.components.filter(c => selected.has(c.id) || (c.groupId && selected.has(c.groupId)));
        const rest = state.components.filter(c => !selected.has(c.id) && !(c.groupId && selected.has(c.groupId)));
        return { components: [...rest, ...toMove] };
    }),

    sendToBack: () => set(state => {
        const selectedComponents = state.components.filter(c => state.selectedComponentIds.includes(c.id));
        if (selectedComponents.some(c => c.isLocked)) {
            alert("Cannot reorder locked components.");
            return state;
        }
        const selected = new Set(state.selectedComponentIds);
        const toMove = state.components.filter(c => selected.has(c.id) || (c.groupId && selected.has(c.groupId)));
        const rest = state.components.filter(c => !selected.has(c.id) && !(c.groupId && selected.has(c.groupId)));
        return { components: [...toMove, ...rest] };
    }),

    duplicateComponents: () => set(state => {
        const allEffectivelySelectedIds = get().allEffectivelySelectedIds;
        if (allEffectivelySelectedIds.size === 0) return state;

        const allComponentsById = new Map(state.components.map(c => [c.id, c]));
        const componentsToDuplicate = Array.from(allEffectivelySelectedIds)
            .map(id => allComponentsById.get(id as string)) // Cast id to string
            .filter((c): c is WireframeComponent => !!c);
        
        if (componentsToDuplicate.some(c => c.isLocked)) {
            alert("Cannot duplicate locked components.");
            return state;
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

        return {
            components: [...state.components, ...newComponents],
            selectedComponentIds: newTopLevelSelectedIds,
        };
    }),

    addLibraryComponent: (name, position) => set(state => {
        const item = libraryItems[name];
        if (!item) return state;

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

        return {
            components: [...state.components, groupComponent, ...newChildren],
            selectedComponentIds: [newGroupId],
        };
    }),

    setViewTransform: (transform) => set(state => ({
        zoom: transform.zoom ?? state.zoom,
        pan: transform.pan ?? state.pan,
    })),

    toggleLock: (id) => set(state => {
        const component = state.components.find(c => c.id === id);
        if (!component) return state;

        const newLockState = !component.isLocked;
        const componentsToUpdate = new Map<string, { isLocked: boolean }>();

        const updateLockStateRecursive = (componentId: string) => {
            const comp = state.components.find(c => c.id === componentId);
            if (comp) {
                componentsToUpdate.set(comp.id, { isLocked: newLockState });
                if (comp.type === 'group' && comp.childIds) {
                    comp.childIds.forEach(childId => updateLockStateRecursive(childId));
                }
            }
        };

        updateLockStateRecursive(id);

        const updatedComponents = state.components.map(c => {
            if (componentsToUpdate.has(c.id)) {
                return { ...c, ...componentsToUpdate.get(c.id) };
            }
            return c;
        });

        return { components: updatedComponents };
    }),

    alignComponents: (alignment) => set(state => {
        if (state.selectedComponentIds.length < 2) return state;
        
        const allComponentsById = new Map(state.components.map(c => [c.id, c]));
        const selected = state.selectedComponentIds.map(id => allComponentsById.get(id)!).filter(Boolean);
        if (selected.length < 2) return state;

        if (selected.some(c => c.isLocked)) {
            alert("Cannot align locked components. Please unlock them first.");
            return state;
        }
        
        const first = selected[0];
        
        const updatedComponents = state.components.map(c => {
            if (c.id === first.id) return c;
            if (!state.selectedComponentIds.includes(c.id)) return c;

            let updates: Partial<WireframeComponent> = {};
             switch (alignment) {
                case 'left': updates = { x: first.x }; break;
                case 'center-horizontal': updates = { x: (first.x + first.width / 2) - c.width / 2 }; break;
                case 'right': updates = { x: (first.x + first.width) - c.width }; break;
                case 'top': updates = { y: first.y }; break;
                case 'center-vertical': updates = { y: (first.y + first.height / 2) - c.height / 2 }; break;
                case 'bottom': updates = { y: (first.y + first.height) - c.height }; break;
            }
            return { ...c, ...updates };
        });

        return { components: updatedComponents };
    }),

    generateContent: async (prompt) => {
        const { components, selectedComponentIds } = get();
        const selected = components.filter(c => selectedComponentIds.includes(c.id));
        if (!prompt || selected.length === 0) return;
        try {
            const contentUpdates = await geminiService.generateContentForComponents(prompt, selected);
            contentUpdates.forEach(({ id, updates }) => {
                const currentComp = get().components.find(c => c.id === id);
                if (currentComp) {
                    const newProps = { ...currentComp.properties, ...updates.properties };
                    get().updateComponent(id, { ...updates, properties: newProps });
                }
            });
        } catch (error) {
            console.error("Content generation failed:", error);
            alert("Failed to generate content. Please try again.");
        }
    },

    generateStyles: async (prompt) => {
        const { components, selectedComponentIds } = get();
        const selected = components.filter(c => selectedComponentIds.includes(c.id));
        if (!prompt || selected.length === 0) return;
        set({ isGeneratingStyles: true });
        try {
            const suggestions = await geminiService.generateStyleVariations(prompt, selected);
            set({ styleSuggestions: suggestions, isGeneratingStyles: false });
        } catch (error) {
            console.error("Style generation failed:", error);
            set({ isGeneratingStyles: false });
            alert("Failed to generate styles. Please try again.");
        }
    },

    applyStyle: (style) => set(state => {
        const updatedComponents = state.components.map(c => {
            if (state.selectedComponentIds.includes(c.id)) {
                return { ...c, properties: { ...c.properties, ...style } };
            }
            return c;
        });
        return { components: updatedComponents };
    }),

    clearStyleSuggestions: () => set({ styleSuggestions: [] }),

    generateLayout: async (layoutType) => {
        const { components, selectedComponentIds } = get();
        const selected = components.filter(c => selectedComponentIds.includes(c.id));
        if (selected.length < 2) return;
        if (selected.some(c => c.isLocked)) {
            alert("Cannot generate layout for locked components.");
            return;
        }
        set({ isGeneratingLayout: true });
        try {
            const layoutUpdates = await geminiService.generateLayoutSuggestions(selected, layoutType);
            layoutUpdates.forEach(({ id, updates }) => get().updateComponent(id, updates));
            set({ isGeneratingLayout: false });
        } catch (error) {
            console.error("Layout generation failed:", error);
            alert("Failed to generate layout. Please try again.");
            set({ isGeneratingLayout: false });
        }
    },

    generateTheme: async (imageDataUrl) => {
        set({ isGeneratingTheme: true });
        try {
            const theme = await geminiService.generateThemeFromImage(imageDataUrl);
            const { colors, borderRadius, fontWeight } = theme;
            
            const updatedComponents = get().components.map(component => {
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

            set({ components: updatedComponents, isGeneratingTheme: false });
        } catch (error) {
            console.error("Theme generation failed:", error);
            set({ isGeneratingTheme: false });
            alert("Failed to generate theme from image. Please try again.");
        }
    },

    analyzeSketch: async (imageDataUrl) => {
        set({ isAnalyzing: true });
        try {
            const newComponents = await geminiService.analyzeSketch(imageDataUrl, get().theme);
            const newComponentsWithIds = newComponents.map(c => ({...c, id: Date.now().toString() + Math.random().toString(36).substring(2, 9) }));
            set(state => ({ 
                isAnalyzing: false, 
                components: [...state.components, ...newComponentsWithIds], 
                selectedComponentIds: newComponentsWithIds.map(c => c.id) 
            }));
        } catch (error) {
            console.error("Failed to analyze sketch:", error);
            alert("Sorry, I couldn't understand that sketch. Please try again with a clearer drawing.");
            set({ isAnalyzing: false });
        }
    },

    setDrawingSetting: (key, value) => set(state => ({
        drawingSettings: {
            ...state.drawingSettings,
            [key]: value,
        },
    })),

    convertImageToComponent: async (imageDataUrl) => {
        set({ isConvertingImage: true });
        try {
            const componentData = await geminiService.convertImageToComponent(imageDataUrl, get().theme);
            
            const canvasElement = document.querySelector('canvas');
            const canvasWidth = canvasElement ? canvasElement.clientWidth : window.innerWidth * 0.7;
            const canvasHeight = canvasElement ? canvasElement.clientHeight : window.innerHeight;
            const centerX = (canvasWidth / 2 - get().pan.x) / get().zoom;
            const centerY = (canvasHeight / 2 - get().pan.y) / get().zoom;
            
            const newComponent: WireframeComponent = {
                ...componentData,
                id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
                x: centerX - (componentData.width || 100) / 2,
                y: centerY - (componentData.height || 100) / 2,
            };
            
            set(state => ({ 
                isConvertingImage: false, 
                components: [...state.components, newComponent], 
                selectedComponentIds: [newComponent.id] 
            }));
        } catch (error) {
            console.error("Failed to convert image to component:", error);
            alert("Sorry, I couldn't convert that image. Please try again with a clearer image of a single component.");
            set({ isConvertingImage: false });
        }
    },
}));

useStore.subscribe((state) => {
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
    
    // This line is problematic for TypeScript's static analysis.
    // Instead of dynamically adding, we've now added it to the AppState interface.
    // We'll update the state directly.
    (useStore.getState() as AppState).allEffectivelySelectedIds = selectedIds;
});