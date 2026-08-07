import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Fraunces } from 'next/font/google';
import './globals.css';

/**
 * Fraunces — a warm, hospitable serif. Used only on display headings
 * (dashboard greeting, hero numbers). Body copy stays on Geist so long tables
 * and forms remain neutral and instrumental.
 */
const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  axes: ['SOFT', 'WONK', 'opsz'],
});

export const metadata: Metadata = {
  title: 'Glitz Holidays',
  description: 'Lead, quotation and booking desk',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} ${fraunces.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
