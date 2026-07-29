import { SoundGarden } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Sound Garden - Interactive Kana Sounds | KanaDojo',
  description: 'Create music and sounds using Japanese characters.',
};

export default function SoundPage() {
  return <SoundGarden />;
}
