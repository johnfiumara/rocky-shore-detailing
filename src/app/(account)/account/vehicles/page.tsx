import { requireCustomer } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Star } from "lucide-react";
import { VehicleForm } from "./vehicle-form";
import { SetDefaultButton } from "./set-default-button";
import { DeleteVehicleButton } from "./delete-vehicle-button";
import { EmptyState } from "@/components/ui";

export const metadata = { title: "Vehicles" };

export default async function VehiclesPage() {
  const session = await requireCustomer();

  const vehicles = await prisma.vehicle.findMany({
    where: { customerId: session.customer.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h2 className="text-bone-dim text-xs uppercase tracking-wider">
          Your vehicles
        </h2>
        {vehicles.length === 0 ? (
          <EmptyState>
            No saved vehicles yet. Add one below to speed up your next booking.
          </EmptyState>
        ) : (
          <ul className="grid gap-3">
            {vehicles.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between border border-line rounded-xl p-4"
              >
                <div>
                  <div className="flex items-center gap-2 text-bone text-sm">
                    <span>
                      {v.year} {v.make} {v.model}
                    </span>
                    {v.isDefault && (
                      <span className="inline-flex items-center gap-1 text-[10px] tracking-wider uppercase text-bronze">
                        <Star size={10} /> Default
                      </span>
                    )}
                  </div>
                  <div className="text-bone-dim text-xs mt-0.5">{v.color}</div>
                </div>
                <div className="flex items-center gap-4">
                  {!v.isDefault && <SetDefaultButton vehicleId={v.id} />}
                  <DeleteVehicleButton vehicleId={v.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <VehicleForm />
    </div>
  );
}
