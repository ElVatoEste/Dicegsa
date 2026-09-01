# POR ACLARAR — registro vivo de decisiones

Registro de dudas y decisiones (resueltas + pendientes). Se actualiza a medida que avanza.

## Resueltas
| # | Decisión | Resolución | Dónde |
|---|---|---|---|
| D-001 | Lenguaje del backend | Backend en **Go**. Stdlib `net/http`, `pgx`+`sqlc`, `go-redis`, `gorilla/websocket`, JWT, capas `internal/<dominio>`. | [ARQUITECTURA.md — Stack](../ingenieria/ARQUITECTURA.md) |
| D-002 | Render del frontend | Frontend Next.js en **SPA** (`output: 'export'`, CSR). App detrás de login, tiempo real por WebSocket → SSR no aporta. Estático servido por nginx, sin runtime Node. | [ARQUITECTURA.md — Frontend SPA](../ingenieria/ARQUITECTURA.md) |

## Pendientes
| # | Duda | Notas |
|---|---|---|
| P-001 | <duda> | <notas> |
