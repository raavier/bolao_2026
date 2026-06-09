"use client";

import { useMemo, useState } from "react";
import { GROUPS, ALL_TEAMS } from "@/lib/groups";
import { formatKickoff } from "@/lib/format";
import { PalpiteForm } from "./palpite-form";

export type JogoPalpite = {
  id: number;
  grupo: string | null;
  mandante: string;
  visitante: string;
  inicio: string;
  palpiteMandante: number | null;
  palpiteVisitante: number | null;
};

type Status = "salvo" | "fechado" | "em_branco";

const STATUS_LABEL: Record<Status, string> = {
  salvo: "Salvos",
  em_branco: "Em branco",
  fechado: "Fechados",
};

function statusDoJogo(jogo: JogoPalpite, agora: number): Status {
  if (new Date(jogo.inicio).getTime() <= agora) return "fechado";
  if (jogo.palpiteMandante !== null && jogo.palpiteVisitante !== null) return "salvo";
  return "em_branco";
}

const GROUP_LETTERS = Object.keys(GROUPS);

export function PalpitesList({ jogos }: { jogos: JogoPalpite[] }) {
  const [grupo, setGrupo] = useState<string>("");
  const [selecao, setSelecao] = useState<string>("");
  // Padrão: mostra só os que dá para agir — salvos e em branco (esconde fechados).
  const [status, setStatus] = useState<Record<Status, boolean>>({
    salvo: true,
    em_branco: true,
    fechado: false,
  });

  // Snapshot do momento atual (lazy): estável entre renders para o filtro.
  const [agora] = useState(() => Date.now());

  const filtrados = useMemo(() => {
    return jogos.filter((jogo) => {
      if (grupo && jogo.grupo !== grupo) return false;
      if (selecao && jogo.mandante !== selecao && jogo.visitante !== selecao) return false;
      if (!status[statusDoJogo(jogo, agora)]) return false;
      return true;
    });
  }, [jogos, grupo, selecao, status, agora]);

  const toggleStatus = (s: Status) =>
    setStatus((prev) => ({ ...prev, [s]: !prev[s] }));

  const selectClass =
    "rounded-md border border-black/15 dark:border-white/20 bg-transparent px-2 py-1.5 text-base sm:text-sm";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <label className="flex items-center gap-1">
          <span className="text-foreground/60">Grupo:</span>
          <select value={grupo} onChange={(e) => setGrupo(e.target.value)} className={selectClass}>
            <option value="">Todos</option>
            {GROUP_LETTERS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1">
          <span className="text-foreground/60">Seleção:</span>
          <select value={selecao} onChange={(e) => setSelecao(e.target.value)} className={selectClass}>
            <option value="">Todas</option>
            {ALL_TEAMS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <span className="text-foreground/60">Status:</span>
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleStatus(s)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                status[s]
                  ? "border-foreground bg-foreground text-background"
                  : "border-black/20 dark:border-white/25 text-foreground/60"
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {filtrados.length === 0 ? (
        <p className="text-sm text-foreground/50">Nenhum jogo com esses filtros.</p>
      ) : (
        <div>
          {filtrados.map((jogo) => (
            <PalpiteForm
              key={jogo.id}
              jogoId={jogo.id}
              mandante={jogo.mandante}
              visitante={jogo.visitante}
              inicioLabel={formatKickoff(jogo.inicio)}
              kickoffIso={jogo.inicio}
              palpiteMandante={jogo.palpiteMandante}
              palpiteVisitante={jogo.palpiteVisitante}
            />
          ))}
        </div>
      )}
    </div>
  );
}
