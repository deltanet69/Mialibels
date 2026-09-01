export default function DashboardLoading() {
  return (
    <div className="space-y-6 w-full pb-10 animate-pulse">
      {/* Welcome skeleton */}
      <div className="mb-6">
        <div className="h-9 bg-slate-100 rounded-xl w-72 mb-2" />
        <div className="h-4 bg-slate-100 rounded w-48" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="h-3 bg-slate-100 rounded w-20 mb-3" />
            <div className="h-8 bg-slate-100 rounded w-16" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="h-4 bg-slate-100 rounded w-40 mb-4" />
        <div className="h-48 bg-slate-50 rounded-xl" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <div className="h-4 bg-slate-100 rounded w-32" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-slate-50">
            <div className="h-3 bg-slate-100 rounded flex-1" />
            <div className="h-3 bg-slate-100 rounded w-24" />
            <div className="h-3 bg-slate-100 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
