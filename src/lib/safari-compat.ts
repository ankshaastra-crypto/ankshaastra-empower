/** Detect iOS Safari (excludes Chrome/Firefox on iOS which use WebKit but behave differently). */
export function isIOSSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isIOS && isSafari;
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/** Razorpay prefill.contact expects digits only (10-digit Indian mobile). */
export function normalizeRazorpayContact(raw: string | undefined | null): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

/** Safe external navigation for Safari (avoids blank/invalid address on some custom schemes). */
export function openExternalUrl(url: string, target: "_self" | "_blank" = "_self"): boolean {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    if (target === "_blank") {
      const opened = window.open(parsed.toString(), "_blank", "noopener,noreferrer");
      return Boolean(opened);
    }
    window.location.assign(parsed.toString());
    return true;
  } catch {
    return false;
  }
}
