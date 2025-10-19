import { useEffect, useCallback } from 'react';
import { UIElement, KeyboardMapProps, KeyboardAction } from './types/selection';

export class KeyboardMap {
  private handlers: Map<string, () => void> = new Map();
  private isEnabled = true;

  constructor(private options: { gridSize: number }) {}

  registerHandler(key: string, handler: () => void) {
    this.handlers.set(key.toLowerCase(), handler);
  }

  unregisterHandler(key: string) {
    this.handlers.delete(key.toLowerCase());
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  handleKeyDown(event: KeyboardEvent): boolean {
    if (!this.isEnabled) return false;

    const key = this.getKeyString(event);
    const handler = this.handlers.get(key);
    
    if (handler) {
      event.preventDefault();
      event.stopPropagation();
      handler();
      return true;
    }

    return false;
  }

  private getKeyString(event: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (event.ctrlKey || event.metaKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    
    parts.push(event.key.toLowerCase());
    return parts.join('+');
  }

  // Standard keyboard shortcuts for UI creator
  static getStandardShortcuts(options: { gridSize: number }): Record<string, string> {
    return {
      // Movement
      'arrowup': 'move-up',
      'arrowdown': 'move-down',
      'arrowleft': 'move-left',
      'arrowright': 'move-right',
      'shift+arrowup': 'move-up-fine',
      'shift+arrowdown': 'move-down-fine',
      'shift+arrowleft': 'move-left-fine',
      'shift+arrowright': 'move-right-fine',
      
      // Selection
      'escape': 'clear-selection',
      'ctrl+a': 'select-all',
      'tab': 'select-next',
      'shift+tab': 'select-previous',
      
      // Actions
      'delete': 'delete-selected',
      'backspace': 'delete-selected',
      'ctrl+d': 'duplicate-selected',
      'ctrl+c': 'copy-selected',
      'ctrl+v': 'paste-selected',
      'ctrl+z': 'undo',
      'ctrl+y': 'redo',
      'ctrl+shift+z': 'redo',
      
      // Tools
      'space': 'toggle-select-mode',
      'g': 'toggle-grid',
      'r': 'toggle-rulers',
      'a': 'toggle-alignment-guides',
      
      // Zoom
      'ctrl+plus': 'zoom-in',
      'ctrl+-': 'zoom-out',
      'ctrl+0': 'zoom-reset',
      'ctrl+shift+0': 'zoom-fit',
    };
  }
}

// React hook for keyboard mapping
export function useKeyboardMap(props: KeyboardMapProps) {
  const { selectedElements, onMove, onResize, onDelete, onSelect, onClearSelection, gridSize } = props;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Handle movement
    if (selectedElements.length === 1) {
      const element = selectedElements[0];
      let handled = true;

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          const deltaY = event.shiftKey ? -1 : -gridSize;
          onMove(element.id, 0, deltaY);
          break;

        case 'ArrowDown':
          event.preventDefault();
          const deltaY2 = event.shiftKey ? 1 : gridSize;
          onMove(element.id, 0, deltaY2);
          break;

        case 'ArrowLeft':
          event.preventDefault();
          const deltaX = event.shiftKey ? -1 : -gridSize;
          onMove(element.id, deltaX, 0);
          break;

        case 'ArrowRight':
          event.preventDefault();
          const deltaX2 = event.shiftKey ? 1 : gridSize;
          onMove(element.id, deltaX2, 0);
          break;

        default:
          handled = false;
      }

      if (handled) return true;
    }

    // Handle selection
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        onClearSelection();
        return true;

      case 'Delete':
      case 'Backspace':
        if (selectedElements.length > 0) {
          event.preventDefault();
          selectedElements.forEach(element => {
            onDelete(element.id);
          });
          return true;
        }
        break;

      case 'a':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          // Select all would be handled by parent
          return true;
        }
        break;

      case 'd':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          // Duplicate would be handled by parent
          return true;
        }
        break;

      case 'g':
        if (!event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          // Toggle grid would be handled by parent
          window.dispatchEvent(new CustomEvent('ff:toggle-grid'));
          return true;
        }
        break;
    }

    return false;
  }, [selectedElements, onMove, onDelete, onClearSelection, gridSize]);

  return { handleKeyDown };
}

// Hook for global keyboard shortcuts
export function useGlobalKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = getKeyString(event);
      const handler = shortcuts[key];
      
      if (handler) {
        event.preventDefault();
        event.stopPropagation();
        handler();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Helper function to create key string
function getKeyString(event: KeyboardEvent): string {
  const parts: string[] = [];
  
  if (event.ctrlKey || event.metaKey) parts.push('ctrl');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');
  
  parts.push(event.key.toLowerCase());
  return parts.join('+');
}

// Hook for keyboard navigation between elements
export function useKeyboardNavigation(elements: UIElement[], selectedIds: Set<string>, onSelect: (id: string) => void) {
  const navigateToNext = useCallback((direction: 'next' | 'previous') => {
    if (elements.length === 0) return;

    const selectedArray = Array.from(selectedIds);
    const currentId = selectedArray[selectedArray.length - 1]; // Get last selected
    
    let currentIndex = -1;
    if (currentId) {
      currentIndex = elements.findIndex(el => el.id === currentId);
    }

    let nextIndex: number;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % elements.length;
    } else {
      nextIndex = currentIndex <= 0 ? elements.length - 1 : currentIndex - 1;
    }

    onSelect(elements[nextIndex].id);
  }, [elements, selectedIds, onSelect]);

  const navigateToClosest = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (elements.length === 0) return;

    const selectedArray = Array.from(selectedIds);
    const currentId = selectedArray[selectedArray.length - 1];
    
    if (!currentId) {
      // If no selection, pick the first element
      onSelect(elements[0].id);
      return;
    }

    const currentElement = elements.find(el => el.id === currentId);
    if (!currentElement) return;

    // Find closest element in the specified direction
    const currentCenterX = currentElement.x + currentElement.width / 2;
    const currentCenterY = currentElement.y + currentElement.height / 2;

    let closestElement: UIElement | null = null;
    let closestDistance = Infinity;

    elements.forEach(element => {
      if (element.id === currentId) return;

      const elementCenterX = element.x + element.width / 2;
      const elementCenterY = element.y + element.height / 2;

      let isCorrectDirection = false;
      let distance = 0;

      switch (direction) {
        case 'up':
          isCorrectDirection = elementCenterY < currentCenterY;
          distance = Math.abs(elementCenterX - currentCenterX) + Math.abs(elementCenterY - currentCenterY);
          break;
        case 'down':
          isCorrectDirection = elementCenterY > currentCenterY;
          distance = Math.abs(elementCenterX - currentCenterX) + Math.abs(elementCenterY - currentCenterY);
          break;
        case 'left':
          isCorrectDirection = elementCenterX < currentCenterX;
          distance = Math.abs(elementCenterX - currentCenterX) + Math.abs(elementCenterY - currentCenterY);
          break;
        case 'right':
          isCorrectDirection = elementCenterX > currentCenterX;
          distance = Math.abs(elementCenterX - currentCenterX) + Math.abs(elementCenterY - currentCenterY);
          break;
      }

      if (isCorrectDirection && distance < closestDistance) {
        closestDistance = distance;
        closestElement = element;
      }
    });

    if (closestElement) {
      onSelect(closestElement.id);
    }
  }, [elements, selectedIds, onSelect]);

  return {
    navigateToNext,
    navigateToClosest,
  };
}

// Hook for keyboard resize controls
export function useKeyboardResize(element: UIElement, onResize: (deltaWidth: number, deltaHeight: number, handle: string) => void, gridSize: number) {
  const handleResize = useCallback((direction: string, fine = false) => {
    const delta = fine ? 1 : gridSize;
    let deltaWidth = 0;
    let deltaHeight = 0;
    let handle = '';

    switch (direction) {
      case 'up':
        deltaHeight = -delta;
        handle = 'n';
        break;
      case 'down':
        deltaHeight = delta;
        handle = 's';
        break;
      case 'left':
        deltaWidth = -delta;
        handle = 'w';
        break;
      case 'right':
        deltaWidth = delta;
        handle = 'e';
        break;
      case 'up-left':
        deltaWidth = -delta;
        deltaHeight = -delta;
        handle = 'nw';
        break;
      case 'up-right':
        deltaWidth = delta;
        deltaHeight = -delta;
        handle = 'ne';
        break;
      case 'down-left':
        deltaWidth = -delta;
        deltaHeight = delta;
        handle = 'sw';
        break;
      case 'down-right':
        deltaWidth = delta;
        deltaHeight = delta;
        handle = 'se';
        break;
    }

    if (handle) {
      onResize(deltaWidth, deltaHeight, handle);
    }
  }, [onResize, gridSize]);

  return { handleResize };
}