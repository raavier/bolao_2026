import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { displayName } from "@/lib/display-name";

export const dynamic = "force-dynamic";

const JANELA_HORAS = 8;

export default async function EstatisticasPage() {
  const { user, supabase } = await requireUser();

  const { data: me } = await supabase
    .from("participantes")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!me?.is_admin) redirect("/");

  // As RPCs rodam com SECURITY DEFINER e devolvem só nomes (+ contagens) —
  // nunca o conteúdo dos palpites. Cada uma revalida is_admin() no banco.
  const [{ data: linhas, error }, { data: semCampeao, error: erroCampeao }] =
    await Promise.all([
      supabase.rpc("palpites_em_branco", { janela_horas: JANELA_HORAS }),
      supabase.rpc("campeao_em_branco"),
    ]);

  const pessoas = linhas ?? [];
  const naJanela = pessoas.filter((p) => p.em_branco_janela > 0);
  const semCampeaoLista = semCampeao ?? [];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Estatísticas</h1>
        <p className="text-sm text-foreground/60">
          Visível apenas para administradores. Mostramos só nomes e quantidades —
          nunca o conteúdo dos palpites.
        </p>
      </header>

      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">
            Palpites em branco a vencer nas próximas {JANELA_HORAS}h
          </h2>
          <p className="text-sm text-foreground/60">
            Quem ainda não palpitou em jogos que começam logo. Em branco = sem
            palpite salvo para o jogo.
          </p>
        </div>

        {error ? (
          <p className="text-sm text-red-600">
            Não foi possível carregar a estatística. Tente novamente.
          </p>
        ) : naJanela.length === 0 ? (
          <p className="text-foreground/60">
            Ninguém com palpites em branco nas próximas {JANELA_HORAS}h 🎉
          </p>
        ) : (
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {naJanela.map((p) => (
              <li
                key={p.participante_id}
                className="flex items-center gap-3 py-3 text-sm"
              >
                <span className="flex-1 min-w-0 font-medium truncate">
                  {displayName(p)}
                </span>
                <span className="shrink-0 rounded-md bg-red-600/10 px-2.5 py-1 text-xs font-semibold text-red-700">
                  {p.em_branco_janela} a vencer em {JANELA_HORAS}h
                </span>
                <span className="shrink-0 text-xs text-foreground/50">
                  {p.em_branco_total} no total
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Sem palpite de campeão</h2>
          <p className="text-sm text-foreground/60">
            Quem ainda não escolheu a seleção campeã. Fecha no apito do 1º jogo
            (prazo único para todos). Após o 1º apito, não aparece mais aqui.
          </p>
        </div>

        {erroCampeao ? (
          <p className="text-sm text-red-600">
            Não foi possível carregar a estatística. Tente novamente.
          </p>
        ) : semCampeaoLista.length === 0 ? (
          <p className="text-foreground/60">
            Todo mundo já escolheu o campeão (ou o prazo já fechou) 🏆
          </p>
        ) : (
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {semCampeaoLista.map((p) => (
              <li
                key={p.participante_id}
                className="flex items-center gap-3 py-3 text-sm"
              >
                <span className="flex-1 min-w-0 truncate">{displayName(p)}</span>
                <span className="shrink-0 rounded-md bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  sem campeão 🏆
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {pessoas.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Total de palpites em branco</h2>
          <p className="text-sm text-foreground/60">
            Considerando todos os jogos futuros (não só as próximas {JANELA_HORAS}h).
          </p>
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {pessoas.map((p) => (
              <li
                key={p.participante_id}
                className="flex items-center gap-3 py-2.5 text-sm"
              >
                <span className="flex-1 min-w-0 truncate">{displayName(p)}</span>
                <span className="shrink-0 text-xs text-foreground/60">
                  {p.em_branco_total} em branco
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
