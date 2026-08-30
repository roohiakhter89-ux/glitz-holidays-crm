import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // Short vanity URLs → canonical destination hubs.
      { source: '/kashmir', destination: '/destinations/kashmir', permanent: true },
      { source: '/ladakh', destination: '/destinations/ladakh', permanent: true },
      { source: '/himachal', destination: '/destinations/himachal', permanent: true },
      { source: '/vaishno-devi', destination: '/destinations/vaishno-devi', permanent: true },

      // Legacy keyword URLs people may have linked to.
      { source: '/kashmir-tour-packages', destination: '/destinations/kashmir', permanent: true },
      { source: '/ladakh-tour-packages', destination: '/destinations/ladakh', permanent: true },
      { source: '/himachal-tour-packages', destination: '/destinations/himachal', permanent: true },
      { source: '/vaishno-devi-tour-packages', destination: '/destinations/vaishno-devi', permanent: true },

      // Travel-style shorthands.
      { source: '/honeymoon', destination: '/travel-styles/honeymoon', permanent: true },
      { source: '/family', destination: '/travel-styles/family', permanent: true },
      { source: '/adventure', destination: '/travel-styles/adventure', permanent: true },
      { source: '/pilgrimage', destination: '/travel-styles/pilgrimage', permanent: true },
      { source: '/corporate', destination: '/travel-styles/group', permanent: true },

      // There is no /travel-styles index page — send it to packages, which
      // cross-links every style.
      { source: '/travel-styles', destination: '/packages', permanent: false },

      { source: '/tours', destination: '/packages', permanent: true },
      { source: '/testimonials', destination: '/reviews', permanent: true },

      // Route pages were briefly split by mode before being consolidated to
      // one page per origin-destination pair. The per-mode URLs shipped, so
      // they get 301s into the mode section on the consolidated page rather
      // than being left to 404.
      {
        source: '/routes/delhi-to-srinagar-train',
        destination: '/routes/delhi-to-srinagar#delhi-to-srinagar-train',
        permanent: true,
      },
      {
        source: '/routes/delhi-to-srinagar-flight',
        destination: '/routes/delhi-to-srinagar#delhi-to-srinagar-flight',
        permanent: true,
      },
      {
        source: '/routes/delhi-to-srinagar-road',
        destination: '/routes/delhi-to-srinagar#delhi-to-srinagar-road',
        permanent: true,
      },
    ];
  },
};

export default config;
