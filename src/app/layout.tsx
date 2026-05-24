import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dashboard Ejecutivo | Montajes Imeca",
  description:
    "Centro de Operaciones en Tiempo Real — Montajes Imeca. Estado de obras, alertas críticas, pulso financiero y gestión de recursos humanos industriales.",
  keywords: ["Imeca", "obras", "montaje industrial", "dashboard", "ERP"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${outfit.variable} antialiased`}>{children}</body>
    </html>
  );
}
