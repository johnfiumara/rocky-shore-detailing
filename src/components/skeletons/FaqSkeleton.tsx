export default function FaqSkeleton() {
  return (
    <div 
      className="w-full py-12 px-4"
      aria-label="Loading FAQ section..."
      role="status"
    >
      <div className="max-w-2xl mx-auto">
        {/* Section Title */}
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-4 w-80 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Accordion Items */}
        <div className="space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <div 
              key={item}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Accordion Header */}
              <div className="p-4 flex items-center justify-between bg-gray-50">
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse flex-shrink-0 ml-4" />
              </div>

              {/* Accordion Content (collapsed state appearance) */}
              <div className="hidden p-4 bg-white space-y-2">
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
