// ============================================================================
// Resource Validation
// ============================================================================

import type {
  Resource,
  DifficultyLevel,
  PriceType,
  Platform,
  CategoryId,
} from '../types';
import {
  DIFFICULTY_LEVELS,
  PRICE_TYPES,
  PLATFORMS,
  CATEGORY_IDS,
} from '../types';

/**
 * Required fields for a valid Resource
 */
export const REQUIRED_RESOURCE_FIELDS = [
  'id',
  'name',
  'description',
  'category',
  'subcategory',
  'tags',
  'difficulty',
  'priceType',
  'platforms',
  'url',
] as const;

export type RequiredResourceField = (typeof REQUIRED_RESOURCE_FIELDS)[number];

/**
 * Validation result for a resource
 */
export interface ResourceValidationResult {
  /** Whether the resource is valid */
  success: boolean;
  /** Missing required fields (if any) */
  missingFields: RequiredResourceField[];
  /** Invalid field values (if any) */
  invalidFields: { field: string; reason: string }[];
}

/**
 * Check if a value is a non-empty string
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if a value is a non-empty array
 */
function isNonEmptyArray(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Validate a resource object against the schema
 */
export function validateResource(resource: unknown): ResourceValidationResult {
  const missingFields: RequiredResourceField[] = [];
  const invalidFields: { field: string; reason: string }[] = [];

  // Handle null/undefined
  if (
    resource === null ||
    resource === undefined ||
    typeof resource !== 'object'
  ) {
    return {
      success: false,
      missingFields: [...REQUIRED_RESOURCE_FIELDS],
      invalidFields: [],
    };
  }

  const obj = resource as Record<string, unknown>;

  // Check required string fields
  const stringFields: RequiredResourceField[] = [
    'id',
    'name',
    'description',
    'subcategory',
    'url',
  ];
  for (const field of stringFields) {
    if (!isNonEmptyString(obj[field])) {
      missingFields.push(field);
    }
  }

  // Check category (must be valid CategoryId)
  if (!isNonEmptyString(obj.category)) {
    missingFields.push('category');
  } else if (!CATEGORY_IDS.includes(obj.category as CategoryId)) {
    invalidFields.push({
      field: 'category',
      reason: `Invalid category: ${obj.category}. Must be one of: ${CATEGORY_IDS.join(', ')}`,
    });
  }

  // Check difficulty (must be valid DifficultyLevel)
  if (!isNonEmptyString(obj.difficulty)) {
    missingFields.push('difficulty');
  } else if (!DIFFICULTY_LEVELS.includes(obj.difficulty as DifficultyLevel)) {
    invalidFields.push({
      field: 'difficulty',
      reason: `Invalid difficulty: ${obj.difficulty}. Must be one of: ${DIFFICULTY_LEVELS.join(', ')}`,
    });
  }

  // Check priceType (must be valid PriceType)
  if (!isNonEmptyString(obj.priceType)) {
    missingFields.push('priceType');
  } else if (!PRICE_TYPES.includes(obj.priceType as PriceType)) {
    invalidFields.push({
      field: 'priceType',
      reason: `Invalid priceType: ${obj.priceType}. Must be one of: ${PRICE_TYPES.join(', ')}`,
    });
  }

  // Check tags (must be non-empty array of strings)
  if (!isNonEmptyArray(obj.tags)) {
    missingFields.push('tags');
  } else {
    const invalidTags = (obj.tags as unknown[]).filter(
      tag => typeof tag !== 'string' || tag.trim().length === 0,
    );
    if (invalidTags.length > 0) {
      invalidFields.push({
        field: 'tags',
        reason: 'All tags must be non-empty strings',
      });
    }
  }

  // Check platforms (must be non-empty array of valid Platform values)
  if (!isNonEmptyArray(obj.platforms)) {
    missingFields.push('platforms');
  } else {
    const platforms = obj.platforms as unknown[];
    const invalidPlatforms = platforms.filter(
      p => typeof p !== 'string' || !PLATFORMS.includes(p as Platform),
    );
    if (invalidPlatforms.length > 0) {
      invalidFields.push({
        field: 'platforms',
        reason: `Invalid platforms: ${invalidPlatforms.join(', ')}. Must be one of: ${PLATFORMS.join(', ')}`,
      });
    }
  }

  // Validate optional fields if present
  if (obj.rating !== undefined) {
    const rating = obj.rating;
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      invalidFields.push({
        field: 'rating',
        reason: 'Rating must be a number between 1 and 5',
      });
    }
  }

  if (obj.featured !== undefined && typeof obj.featured !== 'boolean') {
    invalidFields.push({
      field: 'featured',
      reason: 'Featured must be a boolean',
    });
  }

  return {
    success: missingFields.length === 0 && invalidFields.length === 0,
    missingFields,
    invalidFields,
  };
}

/**
 * Validate multiple resources and return all validation results
 */
export function validateResources(resources: unknown[]): {
  valid: boolean;
  results: { index: number; result: ResourceValidationResult }[];
} {
  const results = resources.map((resource, index) => ({
    index,
    result: validateResource(resource),
  }));

  const valid = results.every(r => r.result.success);

  return { valid, results: results.filter(r => !r.result.success) };
}
