import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const customer = await prisma.customer.findUnique({
      where: { email: "probe-local@example.com" },
    });
    if (!customer) {
      console.log("no probe customer found");
      return;
    }
    const bDel = await prisma.booking.deleteMany({ where: { customerId: customer.id } });
    const vDel = await prisma.vehicle.deleteMany({ where: { customerId: customer.id } });
    const cDel = await prisma.customer.delete({ where: { id: customer.id } });
    console.log(`✓ deleted ${bDel.count} bookings, ${vDel.count} vehicles, customer ${cDel.email}`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
