import AdminNav from "./admin-nav";

export default function AdminShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
