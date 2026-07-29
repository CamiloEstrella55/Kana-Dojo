import { KanaBounce } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Kana Bounce - Physics Playground | KanaDojo',
  description: 'Click to spawn bouncing kana with realistic physics!',
};

export default function BouncePage() {
  return <KanaBounce />;
}
