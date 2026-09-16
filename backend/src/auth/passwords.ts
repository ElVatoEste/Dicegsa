/**
 * Alfabeto sin caracteres que se confunden al leerlos de un papel y teclearlos
 * en un handheld: se excluyen O, 0, I, l y 1.
 */
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

export const LARGO_MINIMO = 8;
const LARGO_GENERADA = 10;

/** Contraseña inicial de un solo uso. La entrega el administrador en mano. */
export function generarPasswordInicial(largo = LARGO_GENERADA): string {
  const bytes = crypto.getRandomValues(new Uint32Array(largo));
  let salida = '';
  for (const b of bytes) salida += ALFABETO[b % ALFABETO.length];
  return salida;
}

export function hashear(password: string): Promise<string> {
  return Bun.password.hash(password, { algorithm: 'argon2id' });
}

export function verificar(password: string, hash: string): Promise<boolean> {
  return Bun.password.verify(password, hash);
}

/**
 * Largo mínimo y nada más. Exigir mayúscula, número y símbolo en un equipo que
 * se opera de pie y con una mano ocupada termina en contraseñas anotadas en un
 * papel pegado al handheld.
 */
export function passwordAceptable(password: string): boolean {
  return password.length >= LARGO_MINIMO;
}

/** El nombre de cuenta no distingue mayúsculas: se normaliza antes de guardar y de buscar. */
export function normalizarNombreCuenta(nombre: string): string {
  return nombre.trim().toLowerCase();
}
