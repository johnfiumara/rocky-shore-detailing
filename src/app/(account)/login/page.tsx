import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/auth";
import LoginForm from "./login-form";

export const metadata = { title: "Sign in" };

export default async function CustomerLoginPage() {
  if (await getCurrentCustomer()) redirect("/account");

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-2xl font-display text-bone">Sign in</h1>
          <p className="text-bone-dim text-sm mt-1">
            Track and manage your detailing bookings.
          </p>
        </div>
        <LoginForm />
        <p className="text-sm text-bone-dim">
          New here?{" "}
          <Link href="/signup" className="text-bronze hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
