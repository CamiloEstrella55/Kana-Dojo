import { KanaShadow } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Kana Shadow - Guess the Silhouette | KanaDojo',
  description: 'Can you identify the kana from its blurred silhouette?',
};

export default function ShadowPage() {
  return <KanaShadow />;
}
