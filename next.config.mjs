/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],  // For development
    remotePatterns: [
      // We still need these for the initial loading, before the proxy kicks in
      { protocol: 'https', hostname: 'i.gr-assets.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.gr-assets.com', pathname: '/**' },
      { protocol: 'https', hostname: 's.gr-assets.com', pathname: '/**' },
    ]
  },
  env: {
    // Set this for the image loader, with a default for development
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  },
  // Performance optimizations
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['framer-motion', 'lucide-react', '@uidotdev/usehooks'],
  },
};

export default nextConfig;
