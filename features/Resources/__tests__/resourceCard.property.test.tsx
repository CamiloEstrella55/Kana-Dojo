/**
 * Property Test: Resource Card Rendering Completeness
 *
 * **Feature: japanese-resources-library, Property 1: Resource Card Rendering Completeness**
 * For any resource in the data, when rendered as a ResourceCard component, the output
 * should contain the resource name, description, category, difficulty level, price type,
 * and at least one platform indicator.
 *
 * **Validates: Requirements 1.3**
 */
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { render, cleanup } from '@testing-library/react';
import { ResourceCard } from '../components/ResourceCard';
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
const platformsArb = fc.array(platformArb, { minLength: 1, maxLength: 3 });
const urlArb = fc.webUrl().filter(url => url.length > 0);

// Generate a complete valid resource object with unique values
const resourceArb: fc.Arbitrary<Resource> = fc.record({
  id: uniqueStringArb,
  name: uniqueStringArb,
  description: uniqueStringArb,
  category: categoryArb,
  subcategory: subcategoryArb,
  tags: tagsArb,
  difficulty: difficultyArb,
  priceType: priceTypeArb,
  platforms: platformsArb,
  url: urlArb,
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
 * Format category ID to display name
 */
function formatCategoryName(categoryId: string): string {
  const names: Record<string, string> = {
    apps: 'Apps',
    websites: 'Websites',
    textbooks: 'Textbooks',
    youtube: 'YouTube',
    podcasts: 'Podcasts',
    games: 'Games',
    jlpt: 'JLPT',
    reading: 'Reading',
    listening: 'Listening',
    speaking: 'Speaking',
    writing: 'Writing',
    grammar: 'Grammar',
    vocabulary: 'Vocabulary',
    kanji: 'Kanji',
    immersion: 'Immersion',
    community: 'Community',
  };
  return names[categoryId] || categoryId;
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Property 1: Resource Card Rendering Completeness', () => {
  it('renders all required elements: name, description, category, difficulty, price, and platforms', () => {
    fc.assert(
      fc.property(resourceArb, resource => {
        const { container } = render(<ResourceCard resource={resource} />);

        const html = container.innerHTML;

        // Resource name should be present
        expect(html).toContain(resource.name);

        // Resource description should be present
        expect(html).toContain(resource.description);

        // Category badge should be present with formatted name
        const categoryName = formatCategoryName(resource.category);
        expect(html).toContain(categoryName);

        // Difficulty badge should be present with formatted label
        const difficultyLabel = getDifficultyLabel(resource.difficulty);
        expect(html).toContain(difficultyLabel);

        // Price type badge should be present with formatted label
        const priceLabel = getPriceLabel(resource.priceType);
        expect(html).toContain(priceLabel);

        // Platform section should exist if platforms are present
        if (resource.platforms.length > 0) {
          expect(html).toContain('Available on:');
        }

        // Clean up
        cleanup();
      }),
      { numRuns: 25 },
    );
  });

  it('card has proper aria-label for accessibility', () => {
    fc.assert(
      fc.property(resourceArb, resource => {
        const { container } = render(<ResourceCard resource={resource} />);

        const card = container.querySelector('article');
        const ariaLabel = card?.getAttribute('aria-label');

        // Card should have aria-label containing name and description
        expect(ariaLabel).toBeDefined();
        expect(ariaLabel).toContain(resource.name);
        expect(ariaLabel).toContain(resource.description);

        // Clean up
        cleanup();
      }),
      { numRuns: 25 },
    );
  });

  it('card has proper role and tabindex for keyboard navigation', () => {
    fc.assert(
      fc.property(resourceArb, resource => {
        const { container } = render(<ResourceCard resource={resource} />);

        const card = container.querySelector('article');

        // Card should have button role
        expect(card?.getAttribute('role')).toBe('button');

        // Card should be focusable
        expect(card?.getAttribute('tabindex')).toBe('0');

        // Clean up
        cleanup();
      }),
      { numRuns: 100 },
    );
  });
});
