// Fonts recommended for Japanese learning
// These fonts are commonly used in real Japanese textbooks, books, and media
// They provide the clearest representations of Japanese characters for learners

export const RECOMMENDED_FONT_NAMES = [
  'Zen Maru Gothic', // Quintessential default - rounded, friendly
  'Noto Sans JP', // Google's standard, widely used
  'Klee One', // School textbook style (教科書体-like), designed for education
  'BIZ UDMincho', // Business/official documents, Universal Design for high readability
  'Shippori Mincho', // Literature/novels, traditional Japanese serif
  'M PLUS 1', // Modern clean Gothic, widely used in digital media
  'Sawarabi Gothic', // Neutral, clean, good for reading practice
  'Zen Old Mincho', // Newspapers, formal publications, classic mincho
] as const;

export type RecommendedFontName = (typeof RECOMMENDED_FONT_NAMES)[number];

export const isRecommendedFont = (fontName: string): boolean => {
  return RECOMMENDED_FONT_NAMES.includes(fontName as RecommendedFontName);
};
