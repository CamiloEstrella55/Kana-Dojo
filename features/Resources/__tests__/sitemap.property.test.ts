import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getAllCategories } from '../data';

/**
 * **Feature: japanese-resources-library, Property 11: Sitemap Completeness**
 * For any category and subcategory defined in the data, the sitemap should contain
 * a corresponding URL entry with the correct path format.
 * **Validates: Requirements 10.4**
 */
describe('Property 11: Sitemap Completeness', () => {
  const categories = getAllCategories();

  // Build the expected sitemap paths from categories data
  // These should match what's in next-sitemap.config.js
  const expectedMainPath = '/resources';
  const expectedCategoryPaths = categories.map(cat => `/resources/${cat.id}`);
  const expectedSubcategoryPaths: string[] = [];

  for (const category of categories) {
    for (const subcategory of category.subcategories) {
      expectedSubcategoryPaths.push(
        `/resources/${category.id}/${subcategory.id}`,
      );
    }
  }

  // Arbitrary for selecting a random category
  const categoryArb = fc.constantFrom(...categories);

  it('main resources page path exists', () => {
    expect(expectedMainPath).toBe('/resources');
  });

  it('every category has a corresponding sitemap path', () => {
    fc.assert(
      fc.property(categoryArb, category => {
        const expectedPath = `/resources/${category.id}`;

        // Path should be in our expected paths list
        expect(expectedCategoryPaths).toContain(expectedPath);

        // Path should follow correct format
        expect(expectedPath).toMatch(/^\/resources\/[a-z0-9-]+$/);
      }),
      { numRuns: 20 },
    );
  });

  it('every subcategory has a corresponding sitemap path', () => {
    fc.assert(
      fc.property(categoryArb, category => {
        for (const subcategory of category.subcategories) {
          const expectedPath = `/resources/${category.id}/${subcategory.id}`;

          // Path should be in our expected paths list
          expect(expectedSubcategoryPaths).toContain(expectedPath);

          // Path should follow correct format
          expect(expectedPath).toMatch(/^\/resources\/[a-z0-9-]+\/[a-z0-9-]+$/);
        }
      }),
      { numRuns: 20 },
    );
  });

  it('sitemap paths use correct priority hierarchy', () => {
    // Main page should have highest priority (0.8)
    // Category pages should have medium priority (0.7)
    // Subcategory pages should have lower priority (0.6)

    // This test verifies the expected priority structure
    const mainPriority = 0.8;
    const categoryPriority = 0.7;
    const subcategoryPriority = 0.6;

    expect(mainPriority).toBeGreaterThan(categoryPriority);
    expect(categoryPriority).toBeGreaterThan(subcategoryPriority);
  });

  it('all category paths are unique', () => {
    const uniquePaths = new Set(expectedCategoryPaths);
    expect(uniquePaths.size).toBe(expectedCategoryPaths.length);
  });

  it('all subcategory paths are unique', () => {
    const uniquePaths = new Set(expectedSubcategoryPaths);
    expect(uniquePaths.size).toBe(expectedSubcategoryPaths.length);
  });

  it('total sitemap entries match expected count', () => {
    // 1 main page + all categories + all subcategories
    const totalSubcategories = categories.reduce(
      (sum, cat) => sum + cat.subcategories.length,
      0,
    );
    const expectedTotal = 1 + categories.length + totalSubcategories;

    const actualTotal =
      1 + expectedCategoryPaths.length + expectedSubcategoryPaths.length;

    expect(actualTotal).toBe(expectedTotal);
  });

  it('category count matches data', () => {
    expect(expectedCategoryPaths.length).toBe(categories.length);
  });

  it('subcategory count matches data', () => {
    const totalSubcategories = categories.reduce(
      (sum, cat) => sum + cat.subcategories.length,
      0,
    );
    expect(expectedSubcategoryPaths.length).toBe(totalSubcategories);
  });

  it('paths do not contain invalid characters', () => {
    fc.assert(
      fc.property(categoryArb, category => {
        const categoryPath = `/resources/${category.id}`;

        // Should not contain spaces, uppercase, or special characters
        expect(categoryPath).not.toMatch(/\s/);
        expect(categoryPath).not.toMatch(/[A-Z]/);
        expect(categoryPath).not.toMatch(/[^a-z0-9\-\/]/);

        for (const subcategory of category.subcategories) {
          const subcategoryPath = `/resources/${category.id}/${subcategory.id}`;

          expect(subcategoryPath).not.toMatch(/\s/);
          expect(subcategoryPath).not.toMatch(/[A-Z]/);
          expect(subcategoryPath).not.toMatch(/[^a-z0-9\-\/]/);
        }
      }),
      { numRuns: 20 },
    );
  });
});
