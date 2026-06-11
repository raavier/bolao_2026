/**
 * Tipos do banco. Placeholder escrito à mão a partir do modelo de dados
 * (DEFINICOES.md §7). Quando o projeto Supabase existir, regerar com:
 *   npx supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts
 * e remover este aviso.
 *
 * O formato (incluindo `Relationships`, `Views`, `Functions`, `Enums`,
 * `CompositeTypes`) segue o que o supabase-js espera para inferir os tipos
 * das queries — sem isso, o resultado das queries colapsa para `never`.
 */
import type { Phase } from "@/lib/scoring/phases";

export type JogoStatus = "agendado" | "encerrado";

export type Database = {
  public: {
    Tables: {
      participantes: {
        Row: {
          id: string;
          nome: string;
          nickname: string | null;
          email: string;
          is_admin: boolean;
          bloqueado: boolean;
          criado_em: string;
        };
        Insert: {
          id: string;
          nome: string;
          nickname?: string | null;
          email: string;
          is_admin?: boolean;
          bloqueado?: boolean;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["participantes"]["Insert"]>;
        Relationships: [];
      };
      jogos: {
        Row: {
          id: number;
          fase: Phase;
          grupo: string | null;
          inicio: string;
          mandante: string;
          visitante: string;
          gols_mandante: number | null;
          gols_visitante: number | null;
          status: JogoStatus;
        };
        Insert: {
          id: number;
          fase: Phase;
          grupo?: string | null;
          inicio: string;
          mandante: string;
          visitante: string;
          gols_mandante?: number | null;
          gols_visitante?: number | null;
          status?: JogoStatus;
        };
        Update: Partial<Database["public"]["Tables"]["jogos"]["Insert"]>;
        Relationships: [];
      };
      palpites: {
        Row: {
          id: string;
          participante_id: string;
          jogo_id: number;
          gols_mandante: number;
          gols_visitante: number;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          participante_id: string;
          jogo_id: number;
          gols_mandante: number;
          gols_visitante: number;
          atualizado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["palpites"]["Insert"]>;
        Relationships: [];
      };
      palpites_log: {
        Row: {
          id: number;
          participante_id: string;
          jogo_id: number;
          gols_mandante: number;
          gols_visitante: number;
          criado_em: string;
        };
        Insert: {
          id?: number;
          participante_id: string;
          jogo_id: number;
          gols_mandante: number;
          gols_visitante: number;
          criado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["palpites_log"]["Insert"]>;
        Relationships: [];
      };
      palpite_campeao: {
        Row: {
          participante_id: string;
          selecao: string;
          atualizado_em: string;
        };
        Insert: {
          participante_id: string;
          selecao: string;
          atualizado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["palpite_campeao"]["Insert"]>;
        Relationships: [];
      };
      bolao_config: {
        Row: {
          id: boolean;
          campeao: string | null;
          atualizado_em: string;
        };
        Insert: {
          id?: boolean;
          campeao?: string | null;
          atualizado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bolao_config"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      set_nickname: {
        Args: { novo: string };
        Returns: undefined;
      };
      palpites_em_branco: {
        Args: { janela_horas?: number };
        Returns: {
          participante_id: string;
          nome: string;
          nickname: string | null;
          em_branco_janela: number;
          em_branco_total: number;
        }[];
      };
    };
    Enums: {
      fase: Phase;
      jogo_status: JogoStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
