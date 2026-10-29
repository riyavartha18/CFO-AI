import type { Metadata } from "next";
import "./globals.css";
import { CompanyProvider } from "@/lib/CompanyContext";

export const metadata: Metadata = {
  title: "Smart CFO - AI Financial Intelligence",
  description: "Next-generation financial risk analytics and ML CFO engine",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#090b0f] text-zinc-100 antialiased">
        <CompanyProvider>{children}</CompanyProvider>
      </body>
    </html>
  );
}
