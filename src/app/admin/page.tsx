import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { formatKickoff } from "@/lib/format";
import { displayName } from "@/lib/display-name";
import { setBlocked } from "./actions";

export default async function AdminPage() {
  const { user, supabase } = await requireUser();

  const { data: me } = await supabase
    .from("participantes")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!me?.is_admin) redirect("/");

  const { data: participantes } = await supabase
    .from("participantes")
    .select("id, nome, nickname, email, bloqueado, is_admin, criado_em")
    .order("criado_em", { ascending: true });

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Admin — participantes</h1>
        <p className="text-sm text-foreground/60">
          Quem entrou no bolão. Você pode bloquear alguém — o bloqueado não
          consegue mais registrar nem editar palpites.
        </p>
        <Link
          href="/admin/resultados"
          className="inline-block text-sm text-foreground/70 hover:text-foreground underline underline-offset-2"
        >
          → Lançar resultados dos jogos
        </Link>
      </header>

      <ul className="divide-y divide-black/5 dark:divide-white/10">
        {(participantes ?? []).map((p) => {
          const isSelf = p.id === user.id;
          return (
            <li key={p.id} className="flex items-center gap-3 py-3 text-sm">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {displayName(p)}
                  {p.is_admin ? (
                    <span className="ml-2 text-xs text-foreground/50">(admin)</span>
                  ) : null}
                  {p.bloqueado ? (
                    <span className="ml-2 text-xs text-red-600">bloqueado</span>
                  ) : null}
                </p>
                <p className="text-xs text-foreground/50 truncate">{p.email}</p>
                <p className="text-xs text-foreground/40">
                  entrou em {formatKickoff(p.criado_em)}
                </p>
              </div>
              {isSelf ? (
                <span className="text-xs text-foreground/40">você</span>
              ) : (
                <form action={setBlocked}>
                  <input type="hidden" name="participanteId" value={p.id} />
                  <input
                    type="hidden"
                    name="bloquear"
                    value={p.bloqueado ? "false" : "true"}
                  />
                  <button
                    type="submit"
                    className={`rounded-md px-3 py-1 text-xs font-medium border ${
                      p.bloqueado
                        ? "border-green-600/40 text-green-700 hover:bg-green-600/10"
                        : "border-red-600/40 text-red-700 hover:bg-red-600/10"
                    }`}
                  >
                    {p.bloqueado ? "Desbloquear" : "Bloquear"}
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
