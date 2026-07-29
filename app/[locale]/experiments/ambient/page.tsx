import { AmbientMode } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Ambient Mode - Floating Kana Atmosphere | KanaDojo',
  description: 'Relax with floating Japanese characters in ambient mode.',
};

export default function AmbientPage() {
  return <AmbientMode />;
}
