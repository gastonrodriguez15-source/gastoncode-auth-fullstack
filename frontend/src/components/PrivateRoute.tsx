"use client";

import {
  ReactNode,
  useEffect,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useAuth,
} from "@/context/AuthContext";


export default function PrivateRoute({
  children,
}: {
  children: ReactNode;
}) {
  const router =
    useRouter();

  const {
    status,
  } = useAuth();


  useEffect(() => {
    if (
      status ===
      "unauthenticated"
    ) {
      router.replace(
        "/login"
      );
    }
  }, [
    status,
    router,
  ]);


  if (
    status === "loading"
  ) {
    return (
      <p>
        Cargando sesión...
      </p>
    );
  }


  if (
    status !==
    "authenticated"
  ) {
    return (
      <p>
        Redirigiendo...
      </p>
    );
  }


  return children;
}
