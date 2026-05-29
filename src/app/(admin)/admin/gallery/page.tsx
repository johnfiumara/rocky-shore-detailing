import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import GalleryCard from "./gallery-card";
import GalleryReorder from "./gallery-reorder";

export const metadata = { title: "Gallery" };

export default async function GalleryAdminPage() {
  await requireRole("admin", "editor");

  const images = await prisma.galleryImage.findMany({
    orderBy: [{ sortOrder: "asc" }],
    include: { vehicle: true },
  });

  const ungrouped = images.filter((i) => !i.vehicleId);
  const byVehicle = images
    .filter((i) => i.vehicleId)
    .reduce<Record<string, typeof images>>((acc, img) => {
      const key = img.vehicleId!;
      (acc[key] ??= []).push(img);
      return acc;
    }, {});

  return (
    <div className="p-6 md:p-8 pt-20 md:pt-8 max-w-5xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-bone">Gallery</h1>
        <p className="text-bone-dim text-sm">{images.length} images</p>
      </div>

      {images.length === 0 && (
        <div className="border border-line rounded-xl p-8 text-center text-bone-dim text-sm">
          No gallery images in the database yet.
        </div>
      )}

      {Object.entries(byVehicle).map(([vehicleId, imgs]) => {
        const vehicle = imgs[0]?.vehicle;
        return (
          <div key={vehicleId}>
            {vehicle && (
              <h2 className="text-bone-dim text-xs uppercase tracking-wider mb-4">
                {vehicle.year} {vehicle.make} {vehicle.model} · {vehicle.color}
              </h2>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {imgs.map((img) => (
                <GalleryCard key={img.id} img={img} />
              ))}
            </div>
          </div>
        );
      })}

      {ungrouped.length > 0 && (
        <div>
          <h2 className="text-bone-dim text-xs uppercase tracking-wider mb-4">Unassigned</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {ungrouped.map((img) => (
              <GalleryCard key={img.id} img={img} />
            ))}
          </div>
        </div>
      )}

      <GalleryReorder images={images.map((i) => ({ id: i.id, sortOrder: i.sortOrder }))} />
    </div>
  );
}

