/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      // la tienda vieja usaba /index.html
      { source: '/index.html', destination: '/', permanent: true },
    ];
  },
};

export default nextConfig;
