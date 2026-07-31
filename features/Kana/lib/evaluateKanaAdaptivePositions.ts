interface EvaluateKanaAdaptivePositionsOptions {
  promptChars: string[];
  answerParts: string[];
  inputValue: string;
  isReverse: boolean;
  altRomanjiMap: Map<string, string[]>;
}

export const evaluateKanaAdaptivePositions = ({
  promptChars,
  answerParts,
  inputValue,
  isReverse,
  altRomanjiMap,
}: EvaluateKanaAdaptivePositionsOptions): boolean[] => {
  const normalizedInput = inputValue.trim();
  const results = promptChars.map(() => false);

  if (!normalizedInput) return results;

  if (isReverse) {
    // Walk the input with a cursor rather than indexing character-by-character.
    // Two reasons: a romaji prompt accepts more than one kana (か/カ are both
    // 'ka'), and a single kana can be two characters (きゃ), which position
    // indexing mis-aligned. Getting this wrong feeds the adaptive selector false
    // "wrong" results and skews what the learner is shown next.
    const input = normalizedInput.normalize('NFC');
    let cursor = 0;

    for (let i = 0; i < promptChars.length; i++) {
      const primary = (answerParts[i] ?? '').normalize('NFC');
      const alternatives = (altRomanjiMap.get(promptChars[i]) ?? []).map(alt =>
        alt.normalize('NFC'),
      );
      const options = Array.from(new Set([primary, ...alternatives]))
        .filter(Boolean)
        .sort((a, b) => b.length - a.length);

      const remaining = input.slice(cursor);
      const matched = options.find(option => remaining.startsWith(option));

      if (matched) {
        results[i] = true;
        cursor += matched.length;
        continue;
      }

      results[i] = false;
      cursor += primary.length;
    }

    return results;
  }

  const lowerInput = normalizedInput.toLowerCase();
  let cursor = 0;

  for (let i = 0; i < promptChars.length; i++) {
    const promptChar = promptChars[i];
    const primary = (answerParts[i] ?? '').toLowerCase();
    const alternatives = (altRomanjiMap.get(promptChar) ?? []).map(alt =>
      alt.toLowerCase(),
    );
    const options = Array.from(new Set([primary, ...alternatives]))
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);

    const remaining = lowerInput.slice(cursor);
    const matched = options.find(option => remaining.startsWith(option));

    if (matched) {
      results[i] = true;
      cursor += matched.length;
      continue;
    }

    results[i] = false;
    cursor += primary.length;
  }

  return results;
};
