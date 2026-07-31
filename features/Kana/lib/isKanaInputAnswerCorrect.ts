interface KanaInputAnswerOptions {
  inputValue: string;
  correctChar: string;
  targetChar: string;
  isReverse: boolean;
  /**
   * Accepted alternatives keyed by prompt part.
   *
   * Normal mode: kana → alternative romaji (e.g. 'し' → ['si']).
   * Reverse mode: romaji → every selected kana sharing it (e.g. 'ka' → ['か',
   * 'カ']), since romaji are not unique across the two scripts.
   */
  altRomanjiMap: Map<string, string[]>;
  /**
   * The individual parts that make up the prompt — kana in normal mode
   * (e.g. ['し', 'ぶ']), romaji in reverse mode (e.g. ['ka']).
   * Required for correct alternative lookup on multi-character prompts.
   * When omitted the function falls back to the legacy single-key lookup.
   */
  promptParts?: string[];
  /**
   * The primary answer for each prompt part in the same order as promptParts —
   * romaji in normal mode (e.g. ['shi', 'bu']), kana in reverse mode.
   * Required alongside promptParts.
   */
  answerParts?: string[];
}

/**
 * Builds every valid romaji string for a multi-character prompt by substituting
 * alternative romanisations for any part that has them.
 *
 * Example: ['し', 'ぶ'], ['shi', 'bu'], { し → ['si'] }
 * → ['shibu', 'sibu']
 */
function buildAltCombinations(
  parts: string[],
  primaryAnswers: string[],
  altMap: Map<string, string[]>,
): string[] {
  if (parts.length === 0) return [''];
  const [firstPart, ...restParts] = parts;
  const [firstAnswer, ...restAnswers] = primaryAnswers;
  const options = [firstAnswer, ...(altMap.get(firstPart) ?? [])];
  const suffixes = buildAltCombinations(restParts, restAnswers, altMap);
  return options.flatMap(opt => suffixes.map(suf => opt + suf));
}

export const isKanaInputAnswerCorrect = ({
  inputValue,
  correctChar,
  targetChar,
  isReverse,
  altRomanjiMap,
  promptParts,
  answerParts,
}: KanaInputAnswerOptions): boolean => {
  // Normalize Unicode form and strip surrounding whitespace so that input
  // from an IME or copy-paste (which may arrive in a different NFC/NFD form)
  // is compared on equal footing with the stored answer.
  const normalizedInput = inputValue.trim().normalize('NFC');
  if (!normalizedInput) return false;

  if (isReverse) {
    // Reverse mode: the user types the kana itself. A romaji prompt does not
    // identify a single kana — 'ka' is both か and カ, 'ji' is じ and ぢ — so
    // every selected kana sharing that romaji has to be accepted. Comparing
    // against one stored answer marked the other, equally correct, kana wrong.
    const target = targetChar.normalize('NFC');
    if (normalizedInput === target) return true;

    if (
      promptParts &&
      answerParts &&
      promptParts.length > 0 &&
      promptParts.length === answerParts.length
    ) {
      const validAnswers = buildAltCombinations(
        promptParts,
        answerParts,
        altRomanjiMap,
      );
      return validAnswers.some(ans => normalizedInput === ans.normalize('NFC'));
    }

    return false;
  }

  // Normal mode: user types romaji. Compare case- and Unicode-insensitively.
  const lowerInput = normalizedInput.toLowerCase();
  const lowerTarget = targetChar.toLowerCase().normalize('NFC');

  if (lowerInput === lowerTarget) {
    return true;
  }

  // Check alternative romanisations.
  // For multi-character prompts the altRomanjiMap is keyed by individual kana
  // (e.g. 'し' → ['si']), so looking up the joined correctChar (e.g. 'しぶ')
  // always returns undefined and valid alternatives are silently rejected.
  // When promptParts and answerParts are provided, build every valid full-string
  // combination so alternatives work correctly regardless of prompt length.
  if (
    promptParts &&
    answerParts &&
    promptParts.length > 0 &&
    promptParts.length === answerParts.length
  ) {
    const validAnswers = buildAltCombinations(
      promptParts,
      answerParts,
      altRomanjiMap,
    );
    return validAnswers.some(
      ans => lowerInput === ans.toLowerCase().normalize('NFC'),
    );
  }

  // Legacy single-character fallback (promptParts not provided).
  const alternatives = altRomanjiMap.get(correctChar);
  return alternatives
    ? alternatives.some(
        alt => lowerInput === alt.toLowerCase().normalize('NFC'),
      )
    : false;
};
