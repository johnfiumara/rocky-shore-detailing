import { requireRole } from "@/lib/auth";
import Link from "next/link";
import NewBookingForm from "./new-booking-form";

export const metadata = { title: "New Booking" };

export default async function NewBookingPage() {
  await requireRole("admin");

  return (
    <div className="p-6 md:p-8 pt-20 md:pt-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/bookings" className="text-bone-dim hover:text-bone text-sm transition-colors">
          ← Bookings
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-display text-bone">New booking</h1>
        <p className="text-bone-dim text-sm mt-1">Manually add an appointment to the schedule.</p>
      </div>

      <NewBookingForm />
    </div>
  );
}
