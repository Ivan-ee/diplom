import type { Metadata } from 'next';
import { Suspense } from 'react';
import { montserrat, openSans } from '@/lib/fonts';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { AuthParamHandler } from '@/components/auth/AuthParamHandler';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import './globals.css';

export const metadata: Metadata = {
  title: 'Кондитерская — торты на заказ с 3D-конструктором',
  description:
    'Интернет-магазин кондитерской в Арзамасе. Закажите торт из каталога или соберите уникальный торт в 3D-конструкторе.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${montserrat.variable} ${openSans.variable}`}>
      <body className="flex min-h-screen flex-col">
        <AuthProvider>
          {/* Suspense required because AuthParamHandler uses useSearchParams */}
          <Suspense fallback={null}>
            <AuthParamHandler />
          </Suspense>
          <Header />
          <main className="flex-1"><ErrorBoundary>{children}</ErrorBoundary></main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
