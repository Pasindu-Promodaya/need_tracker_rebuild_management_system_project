"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (user?.role === "ADMIN") {
        // Redirect ADMIN users to approvals
        router.push("/admin/approvals");
      } else if (user?.role !== "ORG_ADMIN") {
        // Redirect non-admin users to home
        router.push("/");
      }
    }
  }, [user, authLoading, router]);

  return null;
}
