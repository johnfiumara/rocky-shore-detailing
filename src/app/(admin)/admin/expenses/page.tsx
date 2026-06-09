import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDate, formatCurrency } from "@/lib/format";
import ExpenseForm from "./expense-form";
import DeleteExpenseButton from "./delete-button";

export const metadata = { title: "Expenses" };

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  await requireRole("admin", "editor");

  const sp = await searchParams;
  const now = new Date();
  const year = parseInt(sp.year ?? "") || now.getFullYear();
  const month = sp.month !== undefined ? parseInt(sp.month) : now.getMonth();

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

  const expenses = await prisma.expense.findMany({
    where: { date: { gte: monthStart, lte: monthEnd } },
    orderBy: { date: "desc" },
  });

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});
  const categoryRows = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  const prevMonth = month === 0 ? { month: 11, year: year - 1 } : { month: month - 1, year };
  const nextMonth = month === 11 ? { month: 0, year: year + 1 } : { month: month + 1, year };

  return (
    <div className="p-6 md:p-8 pt-20 md:pt-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-display text-bone">Expenses</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link href={`/admin/expenses?month=${prevMonth.month}&year=${prevMonth.year}`} className="text-bone-dim hover:text-bone transition-colors px-2">←</Link>
          <span className="text-bone">{MONTHS[month]} {year}</span>
          <Link href={`/admin/expenses?month=${nextMonth.month}&year=${nextMonth.year}`} className="text-bone-dim hover:text-bone transition-colors px-2">→</Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="border border-line rounded-xl p-5 bg-surface">
          <p className="text-bone-dim text-xs uppercase tracking-wider">Total this month</p>
          <p className="text-3xl font-display text-bronze mt-2">{formatCurrency(total)}</p>
          <p className="text-bone-dim text-xs mt-1">{expenses.length} {expenses.length === 1 ? "entry" : "entries"}</p>
        </div>
        <div className="border border-line rounded-xl p-5">
          <p className="text-bone-dim text-xs uppercase tracking-wider mb-3">By category</p>
          {categoryRows.length === 0 ? (
            <p className="text-bone-dim text-sm">No expenses yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {categoryRows.map(([cat, amt]) => (
                <li key={cat} className="flex justify-between text-sm">
                  <span className="text-bone">{cat}</span>
                  <span className="text-bone-dim">{formatCurrency(amt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ExpenseForm />

      <div className="border border-line rounded-xl overflow-hidden">
        {expenses.length === 0 ? (
          <p className="text-bone-dim text-sm p-6">No expenses recorded for this month.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider hidden sm:table-cell">Category</th>
                <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider hidden md:table-cell">Vendor</th>
                <th className="px-4 py-3 text-bone-dim font-normal text-xs uppercase tracking-wider text-right">Amount</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b border-line last:border-0 hover:bg-surface/50">
                  <td className="px-4 py-3 text-bone-dim whitespace-nowrap">{formatDate(e.date)}</td>
                  <td className="px-4 py-3 text-bone">
                    {e.description}
                    {e.notes && <p className="text-bone-dim text-xs mt-0.5">{e.notes}</p>}
                  </td>
                  <td className="px-4 py-3 text-bone-dim hidden sm:table-cell">{e.category}</td>
                  <td className="px-4 py-3 text-bone-dim hidden md:table-cell">{e.vendor ?? "—"}</td>
                  <td className="px-4 py-3 text-bone text-right whitespace-nowrap">{formatCurrency(e.amount)}</td>
                  <td className="px-4 py-3 text-right">
                    <DeleteExpenseButton id={e.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
