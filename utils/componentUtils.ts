
import { WireframeComponent, ComponentProperties, ThemeMode } from '../types';

type ComponentType = WireframeComponent['type'];

export function getComponentLabel(type: ComponentType): string {
    const labels: Record<ComponentType, string> = {
        rectangle: 'Rectangle',
        circle: 'Circle',
        button: 'Button',
        input: 'Input Field',
        text: 'Text Block',
        image: 'Image Placeholder',
        group: 'Group',
    };
    return labels[type] || 'Component';
}

export function getDefaultProperties(type: ComponentType, theme: ThemeMode = 'light'): ComponentProperties {
    const isDark = theme === 'dark';
    const defaults: Partial<Record<ComponentType, ComponentProperties>> = {
        rectangle: {
            backgroundColor: isDark ? '#334155' : '#ffffff',
            borderColor: isDark ? '#4b5563' : '#e2e8f0',
            borderWidth: 1,
            borderRadius: 4
        },
        circle: {
            backgroundColor: isDark ? '#334155' : '#ffffff',
            borderColor: isDark ? '#4b5563' : '#e2e8f0',
            borderWidth: 1,
            borderRadius: 9999
        },
        button: {
            backgroundColor: '#2563eb',
            borderColor: '#2563eb',
            textColor: '#ffffff',
            borderWidth: 1,
            borderRadius: 6,
            buttonText: 'Button',
            fontWeight: '500',
            fontSize: 14,
        },
        input: {
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderColor: isDark ? '#4b5563' : '#d1d5db',
            textColor: isDark ? '#f1f5f9' : '#1e293b',
            borderWidth: 1,
            borderRadius: 4,
            placeholder: 'Enter text...',
            inputType: 'text',
            fontSize: 14,
        },
        text: {
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            borderWidth: 0,
            fontSize: 16,
            fontWeight: 'normal',
            textColor: isDark ? '#f1f5f9' : '#1e293b',
            textAlign: 'left'
        },
        image: {
            backgroundColor: isDark ? '#334155' : '#f8fafc',
            borderColor: isDark ? '#4b5563' : '#e5e7eb',
            borderWidth: 1,
            borderRadius: 4
        },
        group: {},
    };
    return defaults[type] || {};
}
