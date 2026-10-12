# Dicegsa — Requerimientos

Qué tiene que hacer la plataforma y bajo qué condiciones, para el almacén CDF de DICEGSA.
Salen de los objetivos específicos de la [propuesta estratégica](../fuentes/propuesta-estrategica.pdf)
y de las [entrevistas de operación](../reuniones/2026-09-10-minuta-entrevista-operacion.md).
El vocabulario (PKL, alisto, línea, mesa de control) está en
[`PRODUCTO.md — Vocabulario de CDF`](PRODUCTO.md#vocabulario-de-cdf).

## Cómo leer este documento

- **Funcionales (`RF-NNN`):** lo que el sistema hace. Cada uno se lee como _"El sistema debe…"_.
- **No funcionales (`RNF-NNN`):** cómo tiene que hacerlo: seguridad, integridad, usabilidad,
  rendimiento, compatibilidad y mantenibilidad.
- **Prioridad:** `Alta` (sin esto no hay tesis ni MVP) · `Media` · `Baja` (extra).
- **Estado:** `Propuesto` · `Aceptado` · `En construcción` · `Hecho`.
- **Decisión:** la entrada del [registro de decisiones](../decisiones/POR-ACLARAR.md) que lo
  fija (`D-NNN`) o la duda que todavía lo condiciona (`P-NNN`).

## Actores

| Actor | Qué hace en el sistema |
|---|---|
| Alistador | Arma los PKL que se le asignan, marca cada línea y registra sus paradas. |
| Validador | Revisa el PKL entregado, registra los errores y lo aprueba o lo devuelve. |
| Mesa de control | Carga los pedidos, les asigna zonas, arma los PKL y los asigna a los alistadores. |
| Supervisor | Sigue la operación en vivo, consulta las métricas y mantiene los catálogos. |
| Gerencia | Consulta métricas, comparativos y reportes. |
| Administrador | Gestiona las cuentas y puede cubrir las funciones de supervisor y mesa de control. |

Alistador y validador entran con el rol de sistema **operario**; lo que los distingue es su
rol operativo en el perfil de colaborador.

## Alcance

**Dentro:** el ciclo del PKL desde que el pedido llega del ERP hasta que se valida, el registro
en vivo de marcas, paradas y errores, el cálculo del OLE y de las métricas vigentes a partir de
esos registros, la supervisión en vivo, los reportes y la administración de cuentas y catálogos.

**Fuera:**

| Queda fuera | Por qué | Decisión |
|---|---|---|
| Escribir en el ERP corporativo | La plataforma mide en paralelo; la base transaccional no se toca. | RNF-012 |
| Inventario, stock, catálogo de productos y ubicaciones | Siguen en el ERP. Las líneas se guardan como llegan. | D-030 |
| Despacho y asignación de rutas | El ciclo del PKL termina en la validación. | D-036 |
| Cálculo de bonificaciones o sanciones | Lo hacen los supervisores con las métricas; el sistema no guarda montos ni fórmulas de pago. | D-029 |
| Handheld y app nativa | El alistador usa la misma web en las computadoras del almacén. | D-020, D-039 |
| Recuperación de contraseña por correo | El personal de bodega no tiene correo corporativo. | D-005 |
| Facturación, proveedores y logística de última milla | Ajenos al alisto. | — |
| Implementación en toda la empresa y seguimiento a largo plazo | El proyecto se valida con un piloto en turnos seleccionados y con datos históricos. | — |

## Supuestos

- Hay red en todo el edificio; sin red, la interfaz de operario espera y reintenta (D-012).
- Los datos que llegan del ERP son válidos: la plataforma no los corrige.
- El alistador registra sus paradas cuando ocurren. Una parada que no se registra no se
  puede reconstruir después, y el tiempo perdido le cuenta en contra.

## Requisitos funcionales

### Acceso y cuentas
| # | Requisito | Prioridad | Estado | Decisión |
|---|---|---|---|---|
| RF-001 | Autenticar a cada usuario con nombre de cuenta y contraseña, sin correo. | Alta | Hecho | D-005 |
| RF-002 | Restringir cada pantalla y operación según el rol: operario, mesa de control, supervisor, gerencia o administrador. | Alta | Hecho | D-005, D-011 |
| RF-003 | Permitir que solo el administrador cree cuentas; no existe el auto-registro. | Alta | Hecho | D-005 |
| RF-004 | Generar una contraseña inicial aleatoria de un solo uso y obligar a cambiarla en el primer ingreso, antes de dar acceso a cualquier otra pantalla. | Alta | Hecho | D-010 |
| RF-005 | Permitir al administrador reiniciar la contraseña de una cuenta, lo que repite el ciclo de primer ingreso. | Alta | Hecho | D-005 |
| RF-006 | Permitir pedir un cambio de contraseña desde la pantalla de ingreso; la solicitud le llega al administrador en vivo y queda registrada con su resolución. | Media | Hecho | D-041 |
| RF-007 | Dar de baja una cuenta desactivándola, nunca borrándola. | Alta | Hecho | D-005 |
| RF-008 | Registrar el perfil de colaborador de cada operario: nombre y rol operativo (alistador o validador), cada uno con su estándar y su evaluación. | Media | En construcción | D-011, D-036 |
| RF-009 | Permitir cambiar de usuario rápido en las computadoras compartidas del almacén, para que cada marca quede a nombre de quien la hizo. | Alta | Propuesto | D-039 |

### Pedidos y mesa de control
| # | Requisito | Prioridad | Estado | Decisión |
|---|---|---|---|---|
| RF-010 | Cargar los pedidos con sus líneas tal como los ve mesa de control en el ERP (fecha y hora, cliente, departamento, municipio, notas; producto, cantidad, lote y vencimiento), por importación de un archivo exportado o por lectura del ERP. | Alta | En construcción | D-032, P-006 |
| RF-011 | Mostrar a mesa de control una tabla de pedidos con estado, cliente, ubicación, unidades, zonas, fecha de entrega y notas. | Alta | Propuesto | D-034 |
| RF-012 | Permitir a mesa de control asignar a cada pedido una zona de despacho y una zona de inventario de los catálogos (RF-041). | Alta | En construcción | D-033 |
| RF-013 | Registrar la fecha de entrega de cada pedido, cargada con el pedido o calculada por tramo (RF-042). Las ventanas reales van de 24 horas a 10-15 minutos. | Alta | En construcción | D-025, P-029 |
| RF-014 | Permitir a mesa de control cambiar la fecha de entrega de un pedido, con la prioridad recalculada y el cambio auditado con la fecha anterior y la nueva. | Alta | En construcción | D-037 |
| RF-015 | Ordenar los pedidos por tiempo restante hasta la entrega, no por antigüedad. | Alta | Propuesto | D-037 |
| RF-016 | Marcar en rojo los pedidos de pronta entrega, con un umbral configurable. | Alta | Propuesto | D-034, P-029 |
| RF-017 | Permitir armar un PKL agrupando pedidos. | Alta | En construcción | D-031, P-025 |
| RF-018 | Permitir a mesa de control asignar cada PKL a un alistador, sin límite por persona, y liberar un pedido del PKL mientras el alistador no haya marcado ninguna de sus líneas. Solo el asignado trabaja su PKL; uno sin terminar sigue a su nombre al día siguiente; toda reasignación o liberación queda auditada. | Alta | En construcción | D-032, D-043 |

### Alisto
| # | Requisito | Prioridad | Estado | Decisión |
|---|---|---|---|---|
| RF-019 | Mostrar los PKL en un tablero Kanban con los estados sin asignar, en preparación, en validación y finalizado, y la vuelta de validación a preparación cuando hay errores. | Alta | En construcción | D-032, D-043 |
| RF-020 | Reflejar cada cambio del tablero en todas las pantallas abiertas en el momento en que ocurre, sin recargar. | Alta | Hecho | D-001, D-006 |
| RF-021 | Mostrar al alistador sus PKL asignados y permitirle marcar cada línea a medida que la arma. | Alta | En construcción | D-026, P-031 |
| RF-022 | Cronometrar cada PKL desde su asignación y cada línea hasta su marca. | Alta | En construcción | D-026 |
| RF-023 | Permitir marcar una línea como no encontrada y reportarla a inventario; si no aparece, la línea o el pedido se dan de baja y salen del conteo del Desempeño. | Alta | En construcción | D-035, P-030 |
| RF-024 | Permitir entregar el PKL al validador cuando todas sus líneas estén alistadas o dadas de baja. | Alta | En construcción | D-036 |
| RF-025 | Mostrar en pantalla todo lo que el alistador necesita del PKL para trabajar sin un listado impreso. | Media | Propuesto | D-039 |

### Paradas
| # | Requisito | Prioridad | Estado | Decisión |
|---|---|---|---|---|
| RF-026 | Registrar una parada en un toque eligiendo su causa del catálogo, y cerrarla al retomar. El cronómetro de trabajo efectivo se detiene mientras está abierta. | Alta | En construcción | D-028 |
| RF-027 | Mantener un catálogo de causas de parada clasificadas como imputables o no imputables al colaborador. El nombre y la clasificación no se editan; una causa mal cargada se desactiva. | Alta | En construcción | D-021, D-028 |

### Validación
| # | Requisito | Prioridad | Estado | Decisión |
|---|---|---|---|---|
| RF-028 | Permitir al validador registrar los errores del PKL (alistador, línea, unidades erróneas y tipo de error) y devolverlo al mismo alistador para corregir, o aprobarlo. El supervisor ve el registro. | Alta | En construcción | D-036, D-038 |

### Medición del desempeño
| # | Requisito | Prioridad | Estado | Decisión |
|---|---|---|---|---|
| RF-029 | Calcular la Disponibilidad Neta (D): jornada menos paradas no imputables, sobre la jornada. | Alta | En construcción | D-042 |
| RF-030 | Calcular el Desempeño (P): líneas alistadas por hora disponible sobre el estándar, con ponderación por complejidad (alta rotación, cadena de frío, psicotrópicos). | Alta | En construcción | D-028, D-042 |
| RF-031 | Calcular la Calidad (Q) a partir de las validaciones, como tasa con denominador explícito y no como conteo suelto de errores. | Alta | En construcción | D-042, P-032 |
| RF-032 | Calcular el OLE = D × P × Q por colaborador, turno y período. | Alta | En construcción | D-042 |
| RF-033 | Calcular las métricas del método vigente (productos / 8 h y unidades / 8 h, diario y mensual) junto al OLE, para mostrar qué reclasifica. | Alta | En construcción | D-040, D-042 |
| RF-034 | Permitir abrir todo valor de OLE hasta los eventos que lo componen. | Alta | Propuesto | D-042 |

### Supervisión y reportes
| # | Requisito | Prioridad | Estado | Decisión |
|---|---|---|---|---|
| RF-035 | Mostrar un panel de supervisión en vivo con cuellos de botella y PKL bloqueados. | Alta | En construcción | — |
| RF-036 | Mostrar qué alistadores activos no tienen sesión abierta, porque su trabajo no genera eventos y queda fuera del cálculo. | Media | Propuesto | D-039 |
| RF-037 | Comparar el método vigente contra el OLE sobre el mismo período. | Alta | En construcción | D-040 |
| RF-038 | Reportar las métricas por colaborador y período, para que los supervisores asignen bonificaciones o sanciones. | Media | En construcción | D-029, P-032 |
| RF-039 | Mostrar el historial de cada operario: qué PKL tuvo, cuánto tardó y qué paradas registró. | Alta | En construcción | D-028 |
| RF-040 | Exportar los reportes para la gerencia. | Baja | Propuesto | — |

### Configuración y auditoría
| # | Requisito | Prioridad | Estado | Decisión |
|---|---|---|---|---|
| RF-041 | Mantener los catálogos de zona de despacho y zona de inventario, precargados con los de CDF. | Alta | En construcción | D-033 |
| RF-042 | Mantener el catálogo de tramos de entrega. Cambiar un tramo no mueve la fecha de pedidos ya cargados. | Alta | Propuesto | D-025 |
| RF-043 | Mantener el catálogo de tipos de error de validación, precargado con golpe, código de barras, lote, vencimiento y cantidad. | Alta | En construcción | D-038 |
| RF-044 | Permitir editar los parámetros de la medición: horas de jornada, estándar de rendimiento por rol (línea base de 15 líneas por hora por alistador), ponderación por complejidad y alcance de la auditoría de calidad. | Alta | En construcción | D-028, D-042 |
| RF-045 | Registrar toda acción administrativa sobre cuentas (alta, reinicio, cambio de rol, baja) con autor y fecha. | Alta | Hecho | D-005 |
| RF-046 | Registrar toda acción de usuario sobre pedidos, PKL, catálogos y configuración con autor y fecha, consultable por usuario y por orden. | Alta | En construcción | D-028 |

### Piloto y validación del modelo
| # | Requisito | Prioridad | Estado | Decisión |
|---|---|---|---|---|
| RF-047 | Importar la trazabilidad del ERP (el Excel que hoy arma el supervisor) como conjunto de datos del piloto. | Media | Propuesto | D-040 |
| RF-048 | Identificar y cuantificar los falsos positivos (rápido con errores) y los falsos negativos (penalizado por paradas ajenas) que corrige el OLE frente al método vigente. | Alta | Propuesto | — |

## Requisitos no funcionales

### Seguridad
| # | Requisito | Prioridad | Estado | Decisión |
|---|---|---|---|---|
| RNF-001 | Servir la plataforma y el API solo por HTTPS; HTTP redirige a HTTPS. | Alta | Propuesto | D-023 |
| RNF-002 | Guardar las contraseñas solo con hash de derivación lenta (Argon2id). | Alta | Hecho | D-005 |
| RNF-003 | Emitir la sesión como token con vencimiento de 12 horas y verificar el rol en el servidor en cada operación y en la conexión en vivo. | Alta | Hecho | D-005 |
| RNF-004 | Limitar los intentos fallidos de ingreso por cuenta. | Alta | Propuesto | D-023 |
| RNF-005 | No revelar qué cuentas existen: la solicitud de cambio de contraseña responde igual exista o no el nombre. | Media | Hecho | D-041 |
| RNF-006 | Mostrar a cada operario solo sus propias órdenes y su desempeño; el de sus compañeros lo ven supervisión, gerencia y administración. | Alta | En construcción | — |

### Integridad y trazabilidad
| # | Requisito | Prioridad | Estado | Decisión |
|---|---|---|---|---|
| RNF-007 | Tomar toda marca de tiempo del reloj del servidor, con zona horaria; nunca del equipo del usuario. | Alta | En construcción | D-012, D-026 |
| RNF-008 | Ejecutar cada operación del alisto en una transacción, de modo que dos usuarios simultáneos no dejen un PKL en un estado inválido. | Alta | En construcción | — |
| RNF-009 | No borrar ningún registro que un evento cite: cuentas, causas y entradas de catálogo se desactivan. | Alta | En construcción | D-021 |
| RNF-010 | Recalcular las métricas desde los eventos, sin guardar cifras, de modo que el mismo período dé siempre el mismo resultado. D, P y Q se acotan a [0, 1]. | Alta | En construcción | D-042 |
| RNF-011 | Cambiar un catálogo no altera los resultados de períodos cerrados. | Alta | En construcción | D-021, D-025 |

### Compatibilidad
| # | Requisito | Prioridad | Estado | Decisión |
|---|---|---|---|---|
| RNF-012 | No escribir nunca en la base de datos del ERP corporativo; la integración es de solo lectura. | Alta | Propuesto | — |
| RNF-013 | Funcionar en el navegador de las computadoras del almacén y de escritorio, desde una URL pública, sin instalar nada. | Alta | Propuesto | D-002, D-020, D-023, D-039 |

### Usabilidad
| # | Requisito | Prioridad | Estado | Decisión |
|---|---|---|---|---|
| RNF-014 | Diseñar la interfaz de operario para uso de pie y con prisa: pocos pasos, objetivos grandes y botones en lugar de texto libre; las notas escritas son opcionales. | Alta | Propuesto | D-026, D-039 |
| RNF-015 | Presentar la interfaz en español y mostrar errores y avisos en un aviso flotante que no desplace el contenido. | Media | Hecho | D-016, D-018 |

### Rendimiento
| # | Requisito | Prioridad | Estado | Decisión |
|---|---|---|---|---|
| RNF-016 | Reflejar un cambio en las demás pantallas en menos de un segundo con la red del almacén en condiciones normales. | Media | Propuesto | — |

### Fiabilidad
| # | Requisito | Prioridad | Estado | Decisión |
|---|---|---|---|---|
| RNF-017 | Ante un corte de red, bloquear la acción del operario y reintentar, sin guardar eventos en el equipo. | Alta | En construcción | D-012 |
| RNF-018 | Modo sin conexión: guardar los eventos en el equipo, marcados con hora del equipo, y enviarlos al volver la red. | Baja | Propuesto | D-027 |

### Mantenibilidad y portabilidad
| # | Requisito | Prioridad | Estado | Decisión |
|---|---|---|---|---|
| RNF-019 | No fijar en el código ningún valor de negocio: causas, tramos, estándares, ponderaciones y tipos de error se leen de configuración. | Alta | En construcción | D-028 |
| RNF-020 | Construir sobre el stack aprobado, solo con software de código abierto y sin licencias: NestJS sobre Bun, Next.js y PostgreSQL. | Alta | Hecho | D-001, D-003, D-004, D-007 |
| RNF-021 | Versionar el esquema de la base con migraciones y mantener un despliegue reproducible en un único servidor Linux. | Media | En construcción | D-004 |
| RNF-022 | Admitir una segunda instancia del API incorporando Redis para repartir los eventos en vivo, sin cambiar el resto del sistema. | Baja | Propuesto | D-006 |

## Equivalencias con la numeración anterior

Hasta D-044 los requisitos se numeraban `REQ-NNN` sin separar funcionales de no funcionales.

| Anterior | Actual | Anterior | Actual | Anterior | Actual |
|---|---|---|---|---|---|
| REQ-001 | RF-019 | REQ-018 | RF-001, RF-002 | REQ-035 | RF-013 |
| REQ-002 | RF-020 | REQ-019 | RNF-012 | REQ-036 | RF-016 |
| REQ-003 | RF-021, RF-022, RNF-007 | REQ-020 | RF-010 | REQ-037 | RF-015 |
| REQ-004 | RF-026 | REQ-021 | RNF-001, RNF-013 | REQ-038 | RF-025 |
| REQ-005 | RF-027 | REQ-022 | RF-009, RNF-014 | REQ-039 | RF-036 |
| REQ-006 | RF-018 | REQ-023 | RNF-018 | REQ-040 | RF-024, RF-028 |
| REQ-007 | RF-029 | REQ-024 | RF-047 | REQ-041 | RF-042 |
| REQ-008 | RF-044 | REQ-025 | RF-048 | REQ-042 | RF-023 |
| REQ-009 | RF-030 | REQ-026 | RF-003 | REQ-043 | RF-046 |
| REQ-010 | RF-043 | REQ-027 | RF-004 | REQ-044 | RF-039 |
| REQ-011 | RF-031 | REQ-028 | RF-005 | REQ-045 | RF-043, RF-044 |
| REQ-012 | RF-032 | REQ-029 | RF-045 | REQ-046 | RF-012, RF-041 |
| REQ-013 | RF-034 | REQ-030 | RF-007 | REQ-047 | RF-011 |
| REQ-014 | RF-035 | REQ-031 | RNF-002 | REQ-048 | RF-017 |
| REQ-015 | RF-037 | REQ-032 | RNF-004 | REQ-049 | RF-014 |
| REQ-016 | RF-038 | REQ-033 | RF-033 | REQ-050 | RF-006 |
| REQ-017 | RF-040 | REQ-034 | RF-008 | | |
