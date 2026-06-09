import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local" });

// Mirror src/lib/prisma.ts so we exercise the same client config
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

async function main() {
  console.log("DATABASE_URL host:", new URL(process.env.DATABASE_URL!).host);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter, log: ["error", "warn"] });

  try {
    const customerCount = await prisma.customer.count();
    console.log("✓ customer count:", customerCount);

    const sample = await prisma.customer.findFirst({ orderBy: { createdAt: "desc" } });
    console.log("✓ latest customer:", sample?.email, sample?.createdAt);

    console.log("\nAttempting upsert + booking write (same path as /api/booking)...");
    const customer = await prisma.customer.upsert({
      where: { email: "probe-local@example.com" },
      update: { name: "Probe Local" },
      create: {
        name: "Probe Local",
        email: "probe-local@example.com",
        phone: "555-0000",
        address: "1 Probe Ln",
        city: "Portland",
        zip: "04101",
      },
    });
    console.log("✓ customer upsert:", customer.id);

    const vehicle = await prisma.vehicle.upsert({
      where: {
        customerId_year_make_model_color: {
          customerId: customer.id,
          year: 2020,
          make: "Honda",
          model: "Civic",
          color: "Blue",
        },
      },
      update: {},
      create: {
        customerId: customer.id,
        year: 2020,
        make: "Honda",
        model: "Civic",
        color: "Blue",
      },
    });
    console.log("✓ vehicle upsert:", vehicle.id);

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        vehicleId: vehicle.id,
        serviceSlug: "refresh",
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        timeWindow: "morning",
        notes: "LOCAL PROBE — safe to delete",
      },
    });
    console.log("✓ booking create:", booking.id);
    console.log("\nLOCAL DB WRITE WORKS. The issue is the Netlify environment, not the code or DB.");
  } catch (err) {
    console.error("\n✗ failed:", err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
