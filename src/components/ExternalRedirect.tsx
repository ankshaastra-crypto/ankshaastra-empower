import { useEffect, useState } from "react";
import { openExternalUrl } from "@/lib/safari-compat";

type Props = { url: string };

/** Redirect to an external HTTPS URL with a Safari-safe fallback link. */
export default function ExternalRedirect({ url }: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const ok = openExternalUrl(url, "_self");
    if (!ok) setFailed(true);
  }, [url]);

  if (failed) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center px-6 text-center gap-4">
        <p className="text-muted-foreground">Tap below to continue to our partner site.</p>
        <a
          href={url}
          className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground"
          rel="noopener noreferrer"
        >
          Continue
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-[40vh] flex items-center justify-center text-muted-foreground text-sm">
      Redirecting…
    </div>
  );
}
