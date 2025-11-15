// =============================================
// SPOTLIGHT SEARCH COMPONENT EXPORTS
// =============================================
// Barrel exports for SpotlightSearch component following container-presenter pattern

export { SpotlightSearch } from './SpotlightSearch';
export { useSpotlightSearch } from './useSpotlightSearch';
export { 
  SpotlightSearchProvider, 
  useSpotlightSearchContext,
  useSpotlightControls,
  useSpotlightSearchTrigger
} from './SpotlightSearchProvider';

export type {
  SearchCategory,
  SearchResultItem,
  QuickAction,
  RecentSearch,
  SearchState,
  UseSpotlightSearchReturn
} from './useSpotlightSearch';
export type { SpotlightSearchProps } from './SpotlightSearch';
export type { 
  SpotlightSearchContextValue,
  SpotlightSearchProviderProps
} from './SpotlightSearchProvider';

// Default export for convenience
export { SpotlightSearch as default } from './SpotlightSearch';