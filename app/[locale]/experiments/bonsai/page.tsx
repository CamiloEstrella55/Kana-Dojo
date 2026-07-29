import { ZenBonsai } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Zen Bonsai - Mindful Growth | KanaDojo',
  description:
    'Nurture your own digital Japanese character tree in this mindful clicker.',
};

export default function BonsaiPage() {
  return <ZenBonsai />;
}
