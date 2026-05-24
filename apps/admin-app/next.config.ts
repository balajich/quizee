import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@quizee/types", "@quizee/api-client"],
}

export default nextConfig
