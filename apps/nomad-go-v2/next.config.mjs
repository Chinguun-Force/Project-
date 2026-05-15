/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@nomad-go/shared-ui", "@nomad-go/shared-configs"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
