import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: the whole site is pre-rendered to plain files, so it can be
  // dropped on Vercel, Netlify, S3 or GitHub Pages with no server runtime.
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
