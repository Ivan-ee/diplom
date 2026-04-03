import type { Metadata } from 'next';
import { montserrat, openSans } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Кондитерская — торты на заказ с 3D-конструктором',
  description:
    'Интернет-магазин кондитерской в Арзамасе. Закажите торт из каталога или соберите уникальный торт в 3D-конструкторе.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${montserrat.variable} ${openSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
