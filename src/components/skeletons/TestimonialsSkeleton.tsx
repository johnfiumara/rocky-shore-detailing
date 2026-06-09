export default function TestimonialsSkeleton() {
  return (
    <div 
      className="w-full py-12 px-4"
      aria-label="Loading testimonials..."
      role="status"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Title */}
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-4 w-80 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Marquee Skeleton - Cards in a row */}
        <div className="overflow-hidden">
          <div className="flex gap-6">
            {[1, 2, 3].map((card) => (
              <div 
                key={card}
                className="flex-shrink-0 w-96 p-6 bg-white border border-gray-200 rounded-lg space-y-4"
              >
                {/* Avatar and Name */}
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>

                {/* Review Stars */}
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div
                      key={star}
                      className="h-4 w-4 bg-gray-200 rounded animate-pulse"
                    />
                  ))}
                </div>

                {/* Testimonial Text */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
