"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Aujourd'hui", emoji: "🍼" },
  { href: "/historique", label: "Historique", emoji: "📖" },
  { href: "/stats", label: "Stats", emoji: "📊" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-(--color-line) bg-(--color-surface)/95 backdrop-blur z-30">
      <ul className="mx-auto flex max-w-md justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {tabs.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={`flex flex-col items-center gap-0.5 rounded-2xl py-2 text-xs transition ${
                  active
                    ? "bg-(--color-rose) text-(--color-ink) font-semibold"
                    : "text-(--color-ink-soft)"
                }`}
              >
                <span className="text-lg leading-none">{t.emoji}</span>
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
