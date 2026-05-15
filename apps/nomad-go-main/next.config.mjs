/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@nomad-go/shared-ui",
    "@nomad-go/shared-configs",
    "@nomad-go/gamification-xp",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
