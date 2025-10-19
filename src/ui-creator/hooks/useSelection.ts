import { useState, useCallback, useMemo } from 'react';
import { UIElement, SelectionState, UseSelectionReturn } from '../types/selection';

export function useSelection(elements: UIElement[]): UseSelectionReturn {
  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedIds: new Set(),
    activeId: null,
    isMultiSelect: false,
    lastSelectedId: null,
  });

  const selectedElements = useMemo(() => {
    return elements.filter(element => selectionState.selectedIds.has(element.id));
  }, [elements, selectionState.selectedIds]);

  const select = useCallback((id: string, multi = false) => {
    setSelectionState(prev => {
      const newSelectedIds = new Set(prev.selectedIds);
      
      if (!multi) {
        // Single selection - clear previous selection
        newSelectedIds.clear();
        newSelectedIds.add(id);
        return {
          ...prev,
          selectedIds: newSelectedIds,
          activeId: id,
          isMultiSelect: false,
          lastSelectedId: id,
        };
      } else {
        // Multi-selection logic
        if (newSelectedIds.has(id)) {
          newSelectedIds.delete(id);
          // If we removed the active element, set a new active one
          const newActiveId = newSelectedIds.size > 0 
            ? Array.from(newSelectedIds)[newSelectedIds.size - 1]
            : null;
          return {
            ...prev,
            selectedIds: newSelectedIds,
            activeId: newActiveId,
            isMultiSelect: newSelectedIds.size > 1,
            lastSelectedId: id,
          };
        } else {
          newSelectedIds.add(id);
          return {
            ...prev,
            selectedIds: newSelectedIds,
            activeId: id,
            isMultiSelect: newSelectedIds.size > 1,
            lastSelectedId: id,
          };
        }
      }
    });
  }, []);

  const deselect = useCallback((id?: string) => {
    setSelectionState(prev => {
      if (id) {
        // Deselect specific element
        const newSelectedIds = new Set(prev.selectedIds);
        newSelectedIds.delete(id);
        
        // If we removed the active element, set a new active one
        const newActiveId = newSelectedIds.size > 0 
          ? Array.from(newSelectedIds)[newSelectedIds.size - 1]
          : null;
          
        return {
          ...prev,
          selectedIds: newSelectedIds,
          activeId: newActiveId,
          isMultiSelect: newSelectedIds.size > 1,
        };
      } else {
        // Clear all selection
        return {
          ...prev,
          selectedIds: new Set(),
          activeId: null,
          isMultiSelect: false,
          lastSelectedId: null,
        };
      }
    });
  }, []);

  const selectAll = useCallback(() => {
    const allIds = new Set(elements.map(el => el.id));
    setSelectionState(prev => ({
      ...prev,
      selectedIds: allIds,
      activeId: elements.length > 0 ? elements[elements.length - 1].id : null,
      isMultiSelect: elements.length > 1,
      lastSelectedId: elements.length > 0 ? elements[elements.length - 1].id : null,
    }));
  }, [elements]);

  const clearSelection = useCallback(() => {
    setSelectionState({
      selectedIds: new Set(),
      activeId: null,
      isMultiSelect: false,
      lastSelectedId: null,
    });
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectionState.selectedIds.has(id);
  }, [selectionState.selectedIds]);

  const setActive = useCallback((id: string) => {
    setSelectionState(prev => ({
      ...prev,
      activeId: id,
      lastSelectedId: id,
    }));
  }, []);

  return {
    selectedElements,
    selectedIds: selectionState.selectedIds,
    activeId: selectionState.activeId,
    isMultiSelect: selectionState.isMultiSelect,
    select,
    deselect,
    selectAll,
    clearSelection,
    isSelected,
    setActive,
  };
}

// Helper hook for keyboard selection management
export function useKeyboardSelection(elements: UIElement[], selection: UseSelectionReturn) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { selectedIds, activeId, select, clearSelection, selectAll } = selection;
    
    // Handle Escape - clear selection
    if (event.key === 'Escape') {
      event.preventDefault();
      clearSelection();
      return;
    }

    // Handle Ctrl/Cmd + A - select all
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      event.preventDefault();
      selectAll();
      return;
    }

    // Handle Tab - navigate between elements
    if (event.key === 'Tab') {
      event.preventDefault();
      if (elements.length === 0) return;
      
      const currentIndex = activeId ? elements.findIndex(el => el.id === activeId) : -1;
      const direction = event.shiftKey ? -1 : 1;
      const nextIndex = (currentIndex + direction + elements.length) % elements.length;
      select(elements[nextIndex].id, event.shiftKey);
      return;
    }

    // Handle Delete/Backspace - delete selected elements
    if ((event.key === 'Delete' || event.key === 'Backspace') && selectedIds.size > 0) {
      event.preventDefault();
      // This would be handled by the parent component
      window.dispatchEvent(new CustomEvent('ff:delete-selected', { 
        detail: { selectedIds: Array.from(selectedIds) } 
      }));
      return;
    }

    // Handle arrow keys for navigation (if no active element)
    if (!activeId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      if (elements.length === 0) return;
      
      // Simple directional selection - pick first element for now
      // Could be enhanced to pick closest element in direction
      select(elements[0].id);
      return;
    }
  }, [elements, selection]);

  return { handleKeyDown };
}

// Helper hook for mouse selection management
export function useMouseSelection(elements: UIElement[], selection: UseSelectionReturn) {
  const handleElementClick = useCallback((elementId: string, event: React.MouseEvent) => {
    const { select, isSelected } = selection;
    
    // Check for multi-selection modifiers
    const multi = event.ctrlKey || event.metaKey || event.shiftKey;
    
    // If already selected and multi is pressed, deselect
    if (multi && isSelected(elementId)) {
      selection.deselect(elementId);
    } else {
      select(elementId, multi);
    }
  }, [selection]);

  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    // Clear selection when clicking on empty canvas
    if (event.target === event.currentTarget) {
      selection.clearSelection();
    }
  }, [selection]);

  return { handleElementClick, handleCanvasClick };
}