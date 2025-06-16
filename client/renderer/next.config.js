/** @type {import('next').NextConfig} */
module.exports = {
  output: 'export',
  distDir: process.env.NODE_ENV === 'production' ? '../app' : '.next',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    return config
  },
  async rewrites() {
    return [
      {
        source: '/api/stats',
        destination: 'http://peerlink.ceng.metu.edu.tr:8080/stats',
      },
    ];
  },
}
