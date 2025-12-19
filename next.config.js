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
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://secure.wayforpay.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://secure.wayforpay.com https://*.supabase.co wss://*.supabase.co",
              "frame-src 'self' https://secure.wayforpay.com",
              "form-action 'self' https://secure.wayforpay.com",
            ].join('; '),
          },
          {
            key: 'Permissions-Policy',
            value: 'payment=(self "https://secure.wayforpay.com")',
          },
        ],
      },
    ]
  },
}

module.exports = withNextIntl(nextConfig)
