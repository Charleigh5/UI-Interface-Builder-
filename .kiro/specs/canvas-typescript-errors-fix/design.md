# Design Document

## Overview

This design addresses three TypeScript compilation errors in the Canvas component (`components/Canvas.tsx`). The errors occur because the code incorrectly references `state.allEffectivelySelectedIds` and `dispatch`, when these variables don't exist in the component's scope. The `allEffectivelySelectedIds` variable is already properly destructured from the `useStore()` hook at the component level and should be used directly.

## Architecture

The Canvas component uses Zustand's `useStore()` hook to access application state. The hook returns destructured values including `allEffectivelySelectedIds`, which is a Set containing IDs of all effectively selected components (including nested selections).

### Current State

The component correctly destructures values from `useStore()`:
```typescript
const {
  components,
  selectedComponentIds,
  currentTool,
  theme,
  zoom,
  pan,
  drawingSettings,
  isMobileMode,
  isAnalyzing,
  allEffectivelySelectedIds,  // ✓ Correctly destructured
  addComponent,
  addLibraryComponent,
  selectComponent,
  setViewTransform,
  updateComponent,
} = useStore();
```

However, in two callback dependency arrays, the code incorrectly references:
- `state.allEffectivelySelectedIds` (lines 941, 1095) - should be `allEffectivelySelectedIds`
- `dispatch` (line 1091) - doesn't exist and should be removed

## Components and Interfaces

### Affected Callbacks

#### 1. handleMouseDown (line ~857)
- **Location**: Line 857-944
- **Purpose**: Handles mouse down events for component selection and manipulation
- **Issue**: Dependency array references `state.allEffectivelySelectedIds` (line 941)
- **Fix**: Change to `allEffectivelySelectedIds`

#### 2. handleMouseMove (line ~946)
- **Location**: Line 946-1098
- **Purpose**: Handles mouse move events for dragging, resizing, and panning
- **Issues**: 
  - Dependency array includes undefined `dispatch` (line 1091)
  - Dependency array references `state.allEffectivelySelectedIds` (line 1095)
- **Fix**: Remove `dispatch` and change `state.allEffectivelySelectedIds` to `allEffectivelySelectedIds`

## Data Models

No data model changes are required. The fix involves correcting variable references to use already-available destructured values.

### Variable Scope Analysis

```typescript
// Component scope (available throughout)
const allEffectivelySelectedIds = useStore().allEffectivelySelectedIds; // ✓ Available

// Incorrect references (to be fixed)
state.allEffectivelySelectedIds  // ✗ 'state' doesn't exist
dispatch                          // ✗ 'dispatch' doesn't exist
```

## Error Handling

No error handling changes are required. This is a straightforward variable reference correction that will eliminate TypeScript compilation errors.

## Testing Strategy

### Verification Steps

1. **Compilation Check**: Verify that TypeScript compilation completes without errors
2. **Functionality Check**: Ensure component selection behavior works correctly
3. **Mouse Interaction Check**: Verify mouse down and mouse move interactions function as expected
4. **Dependency Array Validation**: Confirm that React hooks don't show warnings about missing or incorrect dependencies

### Manual Testing

After the fix, test the following scenarios:
- Click to select a component
- Drag a component to move it
- Resize a component using handles
- Rotate a component
- Multi-select components with Shift+Click
- Pan the canvas

All behaviors should remain unchanged from the current working state.

## Implementation Details

### Line-by-Line Changes

**Change 1: Line 941 (handleMouseDown dependency array)**
```typescript
// Before
state.allEffectivelySelectedIds,

// After
allEffectivelySelectedIds,
```

**Change 2: Line 1091 (handleMouseMove dependency array)**
```typescript
// Before
dispatch,

// After
// (remove this line entirely)
```

**Change 3: Line 1095 (handleMouseMove dependency array)**
```typescript
// Before
state.allEffectivelySelectedIds,

// After
allEffectivelySelectedIds,
```

### Root Cause

The errors likely originated from a refactoring where the component was migrated from using a context-based state management pattern (with `state` and `dispatch`) to Zustand's `useStore()` hook. Some references were not fully updated during the migration.

## Dependencies

No external dependencies are required. This fix only involves correcting variable references within the existing codebase.
