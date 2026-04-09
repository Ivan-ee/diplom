import type { Metadata } from 'next';
import { Suspense } from 'react';
import { montserrat, openSans } from '@/lib/fonts';
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
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
