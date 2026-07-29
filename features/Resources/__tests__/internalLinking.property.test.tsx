/**
 * Property Test: Internal Linking Presence
 *
 * **Feature: japanese-resources-library, Property 14: Internal Linking Presence**
 * For any category page, there should be at least one internal link to a related
 * category or the main resources page.
 *
 * **Validates: Requirements 10.11**
 */
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { render, cleanup } from '@testing-library/react';
import {
  RelatedCategories,
  getRelatedCategories,
} from '../components/RelatedCategories';
import {
  CATEGORY_IDS,
  type Category,
  type CategoryId,
  type CategoryWithCount,
} from '../types';

// Clean up after each test
afterEach(() => {
  cleanup();
});

// ============================================================================
// Arbitraries for generating valid category values
// ============================================================================

const categoryIdArb: fc.Arbitrary<CategoryId> = fc.constantFrom(
  ...CATEGORY_IDS,
);

// Generate unique strings to avoid collision issues
const uniqueStringArb = fc.uuid().map(uuid => `test-${uuid.slice(0, 8)}`);

// Generate a complete valid category object with unique values
const categoryArb: fc.Arbitrary<Category> = fc.record({
  id: categoryIdArb,
  name: uniqueStringArb,
  nameJa: uniqueStringArb,
  description: uniqueStringArb,
  descriptionLong: uniqueStringArb,
  icon: fc.constantFrom('book', 'app', 'video', 'headphones', 'gamepad'),
  subcategories: fc.constant([]),
  order: fc.integer({ min: 1, max: 20 }),
});

// Generate a category with count
const categoryWithCountArb: fc.Arbitrary<CategoryWithCount> = categoryArb.chain(
  category =>
    fc
      .record({
        ...Object.fromEntries(
          Object.entries(category).map(([k, v]) => [k, fc.constant(v)]),
        ),
        resourceCount: fc.integer({ min: 0, max: 500 }),
        subcategoriesWithCount: fc.constant(
          [] as CategoryWithCount['subcategoriesWithCount'],
        ),
      })
      .map(obj => obj as unknown as CategoryWithCount),
);

// Generate a list of all categories with counts (one for each category ID)
const allCategoriesArb: fc.Arbitrary<CategoryWithCount[]> = fc
  .tuple(
    ...CATEGORY_IDS.map(id =>
      fc.record({
        id: fc.constant(id),
        name: uniqueStringArb,
        nameJa: uniqueStringArb,
        description: uniqueStringArb,
        descriptionLong: uniqueStringArb,
        icon: fc.constantFrom('book', 'app', 'video', 'headphones', 'gamepad'),
        subcategories: fc.constant([] as Category['subcategories']),
        order: fc.integer({ min: 1, max: 20 }),
        resourceCount: fc.integer({ min: 1, max: 500 }),
        subcategoriesWithCount: fc.constant(
          [] as CategoryWithCount['subcategoriesWithCount'],
        ),
      }),
    ),
  )
  .map(categories => categories as unknown as CategoryWithCount[]);

// ============================================================================
// Property Tests
// ============================================================================

describe('Property 14: Internal Linking Presence', () => {
  it('getRelatedCategories returns related categories for any valid category', () => {
    fc.assert(
      fc.property(allCategoriesArb, allCategories => {
        // For each category, check that related categories are returned
        for (const category of allCategories) {
          const related = getRelatedCategories(category.id, allCategories);

          // Should return an array
          expect(Array.isArray(related)).toBe(true);

          // Related categories should not include the current category
          expect(related.every(r => r.id !== category.id)).toBe(true);

          // All returned categories should be valid CategoryWithCount objects
          for (const relatedCat of related) {
            expect(relatedCat).toHaveProperty('id');
            expect(relatedCat).toHaveProperty('name');
            expect(relatedCat).toHaveProperty('resourceCount');
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it('RelatedCategories component renders at least one internal link for any category', () => {
    fc.assert(
      fc.property(allCategoriesArb, allCategories => {
        // Test only a subset of categories to avoid timeout
        const categoriesToTest = allCategories.slice(0, 3);

        for (const currentCategory of categoriesToTest) {
          const { container } = render(
            <RelatedCategories
              currentCategory={currentCategory}
              allCategories={allCategories}
              basePath='/en/resources'
            />,
          );

          const html = container.innerHTML;

          // Should contain at least one link (either to related category or main resources page)
          const hasRelatedLinks = html.includes('href="/en/resources/');
          const hasMainLink = html.includes('href="/en/resources"');

          // At least one type of internal link should be present
          expect(hasRelatedLinks || hasMainLink).toBe(true);

          cleanup();
        }
      }),
      { numRuns: 50 },
    );
  });

  it('RelatedCategories component always includes link back to main resources page', () => {
    fc.assert(
      fc.property(allCategoriesArb, allCategories => {
        // Test a subset of categories to keep test fast
        const categoriesToTest = allCategories.slice(0, 5);

        for (const currentCategory of categoriesToTest) {
          const { container } = render(
            <RelatedCategories
              currentCategory={currentCategory}
              allCategories={allCategories}
              basePath='/en/resources'
            />,
          );

          const html = container.innerHTML;

          // Should always have a link back to main resources page
          // The component includes "View all categories" link
          expect(html).toContain('View all categories');
          expect(html).toContain('href="/en/resources"');

          cleanup();
        }
      }),
      { numRuns: 50 },
    );
  });

  it('RelatedCategories renders correct href for related category links', () => {
    fc.assert(
      fc.property(allCategoriesArb, allCategories => {
        // Test a subset of categories
        const categoriesToTest = allCategories.slice(0, 3);

        for (const currentCategory of categoriesToTest) {
          const related = getRelatedCategories(
            currentCategory.id,
            allCategories,
          );

          if (related.length > 0) {
            const { container } = render(
              <RelatedCategories
                currentCategory={currentCategory}
                allCategories={allCategories}
                basePath='/en/resources'
              />,
            );

            const html = container.innerHTML;

            // Each related category should have a proper link
            for (const relatedCat of related) {
              expect(html).toContain(`href="/en/resources/${relatedCat.id}"`);
            }

            cleanup();
          }
        }
      }),
      { numRuns: 50 },
    );
  });

  it('RelatedCategories displays resource count for each related category', () => {
    fc.assert(
      fc.property(allCategoriesArb, allCategories => {
        // Test a subset of categories
        const categoriesToTest = allCategories.slice(0, 3);

        for (const currentCategory of categoriesToTest) {
          const related = getRelatedCategories(
            currentCategory.id,
            allCategories,
          );

          if (related.length > 0) {
            const { container } = render(
              <RelatedCategories
                currentCategory={currentCategory}
                allCategories={allCategories}
                basePath='/en/resources'
              />,
            );

            const html = container.innerHTML;

            // Each related category should show its resource count
            for (const relatedCat of related) {
              expect(html).toContain(`${relatedCat.resourceCount} resources`);
            }

            cleanup();
          }
        }
      }),
      { numRuns: 50 },
    );
  });

  it('RelatedCategories limits the number of related categories shown', () => {
    fc.assert(
      fc.property(allCategoriesArb, allCategories => {
        for (const currentCategory of allCategories) {
          const related = getRelatedCategories(
            currentCategory.id,
            allCategories,
            3,
          );

          // Should return at most 3 related categories (default limit)
          expect(related.length).toBeLessThanOrEqual(3);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('getRelatedCategories respects custom limit parameter', () => {
    fc.assert(
      fc.property(
        allCategoriesArb,
        fc.integer({ min: 1, max: 10 }),
        (allCategories, limit) => {
          for (const currentCategory of allCategories) {
            const related = getRelatedCategories(
              currentCategory.id,
              allCategories,
              limit,
            );

            // Should return at most the specified limit
            expect(related.length).toBeLessThanOrEqual(limit);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
