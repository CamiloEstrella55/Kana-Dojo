import { KanaPulse } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Kana Pulse - Fast Reflex Game | KanaDojo',
  description:
    'Test your reflexes - tap the pulsing kana before time runs out!',
};

export default function PulsePage() {
  return <KanaPulse />;
}
