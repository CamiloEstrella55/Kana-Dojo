import { KanaClock } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Kana Clock - Japanese Time Display | KanaDojo',
  description: 'A beautiful analog clock with Japanese kana for numbers!',
};

export default function ClockPage() {
  return <KanaClock />;
}
