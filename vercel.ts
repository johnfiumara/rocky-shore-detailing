import type { VercelConfig } from "@vercel/config/v1";

// Minimal config. Framework auto-detection is reliable for Next.js, but we
// pin it explicitly so a future framework swap is loud. Security/cache
// headers live in next.config.ts so they apply identically on any host.
export const config: VercelConfig = {
  framework: "nextjs",
  buildCommand: "prisma generate && next build",
};

export default config;
