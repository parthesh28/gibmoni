import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      fs: {
        browser: './empty.ts',
      },
      crypto: {
        browser: './empty.ts',
      },
      path: {
        browser: './empty.ts',
      },
      os: {
        browser: './empty.ts',
      }
    },
  },
}

export default nextConfig