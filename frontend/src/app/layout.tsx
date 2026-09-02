import type {
  Metadata,
} from "next";

import {
  AuthProvider,
} from "@/context/AuthContext";

import "./globals.css";


export const metadata: Metadata = {
  title: "Auth Full Stack",
  description:
    "Ejemplo completo de autenticación",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
