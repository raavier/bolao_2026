import { createClient } from "@/lib/supabase/server";
import { GROUPS } from "@/lib/groups";
import { computeGroupStandings, type StandingsGame } from "@/lib/scoring/standings";
import { Flag } from "@/components/flag";

export const dynamic = "force-dynamic";

export default async function GruposPage() {
  const supabase = await createClient();
  const { data: jogos } = await supabase
    .from("jogos")
    .select("grupo, mandante, visitante, gols_mandante, gols_visitante, status")
    .eq("fase", "group")
    .eq("status", "encerrado");

  const games: StandingsGame[] = (jogos ?? [])
    .filter((j) => j.grupo && j.gols_mandante !== null && j.gols_visitante !== null)
    .map((j) => ({
      grupo: j.grupo as string,
      mandante: j.mandante,
      visitante: j.visitante,
      golsMandante: j.gols_mandante as number,
      golsVisitante: j.gols_visitante as number,
    }));

  const standings = computeGroupStandings(GROUPS, games);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Grupos</h1>
        <p className="text-sm text-foreground/60">
          Classificação calculada pelos resultados. Os 2 primeiros de cada grupo
          (destacados) avançam, além dos 8 melhores terceiros.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        {standings.map((grupo) => (
          <section key={grupo.grupo} className="space-y-1">
            <h2 className="text-sm font-semibold">Grupo {grupo.grupo}</h2>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="text-foreground/50 border-b border-black/10 dark:border-white/15">
                  <th className="py-1 text-left font-normal">Time</th>
                  <th className="py-1 text-right font-normal" title="Jogos">J</th>
                  <th className="py-1 text-right font-normal" title="Saldo de gols">SG</th>
                  <th className="py-1 text-right font-normal" title="Pontos">P</th>
                </tr>
              </thead>
              <tbody>
                {grupo.linhas.map((linha, index) => (
                  <tr
                    key={linha.time}
                    className={`border-b border-black/5 dark:border-white/10 ${
                      index < 2 ? "font-medium" : "text-foreground/70"
                    }`}
                  >
                    <td className="py-1 flex items-center gap-2">
                      <span className="text-foreground/40 w-3">{index + 1}</span>
                      <Flag team={linha.time} />
                      <span className="truncate">{linha.time}</span>
                    </td>
                    <td className="py-1 text-right text-foreground/60">{linha.jogos}</td>
                    <td className="py-1 text-right text-foreground/60">
                      {linha.saldo > 0 ? `+${linha.saldo}` : linha.saldo}
                    </td>
                    <td className="py-1 text-right font-semibold">{linha.pontos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {grupo.posicaoIndefinida ? (
              <p className="text-[11px] text-amber-600">
                ⚠️ Empate nos critérios básicos — ordem pode mudar por confronto
                direto/fair play.
              </p>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}
