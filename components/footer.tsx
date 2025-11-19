import Link from "next/link";
export function Footer() {
  return (
    <footer className="mt-10 border-t border-white/30 bg-white/40 dark:bg-emerald-900/30 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-6 py-10 grid gap-8 md:grid-cols-4 text-sm">
        <div className="space-y-2">
          <div className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">Seedlink</div>
          <p className="text-emerald-900/80 dark:text-emerald-100/80">Connecting people, seedlings, and communities to grow greener futures together.</p>
        </div>

        <div className="space-y-2">
          <div className="font-semibold text-emerald-900 dark:text-emerald-100">Contact</div>
          <p className="text-emerald-900/80 dark:text-emerald-100/80">Email: hello@seedlink.africa</p>
          <p className="text-emerald-900/80 dark:text-emerald-100/80">Phone: +254 700 000 000</p>
          <p className="text-emerald-900/80 dark:text-emerald-100/80">Nairobi, Kenya</p>
        </div>

        <div className="space-y-2">
          <div className="font-semibold text-emerald-900 dark:text-emerald-100">Quick links</div>
          <ul className="space-y-1 text-emerald-900/80 dark:text-emerald-100/80">
            <li><Link href="/" className="hover:underline">Home</Link></li>
            <li><Link href="/about" className="hover:underline">About</Link></li>
            <li><Link href="/profile" className="hover:underline">Profile</Link></li>
          </ul>
        </div>

        <div className="space-y-2">
          <div className="font-semibold text-emerald-900 dark:text-emerald-100">Directions</div>
          <p className="text-emerald-900/80 dark:text-emerald-100/80">Start by creating a post, share your needs or offers, and connect with nearby supporters.</p>
          <p className="text-emerald-900/80 dark:text-emerald-100/80">Explore the feed to discover opportunities and lend a hand where it counts.</p>
        </div>
      </div>
      <div className="border-t border-white/20">
        <div className="mx-auto max-w-6xl px-6 py-4 flex flex-col md:flex-row items-center justify-between text-xs text-emerald-900/70 dark:text-emerald-100/70">
          <div>© {new Date().getFullYear()} Seedlink. All rights reserved.</div>
          <div className="space-x-4">
            <Link href="/terms" className="hover:underline">Terms</Link>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
