import { KanaCatch } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Kana Catch - Catching Game | KanaDojo',
  description: 'Catch falling kana in your basket before they hit the ground!',
};

export default function CatchPage() {
  return <KanaCatch />;
}
