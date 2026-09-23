"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy path — profile lives at /profile */
export default function MeRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/profile");
  }, [router]);
  return (
    <p className="p-8 text-center text-sm text-slate-500">Opening your profile…</p>
  );
}
