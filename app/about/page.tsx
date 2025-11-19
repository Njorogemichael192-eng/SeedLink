import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";

export default function AboutPage() {
  return (
    <div className="min-h-screen w-full p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <BackButton label="Back" fallbackHref="/dashboard" />
        <section className="rounded-2xl backdrop-blur-xl bg-white/25 dark:bg-emerald-900/30 border border-white/20 p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-emerald-900 dark:text-emerald-100">About Seedlink</h1>
          <p className="mt-4 text-emerald-900/80 dark:text-emerald-100/80 text-lg">
            Seedlink is where ideas take root and communities grow. We built Seedlink to make it effortless for people to share,
            discover, and support meaningful local initiatives—turning small sparks into collective momentum.
          </p>
          <p className="mt-3 text-emerald-900/80 dark:text-emerald-100/80">
            Whether you’re launching a neighborhood project, offering a helpful service, or exploring opportunities around you,
            Seedlink is designed to connect you with the right people at the right moment.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl backdrop-blur-xl bg-white/25 dark:bg-emerald-900/30 border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">Simple by Design</h2>
            <p className="mt-2 text-emerald-900/80 dark:text-emerald-100/80">
              Clean, fast, and focused. Post in seconds, find what matters, and get back to doing the work that moves you.
            </p>
          </div>
          <div className="rounded-2xl backdrop-blur-xl bg-white/25 dark:bg-emerald-900/30 border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">Community‑First</h2>
            <p className="mt-2 text-emerald-900/80 dark:text-emerald-100/80">
              Built around trust and transparency. Seedlink helps neighbors help neighbors—and small teams punch above their weight.
            </p>
          </div>
          <div className="rounded-2xl backdrop-blur-xl bg-white/25 dark:bg-emerald-900/30 border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">Grow Together</h2>
            <p className="mt-2 text-emerald-900/80 dark:text-emerald-100/80">
              From first post to lasting impact. Track progress, gather support, and celebrate milestones as a community.
            </p>
          </div>
        </section>

        <section className="rounded-2xl backdrop-blur-xl bg-white/25 dark:bg-emerald-900/30 border border-white/20 p-6">
          <h2 className="text-xl md:text-2xl font-semibold text-emerald-900 dark:text-emerald-100">Our Promise</h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-2 text-emerald-900/80 dark:text-emerald-100/80">
            <li className="rounded-xl bg-white/50 dark:bg-emerald-900/40 border border-white/30 p-3">Fast, accessible experience on any device</li>
            <li className="rounded-xl bg-white/50 dark:bg-emerald-900/40 border border-white/30 p-3">Respect for your time, attention, and privacy</li>
            <li className="rounded-xl bg-white/50 dark:bg-emerald-900/40 border border-white/30 p-3">Thoughtful features that reduce friction</li>
            <li className="rounded-xl bg-white/50 dark:bg-emerald-900/40 border border-white/30 p-3">Human‑centered design that puts people first</li>
          </ul>
        </section>

        <section className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between rounded-2xl backdrop-blur-xl bg-emerald-600 text-white p-6 border border-white/20">
          <div>
            <h3 className="text-2xl font-semibold">Plant your idea today</h3>
            <p className="opacity-90">Create a post, share a need, or offer your skills—the community is ready.</p>
          </div>
          <Link href="/" className="mt-2 md:mt-0 px-4 py-2 rounded-lg bg-white/90 text-emerald-800 shadow hover:bg-white">Go to Home</Link>
        </section>
      </div>
    </div>
  );
}
