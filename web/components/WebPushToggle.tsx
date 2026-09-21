"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "cp_push_banner_dismissed";

export function WebPushBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
      // Only hint if Notification API exists and permission not already decided
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "default") setVisible(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="border-b border-blue-100 bg-blue-50 px-4 py-2 text-center text-sm text-blue-900"
    >
      <span className="mr-2">Get alerts for live services and updates.</span>
      <button
        type="button"
        className="font-semibold underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        onClick={async () => {
          try {
            const { enableWebPush } = await import("@/lib/webPush");
            await enableWebPush();
          } catch {
            /* ignore */
          }
          dismiss();
        }}
      >
        Enable notifications
      </button>
      <button
        type="button"
        aria-label="Dismiss notification banner"
        onClick={dismiss}
        className="ml-3 rounded px-1 text-blue-700/70 hover:text-blue-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        ✕
      </button>
    </div>
  );
}
