import { useEffect, useRef, useCallback, useState } from 'react';
import { UIElement, UseA11yLiveReturn } from '../types/selection';

export function useA11yLive(): UseA11yLiveReturn {
  const liveRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create live region for screen reader announcements
    if (!liveRegionRef.current) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      liveRegion.id = 'ff-a11y-live-region';
      document.body.appendChild(liveRegion);
      liveRegionRef.current = liveRegion;
    }

    return () => {
      if (liveRegionRef.current && liveRegionRef.current.parentNode) {
        liveRegionRef.current.parentNode.removeChild(liveRegionRef.current);
      }
    };
  }, []);

  const announce = useCallback((message: string) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = message;
      // Clear after announcement to allow repeated announcements
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = '';
        }
      }, 100);
    }
  }, []);

  const announceSelection = useCallback((element: UIElement) => {
    const elementType = element.type || 'element';
    const elementLabel = element.content || `${elementType} ${element.id.slice(0, 6)}`;
    const position = `position ${Math.round(element.x)}, ${Math.round(element.y)}`;
    const size = `width ${Math.round(element.width)}, height ${Math.round(element.height)}`;
    
    announce(`Selected ${elementLabel}, ${position}, ${size}`);
  }, [announce]);

  const announceMove = useCallback((element: UIElement, deltaX: number, deltaY: number) => {
    const elementType = element.type || 'element';
    const elementLabel = element.content || `${elementType} ${element.id.slice(0, 6)}`;
    const newPosition = `moved to ${Math.round(element.x)}, ${Math.round(element.y)}`;
    
    announce(`${elementLabel} ${newPosition}`);
  }, [announce]);

  const announceResize = useCallback((element: UIElement, deltaWidth: number, deltaHeight: number) => {
    const elementType = element.type || 'element';
    const elementLabel = element.content || `${elementType} ${element.id.slice(0, 6)}`;
    const newSize = `resized to width ${Math.round(element.width)}, height ${Math.round(element.height)}`;
    
    announce(`${elementLabel} ${newSize}`);
  }, [announce]);

  const announceDelete = useCallback((element: UIElement) => {
    const elementType = element.type || 'element';
    const elementLabel = element.content || `${elementType} ${element.id.slice(0, 6)}`;
    
    announce(`Deleted ${elementLabel}`);
  }, [announce]);

  return {
    announce,
    announceSelection,
    announceMove,
    announceResize,
    announceDelete,
  };
}

// Hook for managing focus in the UI creator
export function useFocusManagement() {
  const focusableElementsRef = useRef<Set<HTMLElement>>(new Set());

  const registerFocusable = useCallback((element: HTMLElement) => {
    focusableElementsRef.current.add(element);
    return () => {
      focusableElementsRef.current.delete(element);
    };
  }, []);

  const focusFirst = useCallback(() => {
    const elements = Array.from(focusableElementsRef.current);
    if (elements.length > 0) {
      elements[0].focus();
    }
  }, []);

  const focusLast = useCallback(() => {
    const elements = Array.from(focusableElementsRef.current);
    if (elements.length > 0) {
      elements[elements.length - 1].focus();
    }
  }, []);

  const focusNext = useCallback((currentElement: HTMLElement) => {
    const elements = Array.from(focusableElementsRef.current);
    const currentIndex = elements.indexOf(currentElement);
    if (currentIndex !== -1 && currentIndex < elements.length - 1) {
      elements[currentIndex + 1].focus();
    } else if (elements.length > 0) {
      elements[0].focus(); // Wrap around
    }
  }, []);

  const focusPrevious = useCallback((currentElement: HTMLElement) => {
    const elements = Array.from(focusableElementsRef.current);
    const currentIndex = elements.indexOf(currentElement);
    if (currentIndex > 0) {
      elements[currentIndex - 1].focus();
    } else if (elements.length > 0) {
      elements[elements.length - 1].focus(); // Wrap around
    }
  }, []);

  return {
    registerFocusable,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
  };
}

// Hook for keyboard shortcuts
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = [];
      
      if (event.ctrlKey || event.metaKey) key.push('ctrl');
      if (event.altKey) key.push('alt');
      if (event.shiftKey) key.push('shift');
      key.push(event.key.toLowerCase());
      
      const shortcut = key.join('+');
      const handler = shortcuts[shortcut];
      
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

// Hook for high contrast mode detection
export function useHighContrastMode() {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    setIsHighContrast(mediaQuery.matches);
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return isHighContrast;
}

// Hook for reduced motion detection
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    setPrefersReducedMotion(mediaQuery.matches);
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersReducedMotion;
}