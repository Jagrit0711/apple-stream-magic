// public/sw.js
// Service Worker Ad Blocker - intercepts ALL network requests including from iframes
// This is the only way to block requests that originate inside a cross-origin iframe

const VERSION = "adblock-v1";

// Known ad/tracker domains to block
// Add more as you discover them in the console
const BLOCKED_DOMAINS = [
  "turnixamtman.com",
  "ye.turnixamtman.com",
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
  "t.co",
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

// Block URL patterns (regex strings)
const BLOCKED_PATTERNS = [
  "/ads/",
  "/ad/",
  "/adserve/",
  "/adclick/",
  "/pop/",
  "/popup/",
  "/popunder/",
  "/banner/",
  "?ad_",
  "&ad_",
  "affiliate",
  "clicktrack",
  "popunder",
  "pop-under",
];

const isBlocked = (url) => {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Check domain blocklist
    for (const domain of BLOCKED_DOMAINS) {
      if (hostname === domain || hostname.endsWith("." + domain)) {
        return true;
      }
    }

    // Check URL patterns
    const fullUrl = url.toLowerCase();
    for (const pattern of BLOCKED_PATTERNS) {
      if (fullUrl.includes(pattern.toLowerCase())) {
        // Don't block legitimate video CDN paths
        if (
          fullUrl.includes("videasy") ||
          fullUrl.includes("themoviedb") ||
          fullUrl.includes("tmdb") ||
          fullUrl.includes("zuup.dev")
        ) {
          continue;
        }
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
  console.log("[SW AdBlock] Installing...");
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

  if (isBlocked(url)) {
    console.warn("[SW AdBlock] Blocked request →", url);
    // Return an empty 200 response instead of an error
    // This prevents error logs and prevents retry attempts
    event.respondWith(
      new Response("", {
        status: 200,
        statusText: "OK",
        headers: { "Content-Type": "text/plain" },
      })
    );
    return;
  }

  // For navigation requests to external sites (the actual redirect attack)
  // Block top-level navigations to non-allowed domains
  if (
    event.request.mode === "navigate" &&
    event.request.destination === "document"
  ) {
    const ALLOWED = ["zuup.dev", "localhost", "videasy.net"];
    try {
      const parsed = new URL(url);
      const isAllowed = ALLOWED.some(
        (d) => parsed.hostname === d || parsed.hostname.endsWith("." + d)
      );
      if (!isAllowed && !url.startsWith(self.location.origin)) {
        console.warn("[SW AdBlock] Blocked navigation →", url);
        // Return the app shell instead of navigating away
        event.respondWith(
          new Response(
            `<!DOCTYPE html>
            <html>
              <head><script>window.location.href = "/";<\/script></head>
              <body></body>
            </html>`,
            {
              status: 200,
              headers: { "Content-Type": "text/html" },
            }
          )
        );
        return;
      }
    } catch {}
  }

  // All other requests: pass through normally
  event.respondWith(fetch(event.request));
});
