export default function LearnLoading() {
  return (
    <div className="min-h-screen w-full bg-linear-to-br from-emerald-800 via-emerald-600/40 to-sky-700/40 p-4 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-10 w-64 rounded-full bg-white/20 animate-pulse" />
        <div className="h-4 w-40 rounded-full bg-white/10 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-60 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
