"use client";

import { useState } from "react";
import { buildShareText, type ShareJogo } from "@/lib/jogos/share-text";
import type { PalpiteDeTodos } from "./actions";

type CompartilharPalpitesProps = {
  jogo: ShareJogo;
  palpites: PalpiteDeTodos[];
};

/**
 * Botão de compartilhar os palpites de um jogo no WhatsApp. Abre o WhatsApp já
 * com o texto montado; em paralelo copia o mesmo texto para a área de
 * transferência (quando disponível) para facilitar colar em outro lugar.
 */
export function CompartilharPalpites({ jogo, palpites }: CompartilharPalpitesProps) {
  const [copiado, setCopiado] = useState(false);

  const compartilhar = () => {
    const texto = buildShareText(jogo, palpites);
    navigator.clipboard?.writeText(texto).then(
      () => {
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      },
      () => {},
    );
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={compartilhar}
      className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-[#25D366]/15 text-[#128C7E] dark:text-[#25D366] hover:bg-[#25D366]/25 px-2.5 py-1 text-xs font-medium transition-colors"
    >
      <span aria-hidden="true">📲</span>
      {copiado ? "Copiado! Abrindo WhatsApp…" : "Compartilhar no WhatsApp"}
    </button>
  );
}
