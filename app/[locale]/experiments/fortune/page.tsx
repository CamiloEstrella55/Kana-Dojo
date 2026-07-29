import { KanaFortune } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Kana Fortune - Spin the Wheel | KanaDojo',
  description: 'Spin the fortune wheel and receive your daily kana fortune!',
};

export default function FortunePage() {
  return <KanaFortune />;
}
