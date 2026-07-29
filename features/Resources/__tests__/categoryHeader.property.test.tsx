/**
 * Property Test: Category Content Presence
 *
 * **Feature: japanese-resources-library, Property 15: Category Content Presence**
 * For any category in the data, when rendered as a CategoryHeader component, the output
 * should contain the category name, description, resource count, and long-form SEO content.
 *
 * **Validates: Requirements 10.12**
 */
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { render, cleanup } from '@testing-library/react';
import { CategoryHeader } from '../components/CategoryHeader';
import { CATEGORY_IDS, type Category, type CategoryId } from '../types';

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

// Generate resource count
const resourceCountArb = fc.integer({ min: 0, max: 500 });

// ============================================================================
// Property Tests
// ============================================================================

describe('Property 15: Category Content Presence', () => {
  it('renders category name in the header', () => {
    fc.assert(
      fc.property(categoryArb, resourceCountArb, (category, resourceCount) => {
        const { container } = render(
          <CategoryHeader category={category} resourceCount={resourceCount} />,
        );

        const html = container.innerHTML;

        // Category name should be present
        expect(html).toContain(category.name);

        // Clean up
        cleanup();
      }),
      { numRuns: 100 },
    );
  });

  it('renders Japanese name when provided', () => {
    fc.assert(
      fc.property(categoryArb, resourceCountArb, (category, resourceCount) => {
        const { container } = render(
          <CategoryHeader category={category} resourceCount={resourceCount} />,
        );

        const html = container.innerHTML;

        // Japanese name should be present
        expect(html).toContain(category.nameJa);

        // Clean up
        cleanup();
      }),
      { numRuns: 100 },
    );
  });

  it('renders category description', () => {
    fc.assert(
      fc.property(categoryArb, resourceCountArb, (category, resourceCount) => {
        const { container } = render(
          <CategoryHeader category={category} resourceCount={resourceCount} />,
        );

        const html = container.innerHTML;

        // Description should be present
        expect(html).toContain(category.description);

        // Clean up
        cleanup();
      }),
      { numRuns: 100 },
    );
  });

  it('renders resource count', () => {
    fc.assert(
      fc.property(categoryArb, resourceCountArb, (category, resourceCount) => {
        const { container } = render(
          <CategoryHeader category={category} resourceCount={resourceCount} />,
        );

        const html = container.innerHTML;

        // Resource count should be present
        expect(html).toContain(String(resourceCount));

        // Clean up
        cleanup();
      }),
      { numRuns: 100 },
    );
  });

  it('renders long-form SEO content when showLongDescription is true', () => {
    fc.assert(
      fc.property(categoryArb, resourceCountArb, (category, resourceCount) => {
        const { container } = render(
          <CategoryHeader
            category={category}
            resourceCount={resourceCount}
            showLongDescription={true}
          />,
        );

        const html = container.innerHTML;

        // Long description should be present
        expect(html).toContain(category.descriptionLong);

        // Clean up
        cleanup();
      }),
      { numRuns: 100 },
    );
  });

  it('does not render long-form content when showLongDescription is false', () => {
    fc.assert(
      fc.property(categoryArb, resourceCountArb, (category, resourceCount) => {
        const { container } = render(
          <CategoryHeader
            category={category}
            resourceCount={resourceCount}
            showLongDescription={false}
          />,
        );

        const html = container.innerHTML;

        // Long description should NOT be present
        expect(html).not.toContain(category.descriptionLong);

        // Clean up
        cleanup();
      }),
      { numRuns: 100 },
    );
  });

  it('displays correct singular/plural resource text', () => {
    fc.assert(
      fc.property(categoryArb, category => {
        // Test with count of 1
        const { container: container1 } = render(
          <CategoryHeader category={category} resourceCount={1} />,
        );
        expect(container1.innerHTML).toContain('1 resource');
        cleanup();

        // Test with count of 0
        const { container: container0 } = render(
          <CategoryHeader category={category} resourceCount={0} />,
        );
        expect(container0.innerHTML).toContain('0 resources');
        cleanup();

        // Test with count > 1
        const { container: containerMany } = render(
          <CategoryHeader category={category} resourceCount={5} />,
        );
        expect(containerMany.innerHTML).toContain('5 resources');
        cleanup();
      }),
      { numRuns: 50 },
    );
  });
});
