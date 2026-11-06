/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    // fotos subidas desde el admin (Supabase Storage)
    remotePatterns: [{ protocol: 'https', hostname: 'dprucbhidjusmxrmhcqw.supabase.co', pathname: '/storage/v1/object/public/**' }],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 480, 640, 828, 1080, 1440, 1920],
    imageSizes: [160, 240, 320],
    // cada foto tiene un nombre único (id + fecha), así que nunca cambia: se guarda en caché un año
    minimumCacheTTL: 31536000,
  },
  async redirects() {
    return [
      // la tienda vieja usaba /index.html
      { source: '/index.html', destination: '/', permanent: true },
    ];
  },
};

export default nextConfig;
