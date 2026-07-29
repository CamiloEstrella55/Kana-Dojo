import { KanaWhisper } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Kana Whisper - Memory Challenge | KanaDojo',
  description: 'Remember the fading kana before it disappears!',
};

export default function WhisperPage() {
  return <KanaWhisper />;
}
