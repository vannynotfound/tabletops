import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tabletop",
  description: "A cheerful workspace for your users, products, categories, and orders.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
