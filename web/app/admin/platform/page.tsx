"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy path — platform console lives at /platform (qing-school style). */
export default function AdminPlatformRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/platform");
  }, [router]);
  return (
    <p className="p-8 text-sm text-slate-500">Opening platform dashboard…</p>
  );
}
