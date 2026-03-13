// public/sw.js
// Service Worker Ad Blocker - intercepts ALL network requests including from iframes

const VERSION = "adblock-v2";

// Known ad/tracker domains to block
const BLOCKED_DOMAINS = [
  "turnixamtman.com",
  "doubleclick.net",
  "googlesyndication.com",
  "adservice.google.com",
  "pagead2.googlesyndication.com",
  "adnxs.com",
  "exoclick.com",
  "popcash.net",
  "popads.net",
  "trafficjunky.net",
  "adsrvr.org",
  "taboola.com",
  "outbrain.com",
  "revcontent.com",
  "media.net",
  "adcolony.com",
  "moatads.com",
  "criteo.com",
  "rubiconproject.com",
  "openx.net",
  "pubmatic.com",
  "advertising.com",
  "adf.ly",
  "linkvertise.com",
  "shorte.st",
  "ouo.io",
  "bc.vc",
  "za.gl",
  "n9.cl",
  "sh.st",
  "clk.sh",
  "oxy.st",
  "exe.io",
  "adfly",
  "clickadu.com",
  "propellerads.com",
  "hilltopads.net",
  "adsterra.com",
  "bidvertiser.com",
  "mgid.com",
  "zeropark.com",
  "trafficfactory.biz",
  "plugrush.com",
];

// Domains that should ALWAYS be allowed through
const ALWAYS_ALLOWED = [
  "localhost",
  "api.themoviedb.org",
  "image.tmdb.org",
  "themoviedb.org",
  "supabase.co",
  "videasy.net",
  "youtube.com",
  "youtube-nocookie.com",
  "youtu.be",
  "googleapis.com",
  "googlevideo.com",
  "corsproxy.io",
  "allorigins.win",
  "zuup.dev",
];

const isAlwaysAllowed = (hostname) => {
  return ALWAYS_ALLOWED.some(
    (d) => hostname === d || hostname.endsWith("." + d)
  );
};

const isBlocked = (url) => {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Never block always-allowed domains
    if (isAlwaysAllowed(hostname)) return false;

    // Check domain blocklist
    for (const domain of BLOCKED_DOMAINS) {
      if (hostname === domain || hostname.endsWith("." + domain)) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
};

// Install: skip waiting to activate immediately
self.addEventListener("install", (event) => {
  console.log("[SW AdBlock] Installing v" + VERSION);
  self.skipWaiting();
});

// Activate: take control of all clients immediately
self.addEventListener("activate", (event) => {
  console.log("[SW AdBlock] Active ✓");
  event.waitUntil(self.clients.claim());
});

// Fetch: intercept every single network request
self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Block known ad domains with an empty 200 response
  if (isBlocked(url)) {
    console.warn("[SW AdBlock] Blocked request →", url);
    event.respondWith(
      new Response("", {
        status: 200,
        statusText: "OK",
        headers: { "Content-Type": "text/plain" },
      })
    );
    return;
  }

  // For navigation requests, only intercept actual redirect attacks
  // (navigations to known ad domains), let everything else through
  if (
    event.request.mode === "navigate" &&
    event.request.destination === "document"
  ) {
    try {
      if (isBlocked(url) && !url.startsWith(self.location.origin)) {
        event.respondWith(
          new Response(
            `<!DOCTYPE html><html><head><script>window.location.href = "/";<\/script></head><body></body></html>`,
            { status: 200, headers: { "Content-Type": "text/html" } }
          )
        );
        return;
      }
    } catch {}
  }

  // DO NOTHING for all other requests. 
  // By not calling event.respondWith, we let the browser handle the fetch natively.
  // This prevents the Service Worker from breaking CORS, HMR, or network fallbacks.
});
