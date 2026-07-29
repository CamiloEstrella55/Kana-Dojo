'use client';

import { useMemo } from 'react';
import { kana } from '../data/kana';
import { flattenKanaGroups } from '../lib/flattenKanaGroup';
import type { KanaCharacter } from '../lib/flattenKanaGroup';
import useKanaStore from '../store/useKanaStore';

/**
 * Kana Content Facade - Access to kana data based on selection
 *
 * Provides read-only access to kana characters based on current selection
 */

export interface KanaContent {
  selectedCharacters: KanaCharacter[];
  allGroups: typeof kana;
  totalCharacters: number;
  getGroupByIndex: (index: number) => (typeof kana)[0] | undefined;
  getAllCharacters: () => KanaCharacter[];
}

export function useKanaContent(): KanaContent {
  const selectedIndices = useKanaStore(state => state.kanaGroupIndices);

  const selectedCharacters = useMemo(() => {
    return flattenKanaGroups(selectedIndices);
  }, [selectedIndices]);

  const allCharacters = useMemo(() => {
    const allIndices = Array.from({ length: kana.length }, (_, i) => i);
    return flattenKanaGroups(allIndices);
  }, []);

  return {
    selectedCharacters,
    allGroups: kana,
    totalCharacters: selectedCharacters.length,
    getGroupByIndex: (index: number) => kana[index],
    getAllCharacters: () => allCharacters,
  };
}
