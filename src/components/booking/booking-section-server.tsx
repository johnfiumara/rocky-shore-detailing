import { getCurrentCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookingSectionClient } from "./booking-section-client";
import type { CustomerSummary, RebookPayload, VehicleSummary } from "./types";

export async function BookingSectionServer({
  rebookId,
}: {
  rebookId?: string;
}) {
  const session = await getCurrentCustomer().catch(() => null);

  let customer: CustomerSummary | null = null;
  let vehicles: VehicleSummary[] = [];
  let rebook: RebookPayload | null = null;

  if (session) {
    customer = {
      id: session.customer.id,
      name: session.customer.name,
      email: session.customer.email,
      phone: session.customer.phone,
      address: session.customer.address,
      city: session.customer.city,
      zip: session.customer.zip,
    };

    const dbVehicles = await prisma.vehicle.findMany({
      where: { customerId: session.customer.id },
      select: {
        id: true,
        year: true,
        make: true,
        model: true,
        color: true,
        isDefault: true,
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    vehicles = dbVehicles;
  }

  if (rebookId && session) {
    const booking = await prisma.booking.findUnique({
      where: { id: rebookId },
      include: { vehicle: true },
    });
    if (
      booking &&
      booking.customerId === session.customer.id &&
      booking.vehicle
    ) {
      rebook = {
        serviceSlug: booking.serviceSlug,
        vehicle: {
          id: booking.vehicle.id,
          year: booking.vehicle.year,
          make: booking.vehicle.make,
          model: booking.vehicle.model,
          color: booking.vehicle.color,
          isDefault: booking.vehicle.isDefault,
        },
      };
    }
  }

  return (
    <BookingSectionClient
      customer={customer}
      vehicles={vehicles}
      rebook={rebook}
    />
  );
}
