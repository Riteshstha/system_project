/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Removes the X-Powered-By header (minor info-disclosure reduction).
  poweredByHeader: false,
  compress: true,
};

module.exports = nextConfig;