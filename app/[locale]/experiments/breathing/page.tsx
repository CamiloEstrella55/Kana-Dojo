import { BreathingExercise } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Breathing Exercise - Relax with Kana | KanaDojo',
  description:
    'Guided breathing exercises synchronized with Japanese characters.',
};

export default function BreathingPage() {
  return <BreathingExercise />;
}
