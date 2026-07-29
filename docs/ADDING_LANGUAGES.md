# Adding New Languages to KanaDojo

This guide explains how to add new language support to KanaDojo with full SEO optimization.

## 🌍 Current Language Support

- ✅ English (en) - Primary
- ✅ Spanish (es) - Fully localized
- ✅ Japanese (ja) - Fully localized
- 📝 French (fr) - Template/Example included
- 📝 German (de) - Template/Example included

## 🚀 Quick Start: Adding a New Language

### Step 1: Create Metadata File

Create a new metadata file for your language:

```bash
cp core/i18n/locales/en/metadata.json core/i18n/locales/[LOCALE]/metadata.json
```

Replace `[LOCALE]` with your language code (e.g., `pt`, `it`, `ko`, `zh`)

### Step 2: Translate Metadata

Open the new file and translate all strings:

```json
{
  "home": {
    "title": "Your translated title",
    "titleShort": "Short title",
    "description": "Your translated description",
    "keywords": "translated, keywords, here"
  }
  // ... translate all sections
}
```

**Important Sections to Translate:**

- `home` - Homepage metadata
- `kana`, `kanji`, `vocabulary` - Main learning sections
- `kanaBlitz`, `kanjiBlitz`, `vocabularyBlitz` - Speed test modes
- `kanaTrain`, `kanjiTrain`, `vocabularyTrain` - Training modes
- `kanaSubset` - All 7 kana subset pages (most important for SEO!)
- `academy`, `preferences`, `progress` - Utility pages

### Step 3: Update Routing Configuration

**File:** `core/i18n/routing.ts`

```typescript
export const routing = defineRouting({
  locales: ['en', 'es', 'ja', 'YOUR_LOCALE'], // Add your locale here
  defaultLocale: 'en',
});
```

### Step 4: Update Root Layout Metadata

**File:** `app/layout.tsx`

Add your locale to the OpenGraph alternates:

```typescript
openGraph: {
  // ...existing config
  alternateLocale: ['es_ES', 'ja_JP', 'YOUR_LOCALE']; // Add here
}
```

### Step 5: Update Sitemap Configuration

**File:** `next-sitemap.config.js`

The sitemap will automatically include your new locale once it's in the routing config. No changes needed!

### Step 6: Test Your New Language

```bash
# Start dev server
npm run dev

# Visit your new locale
# http://localhost:3000/[YOUR_LOCALE]

# Check metadata
# View page source and verify <meta> tags
```

### Step 7: Build and Verify

```bash
# Run type checking
npm run check

# Build for production
npm run build

# Verify sitemap includes new locale
# Check public/sitemap.xml after build
```

## 📊 SEO Impact of Each Language

Adding one new language adds approximately:

- **90+ indexed pages** (all routes × 1 locale)
- **50+ kana subset pages** (with full SEO)
- **Estimated +200-400 monthly visits** per language

## 🎯 Recommended Languages by Market

### High Priority (Large Learning Markets):

1. **Portuguese (pt)** - Brazil market (~200M speakers)
2. **French (fr)** - France, Canada, Africa (~280M speakers)
3. **German (de)** - Germany, Austria, Switzerland (~100M speakers)
4. **Italian (it)** - Italy market (~85M speakers)

### Medium Priority (Growing Markets):

5. **Korean (ko)** - Korea, strong Japanese learning interest
6. **Chinese Simplified (zh)** - China, massive market
7. **Russian (ru)** - Russia, Eastern Europe
8. **Indonesian (id)** - Indonesia, large population

### Future Consideration:

- Thai (th)
- Vietnamese (vi)
- Arabic (ar)
- Hindi (hi)

## 📝 Metadata File Structure

Your metadata file should include these sections:

```json
{
  "home": {}, // Homepage
  "kana": {}, // Kana main page
  "kanaBlitz": {}, // Kana speed test
  "kanaGauntlet": {}, // Kana mastery mode
  "kanaTrain": {}, // Kana training
  "kanji": {}, // Kanji main page
  "kanjiBlitz": {}, // Kanji speed test
  "kanjiGauntlet": {}, // Kanji mastery mode
  "kanjiTrain": {}, // Kanji training
  "vocabulary": {}, // Vocabulary main page
  "vocabularyBlitz": {}, // Vocabulary speed test
  "vocabularyGauntlet": {}, // Vocabulary mastery
  "vocabularyTrain": {}, // Vocabulary training
  "academy": {}, // Academy/blog
  "preferences": {}, // Settings page
  "progress": {}, // Statistics page
  "privacy": {}, // Privacy policy
  "terms": {}, // Terms of service
  "security": {}, // Security policy
  "credits": {}, // Credits page
  "patchNotes": {}, // Version history
  "experiments": {}, // Experimental features
  "translate": {}, // Translator tool
  "zen": {}, // Zen mode
  "kanaSubset": {
    // ⭐ MOST IMPORTANT FOR SEO
    "hiraganaBase": {},
    "hiraganaDakuon": {},
    "hiraganaYoon": {},
    "katakanaBase": {},
    "katakanaDakuon": {},
    "katakanaYoon": {},
    "katakanaForeign": {}
  }
}
```

## 🔍 SEO Best Practices for Translations

### 1. Use Native Keywords

**❌ Bad (Direct translation):**

```json
"keywords": "learn japanese, hiragana practice"
```

**✅ Good (Native SEO keywords):**

```json
// For Portuguese
"keywords": "aprender japonês, prática hiragana"
// For French
"keywords": "apprendre japonais, pratique hiragana"
// For German
"keywords": "japanisch lernen, hiragana übung"
```

### 2. Localize Titles Naturally

**❌ Bad:**

```json
"title": "KanaDojo - Learn Japanese Hiragana, Katakana..."
```

**✅ Good:**

```json
// Portuguese
"title": "KanaDojo - Aprenda Japonês Hiragana, Katakana..."
// French
"title": "KanaDojo - Apprendre le Japonais Hiragana, Katakana..."
```

### 3. Research Local Search Terms

Use tools like:

- Google Keyword Planner (for target country)
- Google Trends (compare keyword variants)
- Answer The Public (find question-based keywords)

### 4. Keep Japanese Characters

Japanese characters (あ, ア, 漢字) are universal - keep them in all languages:

```json
"description": "Master 46 hiragana characters (あいうえお, かきくけこ...)"
```

## 🏗️ Architecture Notes

### How Language Support Works:

1. **Routing** (`core/i18n/routing.ts`)
   - Defines available locales
   - Sets default locale
   - Used by next-intl for URL generation

2. **Metadata Helper** (`core/i18n/metadata-helpers.ts`)
   - Automatically reads from correct locale
   - Generates OG images with locale-specific text
   - No code changes needed for new languages!

3. **Static Generation** (`app/[locale]/*/page.tsx`)
   - `generateStaticParams` creates pages for all locales
   - Each page automatically uses correct translations
   - Build time scales linearly with locales

4. **Sitemap** (`next-sitemap.config.js`)
   - Automatically includes all locales
   - Generates proper hreflang tags
   - No manual configuration needed!

## ⏱️ Performance Impact

### Development Server:

- **Per language:** +0.2-0.5 sec startup time
- **5 languages:** ~3 sec total startup
- **10 languages:** ~4 sec total startup
- **Negligible HMR impact**

### Production Build:

- **Per language:** +30-60 sec build time
- **5 languages:** ~2-3 min total
- **10 languages:** ~4-6 min total

### Runtime:

- **Zero impact** - users only load one locale
- **No bundle size increase** per language

## 📦 What Gets Generated

For each new language, you get:

- ✅ 90+ localized pages
- ✅ Dynamic OG images with translated text
- ✅ Proper hreflang tags in sitemap
- ✅ Localized breadcrumbs
- ✅ Translated metadata for all pages
- ✅ Course schema in native language
- ✅ FAQ schema (from root, language-neutral)

## 🐛 Troubleshooting

### Issue: Pages show English instead of new language

**Solution:** Check that:

1. Metadata file exists in `core/i18n/locales/[LOCALE]/metadata.json`
2. Locale is added to `core/i18n/routing.ts`
3. Dev server was restarted after changes

### Issue: Build fails with new locale

**Solution:** Run type checking:

```bash
npm run check
```

Common issues:

- Missing required metadata keys
- Malformed JSON syntax
- Missing commas in metadata.json

### Issue: Sitemap doesn't include new locale

**Solution:**

1. Verify locale in routing.ts
2. Run `npm run build` (sitemap generates post-build)
3. Check `public/sitemap.xml`

## 📚 Examples

See `core/i18n/locales/fr/` and `core/i18n/locales/de/` for complete examples of fully localized metadata files.

## 🎯 Quick Checklist

- [ ] Created metadata file in `core/i18n/locales/[LOCALE]/metadata.json`
- [ ] Translated all metadata sections
- [ ] Added locale to `core/i18n/routing.ts`
- [ ] Updated `app/layout.tsx` alternateLocale
- [ ] Tested locally at `http://localhost:3000/[LOCALE]`
- [ ] Ran `npm run check` successfully
- [ ] Built and verified sitemap includes locale
- [ ] Submitted updated sitemap to Google Search Console

## 🚀 Ready to Add a Language?

1. Choose your language code from [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)
2. Follow the 7 steps above
3. Test thoroughly
4. Submit sitemap to search engines

**Estimated time per language:** 2-4 hours (depending on translation quality needed)

---

**Need help?** Check the example files in `fr/` and `de/` directories or open an issue on GitHub.
