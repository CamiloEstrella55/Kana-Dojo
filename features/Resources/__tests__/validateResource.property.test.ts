import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateResource,
  REQUIRED_RESOURCE_FIELDS,
  type RequiredResourceField,
} from '../lib/validateResource';
import {
  DIFFICULTY_LEVELS,
  PRICE_TYPES,
  PLATFORMS,
  CATEGORY_IDS,
  type DifficultyLevel,
  type PriceType,
  type Platform,
  type CategoryId,
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
  .string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0);

const tagsArb = fc.array(nonEmptyStringArb, { minLength: 1, maxLength: 5 });
const platformsArb = fc.array(platformArb, { minLength: 1, maxLength: 5 });

const urlArb = fc.webUrl().filter(url => url.length > 0);

// Generate a complete valid resource object
const validResourceArb = fc.record({
  id: nonEmptyStringArb,
  name: nonEmptyStringArb,
  description: nonEmptyStringArb,
  category: categoryArb,
  subcategory: nonEmptyStringArb,
  tags: tagsArb,
  difficulty: difficultyArb,
  priceType: priceTypeArb,
  platforms: platformsArb,
  url: urlArb,
});

// Generate a valid resource with optional fields
const validResourceWithOptionalsArb = fc.record({
  id: nonEmptyStringArb,
  name: nonEmptyStringArb,
  nameJa: fc.option(nonEmptyStringArb, { nil: undefined }),
  description: nonEmptyStringArb,
  descriptionLong: fc.option(nonEmptyStringArb, { nil: undefined }),
  category: categoryArb,
  subcategory: nonEmptyStringArb,
  tags: tagsArb,
  difficulty: difficultyArb,
  priceType: priceTypeArb,
  priceDetails: fc.option(nonEmptyStringArb, { nil: undefined }),
  platforms: platformsArb,
  url: urlArb,
  imageUrl: fc.option(urlArb, { nil: undefined }),
  rating: fc.option(fc.double({ min: 1, max: 5, noNaN: true }), {
    nil: undefined,
  }),
  featured: fc.option(fc.boolean(), { nil: undefined }),
  notes: fc.option(nonEmptyStringArb, { nil: undefined }),
});

/**
 * **Feature: japanese-resources-library, Property 7: Resource Data Schema Validation**
 * For any resource in the data files, it should contain all required fields (id, name,
 * description, category, subcategory, tags, difficulty, priceType, platforms, url) with
 * correct types, and the difficulty and priceType values should be from the allowed enum values.
 * **Validates: Requirements 6.2, 6.3**
 */
describe('Property 7: Resource Data Schema Validation', () => {
  it('valid resources pass validation', () => {
    fc.assert(
      fc.property(validResourceArb, resource => {
        const result = validateResource(resource);
        expect(result.success).toBe(true);
        expect(result.missingFields).toHaveLength(0);
        expect(result.invalidFields).toHaveLength(0);
      }),
      { numRuns: 100 },
    );
  });

  it('valid resources with optional fields pass validation', () => {
    fc.assert(
      fc.property(validResourceWithOptionalsArb, resource => {
        const result = validateResource(resource);
        expect(result.success).toBe(true);
        expect(result.missingFields).toHaveLength(0);
        expect(result.invalidFields).toHaveLength(0);
      }),
      { numRuns: 100 },
    );
  });

  it('missing required fields are identified', () => {
    const fieldsToRemoveArb = fc.subarray([...REQUIRED_RESOURCE_FIELDS], {
      minLength: 1,
    });

    fc.assert(
      fc.property(
        validResourceArb,
        fieldsToRemoveArb,
        (resource, fieldsToRemove) => {
          // Create a copy with some fields removed
          const incomplete = { ...resource };
          for (const field of fieldsToRemove) {
            delete incomplete[field as keyof typeof incomplete];
          }

          const result = validateResource(incomplete);

          // Validation should fail
          expect(result.success).toBe(false);

          // All removed fields should be in the missing fields list
          for (const field of fieldsToRemove) {
            expect(result.missingFields).toContain(field);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('empty strings are treated as missing for string fields', () => {
    const stringFieldsArb = fc.constantFrom<RequiredResourceField>(
      'id',
      'name',
      'description',
      'subcategory',
      'url',
    );

    fc.assert(
      fc.property(
        validResourceArb,
        stringFieldsArb,
        (resource, fieldToEmpty) => {
          const withEmpty = { ...resource, [fieldToEmpty]: '' };

          const result = validateResource(withEmpty);

          expect(result.success).toBe(false);
          expect(result.missingFields).toContain(fieldToEmpty);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('empty tags array is treated as missing', () => {
    fc.assert(
      fc.property(validResourceArb, resource => {
        const withEmptyTags = { ...resource, tags: [] };

        const result = validateResource(withEmptyTags);

        expect(result.success).toBe(false);
        expect(result.missingFields).toContain('tags');
      }),
      { numRuns: 100 },
    );
  });

  it('empty platforms array is treated as missing', () => {
    fc.assert(
      fc.property(validResourceArb, resource => {
        const withEmptyPlatforms = { ...resource, platforms: [] };

        const result = validateResource(withEmptyPlatforms);

        expect(result.success).toBe(false);
        expect(result.missingFields).toContain('platforms');
      }),
      { numRuns: 100 },
    );
  });

  it('invalid category values are rejected', () => {
    const invalidCategoryArb = fc
      .string({ minLength: 1 })
      .filter(
        s => s.trim().length > 0 && !CATEGORY_IDS.includes(s as CategoryId),
      );

    fc.assert(
      fc.property(
        validResourceArb,
        invalidCategoryArb,
        (resource, invalidCategory) => {
          const withInvalidCategory = {
            ...resource,
            category: invalidCategory,
          };

          const result = validateResource(withInvalidCategory);

          expect(result.success).toBe(false);
          expect(result.invalidFields.some(f => f.field === 'category')).toBe(
            true,
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it('invalid difficulty values are rejected', () => {
    const invalidDifficultyArb = fc
      .string({ minLength: 1 })
      .filter(
        s =>
          s.trim().length > 0 &&
          !DIFFICULTY_LEVELS.includes(s as DifficultyLevel),
      );

    fc.assert(
      fc.property(
        validResourceArb,
        invalidDifficultyArb,
        (resource, invalidDifficulty) => {
          const withInvalidDifficulty = {
            ...resource,
            difficulty: invalidDifficulty,
          };

          const result = validateResource(withInvalidDifficulty);

          expect(result.success).toBe(false);
          expect(result.invalidFields.some(f => f.field === 'difficulty')).toBe(
            true,
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it('invalid priceType values are rejected', () => {
    const invalidPriceTypeArb = fc
      .string({ minLength: 1 })
      .filter(
        s => s.trim().length > 0 && !PRICE_TYPES.includes(s as PriceType),
      );

    fc.assert(
      fc.property(
        validResourceArb,
        invalidPriceTypeArb,
        (resource, invalidPriceType) => {
          const withInvalidPriceType = {
            ...resource,
            priceType: invalidPriceType,
          };

          const result = validateResource(withInvalidPriceType);

          expect(result.success).toBe(false);
          expect(result.invalidFields.some(f => f.field === 'priceType')).toBe(
            true,
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it('invalid platform values are rejected', () => {
    const invalidPlatformArb = fc
      .string({ minLength: 1 })
      .filter(s => s.trim().length > 0 && !PLATFORMS.includes(s as Platform));

    fc.assert(
      fc.property(
        validResourceArb,
        invalidPlatformArb,
        (resource, invalidPlatform) => {
          const withInvalidPlatform = {
            ...resource,
            platforms: [invalidPlatform],
          };

          const result = validateResource(withInvalidPlatform);

          expect(result.success).toBe(false);
          expect(result.invalidFields.some(f => f.field === 'platforms')).toBe(
            true,
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it('invalid rating values are rejected', () => {
    const invalidRatingArb = fc.oneof(
      fc.double({ min: -100, max: 0.99, noNaN: true }),
      fc.double({ min: 5.01, max: 100, noNaN: true }),
    );

    fc.assert(
      fc.property(
        validResourceArb,
        invalidRatingArb,
        (resource, invalidRating) => {
          const withInvalidRating = { ...resource, rating: invalidRating };

          const result = validateResource(withInvalidRating);

          expect(result.success).toBe(false);
          expect(result.invalidFields.some(f => f.field === 'rating')).toBe(
            true,
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it('null and undefined resources fail validation', () => {
    const nullishArb = fc.constantFrom(null, undefined);

    fc.assert(
      fc.property(nullishArb, nullish => {
        const result = validateResource(nullish);

        expect(result.success).toBe(false);
        expect(result.missingFields.length).toBe(
          REQUIRED_RESOURCE_FIELDS.length,
        );
      }),
      { numRuns: 10 },
    );
  });
});
