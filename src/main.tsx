import { initAdBlocker } from "./lib/adBlocker";

// Initialize FIRST - before any React, before any iframes
initAdBlocker();

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
