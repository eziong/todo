'use client';

import { useEffect, useRef, useCallback } from 'react';

interface KeyboardNavigationOptions {
  enabled?: boolean;
  trapFocus?: boolean;
  restoreFocus?: boolean;
  initialFocus?: 'first' | 'last' | string;
  onEscape?: () => void;
  onEnter?: () => void;
  onTab?: (direction: 'forward' | 'backward') => void;
  onArrowKeys?: (direction: 'up' | 'down' | 'left' | 'right') => void;
}

export const useKeyboardNavigation = (
  containerRef: React.RefObject<HTMLElement>,
  options: KeyboardNavigationOptions = {}
) => {
  const {
    enabled = true,
    trapFocus = false,
    restoreFocus = false,
    initialFocus = 'first',
    onEscape,
    onEnter,
    onTab,
    onArrowKeys
  } = options;

  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Get all focusable elements within the container
  const getFocusableElements = useCallback((container: HTMLElement): HTMLElement[] => {
    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      'area[href]',
      'iframe',
      'object',
      'embed',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(selector))
      .filter(element => {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
      }) as HTMLElement[];
  }, []);

  // Focus management utilities
  const focusElement = useCallback((element: HTMLElement | string) => {
    if (typeof element === 'string') {
      const targetElement = document.getElementById(element) || 
                           document.querySelector(element);
      if (targetElement) {
        (targetElement as HTMLElement).focus();
      }
    } else {
      element.focus();
    }
  }, []);

  const focusFirst = useCallback(() => {
    if (!containerRef.current) return;
    const focusableElements = getFocusableElements(containerRef.current);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, [containerRef, getFocusableElements]);

  const focusLast = useCallback(() => {
    if (!containerRef.current) return;
    const focusableElements = getFocusableElements(containerRef.current);
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }, [containerRef, getFocusableElements]);

  const focusNext = useCallback(() => {
    if (!containerRef.current) return;
    const focusableElements = getFocusableElements(containerRef.current);
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    
    if (currentIndex < focusableElements.length - 1) {
      focusableElements[currentIndex + 1].focus();
    } else if (trapFocus) {
      focusableElements[0].focus();
    }
  }, [containerRef, getFocusableElements, trapFocus]);

  const focusPrevious = useCallback(() => {
    if (!containerRef.current) return;
    const focusableElements = getFocusableElements(containerRef.current);
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    
    if (currentIndex > 0) {
      focusableElements[currentIndex - 1].focus();
    } else if (trapFocus) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }, [containerRef, getFocusableElements, trapFocus]);

  // Keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled || !containerRef.current) return;

    switch (event.key) {
      case 'Escape':
        if (onEscape) {
          event.preventDefault();
          onEscape();
        }
        break;

      case 'Enter':
        if (onEnter) {
          event.preventDefault();
          onEnter();
        }
        break;

      case 'Tab':
        if (trapFocus) {
          event.preventDefault();
          const direction = event.shiftKey ? 'backward' : 'forward';
          
          if (direction === 'forward') {
            focusNext();
          } else {
            focusPrevious();
          }
        }
        
        if (onTab) {
          const direction = event.shiftKey ? 'backward' : 'forward';
          onTab(direction);
        }
        break;

      case 'ArrowUp':
        if (onArrowKeys) {
          event.preventDefault();
          onArrowKeys('up');
        }
        break;

      case 'ArrowDown':
        if (onArrowKeys) {
          event.preventDefault();
          onArrowKeys('down');
        }
        break;

      case 'ArrowLeft':
        if (onArrowKeys) {
          event.preventDefault();
          onArrowKeys('left');
        }
        break;

      case 'ArrowRight':
        if (onArrowKeys) {
          event.preventDefault();
          onArrowKeys('right');
        }
        break;

      case 'Home':
        if (containerRef.current.contains(document.activeElement)) {
          event.preventDefault();
          focusFirst();
        }
        break;

      case 'End':
        if (containerRef.current.contains(document.activeElement)) {
          event.preventDefault();
          focusLast();
        }
        break;
    }
  }, [
    enabled,
    containerRef,
    onEscape,
    onEnter,
    onTab,
    onArrowKeys,
    trapFocus,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast
  ]);

  // Set initial focus when component mounts
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    // Store the previously focused element for restoration
    if (restoreFocus) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
    }

    // Set initial focus
    if (initialFocus === 'first') {
      focusFirst();
    } else if (initialFocus === 'last') {
      focusLast();
    } else if (typeof initialFocus === 'string') {
      focusElement(initialFocus);
    }
  }, [enabled, containerRef, restoreFocus, initialFocus, focusFirst, focusLast, focusElement]);

  // Set up keyboard event listeners
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  // Restore focus when component unmounts
  useEffect(() => {
    return () => {
      if (restoreFocus && previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [restoreFocus]);

  // Return utility functions for manual focus management
  return {
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    focusElement,
    getFocusableElements: () => 
      containerRef.current ? getFocusableElements(containerRef.current) : []
  };
};

// Hook for managing roving tabindex (for component collections like tabs, lists)
export const useRovingTabIndex = (
  containerRef: React.RefObject<HTMLElement>,
  activeIndex: number,
  setActiveIndex: (index: number) => void,
  options: {
    enabled?: boolean;
    orientation?: 'horizontal' | 'vertical' | 'both';
    wrap?: boolean;
  } = {}
) => {
  const { 
    enabled = true, 
    orientation = 'both', 
    wrap = true 
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled || !containerRef.current) return;

    const focusableElements = Array.from(
      containerRef.current.querySelectorAll('[role="tab"], [role="option"], [role="menuitem"], .roving-tabindex-item')
    ) as HTMLElement[];

    if (focusableElements.length === 0) return;

    let newIndex = activeIndex;

    switch (event.key) {
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          newIndex = activeIndex > 0 ? activeIndex - 1 : 
                    (wrap ? focusableElements.length - 1 : activeIndex);
        }
        break;

      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          newIndex = activeIndex < focusableElements.length - 1 ? activeIndex + 1 : 
                    (wrap ? 0 : activeIndex);
        }
        break;

      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          newIndex = activeIndex > 0 ? activeIndex - 1 : 
                    (wrap ? focusableElements.length - 1 : activeIndex);
        }
        break;

      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          newIndex = activeIndex < focusableElements.length - 1 ? activeIndex + 1 : 
                    (wrap ? 0 : activeIndex);
        }
        break;

      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;

      case 'End':
        event.preventDefault();
        newIndex = focusableElements.length - 1;
        break;
    }

    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
      focusableElements[newIndex]?.focus();
    }
  }, [enabled, containerRef, activeIndex, setActiveIndex, orientation, wrap]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  // Set tabindex values based on active index
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const focusableElements = Array.from(
      containerRef.current.querySelectorAll('[role="tab"], [role="option"], [role="menuitem"], .roving-tabindex-item')
    ) as HTMLElement[];

    focusableElements.forEach((element, index) => {
      element.tabIndex = index === activeIndex ? 0 : -1;
    });
  }, [enabled, containerRef, activeIndex]);
};