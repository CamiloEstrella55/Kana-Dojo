import { KanaOrbit } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Kana Orbit - Mesmerizing Orbital Characters | KanaDojo',
  description: 'Watch kana characters orbit in mesmerizing concentric circles.',
};

export default function OrbitPage() {
  return <KanaOrbit />;
}
