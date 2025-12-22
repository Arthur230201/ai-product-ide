/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // 增加 Server Actions 的 body 大小限制，支持大文件（PDF、视频等）
      // 100MB = 104857600 字节
      // 确保 14MB 文件能正常上传
      bodySizeLimit: 104857600,
    },
  },
};

module.exports = nextConfig;

