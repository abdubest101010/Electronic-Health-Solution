/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    // Explicitly override watchOptions to exclude problematic system paths
    config.watchOptions = {
      ignored: [
        '**/node_modules/**',
        '**/.next/**',
        '**/.git/**',
        '**/*.log',
        '**/*.tmp',
        '**/.DS_Store',
      ],
    };
    return config;
  },
};

module.exports = nextConfig;