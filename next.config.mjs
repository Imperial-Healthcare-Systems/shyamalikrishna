/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lets a verification build write somewhere else, e.g.
  //   NEXT_DIST_DIR=.next-verify npm run build
  // so it cannot clobber the .next cache a running `next dev` is serving from.
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

export default nextConfig;
