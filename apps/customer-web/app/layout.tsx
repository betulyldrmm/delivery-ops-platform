import "./globals.css";
import Link from "next/link";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        <main className="p-4 pb-16">{children}</main>
        <nav className="fixed bottom-0 left-0 right-0 border-t bg-white flex justify-around text-xs py-2">
          <Link href="/">Home</Link>
          <Link href="/orders">Orders</Link>
          <Link href="/notifications">Alerts</Link>
          <Link href="/profile">Profile</Link>
        </nav>
      </body>
    </html>
  );
}
