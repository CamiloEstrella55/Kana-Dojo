import { FlashRush } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Flash Rush - Speed Identification | KanaDojo',
  description:
    'Test your Japanese character recognition speed in this fast-paced game.',
};

export default function RushPage() {
  return <FlashRush />;
}
