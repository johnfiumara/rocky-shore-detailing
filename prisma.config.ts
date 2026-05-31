import { defineConfig } from "prisma/config";
import { config as dotenvConfig } from "dotenv";

dotenvConfig({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
