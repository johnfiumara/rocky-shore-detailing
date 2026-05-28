import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import LoginForm from "./login-form";

export const metadata = { title: "Admin Login · Rocky Shore Detailing" };

export default async function LoginPage() {
  const ok = await getSession();
  if (ok) redirect("/admin");

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-2xl text-bone">Rocky Shore</p>
          <p className="text-bone-dim text-sm mt-1">Admin Dashboard</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
