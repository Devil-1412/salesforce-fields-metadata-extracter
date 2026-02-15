/** @type {import('next').NextConfig} */
import withBundleAnalyzer from '@next/bundle-analyzer';
const isAnalyze = process.env.ANALYZE === 'true';

export default withBundleAnalyzer({
  enabled: isAnalyze,
})({
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  webpack(config) {
    // Add @svgr loader fallback for Webpack (if not using Turbopack)
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },

  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },

  webpack(config) {
    // Add @svgr loader fallback for Webpack (if not using Turbopack)
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
});
