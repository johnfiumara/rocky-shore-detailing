export default function ProcessSkeleton() {
  return (
    <div 
      className="w-full py-16 px-4"
      aria-label="Loading process steps..."
      role="status"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Title */}
        <div className="mb-12">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Process Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((card) => (
            <div 
              key={card}
              className="p-6 bg-white border border-gray-200 rounded-lg space-y-4"
            >
              {/* Card Number/Icon */}
              <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse" />
              
              {/* Card Title */}
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
              
              {/* Card Description Lines */}
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
  );
}
