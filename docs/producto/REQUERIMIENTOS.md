# Dicegsa — Requerimientos

Derivados de los objetivos específicos de la [propuesta estratégica](../fuentes/propuesta-estrategica.pdf).
Estados: `Propuesto` · `Aceptado` · `En construcción` · `Hecho`.

## Kanban y captura de eventos (OE-3)
| # | Requisito | Prioridad | Estado | Decisión |
|---|---|---|---|---|
| REQ-001 | Tablero Kanban de órdenes de alisto con estados y transiciones, operable desde terminal táctil. | Alta | En construcción | D-032 |
| REQ-002 | Sincronización en tiempo real del tablero entre todas las terminales vía WebSocket. | Alta | Hecho | D-001, D-006 |
| REQ-003 | Cronometraje por orden y por línea, con marca de tiempo del servidor: el alistador marca cada línea al armarla. | Alta | En construcción | D-026 |
| REQ-042 | Línea no encontrada: el alistador la reporta a inventario; si no aparece, la línea o el pedido se dan de baja y salen del conteo del Desempeño. | Alta | En construcción | D-035, P-030 |
| REQ-004 | Registro de bloqueo en un toque, seleccionando causa de un catálogo tipificado. | Alta | En construcción | D-028 |
| REQ-005 | Catálogo de causas de parada clasificadas como imputables / no imputables al colaborador. | Alta | En construcción | D-021, D-028 |
| REQ-006 | Mesa de control asigna PKLs a alistadores, sin límite por persona. Solo el asignado trabaja su PKL; uno sin terminar sigue a su nombre al día siguiente. La reasignación queda registrada. | Alta | En construcción | D-032 |
| REQ-035 | Fecha de entrega por pedido, cargada con el pedido o calculada por tramo. El rango real va de 24 horas a 10-15 minutos. | Alta | En construcción | D-025, P-029 |
| REQ-041 | Catálogo configurable de tramos de entrega. | Alta | Propuesto | D-025 |
| REQ-036 | Alerta de pronta entrega: los pedidos cerca de vencer se marcan en rojo, con umbral configurable. | Alta | Propuesto | D-034, P-029 |
| REQ-037 | Orden del tablero por urgencia relativa a la ventana de cada orden, no por antigüedad. | Alta | Propuesto | — |
| REQ-040 | Entrega del PKL al validador, registro digital de errores (alistador, unidades erróneas, tipo de error) visible para el supervisor, y devolución al mismo alistador para corregir. | Alta | En construcción | D-036 |
| REQ-046 | Catálogos configurables de zona de despacho y zona de inventario, asignadas por mesa de control a cada pedido. | Alta | En construcción | D-033 |
| REQ-047 | Vista de mesa de control: tabla de pedidos con estado, cliente, ubicación, unidades, zonas, fecha de entrega y notas. | Alta | Propuesto | D-034 |
| REQ-048 | Armado del PKL como agrupación de pedidos. | Alta | En construcción | D-031, P-025 |
| REQ-049 | Cambio de fecha de entrega de un pedido por mesa de control, con la prioridad recalculada y el cambio auditado. | Alta | En construcción | D-037 |
| REQ-038 | Operación sin papel: el alistador trabaja contra la terminal, no contra un listado impreso. | Media | Propuesto | P-006 |

## Modelo OLE (OE-2)
| # | Requisito | Prioridad | Estado | Decisión |
|---|---|---|---|---|
| REQ-007 | Cálculo de Disponibilidad Neta (D) descontando bloqueos no imputables del tiempo de turno. | Alta | En construcción | — |
| REQ-008 | Catálogo de estándares de rendimiento. Línea base vigente: **15 líneas/hora por alistador**, plana. | Alta | Propuesto | D-028 |
| REQ-009 | Cálculo de Desempeño (P) como líneas reales sobre estándar, con ponderación por complejidad (alta rotación, cadena de frío, psicotrópicos) sobre la línea base plana. | Alta | En construcción | D-028 |
| REQ-010 | Registro de errores de despacho por causa de origen: SKU, lote, cantidad. | Alta | Propuesto | — |
| REQ-011 | Cálculo de Calidad (Q) a partir de auditorías de despacho, como tasa con denominador explícito y no como conteo suelto de errores. | Alta | En construcción | D-028 |
| REQ-033 | Cálculo de las métricas vigentes (productos / 8 h y unidades / 8 h, diario y mensual) junto al OLE, para mostrar qué reclasifica. | Alta | En construcción | D-040 |
| REQ-034 | Roles operativos diferenciados: alistador y validador, con estándar y evaluación propios. | Media | En construcción | D-036 |
| REQ-012 | Cálculo de OLE = D × P × Q por colaborador, turno y período. | Alta | En construcción | — |
| REQ-013 | Desglose auditable: todo valor de OLE debe poder abrirse hasta los eventos que lo componen. | Alta | Propuesto | — |

## Supervisión y reportes
| # | Requisito | Prioridad | Estado | Decisión |
|---|---|---|---|---|
| REQ-014 | Panel de supervisión en vivo con cuellos de botella y órdenes bloqueadas. | Alta | En construcción | — |
| REQ-015 | Reporte comparativo método tradicional (tiempo bruto) vs. OLE sobre el mismo período. | Alta | En construcción | — |
| REQ-016 | Reporte de métricas por colaborador y período, para que los supervisores asignen bonificaciones o sanciones. La plataforma no calcula montos. | Media | En construcción | D-029, P-032 |
| REQ-017 | Exportación de reportes para la gerencia. | Baja | Propuesto | — |

## Plataforma
| # | Requisito | Prioridad | Estado | Decisión |
|---|---|---|---|---|
| REQ-018 | Autenticación por **nombre de cuenta y contraseña** (sin correo) y control de acceso por roles: operario, mesa de control, supervisor, gerencia, admin. | Alta | Hecho | D-005 |
| REQ-019 | Cero escrituras sobre la base de datos del ERP corporativo. | Alta | Propuesto | — |
| REQ-020 | Carga de pedidos con sus líneas tal como los ve mesa de control en el ERP, por importación o lectura del ERP. | Alta | En construcción | D-032, P-006 |
| REQ-021 | Acceso por URL con HTTPS desde el navegador de las computadoras del almacén y de escritorio. | Alta | Propuesto | D-002, D-020, D-023, D-039 |
| REQ-022 | Interfaz de operario para las computadoras compartidas del almacén: pocos pasos, objetivos grandes y cambio rápido de usuario. | Alta | Propuesto | D-039 |
| REQ-039 | Visibilidad de los alistadores activos que no tienen sesión abierta en ninguna computadora, cuyo trabajo no genera eventos y queda fuera del cálculo. | Media | Propuesto | D-039 |
| REQ-023 | Modo sin conexión: guardar los eventos en el equipo y mandarlos al volver la red. Extra, fuera del MVP. | Baja | Propuesto | D-027 |

## Cuentas y administración (D-005)
| # | Requisito | Prioridad | Estado | Decisión |
|---|---|---|---|---|
| REQ-026 | Alta de cuentas solo por administrador; no existe auto-registro. | Alta | Hecho | D-005 |
| REQ-027 | Contraseña inicial de un solo uso: cambio obligatorio en el primer ingreso antes de acceder a cualquier otra pantalla. | Alta | Hecho | P-009 |
| REQ-028 | Reseteo de contraseña por administrador, que reinicia el ciclo de primer ingreso. | Alta | Hecho | D-005 |
| REQ-029 | Registro de auditoría de toda acción administrativa sobre cuentas: alta, reseteo, cambio de rol, baja — con autor y fecha. | Alta | Hecho | — |
| REQ-030 | Baja de cuenta por desactivación, nunca por borrado, para preservar la trazabilidad de sus eventos. | Alta | Hecho | — |
| REQ-031 | Contraseñas almacenadas solo con hash de derivación lenta (Argon2id o bcrypt). | Alta | Hecho | — |
| REQ-043 | Registro de auditoría general: toda acción de usuario con autor y fecha, consultable por usuario y por orden. | Alta | En construcción | D-028 |
| REQ-044 | Historial por operario: qué órdenes tuvo, cuánto tardó y qué paradas registró. | Alta | En construcción | D-028 |
| REQ-045 | Configuración editable de estándares de rendimiento, ponderación por complejidad, tipos de error y alcance de la auditoría de calidad. | Alta | Propuesto | D-028 |
| REQ-050 | Solicitud de cambio de contraseña desde el ingreso, que le llega al administrador y queda registrada con su resolución. | Media | Hecho | D-041 |
| REQ-032 | Límite de intentos fallidos de ingreso por cuenta. | Alta | Propuesto | D-023 |

## Validación (OE-4)
| # | Requisito | Prioridad | Estado | Decisión |
|---|---|---|---|---|
| REQ-024 | Carga de la trazabilidad del ERP (el Excel que hoy arma el supervisor) como dataset para la prueba piloto. | Media | Propuesto | D-040 |
| REQ-025 | Aislamiento medible de falsos positivos (rápido con errores) y falsos negativos (penalización indebida). | Alta | Propuesto | — |
