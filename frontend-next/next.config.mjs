/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep src/pages as plain component files, not Pages Router routes.
  pageExtensions: ["js", "ts", "tsx"]
};

export default nextConfig;
