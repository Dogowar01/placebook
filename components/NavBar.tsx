"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Clock, BookOpen, Utensils, Award } from "lucide-react";

const NAV = [
  { href: "/map", icon: Map, label: "Map" },
  { href: "/timeline", icon: Clock, label: "Timeline" },
  { href: "/food", icon: Utensils, label: "Food" },
  { href: "/passport", icon: Award, label: "Passport" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                active ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
