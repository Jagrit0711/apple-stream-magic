// Register service worker ad blocker FIRST — intercepts ALL network requests including from iframes
import { registerAdBlockSW } from "./lib/registerSW";
registerAdBlockSW();

// JS-level second layer
import { initAdBlocker } from "./lib/adBlocker";
initAdBlocker();

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
