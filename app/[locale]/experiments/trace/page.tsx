import { KanaTrace } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Kana Trace - Practice Drawing | KanaDojo',
  description:
    'A relaxing playground to practice drawing Japanese kana characters.',
};

export default function TracePage() {
  return <KanaTrace />;
}
