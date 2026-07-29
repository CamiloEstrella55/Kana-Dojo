import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { searchResources, resourceMatchesQuery } from '../lib/search';
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

// Generate a search query (non-empty string)
const searchQueryArb = fc
  .string({ minLength: 1, maxLength: 20 })
  .filter(s => s.trim().length > 0);

/**
 * **Feature: japanese-resources-library, Property 4: Search Result Relevance**
 * For any non-empty search query, all resources returned by the search function
 * should contain the query string (case-insensitive) in at least one of:
 * name, description, or tags array.
 * **Validates: Requirements 3.2**
 */
describe('Property 4: Search Result Relevance', () => {
  it('all search results contain the query in name, description, or tags', () => {
    fc.assert(
      fc.property(resourcesArb, searchQueryArb, (resources, query) => {
        const results = searchResources(resources, query);
        // The implementation trims the query, so we must do the same for validation
        const lowerQuery = query.trim().toLowerCase();

        // If query is empty after trimming, all resources are returned (no validation needed)
        if (lowerQuery.length === 0) {
          expect(results.length).toBe(resources.length);
          return;
        }

        for (const resource of results) {
          const nameMatch = resource.name.toLowerCase().includes(lowerQuery);
          const nameJaMatch = resource.nameJa
            ? resource.nameJa.toLowerCase().includes(lowerQuery)
            : false;
          const descMatch = resource.description
            .toLowerCase()
            .includes(lowerQuery);
          const descLongMatch = resource.descriptionLong
            ? resource.descriptionLong.toLowerCase().includes(lowerQuery)
            : false;
          const tagsMatch = resource.tags.some(tag =>
            tag.toLowerCase().includes(lowerQuery),
          );

          const hasMatch =
            nameMatch || nameJaMatch || descMatch || descLongMatch || tagsMatch;
          expect(hasMatch).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('search is case-insensitive', () => {
    fc.assert(
      fc.property(resourcesArb, searchQueryArb, (resources, query) => {
        const lowerResults = searchResources(resources, query.toLowerCase());
        const upperResults = searchResources(resources, query.toUpperCase());
        const mixedResults = searchResources(resources, query);

        // All case variations should return the same results
        expect(lowerResults.length).toBe(upperResults.length);
        expect(lowerResults.length).toBe(mixedResults.length);

        // Same resource IDs should be present
        const lowerIds = new Set(lowerResults.map(r => r.id));
        const upperIds = new Set(upperResults.map(r => r.id));
        const mixedIds = new Set(mixedResults.map(r => r.id));

        expect(lowerIds).toEqual(upperIds);
        expect(lowerIds).toEqual(mixedIds);
      }),
      { numRuns: 100 },
    );
  });

  it('empty query returns all resources', () => {
    fc.assert(
      fc.property(resourcesArb, resources => {
        const emptyResults = searchResources(resources, '');
        const whitespaceResults = searchResources(resources, '   ');

        expect(emptyResults.length).toBe(resources.length);
        expect(whitespaceResults.length).toBe(resources.length);
      }),
      { numRuns: 100 },
    );
  });

  it('searching for exact name returns that resource', () => {
    fc.assert(
      fc.property(
        resourcesArb.filter(r => r.length > 0),
        resources => {
          // Pick a random resource and search for its exact name
          const randomIndex = Math.floor(Math.random() * resources.length);
          const targetResource = resources[randomIndex];
          const results = searchResources(resources, targetResource.name);

          // The target resource should be in the results
          const found = results.some(r => r.id === targetResource.id);
          expect(found).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('searching for a tag returns resources with that tag', () => {
    fc.assert(
      fc.property(
        resourcesArb.filter(
          r => r.length > 0 && r.some(res => res.tags.length > 0),
        ),
        resources => {
          // Find a resource with tags and search for one of its tags
          const resourceWithTags = resources.find(r => r.tags.length > 0);
          if (!resourceWithTags) return; // Skip if no resources with tags

          const tag = resourceWithTags.tags[0];
          const results = searchResources(resources, tag);

          // The resource with that tag should be in the results
          const found = results.some(r => r.id === resourceWithTags.id);
          expect(found).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('resourceMatchesQuery is consistent with searchResources', () => {
    fc.assert(
      fc.property(resourcesArb, searchQueryArb, (resources, query) => {
        const searchResults = searchResources(resources, query);
        const searchResultIds = new Set(searchResults.map(r => r.id));

        for (const resource of resources) {
          const matches = resourceMatchesQuery(resource, query);
          const inResults = searchResultIds.has(resource.id);

          expect(matches).toBe(inResults);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('search preserves resource data integrity', () => {
    fc.assert(
      fc.property(resourcesArb, searchQueryArb, (resources, query) => {
        const results = searchResources(resources, query);

        for (const result of results) {
          const original = resources.find(r => r.id === result.id);
          expect(original).toBeDefined();
          expect(result).toEqual(original);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('search on empty array returns empty array', () => {
    fc.assert(
      fc.property(searchQueryArb, query => {
        const results = searchResources([], query);
        expect(results).toHaveLength(0);
      }),
      { numRuns: 100 },
    );
  });
});
