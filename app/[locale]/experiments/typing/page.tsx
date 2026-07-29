import { SpeedTyping } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Speed Typing - Romaji Typing Practice | KanaDojo',
  description: 'Test your typing speed with Japanese Romaji.',
};

export default function TypingPage() {
  return <SpeedTyping />;
}
