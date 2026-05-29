import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Image from "next/image";

export const metadata = { title: "Gallery" };

export default async function GalleryAdminPage() {
  await requireRole("admin", "editor");

  const images = await prisma.galleryImage.findMany({
    orderBy: [{ vehicleId: "asc" }, { sortOrder: "asc" }],
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
          No gallery images in the database yet. Images are seeded from the static files.
        </div>
      )}

      {Object.entries(byVehicle).map(([, imgs]) => {
        const vehicle = imgs[0]?.vehicle;
        return (
          <div key={imgs[0]?.vehicleId ?? "unknown"}>
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
    </div>
  );
}

function GalleryCard({
  img,
}: {
  img: {
    id: string;
    src: string;
    alt: string;
    published: boolean;
    isBefore: boolean;
    isAfter: boolean;
  };
}) {
  return (
    <div className={`relative group border rounded-xl overflow-hidden ${img.published ? "border-line" : "border-red-400/30 opacity-60"}`}>
      <div className="relative aspect-[4/5]">
        <Image src={img.src} alt={img.alt} fill className="object-cover" sizes="25vw" />
      </div>
      <div className="absolute inset-0 bg-ink/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
        <p className="text-bone text-xs leading-tight">{img.alt}</p>
        <div className="flex gap-1 mt-1 flex-wrap">
          {img.isBefore && <span className="text-xs bg-amber-400/20 text-amber-300 px-1.5 rounded">Before</span>}
          {img.isAfter && <span className="text-xs bg-emerald-400/20 text-emerald-300 px-1.5 rounded">After</span>}
          {!img.published && <span className="text-xs bg-red-400/20 text-red-300 px-1.5 rounded">Hidden</span>}
        </div>
      </div>
    </div>
  );
}
