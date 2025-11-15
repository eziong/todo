// =============================================
// SPOTLIGHT SEARCH PROVIDER COMPONENT
// =============================================
// Global context provider for spotlight search functionality with keyboard shortcut integration

'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { SpotlightSearch } from './SpotlightSearch';
import { useSpotlightSearch } from './useSpotlightSearch';
import type { 
  UseSpotlightSearchReturn, 
  SearchResultItem, 
  QuickAction 
} from './useSpotlightSearch';

// =============================================
// TYPES
// =============================================

export type SpotlightSearchContextValue = UseSpotlightSearchReturn;

export interface SpotlightSearchProviderProps {
  children: React.ReactNode;
  onResultSelect?: (result: SearchResultItem) => void;
  onActionSelect?: (action: QuickAction) => void;
}

// =============================================
// CONTEXT
// =============================================

const SpotlightSearchContext = createContext<SpotlightSearchContextValue | null>(null);

export const useSpotlightSearchContext = (): SpotlightSearchContextValue => {
  const context = useContext(SpotlightSearchContext);
  
  if (!context) {
    throw new Error(
      'useSpotlightSearchContext must be used within a SpotlightSearchProvider'
    );
  }
  
  return context;
};

// =============================================
// PROVIDER COMPONENT
// =============================================

export const SpotlightSearchProvider: React.FC<SpotlightSearchProviderProps> = ({
  children,
  onResultSelect,
  onActionSelect,
}) => {
  const spotlightSearch = useSpotlightSearch();

  // Register global keyboard shortcut
  useEffect(() => {
    const cleanup = spotlightSearch.registerGlobalShortcut(document.body);
    return cleanup;
  }, [spotlightSearch]);

  return (
    <SpotlightSearchContext.Provider value={spotlightSearch}>
      {children}
      <SpotlightSearch
        onResultSelect={onResultSelect}
        onActionSelect={onActionSelect}
      />
    </SpotlightSearchContext.Provider>
  );
};

// =============================================
// CUSTOM HOOKS FOR EASY ACCESS
// =============================================

/**
 * Hook to access spotlight search controls
 * Provides easy access to open/close and search functionality
 */
export const useSpotlightControls = (): {
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  isOpen: boolean;
} => {
  const { openSearch, closeSearch, toggleSearch, state } = useSpotlightSearchContext();
  
  return {
    openSearch,
    closeSearch,
    toggleSearch,
    isOpen: state.isOpen,
  };
};

/**
 * Hook to programmatically trigger searches
 * Useful for integrating with other components
 */
export const useSpotlightSearchTrigger = (): {
  triggerSearch: (query: string) => void;
} => {
  const { openSearch, handleQueryChange } = useSpotlightSearchContext();
  
  const triggerSearch = (query: string): void => {
    handleQueryChange(query);
    openSearch();
  };
  
  return {
    triggerSearch,
  };
};

export default SpotlightSearchProvider;