'''
import { WireframeComponent, ComponentProperties, LayoutSuggestionType, ThemeMode } from '../types';
import { getDefaultProperties } from "../../utils/componentUtils";

const API_BASE_URL = 'http://localhost:3001/api';

async function geminiProxy(body: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/gemini`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to proxy request to Gemini API');
    }

    return response.json();
}

export interface Theme {
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        textLight: string;
        textDark: string;
        backgroundLight: string;
    };
    borderRadius: number;
    fontWeight: string;
}

const analyzeSketchSchema = {
    type: "OBJECT",
    properties: {
        components: {
            type: "ARRAY",
            description: "An array of UI components identified in the sketch.",
            items: {
                type: "OBJECT",
                properties: {
                    type: {
                        type: "STRING",
                        enum: ['rectangle', 'circle', 'button', 'input', 'text', 'image'],
                        description: "The type of the UI component.",
                    },
                    x: { type: "NUMBER", description: "The x-coordinate of the top-left corner." },
                    y: { type: "NUMBER", description: "The y-coordinate of the top-left corner." },
                    width: { type: "NUMBER", description: "The width of the component." },
                    height: { type: "NUMBER", description: "The height of the component." },
                    label: { type: "STRING", description: "A descriptive label for the component (e.g., 'Submit Button', 'Username Input')." }
                },
                required: ['type', 'x', 'y', 'width', 'height', 'label']
            }
        }
    }
};

interface AnalyzedComponent {
    type: 'rectangle' | 'circle' | 'button' | 'input' | 'text' | 'image';
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
}

export async function analyzeSketch(imageDataUrl: string, theme: ThemeMode = 'light'): Promise<Omit<WireframeComponent, 'id'>[]> {
    const base64Data = imageDataUrl.split(',')[1];
    const imagePart = { inlineData: { mimeType: 'image/png', data: base64Data } };
    const textPart = { text: `Analyze this wireframe sketch. Identify all distinct UI elements (buttons, inputs, text, images, shapes). Provide their type, bounding box (x, y, width, height), and a descriptive label. Respond with a JSON object that adheres to the provided schema.` };

    try {
        const response = await geminiProxy({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: { responseMimeType: 'application/json', responseSchema: analyzeSketchSchema },
        });
        
        const jsonText = response.text?.trim();
        if (!jsonText) {
            console.warn("Gemini returned empty JSON for sketch analysis.");
            return [];
        }
        const result = JSON.parse(jsonText);

        if (result?.components && Array.isArray(result.components)) {
             return result.components.filter(Boolean).map((c: AnalyzedComponent) => ({ 
                ...c, 
                properties: getDefaultProperties(c.type, theme), 
                rotation: 0, 
                isLocked: false 
            }));
        }
        return [];
    } catch (e) {
        console.error("Error analyzing sketch with Gemini:", e);
        throw new Error("Failed to parse sketch analysis from AI.");
    }
}

const imageToComponentSchema = {
    type: "OBJECT",
    properties: {
        type: {
            type: "STRING",
            enum: ['button', 'input', 'text', 'image', 'rectangle'],
            description: "The type of the UI component.",
        },
        width: { type: "NUMBER", description: "The estimated width of the component in pixels." },
        height: { type: "NUMBER", description: "The estimated height of the component in pixels." },
        label: { type: "STRING", description: "A descriptive label for the component." },
        properties: {
            type: "OBJECT",
            properties: {
                backgroundColor: { type: "STRING", description: "Hex color code for background." },
                borderColor: { type: "STRING", description: "Hex color code for border." },
                textColor: { type: "STRING", description: "Hex color code for text." },
                borderRadius: { type: "NUMBER", description: "Border radius in pixels." },
                borderWidth: { type: "NUMBER", description: "Border width in pixels." },
                buttonText: { type: "STRING", description: "The text content of a button." },
                placeholder: { type: "STRING", description: "The placeholder text of an input field." },
                fontSize: { type: "NUMBER" },
                fontWeight: { type: "STRING" },
            },
            description: "Visual properties of the component."
        }
    },
    required: ['type', 'width', 'height', 'label', 'properties']
};

export async function convertImageToComponent(imageDataUrl: string, theme: ThemeMode = 'light'): Promise<Omit<WireframeComponent, 'id' | 'x' | 'y'>> {
    const base64Data = imageDataUrl.split(',')[1];
    const imagePart = { inlineData: { mimeType: 'image/png', data: base64Data } };
    const textPart = { text: "Analyze this image, which contains a single UI component like a button or a card. Describe it as a single component object. Extract its type, estimated width and height, a label, and visual properties like colors, text, and border-radius. Adhere to the provided JSON schema." };

    try {
        const response = await geminiProxy({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: { responseMimeType: 'application/json', responseSchema: imageToComponentSchema },
        });

        const jsonText = response.text?.trim();
        if (!jsonText) {
            throw new Error("Gemini returned an empty response for image conversion.");
        }
        const result = JSON.parse(jsonText);
        
        const defaultProps = getDefaultProperties(result.type, theme);
        const finalProperties = { ...defaultProps, ...result.properties };

        return {
            type: result.type,
            width: result.width || 200,
            height: result.height || 80,
            label: result.label || 'New Component',
            properties: finalProperties,
            rotation: 0,
            isLocked: false,
        };

    } catch (e) {
        console.error("Error converting image to component:", e);
        throw new Error("Failed to convert image to component.");
    }
}


const contentUpdateSchema = {
    type: "OBJECT",
    properties: {
        updates: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    id: { type: "STRING" },
                    label: { type: "STRING", description: "New label for a text component." },
                    buttonText: { type: "STRING", description: "New text for a button." },
                    placeholder: { type: "STRING", description: "New placeholder for an input." }
                },
                required: ['id']
            }
        }
    }
};

export async function generateContentForComponents(prompt: string, components: WireframeComponent[]): Promise<{ id: string; updates: Partial<WireframeComponent> }[]> {
    const componentData = components.map(c => ({ id: c.id, type: c.type, label: c.label }));
    
    const response = await geminiProxy({
        model: 'gemini-2.5-flash',
        contents: `Given the prompt "${prompt}" and the following UI components: ${JSON.stringify(componentData)}, generate appropriate text content for each component. Provide updates as an array of objects with the component 'id' and the new content for 'label', 'buttonText', or 'placeholder'.`,
        config: { responseMimeType: "application/json", responseSchema: contentUpdateSchema }
    });

    const jsonText = response.text?.trim();
    if (!jsonText) {
        console.warn("Gemini returned empty JSON for content generation.");
        return [];
    }
    const result = JSON.parse(jsonText);

    if (result && result.updates && Array.isArray(result.updates)) {
        return result.updates.map((u: any) => {
            const properties: Partial<ComponentProperties> = {};
            if (u.buttonText) properties.buttonText = u.buttonText;
            if (u.placeholder) properties.placeholder = u.placeholder;
            
            const finalUpdate: {id: string; updates: Partial<WireframeComponent>} = { id: u.id, updates: { } };
            if (u.label) finalUpdate.updates.label = u.label;
            if (Object.keys(properties).length > 0) finalUpdate.updates.properties = properties;

            return finalUpdate;
        });
    }
    return [];
}

const styleSuggestionsSchema = {
    type: "OBJECT",
    properties: {
        styles: {
            type: "ARRAY",
            description: "An array of 4 distinct style suggestions.",
            items: {
                type: "OBJECT",
                properties: {
                    backgroundColor: { type: "STRING", description: "Hex color code for background." },
                    borderColor: { type: "STRING", description: "Hex color code for border." },
                    textColor: { type: "STRING", description: "Hex color code for text." },
                    borderRadius: { type: "NUMBER", description: "Border radius in pixels." },
                    borderWidth: { type: "NUMBER", description: "Border width in pixels." },
                    fontWeight: { type: "STRING", description: "Font weight (e.g., '400', '700', 'bold')." }
                }
            }
        }
    }
};

export async function generateStyleVariations(prompt: string, components: WireframeComponent[]): Promise<Partial<ComponentProperties>[]> {
    const componentTypes = [...new Set(components.map(c => c.type))];
    const response = await geminiProxy({
        model: 'gemini-2.5-flash',
        contents: `Generate 4 distinct UI style variations based on the prompt: "${prompt}". The styles should be suitable for components like: ${componentTypes.join(', ')}. Provide CSS property values for each style.`,
        config: { responseMimeType: "application/json", responseSchema: styleSuggestionsSchema }
    });
    const jsonText = response.text?.trim();
    if (!jsonText) {.
        console.warn("Gemini returned empty JSON for style variations.");
        return [];
    }
    const result = JSON.parse(jsonText);
    return (result.styles || []).slice(0, 4);
}

const layoutSuggestionsSchema = {
    type: "OBJECT",
    properties: {
        positions: {
            type: "ARRAY",
            description: "An array of new positions and sizes for each component.",
            items: {
                type: "OBJECT",
                properties: { 
                    id: { type: "STRING" }, 
                    x: { type: "NUMBER" }, 
                    y: { type: "NUMBER" },
                },
                required: ['id', 'x', 'y']
            }
        }
    }
};

export async function generateLayoutSuggestions(components: WireframeComponent[], layoutType: LayoutSuggestionType): Promise<{ id: string; updates: Partial<WireframeComponent> }[]> {
    const componentData = components.map(c => ({ id: c.id, width: c.width, height: c.height, x: c.x, y: c.y }));
    
    const boundingBox = components.reduce((acc, c) => ({
        minX: Math.min(acc.minX, c.x),
        minY: Math.min(acc.minY, c.y),
    }), { minX: Infinity, minY: Infinity });

    const prompt = `Arrange the following components in a '${layoutType}' layout. Keep some reasonable padding between them (e.g. 10-20px). The new arrangement should start near their current top-left bounding box of (${Math.round(boundingBox.minX)}, ${Math.round(boundingBox.minY)}). Components: ${JSON.stringify(componentData)}. Provide the new top-left x and y coordinates for each component.`;
    
    try {
        const response = await geminiProxy({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json', responseSchema: layoutSuggestionsSchema }
        });
        
        const jsonText = response.text?.trim();
        if (!jsonText) {
            console.warn("Gemini returned empty JSON for layout suggestions.");
            return [];
        }
        const result = JSON.parse(jsonText);
        
        if (result && result.positions && Array.isArray(result.positions)) {
            return result.positions.map((p: any) => ({
                id: p.id,
                updates: { x: p.x, y: p.y }
            }));
        }
        return [];

    } catch(e) {
        console.error("Error generating layout suggestions:", e);
        throw new Error("Failed to generate layout from AI.");
    }
}

const findClosestAspectRatio = (width: number, height: number): '1:1' | '3:4' | '4:3' | '9:16' | '16:9' => {
    const targetRatio = width / height;
    const supportedRatios: Record<'1:1' | '3:4' | '4:3' | '9:16' | '16:9', number> = {
        '1:1': 1,
        '4:3': 4 / 3,
        '3:4': 3 / 4,
        '16:9': 16 / 9,
        '9:16': 9 / 16,
    };

    let closest: '1:1' | '3:4' | '4:3' | '9:16' | '16:9' = '1:1';
    let minDiff = Infinity;

    for (const ratio in supportedRatios) {
        const key = ratio as keyof typeof supportedRatios;
        const diff = Math.abs(targetRatio - supportedRatios[key]);
        if (diff < minDiff) {
            minDiff = diff;
            closest = key;
        }
    }
    return closest;
};

export async function generateImage(prompt: string, width: number, height: number): Promise<string> {
    try {
        const aspectRatio = findClosestAspectRatio(width, height);
        const response = await geminiProxy({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: aspectRatio,
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        }
        throw new Error("No image was generated.");
    } catch (e) {
        console.error("Error generating image with Gemini:", e);
        throw new Error("Failed to generate image from AI.");
    }
}
const themeGenerationSchema = {
    type: "OBJECT",
    properties: {
        colors: {
            type: "OBJECT",
            properties: {
                primary: { type: "STRING", description: "Primary color hex code (e.g., for buttons)." },
                secondary: { type: "STRING", description: "Secondary color hex code (e.g., for borders)." },
                accent: { type: "STRING", description: "Accent color hex code." },
                textLight: { type: "STRING", description: "Text color for dark backgrounds." },
                textDark: { type: "STRING", description: "Text color for light backgrounds." },
                backgroundLight: { type: "STRING", description: "A light background color." },
            },
            required: ['primary', 'secondary', 'textLight', 'textDark', 'backgroundLight']
        },
        borderRadius: { type: "NUMBER", description: "A suitable border radius in pixels (e.g., 8)." },
        fontWeight: { type: "STRING", description: "A suitable font weight (e.g., '500' or '600')." }
    },
    required: ['colors', 'borderRadius', 'fontWeight']
};

export async function generateThemeFromImage(imageDataUrl: string): Promise<Theme> {
    const base64Data = imageDataUrl.split(',')[1];
    const imagePart = { inlineData: { mimeType: 'image/png', data: base64Data } };
    const textPart = { text: "Analyze this image and generate a color theme based on it. Provide primary, secondary, accent, text (light and dark), and background (light) colors. Also suggest a border radius and font weight. Respond with a JSON object that adheres to the provided schema." };

    try {
        const response = await geminiProxy({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: { responseMimeType: 'application/json', responseSchema: themeGenerationSchema },
        });

        const jsonText = response.text?.trim();
        if (!jsonText) {
            throw new Error("Gemini returned an empty response for theme generation.");
        }
        const result = JSON.parse(jsonText);

        return {
            colors: {
                primary: result.colors?.primary || '#2563eb',
                secondary: result.colors?.secondary || '#d1d5db',
                accent: result.colors?.accent || '#ec4899',
                textLight: result.colors?.textLight || '#ffffff',
                textDark: result.colors?.textDark || '#1e293b',
                backgroundLight: result.colors?.backgroundLight || '#f9fafb',
            },
            borderRadius: result.borderRadius ?? 8,
            fontWeight: result.fontWeight ?? '500',
        };
    } catch (e) {
        console.error("Error generating theme from image:", e);
        throw new Error("Failed to generate theme from image.");
    }
}
''