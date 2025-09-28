

export type Tool = 'select' | 'pen' | 'rectangle' | 'circle' | 'text' | 'button' | 'input' | 'image' | 'erase';
export type Alignment = 'left' | 'center-horizontal' | 'right' | 'top' | 'center-vertical' | 'bottom';
export type LayoutSuggestionType = 'vertical-stack' | 'horizontal-list' | 'grid';
export type ThemeMode = 'light' | 'dark';

export interface DrawingSettings {
    penWidth: number;
    penOpacity: number;
    shapeFill: boolean;
}

export interface ComponentProperties {
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    fontSize?: number;
    fontWeight?: string;
    textColor?: string;
    textAlign?: 'left' | 'center' | 'right';
    buttonText?: string;
    buttonStyle?: 'primary' | 'secondary' | 'outline';
    placeholder?: string;
    inputType?: 'text' | 'email' | 'password' | 'number';
    imageDataUrl?: string;
    [key: string]: any;
}

export interface WireframeComponent {
    id: string;
    type: 'rectangle' | 'circle' | 'button' | 'input' | 'text' | 'image' | 'group';
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    properties: ComponentProperties;
    groupId?: string;
    childIds?: string[];
    rotation?: number;
    isLocked?: boolean;
}

// Actions for the reducer
export type AppAction =
    | { type: 'SET_TOOL'; payload: Tool }
    | { type: 'SET_THEME'; payload: ThemeMode }
    | { type: 'ADD_COMPONENT'; payload: WireframeComponent }
    | { type: 'ADD_COMPONENTS'; payload: WireframeComponent[] }
    | { type: 'UPDATE_COMPONENT'; payload: { id: string; updates: Partial<WireframeComponent> } }
    | { type: 'DELETE_COMPONENT'; payload: string }
    | { type: 'SET_SELECTED_COMPONENTS'; payload: string[] }
    | { type: 'GROUP_COMPONENTS'; payload: WireframeComponent }
    | { type: 'UNGROUP_COMPONENTS'; payload: { groupToRemove: string, childrenToSelect: string[] } }
    | { type: 'SET_COMPONENTS'; payload: WireframeComponent[] }
    | { type: 'CLEAR_DRAWN_PATHS' }
    | { type: 'ANALYZE_SKETCH_START' }
    | { type: 'ANALYZE_SKETCH_SUCCESS'; payload: Omit<WireframeComponent, 'id'>[] }
    | { type: 'ANALYZE_SKETCH_FAILURE' }
    | { type: 'CONVERT_IMAGE_START' }
    | { type: 'CONVERT_IMAGE_SUCCESS'; payload: WireframeComponent }
    | { type: 'CONVERT_IMAGE_FAILURE' }
    | { type: 'GENERATE_STYLES_START' }
    | { type: 'GENERATE_STYLES_SUCCESS'; payload: Partial<ComponentProperties>[] }
    | { type: 'GENERATE_STYLES_FAILURE' }
    | { type: 'CLEAR_STYLE_SUGGESTIONS' }
    | { type: 'GENERATE_LAYOUT_START' }
    | { type: 'GENERATE_LAYOUT_SUCCESS' }
    | { type: 'GENERATE_LAYOUT_FAILURE' }
    | { type: 'GENERATE_THEME_START' }
    | { type: 'GENERATE_THEME_SUCCESS' }
    | { type: 'GENERATE_THEME_FAILURE' }
    | { type: 'SET_VIEW_TRANSFORM'; payload: { zoom?: number; pan?: { x: number; y: number } } }
    | { type: 'TOGGLE_RIGHT_SIDEBAR' }
    | { type: 'TOGGLE_LEFT_SIDEBAR' }
    | { type: 'SET_DRAWING_SETTING'; payload: { key: keyof DrawingSettings; value: number | boolean } };
