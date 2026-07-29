import { Hanabi } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Hanabi - Kana Fireworks | KanaDojo',
  description:
    'Launch beautiful Japanese character fireworks in the night sky.',
};

export default function HanabiPage() {
  return <Hanabi />;
}
