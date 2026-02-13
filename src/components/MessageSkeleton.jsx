export default function MessageSkeleton() {
  return (
    <div className="space-y-6 p-4 animate-pulse">
      {/* User message skeleton */}
      <div className="flex justify-end">
        <div className="max-w-[70%] space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-32 ml-auto" />
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl rounded-tr-md p-4 space-y-2">
            <div className="h-3 bg-blue-100 dark:bg-blue-800/30 rounded w-48" />
            <div className="h-3 bg-blue-100 dark:bg-blue-800/30 rounded w-36" />
          </div>
        </div>
      </div>
      {/* Assistant message skeleton */}
      <div className="flex justify-start">
        <div className="max-w-[70%] space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl rounded-tl-md p-4 space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-64" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-56" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40" />
          </div>
        </div>
      </div>
      {/* Another user message */}
      <div className="flex justify-end">
        <div className="max-w-[70%]">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl rounded-tr-md p-4 space-y-2">
            <div className="h-3 bg-blue-100 dark:bg-blue-800/30 rounded w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}
