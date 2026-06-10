import { requireUser } from "@/lib/auth";
import { CampeaoForm } from "./campeao-form";
import { PalpitesList, type JogoPalpite } from "./palpites-list";

export const dynamic = "force-dynamic";

export default async function PalpitesPage() {
  const { user, supabase } = await requireUser();

  const [{ data: jogos }, { data: palpites }, { data: campeao }] =
    await Promise.all([
      supabase
        .from("jogos")
        .select("id, fase, grupo, mandante, visitante, inicio")
        .order("inicio", { ascending: true }),
      supabase
        .from("palpites")
        .select("jogo_id, gols_mandante, gols_visitante")
        .eq("participante_id", user.id),
      supabase
        .from("palpite_campeao")
        .select("selecao")
        .eq("participante_id", user.id)
        .maybeSingle(),
    ]);

  const palpitePorJogo = new Map((palpites ?? []).map((p) => [p.jogo_id, p]));
  // Jogos vêm ordenados por inicio — o primeiro é o apito que fecha o campeão.
  const primeiroApitoIso = jogos?.[0]?.inicio ?? null;

  const dados: JogoPalpite[] = (jogos ?? []).map((jogo) => {
    const palpite = palpitePorJogo.get(jogo.id);
    return {
      id: jogo.id,
      fase: jogo.fase,
      grupo: jogo.grupo,
      mandante: jogo.mandante,
      visitante: jogo.visitante,
      inicio: jogo.inicio,
      palpiteMandante: palpite?.gols_mandante ?? null,
      palpiteVisitante: palpite?.gols_visitante ?? null,
    };
  });

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Meus palpites</h1>
        <p className="text-sm text-foreground/60">
          O palpite pode ser editado até a hora exata do apito inicial de cada
          jogo. Depois disso, trava.
        </p>
      </header>

      <CampeaoForm
        campeaoSalvo={campeao?.selecao ?? null}
        primeiroApitoIso={primeiroApitoIso}
      />

      {dados.length === 0 ? (
        <p className="text-foreground/60">Os jogos ainda não foram cadastrados.</p>
      ) : (
        <PalpitesList jogos={dados} />
      )}
    </div>
  );
}
