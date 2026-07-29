import { MemoryPalace } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Memory Palace - Spatial Memory Game | KanaDojo',
  description: 'Test your spatial memory with Japanese characters.',
};

export default function MemoryPage() {
  return <MemoryPalace />;
}
