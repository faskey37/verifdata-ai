/** @type {import('next').NextConfig} */
const nextConfig = {
  // Important for Vercel
  output: 'standalone',
  
  // Disable static export (use server features)
  reactStrictMode: true,
  
  // Ensure proper handling
  swcMinify: true,
  
  // Images
  images: {
    unoptimized: false,
  },
  
  // Clean build output
  distDir: '.next',
  
  // Environment variables
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || 'development',
  },
}

module.exports = nextConfig