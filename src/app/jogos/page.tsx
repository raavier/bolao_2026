import { createClient } from "@/lib/supabase/server";
import { Flag } from "@/components/flag";
import { formatKickoff } from "@/lib/format";
import { isPredictionOpen } from "@/lib/palpites/lock";
import { VerPalpites } from "./ver-palpites";

export const dynamic = "force-dynamic";

export default async function JogosPage() {
  const supabase = await createClient();
  const { data: jogos } = await supabase
    .from("jogos")
    .select("id, grupo, inicio, mandante, visitante, gols_mandante, gols_visitante, status")
    .order("inicio", { ascending: true });

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Jogos</h1>
        <p className="text-sm text-foreground/60">
          Calendário e resultados. Depois que um jogo começa, dá para ver o
          palpite de cada um.
        </p>
      </header>

      <ul className="divide-y divide-black/5 dark:divide-white/10">
        {(jogos ?? []).map((jogo) => {
          const encerrado = jogo.status === "encerrado";
          const comecou = !isPredictionOpen(new Date(jogo.inicio));
          return (
            <li key={jogo.id} className="py-3">
              <div className="flex items-center gap-1 text-xs text-foreground/50">
                <span>{formatKickoff(jogo.inicio)}</span>
                {jogo.grupo ? <span>· Grupo {jogo.grupo}</span> : null}
              </div>
              <div className="flex items-center gap-2 text-sm mt-1">
                <span className="flex-1 flex items-center justify-end gap-2 min-w-0">
                  <span className="truncate">{jogo.mandante}</span>
                  <Flag team={jogo.mandante} />
                </span>
                <span className="font-semibold tabular-nums px-1">
                  {encerrado
                    ? `${jogo.gols_mandante} × ${jogo.gols_visitante}`
                    : "×"}
                </span>
                <span className="flex-1 flex items-center gap-2 min-w-0">
                  <Flag team={jogo.visitante} />
                  <span className="truncate">{jogo.visitante}</span>
                </span>
              </div>
              {comecou ? <VerPalpites jogoId={jogo.id} /> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
