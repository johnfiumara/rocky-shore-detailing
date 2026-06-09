import { requireCustomer } from "@/lib/auth";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await requireCustomer();

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-bone-dim text-xs uppercase tracking-wider">
          Profile
        </h2>
        <p className="text-bone-dim text-sm mt-1">
          This info is used to pre-fill your bookings.
        </p>
      </div>
      <ProfileForm customer={session.customer} />
    </section>
  );
}
