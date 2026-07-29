'use client';

// ============================================================================
// Debounced Search Hook
// ============================================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Resource } from '../types';
import { searchResources } from '../lib/search';

/**
 * Hook for debounced search functionality
 * @param resources - Array of resources to search
 * @param debounceMs - Debounce delay in milliseconds (default: 300ms)
 * @returns Search state and handlers
 */
export function useSearch(resources: Resource[], debounceMs: number = 300) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Compute search results based on debounced query
  const results = useMemo(() => {
    return searchResources(resources, debouncedQuery);
  }, [resources, debouncedQuery]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
  }, []);

  // Check if search is active
  const isSearching = query.trim().length > 0;

  // Check if results are still loading (query changed but debounce hasn't fired)
  const isLoading = query !== debouncedQuery;

  return {
    /** Current search query */
    query,
    /** Set the search query */
    setQuery,
    /** Debounced search query */
    debouncedQuery,
    /** Search results */
    results,
    /** Number of results */
    resultCount: results.length,
    /** Clear the search */
    clearSearch,
    /** Whether a search is active */
    isSearching,
    /** Whether results are still loading (debounce pending) */
    isLoading,
  };
}

/**
 * Hook for instant (non-debounced) search
 * @param resources - Array of resources to search
 * @returns Search state and handlers
 */
export function useInstantSearch(resources: Resource[]) {
  const [query, setQuery] = useState('');

  // Compute search results immediately
  const results = useMemo(() => {
    return searchResources(resources, query);
  }, [resources, query]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
  }, []);

  // Check if search is active
  const isSearching = query.trim().length > 0;

  return {
    /** Current search query */
    query,
    /** Set the search query */
    setQuery,
    /** Search results */
    results,
    /** Number of results */
    resultCount: results.length,
    /** Clear the search */
    clearSearch,
    /** Whether a search is active */
    isSearching,
  };
}
