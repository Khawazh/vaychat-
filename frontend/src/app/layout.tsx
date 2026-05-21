import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'ВайЧат — современный мессенджер',
  description: 'Быстрый, безопасный мессенджер',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ВайЧат',
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0a',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="min-h-screen min-h-[100dvh] antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}