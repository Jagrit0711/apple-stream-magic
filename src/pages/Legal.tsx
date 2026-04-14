import { ShieldAlert, FileWarning, Scale, Ban, Radar, Landmark } from "lucide-react";

const Legal = () => {
  return (
    <div className="min-h-screen bg-background text-white pt-24 pb-20 px-4 sm:px-6 md:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <section className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(225,29,72,0.22),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.25em] text-white/55">Legal / DMCA</p>
          <h1 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight">StreameX Legal Information</h1>
          <p className="mt-3 text-sm sm:text-base text-white/70 leading-relaxed">
            StreameX operates as a content discovery platform. Please review this page to understand how the
            platform works, what it does not do, and where responsibility for hosted media sits.
          </p>

          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-xs font-black uppercase tracking-widest text-red-300">Do Not Touch Notice</p>
            <p className="mt-1 text-sm text-red-100/90">
              Do not copy, mirror, tamper with, or falsely represent StreameX legal notices or brand claims.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.25em] text-white/55 mb-3">Site Map Snapshot</p>
          <div className="grid gap-3 sm:grid-cols-3 text-sm">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="font-black text-white/85">StreameX</p>
              <p className="mt-1 text-white/65">Home</p>
              <p className="text-white/65">Search</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="font-black text-white/85">Media</p>
              <p className="mt-1 text-white/65">Movies</p>
              <p className="text-white/65">TV Shows</p>
              <p className="text-white/65">Anime</p>
              <p className="text-white/65">Manga</p>
              <p className="text-white/65">Music</p>
              <p className="text-white/65">Live Sports</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="font-black text-white/85">More</p>
              <p className="mt-1 text-white/65">Watchlist</p>
              <p className="text-white/65">History</p>
              <p className="text-white/65">Legal / DMCA</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 text-red-300"><Radar size={16} /> <h2 className="font-black">No Hosting Policy</h2></div>
            <p className="mt-2 text-sm text-white/70 leading-relaxed">
              StreameX functions solely as an indexer/aggregator of publicly discoverable links and metadata.
              StreameX does not upload, store, or host media files on its own infrastructure.
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 text-amber-300"><Ban size={16} /> <h2 className="font-black">Content Removal Requests</h2></div>
            <p className="mt-2 text-sm text-white/70 leading-relaxed">
              Because StreameX does not host files, direct takedown/deletion of those files is not technically
              possible from this platform. Requests must be sent to the original third-party host.
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 text-sky-300"><Scale size={16} /> <h2 className="font-black">Copyright Concerns</h2></div>
            <p className="mt-2 text-sm text-white/70 leading-relaxed">
              StreameX respects intellectual property rights and intends to operate within legal boundaries.
              Rights holders should contact the host platform that controls the media file.
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 text-fuchsia-300"><FileWarning size={16} /> <h2 className="font-black">Disclaimer</h2></div>
            <p className="mt-2 text-sm text-white/70 leading-relaxed">
              StreameX uses public data and APIs, and does not claim ownership over third-party media.
              Users are responsible for how they access third-party websites and services.
            </p>
          </article>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="flex items-center gap-2 text-emerald-300"><Landmark size={16} /> <h2 className="font-black">Compliance Note</h2></div>
          <p className="mt-2 text-sm text-white/70 leading-relaxed">
            StreameX will cooperate with valid and lawful legal requests to the extent technically possible.
            Content-level deletion requests must be handled by the servers that actually host those files.
          </p>
          <p className="mt-4 text-xs text-white/55">
            Point of contact: Not publicly listed on this legal page.
          </p>
        </section>

        <footer className="text-center text-xs text-white/45 pb-2">
          <p>© 2026 StreameX</p>
          <p className="mt-1">StreameX - Discover and Watch Movies &amp; TV Shows</p>
        </footer>
      </div>
    </div>
  );
};

export default Legal;
