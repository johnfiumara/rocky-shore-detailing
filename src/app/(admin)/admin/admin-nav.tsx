"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "./actions";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Image,
  FileText,
  LogOut,
  Menu,
  X,
  Images,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/admin/bookings", label: "Bookings", icon: FileText },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/gallery", label: "Gallery", icon: Image },
  { href: "/admin/media", label: "Media", icon: Images },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/users", label: "Users", icon: ShieldCheck },
];

export default function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const navLinks = (
    <nav className="flex flex-col gap-1 flex-1">
      {NAV.map(({ href, label, icon: Icon, exact }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
            isActive(href, exact)
              ? "bg-bronze/10 text-bronze"
              : "text-bone-dim hover:text-bone hover:bg-surface"
          }`}
        >
          <Icon size={16} />
          {label}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 py-3 bg-ink border-b border-line">
        <span className="font-display text-bone text-lg">Rocky Shore Admin</span>
        <button onClick={() => setOpen((v) => !v)} className="text-bone p-1">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30 pt-14 bg-ink/95 backdrop-blur-md px-4 py-6 flex flex-col gap-6">
          {navLinks}
          <form action={logout}>
            <button className="flex items-center gap-3 px-3 py-2.5 text-sm text-bone-dim hover:text-bone w-full">
              <LogOut size={16} /> Sign out
            </button>
          </form>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-line bg-ink shrink-0 p-4 gap-6 sticky top-0 h-screen">
        <div className="px-3 py-2">
          <p className="font-display text-bone text-sm">Rocky Shore</p>
          <p className="text-bone-dim text-xs mt-0.5">Admin</p>
        </div>

        {navLinks}

        <form action={logout}>
          <button className="flex items-center gap-3 px-3 py-2.5 text-sm text-bone-dim hover:text-bone w-full rounded-lg hover:bg-surface transition-colors">
            <LogOut size={16} /> Sign out
          </button>
        </form>
      </aside>
    </>
  );
}


