import { DailyHaiku } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Haiku Garden - Daily Japanese Poetry | KanaDojo',
  description:
    'Read and contemplate daily Haiku poems in Japanese and English.',
};

export default function HaikuPage() {
  return <DailyHaiku />;
}
