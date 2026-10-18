export const DEFAULT_PACKAGE = "name-check" as const;

export function showPackages() {
  window.dispatchEvent(new Event("showPackages"));
  const scroll = (attempt = 0) => {
    const section = document.getElementById("pricing");
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
    else if (attempt < 40) window.setTimeout(() => scroll(attempt + 1), 50);
  };
  requestAnimationFrame(() => scroll());
}

export function openNameCheck() {
  window.dispatchEvent(new CustomEvent("setPackageType", { detail: DEFAULT_PACKAGE }));
}