/**
 * Registers the Ad Blocking Service Worker
 * Must be called before anything else in main.tsx
 */
export const registerAdBlockSW = async () => {
  if (!("serviceWorker" in navigator)) {
    console.warn("[SW AdBlock] Service workers not supported");
    return;
  }

  try {
    // Aggressive unregister first to clear out the broken SW that intercepted all fetches
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      if (reg.active?.scriptURL.includes("sw.js")) {
        await reg.unregister();
        console.log("[SW AdBlock] Unregistered old broken instance");
      }
    }

    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });

    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed") {
            console.log("[SW AdBlock] Updated ✓");
          }
        });
      }
    });

    // If there's a waiting worker, activate it immediately
    if (registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }

    console.log("[SW AdBlock] Registered ✓ scope:", registration.scope);
  } catch (err) {
    console.warn("[SW AdBlock] Registration failed:", err);
  }
};
