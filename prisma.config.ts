import { defineConfig } from "prisma/config";
import { config as dotenvConfig } from "dotenv";
import { existsSync } from "fs";

dotenvConfig({ path: existsSync(".env.local") ? ".env.local" : ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
