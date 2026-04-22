import Link from "next/link"
import { LockKeyhole } from "lucide-react"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  getSiteSession,
  isSiteSecurityConfigured,
} from "@/lib/security/site-auth"

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Mot de passe incorrect. Réessaie.",
  missing: "Entre le mot de passe pour continuer.",
  config: "La protection du site n'est pas encore configurée côté serveur.",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await getSiteSession()

  if (session) {
    redirect("/")
  }

  const { error } = await searchParams
  const errorMessage = !isSiteSecurityConfigured()
    ? ERROR_MESSAGES.config
    : error
      ? ERROR_MESSAGES[error] ?? ERROR_MESSAGES.invalid
      : null

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(218,165,32,0.18),_transparent_30%),linear-gradient(180deg,_#fffdf7_0%,_#fff8ec_58%,_#f5eddc_100%)] px-4 py-8">
      <Card className="w-full max-w-md border-white/70 bg-white/92 shadow-[0_26px_80px_-36px_rgba(15,23,42,0.42)]">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-slate-950 text-white shadow-lg">
            <LockKeyhole className="size-6" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
              Accès protégé
            </p>
            <CardTitle className="font-heading text-3xl text-slate-950">
              Entrez le mot de passe
            </CardTitle>
            <p className="text-sm leading-6 text-slate-600">
              Le site est protégé par un mot de passe unique.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action="/api/auth/login" method="post" className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-800"
              >
                Mot de passe
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                disabled={!isSiteSecurityConfigured()}
                required
              />
            </div>

            {errorMessage ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!isSiteSecurityConfigured()}
            >
              Ouvrir l&apos;application
            </Button>
          </form>

          <p className="text-center text-xs leading-5 text-slate-500">
            Une fois le mot de passe validé, l&apos;accès au site et à Firebase est
            autorisé uniquement pour cette session.
          </p>

          <p className="text-center text-xs text-slate-400">
            Retour au projet{" "}
            <Link href="/" className="underline underline-offset-4">
              s&eacute;curis&eacute;
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
