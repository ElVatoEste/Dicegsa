/**
 * Alfabeto sin caracteres que se confunden al leerlos de un papel y teclearlos
 * en un handheld: se excluyen O, 0, I, l y 1.
 */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

export const MIN_LENGTH = 8;
const GENERATED_LENGTH = 10;

/** Contraseña inicial de un solo uso. La entrega el administrador en mano. */
export function generateInitialPassword(length = GENERATED_LENGTH): string {
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  let out = '';
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, { algorithm: 'argon2id' });
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return Bun.password.verify(password, hash);
}

/**
 * Largo mínimo y nada más. Exigir mayúscula, número y símbolo en un equipo que
 * se opera de pie y con una mano ocupada termina en contraseñas anotadas en un
 * papel pegado al handheld.
 */
export function isPasswordAcceptable(password: string): boolean {
  return password.length >= MIN_LENGTH;
}

/** El nombre de cuenta no distingue mayúsculas: se normaliza antes de guardar y de buscar. */
export function normalizeAccountName(name: string): string {
  return name.trim().toLowerCase();
}
