import { KanaNebula } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Kana Nebula - Deep Space Exploration | KanaDojo',
  description:
    'An immersive space flight experience through Japanese character star clusters.',
};

export default function NebulaPage() {
  return <KanaNebula />;
}
