import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SelectionChromeProps, ResizeHandle, DragState, ResizeState } from './types/selection';
import { useA11yLive } from './hooks/useA11yLive';
import { useGridSnap } from './GridSnap';

export const SelectionChrome: React.FC<SelectionChromeProps> = ({
  element,
  isSelected,
  isActive,
  onSelect,
  onUpdate,
  onDelete,
  gridSize = 8,
  showAlignmentGuides = true,
  children,
}) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    elementId: null,
  });

  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    handle: null,
    elementId: null,
  });

  const [alignmentGuides, setAlignmentGuides] = useState<Array<{ type: 'horizontal' | 'vertical'; position: number }>>([]);

  const elementRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);
  const gridSnap = useGridSnap({ gridSize, showGrid: false, snapToGrid: true, showAlignmentGuides });

  const { announceSelection, announceMove, announceResize, announceDelete } = useA11yLive();

  // Resize handles configuration
  const resizeHandles: ResizeHandle[] = [
    {
      cursor: 'nw-resize',
      position: 'nw',
      getX: (el) => el.x,
      getY: (el) => el.y,
      getWidth: (el) => el.width,
      getHeight: (el) => el.height,
      updateElement: (el, deltaX, deltaY, deltaWidth, deltaHeight) => ({
        x: el.x + deltaX,
        y: el.y + deltaY,
        width: Math.max(20, el.width - deltaWidth),
        height: Math.max(20, el.height - deltaHeight),
      }),
    },
    {
      cursor: 'n-resize',
      position: 'n',
      getX: (el) => el.x + el.width / 2,
      getY: (el) => el.y,
      getWidth: (el) => el.width,
      getHeight: (el) => el.height,
      updateElement: (el, deltaX, deltaY, deltaWidth, deltaHeight) => ({
        y: el.y + deltaY,
        height: Math.max(20, el.height - deltaHeight),
      }),
    },
    {
      cursor: 'ne-resize',
      position: 'ne',
      getX: (el) => el.x + el.width,
      getY: (el) => el.y,
      getWidth: (el) => el.width,
      getHeight: (el) => el.height,
      updateElement: (el, deltaX, deltaY, deltaWidth, deltaHeight) => ({
        y: el.y + deltaY,
        width: Math.max(20, el.width + deltaWidth),
        height: Math.max(20, el.height - deltaHeight),
      }),
    },
    {
      cursor: 'e-resize',
      position: 'e',
      getX: (el) => el.x + el.width,
      getY: (el) => el.y + el.height / 2,
      getWidth: (el) => el.width,
      getHeight: (el) => el.height,
      updateElement: (el, deltaX, deltaY, deltaWidth, deltaHeight) => ({
        width: Math.max(20, el.width + deltaWidth),
      }),
    },
    {
      cursor: 'se-resize',
      position: 'se',
      getX: (el) => el.x + el.width,
      getY: (el) => el.y + el.height,
      getWidth: (el) => el.width,
      getHeight: (el) => el.height,
      updateElement: (el, deltaX, deltaY, deltaWidth, deltaHeight) => ({
        width: Math.max(20, el.width + deltaWidth),
        height: Math.max(20, el.height + deltaHeight),
      }),
    },
    {
      cursor: 's-resize',
      position: 's',
      getX: (el) => el.x + el.width / 2,
      getY: (el) => el.y + el.height,
      getWidth: (el) => el.width,
      getHeight: (el) => el.height,
      updateElement: (el, deltaX, deltaY, deltaWidth, deltaHeight) => ({
        height: Math.max(20, el.height + deltaHeight),
      }),
    },
    {
      cursor: 'sw-resize',
      position: 'sw',
      getX: (el) => el.x,
      getY: (el) => el.y + el.height,
      getWidth: (el) => el.width,
      getHeight: (el) => el.height,
      updateElement: (el, deltaX, deltaY, deltaWidth, deltaHeight) => ({
        x: el.x + deltaX,
        width: Math.max(20, el.width - deltaWidth),
        height: Math.max(20, el.height + deltaHeight),
      }),
    },
    {
      cursor: 'w-resize',
      position: 'w',
      getX: (el) => el.x,
      getY: (el) => el.y + el.height / 2,
      getWidth: (el) => el.width,
      getHeight: (el) => el.height,
      updateElement: (el, deltaX, deltaY, deltaWidth, deltaHeight) => ({
        x: el.x + deltaX,
        width: Math.max(20, el.width - deltaWidth),
      }),
    },
  ];

  // Handle mouse down on element
  const handleElementMouseDown = useCallback((event: React.MouseEvent) => {
    if (!isSelected) {
      onSelect(element.id, event.ctrlKey || event.metaKey || event.shiftKey);
      return;
    }

    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      // Multi-select logic handled by parent
      return;
    }

    // Start dragging
    const startX = event.clientX;
    const startY = event.clientY;

    setDragState({
      isDragging: true,
      startX,
      startY,
      currentX: startX,
      currentY: startY,
      elementId: element.id,
    });

    event.preventDefault();
  }, [isSelected, onSelect, element.id]);

  // Handle mouse down on resize handle
  const handleResizeMouseDown = useCallback((event: React.MouseEvent, handle: ResizeHandle) => {
    event.stopPropagation();
    event.preventDefault();

    const startX = event.clientX;
    const startY = event.clientY;

    setResizeState({
      isResizing: true,
      startX,
      startY,
      startWidth: element.width,
      startHeight: element.height,
      handle: handle.position,
      elementId: element.id,
    });
  }, [element]);

  // Global mouse move handler
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (dragState.isDragging && dragState.elementId === element.id) {
        const deltaX = event.clientX - dragState.startX;
        const deltaY = event.clientY - dragState.startY;

        const newX = element.x + deltaX;
        const newY = element.y + deltaY;

        // Apply grid snap
        const snapped = gridSnap.snapPoint(newX, newY);

        onUpdate({
          x: snapped.x,
          y: snapped.y,
        });

        announceMove(element, snapped.x - element.x, snapped.y - element.y);
      }

      if (resizeState.isResizing && resizeState.elementId === element.id) {
        const deltaX = event.clientX - resizeState.startX;
        const deltaY = event.clientY - resizeState.startY;

        const handle = resizeHandles.find(h => h.position === resizeState.handle);
        if (handle) {
          const updates = handle.updateElement(element, deltaX, deltaY, deltaX, deltaY);
          const snappedUpdates = gridSnap.snapRect({ ...element, ...updates });

          onUpdate(snappedUpdates);
          announceResize(element, snappedUpdates.width! - element.width, snappedUpdates.height! - element.height);
        }
      }
    };

    const handleMouseUp = () => {
      if (dragState.isDragging) {
        setDragState(prev => ({ ...prev, isDragging: false, elementId: null }));
      }
      if (resizeState.isResizing) {
        setResizeState(prev => ({ ...prev, isResizing: false, elementId: null, handle: null }));
      }
    };

    if (dragState.isDragging || resizeState.isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, resizeState, element, onUpdate, announceMove, announceResize, gridSnap, resizeHandles]);

  // Handle selection
  useEffect(() => {
    if (isSelected && !dragState.isDragging && !resizeState.isResizing) {
      announceSelection(element);
    }
  }, [isSelected, element, announceSelection, dragState.isDragging, resizeState.isResizing]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isSelected || !isActive) return;

      const moveAmount = event.shiftKey ? 1 : gridSize;

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          onUpdate({ y: element.y - moveAmount });
          announceMove(element, 0, -moveAmount);
          break;
        case 'ArrowDown':
          event.preventDefault();
          onUpdate({ y: element.y + moveAmount });
          announceMove(element, 0, moveAmount);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          onUpdate({ x: element.x - moveAmount });
          announceMove(element, -moveAmount, 0);
          break;
        case 'ArrowRight':
          event.preventDefault();
          onUpdate({ x: element.x + moveAmount });
          announceMove(element, moveAmount, 0);
          break;
        case 'Delete':
        case 'Backspace':
          event.preventDefault();
          onDelete(element.id);
          announceDelete(element);
          break;
        case 'Escape':
          event.preventDefault();
          // Clear selection handled by parent
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, isActive, element, onUpdate, onDelete, gridSize, announceMove, announceDelete]);

  if (!isSelected) {
    return <>{children}</>;
  }

  return (
    <div
      ref={chromeRef}
      className={`selection-chrome ${isActive ? 'active' : ''}`}
      style={{
        position: 'absolute',
        left: element.x - 2,
        top: element.y - 2,
        width: element.width + 4,
        height: element.height + 4,
        pointerEvents: dragState.isDragging || resizeState.isResizing ? 'none' : 'auto',
      }}
      role="region"
      aria-label={`Selected ${element.type || 'element'}`}
      tabIndex={isActive ? 0 : -1}
    >
      {/* Selection border */}
      <div className="selection-chrome__border" />

      {/* Drag bar */}
      <div
        className="selection-chrome__drag-bar"
        onMouseDown={handleElementMouseDown}
        role="button"
        tabIndex={-1}
        aria-label="Drag to move"
      />

      {/* Resize handles */}
      {resizeHandles.map((handle) => (
        <div
          key={handle.position}
          className={`selection-chrome__handle selection-chrome__handle--${handle.position}`}
          style={{
            cursor: handle.cursor,
            left: handle.getX(element) - element.x - 4,
            top: handle.getY(element) - element.y - 4,
          }}
          onMouseDown={(e) => handleResizeMouseDown(e, handle)}
          role="button"
          tabIndex={-1}
          aria-label={`Resize ${handle.position}`}
        />
      ))}

      {/* Children (actual element) */}
      <div className="selection-chrome__content">
        {children}
      </div>

      {/* Alignment guides */}
      {alignmentGuides.map((guide, index) => (
        <div
          key={index}
          className={`selection-chrome__alignment-guide selection-chrome__alignment-guide--${guide.type}`}
          style={{
            [guide.type === 'horizontal' ? 'top' : 'left']: `${guide.position - element.y}px`,
            [guide.type === 'horizontal' ? 'width' : 'height']: '100%',
            [guide.type === 'horizontal' ? 'height' : 'width']: '1px',
          }}
        />
      ))}
    </div>
  );
};

export default SelectionChrome;