// =============================================
// DEBOUNCE HOOK
// =============================================
// Utility hook for debouncing values to optimize performance

'use client';

import { useState, useEffect } from 'react';

/**
 * Hook that debounces a value for a specified delay
 * Useful for optimizing search queries and API calls
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Update debounced value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clear timeout if value or delay changes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;