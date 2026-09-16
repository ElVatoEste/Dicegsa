# Dicegsa — Roadmap

## Fase 0 — Diagnóstico (OE-1)
Trabajo de campo, sin código. Cierra los insumos que el modelo necesita.

- Levantamiento de tiempos y movimientos en las líneas de alisto; línea base.
- Catálogo de causas raíz de paradas y su frecuencia histórica.
- Mapeo de penalizaciones injustas en el esquema actual.
- **Cierra:** P-001 (tipificación de paradas), P-002 (tiempos estándar y complejidad), P-004 (auditoría de calidad).
- **Supuestos:** S-1.1 acceso a registros históricos · S-1.2 colaboración de supervisores y operarios.

## Fase 1 — Cuentas y acceso · hecha
Lo único que estaba especificado por completo y no dependía de ninguna duda abierta.

- REQ-018, REQ-026 a REQ-031: alta por administrador, contraseña de un solo uso, cambio
  obligatorio al primer ingreso, reseteo, auditoría, bajas por desactivación.
- Esqueleto del proyecto: Bun, NestJS sobre Fastify, Drizzle, PostgreSQL, migraciones y
  pruebas. Sirve además de verificación del stack, que era la combinación menos transitada.
- Consola de administración en [`../../frontend/`](../../frontend/): login, cambio de
  contraseña, cuentas y auditoría.
- Transporte de eventos en vivo por WebSocket (REQ-002), autenticado por JWT y con salas
  por rol. Se estrena publicando las acciones de cuentas; las del tablero usan el mismo
  canal cuando existan.
- Código en [`../../backend/`](../../backend/).

## MVP — Kanban con captura de eventos (OE-3, parte 1)
Lo mínimo que hace al modelo posible: si los eventos no se capturan bien, el OLE no existe.

- REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-018, REQ-021, REQ-022.
- Ingesta de órdenes (REQ-020) — puede arrancar con carga manual o CSV si P-006 sigue abierta.
- **Criterio de salida:** un turno completo operado en el tablero, con sus bloqueos registrados en vivo.

## v1 — Motor OLE (OE-2 + OE-3, parte 2)
- REQ-007 a REQ-013: D, P, Q y el cálculo compuesto, con desglose auditable.
- REQ-014, REQ-015: panel en vivo y comparativa contra el método tradicional.
- REQ-019: verificación explícita de no invasividad al ERP.
- **Criterio de salida:** OLE calculado sobre datos reales de un turno, desarmable hasta el evento.

## v2 — Validación y cierre (OE-4)
- REQ-024, REQ-025: piloto con datasets reales, medición de falsos positivos y negativos.
- REQ-016, REQ-017: bonificaciones y exportación.
- REQ-023: tolerancia a corte de red.
- **Criterio de salida:** evidencia cuantitativa de que el modelo OLE corrige lo que el método por tiempo bruto distorsiona.
