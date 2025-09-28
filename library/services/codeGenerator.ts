
import React from 'react';
// Fix: Corrected import path for WireframeComponent.
import { WireframeComponent } from '../types';

const toKebabCase = (str: string) => str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();

const getStyleString = (comp: WireframeComponent): string => {
    const style: React.CSSProperties = {
        position: 'absolute',
        left: `${comp.x}px`,
        top: `${comp.y}px`,
        width: `${comp.width}px`,
        height: `${comp.height}px`,
        backgroundColor: comp.properties.backgroundColor,
        borderColor: comp.properties.borderColor,
        borderWidth: `${comp.properties.borderWidth}px`,
        borderRadius: `${comp.properties.borderRadius}px`,
        borderStyle: 'solid',
        transform: comp.rotation ? `rotate(${comp.rotation}deg)` : undefined,
        color: comp.properties.textColor,
        fontSize: comp.properties.fontSize ? `${comp.properties.fontSize}px` : undefined,
        fontWeight: comp.properties.fontWeight,
        textAlign: comp.properties.textAlign,
        display: 'flex',
        alignItems: 'center',
        justifyContent: comp.type === 'text' ? (comp.properties.textAlign === 'left' ? 'flex-start' : comp.properties.textAlign === 'right' ? 'flex-end' : 'center') : 'center',
        padding: '0 10px',
        boxSizing: 'border-box',
    };

    return Object.entries(style)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${toKebabCase(key)}: ${value};`)
        .join(' ');
};

export const generateReactCode = (components: WireframeComponent[]): string => {
    const componentCode = components.map(comp => {
        const style: React.CSSProperties = {
            position: 'absolute',
            left: comp.x,
            top: comp.y,
            width: comp.width,
            height: comp.height,
            backgroundColor: comp.properties.backgroundColor,
            borderColor: comp.properties.borderColor,
            borderWidth: comp.properties.borderWidth,
            borderRadius: comp.properties.borderRadius,
            borderStyle: 'solid',
            transform: comp.rotation ? `rotate(${comp.rotation}deg)` : undefined,
            color: comp.properties.textColor,
            fontSize: comp.properties.fontSize,
            fontWeight: comp.properties.fontWeight as any,
            textAlign: comp.properties.textAlign,
            display: 'flex',
            alignItems: 'center',
            justifyContent: comp.type === 'text' ? (comp.properties.textAlign === 'left' ? 'flex-start' : comp.properties.textAlign === 'right' ? 'flex-end' : 'center') : 'center',
            padding: '0 10px',
            boxSizing: 'border-box',
        };

        const styleString = JSON.stringify(style, null, 4)
            .replace(/"/g, "'")
            .replace(/'undefined'/g, 'undefined')
            .replace(/,\n/g, ',\n    ')
            .replace(/\n}/g, ',\n  }');


        switch (comp.type) {
            case 'button':
                return `<button style={${styleString}}>\n    ${comp.properties.buttonText || comp.label}\n  </button>`;
            case 'input':
                return `<input\n    type="${comp.properties.inputType || 'text'}"\n    placeholder="${comp.properties.placeholder || 'Placeholder'}"\n    style={${styleString}}\n  />`;
            case 'text':
                return `<p style={${styleString}}>\n    ${comp.label}\n  </p>`;
            case 'image':
                 return `<div style={${styleString}}>\n    <svg width="80%" height="80%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: '${comp.properties.borderColor}'}}>\n      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />\n      <circle cx="8.5" cy="8.5" r="1.5" />\n      <path d="M21 15l-5-5L5 21" />\n    </svg>\n  </div>`;
            default:
                return `<div style={${styleString}} />`;
        }
    }).join('\n\n  ');

    return `
function WireframeLayout() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', backgroundColor: '#f8fafc' }}>
      ${componentCode}
    </div>
  );
}
    `.trim();
};

export const generateHTMLCode = (components: WireframeComponent[]): string => {
     const componentCode = components.map(comp => {
        const styleString = getStyleString(comp);

        switch (comp.type) {
            case 'button':
                return `<button style="${styleString}">\n    ${comp.properties.buttonText || comp.label}\n  </button>`;
            case 'input':
                return `<input type="${comp.properties.inputType || 'text'}" placeholder="${comp.properties.placeholder || 'Placeholder'}" style="${styleString}" />`;
            case 'text':
                return `<p style="${styleString}">\n    ${comp.label}\n  </p>`;
            case 'image':
                 return `<div style="${styleString}">\n    <svg width="80%" height="80%" viewBox="0 0 24 24" fill="none" stroke="${comp.properties.borderColor || '#cbd5e1'}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">\n      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />\n      <circle cx="8.5" cy="8.5" r="1.5" />\n      <path d="M21 15l-5-5L5 21" />\n    </svg>\n  </div>`;
            default:
                return `<div style="${styleString}"></div>`;
        }
    }).join('\n\n  ');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wireframe</title>
  <style>
    body { margin: 0; font-family: sans-serif; }
    * { box-sizing: border-box; }
  </style>
</head>
<body>
  <div style="position: relative; width: 100vw; height: 100vh; background-color: #f8fafc;">
    ${componentCode}
  </div>
</body>
</html>
    `.trim();
}