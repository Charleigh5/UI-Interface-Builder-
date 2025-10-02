# Mobile Platform Support

## Overview
The AI Wireframe Designer now has comprehensive mobile support for both iOS and Android platforms, providing a native-like experience on mobile devices.

## Platform Support

### iOS Support ✅
- **Browsers**: Safari, Chrome, Firefox
- **PWA**: Full Progressive Web App support
- **Features**:
  - Safe area inset handling (notch, Dynamic Island, home indicator)
  - Apple mobile web app meta tags
  - Black translucent status bar
  - Touch-optimized interface (44px minimum touch targets)
  - Haptic feedback support
  - Orientation change handling
  - Pinch-to-zoom and multi-touch gestures

### Android Support ✅
- **Browsers**: Chrome, Firefox, Samsung Internet, Edge
- **PWA**: Full Progressive Web App support with manifest
- **Features**:
  - Display cutout handling (notch, punch-hole cameras)
  - Navigation bar and status bar support
  - Theme color adaptation (light/dark mode)
  - Touch-optimized interface (44px minimum touch targets)
  - Vibration API for haptic feedback
  - Orientation change handling
  - Pinch-to-zoom and multi-touch gestures
  - Service Worker for offline capability

## Key Features

### 1. Responsive Layout
- Automatic detection of mobile devices (< 768px width)
- Seamless switching between mobile and web UI
- State preservation during layout transitions
- Debounced resize handling for performance

### 2. Touch Optimization
- **Minimum Touch Targets**: 44px (iOS) / 48px (Android) following platform guidelines
- **Multi-touch Gestures**:
  - Pinch-to-zoom on canvas
  - Two-finger pan
  - Swipe-to-dismiss on modals
- **Haptic Feedback**: Light vibration on interactions (where supported)
- **Touch Manipulation**: Optimized touch event handling

### 3. Safe Area Handling
- **iOS**: Notch, Dynamic Island, home indicator
- **Android**: Display cutouts, navigation bars
- **Implementation**: CSS environment variables with JavaScript fallback
- **Components**: FloatingActionButton, ZoomControls, MobileLayout

### 4. Mobile UI Components

#### MobileToolbar
- Slide-up from bottom
- Touch-optimized tool buttons
- Expandable sections
- Context-sensitive options
- Swipe-down-to-dismiss

#### MobilePropertiesPanel
- Full-screen modal
- Touch-optimized inputs
- Swipe-down-to-dismiss
- All desktop features preserved

#### MobileLibraryPanel
- Full-screen modal with search
- Grid layout for touch selection
- Tap-to-add components
- Component preview

#### MobileLayersPanel
- Slide-up panel (70% screen height)
- Touch-friendly list items (56px height)
- Hierarchical display
- Lock/delete controls

### 5. Keyboard Support
Mobile devices with external keyboards support all shortcuts:
- **Duplicate**: Cmd/Ctrl + D
- **Group**: Cmd/Ctrl + G
- **Ungroup**: Cmd/Ctrl + Shift + G
- **Bring to Front**: Cmd/Ctrl + ]
- **Send to Back**: Cmd/Ctrl + [
- **Delete**: Delete or Backspace
- **Zoom In**: Cmd/Ctrl + =
- **Zoom Out**: Cmd/Ctrl + -
- **Reset Zoom**: Cmd/Ctrl + 0

### 6. PWA Features

#### Android
- **Install to Home Screen**: Add to home screen from Chrome menu
- **Standalone Mode**: Runs without browser UI
- **Offline Support**: Service Worker caching
- **Theme Color**: Adapts to system theme
- **Splash Screen**: Custom splash screen on launch

#### iOS
- **Add to Home Screen**: Share menu → Add to Home Screen
- **Standalone Mode**: Runs without Safari UI
- **Status Bar**: Black translucent style
- **App Title**: Custom app name

## Performance Optimizations

### 1. Rendering
- Hardware acceleration for canvas
- CSS transforms with `translateZ(0)`
- `will-change` hints for animations
- Debounced resize handlers (150ms)

### 2. Touch Events
- Passive event listeners where possible
- Touch action manipulation
- Prevent default only when necessary
- Event delegation for better performance

### 3. Memory Management
- Efficient component rendering
- Memoized calculations
- Cleanup of event listeners
- Service Worker cache management

## Browser Compatibility

### iOS
- Safari 12+
- Chrome 90+
- Firefox 90+

### Android
- Chrome 90+
- Firefox 90+
- Samsung Internet 14+
- Edge 90+

## Testing Recommendations

### iOS Testing
1. Test on actual devices (iPhone 12+, iPhone SE)
2. Test in Safari and Chrome
3. Test PWA installation
4. Test orientation changes
5. Test safe area insets on notched devices

### Android Testing
1. Test on various screen sizes (small, medium, large)
2. Test on devices with display cutouts
3. Test in Chrome, Firefox, Samsung Internet
4. Test PWA installation
5. Test navigation bar handling
6. Test orientation changes

## Known Limitations

### iOS
- Service Worker has limited functionality in Safari
- Haptic feedback only works in Safari
- Some CSS features require `-webkit-` prefix

### Android
- Haptic feedback intensity cannot be controlled
- Some older devices may not support all features
- Display cutout handling varies by manufacturer

## Future Enhancements

### Planned
- [ ] Offline mode with local storage
- [ ] Push notifications for collaboration
- [ ] Native share API integration
- [ ] File system access API
- [ ] Bluetooth stylus support

### Under Consideration
- [ ] Native app wrappers (Capacitor/React Native)
- [ ] Advanced gesture recognition
- [ ] Voice commands
- [ ] AR preview mode

## Troubleshooting

### Issue: Safe area insets not working
**Solution**: Ensure viewport meta tag includes `viewport-fit=cover`

### Issue: Touch targets too small
**Solution**: All interactive elements should have minimum 44px height/width

### Issue: PWA not installing on Android
**Solution**: Check manifest.json is accessible and valid

### Issue: Haptic feedback not working
**Solution**: Haptic feedback requires user interaction and may not work in all browsers

### Issue: Orientation change causes layout issues
**Solution**: Orientation change handler dispatches resize event after 100ms delay

## Resources

- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Guidelines](https://material.io/design)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [MDN Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [CSS Environment Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/env)
