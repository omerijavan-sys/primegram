export type Theme = "dark" | "light" | "auto";
export function readPreference<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(`primegram-${key}`); return value === null ? fallback : JSON.parse(value); }
  catch { return fallback; }
}
export function savePreference(key: string, value: unknown) {
  localStorage.setItem(`primegram-${key}`, JSON.stringify(value));
  window.dispatchEvent(new Event("primegram:preferences"));
}
export function applyAppearance() {
  const theme = readPreference<Theme>("theme", "dark");
  const light = theme === "light" || (theme === "auto" && window.matchMedia("(prefers-color-scheme: light)").matches);
  document.documentElement.classList.toggle("light", light);
  document.documentElement.classList.toggle("dark", !light);
  document.documentElement.dataset.reduceMotion = String(readPreference("reduce-motion", false));
}