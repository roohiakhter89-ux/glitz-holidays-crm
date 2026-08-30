import type { Metadata } from 'next';
import Script from 'next/script';
import { Fraunces, Inter } from 'next/font/google';
import { SITE } from '@/lib/site';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { WhatsAppFloat } from '@/components/wa-float';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  axes: ['SOFT', 'opsz'],
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.domain),
  title: {
    default: `${SITE.name} — Kashmir DMC & Himalayan Journeys`,
    template: `%s · ${SITE.name}`,
  },
  description:
    'Handcrafted Kashmir, Ladakh, Himachal & Vaishno Devi holiday packages by Srinagar-based DMC. All-inclusive itineraries, local guides, best rates. Talk to us — WhatsApp +91 70068 41384.',
  applicationName: SITE.name,
  authors: [{ name: SITE.name }],
  keywords: [
    'Kashmir tour packages',
    'Kashmir DMC',
    'Ladakh tour packages',
    'Himachal tour packages',
    'Vaishno Devi tour',
    'Srinagar travel agent',
    'Gulmarg package',
    'Sonmarg package',
    'Pahalgam holiday',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE.domain,
    siteName: SITE.name,
    title: `${SITE.name} — Kashmir DMC & Himalayan Journeys`,
    description:
      'Handcrafted Kashmir, Ladakh, Himachal & Vaishno Devi holiday packages by a Srinagar-based DMC.',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} — Kashmir DMC`,
    description:
      'Handcrafted Kashmir, Ladakh, Himachal & Vaishno Devi holiday packages by a Srinagar-based DMC.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  alternates: { canonical: SITE.domain },
};

/**
 * JSON-LD TravelAgency schema — sitewide. Emits an Organisation with
 * enough shape for Google's Knowledge Panel to attach photo, phone,
 * address & socials. Duplicate in per-page components only when adding
 * page-specific structured data (TouristTrip, FAQPage, Article).
 */
const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TravelAgency',
  '@id': `${SITE.domain}/#org`,
  name: SITE.name,
  url: SITE.domain,
  telephone: SITE.phone.tel,
  email: SITE.email,
  address: {
    '@type': 'PostalAddress',
    streetAddress: SITE.address.street,
    addressLocality: SITE.address.city,
    addressRegion: SITE.address.region,
    postalCode: SITE.address.postalCode,
    addressCountry: SITE.address.country,
  },
  sameAs: [SITE.social.instagram, SITE.social.facebook],
  areaServed: ['Jammu and Kashmir', 'Ladakh', 'Himachal Pradesh', 'India'],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body className="min-h-screen">
        {SITE.gtmId && (
          <>
            <Script id="gtm-init" strategy="afterInteractive">{`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${SITE.gtmId}');
            `}</Script>
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${SITE.gtmId}`}
                height="0"
                width="0"
                style={{ display: 'none', visibility: 'hidden' }}
              />
            </noscript>
          </>
        )}
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <WhatsAppFloat />
      </body>
    </html>
  );
}
