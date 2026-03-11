/**
 * Built-in Ad Blocker for Watch by Zuup
 * Intercepts popup/redirect attacks from embedded video players
 * Must be initialized as early as possible (before any iframes load)
 */

const ALLOWED_DOMAINS = [
  "zuup.dev",
  "videasy.net",
  "player.videasy.net",
  "themoviedb.org",
  "image.tmdb.org",
  "supabase.co",
  "localhost",
];

const AD_URL_PATTERNS = [
  /doubleclick/i,
  /googlesyndication/i,
  /adservice/i,
  /pagead/i,
  /adclick/i,
  /popads/i,
  /popcash/i,
  /exoclick/i,
  /trafficjunky/i,
  /adnxs/i,
  /adsrvr/i,
  /taboola/i,
  /outbrain/i,
  /revcontent/i,
  /ad\.fly/i,
  /adf\.ly/i,
  /linkvertise/i,
  /shorte\.st/i,
  /ouo\.io/i,
  /bc\.vc/i,
];

const isAllowedUrl = (url: string): boolean => {
  if (!url || url.startsWith("blob:") || url.startsWith("data:")) return true;
  try {
    const parsed = new URL(url, window.location.href);
    // Allow same origin
    if (parsed.origin === window.location.origin) return true;
    // Allow whitelisted domains
    if (ALLOWED_DOMAINS.some(d => parsed.hostname === d || parsed.hostname.endsWith("." + d))) return true;
    // Block known ad patterns
    if (AD_URL_PATTERNS.some(p => p.test(url))) return false;
    return false;
  } catch {
    return true; // relative/invalid URLs are fine
  }
};

let _initialized = false;

export const initAdBlocker = () => {
  if (_initialized || typeof window === "undefined") return;
  _initialized = true;

  // ── 1. Block window.open (most common popup vector) ──────────────────────
  const _originalOpen = window.open.bind(window);
  window.open = (url?: string | URL, target?: string, features?: string): Window | null => {
    const urlStr = url?.toString() || "";
    if (!isAllowedUrl(urlStr)) {
      console.warn("[AdBlock] Blocked window.open →", urlStr);
      return null;
    }
    return _originalOpen(url, target, features);
  };

  // ── 2. Block location-changing via Object.defineProperty ─────────────────
  // Intercept attempts to change top-level location via iframe postMessage tricks
  const _originalAssign   = window.location.assign.bind(window.location);
  const _originalReplace  = window.location.replace.bind(window.location);

  try {
    window.location.assign = (url: string) => {
      if (!isAllowedUrl(url)) {
        console.warn("[AdBlock] Blocked location.assign →", url);
        return;
      }
      _originalAssign(url);
    };
    window.location.replace = (url: string) => {
      if (!isAllowedUrl(url)) {
        console.warn("[AdBlock] Blocked location.replace →", url);
        return;
      }
      _originalReplace(url);
    };
  } catch (e) {
    // Some browsers don't allow overriding location methods - silent fail
  }

  // ── 3. Block anchor clicks navigating away ────────────────────────────────
  document.addEventListener("click", (e: MouseEvent) => {
    const anchor = (e.target as Element)?.closest("a");
    if (!anchor) return;
    const href = anchor.href || anchor.getAttribute("href") || "";
    if (href && !isAllowedUrl(href)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      console.warn("[AdBlock] Blocked anchor navigation →", href);
    }
  }, true); // capture phase - fires before anything else

  // ── 4. Block postMessage redirect commands from iframes ──────────────────
  window.addEventListener("message", (e: MessageEvent) => {
    try {
      const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
      if (!data || typeof data !== "object") return;

      // Common iframe-to-parent redirect patterns
      const suspiciousKeys = ["redirect", "navigate", "location", "href", "url", "open"];
      for (const key of suspiciousKeys) {
        if (data[key] && typeof data[key] === "string") {
          if (!isAllowedUrl(data[key])) {
            console.warn("[AdBlock] Blocked postMessage redirect →", data[key]);
            // We can't prevent the message but we nullify it by not acting
            // The VideoPlayer component also has its own handler
            return;
          }
        }
      }
    } catch {
      // Not JSON - ignore
    }
  }, true);

  // ── 5. MutationObserver - remove injected ad iframes/scripts ─────────────
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node.nodeType !== 1) continue;
        const el = node as HTMLElement;

        // Block injected iframes pointing to ad domains
        if (el.tagName === "IFRAME") {
          const src = (el as HTMLIFrameElement).src;
          if (src && !isAllowedUrl(src)) {
            console.warn("[AdBlock] Removed injected iframe →", src);
            el.remove();
            continue;
          }
        }

        // Block injected scripts from ad networks
        if (el.tagName === "SCRIPT") {
          const src = (el as HTMLScriptElement).src;
          if (src && !isAllowedUrl(src)) {
            console.warn("[AdBlock] Removed injected script →", src);
            el.remove();
            continue;
          }
        }

        // Block pop-under divs (full-screen invisible overlays used for click-jacking)
        const style = window.getComputedStyle(el);
        if (
          style.position === "fixed" &&
          style.zIndex &&
          parseInt(style.zIndex) > 9000 &&
          el.id !== "root" &&
          !el.closest("#root")
        ) {
          // Check if it's one of our own modals
          const isOurs = el.classList.contains("tablet-layout-wrapper") ||
                         el.closest("[data-our-modal]") ||
                         el.tagName === "BUTTON";
          if (!isOurs && (el.offsetWidth > window.innerWidth * 0.8)) {
            console.warn("[AdBlock] Removed suspected pop-under overlay", el);
            el.remove();
          }
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // ── 6. Blur/focus trap - block tab-under attacks ──────────────────────────
  // Tab-under: opens a popup then redirects the background tab
  let _lastFocusTime = Date.now();
  window.addEventListener("focus", () => {
    const elapsed = Date.now() - _lastFocusTime;
    // If we regained focus very quickly after losing it, a tab-under may have fired
    if (elapsed < 1000 && elapsed > 0) {
      // Check if location changed to something external
      if (!isAllowedUrl(window.location.href)) {
        console.warn("[AdBlock] Tab-under detected, going back");
        window.history.back();
      }
    }
    _lastFocusTime = Date.now();
  });

  window.addEventListener("blur", () => {
    _lastFocusTime = Date.now();
  });

  console.info("[AdBlock] Initialized ✓");
};

export default initAdBlocker;
