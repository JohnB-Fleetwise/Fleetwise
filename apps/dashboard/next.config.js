/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@fleetwise/shared"],
  reactStrictMode: true,
  experimental: {
    instrumentationHook: true,
  },
};

module.exports = nextConfig;
