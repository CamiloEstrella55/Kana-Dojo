import { KanaWave } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Kana Wave - Rhythmic Learning | KanaDojo',
  description: 'Catch the Japanese characters in sync with the rhythm.',
};

export default function WavePage() {
  return <KanaWave />;
}
