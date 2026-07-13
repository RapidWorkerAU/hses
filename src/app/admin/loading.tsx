export default function AdminLoading() {
  return (
    <div className="flex flex-col min-h-full">
      <div className="px-6 pt-5 pb-4 border-b border-neutral-100 bg-white flex-shrink-0">
        <div className="h-4 w-[80px] rounded bg-neutral-100 animate-pulse mb-2" />
        <div className="h-6 w-[180px] rounded bg-neutral-100 animate-pulse" />
      </div>
      <div className="flex-1 p-6 bg-[#f7f8fa]">
        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
          <div className="divide-y divide-neutral-100">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="h-4 w-[80px] rounded bg-neutral-100 animate-pulse" />
                <div className="h-4 w-[140px] rounded bg-neutral-100 animate-pulse" />
                <div className="h-4 w-[100px] rounded bg-neutral-100 animate-pulse" />
                <div className="h-4 flex-1 rounded bg-neutral-100 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
