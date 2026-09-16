# Dicegsa — Roadmap

## Fase 0 — Diagnóstico (OE-1)
Trabajo de campo, sin código. Cierra los insumos que el modelo necesita.

- Levantamiento de tiempos y movimientos en las líneas de alisto; línea base.
- Catálogo de causas raíz de paradas y su frecuencia histórica.
- Mapeo de penalizaciones injustas en el esquema actual.
- **Cierra:** P-001 (tipificación de paradas), P-002 (tiempos estándar y complejidad), P-004 (auditoría de calidad).
- **Supuestos:** S-1.1 acceso a registros históricos · S-1.2 colaboración de supervisores y operarios.

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
