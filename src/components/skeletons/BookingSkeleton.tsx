export default function BookingSkeleton() {
  return (
    <div 
      className="w-full max-w-2xl mx-auto p-6 space-y-6"
      aria-label="Loading booking form..."
      role="status"
    >
      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className="h-2 flex-1 bg-gray-200 rounded animate-pulse"
            />
          ))}
        </div>
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Input Fields */}
      <div className="space-y-4">
        {[1, 2, 3].map((field) => (
          <div key={field} className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Text Area */}
      <div className="space-y-2">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-20 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Button */}
      <div className="flex gap-3">
        <div className="h-10 flex-1 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 flex-1 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}
