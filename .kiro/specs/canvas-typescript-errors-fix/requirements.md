# Requirements Document

## Introduction

This feature addresses critical TypeScript compilation errors in the Canvas component that are preventing the application from building successfully. The errors stem from incorrect variable references where `state.allEffectivelySelectedIds` is used instead of the already-destructured `allEffectivelySelectedIds` variable, and an undefined `dispatch` variable is referenced in a dependency array.

## Requirements

### Requirement 1

**User Story:** As a developer, I want the Canvas component to compile without TypeScript errors, so that the application can build and run successfully.

#### Acceptance Criteria

1. WHEN the Canvas.tsx file is compiled THEN there SHALL be no TypeScript errors related to "Cannot find name 'state'"
2. WHEN the Canvas.tsx file is compiled THEN there SHALL be no TypeScript errors related to "Cannot find name 'dispatch'"
3. WHEN the handleMouseDown callback is defined THEN it SHALL reference `allEffectivelySelectedIds` directly without the `state.` prefix
4. WHEN the handleMouseMove callback is defined THEN it SHALL reference `allEffectivelySelectedIds` directly without the `state.` prefix
5. WHEN the handleMouseMove callback dependency array is defined THEN it SHALL NOT include the undefined `dispatch` variable

### Requirement 2

**User Story:** As a developer, I want the Canvas component to maintain its existing functionality after the fix, so that no features are broken by the correction.

#### Acceptance Criteria

1. WHEN the errors are fixed THEN the component's selection behavior SHALL remain unchanged
2. WHEN the errors are fixed THEN the component's mouse interaction behavior SHALL remain unchanged
3. WHEN the errors are fixed THEN all existing functionality SHALL continue to work as expected
4. IF `allEffectivelySelectedIds` is used in the component THEN it SHALL be properly destructured from the `useStore()` hook
