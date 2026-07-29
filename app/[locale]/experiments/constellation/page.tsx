import { KanaConstellation } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Constellation - Connect Kana Stars | KanaDojo',
  description:
    'Connect the stars to form Japanese characters in this relaxing mode.',
};

export default function ConstellationPage() {
  return <KanaConstellation />;
}
