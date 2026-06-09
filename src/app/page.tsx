import Link from "next/link";

const CARDS = [
  { href: "/palpites", title: "Meus palpites", desc: "Registre os placares antes de cada jogo começar." },
  { href: "/ranking", title: "Ranking", desc: "Veja quem está na frente, atualizado a cada resultado." },
  { href: "/jogos", title: "Jogos", desc: "Calendário, resultados e seus palpites." },
  { href: "/regras", title: "Como pontua", desc: "A pontuação completa, do placar exato aos bônus." },
] as const;

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold">Bolão Bolas Crentes 2026</h1>
        <p className="text-foreground/70">
          11 de junho a 19 de julho — 48 seleções, 104 jogos. Palpite, acompanhe
          o ranking e dispute com os amigos.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-lg border border-black/10 dark:border-white/15 p-4 hover:border-foreground/40 transition-colors"
          >
            <h2 className="font-semibold">{card.title}</h2>
            <p className="text-sm text-foreground/60 mt-1">{card.desc}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
