# Dicegsa — instrucciones del repositorio

Plataforma OLE y Kanban para el almacén CDF (DICEGSA). Antes de tocar nada, leer
[`docs/producto/PRODUCTO.md`](docs/producto/PRODUCTO.md).

## Idioma

- **Código, datos y contrato del API en inglés:** identificadores, columnas, enums y campos
  JSON. Nada de `accountName` junto a `contraseña` en la misma firma.
- **Comentarios y textos de interfaz en español.** Las etiquetas visibles se traducen en
  [`frontend/src/lib/labels.ts`](frontend/src/lib/labels.ts), no en el modelo.

## Comentarios en el código

Rige [`docs/decisiones/POLITICA-COMENTARIOS.md`](docs/decisiones/POLITICA-COMENTARIOS.md),
de cumplimiento obligatorio al escribir, revisar o auditar código. En corto:

- El comentario expresa una **restricción vigente y verificable**, nunca la historia del
  desarrollo, el estado de una tarea ni un ID del registro (`REQ-NNN`, `D-NNN`, `P-NNN`).
- Español neutro, sin voseo, sin emojis, sin etiquetas `WHY:` ni `NOTE:`.
- No redeclarar lo que ya dicen el nombre y el tipo.
- Sin `TODO` ni notas de estado transitorio: eso vive en
  [`docs/producto/REQUERIMIENTOS.md`](docs/producto/REQUERIMIENTOS.md).

## Documentación

- Español rioplatense (voseo) en los documentos, a diferencia de los comentarios.
- Sin emojis decorativos en encabezados.
- Las decisiones se registran en
  [`docs/decisiones/POR-ACLARAR.md`](docs/decisiones/POR-ACLARAR.md) como `D-NNN`, y las
  dudas abiertas como `P-NNN`. Los requisitos son `REQ-NNN`.
- Una decisión que cambia el código se registra en el mismo cambio que lo modifica.

## Código

- Backend en [`backend/`](backend/): Bun, NestJS sobre Fastify, Drizzle, PostgreSQL.
- Frontend en [`frontend/`](frontend/): Next.js en modo export estático. Kit propio en
  `components/ui`, cliente del API en `lib/api` con `ApiService` y `PATHS`, avisos de estado
  por overlay y nunca insertados en la página.
- Puertos propios: API `7300`, PostgreSQL `7432`, frontend `7301`.
- El stack de la propuesta aprobada (NestJS, Next.js, PostgreSQL) no se cambia por
  alternativas técnicamente mejores; ver el criterio de stack en `POR-ACLARAR.md`.
- Las invariantes de [`docs/ingenieria/ARQUITECTURA.md`](docs/ingenieria/ARQUITECTURA.md)
  mandan sobre la implementación.
