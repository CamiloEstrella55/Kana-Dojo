import { KanaZen } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Kana Zen - Peaceful Floating Characters | KanaDojo',
  description: 'Relax with gently floating kana in a peaceful atmosphere.',
};

export default function KanaZenPage() {
  return <KanaZen />;
}
