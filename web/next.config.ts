import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
    ],
  },
  async redirects() {
    return [
      { source: '/kashmir', destination: '/destinations/kashmir', permanent: true },
      { source: '/ladakh', destination: '/destinations/ladakh', permanent: true },
      { source: '/himachal', destination: '/destinations/himachal', permanent: true },
      { source: '/vaishno-devi', destination: '/destinations/vaishno-devi', permanent: true },
    ];
  },
};

export default config;
