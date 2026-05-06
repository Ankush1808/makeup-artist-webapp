"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Home", href: "/dashboard", icon: "🏠" },
  { label: "Quotes", href: "/quotations", icon: "📄" },
  { label: "New", href: "/quotations/new", icon: "➕" },
  { label: "Events", href: "/bookings", icon: "💍" },
  { label: "Profile", href: "/profile", icon: "👤" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-pink-100 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
      <div className="max-w-3xl mx-auto grid grid-cols-5 px-2 py-2">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-xs transition ${
                active
                  ? "bg-pink-100 text-pink-900 font-semibold"
                  : "text-gray-500 hover:text-pink-800"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}