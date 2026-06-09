/**
 * Nome de exibição do participante: usa o apelido escolhido; se ainda não
 * definiu, cai para o nome do cadastro.
 */
export function displayName(p: { nickname: string | null; nome: string }): string {
  return p.nickname?.trim() ? p.nickname : p.nome;
}
