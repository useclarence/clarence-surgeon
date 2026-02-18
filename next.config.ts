import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    devIndicators: false,
    serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg'],
};

export default nextConfig;
