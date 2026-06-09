import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

const NAV_LINKS = [
  { href: "/", label: "Início" },
  { href: "/ranking", label: "Ranking" },
  { href: "/jogos", label: "Jogos" },
  { href: "/palpites", label: "Meus palpites" },
  { href: "/regras", label: "Regras" },
] as const;

export async function SiteNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = user
    ? Boolean(
        (
          await supabase
            .from("participantes")
            .select("is_admin")
            .eq("id", user.id)
            .single()
        ).data?.is_admin,
      )
    : false;

  return (
    <header className="border-b border-black/10 dark:border-white/15">
      <nav className="w-full max-w-3xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <span className="font-semibold mr-2">⚽ Bolão 2026</span>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-foreground/70 hover:text-foreground transition-colors"
          >
            {link.label}
          </Link>
        ))}
        {isAdmin ? (
          <Link
            href="/admin"
            className="text-foreground/70 hover:text-foreground transition-colors"
          >
            Admin
          </Link>
        ) : null}
        {user ? (
          <LogoutButton />
        ) : (
          <Link
            href="/login"
            className="ml-auto text-foreground/70 hover:text-foreground transition-colors"
          >
            Entrar
          </Link>
        )}
      </nav>
    </header>
  );
}
