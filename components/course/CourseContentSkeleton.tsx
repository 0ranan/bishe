export default function CourseContentSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="加载中">
      <div className="h-8 w-48 rounded bg-gray-200" />
      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-4 w-1/2 rounded bg-gray-200" />
        <div className="h-32 w-full rounded bg-gray-100" />
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
        <div className="h-4 w-2/3 rounded bg-gray-200" />
        <div className="h-24 w-full rounded bg-gray-100" />
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-3">
        <div className="h-4 w-1/3 rounded bg-gray-200" />
        <div className="h-4 w-full rounded bg-gray-100" />
        <div className="h-4 w-5/6 rounded bg-gray-100" />
      </div>
    </div>
  );
}
