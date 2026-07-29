import { KanaMirror } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Kana Mirror - Match Hiragana with Katakana | KanaDojo',
  description: 'Match hiragana characters with their katakana equivalents.',
};

export default function MirrorPage() {
  return <KanaMirror />;
}
