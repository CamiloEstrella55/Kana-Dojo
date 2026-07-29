// ============================================================================
// Resource Search Utilities
// ============================================================================

import type { Resource } from '../types';

/**
 * Search resources by query string
 * Matches against name, description, and tags (case-insensitive)
 * @param resources - Array of resources to search
 * @param query - Search query string
 * @returns Resources matching the search query
 */
export function searchResources(
  resources: Resource[],
  query: string,
): Resource[] {
  const trimmedQuery = query.trim().toLowerCase();

  // Empty query returns all resources
  if (trimmedQuery.length === 0) {
    return resources;
  }

  return resources.filter(resource => {
    // Check name (case-insensitive)
    if (resource.name.toLowerCase().includes(trimmedQuery)) {
      return true;
    }

    // Check Japanese name if available (case-insensitive)
    if (
      resource.nameJa &&
      resource.nameJa.toLowerCase().includes(trimmedQuery)
    ) {
      return true;
    }

    // Check description (case-insensitive)
    if (resource.description.toLowerCase().includes(trimmedQuery)) {
      return true;
    }

    // Check long description if available (case-insensitive)
    if (
      resource.descriptionLong &&
      resource.descriptionLong.toLowerCase().includes(trimmedQuery)
    ) {
      return true;
    }

    // Check tags (case-insensitive)
    if (resource.tags.some(tag => tag.toLowerCase().includes(trimmedQuery))) {
      return true;
    }

    return false;
  });
}

/**
 * Check if a resource matches a search query
 * @param resource - Resource to check
 * @param query - Search query string
 * @returns True if the resource matches the query
 */
export function resourceMatchesQuery(
  resource: Resource,
  query: string,
): boolean {
  const trimmedQuery = query.trim().toLowerCase();

  if (trimmedQuery.length === 0) {
    return true;
  }

  // Check name
  if (resource.name.toLowerCase().includes(trimmedQuery)) {
    return true;
  }

  // Check Japanese name
  if (resource.nameJa && resource.nameJa.toLowerCase().includes(trimmedQuery)) {
    return true;
  }

  // Check description
  if (resource.description.toLowerCase().includes(trimmedQuery)) {
    return true;
  }

  // Check long description
  if (
    resource.descriptionLong &&
    resource.descriptionLong.toLowerCase().includes(trimmedQuery)
  ) {
    return true;
  }

  // Check tags
  if (resource.tags.some(tag => tag.toLowerCase().includes(trimmedQuery))) {
    return true;
  }

  return false;
}

/**
 * Get search match locations for highlighting
 * @param resource - Resource to check
 * @param query - Search query string
 * @returns Object indicating which fields matched
 */
export function getSearchMatchLocations(
  resource: Resource,
  query: string,
): {
  name: boolean;
  nameJa: boolean;
  description: boolean;
  descriptionLong: boolean;
  tags: string[];
} {
  const trimmedQuery = query.trim().toLowerCase();

  if (trimmedQuery.length === 0) {
    return {
      name: false,
      nameJa: false,
      description: false,
      descriptionLong: false,
      tags: [],
    };
  }

  return {
    name: resource.name.toLowerCase().includes(trimmedQuery),
    nameJa: resource.nameJa
      ? resource.nameJa.toLowerCase().includes(trimmedQuery)
      : false,
    description: resource.description.toLowerCase().includes(trimmedQuery),
    descriptionLong: resource.descriptionLong
      ? resource.descriptionLong.toLowerCase().includes(trimmedQuery)
      : false,
    tags: resource.tags.filter(tag => tag.toLowerCase().includes(trimmedQuery)),
  };
}
