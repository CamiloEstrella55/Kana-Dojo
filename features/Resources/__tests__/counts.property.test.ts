import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  getCategoryResourceCounts,
  getSubcategoryResourceCounts,
  getResourceCountForCategory,
  getResourceCountForSubcategory,
  enrichCategoriesWithCounts,
  getTotalResourceCount,
  validateCategoryCounts,
} from '../lib/counts';
import {
  CATEGORY_IDS,
  DIFFICULTY_LEVELS,
  PRICE_TYPES,
  PLATFORMS,
  type Resource,
  type Category,
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

// Generate a simple category for testing
const simpleCategoryArb: fc.Arbitrary<Category> = fc.record({
  id: categoryArb,
  name: nonEmptyStringArb,
  nameJa: nonEmptyStringArb,
  description: nonEmptyStringArb,
  descriptionLong: nonEmptyStringArb,
  icon: fc.constant('book'),
  subcategories: fc.array(
    fc.record({
      id: subcategoryArb,
      name: nonEmptyStringArb,
      nameJa: nonEmptyStringArb,
      description: nonEmptyStringArb,
      descriptionLong: nonEmptyStringArb,
      parentCategory: categoryArb,
    }),
    { minLength: 1, maxLength: 5 },
  ),
  order: fc.integer({ min: 0, max: 100 }),
});

const categoriesArb = fc.array(simpleCategoryArb, {
  minLength: 1,
  maxLength: 5,
});

/**
 * **Feature: japanese-resources-library, Property 3: Category Resource Count Accuracy**
 * For any category in the navigation, the displayed resource count should equal
 * the actual count of resources in the data that belong to that category.
 * **Validates: Requirements 2.5**
 */
describe('Property 3: Category Resource Count Accuracy', () => {
  it('getCategoryResourceCounts returns accurate counts for each category', () => {
    fc.assert(
      fc.property(resourcesArb, resources => {
        const counts = getCategoryResourceCounts(resources);

        // Verify each category count
        for (const [categoryId, count] of counts) {
          const actualCount = resources.filter(
            r => r.category === categoryId,
          ).length;
          expect(count).toBe(actualCount);
        }

        // Verify total equals sum of all counts
        let totalFromCounts = 0;
        for (const count of counts.values()) {
          totalFromCounts += count;
        }
        expect(totalFromCounts).toBe(resources.length);
      }),
      { numRuns: 100 },
    );
  });

  it('getSubcategoryResourceCounts returns accurate counts for each subcategory', () => {
    fc.assert(
      fc.property(resourcesArb, categoryArb, (resources, categoryId) => {
        const counts = getSubcategoryResourceCounts(resources, categoryId);

        // Verify each subcategory count
        for (const [subcategoryId, count] of counts) {
          const actualCount = resources.filter(
            r => r.category === categoryId && r.subcategory === subcategoryId,
          ).length;
          expect(count).toBe(actualCount);
        }

        // Verify total equals category count
        let totalFromCounts = 0;
        for (const count of counts.values()) {
          totalFromCounts += count;
        }
        const categoryCount = resources.filter(
          r => r.category === categoryId,
        ).length;
        expect(totalFromCounts).toBe(categoryCount);
      }),
      { numRuns: 100 },
    );
  });

  it('getResourceCountForCategory matches manual count', () => {
    fc.assert(
      fc.property(resourcesArb, categoryArb, (resources, categoryId) => {
        const count = getResourceCountForCategory(resources, categoryId);
        const manualCount = resources.filter(
          r => r.category === categoryId,
        ).length;

        expect(count).toBe(manualCount);
      }),
      { numRuns: 100 },
    );
  });

  it('getResourceCountForSubcategory matches manual count', () => {
    fc.assert(
      fc.property(
        resourcesArb,
        categoryArb,
        subcategoryArb,
        (resources, categoryId, subcategoryId) => {
          const count = getResourceCountForSubcategory(
            resources,
            categoryId,
            subcategoryId,
          );
          const manualCount = resources.filter(
            r => r.category === categoryId && r.subcategory === subcategoryId,
          ).length;

          expect(count).toBe(manualCount);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('enrichCategoriesWithCounts produces accurate counts', () => {
    fc.assert(
      fc.property(categoriesArb, resourcesArb, (categories, resources) => {
        const enriched = enrichCategoriesWithCounts(categories, resources);

        for (const category of enriched) {
          // Verify category count
          const actualCategoryCount = resources.filter(
            r => r.category === category.id,
          ).length;
          expect(category.resourceCount).toBe(actualCategoryCount);

          // Verify subcategory counts
          for (const subcategory of category.subcategoriesWithCount) {
            const actualSubCount = resources.filter(
              r =>
                r.category === category.id && r.subcategory === subcategory.id,
            ).length;
            expect(subcategory.resourceCount).toBe(actualSubCount);
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it('validateCategoryCounts returns true for correctly enriched categories', () => {
    fc.assert(
      fc.property(categoriesArb, resourcesArb, (categories, resources) => {
        const enriched = enrichCategoriesWithCounts(categories, resources);
        const isValid = validateCategoryCounts(enriched, resources);

        expect(isValid).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('getTotalResourceCount equals resources array length', () => {
    fc.assert(
      fc.property(resourcesArb, resources => {
        const total = getTotalResourceCount(resources);
        expect(total).toBe(resources.length);
      }),
      { numRuns: 100 },
    );
  });

  it('sum of all category counts equals total resource count', () => {
    fc.assert(
      fc.property(resourcesArb, resources => {
        const counts = getCategoryResourceCounts(resources);
        let sum = 0;
        for (const count of counts.values()) {
          sum += count;
        }

        expect(sum).toBe(resources.length);
      }),
      { numRuns: 100 },
    );
  });

  it('empty resources array produces zero counts', () => {
    fc.assert(
      fc.property(categoryArb, subcategoryArb, (categoryId, subcategoryId) => {
        const emptyResources: Resource[] = [];

        const categoryCounts = getCategoryResourceCounts(emptyResources);
        const subcategoryCounts = getSubcategoryResourceCounts(
          emptyResources,
          categoryId,
        );
        const categoryCount = getResourceCountForCategory(
          emptyResources,
          categoryId,
        );
        const subcategoryCount = getResourceCountForSubcategory(
          emptyResources,
          categoryId,
          subcategoryId,
        );
        const total = getTotalResourceCount(emptyResources);

        expect(categoryCounts.size).toBe(0);
        expect(subcategoryCounts.size).toBe(0);
        expect(categoryCount).toBe(0);
        expect(subcategoryCount).toBe(0);
        expect(total).toBe(0);
      }),
      { numRuns: 100 },
    );
  });
});
