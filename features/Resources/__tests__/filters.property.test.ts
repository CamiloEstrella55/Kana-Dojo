import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  filterByCategory,
  filterBySubcategory,
  filterByCategoryAndSubcategory,
  filterByDifficulty,
  filterByPriceType,
  filterByPlatform,
  combineFilters,
} from '../lib/filters';
import {
  CATEGORY_IDS,
  DIFFICULTY_LEVELS,
  PRICE_TYPES,
  PLATFORMS,
  type Resource,
  type CategoryId,
  type DifficultyLevel,
  type PriceType,
  type Platform,
} from '../types';

// ============================================================================
// Arbitraries for generating valid resource values
// ============================================================================

const categoryArb: fc.Arbitrary<CategoryId> = fc.constantFrom(...CATEGORY_IDS);
const difficultyArb: fc.Arbitrary<DifficultyLevel> = fc.constantFrom(
  ...DIFFICULTY_LEVELS,
);
const priceTypeArb: fc.Arbitrary<PriceType> = fc.constantFrom(...PRICE_TYPES);
const platformArb: fc.Arbitrary<Platform> = fc.constantFrom(...PLATFORMS);

const nonEmptyStringArb = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter(s => s.trim().length > 0);

const subcategoryArb = fc.constantFrom(
  'flashcards',
  'dictionaries',
  'comprehensive',
  'input-methods',
  'beginner',
  'intermediate',
  'advanced',
  'grammar',
  'vocabulary',
  'kanji',
  'general',
);

const tagsArb = fc.array(nonEmptyStringArb, { minLength: 1, maxLength: 5 });
const platformsArb = fc.array(platformArb, { minLength: 1, maxLength: 5 });
const urlArb = fc.webUrl().filter(url => url.length > 0);

// Generate a complete valid resource object
const resourceArb: fc.Arbitrary<Resource> = fc.record({
  id: nonEmptyStringArb,
  name: nonEmptyStringArb,
  description: nonEmptyStringArb,
  category: categoryArb,
  subcategory: subcategoryArb,
  tags: tagsArb,
  difficulty: difficultyArb,
  priceType: priceTypeArb,
  platforms: platformsArb,
  url: urlArb,
});

// Generate an array of resources
const resourcesArb = fc.array(resourceArb, { minLength: 0, maxLength: 50 });

/**
 * **Feature: japanese-resources-library, Property 2: Category and Subcategory Filtering Correctness**
 * For any category or subcategory selection, all resources returned by the filter function
 * should have a `category` field matching the selected category, and if a subcategory is
 * selected, the `subcategory` field should also match.
 * **Validates: Requirements 2.2, 2.4**
 */
describe('Property 2: Category and Subcategory Filtering Correctness', () => {
  it('filterByCategory returns only resources with matching category', () => {
    fc.assert(
      fc.property(resourcesArb, categoryArb, (resources, category) => {
        const filtered = filterByCategory(resources, category);

        // All returned resources must have the selected category
        for (const resource of filtered) {
          expect(resource.category).toBe(category);
        }

        // Count should match manual filter
        const expectedCount = resources.filter(
          r => r.category === category,
        ).length;
        expect(filtered.length).toBe(expectedCount);
      }),
      { numRuns: 100 },
    );
  });

  it('filterBySubcategory returns only resources with matching subcategory', () => {
    fc.assert(
      fc.property(resourcesArb, subcategoryArb, (resources, subcategory) => {
        const filtered = filterBySubcategory(resources, subcategory);

        // All returned resources must have the selected subcategory
        for (const resource of filtered) {
          expect(resource.subcategory).toBe(subcategory);
        }

        // Count should match manual filter
        const expectedCount = resources.filter(
          r => r.subcategory === subcategory,
        ).length;
        expect(filtered.length).toBe(expectedCount);
      }),
      { numRuns: 100 },
    );
  });

  it('filterByCategoryAndSubcategory returns only resources matching both', () => {
    fc.assert(
      fc.property(
        resourcesArb,
        categoryArb,
        subcategoryArb,
        (resources, category, subcategory) => {
          const filtered = filterByCategoryAndSubcategory(
            resources,
            category,
            subcategory,
          );

          // All returned resources must have both matching category and subcategory
          for (const resource of filtered) {
            expect(resource.category).toBe(category);
            expect(resource.subcategory).toBe(subcategory);
          }

          // Count should match manual filter
          const expectedCount = resources.filter(
            r => r.category === category && r.subcategory === subcategory,
          ).length;
          expect(filtered.length).toBe(expectedCount);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('filtering preserves resource data integrity', () => {
    fc.assert(
      fc.property(resourcesArb, categoryArb, (resources, category) => {
        const filtered = filterByCategory(resources, category);

        // Each filtered resource should be identical to its original
        for (const filteredResource of filtered) {
          const original = resources.find(r => r.id === filteredResource.id);
          expect(original).toBeDefined();
          expect(filteredResource).toEqual(original);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('filtering with non-existent category returns empty array', () => {
    fc.assert(
      fc.property(resourcesArb, resources => {
        const nonExistentCategory = 'non-existent-category-xyz';
        const filtered = filterByCategory(resources, nonExistentCategory);

        expect(filtered).toHaveLength(0);
      }),
      { numRuns: 100 },
    );
  });

  it('filtering empty array returns empty array', () => {
    fc.assert(
      fc.property(categoryArb, subcategoryArb, (category, subcategory) => {
        const emptyResources: Resource[] = [];

        expect(filterByCategory(emptyResources, category)).toHaveLength(0);
        expect(filterBySubcategory(emptyResources, subcategory)).toHaveLength(
          0,
        );
        expect(
          filterByCategoryAndSubcategory(emptyResources, category, subcategory),
        ).toHaveLength(0);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * **Feature: japanese-resources-library, Property 5: Multi-Filter Correctness**
 * For any combination of active filters (difficulty, priceType, platforms), all resources
 * returned should satisfy ALL active filter criteria simultaneously. A resource satisfies
 * a filter if its corresponding field matches (for single-value fields) or includes
 * (for array fields like platforms) at least one of the selected filter values.
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
 */
describe('Property 5: Multi-Filter Correctness', () => {
  // Arbitraries for filter selections
  const difficultiesFilterArb = fc.subarray([...DIFFICULTY_LEVELS], {
    minLength: 0,
    maxLength: DIFFICULTY_LEVELS.length,
  });
  const priceTypesFilterArb = fc.subarray([...PRICE_TYPES], {
    minLength: 0,
    maxLength: PRICE_TYPES.length,
  });
  const platformsFilterArb = fc.subarray([...PLATFORMS], {
    minLength: 0,
    maxLength: PLATFORMS.length,
  });

  const activeFiltersArb = fc.record({
    difficulty: difficultiesFilterArb,
    priceType: priceTypesFilterArb,
    platforms: platformsFilterArb,
    search: fc.constant(''),
  });

  it('filterByDifficulty returns only resources with matching difficulty', () => {
    fc.assert(
      fc.property(
        resourcesArb,
        difficultiesFilterArb,
        (resources, difficulties) => {
          const filtered = filterByDifficulty(resources, difficulties);

          if (difficulties.length === 0) {
            // Empty filter returns all resources
            expect(filtered.length).toBe(resources.length);
          } else {
            // All returned resources must have a difficulty in the filter
            for (const resource of filtered) {
              expect(difficulties).toContain(resource.difficulty);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('filterByPriceType returns only resources with matching price type', () => {
    fc.assert(
      fc.property(
        resourcesArb,
        priceTypesFilterArb,
        (resources, priceTypes) => {
          const filtered = filterByPriceType(resources, priceTypes);

          if (priceTypes.length === 0) {
            // Empty filter returns all resources
            expect(filtered.length).toBe(resources.length);
          } else {
            // All returned resources must have a priceType in the filter
            for (const resource of filtered) {
              expect(priceTypes).toContain(resource.priceType);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('filterByPlatform returns only resources with at least one matching platform', () => {
    fc.assert(
      fc.property(resourcesArb, platformsFilterArb, (resources, platforms) => {
        const filtered = filterByPlatform(resources, platforms);

        if (platforms.length === 0) {
          // Empty filter returns all resources
          expect(filtered.length).toBe(resources.length);
        } else {
          // All returned resources must have at least one platform in the filter
          for (const resource of filtered) {
            const hasMatchingPlatform = resource.platforms.some(p =>
              platforms.includes(p),
            );
            expect(hasMatchingPlatform).toBe(true);
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it('combineFilters returns resources satisfying ALL active filters', () => {
    fc.assert(
      fc.property(resourcesArb, activeFiltersArb, (resources, filters) => {
        const filtered = combineFilters(resources, filters);

        for (const resource of filtered) {
          // Check difficulty filter
          if (filters.difficulty.length > 0) {
            expect(filters.difficulty).toContain(resource.difficulty);
          }

          // Check priceType filter
          if (filters.priceType.length > 0) {
            expect(filters.priceType).toContain(resource.priceType);
          }

          // Check platforms filter
          if (filters.platforms.length > 0) {
            const hasMatchingPlatform = resource.platforms.some(p =>
              filters.platforms.includes(p),
            );
            expect(hasMatchingPlatform).toBe(true);
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it('combineFilters with empty filters returns all resources', () => {
    fc.assert(
      fc.property(resourcesArb, resources => {
        const emptyFilters = {
          difficulty: [],
          priceType: [],
          platforms: [],
          search: '',
        };

        const filtered = combineFilters(resources, emptyFilters);
        expect(filtered.length).toBe(resources.length);
      }),
      { numRuns: 100 },
    );
  });

  it('combineFilters result is subset of individual filter results', () => {
    fc.assert(
      fc.property(resourcesArb, activeFiltersArb, (resources, filters) => {
        const combined = combineFilters(resources, filters);
        const byDifficulty = filterByDifficulty(resources, filters.difficulty);
        const byPriceType = filterByPriceType(resources, filters.priceType);
        const byPlatform = filterByPlatform(resources, filters.platforms);

        // Combined result should be subset of each individual filter result
        for (const resource of combined) {
          expect(byDifficulty).toContainEqual(resource);
          expect(byPriceType).toContainEqual(resource);
          expect(byPlatform).toContainEqual(resource);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('filter order does not affect result', () => {
    fc.assert(
      fc.property(resourcesArb, activeFiltersArb, (resources, filters) => {
        // Apply filters in different orders
        const order1 = filterByPlatform(
          filterByPriceType(
            filterByDifficulty(resources, filters.difficulty),
            filters.priceType,
          ),
          filters.platforms,
        );

        const order2 = filterByDifficulty(
          filterByPlatform(
            filterByPriceType(resources, filters.priceType),
            filters.platforms,
          ),
          filters.difficulty,
        );

        const combined = combineFilters(resources, filters);

        // All orders should produce the same result
        expect(order1.length).toBe(combined.length);
        expect(order2.length).toBe(combined.length);

        // Same resources should be present
        const combinedIds = new Set(combined.map(r => r.id));
        const order1Ids = new Set(order1.map(r => r.id));
        const order2Ids = new Set(order2.map(r => r.id));

        expect(order1Ids).toEqual(combinedIds);
        expect(order2Ids).toEqual(combinedIds);
      }),
      { numRuns: 100 },
    );
  });
});
