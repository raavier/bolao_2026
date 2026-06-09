import { flagCode } from "@/lib/teams";

type FlagProps = {
  team: string;
  className?: string;
};

/**
 * Bandeira da seleção via flagcdn.com (referência por URL, sem download).
 * Para nomes-placeholder do mata-mata, renderiza um espaço reservado neutro
 * para manter o alinhamento das linhas.
 */
export function Flag({ team, className = "" }: FlagProps) {
  const code = flagCode(team);
  const base = "inline-block w-6 h-4 rounded-[2px] object-cover shrink-0";

  if (!code) {
    return <span className={`${base} bg-foreground/10 ${className}`} aria-hidden="true" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${code}.svg`}
      alt=""
      width={24}
      height={16}
      loading="lazy"
      className={`${base} ${className}`}
    />
  );
}
