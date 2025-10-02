import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    incomingRequests: {
      ignore: [
        /\/api\/(orders|foodwarmer|preparations|waste)$/  // Ignore polling endpoints
      ]
    }
  }
};

export default nextConfig;
