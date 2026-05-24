"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV = [
  { label: "Dashboard", href: "/",        icon: "⬛" },
  { label: "Quizzes",   href: "/quizzes", icon: "📋" },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-56 shrink-0 flex-col bg-indigo-700 text-white">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-indigo-600">
        <span className="text-xl font-bold tracking-tight">Quizee</span>
        <span className="ml-2 rounded bg-indigo-500 px-2 py-0.5 text-xs font-semibold">Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ label, href, icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-indigo-600 text-white" : "text-indigo-100 hover:bg-indigo-600/60"
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 text-xs text-indigo-300 border-t border-indigo-600">
        Quiz Catalogue Admin
      </div>
    </aside>
  )
}
