import { KanaMagnet } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Kana Magnet - Attraction Physics | KanaDojo',
  description: 'Watch kana attracted and repelled by your cursor!',
};

export default function MagnetPage() {
  return <KanaMagnet />;
}
