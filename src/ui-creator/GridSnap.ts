import { UIElement, AlignmentGuide, GridSnapOptions, UIElementBounds } from './types/selection';

export class GridSnap {
  private options: GridSnapOptions;
  private canvasBounds: DOMRect | null = null;

  constructor(options: Partial<GridSnapOptions> = {}) {
    this.options = {
      gridSize: 8,
      showGrid: false,
      snapToGrid: true,
      showAlignmentGuides: true,
      ...options,
    };
  }

  setCanvasBounds(bounds: DOMRect) {
    this.canvasBounds = bounds;
  }

  updateOptions(newOptions: Partial<GridSnapOptions>) {
    this.options = { ...this.options, ...newOptions };
  }

  // Snap a value to the nearest grid point
  snapToGrid(value: number): number {
    if (!this.options.snapToGrid) return value;
    
    const gridSize = this.options.gridSize;
    return Math.round(value / gridSize) * gridSize;
  }

  // Snap a point to the grid
  snapPoint(x: number, y: number): { x: number; y: number } {
    return {
      x: this.snapToGrid(x),
      y: this.snapToGrid(y),
    };
  }

  // Snap a rectangle to the grid
  snapRect(element: UIElement): Partial<UIElement> {
    const snapped = this.snapPoint(element.x, element.y);
    const snappedSize = {
      width: this.snapToGrid(element.width),
      height: this.snapToGrid(element.height),
    };

    return {
      x: snapped.x,
      y: snapped.y,
      width: snappedSize.width,
      height: snappedSize.height,
    };
  }

  // Calculate alignment guides for an element relative to other elements
  calculateAlignmentGuides(
    element: UIElement,
    otherElements: UIElement[]
  ): AlignmentGuide[] {
    if (!this.options.showAlignmentGuides || otherElements.length === 0) {
      return [];
    }

    const guides: AlignmentGuide[] = [];
    const elementBounds = this.getElementBounds(element);

    otherElements.forEach(other => {
      if (other.id === element.id) return;
      
      const otherBounds = this.getElementBounds(other);
      
      // Horizontal alignments
      this.addHorizontalGuides(elementBounds, otherBounds, guides);
      
      // Vertical alignments
      this.addVerticalGuides(elementBounds, otherBounds, guides);
    });

    // Remove duplicates and sort by position
    return this.deduplicateGuides(guides).sort((a, b) => a.position - b.position);
  }

  private getElementBounds(element: UIElement): UIElementBounds {
    return {
      left: element.x,
      top: element.y,
      right: element.x + element.width,
      bottom: element.y + element.height,
      width: element.width,
      height: element.height,
      centerX: element.x + element.width / 2,
      centerY: element.y + element.height / 2,
    };
  }

  private addHorizontalGuides(
    elementBounds: UIElementBounds,
    otherBounds: UIElementBounds,
    guides: AlignmentGuide[]
  ) {
    const tolerance = 8; // pixels

    // Top edges
    if (Math.abs(elementBounds.top - otherBounds.top) < tolerance) {
      guides.push({
        type: 'horizontal',
        position: otherBounds.top,
        strength: 'strong',
      });
    }

    // Bottom edges
    if (Math.abs(elementBounds.bottom - otherBounds.bottom) < tolerance) {
      guides.push({
        type: 'horizontal',
        position: otherBounds.bottom,
        strength: 'strong',
      });
    }

    // Center alignment
    if (Math.abs(elementBounds.centerY - otherBounds.centerY) < tolerance) {
      guides.push({
        type: 'horizontal',
        position: otherBounds.centerY,
        strength: 'medium',
      });
    }

    // Top to bottom alignment
    if (Math.abs(elementBounds.top - otherBounds.bottom) < tolerance) {
      guides.push({
        type: 'horizontal',
        position: otherBounds.bottom,
        strength: 'weak',
      });
    }

    // Bottom to top alignment
    if (Math.abs(elementBounds.bottom - otherBounds.top) < tolerance) {
      guides.push({
        type: 'horizontal',
        position: otherBounds.top,
        strength: 'weak',
      });
    }
  }

  private addVerticalGuides(
    elementBounds: UIElementBounds,
    otherBounds: UIElementBounds,
    guides: AlignmentGuide[]
  ) {
    const tolerance = 8; // pixels

    // Left edges
    if (Math.abs(elementBounds.left - otherBounds.left) < tolerance) {
      guides.push({
        type: 'vertical',
        position: otherBounds.left,
        strength: 'strong',
      });
    }

    // Right edges
    if (Math.abs(elementBounds.right - otherBounds.right) < tolerance) {
      guides.push({
        type: 'vertical',
        position: otherBounds.right,
        strength: 'strong',
      });
    }

    // Center alignment
    if (Math.abs(elementBounds.centerX - otherBounds.centerX) < tolerance) {
      guides.push({
        type: 'vertical',
        position: otherBounds.centerX,
        strength: 'medium',
      });
    }

    // Left to right alignment
    if (Math.abs(elementBounds.left - otherBounds.right) < tolerance) {
      guides.push({
        type: 'vertical',
        position: otherBounds.right,
        strength: 'weak',
      });
    }

    // Right to left alignment
    if (Math.abs(elementBounds.right - otherBounds.left) < tolerance) {
      guides.push({
        type: 'vertical',
        position: otherBounds.left,
        strength: 'weak',
      });
    }
  }

  private deduplicateGuides(guides: AlignmentGuide[]): AlignmentGuide[] {
    const seen = new Set<string>();
    return guides.filter(guide => {
      const key = `${guide.type}-${guide.position}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Snap to alignment guides
  snapToGuides(
    element: UIElement,
    guides: AlignmentGuide[],
    deltaX: number,
    deltaY: number
  ): { x: number; y: number; snappedGuides: AlignmentGuide[] } {
    let snappedX = element.x + deltaX;
    let snappedY = element.y + deltaY;
    const snappedGuides: AlignmentGuide[] = [];

    const tolerance = 8; // pixels

    guides.forEach(guide => {
      if (guide.type === 'horizontal') {
        const elementBounds = this.getElementBounds({ ...element, x: snappedX, y: snappedY });
        
        // Check if we should snap to this guide
        if (Math.abs(elementBounds.top - guide.position) < tolerance) {
          snappedY = guide.position - (elementBounds.top - element.y);
          snappedGuides.push(guide);
        } else if (Math.abs(elementBounds.bottom - guide.position) < tolerance) {
          snappedY = guide.position - (elementBounds.bottom - element.y);
          snappedGuides.push(guide);
        } else if (Math.abs(elementBounds.centerY - guide.position) < tolerance) {
          snappedY = guide.position - (elementBounds.centerY - element.y);
          snappedGuides.push(guide);
        }
      } else if (guide.type === 'vertical') {
        const elementBounds = this.getElementBounds({ ...element, x: snappedX, y: snappedY });
        
        // Check if we should snap to this guide
        if (Math.abs(elementBounds.left - guide.position) < tolerance) {
          snappedX = guide.position - (elementBounds.left - element.x);
          snappedGuides.push(guide);
        } else if (Math.abs(elementBounds.right - guide.position) < tolerance) {
          snappedX = guide.position - (elementBounds.right - element.x);
          snappedGuides.push(guide);
        } else if (Math.abs(elementBounds.centerX - guide.position) < tolerance) {
          snappedX = guide.position - (elementBounds.centerX - element.x);
          snappedGuides.push(guide);
        }
      }
    });

    // Also snap to grid if enabled
    if (this.options.snapToGrid) {
      const gridSnapped = this.snapPoint(snappedX, snappedY);
      snappedX = gridSnapped.x;
      snappedY = gridSnapped.y;
    }

    return { x: snappedX, y: snappedY, snappedGuides };
  }

  // Generate grid lines for rendering
  generateGridLines(canvasWidth: number, canvasHeight: number) {
    if (!this.options.showGrid) return [];

    const lines: Array<{ type: 'horizontal' | 'vertical'; position: number }> = [];
    const gridSize = this.options.gridSize;

    // Vertical lines
    for (let x = 0; x <= canvasWidth; x += gridSize) {
      lines.push({ type: 'vertical', position: x });
    }

    // Horizontal lines
    for (let y = 0; y <= canvasHeight; y += gridSize) {
      lines.push({ type: 'horizontal', position: y });
    }

    return lines;
  }

  // Check if a point is near a grid line
  isNearGridLine(x: number, y: number, tolerance = 4): { x: boolean; y: boolean } {
    if (!this.options.showGrid) return { x: false, y: false };

    const gridSize = this.options.gridSize;
    
    return {
      x: Math.abs(x % gridSize) < tolerance || Math.abs(x % gridSize - gridSize) < tolerance,
      y: Math.abs(y % gridSize) < tolerance || Math.abs(y % gridSize - gridSize) < tolerance,
    };
  }

  // Get the nearest grid intersection point
  getNearestGridIntersection(x: number, y: number): { x: number; y: number } {
    const gridSize = this.options.gridSize;
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize,
    };
  }
}

import { useRef } from 'react';

// Hook for using GridSnap in React components
export function useGridSnap(options: Partial<GridSnapOptions> = {}) {
  const gridSnapRef = useRef<GridSnap | null>(null);

  if (!gridSnapRef.current) {
    gridSnapRef.current = new GridSnap(options);
  } else {
    gridSnapRef.current.updateOptions(options);
  }

  return gridSnapRef.current;
}