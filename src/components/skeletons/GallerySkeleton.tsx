export default function GallerySkeleton() {
  return (
    <div 
      className="w-full py-12 px-4"
      aria-label="Loading gallery..."
      role="status"
    >
      <div className="max-w-4xl mx-auto">
        {/* Section Title */}
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-4 w-80 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Main Image Carousel */}
        <div className="space-y-4">
          {/* Image Container */}
          <div className="relative w-full aspect-video bg-gray-200 rounded-lg animate-pulse overflow-hidden">
            {/* Before/After Label */}
            <div className="absolute top-4 left-4">
              <div className="h-6 w-24 bg-gray-300 rounded animate-pulse" />
            </div>
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((dot) => (
              <div
                key={dot}
                className="h-3 w-3 bg-gray-200 rounded-full animate-pulse"
              />
            ))}
          </div>

          {/* Thumbnail Strip */}
          <div className="flex gap-2 overflow-x-auto mt-6">
            {[1, 2, 3, 4].map((thumb) => (
              <div
                key={thumb}
                className="h-20 w-32 flex-shrink-0 bg-gray-200 rounded animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
