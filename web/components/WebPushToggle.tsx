"use client";

import { useEffect, useState } from "react";
import {
  getWebPushStatus,
  subscribeWebPush,
  unsubscribeWebPush,
  isWebPushSupported,
} from "@/lib/webPush";

export function WebPushToggle({ className = "" }: { className?: string }) {
  const [status, setStatus] = useState<
    "loading" | "unsupported" | "denied" | "subscribed" | "unsubscribed"
  >("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getWebPushStatus().then(setStatus);
  }, []);

  async function enable() {
    setBusy(true);
    setMessage("");
    const result = await subscribeWebPush();
    if (result.ok) {
      setStatus("subscribed");
      setMessage("Browser notifications enabled");
    } else {
      setMessage(result.error || "Failed");
      setStatus(await getWebPushStatus());
    }
    setBusy(false);
  }

  async function disable() {
    setBusy(true);
    setMessage("");
    await unsubscribeWebPush();
    setStatus("unsubscribed");
    setMessage("Browser notifications disabled");
    setBusy(false);
  }

  if (status === "loading") return null;
  if (status === "unsupported") {
    return (
      <p className={`text-sm text-slate-500 ${className}`}>
        This browser does not support web push notifications.
      </p>
    );
  }
  if (status === "denied") {
    return (
      <p className={`text-sm text-amber-700 ${className}`}>
        Notifications are blocked. Enable them in your browser settings.
      </p>
    );
  }

  return (
    <div className={className}>
      {status === "subscribed" ? (
        <button
          type="button"
          onClick={disable}
          disabled={busy}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {busy ? "…" : "Disable browser notifications"}
        </button>
      ) : (
        <button
          type="button"
          onClick={enable}
          disabled={busy}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? "Enabling…" : "Enable browser notifications"}
        </button>
      )}
      {message && <p className="mt-2 text-sm text-slate-600">{message}</p>}
    </div>
  );
}

/** Compact version for footer / nav */
export function WebPushBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isWebPushSupported()) return;
    getWebPushStatus().then((s) => {
      if (s === "unsubscribed") setShow(true);
    });
  }, []);

  if (!show) return null;

  return (
    <div className="border-b bg-brand-50 px-4 py-2 text-center text-sm text-brand-900">
      Get alerts for live services and updates.{" "}
      <button
        type="button"
        className="font-semibold underline"
        onClick={async () => {
          const r = await subscribeWebPush();
          if (r.ok) setShow(false);
        }}
      >
        Enable notifications
      </button>
    </div>
  );
}
