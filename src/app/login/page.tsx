"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = { kind: "idle" } | { kind: "sent" } | { kind: "error"; message: string };

const callbackUrl = () => `${window.location.origin}/auth/callback`;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();

  const signInWithGoogle = () => {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl() },
      });
      // Em caso de sucesso o navegador é redirecionado para o Google,
      // então só tratamos o erro aqui.
      if (error) setStatus({ kind: "error", message: error.message });
    });
  };

  const sendLink = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: callbackUrl() },
      });
      setStatus(
        error ? { kind: "error", message: error.message } : { kind: "sent" },
      );
    });
  };

  if (status.kind === "sent") {
    return (
      <div className="max-w-sm mx-auto space-y-3 text-center">
        <h1 className="text-2xl font-bold">Confira seu email</h1>
        <p className="text-foreground/70">
          Enviamos um link de acesso para <strong>{email}</strong>. Clique nele
          para entrar — o link funciona só uma vez.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Entrar</h1>
        <p className="text-sm text-foreground/60">
          Entre com o Google ou receba um link de acesso por email.
        </p>
      </header>

      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={isPending}
        className="w-full rounded-md border border-black/15 dark:border-white/20 py-2 text-sm font-medium flex items-center justify-center gap-2 hover:bg-foreground/5 disabled:opacity-60"
      >
        <GoogleIcon />
        Entrar com Google
      </button>

      <div className="flex items-center gap-3 text-xs text-foreground/40">
        <span className="h-px flex-1 bg-foreground/15" />
        ou
        <span className="h-px flex-1 bg-foreground/15" />
      </div>

      <form onSubmit={sendLink} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="voce@email.com"
          className="w-full rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-base sm:text-sm"
        />
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-foreground text-background py-2 text-sm font-medium disabled:opacity-60"
        >
          {isPending ? "Enviando…" : "Receber link por email"}
        </button>
      </form>

      {status.kind === "error" ? (
        <p className="text-sm text-red-600">{status.message}</p>
      ) : null}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
