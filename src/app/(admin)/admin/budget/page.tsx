import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { BookingStatus } from "@prisma/client";

export const metadata = { title: "Budget" };

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

async function totals(start: Date, end: Date) {
  const [revenueAgg, expenseAgg, completedCount, expenseRows] = await Promise.all([
    prisma.booking.aggregate({
      _sum: { price: true },
      where: {
        date: { gte: start, lte: end },
        status: BookingStatus.COMPLETED,
      },
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: start, lte: end } },
    }),
    prisma.booking.count({
      where: {
        date: { gte: start, lte: end },
        status: BookingStatus.COMPLETED,
      },
    }),
    prisma.expense.findMany({
      where: { date: { gte: start, lte: end } },
      select: { category: true, amount: true },
    }),
  ]);

  const revenue = revenueAgg._sum.price ?? 0;
  const expenses = expenseAgg._sum.amount ?? 0;
  const byCategory = expenseRows.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});

  return {
    revenue,
    expenses,
    net: revenue - expenses,
    completedCount,
    byCategory,
  };
}

export default async function BudgetPage({
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
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59);

  const [monthTotals, yearTotals] = await Promise.all([
    totals(monthStart, monthEnd),
    totals(yearStart, yearEnd),
  ]);

  const prevMonth = month === 0 ? { month: 11, year: year - 1 } : { month: month - 1, year };
  const nextMonth = month === 11 ? { month: 0, year: year + 1 } : { month: month + 1, year };

  const monthCategoryRows = Object.entries(monthTotals.byCategory).sort((a, b) => b[1] - a[1]);

  return (
    <div className="p-6 md:p-8 pt-20 md:pt-8 max-w-5xl mx-auto space-y-10">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-display text-bone">Budget</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link href={`/admin/budget?month=${prevMonth.month}&year=${prevMonth.year}`} className="text-bone-dim hover:text-bone transition-colors px-2">←</Link>
          <span className="text-bone">{MONTHS[month]} {year}</span>
          <Link href={`/admin/budget?month=${nextMonth.month}&year=${nextMonth.year}`} className="text-bone-dim hover:text-bone transition-colors px-2">→</Link>
        </div>
      </div>

      {/* Monthly summary */}
      <section className="space-y-3">
        <h2 className="text-bone-dim text-xs uppercase tracking-wider">This month</h2>
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard label="Made" value={monthTotals.revenue} accent="text-emerald-400" sub={`${monthTotals.completedCount} completed`} />
          <SummaryCard label="Spent" value={monthTotals.expenses} accent="text-red-400" />
          <SummaryCard
            label="Net"
            value={monthTotals.net}
            accent={monthTotals.net >= 0 ? "text-bronze" : "text-red-400"}
            sub={monthTotals.revenue > 0 ? `${Math.round((monthTotals.net / monthTotals.revenue) * 100)}% margin` : "—"}
          />
        </div>
      </section>

      {/* Bar visualization */}
      <section className="space-y-3">
        <h2 className="text-bone-dim text-xs uppercase tracking-wider">Expenses vs. revenue</h2>
        <RevenueExpenseBar revenue={monthTotals.revenue} expenses={monthTotals.expenses} />
      </section>

      {/* By category */}
      <section className="space-y-3">
        <h2 className="text-bone-dim text-xs uppercase tracking-wider">Expense breakdown</h2>
        <div className="border border-line rounded-xl p-5">
          {monthCategoryRows.length === 0 ? (
            <p className="text-bone-dim text-sm">No expenses recorded for {MONTHS[month]}.</p>
          ) : (
            <ul className="space-y-3">
              {monthCategoryRows.map(([cat, amt]) => {
                const pct = monthTotals.expenses > 0 ? (amt / monthTotals.expenses) * 100 : 0;
                return (
                  <li key={cat} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-bone">{cat}</span>
                      <span className="text-bone-dim">
                        {formatCurrency(amt)}{" "}
                        <span className="text-bone-dim/70 text-xs">· {pct.toFixed(0)}%</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-line overflow-hidden">
                      <div className="h-full bg-bronze" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Year to date */}
      <section className="space-y-3">
        <h2 className="text-bone-dim text-xs uppercase tracking-wider">Year to date · {year}</h2>
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard label="Made" value={yearTotals.revenue} accent="text-emerald-400" sub={`${yearTotals.completedCount} completed`} />
          <SummaryCard label="Spent" value={yearTotals.expenses} accent="text-red-400" />
          <SummaryCard
            label="Net"
            value={yearTotals.net}
            accent={yearTotals.net >= 0 ? "text-bronze" : "text-red-400"}
            sub={yearTotals.revenue > 0 ? `${Math.round((yearTotals.net / yearTotals.revenue) * 100)}% margin` : "—"}
          />
        </div>
      </section>

      <p className="text-bone-dim text-xs">
        Revenue counts completed bookings only.{" "}
        <Link href="/admin/expenses" className="text-bronze hover:underline">Manage expenses →</Link>
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
  sub,
}: {
  label: string;
  value: number;
  accent: string;
  sub?: string;
}) {
  return (
    <div className="border border-line rounded-xl p-5 bg-surface">
      <p className="text-bone-dim text-xs uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-display mt-2 ${accent}`}>{formatCurrency(value)}</p>
      {sub && <p className="text-bone-dim text-xs mt-1">{sub}</p>}
    </div>
  );
}

function RevenueExpenseBar({ revenue, expenses }: { revenue: number; expenses: number }) {
  const max = Math.max(revenue, expenses, 1);
  const revPct = (revenue / max) * 100;
  const expPct = (expenses / max) * 100;

  return (
    <div className="border border-line rounded-xl p-5 space-y-4">
      <Bar label="Made" amount={revenue} pct={revPct} colorClass="bg-emerald-400" />
      <Bar label="Spent" amount={expenses} pct={expPct} colorClass="bg-red-400" />
    </div>
  );
}

function Bar({ label, amount, pct, colorClass }: { label: string; amount: number; pct: number; colorClass: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-bone">{label}</span>
        <span className="text-bone-dim">{formatCurrency(amount)}</span>
      </div>
      <div className="h-2 rounded-full bg-line overflow-hidden">
        <div className={`h-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
