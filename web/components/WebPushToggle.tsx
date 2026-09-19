"use client";

import { useState } from "react";
import { enableWebPush } from "@/lib/webPush";

export function WebPushBanner() {
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [hidden, setHidden] = useState(false);

  if (hidden || status === "ok") return null;

  return (
    <div className="bg-brand-700 px-4 py-2 text-center text-sm text-white">
      Enable notifications for live alerts{" "}
      <button
        type="button"
        className="ml-2 underline"
        onClick={async () => {
          try {
            const ok = await enableWebPush();
            setStatus(ok ? "ok" : "err");
            if (ok) setHidden(true);
          } catch {
            setStatus("err");
          }
        }}
      >
        Enable
      </button>
      <button type="button" className="ml-4 opacity-70" onClick={() => setHidden(true)}>
        Dismiss
      </button>
    </div>
  );
}
