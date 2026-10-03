// Allow product images from dummyjson's CDN
const nextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "cdn.dummyjson.com" }] },
};
export default nextConfig;
