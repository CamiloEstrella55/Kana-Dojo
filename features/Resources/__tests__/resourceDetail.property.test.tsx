/**
 * Property Test: Resource Detail Completeness
 *
 * **Feature: japanese-resources-library, Property 6: Resource Detail Completeness**
 * For any resource displayed in the detail view, the rendered output should include:
 * full description (or descriptionLong if available), all tags, difficulty level,
 * price type, all platforms, the external URL, and notes if present.
 *
 * **Validates: Requirements 5.2**
 */
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { render, cleanup, screen } from '@testing-library/react';
import { ResourceDetailModal } from '../components/ResourceDetailModal';
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

// Clean up after each test
afterEach(() => {
  cleanup();
  // Clean up any portal content
  document.body.innerHTML = '';
});

// ============================================================================
// Arbitraries for generating valid resource values
// ============================================================================

const categoryArb: fc.Arbitrary<CategoryId> = fc.constantFrom(...CATEGORY_IDS);
const difficultyArb: fc.Arbitrary<DifficultyLevel> = fc.constantFrom(
  ...DIFFICULTY_LEVELS,
);
const priceTypeArb: fc.Arbitrary<PriceType> = fc.constantFrom(...PRICE_TYPES);
const platformArb: fc.Arbitrary<Platform> = fc.constantFrom(...PLATFORMS);

// Generate unique strings to avoid collision issues
const uniqueStringArb = fc.uuid().map(uuid => `test-${uuid.slice(0, 8)}`);

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

const tagsArb = fc.array(uniqueStringArb, { minLength: 1, maxLength: 3 });
// Use unique platforms to avoid duplicate key warnings
const platformsArb = fc
  .subarray([...PLATFORMS], { minLength: 1, maxLength: 5 })
  .filter(arr => arr.length > 0);
const urlArb = fc.webUrl().filter(url => url.length > 0);

// Generate a complete valid resource object with unique values
const resourceArb: fc.Arbitrary<Resource> = fc.record({
  id: uniqueStringArb,
  name: uniqueStringArb,
  description: uniqueStringArb,
  descriptionLong: fc.option(uniqueStringArb, { nil: undefined }),
  category: categoryArb,
  subcategory: subcategoryArb,
  tags: tagsArb,
  difficulty: difficultyArb,
  priceType: priceTypeArb,
  priceDetails: fc.option(uniqueStringArb, { nil: undefined }),
  platforms: platformsArb,
  url: urlArb,
  notes: fc.option(uniqueStringArb, { nil: undefined }),
});

// ============================================================================
// Helper functions
// ============================================================================

/**
 * Get display text for difficulty level
 */
function getDifficultyLabel(difficulty: DifficultyLevel): string {
  const labels: Record<DifficultyLevel, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    'all-levels': 'All Levels',
  };
  return labels[difficulty];
}

/**
 * Get display text for price type
 */
function getPriceLabel(priceType: PriceType): string {
  const labels: Record<PriceType, string> = {
    free: 'Free',
    freemium: 'Freemium',
    paid: 'Paid',
    subscription: 'Subscription',
  };
  return labels[priceType];
}

/**
 * Get display text for platform
 */
function getPlatformLabel(platform: Platform): string {
  const labels: Record<Platform, string> = {
    web: 'Web',
    ios: 'iOS',
    android: 'Android',
    windows: 'Windows',
    macos: 'macOS',
    linux: 'Linux',
    physical: 'Physical',
    'browser-extension': 'Browser Extension',
    api: 'API',
  };
  return labels[platform];
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Property 6: Resource Detail Completeness', () => {
  it('renders full description (or descriptionLong if available)', () => {
    fc.assert(
      fc.property(resourceArb, resource => {
        render(
          <ResourceDetailModal
            resource={resource}
            isOpen={true}
            onClose={() => {}}
          />,
        );

        // Dialog renders in a portal, so we need to query document.body
        const html = document.body.innerHTML;
        const expectedDescription =
          resource.descriptionLong || resource.description;

        // Description should be present
        expect(html).toContain(expectedDescription);

        cleanup();
        document.body.innerHTML = '';
      }),
      { numRuns: 20 },
    );
  }, 30000);

  it('renders all tags', () => {
    fc.assert(
      fc.property(resourceArb, resource => {
        render(
          <ResourceDetailModal
            resource={resource}
            isOpen={true}
            onClose={() => {}}
          />,
        );

        // Dialog renders in a portal, so we need to query document.body
        const html = document.body.innerHTML;

        // All tags should be present
        for (const tag of resource.tags) {
          expect(html).toContain(tag);
        }

        cleanup();
        document.body.innerHTML = '';
      }),
      { numRuns: 20 },
    );
  });

  it('renders difficulty level', () => {
    fc.assert(
      fc.property(resourceArb, resource => {
        render(
          <ResourceDetailModal
            resource={resource}
            isOpen={true}
            onClose={() => {}}
          />,
        );

        // Dialog renders in a portal, so we need to query document.body
        const html = document.body.innerHTML;
        const difficultyLabel = getDifficultyLabel(resource.difficulty);

        // Difficulty label should be present
        expect(html).toContain(difficultyLabel);

        cleanup();
        document.body.innerHTML = '';
      }),
      { numRuns: 20 },
    );
  });

  it('renders price type', () => {
    fc.assert(
      fc.property(resourceArb, resource => {
        render(
          <ResourceDetailModal
            resource={resource}
            isOpen={true}
            onClose={() => {}}
          />,
        );

        // Dialog renders in a portal, so we need to query document.body
        const html = document.body.innerHTML;
        const priceLabel = getPriceLabel(resource.priceType);

        // Price label should be present
        expect(html).toContain(priceLabel);

        cleanup();
        document.body.innerHTML = '';
      }),
      { numRuns: 20 },
    );
  });

  it('renders all platforms', () => {
    fc.assert(
      fc.property(resourceArb, resource => {
        render(
          <ResourceDetailModal
            resource={resource}
            isOpen={true}
            onClose={() => {}}
          />,
        );

        // Dialog renders in a portal, so we need to query document.body
        const html = document.body.innerHTML;

        // All platform labels should be present
        for (const platform of resource.platforms) {
          const platformLabel = getPlatformLabel(platform);
          expect(html).toContain(platformLabel);
        }

        cleanup();
        document.body.innerHTML = '';
      }),
      { numRuns: 20 },
    );
  });

  it('renders external URL in CTA button', () => {
    fc.assert(
      fc.property(resourceArb, resource => {
        render(
          <ResourceDetailModal
            resource={resource}
            isOpen={true}
            onClose={() => {}}
          />,
        );

        // Dialog renders in a portal, so we need to query document.body
        const html = document.body.innerHTML;

        // URL should be present in an anchor tag
        // Note: HTML encodes special characters like & to &amp;
        const encodedUrl = resource.url.replace(/&/g, '&amp;');
        expect(html).toContain(`href="${encodedUrl}"`);

        cleanup();
        document.body.innerHTML = '';
      }),
      { numRuns: 20 },
    );
  });

  it('renders notes if present', () => {
    // Generate resources that always have notes
    const resourceWithNotesArb = resourceArb.map(r => ({
      ...r,
      notes: `notes-${r.id}`,
    }));

    fc.assert(
      fc.property(resourceWithNotesArb, resource => {
        render(
          <ResourceDetailModal
            resource={resource}
            isOpen={true}
            onClose={() => {}}
          />,
        );

        // Dialog renders in a portal, so we need to query document.body
        const html = document.body.innerHTML;

        // Notes should be present
        expect(html).toContain(resource.notes);

        cleanup();
        document.body.innerHTML = '';
      }),
      { numRuns: 20 },
    );
  });
});
