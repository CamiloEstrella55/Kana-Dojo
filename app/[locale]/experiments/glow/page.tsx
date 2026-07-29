import { KanaGlow } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Kana Glow - Interactive Light Display | KanaDojo',
  description: 'Watch kana illuminate as you move your cursor.',
};

export default function GlowPage() {
  return <KanaGlow />;
}
