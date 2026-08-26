"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { defaultRouteForRole, useAuth } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      router.replace(user ? defaultRouteForRole(user.papel) : "/login");
    }
  }, [loading, router, user]);

  return <main className="center-screen">Abrindo SGCAS...</main>;
}
