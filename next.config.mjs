/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.VERCEL ? undefined : "voyage-dist",
};

export default nextConfig;
