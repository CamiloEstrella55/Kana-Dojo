// ============================================================================
// Resource Filtering Utilities
// ============================================================================

import type {
  Resource,
  CategoryId,
  SubcategoryId,
  DifficultyLevel,
  PriceType,
  Platform,
  ActiveFilters,
} from '../types';

/**
 * Filter resources by category
 * @param resources - Array of resources to filter
 * @param category - Category ID to filter by
 * @returns Resources matching the specified category
 */
export function filterByCategory(
  resources: Resource[],
  category: CategoryId | string,
): Resource[] {
  return resources.filter(resource => resource.category === category);
}

/**
 * Filter resources by subcategory
 * @param resources - Array of resources to filter
 * @param subcategory - Subcategory ID to filter by
 * @returns Resources matching the specified subcategory
 */
export function filterBySubcategory(
  resources: Resource[],
  subcategory: SubcategoryId,
): Resource[] {
  return resources.filter(resource => resource.subcategory === subcategory);
}

/**
 * Filter resources by category and subcategory
 * @param resources - Array of resources to filter
 * @param category - Category ID to filter by
 * @param subcategory - Subcategory ID to filter by
 * @returns Resources matching both category and subcategory
 */
export function filterByCategoryAndSubcategory(
  resources: Resource[],
  category: CategoryId | string,
  subcategory: SubcategoryId,
): Resource[] {
  return resources.filter(
    resource =>
      resource.category === category && resource.subcategory === subcategory,
  );
}

/**
 * Filter resources by difficulty level(s)
 * @param resources - Array of resources to filter
 * @param difficulties - Array of difficulty levels to include
 * @returns Resources matching any of the specified difficulty levels
 */
export function filterByDifficulty(
  resources: Resource[],
  difficulties: DifficultyLevel[],
): Resource[] {
  if (difficulties.length === 0) {
    return resources;
  }
  return resources.filter(resource =>
    difficulties.includes(resource.difficulty),
  );
}

/**
 * Filter resources by price type(s)
 * @param resources - Array of resources to filter
 * @param priceTypes - Array of price types to include
 * @returns Resources matching any of the specified price types
 */
export function filterByPriceType(
  resources: Resource[],
  priceTypes: PriceType[],
): Resource[] {
  if (priceTypes.length === 0) {
    return resources;
  }
  return resources.filter(resource => priceTypes.includes(resource.priceType));
}

/**
 * Filter resources by platform(s)
 * A resource matches if it has at least one of the specified platforms
 * @param resources - Array of resources to filter
 * @param platforms - Array of platforms to include
 * @returns Resources available on at least one of the specified platforms
 */
export function filterByPlatform(
  resources: Resource[],
  platforms: Platform[],
): Resource[] {
  if (platforms.length === 0) {
    return resources;
  }
  return resources.filter(resource =>
    resource.platforms.some(platform => platforms.includes(platform)),
  );
}

/**
 * Apply multiple filters to resources simultaneously
 * All active filters must be satisfied (AND logic)
 * @param resources - Array of resources to filter
 * @param filters - Active filter selections
 * @returns Resources matching all active filter criteria
 */
export function combineFilters(
  resources: Resource[],
  filters: ActiveFilters,
): Resource[] {
  let result = resources;

  // Apply difficulty filter
  if (filters.difficulty.length > 0) {
    result = filterByDifficulty(result, filters.difficulty);
  }

  // Apply price type filter
  if (filters.priceType.length > 0) {
    result = filterByPriceType(result, filters.priceType);
  }

  // Apply platform filter
  if (filters.platforms.length > 0) {
    result = filterByPlatform(result, filters.platforms);
  }

  return result;
}

/**
 * Create an empty ActiveFilters object
 * @returns Empty filter state
 */
export function createEmptyFilters(): ActiveFilters {
  return {
    difficulty: [],
    priceType: [],
    platforms: [],
    search: '',
  };
}

/**
 * Check if any filters are active
 * @param filters - Filter state to check
 * @returns True if any filters are active
 */
export function hasActiveFilters(filters: ActiveFilters): boolean {
  return (
    filters.difficulty.length > 0 ||
    filters.priceType.length > 0 ||
    filters.platforms.length > 0 ||
    filters.search.trim().length > 0
  );
}
