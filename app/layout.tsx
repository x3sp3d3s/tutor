import "./ui/global.css";
import { inter } from "@/app/ui/fonts";
import { Metadata } from "next";

import React from "react";

export const metadata: Metadata = {
  title: {
    template: "%s | Tutor Dashboard",
    default: "Tutor Dashboard",
  },
  description: "Control de les classes particulars.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
