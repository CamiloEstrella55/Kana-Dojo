import { describe, expect, it } from 'vitest';
import { isKanaInputAnswerCorrect } from '@/features/Kana/lib/isKanaInputAnswerCorrect';

const altRomanjiMap = new Map<string, string[]>([
  ['し', ['si']],
  ['ち', ['ti']],
  ['つ', ['tu']],
  ['ふ', ['hu']],
  ['ん', ['nn']],
  ['シ', ['si']],
  ['チ', ['ti']],
  ['ツ', ['tu']],
  ['フ', ['hu']],
  ['ン', ['nn']],
]);

describe('isKanaInputAnswerCorrect', () => {
  it('accepts primary romaji in normal mode', () => {
    expect(
      isKanaInputAnswerCorrect({
        inputValue: 'shi',
        correctChar: 'し',
        targetChar: 'shi',
        isReverse: false,
        altRomanjiMap,
      }),
    ).toBe(true);
  });

  it('compares primary romaji case-insensitively after Unicode normalization', () => {
    expect(
      isKanaInputAnswerCorrect({
        inputValue: 'o\u0304',
        correctChar: 'お',
        targetChar: 'Ō',
        isReverse: false,
        altRomanjiMap,
      }),
    ).toBe(true);
  });

  it('accepts alternative romaji in normal mode', () => {
    expect(
      isKanaInputAnswerCorrect({
        inputValue: 'si',
        correctChar: 'し',
        targetChar: 'shi',
        isReverse: false,
        altRomanjiMap,
      }),
    ).toBe(true);
  });

  it('accepts nn for both hiragana and katakana n', () => {
    expect(
      isKanaInputAnswerCorrect({
        inputValue: 'nn',
        correctChar: 'ん',
        targetChar: 'n',
        isReverse: false,
        altRomanjiMap,
      }),
    ).toBe(true);

    expect(
      isKanaInputAnswerCorrect({
        inputValue: 'nn',
        correctChar: 'ン',
        targetChar: 'n',
        isReverse: false,
        altRomanjiMap,
      }),
    ).toBe(true);
  });

  it('rejects incorrect answers in normal mode', () => {
    expect(
      isKanaInputAnswerCorrect({
        inputValue: 'su',
        correctChar: 'し',
        targetChar: 'shi',
        isReverse: false,
        altRomanjiMap,
      }),
    ).toBe(false);
  });

  it('accepts only exact kana in reverse mode', () => {
    expect(
      isKanaInputAnswerCorrect({
        inputValue: 'し',
        correctChar: 'shi',
        targetChar: 'し',
        isReverse: true,
        altRomanjiMap,
      }),
    ).toBe(true);

    expect(
      isKanaInputAnswerCorrect({
        inputValue: ' シ ',
        correctChar: 'shi',
        targetChar: 'し',
        isReverse: true,
        altRomanjiMap,
      }),
    ).toBe(false);
  });

  it('accepts canonically equivalent kana in reverse mode', () => {
    expect(
      isKanaInputAnswerCorrect({
        inputValue: 'か\u3099',
        correctChar: 'ga',
        targetChar: 'が',
        isReverse: true,
        altRomanjiMap,
      }),
    ).toBe(true);
  });

  it('accepts primary romaji for a multi-character prompt', () => {
    // prompt: しぶ → primary answer: shibu
    expect(
      isKanaInputAnswerCorrect({
        inputValue: 'shibu',
        correctChar: 'しぶ',
        targetChar: 'shibu',
        isReverse: false,
        altRomanjiMap,
        promptParts: ['し', 'ぶ'],
        answerParts: ['shi', 'bu'],
      }),
    ).toBe(true);
  });

  it('accepts alternative romaji for a multi-character prompt', () => {
    // し has alt 'si', so 'sibu' should be accepted for prompt しぶ
    expect(
      isKanaInputAnswerCorrect({
        inputValue: 'sibu',
        correctChar: 'しぶ',
        targetChar: 'shibu',
        isReverse: false,
        altRomanjiMap,
        promptParts: ['し', 'ぶ'],
        answerParts: ['shi', 'bu'],
      }),
    ).toBe(true);
  });

  it('accepts alternatives at multiple positions in a three-part prompt', () => {
    expect(
      isKanaInputAnswerCorrect({
        inputValue: ' SIHUTI ',
        correctChar: 'しふち',
        targetChar: 'shifuchi',
        isReverse: false,
        altRomanjiMap,
        promptParts: ['し', 'ふ', 'ち'],
        answerParts: ['shi', 'fu', 'chi'],
      }),
    ).toBe(true);
  });

  it('accepts alternative romaji for multi-character katakana prompts', () => {
    expect(
      isKanaInputAnswerCorrect({
        inputValue: 'situ',
        correctChar: 'シツ',
        targetChar: 'shitsu',
        isReverse: false,
        altRomanjiMap,
        promptParts: ['シ', 'ツ'],
        answerParts: ['shi', 'tsu'],
      }),
    ).toBe(true);
  });

  it('keeps reverse multi-character matching exact and normalized', () => {
    expect(
      isKanaInputAnswerCorrect({
        inputValue: ' シツ ',
        correctChar: 'shitsu',
        targetChar: 'シツ',
        isReverse: true,
        altRomanjiMap,
        promptParts: ['shi', 'tsu'],
        answerParts: ['シ', 'ツ'],
      }),
    ).toBe(true);

    expect(
      isKanaInputAnswerCorrect({
        inputValue: 'しつ',
        correctChar: 'shitsu',
        targetChar: 'シツ',
        isReverse: true,
        altRomanjiMap,
        promptParts: ['shi', 'tsu'],
        answerParts: ['シ', 'ツ'],
      }),
    ).toBe(false);
  });

  it('rejects incorrect romaji for a multi-character prompt', () => {
    expect(
      isKanaInputAnswerCorrect({
        inputValue: 'subu',
        correctChar: 'しぶ',
        targetChar: 'shibu',
        isReverse: false,
        altRomanjiMap,
        promptParts: ['し', 'ぶ'],
        answerParts: ['shi', 'bu'],
      }),
    ).toBe(false);
  });

  it('falls back to legacy lookup when promptParts/answerParts lengths differ', () => {
    // Mismatched lengths should not crash; falls back to correctChar key lookup
    expect(
      isKanaInputAnswerCorrect({
        inputValue: 'si',
        correctChar: 'し',
        targetChar: 'shi',
        isReverse: false,
        altRomanjiMap,
        promptParts: ['し', 'ぶ'],
        answerParts: ['shi'], // intentionally mismatched
      }),
    ).toBe(true); // resolved via legacy fallback: altRomanjiMap.get('し') = ['si']
  });

  // Reverse mode (romaji → kana). A romaji prompt does not identify one kana:
  // 'ka' is か and カ, 'ji' is じ and ぢ. Previously only the last-registered
  // kana was accepted, so the other — equally correct — answer was marked wrong.
  describe('reverse mode accepts every kana sharing the prompted romaji', () => {
    // romaji → all selected kana with that romaji
    const reverseAltMap = new Map<string, string[]>([
      ['ka', ['か', 'カ']],
      ['ji', ['じ', 'ぢ']],
      ['shi', ['し', 'シ']],
    ]);

    it('accepts the hiragana when the stored answer is the katakana', () => {
      expect(
        isKanaInputAnswerCorrect({
          inputValue: 'か',
          correctChar: 'ka',
          targetChar: 'カ',
          isReverse: true,
          altRomanjiMap: reverseAltMap,
          promptParts: ['ka'],
          answerParts: ['カ'],
        }),
      ).toBe(true);
    });

    it('still accepts the stored answer itself', () => {
      expect(
        isKanaInputAnswerCorrect({
          inputValue: 'カ',
          correctChar: 'ka',
          targetChar: 'カ',
          isReverse: true,
          altRomanjiMap: reverseAltMap,
          promptParts: ['ka'],
          answerParts: ['カ'],
        }),
      ).toBe(true);
    });

    it('accepts a same-script homophone (ぢ for ji)', () => {
      expect(
        isKanaInputAnswerCorrect({
          inputValue: 'ぢ',
          correctChar: 'ji',
          targetChar: 'じ',
          isReverse: true,
          altRomanjiMap: reverseAltMap,
          promptParts: ['ji'],
          answerParts: ['じ'],
        }),
      ).toBe(true);
    });

    it('accepts a mixed-script multi-part answer', () => {
      expect(
        isKanaInputAnswerCorrect({
          inputValue: 'かシ',
          correctChar: 'kashi',
          targetChar: 'カし',
          isReverse: true,
          altRomanjiMap: reverseAltMap,
          promptParts: ['ka', 'shi'],
          answerParts: ['カ', 'し'],
        }),
      ).toBe(true);
    });

    it('still rejects a kana that does not match the prompt', () => {
      expect(
        isKanaInputAnswerCorrect({
          inputValue: 'き',
          correctChar: 'ka',
          targetChar: 'カ',
          isReverse: true,
          altRomanjiMap: reverseAltMap,
          promptParts: ['ka'],
          answerParts: ['カ'],
        }),
      ).toBe(false);
    });
  });
});
