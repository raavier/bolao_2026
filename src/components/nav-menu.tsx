"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "@/app/auth/actions";

export type NavLink = { href: string; label: string };

type NavMenuProps = {
  links: NavLink[];
  isLoggedIn: boolean;
};

const linkClass =
  "text-foreground/70 hover:text-foreground transition-colors";

export function NavMenu({ links, isLoggedIn }: NavMenuProps) {
  const [open, setOpen] = useState(false);

  const authLink = isLoggedIn ? (
    <form action={signOut}>
      <button type="submit" className={linkClass} onClick={() => setOpen(false)}>
        Sair
      </button>
    </form>
  ) : (
    <Link href="/login" className={linkClass} onClick={() => setOpen(false)}>
      Entrar
    </Link>
  );

  return (
    <header className="border-b border-black/10 dark:border-white/15">
      <nav className="w-full max-w-3xl mx-auto px-4 py-3">
        {/* Linha superior: marca + botão hambúrguer (mobile) */}
        <div className="flex items-center justify-between">
          <Link href="/" className="font-semibold" onClick={() => setOpen(false)}>
            ⚽ Bolão 2026
          </Link>

          {/* Links em linha — só no desktop */}
          <div className="hidden sm:flex items-center gap-x-5 text-sm">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </Link>
            ))}
            {authLink}
          </div>

          {/* Botão hambúrguer — só no mobile */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            className="sm:hidden text-2xl leading-none px-2 -mr-2 text-foreground/80"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>

        {/* Painel vertical — só no mobile, quando aberto */}
        {open ? (
          <div className="sm:hidden flex flex-col mt-2 pt-2 border-t border-black/10 dark:border-white/15 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="py-2.5 text-foreground/80 hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <div className="py-2.5">{authLink}</div>
          </div>
        ) : null}
      </nav>
    </header>
  );
}
