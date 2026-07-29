// ============================================================================
// Resources Feature - TypeScript Types and Interfaces
// ============================================================================

// Enums / Union Types
// ----------------------------------------------------------------------------

/**
 * Difficulty level classification for resources
 */
export type DifficultyLevel =
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'all-levels';

/**
 * Price type classification for resources
 */
export type PriceType = 'free' | 'freemium' | 'paid' | 'subscription';

/**
 * Platform availability for resources
 */
export type Platform =
  | 'web'
  | 'ios'
  | 'android'
  | 'windows'
  | 'macos'
  | 'linux'
  | 'physical'
  | 'browser-extension'
  | 'api';

/**
 * Top-level category identifiers
 */
export type CategoryId =
  | 'apps'
  | 'websites'
  | 'textbooks'
  | 'youtube'
  | 'podcasts'
  | 'games'
  | 'jlpt'
  | 'reading'
  | 'listening'
  | 'speaking'
  | 'writing'
  | 'grammar'
  | 'vocabulary'
  | 'kanji'
  | 'immersion'
  | 'community';

/**
 * Subcategory identifier (dynamic based on category)
 */
export type SubcategoryId = string;

// Core Interfaces
// ----------------------------------------------------------------------------

/**
 * A single learning resource entry
 */
export interface Resource {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Japanese name if applicable */
  nameJa?: string;
  /** Brief description */
  description: string;
  /** Extended description for detail view */
  descriptionLong?: string;
  /** Top-level category */
  category: CategoryId;
  /** Subcategory within the category */
  subcategory: SubcategoryId;
  /** Searchable tags */
  tags: string[];
  /** Difficulty level */
  difficulty: DifficultyLevel;
  /** Price classification */
  priceType: PriceType;
  /** Price details (e.g., "$9.99/month", "Free with ads") */
  priceDetails?: string;
  /** Available platforms */
  platforms: Platform[];
  /** External URL to the resource */
  url: string;
  /** Image URL for the resource */
  imageUrl?: string;
  /** Rating on 1-5 scale */
  rating?: number;
  /** Whether this is a featured resource */
  featured?: boolean;
  /** Additional notes */
  notes?: string;
  /** Last updated date (ISO format) */
  lastUpdated?: string;
}

/**
 * Subcategory definition
 */
export interface Subcategory {
  /** Unique identifier */
  id: SubcategoryId;
  /** Display name */
  name: string;
  /** Japanese name */
  nameJa: string;
  /** Brief description */
  description: string;
  /** Extended description for SEO */
  descriptionLong: string;
  /** Parent category ID */
  parentCategory: CategoryId;
}

/**
 * Category definition
 */
export interface Category {
  /** Unique identifier */
  id: CategoryId;
  /** Display name */
  name: string;
  /** Japanese name */
  nameJa: string;
  /** Brief description */
  description: string;
  /** Extended description for SEO content */
  descriptionLong: string;
  /** Lucide icon name */
  icon: string;
  /** Subcategories within this category */
  subcategories: Subcategory[];
  /** Display order */
  order: number;
}

// Filter Types
// ----------------------------------------------------------------------------

/**
 * Currently active filter selections
 */
export interface ActiveFilters {
  /** Selected difficulty levels */
  difficulty: DifficultyLevel[];
  /** Selected price types */
  priceType: PriceType[];
  /** Selected platforms */
  platforms: Platform[];
  /** Search query string */
  search: string;
}

/**
 * Filter option with count
 */
export interface FilterOption<T> {
  /** Filter value */
  value: T;
  /** Number of resources matching this filter */
  count: number;
}

/**
 * Available filter options with counts
 */
export interface FilterOptions {
  /** Available difficulty levels with counts */
  difficulties: FilterOption<DifficultyLevel>[];
  /** Available price types with counts */
  priceTypes: FilterOption<PriceType>[];
  /** Available platforms with counts */
  platforms: FilterOption<Platform>[];
}

// Extended Types with Counts
// ----------------------------------------------------------------------------

/**
 * Subcategory with resource count
 */
export interface SubcategoryWithCount extends Subcategory {
  /** Number of resources in this subcategory */
  resourceCount: number;
}

/**
 * Category with resource count and subcategory counts
 */
export interface CategoryWithCount extends Category {
  /** Total number of resources in this category */
  resourceCount: number;
  /** Subcategories with their resource counts */
  subcategoriesWithCount: SubcategoryWithCount[];
}

// SEO Types
// ----------------------------------------------------------------------------

/**
 * Breadcrumb navigation item
 */
export interface BreadcrumbItem {
  /** Display name */
  name: string;
  /** URL path */
  href: string;
}

/**
 * SEO metadata for resource pages
 */
export interface ResourcePageSEO {
  /** Page title */
  title: string;
  /** Meta description */
  description: string;
  /** SEO keywords */
  keywords: string[];
  /** Canonical URL */
  canonicalUrl: string;
  /** Breadcrumb navigation items */
  breadcrumbs: BreadcrumbItem[];
  /** Structured data for JSON-LD */
  structuredData: {
    /** ItemList schema for resource listings */
    itemList?: ItemListSchema;
    /** BreadcrumbList schema */
    breadcrumb: BreadcrumbListSchema;
    /** FAQPage schema if applicable */
    faq?: FAQPageSchema;
  };
}

// Schema.org Types (for JSON-LD)
// ----------------------------------------------------------------------------

/**
 * Schema.org ItemList for resource listings
 */
export interface ItemListSchema {
  '@context': 'https://schema.org';
  '@type': 'ItemList';
  name: string;
  description: string;
  numberOfItems: number;
  itemListElement: ListItemSchema[];
}

/**
 * Schema.org ListItem
 */
export interface ListItemSchema {
  '@type': 'ListItem';
  position: number;
  item: SoftwareApplicationSchema | BookSchema | WebPageSchema;
}

/**
 * Schema.org SoftwareApplication (for apps)
 */
export interface SoftwareApplicationSchema {
  '@type': 'SoftwareApplication';
  name: string;
  description: string;
  url: string;
  applicationCategory: string;
  operatingSystem?: string;
  offers?: OfferSchema;
}

/**
 * Schema.org Book (for textbooks)
 */
export interface BookSchema {
  '@type': 'Book';
  name: string;
  description: string;
  url: string;
  author?: string;
  offers?: OfferSchema;
}

/**
 * Schema.org WebPage (generic)
 */
export interface WebPageSchema {
  '@type': 'WebPage';
  name: string;
  description: string;
  url: string;
}

/**
 * Schema.org Offer
 */
export interface OfferSchema {
  '@type': 'Offer';
  price?: string;
  priceCurrency?: string;
}

/**
 * Schema.org BreadcrumbList
 */
export interface BreadcrumbListSchema {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: BreadcrumbListItemSchema[];
}

/**
 * Schema.org BreadcrumbList item
 */
export interface BreadcrumbListItemSchema {
  '@type': 'ListItem';
  position: number;
  name: string;
  item: string;
}

/**
 * Schema.org FAQPage
 */
export interface FAQPageSchema {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: FAQQuestionSchema[];
}

/**
 * Schema.org Question for FAQ
 */
export interface FAQQuestionSchema {
  '@type': 'Question';
  name: string;
  acceptedAnswer: {
    '@type': 'Answer';
    text: string;
  };
}

// Validation Constants
// ----------------------------------------------------------------------------

/**
 * All valid difficulty levels
 */
export const DIFFICULTY_LEVELS: readonly DifficultyLevel[] = [
  'beginner',
  'intermediate',
  'advanced',
  'all-levels',
] as const;

/**
 * All valid price types
 */
export const PRICE_TYPES: readonly PriceType[] = [
  'free',
  'freemium',
  'paid',
  'subscription',
] as const;

/**
 * All valid platforms
 */
export const PLATFORMS: readonly Platform[] = [
  'web',
  'ios',
  'android',
  'windows',
  'macos',
  'linux',
  'physical',
  'browser-extension',
  'api',
] as const;

/**
 * All valid category IDs
 */
export const CATEGORY_IDS: readonly CategoryId[] = [
  'apps',
  'websites',
  'textbooks',
  'youtube',
  'podcasts',
  'games',
  'jlpt',
  'reading',
  'listening',
  'speaking',
  'writing',
  'grammar',
  'vocabulary',
  'kanji',
  'immersion',
  'community',
] as const;

// Type Guards
// ----------------------------------------------------------------------------

/**
 * Check if a value is a valid DifficultyLevel
 */
export function isValidDifficulty(value: unknown): value is DifficultyLevel {
  return (
    typeof value === 'string' &&
    DIFFICULTY_LEVELS.includes(value as DifficultyLevel)
  );
}

/**
 * Check if a value is a valid PriceType
 */
export function isValidPriceType(value: unknown): value is PriceType {
  return typeof value === 'string' && PRICE_TYPES.includes(value as PriceType);
}

/**
 * Check if a value is a valid Platform
 */
export function isValidPlatform(value: unknown): value is Platform {
  return typeof value === 'string' && PLATFORMS.includes(value as Platform);
}

/**
 * Check if a value is a valid CategoryId
 */
export function isValidCategoryId(value: unknown): value is CategoryId {
  return (
    typeof value === 'string' && CATEGORY_IDS.includes(value as CategoryId)
  );
}
