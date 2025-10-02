# Implementation Plan

- [x] 1. Set up mobile detection and responsive layout foundation

  - Create custom hook `useMobileDetection()` to detect viewport changes and update mobile mode state
  - Add mobile-specific state properties to AppContext (isMobileMode, isMobileToolbarVisible, activeMobilePanel)
  - Implement viewport detection logic with 768px breakpoint for mobile/web UI switching
  - Update AppAction types to include mobile state management actions
  - _Requirements: 1.4_

- [x] 2. Implement dual mobile and web UI layout system

  - [x] 2.1 Create ResponsiveLayoutContainer component to manage both UI modes

    - Implement conditional rendering based on isMobileMode state for mobile vs web layouts
    - Handle seamless layout switching between desktop web UI and mobile UI modes
    - Maintain separate layout trees for mobile and web interfaces
    - _Requirements: 1.1, 1.2_

  - [x] 2.2 Modify App.tsx to support dual mobile/web UI structures

    - Update main layout structure to conditionally render mobile UI (full-screen) or web UI (sidebar-based)
    - Remove fixed sidebars and padding in mobile UI mode while preserving web UI layout
    - Ensure canvas extends to all screen edges in mobile UI with no visible margins
    - Maintain existing web UI layout for desktop users
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 2.3 Enhance Canvas component for dual mobile/web UI support

    - Optimize touch interactions for mobile UI while maintaining mouse interactions for web UI
    - Conditionally render larger touch targets (44px) in mobile UI mode, standard sizes in web UI
    - Implement adaptive resize handles that scale based on mobile vs web UI context
    - Ensure canvas behavior adapts seamlessly between mobile and web UI layouts
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 3. Create mobile UI toolbar system (separate from web UI toolbar)

  - [x] 3.1 Build MobileToolbar component with slide-up functionality for mobile UI

    - Implement slide-up animation from bottom of screen (300ms ease-in-out) for mobile UI only
    - Create semi-transparent backdrop with blur effect specific to mobile UI layout
    - Add touch-optimized tool buttons with minimum 44px height for mobile UI
    - Ensure existing web UI toolbar remains unchanged and functional

    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2_

  - [x] 3.2 Implement mobile UI toolbar visibility controls

    - Add floating action button (FAB) for mobile UI toolbar toggle
    - Implement tap-outside-to-dismiss functionality specific to mobile UI

    - Add swipe down gesture to close mobile UI toolbar
    - Maintain separate toolbar state management for mobile vs web UI
    - _Requirements: 2.2, 2.4_

  - [x] 3.3 Organize toolbar content for mobile UI layout

    - Create mobile-specific primary tools row (Select, Pen, Rectangle, Circle, Text)

    - Implement expandable secondary tools section for mobile UI
    - Add context-sensitive tool options that adapt to mobile vs web UI context

    - Preserve existing web UI toolbar organization and functionality
    - _Requirements: 3.3, 3.4_

- [x] 4. Create mobile UI modal system (parallel to web UI panels)

  - [x] 4.1 Create MobilePropertiesPanel modal component for mobile UI

    - Convert properties panel to full-screen modal interface for mobile UI only

    - Add floating action button trigger when component is selected in mobile UI
    - Implement swipe-down-to-dismiss functionality specific to mobile UI
    - Ensure web UI properties panel remains as sidebar and functions independently
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 4.2 Build MobileLibraryPanel modal component for mobile UI

    - Convert component library to full-screen modal for mobile UI layout
    - Implement grid layout optimized for touch selection in mobile UI

    - Maintain drag-to-canvas functionality through mobile UI modal
    - Preserve existing web UI library panel as sidebar functionality
    - _Requirements: 4.1, 4.3, 4.4_

  - [x] 4.3 Create MobileLayersPanel slide-up component for mobile UI

    - Convert layers panel to slide-up panel covering bottom 70% of screen in mobile UI
    - Implement touch-friendly list items for component hierarchy in mobile UI
    - Add swipe gestures for reordering components specific to mobile UI
    - Keep web UI layers panel as sidebar with existing mouse interactions
    - _Requirements: 4.1, 4.4_

- [x] 5. Optimize touch interactions for mobile UI (preserve mouse interactions for web UI)

  - [x] 5.1 Enhance multi-touch gesture support for mobile UI

    - Implement pinch-to-zoom functionality for canvas in mobile UI mode
    - Add two-finger pan gesture support specific to mobile UI
    - Ensure smooth gesture recognition without conflicts between mobile and web UI

    - Maintain existing mouse wheel zoom and pan for web UI
    - _Requirements: 5.1, 5.5_

  - [x] 5.2 Improve component manipulation in mobile UI

    - Increase minimum touch target sizes for interactive elements in mobile UI only
    - Optimize drawing responsiveness for pen tool on touch devices in mobile UI
    - Add haptic feedback for touch interactions in mobile UI where supported
    - Preserve existing mouse interaction precision for web UI
    - _Requirements: 5.2, 5.4_

- [x] 6. Update ZoomControls for dual mobile/web UI support

  - Conditionally increase touch target sizes to minimum 48px in mobile UI mode
  - Position controls in bottom-left with safe area insets for mobile UI
  - Simplify design with clear visual hierarchy for mobile UI while maintaining web UI styling
  - Ensure zoom controls adapt their appearance and behavior based on mobile vs web UI context
  - _Requirements: 5.2_

- [x] 7. Implement responsive state management for mobile/web UI switching


  - [x] 7.1 Add mobile/web UI state persistence and synchronization

    - Ensure canvas state is preserved when switching between web UI and mobile UI modes
    - Maintain all existing functionality across mobile/web UI layout changes
    - Handle keyboard shortcuts on mobile devices with keyboards in both UI modes
    - Synchronize component selection and tool states between mobile and web UI layouts
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 7.2 Add safe area inset handling for mobile UI

    - Implement safe area detection for iOS devices in mobile UI mode
    - Adjust mobile UI component positioning to respect device safe areas
    - Handle notch and home indicator areas appropriately in mobile UI layout
    - Ensure web UI layout remains unaffected by mobile-specific safe area handling

    - _Requirements: 1.2_

- [x] 8. Add dual mobile/web UI styling and animations



  - [x] 8.1 Create mobile UI optimized CSS classes alongside web UI styles



    - Add responsive breakpoints and mobile UI-specific styles separate from web UI
    - Implement smooth transitions for switching between mobile and web UI layout modes
    - Add reduced motion alternatives for accessibility in both mobile and web UI
    - Maintain existing web UI styling while adding mobile UI variants
    - _Requirements: 1.4, 6.3_


  - [ ] 8.2 Optimize animation performance for mobile UI
    - Ensure 60fps animations on mobile devices in mobile UI mode
    - Implement performance monitoring for battery optimization in mobile UI
    - Add fallback animations for lower-end devices in mobile UI
    - Preserve existing web UI animation performance and behavior
    - _Requirements: 1.3, 5.1_

- [ ]\* 9. Add comprehensive mobile/web UI testing utilities

  - [ ]\* 9.1 Create mobile UI interaction test utilities

    - Write test helpers for touch gesture simulation in mobile UI mode
    - Create viewport testing utilities for different screen sizes and UI mode switching
    - Add orientation change testing support for mobile UI layout
    - Test seamless switching between mobile and web UI layouts
    - _Requirements: 1.4, 5.1, 5.5_

  - [ ]\* 9.2 Implement responsive design test suite for dual UI system
    - Test layout adaptation across mobile breakpoints (320px, 375px, 414px, 768px) and web UI preservation
    - Verify touch target accessibility (minimum 44px) in mobile UI and mouse precision in web UI
    - Test animation performance and memory usage across both mobile and web UI modes
    - Validate state synchronization between mobile and web UI layouts
    - _Requirements: 3.1, 5.2_

- [ ]\* 10. Add accessibility enhancements for both mobile and web UI

  - [ ]\* 10.1 Implement screen reader support for mobile UI components

    - Add proper ARIA labels for mobile UI-specific components while preserving web UI accessibility
    - Ensure mobile UI modals and panels are screen reader accessible
    - Test voice navigation and control features across both mobile and web UI modes
    - Maintain existing web UI accessibility standards
    - _Requirements: 3.1, 4.4_

  - [ ]\* 10.2 Add motor accessibility features for dual UI system
    - Test with assistive touch technologies in mobile UI mode
    - Implement high contrast mode support for both mobile and web UI layouts
    - Add voice control compatibility across mobile and web UI interfaces
    - Ensure accessibility features work seamlessly when switching between UI modes
    - _Requirements: 5.2_
