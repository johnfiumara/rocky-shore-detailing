import Link from "next/link";
import { requireCustomer } from "@/lib/auth";
import { customerLogout } from "./actions";

export const metadata = { title: "Your account" };

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireCustomer();

  const links = [
    { href: "/account", label: "Bookings" },
    { href: "/account/profile", label: "Profile" },
    { href: "/account/vehicles", label: "Vehicles" },
  ];

  return (
    <div className="min-h-screen p-6 md:p-10 max-w-4xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-display text-bone">
            Hi {session.customer.name.split(" ")[0] || "there"}
          </h1>
          <p className="text-bone-dim text-sm mt-1">{session.email}</p>
        </div>
        <form action={customerLogout}>
          <button
            type="submit"
            className="text-xs uppercase tracking-wider text-bone-dim hover:text-bronze transition-colors"
          >
            Sign out
          </button>
        </form>
      </header>

      <nav className="flex flex-wrap gap-6 border-b border-line pb-4 mb-8">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-sm text-bone-dim hover:text-bone transition-colors data-[active=true]:text-bronze"
          >
            {l.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
