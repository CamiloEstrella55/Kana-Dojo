import { KanaSnake } from '@/features/Experiments';
import type { Metadata } from 'next';
import { routing } from '@/core/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Kana Snake - Classic Snake Game | KanaDojo',
  description: 'Play the classic snake game while collecting Japanese kana!',
};

export default function SnakePage() {
  return <KanaSnake />;
}
