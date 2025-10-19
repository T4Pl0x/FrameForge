// UI Creator Components
export { default as SelectionChrome } from './SelectionChrome';
export { default as ControlCluster } from './ControlCluster';

// UI Creator Utilities
export { GridSnap, useGridSnap } from './GridSnap';
export { KeyboardMap, useKeyboardMap, useGlobalKeyboardShortcuts, useKeyboardNavigation, useKeyboardResize } from './KeyboardMap';

// UI Creator Hooks
export { useSelection, useKeyboardSelection, useMouseSelection } from './hooks/useSelection';
export { useA11yLive, useFocusManagement, useKeyboardShortcuts, useHighContrastMode, useReducedMotion } from './hooks/useA11yLive';

// UI Creator Types
export type {
  UIElement,
  SelectionState,
  SelectionChromeProps,
  ControlClusterProps,
  GridSnapOptions,
  AlignmentGuide,
  ResizeHandle,
  UseSelectionReturn,
  UseA11yLiveReturn,
  KeyboardMapProps,
  KeyboardAction,
  DragState,
  ResizeState,
  UIElementBounds,
} from './types/selection';

// CSS Imports
import './SelectionChrome.css';
import './ControlCluster.css';