# Dicegsa — Arquitectura

## Modelo de dominio
<entidades e relaciones>

## Flujos
<flujos críticos>

## Stack
Plataforma web reactiva, desacoplada y de alta concurrencia.

- **Backend:** Go. `net/http` (stdlib) con capa `httpx` propia, sin framework pesado. Arquitectura por capas en `internal/<dominio>`, entrypoint en `cmd/api`.
- **Persistencia:** PostgreSQL con `pgx` + `sqlc` (queries tipadas). Migraciones y queries versionadas (`db/migrations`, `db/queries`).
- **Tiempo real y caché:** Redis (`go-redis`) para caché de alto rendimiento y pub/sub. WebSockets con `gorilla/websocket` para emisión de eventos instantáneos (tablero Kanban, cronometraje con latencia de ms).
- **Auth:** JWT (`golang-jwt`), control de accesos por roles.
- **Frontend:** Next.js + TypeScript, interfaces táctiles y de baja carga cognitiva para terminales de bodega.
- **Infra:** VPS Linux de bajo consumo, acceso vía navegador en red local institucional. Stack open source, sin licenciamiento privativo.

> Nota: la propuesta estratégica original ([PDF](../../Propuesta%20Estrat%C3%A9gica_%20Plataforma%20Web%20OLE%20y%20Kanban%20en%20CDF%20%28DICEGSA%29.pdf)) planteaba el backend en NestJS/TypeScript. Se reemplaza por Go — ver [D-001](../decisiones/POR-ACLARAR.md).

## Invariantes críticas
1. <invariante>
