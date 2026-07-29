import { KanaDNA } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Kana DNA - Double Helix Animation | KanaDojo',
  description: 'Watch a mesmerizing double helix of rotating kana!',
};

export default function DNAPage() {
  return <KanaDNA />;
}
