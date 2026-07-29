import { KanaRain } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Kana Rain - Matrix Style Japanese Characters | KanaDojo',
  description: 'Watch Japanese characters fall in a digital rain effect.',
};

export default function RainPage() {
  return <KanaRain />;
}
