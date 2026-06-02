import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { Pagination, parsePageParams } from "../_components/pagination";

export const metadata = { title: "Customers" };

type SearchParams = { page?: string; pageSize?: string };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRole("admin");
  const params = await searchParams;
  const { page, pageSize, skip, take } = parsePageParams(params);

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { bookings: true } },
        bookings: { orderBy: { date: "desc" }, take: 1 },
      },
      skip,
      take,
    }),
    prisma.customer.count(),
  ]);

  return (
    <div className="p-6 md:p-8 pt-20 md:pt-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-display text-bone">Customers</h1>

      <div className="border border-line rounded-xl overflow-hidden">
        {customers.length === 0 ? (
          <p className="text-bone-dim text-sm p-6">No customers yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider">Bookings</th>
                <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider hidden md:table-cell">Last Job</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0 hover:bg-surface/50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/customers/${c.id}`} className="hover:text-bronze transition-colors">
                      {c.name}
                    </Link>
                    {c.city && <p className="text-bone-dim text-xs">{c.city}</p>}
                  </td>
                  <td className="px-4 py-3 text-bone-dim hidden sm:table-cell">{c.email}</td>
                  <td className="px-4 py-3 text-bone-dim">{c._count.bookings}</td>
                  <td className="px-4 py-3 text-bone-dim hidden md:table-cell">
                    {c.bookings[0] ? formatDate(c.bookings[0].date) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination basePath="/admin/customers" page={page} pageSize={pageSize} total={total} />
    </div>
  );
}
