import { KanaGravity } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Kana Gravity - Physics Playground | KanaDojo',
  description: 'Click to flip gravity and watch kana float and fall!',
};

export default function GravityPage() {
  return <KanaGravity />;
}
