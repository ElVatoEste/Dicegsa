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
- **Frontend:** Next.js + TypeScript en modo **SPA** (`output: 'export'`, client-side rendering). Build estático servido por nginx, sin runtime Node en el VPS. Interfaces táctiles y de baja carga cognitiva para terminales de bodega. Iconos `lucide-react`, estilos TailwindCSS.
- **Infra:** VPS Linux de bajo consumo, acceso vía navegador en red local institucional. nginx sirve el estático del frontend y hace reverse proxy al API Go. Stack open source, sin licenciamiento privativo.

### Frontend SPA — decisión ([D-002](../decisiones/POR-ACLARAR.md))
App detrás de login (sin SEO), con datos en tiempo real por WebSocket. SSR no aporta: renderizaría estado viejo y rehidrataría. Se opta por SPA:

- **Render:** client-side. Next `output: 'export'` → HTML/JS/CSS estáticos.
- **Datos:** todo contra el API Go (REST + WebSocket). Auth por JWT; sin route handlers ni middleware de Next.
- **Deploy:** archivos estáticos tras nginx. Menos infra y menor superficie que un server Node.
- **Migración futura:** si aparece un portal público con SEO/SSR, se pasa a Next con server Node reusando el mismo código.

## Invariantes críticas
1. <invariante>
