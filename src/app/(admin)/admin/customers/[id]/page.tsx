import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Customer Detail" };

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      vehicles: true,
      bookings: {
        orderBy: { date: "desc" },
        include: { vehicle: true },
      },
    },
  });

  if (!customer) notFound();

  return (
    <div className="p-6 md:p-8 pt-20 md:pt-8 max-w-3xl mx-auto space-y-8">
      <Link href="/admin/customers" className="text-bone-dim hover:text-bone text-sm transition-colors">
        ← Customers
      </Link>

      <div>
        <h1 className="text-2xl font-display text-bone">{customer.name}</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-bone-dim text-sm">
          <span>{customer.email}</span>
          {customer.phone && <span>{customer.phone}</span>}
          {customer.city && <span>{customer.city}, ME {customer.zip}</span>}
        </div>
      </div>

      {/* Vehicles */}
      {customer.vehicles.length > 0 && (
        <div>
          <h2 className="text-bone-dim text-xs uppercase tracking-wider mb-3">Vehicles</h2>
          <div className="space-y-2">
            {customer.vehicles.map((v) => (
              <div key={v.id} className="border border-line rounded-xl px-4 py-3 text-sm">
                <span className="text-bone">{v.year} {v.make} {v.model}</span>
                <span className="text-bone-dim ml-2">· {v.color}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="border border-line rounded-xl p-4">
        <p className="text-bone-dim text-xs uppercase tracking-wider mb-2">Notes</p>
        <p className="text-bone text-sm whitespace-pre-wrap">{customer.notes || "—"}</p>
      </div>

      {/* Booking history */}
      <div>
        <h2 className="text-bone-dim text-xs uppercase tracking-wider mb-3">Booking History</h2>
        <div className="border border-line rounded-xl overflow-hidden">
          {customer.bookings.length === 0 ? (
            <p className="text-bone-dim text-sm p-4">No bookings.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider">Service</th>
                  <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {customer.bookings.map((b) => (
                  <tr key={b.id} className="border-b border-line last:border-0 hover:bg-surface/50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/bookings/${b.id}`} className="hover:text-bronze transition-colors">
                        {formatDate(b.date)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-bone-dim capitalize">{b.serviceSlug.replace(/-/g, " ")}</td>
                    <td className="px-4 py-3 text-bone-dim capitalize">{b.status.toLowerCase().replace(/_/g, " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
