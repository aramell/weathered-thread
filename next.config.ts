import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Listing photos synced from Etsy (`images` in content/catalog/*/synced.ts), limited to this
    // shop's folder on Etsy's image CDN.
    remotePatterns: [
      { protocol: "https", hostname: "i.etsystatic.com", pathname: "/68094452/**", search: "" },
    ],
  },
};

export default nextConfig;
