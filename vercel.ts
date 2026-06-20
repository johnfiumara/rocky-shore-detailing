import type { VercelConfig } from "@vercel/config/v1";

// Static export — Next.js writes the site to `out/` and Vercel serves it as
// static files. No serverless functions, no runtime env vars.
export const config: VercelConfig = {
  framework: "nextjs",
  buildCommand: "next build",
};

export default config;
