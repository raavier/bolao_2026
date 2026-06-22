import { createClient } from "@/lib/supabase/server";
import { Flag } from "@/components/flag";
import { PhaseTag } from "@/components/phase-tag";
import { formatKickoff } from "@/lib/format";
import { isPredictionOpen } from "@/lib/palpites/lock";
import { isWithinPinWindow } from "@/lib/jogos/live-window";
import type { Phase } from "@/lib/scoring/phases";
import type { ShareJogo } from "@/lib/jogos/share-text";
import { VerPalpites } from "./ver-palpites";
import { VerCampeao } from "./ver-campeao";

export const dynamic = "force-dynamic";

type Jogo = {
  id: number;
  fase: Phase;
  grupo: string | null;
  inicio: string;
  mandante: string;
  visitante: string;
  gols_mandante: number | null;
  gols_visitante: number | null;
  status: string;
};

/** Linha de um jogo: cabeçalho com fase/horário, placar e os palpites de todos. */
function JogoItem({ jogo }: { jogo: Jogo }) {
  const encerrado = jogo.status === "encerrado";
  const comecou = !isPredictionOpen(new Date(jogo.inicio));
  const share: ShareJogo = {
    mandante: jogo.mandante,
    visitante: jogo.visitante,
    quando: formatKickoff(jogo.inicio),
    golsMandante: encerrado ? jogo.gols_mandante : null,
    golsVisitante: encerrado ? jogo.gols_visitante : null,
  };

  return (
    <>
      <div className="flex items-center gap-2 text-xs text-foreground/50">
        <PhaseTag phase={jogo.fase} />
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
      {comecou ? <VerPalpites jogoId={jogo.id} jogo={share} /> : null}
    </>
  );
}

export default async function JogosPage() {
  const supabase = await createClient();
  const { data: jogos } = await supabase
    .from("jogos")
    .select("id, fase, grupo, inicio, mandante, visitante, gols_mandante, gols_visitante, status")
    .order("inicio", { ascending: true });

  // O palpite de campeão fecha no apito do 1º jogo (prazo global); a partir daí
  // dá para ver o de todos. Jogos vêm ordenados por inicio — o 1º é o apito.
  const primeiroApito = jogos?.[0]?.inicio ?? null;
  const campeaoLiberado =
    primeiroApito !== null && !isPredictionOpen(new Date(primeiroApito));

  // Jogos "em andamento": já começaram e ainda não fazem 3h do apito. Ficam
  // fixados no topo (pode haver mais de um simultâneo).
  const agora = new Date();
  const fixados = (jogos ?? []).filter((j) =>
    isWithinPinWindow(new Date(j.inicio), agora),
  );

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Jogos</h1>
        <p className="text-sm text-foreground/60">
          Calendário e resultados. Depois que um jogo começa, dá para ver o
          palpite de cada um.
        </p>
      </header>

      {campeaoLiberado ? <VerCampeao /> : null}

      {fixados.length > 0 ? (
        <section className="rounded-lg border border-[#25D366]/40 bg-[#25D366]/[0.06] p-3 space-y-3">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground/80">
            <span className="inline-block w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
            Em andamento
          </h2>
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {fixados.map((jogo) => (
              <li key={jogo.id} className="py-2 first:pt-0 last:pb-0">
                <JogoItem jogo={jogo} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ul className="divide-y divide-black/5 dark:divide-white/10">
        {(jogos ?? []).map((jogo) => (
          <li key={jogo.id} className="py-3">
            <JogoItem jogo={jogo} />
          </li>
        ))}
      </ul>
    </div>
  );
}
