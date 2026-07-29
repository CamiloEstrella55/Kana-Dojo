import { KanaSlot } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Kana Slot - Slot Machine Game | KanaDojo',
  description: 'Spin the slot machine and match kana to win!',
};

export default function SlotPage() {
  return <KanaSlot />;
}
