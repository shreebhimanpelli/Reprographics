const fs = require("fs");
const path = require("path");

function copyPdfWorker() {
  const src = path.join(__dirname, "node_modules/pdfjs-dist/build/pdf.worker.min.js");
  const dest = path.join(__dirname, "public/pdf.worker.min.js");
  if (fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

copyPdfWorker();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['images.unsplash.com', 'lh3.googleusercontent.com', 'drive.google.com'],
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    copyPdfWorker();
    return config;
  },
};

module.exports = nextConfig;
