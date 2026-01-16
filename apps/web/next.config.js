/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@chainhopper/types', '@chainhopper/ui'],
  output: 'standalone',
  // Production optimizations
  poweredByHeader: false,
  compress: true,
  // Skip type checking during build (handled separately)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip linting during build (run separately with npm run lint)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Environment variables available at runtime
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },
  webpack: (config) => {
    // Handle wagmi/viem dependencies
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }

    // Ignore problematic optional dependencies
    config.externals.push({
      '@base-org/account': 'commonjs @base-org/account',
    })

    return config
  },
}

module.exports = nextConfig
