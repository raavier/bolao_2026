import { createClient } from "@/lib/supabase/server";
import { loadScoringConfig } from "@/lib/scoring/load-config";
import {
  computeRanking,
  participantBreakdown,
  type BreakdownGame,
  type RankingPrediction,
} from "@/lib/scoring/ranking";
import { displayName } from "@/lib/display-name";
import { RankingTable, type RankingTableRow } from "./ranking-table";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const supabase = await createClient();
  const config = loadScoringConfig();

  const [{ data: participantes }, { data: jogos }] = await Promise.all([
    supabase.from("participantes").select("id, nome, nickname"),
    supabase
      .from("jogos")
      .select("id, fase, mandante, visitante, gols_mandante, gols_visitante")
      .eq("status", "encerrado"),
  ]);

  const jogosEncerrados = (jogos ?? []).filter(
    (j) => j.gols_mandante !== null && j.gols_visitante !== null,
  );
  const jogoIds = jogosEncerrados.map((j) => j.id);

  const { data: palpites } = jogoIds.length
    ? await supabase
        .from("palpites")
        .select("participante_id, jogo_id, gols_mandante, gols_visitante")
        .in("jogo_id", jogoIds)
    : { data: [] };

  const games: BreakdownGame[] = jogosEncerrados.map((j) => ({
    id: j.id,
    phase: j.fase,
    mandante: j.mandante,
    visitante: j.visitante,
    golsMandante: j.gols_mandante as number,
    golsVisitante: j.gols_visitante as number,
  }));

  const predictions: RankingPrediction[] = (palpites ?? []).map((p) => ({
    participanteId: p.participante_id,
    jogoId: p.jogo_id,
    golsMandante: p.gols_mandante,
    golsVisitante: p.gols_visitante,
  }));

  const ranking = computeRanking(
    (participantes ?? []).map((p) => ({ id: p.id, nome: displayName(p) })),
    games,
    predictions,
    config,
  );

  const rows: RankingTableRow[] = ranking.map((row) => ({
    ...row,
    breakdown: participantBreakdown(row.id, games, predictions, config),
  }));

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Ranking</h1>
        <p className="text-sm text-foreground/60">
          {jogosEncerrados.length === 0
            ? "Ainda não há jogos encerrados. O ranking aparece quando os resultados começarem."
            : `Baseado em ${jogosEncerrados.length} jogo(s) encerrado(s). Clique num nome para ver os detalhes.`}
        </p>
      </header>

      <RankingTable rows={rows} />
    </div>
  );
}
