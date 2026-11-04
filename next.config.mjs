/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverComponentsExternalPackages: ["pg"] },
  // Old v0.1 addresses keep working.
  async redirects() {
    return [
      { source: "/haircuts", destination: "/cuts", permanent: false },
      { source: "/transactions", destination: "/money", permanent: false },
      { source: "/budget", destination: "/money/budget", permanent: false },
      { source: "/goals", destination: "/money/goals", permanent: false },
      { source: "/insights", destination: "/", permanent: false },
      { source: "/import-export", destination: "/settings", permanent: false },
    ];
  },
};
export default nextConfig;
