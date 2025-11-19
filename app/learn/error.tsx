"use client";

interface LearnErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LearnError({ error, reset }: LearnErrorProps) {
  return (
    <div className="min-h-screen w-full bg-linear-to-br from-red-900 via-emerald-800/40 to-sky-900/40 p-4 sm:p-8 flex items-center justify-center">
      <div className="max-w-md w-full rounded-3xl border border-red-500/40 bg-black/40 backdrop-blur-xl p-6 text-center text-red-50">
        <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
        <p className="text-sm mb-4 opacity-80">We couldn&apos;t load the Learn hub right now. Please try again.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-2 inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-emerald-900"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
