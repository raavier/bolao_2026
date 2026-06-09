"use server";

import { createClient } from "@/lib/supabase/server";
import { isPredictionOpen } from "@/lib/palpites/lock";
import { displayName } from "@/lib/display-name";

export type PalpiteDeTodos = {
  nome: string;
  golsMandante: number;
  golsVisitante: number;
};

export type VerPalpitesResult =
  | { ok: true; palpites: PalpiteDeTodos[] }
  | { ok: false; error: string };

/**
 * Lista os palpites de TODOS para um jogo — só liberado após o apito inicial.
 * O RLS também só devolve palpites alheios de jogos já iniciados; aqui
 * checamos antes para dar uma mensagem clara.
 */
export async function verPalpitesDoJogo(jogoId: number): Promise<VerPalpitesResult> {
  const supabase = await createClient();

  const { data: jogo } = await supabase
    .from("jogos")
    .select("inicio")
    .eq("id", jogoId)
    .single();

  if (!jogo) return { ok: false, error: "Jogo não encontrado." };

  if (isPredictionOpen(new Date(jogo.inicio))) {
    return { ok: false, error: "Os palpites aparecem após o início do jogo." };
  }

  const { data: rows, error } = await supabase
    .from("palpites")
    .select("participante_id, gols_mandante, gols_visitante")
    .eq("jogo_id", jogoId);

  if (error) return { ok: false, error: "Não foi possível carregar os palpites." };

  const { data: pessoas } = await supabase
    .from("participantes")
    .select("id, nome, nickname");
  const nomePorId = new Map((pessoas ?? []).map((p) => [p.id, displayName(p)]));

  const palpites = (rows ?? [])
    .map((row) => ({
      nome: nomePorId.get(row.participante_id) ?? "—",
      golsMandante: row.gols_mandante,
      golsVisitante: row.gols_visitante,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return { ok: true, palpites };
}
