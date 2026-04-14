/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    strict: true,
  },
  headers: async () => {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },
  i18n: {
    locales: ['he'],
    defaultLocale: 'he',
  },
  compress: true,
  swcMinify: true,
};

module.exports = nextConfig;
