
// Fix: Corrected import path for WireframeComponent to be relative to the current directory.
import { WireframeComponent } from './types';
import { getDefaultProperties } from '../utils/componentUtils';
import { IconName } from '../components/Icon';

export interface LibraryItem {
    name: string;
    icon: IconName;
    width: number;
    height: number;
    components: Omit<WireframeComponent, 'id' | 'rotation' | 'isLocked' | 'groupId' | 'childIds'>[];
}

export const libraryItems: Record<string, LibraryItem> = {
    'login-form': {
        name: 'Login Form',
        icon: 'input',
        width: 320,
        height: 380,
        components: [
            { type: 'rectangle', x: 0, y: 0, width: 320, height: 380, label: 'Container', properties: { ...getDefaultProperties('rectangle'), borderRadius: 12, backgroundColor: '#f9fafb', borderColor: '#f3f4f6' } },
            { type: 'text', x: 24, y: 24, width: 272, height: 32, label: 'Welcome Back', properties: { ...getDefaultProperties('text'), fontSize: 24, fontWeight: '600', textAlign: 'center' } },
            { type: 'text', x: 24, y: 80, width: 272, height: 20, label: 'Email Address', properties: { ...getDefaultProperties('text'), fontSize: 14, fontWeight: '500' } },
            { type: 'input', x: 24, y: 104, width: 272, height: 40, label: 'Email Input', properties: { ...getDefaultProperties('input'), placeholder: 'you@example.com' } },
            { type: 'text', x: 24, y: 160, width: 272, height: 20, label: 'Password', properties: { ...getDefaultProperties('text'), fontSize: 14, fontWeight: '500' } },
            { type: 'input', x: 24, y: 184, width: 272, height: 40, label: 'Password Input', properties: { ...getDefaultProperties('input'), inputType: 'password', placeholder: '••••••••' } },
            { type: 'button', x: 24, y: 260, width: 272, height: 44, label: 'Sign In Button', properties: { ...getDefaultProperties('button'), buttonText: 'Sign In' } },
            { type: 'text', x: 24, y: 320, width: 272, height: 20, label: 'Forgot password?', properties: { ...getDefaultProperties('text'), fontSize: 14, textColor: '#2563eb', textAlign: 'center' } },
        ]
    },
    'nav-bar': {
        name: 'Nav Bar',
        icon: 'nav',
        width: 800,
        height: 60,
        components: [
            { type: 'rectangle', x: 0, y: 0, width: 800, height: 60, label: 'Nav Container', properties: { ...getDefaultProperties('rectangle'), backgroundColor: '#ffffff' } },
            { type: 'text', x: 20, y: 15, width: 100, height: 30, label: 'Logo', properties: { ...getDefaultProperties('text'), fontSize: 20, fontWeight: 'bold' } },
            { type: 'text', x: 150, y: 20, width: 60, height: 20, label: 'Home', properties: { ...getDefaultProperties('text'), textAlign: 'center' } },
            { type: 'text', x: 230, y: 20, width: 60, height: 20, label: 'About', properties: { ...getDefaultProperties('text'), textAlign: 'center' } },
            { type: 'text', x: 310, y: 20, width: 80, height: 20, label: 'Contact', properties: { ...getDefaultProperties('text'), textAlign: 'center' } },
            { type: 'button', x: 680, y: 10, width: 100, height: 40, label: 'Sign Up', properties: { ...getDefaultProperties('button'), buttonText: 'Sign Up' } },
        ]
    },
    'product-card': {
        name: 'Product Card',
        icon: 'card',
        width: 280,
        height: 400,
        components: [
            { type: 'rectangle', x: 0, y: 0, width: 280, height: 400, label: 'Card Container', properties: { ...getDefaultProperties('rectangle'), borderRadius: 12 } },
            { type: 'image', x: 12, y: 12, width: 256, height: 180, label: 'Product Image', properties: { ...getDefaultProperties('image') } },
            { type: 'text', x: 12, y: 210, width: 256, height: 24, label: 'Product Name', properties: { ...getDefaultProperties('text'), fontSize: 18, fontWeight: '600' } },
            { type: 'text', x: 12, y: 240, width: 256, height: 40, label: 'Product Description', properties: { ...getDefaultProperties('text'), fontSize: 14, textColor: '#64748b' } },
            { type: 'text', x: 12, y: 300, width: 100, height: 28, label: 'Price', properties: { ...getDefaultProperties('text'), fontSize: 22, fontWeight: 'bold' } },
            { type: 'button', x: 12, y: 340, width: 256, height: 44, label: 'Add to Cart', properties: { ...getDefaultProperties('button'), buttonText: 'Add to Cart' } },
        ]
    }
};