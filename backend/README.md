# Dicegsa — API

Backend de la plataforma OLE y Kanban para CDF. Stack en
[`../docs/ingenieria/ARQUITECTURA.md`](../docs/ingenieria/ARQUITECTURA.md); las decisiones
que lo fijan, en [`../docs/decisiones/POR-ACLARAR.md`](../docs/decisiones/POR-ACLARAR.md).

Bun · NestJS sobre Fastify · Drizzle · PostgreSQL.

## Arranque

```sh
cp .env.example .env
docker compose up -d
bun install
bun run db:migrate
bun run seed:admin            # imprime la contraseña inicial, se pide una sola vez
bun run dev
```

## Puertos

Propios, para no chocar con otros proyectos de la misma máquina.

| Servicio | Host | Dentro del contenedor |
|---|---|---|
| API | `7300` | — |
| PostgreSQL | `7432` | `5432` |

El proyecto de Compose se llama `dicegsa`. Sin fijarlo, Compose lo deriva del directorio
(`backend`) y se mete en el namespace de cualquier otro proyecto cuya carpeta se llame así.

## Qué hay implementado

Solo el módulo de cuentas y autenticación. Las tablas de órdenes, Kanban, paradas y
cálculo de OLE no están escritas todavía: su forma depende de dudas abiertas del registro
(`P-001`, `P-017`, `P-018`).

| Método | Ruta | Quién |
|---|---|---|
| `POST` | `/auth/login` | público |
| `POST` | `/auth/password` | cuenta autenticada |
| `GET` | `/auth/me` | cuenta autenticada |
| `GET` | `/cuentas` | admin |
| `POST` | `/cuentas` | admin |
| `POST` | `/cuentas/:id/reseteo` | admin |
| `PATCH` | `/cuentas/:id/rol` | admin |
| `POST` | `/cuentas/:id/baja` | admin |
| `POST` | `/cuentas/:id/reactivacion` | admin |
| `GET` | `/cuentas/auditoria` | admin |

### Eventos en vivo

Socket.io sobre el mismo servidor HTTP. El cliente manda el JWT en el handshake
(`auth.token`); la conexión se corta si el token no verifica o si la contraseña sigue
siendo la de un solo uso.

| Sala | Contenido | Roles |
|---|---|---|
| `tablero` | Transiciones del Kanban y paradas. | supervisor, gerencia, admin |
| `cuentas` | Altas, reseteos, cambios de rol y bajas. | admin |

El servidor emite `listo` con las salas asignadas al conectar, y después `evento` con
`{ tipo, sala, datos, emitidoEn }`. Hoy solo publica la sala `cuentas`; la sala `tablero`
existe y no tiene emisores todavía.

No hay `DELETE` de cuentas y no lo habrá: las bajas desactivan, para no romper la
trazabilidad de los eventos que la cuenta produjo.

## Reglas que el código sostiene

- El ingreso es por nombre de cuenta, sin distinguir mayúsculas. No hay correo.
- No hay auto-registro: las cuentas las crea un administrador.
- La contraseña inicial es de un solo uso; hasta cambiarla, la única ruta alcanzable es
  `POST /auth/password`. Vale también para un administrador.
- Las contraseñas se guardan con Argon2id, vía `Bun.password`.
- Toda acción administrativa sobre cuentas queda registrada en `eventos_admin` dentro de
  la misma transacción que la produjo.

## Pruebas

```sh
bun test
```

Cubren la puerta de primer ingreso, la generación y el hasheo de contraseñas, y la
normalización del nombre de cuenta. No hay pruebas de integración todavía.
