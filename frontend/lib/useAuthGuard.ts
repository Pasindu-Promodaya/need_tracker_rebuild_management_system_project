"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";

export function useAuthGuard() {
  const { user, loading: isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user && pathname !== "/login") {
        queueMicrotask(() => setAuthorized(false));
        router.push("/login");
      } else {
        queueMicrotask(() => setAuthorized(true));
      }
    }
  }, [user, isLoading, router, pathname]);

  return { authorized, isLoading };
}

/**
 * Guard that requires ADMIN or ORG_ADMIN role.
 * Donors are redirected to the dashboard.
 */
export function useAdminGuard() {
  const { user, loading: isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user && pathname !== "/login") {
        queueMicrotask(() => setAuthorized(false));
        router.push("/login");
      } else if (user && user.role === "DONOR") {
        queueMicrotask(() => setAuthorized(false));
        router.push("/");
      } else if (user) {
        queueMicrotask(() => setAuthorized(true));
      }
    }
  }, [user, isLoading, router, pathname]);

  return { authorized, isLoading };
}
