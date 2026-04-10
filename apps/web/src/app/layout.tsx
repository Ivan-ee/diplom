import type { Metadata } from 'next';
import { Suspense } from 'react';
import { manrope, cormorant } from '@/lib/fonts';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { AuthParamHandler } from '@/components/auth/AuthParamHandler';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from 'sonner';
import { shopConfig } from '@/config/shop.config';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: `${shopConfig.name} — ${shopConfig.tagline}`,
    template: `%s | ${shopConfig.name}`,
  },
  description: shopConfig.description,
  openGraph: {
    title: shopConfig.name,
    description: shopConfig.description,
    siteName: shopConfig.name,
    locale: 'ru_RU',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${manrope.variable} ${cormorant.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg focus:text-[var(--color-graphite)] focus:ring-2 focus:ring-[var(--color-caramel)]"
        >
          Перейти к содержимому
        </a>
        <AuthProvider>
          {/* Suspense required because AuthParamHandler uses useSearchParams */}
          <Suspense fallback={null}>
            <AuthParamHandler />
          </Suspense>
          <Header />
          <main id="main-content" className="flex-1"><ErrorBoundary>{children}</ErrorBoundary></main>
          <Footer />
        </AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'bg-[var(--color-warm-ivory)] border border-[var(--color-champagne)] text-[var(--color-graphite)] shadow-lg rounded-xl',
            descriptionClassName: 'text-[var(--color-graphite-light)]',
          }}
        />
      </body>
    </html>
  );
}
