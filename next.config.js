const withNextIntl = require('next-intl/plugin')('./i18n.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: [
        'waytofutureua.org.ua',
        'www.waytofutureua.org.ua',
        '*.waytofutureua.org.ua',
        'secure.wayforpay.com', // Allow WayForPay redirect
        'localhost:3000', // Development
      ],
    },
  },
}

module.exports = withNextIntl(nextConfig)
