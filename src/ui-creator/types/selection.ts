import { ReactNode } from 'react';

export interface UIElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  props?: Record<string, any>;
  screenId?: string;
}

export interface SelectionState {
  selectedIds: Set<string>;
  activeId: string | null;
  isMultiSelect: boolean;
  lastSelectedId: string | null;
}

export interface SelectionChromeProps {
  element: UIElement;
  isSelected: boolean;
  isActive: boolean;
  onSelect: (id: string, multi?: boolean) => void;
  onUpdate: (updates: Partial<UIElement>) => void;
  onDelete: (id: string) => void;
  gridSize?: number;
  showAlignmentGuides?: boolean;
  children: ReactNode;
}

export interface ControlClusterProps {
  selectedElements: UIElement[];
  onAddComponent: () => void;
  onDelete: () => void;
  onEditProps: () => void;
  position: { x: number; y: number };
}

export interface GridSnapOptions {
  gridSize: number;
  showGrid: boolean;
  snapToGrid: boolean;
  showAlignmentGuides: boolean;
}

export interface AlignmentGuide {
  type: 'horizontal' | 'vertical';
  position: number;
  strength: 'weak' | 'medium' | 'strong';
}

export interface ResizeHandle {
  cursor: string;
  position: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
  getX: (element: UIElement) => number;
  getY: (element: UIElement) => number;
  getWidth: (element: UIElement) => number;
  getHeight: (element: UIElement) => number;
  updateElement: (element: UIElement, deltaX: number, deltaY: number, deltaWidth: number, deltaHeight: number) => Partial<UIElement>;
}

export interface UseSelectionReturn {
  selectedElements: UIElement[];
  selectedIds: Set<string>;
  activeId: string | null;
  isMultiSelect: boolean;
  select: (id: string, multi?: boolean) => void;
  deselect: (id?: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  setActive: (id: string) => void;
}

export interface UseA11yLiveReturn {
  announce: (message: string) => void;
  announceSelection: (element: UIElement) => void;
  announceMove: (element: UIElement, deltaX: number, deltaY: number) => void;
  announceResize: (element: UIElement, deltaWidth: number, deltaHeight: number) => void;
  announceDelete: (element: UIElement) => void;
}

export interface KeyboardMapProps {
  selectedElements: UIElement[];
  onMove: (id: string, deltaX: number, deltaY: number) => void;
  onResize: (id: string, deltaWidth: number, deltaHeight: number, handle: string) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string, multi?: boolean) => void;
  onClearSelection: () => void;
  gridSize: number;
}

export type KeyboardAction = 
  | { type: 'move'; deltaX: number; deltaY: number }
  | { type: 'resize'; deltaWidth: number; deltaHeight: number; handle: string }
  | { type: 'delete' }
  | { type: 'select'; id: string; multi?: boolean }
  | { type: 'clearSelection' }
  | { type: 'selectAll' };

export interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  elementId: string | null;
}

export interface ResizeState {
  isResizing: boolean;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  handle: string | null;
  elementId: string | null;
}

export interface UIElementBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}