/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com'],
  },
  webpack: (config) => {
    config.watchOptions = {
      ignored: [
        'C:\\DumpStack.log.tmp',
        'C:\\System Volume Information',
        'C:\\hiberfil.sys',
        'C:\\pagefile.sys',
        'C:\\swapfile.sys',
      ],
    };
    return config;
  },
};

module.exports = nextConfig;