import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = { title: "MyShop", description: "Next.js + MongoDB store" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
