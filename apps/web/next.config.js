/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@chainhopper/types', '@chainhopper/ui'],
  output: 'standalone',
  // Production optimizations
  poweredByHeader: false,
  compress: true,
  // Environment variables available at runtime
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },
}

module.exports = nextConfig
