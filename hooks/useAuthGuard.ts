"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { getSessionSnapshot, parseSession, subscribeToSession } from "@/lib/api";

export default function useAuthGuard(redirectTo = "/login") {
  const router = useRouter();
  const sessionSnapshot = useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    () => null,
  );
  const session = parseSession(sessionSnapshot);
  const hasSession = Boolean(session);

  useEffect(() => {
    if (!hasSession) router.replace(redirectTo);
  }, [hasSession, redirectTo, router]);

  return { session, isChecking: !session };
}