import { PATHS } from './paths';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:7300';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

interface Options {
  token?: string;
  signal?: AbortSignal;
}

/**
 * Cliente HTTP del API. Los recursos arman sus llamadas sobre estos métodos y
 * toman la ruta de PATHS, nunca escrita dentro de la llamada.
 */
class ApiService {
  constructor(private readonly baseUrl: string) {}

  get<T>(path: string, options?: Options) {
    return this.request<T>('GET', path, undefined, options);
  }

  post<T>(path: string, body?: unknown, options?: Options) {
    return this.request<T>('POST', path, body, options);
  }

  put<T>(path: string, body?: unknown, options?: Options) {
    return this.request<T>('PUT', path, body, options);
  }

  patch<T>(path: string, body?: unknown, options?: Options) {
    return this.request<T>('PATCH', path, body, options);
  }

  delete<T>(path: string, options?: Options) {
    return this.request<T>('DELETE', path, undefined, options);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options: Options = {},
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      signal: options.signal,
      // El content-type va solo cuando hay cuerpo: Fastify rechaza un POST que
      // declara JSON y llega vacío, y varias acciones de cuentas no mandan nada.
      headers: {
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new ApiError(response.status, payload?.message ?? 'No se pudo completar la operación');
    }
    // Una acción que no devuelve nada responde con el cuerpo vacío, no con JSON.
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }
}

export const api = new ApiService(API_URL);
export { PATHS };
