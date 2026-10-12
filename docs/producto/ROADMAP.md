# Dicegsa — Roadmap

## Fase 0 — Diagnóstico (OE-1)
Trabajo de campo, sin código. Cierra los insumos que el modelo necesita.

- Levantamiento de tiempos y movimientos en las líneas de alisto; línea base.
- Catálogo de causas raíz de paradas y su frecuencia histórica.
- Mapeo de penalizaciones injustas en el esquema actual.
- **Aporta:** el contenido inicial de los catálogos configurables (causas, estándares, auditoría de calidad) — ver D-028.
- **Supuestos:** S-1.1 acceso a registros históricos · S-1.2 colaboración de supervisores y operarios.

## Fase 1 — Cuentas y acceso · hecha
Lo único que estaba especificado por completo y no dependía de ninguna duda abierta.

- RF-001 a RF-005, RF-007, RF-045 y RNF-002: alta por administrador, contraseña de un solo uso, cambio
  obligatorio al primer ingreso, reseteo, auditoría, bajas por desactivación.
- Esqueleto del proyecto: Bun, NestJS sobre Fastify, Drizzle, PostgreSQL, migraciones y
  pruebas. Sirve además de verificación del stack, que era la combinación menos transitada.
- Consola de administración en [`../../frontend/`](../../frontend/): login, cambio de
  contraseña, cuentas y auditoría.
- Transporte de eventos en vivo por WebSocket (RF-020), autenticado por JWT y con salas
  por rol. Se estrena publicando las acciones de cuentas; las del tablero usan el mismo
  canal cuando existan.
- Código en [`../../backend/`](../../backend/).

## Fase 2 — Lo que no depende del PKL · hecha
Avanza mientras P-017 sigue abierta ([D-022](../decisiones/POR-ACLARAR.md)).

- Catálogo de causas de parada (RF-027): la tabla y su pantalla. Faltan las causas en sí,
  que carga el cliente (D-028).
- Perfil de colaborador de las cuentas de operario: nombre y rol en el piso (RF-008).
- Entrada del operario a su vista, por ahora sin órdenes.

## MVP — Kanban con captura de eventos (OE-3, parte 1)
Ya no espera: el PKL quedó definido en D-031.
Lo mínimo que hace al modelo posible: si los eventos no se capturan bien, el OLE no existe.

- RF-001, RF-002, RF-009, RF-018 a RF-024, RF-026 a RF-028, RNF-001, RNF-007, RNF-013, RNF-014, RNF-017.
- Mesa de control: carga de pedidos, zonas, armado y asignación de PKL (RF-010 a RF-012, RF-017, RF-041).
- Tramos de entrega configurables y alerta de vencimiento (RF-013, RF-015, RF-016, RF-042), con cambio de fecha por mesa de control (RF-014).
- Flujo completo del PKL según D-032 y D-036: asignación, alisto línea por línea, validación y corrección.
- **Criterio de salida:** un turno completo operado en el tablero, con sus bloqueos registrados en vivo.

## v1 — Motor OLE (OE-2 + OE-3, parte 2)
- RF-029 a RF-034, RF-043, RF-044: D, P, Q y el cálculo compuesto, con desglose auditable.
- RF-035, RF-037: panel en vivo y comparativa contra el método tradicional.
- RNF-012: verificación explícita de no invasividad al ERP.
- **Criterio de salida:** OLE calculado sobre datos reales de un turno, desarmable hasta el evento.

## v2 — Validación y cierre (OE-4)
- RF-047, RF-048: piloto con datasets reales, medición de falsos positivos y negativos.
- RF-038, RF-040: reporte de métricas por colaborador y exportación, para el departamento que asigna bonificaciones o sanciones.
- RNF-018: modo sin conexión, como extra (D-027).
- **Criterio de salida:** evidencia cuantitativa de que el modelo OLE corrige lo que el método por tiempo bruto distorsiona.
