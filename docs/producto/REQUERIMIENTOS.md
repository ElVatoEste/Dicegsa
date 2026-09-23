# Dicegsa — Requerimientos

Derivados de los objetivos específicos de la [propuesta estratégica](../fuentes/propuesta-estrategica.pdf).
Estados: `Propuesto` · `Aceptado` · `En construcción` · `Hecho`.

## Kanban y captura de eventos (OE-3)
| # | Requisito | Prioridad | Estado | Decisión |
|---|---|---|---|---|
| REQ-001 | Tablero Kanban de órdenes de alisto con estados y transiciones, operable desde terminal táctil. | Alta | Propuesto | — |
| REQ-002 | Sincronización en tiempo real del tablero entre todas las terminales vía WebSocket. | Alta | Hecho | D-001, D-006 |
| REQ-003 | Cronometraje por orden y por línea, con marca de tiempo del servidor. | Alta | Propuesto | P-003 |
| REQ-004 | Registro de bloqueo en un toque, seleccionando causa de un catálogo tipificado. | Alta | Propuesto | P-001 |
| REQ-005 | Catálogo de causas de parada clasificadas como imputables / no imputables al colaborador. | Alta | Propuesto | P-001 |
| REQ-006 | Asignación de órdenes a colaborador y turno. | Alta | Propuesto | — |
| REQ-035 | Ventana de entrega por orden, heredada del compromiso del cliente. El rango real va de 24 horas a 10-15 minutos. | Alta | Propuesto | P-018 |
| REQ-036 | Alerta de proximidad de vencimiento, con tiempo transcurrido desde el ingreso de la orden y tiempo restante de su ventana. | Alta | Propuesto | P-018 |
| REQ-037 | Orden del tablero por urgencia relativa a la ventana de cada orden, no por antigüedad. | Alta | Propuesto | — |
| REQ-038 | Operación sin papel: el alistador trabaja contra la terminal, no contra un listado impreso. | Media | Propuesto | P-006 |

## Modelo OLE (OE-2)
| # | Requisito | Prioridad | Estado | Decisión |
|---|---|---|---|---|
| REQ-007 | Cálculo de Disponibilidad Neta (D) descontando bloqueos no imputables del tiempo de turno. | Alta | Propuesto | — |
| REQ-008 | Catálogo de estándares de rendimiento. Línea base vigente: **15 líneas/hora por alistador**, plana. | Alta | Propuesto | P-002 |
| REQ-009 | Cálculo de Desempeño (P) como líneas reales sobre estándar, con ponderación por complejidad (alta rotación, cadena de frío, psicotrópicos) sobre la línea base plana. | Alta | Propuesto | P-002 |
| REQ-010 | Registro de errores de despacho por causa de origen: SKU, lote, cantidad. | Alta | Propuesto | — |
| REQ-011 | Cálculo de Calidad (Q) a partir de auditorías de despacho, como tasa con denominador explícito y no como conteo suelto de errores. | Alta | Propuesto | P-004 |
| REQ-033 | Comparación del OLE contra el criterio vigente de 15 líneas/hora, para mostrar qué reclasifica. | Alta | Propuesto | — |
| REQ-034 | Soporte de roles operativos diferenciados: alistador y valeador, con estándar y evaluación propios. | Media | Propuesto | P-015 |
| REQ-012 | Cálculo de OLE = D × P × Q por colaborador, turno y período. | Alta | Propuesto | — |
| REQ-013 | Desglose auditable: todo valor de OLE debe poder abrirse hasta los eventos que lo componen. | Alta | Propuesto | — |

## Supervisión y reportes
| # | Requisito | Prioridad | Estado | Decisión |
|---|---|---|---|---|
| REQ-014 | Panel de supervisión en vivo con cuellos de botella y órdenes bloqueadas. | Alta | Propuesto | — |
| REQ-015 | Reporte comparativo método tradicional (tiempo bruto) vs. OLE sobre el mismo período. | Alta | Propuesto | — |
| REQ-016 | Reporte de bonificaciones por colaborador y período. | Media | Propuesto | P-005 |
| REQ-017 | Exportación de reportes para la gerencia. | Baja | Propuesto | — |

## Plataforma
| # | Requisito | Prioridad | Estado | Decisión |
|---|---|---|---|---|
| REQ-018 | Autenticación por **nombre de cuenta y contraseña** (sin correo) y control de acceso por roles: operario, supervisor, gerencia, admin. | Alta | Hecho | D-005 |
| REQ-019 | Cero escrituras sobre la base de datos del ERP corporativo. | Alta | Propuesto | — |
| REQ-020 | Ingesta de órdenes desde el ERP. | Alta | Propuesto | P-006 |
| REQ-021 | Operación en red local institucional vía navegador, desde escritorio o móvil. | Alta | Propuesto | D-002, D-020, P-021 |
| REQ-022 | Interfaz de operario **responsive para móvil**, en la misma web: pantalla chica, uso de pie, una mano ocupada, objetivos táctiles grandes. | Alta | Propuesto | D-020 |
| REQ-039 | Visibilidad de los alistadores activos sin móvil con sesión abierta, cuyo trabajo no genera eventos y queda fuera del cálculo. | Media | Propuesto | P-020 |
| REQ-023 | Tolerancia a corte de red en la terminal sin perder el evento en curso. | Media | Propuesto | P-007 |

## Cuentas y administración (D-005)
| # | Requisito | Prioridad | Estado | Decisión |
|---|---|---|---|---|
| REQ-026 | Alta de cuentas solo por administrador; no existe auto-registro. | Alta | Hecho | D-005 |
| REQ-027 | Contraseña inicial de un solo uso: cambio obligatorio en el primer ingreso antes de acceder a cualquier otra pantalla. | Alta | Hecho | P-009 |
| REQ-028 | Reseteo de contraseña por administrador, que reinicia el ciclo de primer ingreso. | Alta | Hecho | D-005 |
| REQ-029 | Registro de auditoría de toda acción administrativa sobre cuentas: alta, reseteo, cambio de rol, baja — con autor y fecha. | Alta | Hecho | — |
| REQ-030 | Baja de cuenta por desactivación, nunca por borrado, para preservar la trazabilidad de sus eventos. | Alta | Hecho | — |
| REQ-031 | Contraseñas almacenadas solo con hash de derivación lenta (Argon2id o bcrypt). | Alta | Hecho | — |
| REQ-032 | Límite de intentos fallidos de ingreso por cuenta. | Media | Propuesto | P-011 |

## Validación (OE-4)
| # | Requisito | Prioridad | Estado | Decisión |
|---|---|---|---|---|
| REQ-024 | Carga de datasets de órdenes reales para prueba piloto. | Media | Propuesto | — |
| REQ-025 | Aislamiento medible de falsos positivos (rápido con errores) y falsos negativos (penalización indebida). | Alta | Propuesto | — |
