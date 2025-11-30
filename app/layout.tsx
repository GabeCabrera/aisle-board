import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aisle - Wedding Planner",
  description: "A calm, beautiful space to plan your wedding together.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Providers>
          {children}
        </Providers>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 300,
            },
          }}
        />
      </body>
    </html>
  );
}
