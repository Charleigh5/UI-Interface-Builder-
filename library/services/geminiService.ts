

import { GoogleGenAI, Type } from "@google/genai";
import { WireframeComponent, ComponentProperties, LayoutSuggestionType, ThemeMode } from '../../types';
import { getDefaultProperties } from "../../utils/componentUtils";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

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
    type: Type.OBJECT,
    properties: {
        components: {
            type: Type.ARRAY,
            description: "An array of UI components identified in the sketch.",
            items: {
                type: Type.OBJECT,
                properties: {
                    type: {
                        type: Type.STRING,
                        enum: ['rectangle', 'circle', 'button', 'input', 'text', 'image'],
                        description: "The type of the UI component.",
                    },
                    x: { type: Type.NUMBER, description: "The x-coordinate of the top-left corner." },
                    y: { type: Type.NUMBER, description: "The y-coordinate of the top-left corner." },
                    width: { type: Type.NUMBER, description: "The width of the component." },
                    height: { type: Type.NUMBER, description: "The height of the component." },
                    label: { type: Type.STRING, description: "A descriptive label for the component (e.g., 'Submit Button', 'Username Input')." }
                },
                required: ['type', 'x', 'y', 'width', 'height', 'label']
            }
        }
    }
};

export async function analyzeSketch(imageDataUrl: string, theme: ThemeMode = 'light'): Promise<Omit<WireframeComponent, 'id'>[]> {
    const base64Data = imageDataUrl.split(',')[1];
    const imagePart = { inlineData: { mimeType: 'image/png', data: base64Data } };
    const textPart = { text: `Analyze this wireframe sketch. Identify all distinct UI elements (buttons, inputs, text, images, shapes). Provide their type, bounding box (x, y, width, height), and a descriptive label. Respond with a JSON object that adheres to the provided schema.` };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: { responseMimeType: 'application/json', responseSchema: analyzeSketchSchema },
        });
        
        const jsonText = response.text.trim();
        // Fix: Explicitly type the parsed JSON to ensure type safety downstream.
        const result: { components: { type: WireframeComponent['type'], x: number, y: number, width: number, height: number, label: string }[] } = JSON.parse(jsonText);

        if (result?.components && Array.isArray(result.components)) {
             return result.components.map(c => ({ 
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

const contentUpdateSchema = {
    type: Type.OBJECT,
    properties: {
        updates: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    label: { type: Type.STRING, description: "New label for a text component." },
                    buttonText: { type: Type.STRING, description: "New text for a button." },
                    placeholder: { type: Type.STRING, description: "New placeholder for an input." }
                },
                required: ['id']
            }
        }
    }
};

export async function generateContentForComponents(prompt: string, components: WireframeComponent[]): Promise<{ id: string; updates: Partial<WireframeComponent> }[]> {
    const componentData = components.map(c => ({ id: c.id, type: c.type, label: c.label }));
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Given the prompt "${prompt}" and the following UI components: ${JSON.stringify(componentData)}, generate appropriate text content for each component. Provide updates as an array of objects with the component 'id' and the new content for 'label', 'buttonText', or 'placeholder'.`,
        config: { responseMimeType: "application/json", responseSchema: contentUpdateSchema }
    });

    const jsonText = response.text.trim();
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
    type: Type.OBJECT,
    properties: {
        styles: {
            type: Type.ARRAY,
            description: "An array of 4 distinct style suggestions.",
            items: {
                type: Type.OBJECT,
                properties: {
                    backgroundColor: { type: Type.STRING, description: "Hex color code for background." },
                    borderColor: { type: Type.STRING, description: "Hex color code for border." },
                    textColor: { type: Type.STRING, description: "Hex color code for text." },
                    borderRadius: { type: Type.NUMBER, description: "Border radius in pixels." },
                    borderWidth: { type: Type.NUMBER, description: "Border width in pixels." },
                    fontWeight: { type: Type.STRING, description: "Font weight (e.g., '400', '700', 'bold')." }
                }
            }
        }
    }
};

export async function generateStyleVariations(prompt: string, components: WireframeComponent[]): Promise<Partial<ComponentProperties>[]> {
    const componentTypes = [...new Set(components.map(c => c.type))];
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate 4 distinct UI style variations based on the prompt: "${prompt}". The styles should be suitable for components like: ${componentTypes.join(', ')}. Provide CSS property values for each style.`,
        config: { responseMimeType: "application/json", responseSchema: styleSuggestionsSchema }
    });
    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return (result.styles || []).slice(0, 4);
}

const layoutSuggestionsSchema = {
    type: Type.OBJECT,
    properties: {
        positions: {
            type: Type.ARRAY,
            description: "An array of new positions and sizes for each component.",
            items: {
                type: Type.OBJECT,
                properties: { 
                    id: { type: Type.STRING }, 
                    x: { type: Type.NUMBER }, 
                    y: { type: Type.NUMBER },
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
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json', responseSchema: layoutSuggestionsSchema }
        });
        
        const jsonText = response.text.trim();
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
    const supportedRatios = {
        '1:1': 1,
        '4:3': 4 / 3,
        '3:4': 3 / 4,
        '16:9': 16 / 9,
        '9:16': 9 / 16
    };

    let closest: '1:1' | '3:4' | '4:3' | '9:16' | '16:9' = '1:1';
    let minDiff = Infinity;

    for (const [key, value] of Object.entries(supportedRatios)) {
        const diff = Math.abs(targetRatio - value);
        if (diff < minDiff) {
            minDiff = diff;
            closest = key as '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
        }
    }
    return closest;
};

export async function generateImage(prompt: string, width: number, height: number): Promise<string> {
    try {
        const aspectRatio = findClosestAspectRatio(width, height);

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: aspectRatio,
            }
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
    type: Type.OBJECT,
    properties: {
        colors: {
            type: Type.OBJECT,
            properties: {
                primary: { type: Type.STRING, description: "Primary color hex code (e.g., for buttons)." },
                secondary: { type: Type.STRING, description: "Secondary color hex code (e.g., for borders)." },
                accent: { type: Type.STRING, description: "Accent color hex code." },
                textLight: { type: Type.STRING, description: "Text color for dark backgrounds." },
                textDark: { type: Type.STRING, description: "Text color for light backgrounds." },
                backgroundLight: { type: Type.STRING, description: "Light background color." },
            },
        },
        borderRadius: { type: Type.NUMBER, description: "A suitable border radius in pixels." },
        fontWeight: { type: Type.STRING, description: "A suitable default font weight (e.g., '400', '500')." }
    },
    required: ['colors', 'borderRadius', 'fontWeight']
};

export async function generateThemeFromImage(imageDataUrl: string): Promise<Theme> {
    const base64Data = imageDataUrl.split(',')[1];
    const imagePart = { inlineData: { mimeType: 'image/jpeg', data: base64Data } };
    const textPart = { text: "Generate a UI theme from this image. Extract a color palette (primary, secondary, accent, text, background), a border radius, and a default font weight." };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: { responseMimeType: 'application/json', responseSchema: themeGenerationSchema },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating theme from image:", error);
        throw new Error("Failed to generate theme from AI.");
    }
}