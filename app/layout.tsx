import type { Metadata } from "next";
import { ThemeProvider } from "../components/ThemeProvider/ThemeProvider";
import { AuthProvider } from "../components/Auth";
import { DataProvider } from "../lib/data/DataProvider";
import { PerformanceMonitor } from "../components/PerformanceMonitor";
import { AccessibilityProvider, SkipToContent } from "../components/AccessibilityProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Todo App - Workspace Task Manager",
  description: "A hierarchical todo application with workspace, section, and task organization",
  keywords: "todo, task management, workspace, productivity, collaboration",
  authors: [{ name: "Todo App Team" }],
  creator: "Todo App",
  publisher: "Todo App",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Todo App',
    title: 'Todo App - Workspace Task Manager',
    description: 'A hierarchical todo application with workspace, section, and task organization',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Todo App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Todo App - Workspace Task Manager',
    description: 'A hierarchical todo application with workspace, section, and task organization',
    images: ['/og-image.png'],
    creator: '@todoapp',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  const isProduction = process.env.NODE_ENV === 'production';
  const enablePerformanceMonitoring = process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true';

  return (
    <html lang="en">
      <head>
        {/* Preload critical resources */}
        <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossOrigin="" />
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        {/* Preconnect to critical origins */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        {/* Viewport meta for responsive design */}
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#1976d2" />
        {/* Manifest for PWA */}
        <link rel="manifest" href="/manifest.json" />
        {/* Apple touch icon */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body>
        <SkipToContent targetId="main-content" />
        <AccessibilityProvider>
          <ThemeProvider>
            <AuthProvider>
              <DataProvider>
                <main id="main-content" tabIndex={-1}>
                  {children}
                </main>
                {/* Performance monitoring only in production */}
                {isProduction && enablePerformanceMonitoring && (
                  <PerformanceMonitor 
                    enabled={true}
                    debug={!isProduction}
                  />
                )}
              </DataProvider>
            </AuthProvider>
          </ThemeProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
