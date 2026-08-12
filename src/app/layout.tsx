import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { Providers } from './providers';
import './globals.css';

const SITE_URL = 'https://www.shyamalikrishna.com';
const SITE_NAME = 'Shyamali Krishna Automobile Private Limited';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    // Matches the old useSEO behaviour of appending the company name.
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Authorized dealer and distributor of premium agricultural machinery across Bihar — tillage, sowing, crop residue, harvesting, and post-harvest equipment.',
  openGraph: { siteName: SITE_NAME, type: 'website' },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
