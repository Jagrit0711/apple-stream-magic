import { FileWarning, Scale, Ban, Radar, Landmark } from "lucide-react";

const Legal = () => {
  return (
    <div className="min-h-screen bg-background text-white pt-24 pb-20 px-4 sm:px-6 md:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <section className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(225,29,72,0.22),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.25em] text-white/55">Legal / DMCA</p>
          <h1 className="mt-2 text-3xl sm:text-5xl font-black tracking-tight">Watch by zupp Legal Information</h1>
          <p className="mt-3 text-sm sm:text-base text-white/70 leading-relaxed">
            This page explains how Watch by zupp (watch.zuup.dev) operates, what it does not host, and how
            legal or copyright-related concerns should be handled.
          </p>

          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-xs font-black uppercase tracking-widest text-red-300">Do Not Touch Notice</p>
            <p className="mt-1 text-sm text-red-100/90">
              Do not copy, mirror, tamper with, or falsely represent Watch by zupp legal notices or brand claims.
            </p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 text-red-300"><Radar size={16} /> <h2 className="font-black">No Hosting Policy</h2></div>
            <p className="mt-2 text-sm text-white/70 leading-relaxed">
              Watch by zupp operates as a discovery/index experience and does not upload, store, or host media
              files on its own servers. Streams, embeds, and files are provided by third-party services.
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 text-amber-300"><Ban size={16} /> <h2 className="font-black">Content Removal Requests</h2></div>
            <p className="mt-2 text-sm text-white/70 leading-relaxed">
              Because Watch by zupp does not host the files, direct deletion of third-party media from this
              platform is not technically possible. Takedown requests must be sent to the original host platform.
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 text-sky-300"><Scale size={16} /> <h2 className="font-black">Copyright Concerns</h2></div>
            <p className="mt-2 text-sm text-white/70 leading-relaxed">
              Watch by zupp respects intellectual property rights and expects lawful use of this service.
              Copyright holders should report media to the source host that controls the underlying file.
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 text-fuchsia-300"><FileWarning size={16} /> <h2 className="font-black">Disclaimer</h2></div>
            <p className="mt-2 text-sm text-white/70 leading-relaxed">
              Watch by zupp uses publicly available metadata/APIs and does not claim ownership over third-party
              media. Users are solely responsible for how they interact with external services.
            </p>
          </article>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="flex items-center gap-2 text-emerald-300"><Landmark size={16} /> <h2 className="font-black">Compliance Note</h2></div>
          <p className="mt-2 text-sm text-white/70 leading-relaxed">
            Watch by zupp will cooperate with valid legal requests to the extent technically possible.
            Content-level removal remains the responsibility of the host servers that store the file.
          </p>
          <p className="mt-4 text-xs text-white/55">
            Public legal contact point is not listed on this page.
          </p>
        </section>

        <footer className="text-center text-xs text-white/45 pb-2">
          <p>© 2026 Watch by zupp</p>
          <p className="mt-1">watch.zuup.dev</p>
        </footer>
      </div>
    </div>
  );
};

export default Legal;
