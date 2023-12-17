import "./ui/global.css";
import { inter } from "@/app/ui/fonts";
import { Metadata } from "next";
import Head from "next/head";
import { auth } from "@/auth";
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
  // const { user } = await auth();
  //console.log("user: ", user);
  //const { email } = user;
  //console.log("email: ", email);

  return (
    <html lang="es">
      <body className={`${inter.className} antialiased`}>
        {children} {/* CONTROLAR QUE FUNCIONA */}
      </body>
    </html>
  );
}
