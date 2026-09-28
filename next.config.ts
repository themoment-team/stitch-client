import type { NextConfig } from "next";

// QR 주소를 PC의 IP로 바꿔 폰으로 테스트할 때, 개발 서버가 그 주소에서 오는 요청을 막지 않도록 허용
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const siteHost = siteUrl ? new URL(siteUrl).hostname : null;

const nextConfig: NextConfig = {
  allowedDevOrigins: siteHost ? [siteHost] : [],
};

export default nextConfig;
