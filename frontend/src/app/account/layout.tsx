"use client";

import {
  ReactNode,
} from "react";

import PrivateRoute
  from "@/components/PrivateRoute";


export default function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PrivateRoute>
      {children}
    </PrivateRoute>
  );
}
