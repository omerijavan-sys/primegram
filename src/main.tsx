import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyAppearance } from "./utils/preferences";

applyAppearance();
window.addEventListener("primegram:preferences", applyAppearance);
window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", applyAppearance);

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered: ', registration);
      })
      .catch(registrationError => {
        console.log('Service Worker registration failed: ', registrationError);
      });
  });
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
