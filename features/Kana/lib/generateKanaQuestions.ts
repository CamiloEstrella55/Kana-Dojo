import { Random } from 'random-js';
import type { KanaCharacter } from './flattenKanaGroup';

const random = new Random();
export type { KanaCharacter } from './flattenKanaGroup';

export function generateKanaQuestion(
  selectedKana: KanaCharacter[],
): KanaCharacter {
  if (selectedKana.length === 0) {
    throw new Error('No kana selected');
  }

  const randomIndex = random.integer(0, selectedKana.length - 1);
  return selectedKana[randomIndex];
}
