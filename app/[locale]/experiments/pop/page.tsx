import { KanaPop } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Kana Pop - Bubble Popping Fun | KanaDojo',
  description:
    'Pop bubbles with Japanese characters for a fun learning experience.',
};

export default function PopPage() {
  return <KanaPop />;
}
