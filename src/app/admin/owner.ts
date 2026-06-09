/**
 * Dono do bolão. O admin deste email nunca pode ser removido — reforçado na
 * server action `setAdmin` e por um trigger no banco (migração 0006).
 */
export const OWNER_EMAIL = "flavio.ravier@gmail.com";
