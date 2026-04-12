import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Crown,
  MessageCircle,
  PlayCircle,
  Sparkles,
  Star,
  Tv,
  WandSparkles,
} from "lucide-react";
import {
  getWhatsAppLink,
  SUBSCRIPTION_PRICE_RUPEES,
  SUPPORT_WHATSAPP_NUMBER,
} from "@/lib/access";
import { TMDBMovie, getTitle, img } from "@/lib/tmdb";

interface LandingProps {
  trending: TMDBMovie[];
  onAuthClick: () => void;
  accessLocked?: boolean;
  userName?: string;
  hasAccount?: boolean;
}

const CAPABILITIES = [
  {
    title: "Smart AI Recommendations",
    copy: "Because-you-watched rails and behavior-aware picks update from your history.",
    icon: Sparkles,
  },
  {
    title: "Watch Party Sync",
    copy: "Join rooms, sync countdown starts, and chat while streaming together.",
    icon: MessageCircle,
  },
  {
    title: "Continue Watching",
    copy: "Resume exactly where you left off across episodes, seasons, and devices.",
    icon: PlayCircle,
  },
  {
    title: "TV + Mobile Navigation",
    copy: "Remote-friendly controls on TVs with fast touch flow on phones.",
    icon: Tv,
  },
];

const FLOW_STEPS = [
  "Login or create your account",
  "Set profile + favorite genres",
  "Renew via WhatsApp only",
  "Access instantly after activation",
];

const FAQS = [
  {
    q: "Is this free?",
    a: "No. This is a paid membership experience, built for premium streaming access.",
  },
  {
    q: "How can I renew membership?",
    a: "Renewal is only through WhatsApp support. No direct card checkout flow here.",
  },
  {
    q: "When do I see the support number?",
    a: "The WhatsApp number is shown after login only.",
  },
];

const Landing = ({
  trending,
  onAuthClick,
  accessLocked = false,
  userName,
  hasAccount = false,
}: LandingProps) => {
  const firstName = userName?.split("@")[0]?.split(" ")[0] || "Viewer";

  const posters = useMemo(
    () => trending.filter((item) => item.poster_path).slice(0, 24),
    [trending]
  );

  const doubledPosters = useMemo(() => {
    if (posters.length === 0) return [] as TMDBMovie[];
    return [...posters, ...posters, ...posters];
  }, [posters]);

  const runway = useMemo(() => posters.slice(0, 12), [posters]);

  const renewalMessage = `Hi, I want to renew my Apple Stream Magic subscription for Rs. ${SUBSCRIPTION_PRICE_RUPEES}. Name: ${firstName}.`;
  const renewalLink = getWhatsAppLink(renewalMessage);

  const heroTitleMain = hasAccount && accessLocked ? `Welcome Back, ${firstName}.` : "Movies.";
  const heroTitleAccent = hasAccount && accessLocked ? "Renew. Resume. Dominate." : "Zero limits.";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#06060a] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_5%,rgba(225,29,72,0.32),transparent_35%),radial-gradient(circle_at_86%_25%,rgba(249,115,22,0.14),transparent_34%),linear-gradient(to_bottom,#050509,#06070d_45%,#050507)]" />

      <header className="fixed left-0 right-0 top-0 z-40 border-b border-white/5 bg-black/35 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <button onClick={onAuthClick} className="text-center">
            <p className="text-[48px] font-black leading-none tracking-[-0.05em] sm:text-[52px]">Watch</p>
            <p className="mt-1 text-[12px] font-bold tracking-[0.35em] text-white/75">BY ZUUP</p>
          </button>

          <div className="flex items-center gap-3">
            {!hasAccount && (
              <button
                onClick={onAuthClick}
                className="rounded-full bg-[#f40f63] px-5 py-2.5 text-sm font-black transition hover:bg-[#ff2d78]"
              >
                Login
              </button>
            )}

            {hasAccount && accessLocked && (
              <a
                href={renewalLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-[#f40f63] px-5 py-2.5 text-sm font-black transition hover:bg-[#ff2d78]"
              >
                Renew via WhatsApp
              </a>
            )}
          </div>
        </div>
      </header>

      <section className="relative min-h-[92vh] overflow-hidden border-b border-white/5 pt-24 sm:pt-28">
        {doubledPosters.length > 0 && (
          <div className="pointer-events-none absolute inset-0 z-0 hidden md:block">
            <motion.div
              className="absolute left-[-20%] top-[6%] flex w-max gap-4"
              animate={{ x: [0, -820] }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            >
              {doubledPosters.map((item, index) => (
                <img
                  key={`drift-a-${item.id}-${index}`}
                  src={img(item.poster_path, "w500") || undefined}
                  alt={getTitle(item)}
                  className="h-[42vh] w-[145px] rounded-2xl object-cover opacity-55 blur-[0.4px]"
                />
              ))}
            </motion.div>

            <motion.div
              className="absolute bottom-[7%] left-[-28%] flex w-max gap-4"
              animate={{ x: [-920, 0] }}
              transition={{ duration: 68, repeat: Infinity, ease: "linear" }}
            >
              {doubledPosters.map((item, index) => (
                <img
                  key={`drift-b-${item.id}-${index}`}
                  src={img(item.poster_path, "w500") || undefined}
                  alt={getTitle(item)}
                  className="h-[46vh] w-[156px] rounded-2xl object-cover opacity-55 blur-[0.4px]"
                />
              ))}
            </motion.div>

            <div className="absolute inset-0 bg-gradient-to-b from-black/78 via-black/72 to-[#050508]" />
          </div>
        )}

        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_40%,rgba(237,27,93,0.36),transparent_48%)]" />

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-4 pb-20 pt-16 text-center sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold text-white/95">
            <span className="h-2 w-2 rounded-full bg-[#ff145f]" />
            Paid premium streaming experience
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="mt-7 text-5xl font-black leading-[0.93] tracking-[-0.04em] sm:text-7xl"
          >
            {heroTitleMain}
            <span className="mt-2 block bg-gradient-to-r from-[#ff1570] via-[#ff3f91] to-[#ffa34b] bg-clip-text text-transparent">
              {heroTitleAccent}
            </span>
          </motion.h1>

          <p className="mt-7 max-w-2xl text-lg font-semibold leading-relaxed text-white/72">
            Stream movies, anime, and TV with bold visuals, smart recommendations, watch-party sync, and profile-based access.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {!hasAccount && (
              <button
                onClick={onAuthClick}
                className="inline-flex items-center gap-2 rounded-full bg-[#f40f63] px-9 py-4 text-base font-black transition hover:scale-[1.02] hover:bg-[#ff2d78]"
              >
                Get Started
                <ArrowRight size={16} />
              </button>
            )}

            {hasAccount && accessLocked && (
              <a
                href={renewalLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366]/15 px-9 py-4 text-base font-black text-[#25D366] ring-1 ring-[#25D366]/35 transition hover:bg-[#25D366]/25"
              >
                Renew on WhatsApp
                <MessageCircle size={16} />
              </a>
            )}

            <button
              onClick={onAuthClick}
              className="rounded-full border border-white/25 bg-white/[0.06] px-8 py-4 text-base font-black text-white transition hover:bg-white/[0.14]"
            >
              {hasAccount ? "Switch Account" : "I already have an account"}
            </button>
          </div>

          <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/12 bg-black/35 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">Plan</p>
              <p className="mt-1 text-sm font-black">Rs. {SUBSCRIPTION_PRICE_RUPEES} membership</p>
            </div>
            <div className="rounded-xl border border-white/12 bg-black/35 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">Renewal</p>
              <p className="mt-1 text-sm font-black">WhatsApp only</p>
            </div>
            <div className="rounded-xl border border-white/12 bg-black/35 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">Support Number</p>
              <p className="mt-1 text-sm font-black">
                {hasAccount ? SUPPORT_WHATSAPP_NUMBER : "Login to view"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/5 py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl rounded-[30px] border border-white/10 bg-gradient-to-r from-[#1a0b22]/80 via-[#290816]/75 to-[#421109]/60 px-6 py-10 text-center sm:px-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold">
              <WandSparkles size={14} className="text-[#ff4f98]" />
              A Premium Experience
            </div>
            <h2 className="mt-5 text-4xl font-black leading-[1.04] tracking-[-0.03em] sm:text-6xl">
              Built for those who demand
              <span className="block bg-gradient-to-r from-[#9d8bff] via-[#ff64b2] to-[#ffa24c] bg-clip-text text-transparent">
                the best visual fidelity.
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg font-semibold leading-relaxed text-white/70">
              Theater-like experience with intelligent search, AI recommendation rails, seamless sync, and profile-level personalization.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-white/5 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-black uppercase tracking-[0.08em] sm:text-4xl">Core Features</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {CAPABILITIES.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-90px" }}
                  transition={{ duration: 0.4, delay: idx * 0.06 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <div className="inline-flex rounded-lg bg-[#f40f63]/20 p-2.5 text-[#ff2e81]">
                    <Icon size={18} />
                  </div>
                  <h3 className="mt-4 text-xl font-black tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-white/70">{item.copy}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-white/5 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-black uppercase tracking-[0.08em] sm:text-4xl">What To Watch</h2>
            <div className="hidden rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold sm:block">
              LIVE TREND FEED
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {runway.map((item, idx) => (
              <article
                key={`runway-${item.id}-${idx}`}
                className="group relative overflow-hidden rounded-2xl border border-white/10"
              >
                <div className="aspect-[2/3] bg-black/40">
                  {item.poster_path ? (
                    <img
                      src={img(item.poster_path, "w500") || undefined}
                      alt={getTitle(item)}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-white/40">No Poster</div>
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-2.5">
                  <p className="line-clamp-2 text-sm font-black leading-tight tracking-tight text-white">
                    {getTitle(item)}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#ff4a94]">
                    TREND #{idx + 1}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/5 py-14">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-7">
            <h2 className="text-3xl font-black tracking-tight">Access Flow</h2>
            <p className="mt-2 text-sm font-semibold text-white/65">
              Real app flow connected to authentication, profile state, and gated content.
            </p>
            <ol className="mt-5 space-y-3">
              {FLOW_STEPS.map((step, idx) => (
                <li key={step} className="flex items-center gap-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#f40f63]/20 text-xs font-black text-[#ff3285] ring-1 ring-[#f40f63]/40">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-semibold text-white/85">{step}</span>
                </li>
              ))}
            </ol>
          </article>

          <article className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#f40f63]/18 via-[#f97316]/10 to-transparent p-6 sm:p-7">
            <h2 className="text-3xl font-black tracking-tight">Membership & Renewal</h2>
            <p className="mt-2 text-sm font-semibold text-white/72">
              This service is paid. Renewal is strictly WhatsApp-based support only.
            </p>
            <ul className="mt-5 space-y-2 text-sm font-semibold text-white/86">
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#ff4f98]" />No free unlimited tier</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#ff4f98]" />Renewals handled manually for fast support</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#ff4f98]" />Membership starts at Rs. {SUBSCRIPTION_PRICE_RUPEES}</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#ff4f98]" />Profile page shows current subscription status</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              {!hasAccount && (
                <button
                  onClick={onAuthClick}
                  className="rounded-full bg-white px-6 py-2.5 text-sm font-black text-black transition hover:bg-white/90"
                >
                  Login To Renew
                </button>
              )}
              {hasAccount && (
                <a
                  href={renewalLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#25D366]/15 px-6 py-2.5 text-sm font-black text-[#25D366] ring-1 ring-[#25D366]/35 transition hover:bg-[#25D366]/25"
                >
                  Open WhatsApp Renewal
                  <MessageCircle size={16} />
                </a>
              )}
              <div className="rounded-full border border-white/20 bg-white/[0.05] px-6 py-2.5 text-xs font-black tracking-[0.12em] text-white/80">
                {hasAccount ? `SUPPORT: ${SUPPORT_WHATSAPP_NUMBER}` : "SUPPORT NUMBER VISIBLE AFTER LOGIN"}
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="border-b border-white/5 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <Star className="text-[#ff4f98]" size={18} />
              <h3 className="mt-3 text-xl font-black">Top 10 Shelves</h3>
              <p className="mt-2 text-sm font-semibold text-white/68">Global and region-specific Top 10 stacks are built into browsing.</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <Crown className="text-[#ff4f98]" size={18} />
              <h3 className="mt-3 text-xl font-black">Admin Ready</h3>
              <p className="mt-2 text-sm font-semibold text-white/68">Admin dashboard and profile controls are already integrated in the app flow.</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <PlayCircle className="text-[#ff4f98]" size={18} />
              <h3 className="mt-3 text-xl font-black">Premium Player UX</h3>
              <p className="mt-2 text-sm font-semibold text-white/68">Episode picker, auto-next countdown, and TV remote interactions are supported.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-3xl border border-white/10 bg-gradient-to-r from-[#f40f63]/20 via-[#ff7043]/12 to-transparent p-7 sm:p-9">
              <h2 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">Ready to enter premium mode?</h2>
              <p className="mt-4 max-w-2xl text-base font-semibold leading-relaxed text-white/75">
                {hasAccount
                  ? "You are logged in. Use WhatsApp renewal to reactivate and continue streaming immediately."
                  : "Login first, then renew through WhatsApp support to unlock full access."}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={onAuthClick}
                  className="rounded-full bg-white px-7 py-3 text-sm font-black text-black transition hover:bg-white/90"
                >
                  {hasAccount ? "Open Account" : "Login / Signup"}
                </button>
                {hasAccount && (
                  <a
                    href={renewalLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-[#25D366]/15 px-7 py-3 text-sm font-black text-[#25D366] ring-1 ring-[#25D366]/35"
                  >
                    Renew via {SUPPORT_WHATSAPP_NUMBER}
                    <MessageCircle size={16} />
                  </a>
                )}
              </div>
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-7">
              <h3 className="text-2xl font-black">FAQ</h3>
              <div className="mt-4 space-y-3">
                {FAQS.map((item) => (
                  <div key={item.q} className="rounded-xl border border-white/10 bg-black/25 p-3.5">
                    <p className="text-sm font-black">{item.q}</p>
                    <p className="mt-1.5 text-sm font-semibold leading-relaxed text-white/70">{item.a}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
