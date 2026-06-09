import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/auth";
import SignupForm from "./signup-form";

export const metadata = { title: "Create account" };

export default async function CustomerSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ confirm?: string }>;
}) {
  if (await getCurrentCustomer()) redirect("/account");
  const sp = await searchParams;

  if (sp.confirm === "1") {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-2xl font-display text-bone">Check your inbox</h1>
          <p className="text-bone-dim text-sm">
            We sent you a confirmation link. Open it on this device to finish
            signing up.
          </p>
          <Link href="/login" className="text-bronze hover:underline text-sm inline-block">
            Back to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-2xl font-display text-bone">Create account</h1>
          <p className="text-bone-dim text-sm mt-1">
            Track bookings and skip re-entering your info next time.
          </p>
        </div>
        <SignupForm />
        <p className="text-sm text-bone-dim">
          Already have one?{" "}
          <Link href="/login" className="text-bronze hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
