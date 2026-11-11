"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { getSessionSnapshot, parseSession, subscribeToSession } from "@/lib/api";

export default function PublicRouteGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const sessionSnapshot = useSyncExternalStore(subscribeToSession, getSessionSnapshot, () => null);
  const hasSession = Boolean(parseSession(sessionSnapshot));

  useEffect(() => {
    if (hasSession) router.replace("/dashboard");
  }, [hasSession, router]);

  if (hasSession) {
    return <main className="route-loading" aria-live="polite">Opening your workspace...</main>;
  }

  return children;
}
