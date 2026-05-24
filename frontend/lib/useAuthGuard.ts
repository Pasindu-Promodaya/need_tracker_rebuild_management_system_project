"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";

export function useAuthGuard() {
  const { user, loading: isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const authorized = !isLoading && (!!user || pathname === "/login");

  useEffect(() => {
    if (!isLoading) {
      if (!user && pathname !== "/login") {
<<<<<<< HEAD
        queueMicrotask(() => setAuthorized(false));
        router.push("/login");
      } else {
        queueMicrotask(() => setAuthorized(true));
=======
        router.push("/login");
>>>>>>> ee8f292309a68b75570710e7368a64d7191a40d6
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

  const authorized = !isLoading && (
    (user && user.role !== "DONOR") || 
    (!user && pathname === "/login")
  );

  useEffect(() => {
    if (!isLoading) {
      if (!user && pathname !== "/login") {
<<<<<<< HEAD
        queueMicrotask(() => setAuthorized(false));
        router.push("/login");
      } else if (user && user.role === "DONOR") {
        queueMicrotask(() => setAuthorized(false));
        router.push("/");
      } else if (user) {
        queueMicrotask(() => setAuthorized(true));
=======
        router.push("/login");
      } else if (user && user.role === "DONOR") {
        router.push("/");
>>>>>>> ee8f292309a68b75570710e7368a64d7191a40d6
      }
    }
  }, [user, isLoading, router, pathname]);

  return { authorized: !!authorized, isLoading };
}
