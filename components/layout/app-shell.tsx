"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  FileText,
  Settings2,
  UsersRound,
} from "lucide-react"

import { cn } from "@/lib/utils"

const navigationItems = [
  {
    href: "/",
    label: "Générer",
    description: "Créer une quittance en quelques secondes.",
    icon: FileText,
  },
  {
    href: "/biens",
    label: "Biens",
    description: "Gérer les adresses, loyers et références.",
    icon: Building2,
  },
  {
    href: "/locataires",
    label: "Locataires",
    description: "Ajouter et trier les occupants d’un bien.",
    icon: UsersRound,
  },
  {
    href: "/parametres",
    label: "Paramètres",
    description: "Configurer les infos du bailleur.",
    icon: Settings2,
  },
] as const

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href
  }

  return pathname.startsWith(href)
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const currentItem =
    navigationItems.find((item) => isActivePath(pathname, item.href)) ??
    navigationItems[0]

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(218,165,32,0.12),_transparent_32%),linear-gradient(180deg,_#fffdf7_0%,_#fffaf0_52%,_#f8f2e5_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-28 pt-4 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-30 mb-5">
          <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_-32px_rgba(15,23,42,0.38)] backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
                  Quittances de loyer
                </p>
                <div className="space-y-1">
                  <h1 className="font-heading text-3xl font-semibold text-slate-950">
                    {currentItem.label}
                  </h1>
                  <p className="max-w-xl text-sm leading-6 text-slate-600">
                    {currentItem.description}
                  </p>
                </div>
              </div>
              <div className="hidden rounded-[22px] bg-slate-950 px-4 py-3 text-right text-xs font-medium text-white shadow-lg sm:block">
                Flow court
                <br />
                Mobile d’abord
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <nav className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-5xl">
          <div className="mx-auto grid max-w-xl grid-cols-4 gap-1 rounded-[28px] border border-slate-200/80 bg-white/92 p-2 shadow-[0_18px_60px_-28px_rgba(15,23,42,0.42)] backdrop-blur">
            {navigationItems.map((item) => {
              const active = isActivePath(pathname, item.href)
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-[22px] px-3 py-2 text-xs font-medium transition",
                    active
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-amber-50 hover:text-slate-950"
                  )}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
