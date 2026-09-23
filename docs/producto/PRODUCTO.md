# Dicegsa — Documento maestro

**Título oficial:** Sistema web para evaluación operativa mediante Overall Labor Effectiveness (OLE) y Kanban en el almacén CDF (DICEGSA).

Proyecto de Culminación de Estudios — Ingeniería en Sistemas, UAM (Facultad de Ingeniería & Arquitectura).
Autores: Manuel Alejandro López Velásquez (21011754), Jareth Ezequiel López Vásquez (21011520).
Coordinador académico: Ing. Noel Gavarrete Martínez. Dictamen: **APROBADO** — ver [ANEXO 1](../fuentes/anexo-1-dictamen-aprobacion.pdf).

## Qué es
Plataforma web para el almacén Centro de Distribución Fármaco (CDF) de DICEGSA que hace dos cosas acopladas:

1. **Tablero Kanban** de las órdenes de alisto — estados, asignación y registro de bloqueos en el momento en que ocurren, sincronizado en tiempo real entre terminales.
2. **Motor OLE** que calcula la efectividad real de cada colaborador a partir de lo que el Kanban registra. Las métricas se entregan al departamento que asigna bonificaciones o sanciones; ese cálculo no es parte de la plataforma.

Opera de forma **complementaria y no invasiva** al ERP corporativo: lee y mide, no escribe en la base transaccional central.

## Por qué (tesis)
Hoy el ERP evalúa el desempeño con dos variables: **tiempo bruto transcurrido** y **conteo simple de tareas**. Esa medición unidimensional produce dos errores sistemáticos:

- **Falsos negativos** — penaliza al colaborador por paradas que no controla: quiebre de stock en la ubicación de picking, lentitud o caída del ERP, espera de firma de regencia farmacéutica. El incentivo se vuelve punitivo.
- **Falsos positivos** — premia al que despacha rápido y con errores, porque la calidad no entra en la fórmula.

A eso se suma que la supervisión trabaja con reportes estáticos: los cuellos de botella se ven después, cuando ya no se pueden mitigar.

La tesis es que **descomponer la efectividad en disponibilidad, rendimiento y calidad** —y registrar los bloqueos en el instante en que ocurren— corrige ambos errores y convierte el incentivo en un mecanismo de mérito real.

## Evidencia de campo
La [entrevista del 2026-09-10](../reuniones/2026-09-10-minuta-entrevista-operacion.md) sostiene el planteamiento y valida el modelo:

- El estándar de 15 líneas/hora existe y la evaluación es líneas reales sobre ese número, plana.
- Preguntado por las ventajas del método vigente, no encuentra ninguna: "el desempeño no solo es alistar".
- Explicado el OLE, lo califica de **justo y preciso**. Validación de concepto para OE-4, antes del piloto.
- Aporta un criterio que la propuesta no tenía: el costo del error debería ponderarse por el valor del rol. Ver [P-015](../decisiones/POR-ACLARAR.md).
- Lo que espera de la herramienta es el panel en vivo — "un GPS de alistadores".

En la segunda ronda agrega dos cosas que la propuesta no contemplaba:

- **Las ventanas de entrega no son uniformes:** van de 24 horas a 10-15 minutos según el cliente. Su pedido principal es una alerta de vencimiento. La urgencia de una orden depende de su propia ventana, no de cuánto lleva esperando.
- **Reconoce el argumento de la Disponibilidad:** "hay que tomar en cuenta varios factores (…) factores que te alteran (…) no lo medís con exactitud". Es el respaldo más directo al factor D, y viene de quien evalúa.

La tercera ronda muestra cómo se evalúa hoy ([D-040](../decisiones/POR-ACLARAR.md)): la trazabilidad del ERP se copia a Excel y se calcula **productos / 8 h y unidades / 8 h**. Ese 40 % del incentivo divide por las **8 horas brutas**, sin descontar nada: un alistador que esperó una hora por inventario rinde en la cuenta como si hubiera trabajado las ocho. Es el falso negativo de la tesis, escrito en la fórmula.

También señala que la meta se cumple agregada aunque haya gente por debajo del estándar, lo que justifica medir por colaborador; y pide operar sin papel.

Menciona el **handheld** como equipo del alistador y fuente de los eventos. Esa opción quedó descartada ([D-020](../decisiones/POR-ACLARAR.md)): el alistador usa la misma web en las computadoras del almacén ([D-039](../decisiones/POR-ACLARAR.md)). Su preocupación por "la gente que ande sin handheld" sigue valiendo para quien no abre sesión: quien trabaja sin equipo no genera eventos y queda fuera del cálculo.

## Para quién
| Usuario | Qué obtiene |
|---|---|
| Operario de alisto | Evaluación justa: las paradas ajenas no le descuentan. Interfaz táctil de baja carga cognitiva. |
| Supervisor de CDF | Tablero en vivo, cuellos de botella visibles mientras ocurren, trazabilidad por orden. |
| Mesa de control | Pedidos en una tabla con zonas, fecha de entrega y pronta entrega en rojo; asignación de PKL. |
| Validador | Registro de errores sin hoja de papel. |
| Supervisores y gerencia | Métricas por colaborador para asignar bonificaciones o sanciones por mérito medible; menos reprocesos y devoluciones. |
| Cliente final (indirecto) | Menos incidencias de SKU, lote y cantidad en el despacho farmacéutico. |

## Vocabulario de CDF
Términos de la operación, tal como los usa el personal. Los que están marcados salen de las
[entrevistas](../reuniones/2026-09-10-minuta-entrevista-operacion.md) y no de la propuesta.

| Término | Qué es |
|---|---|
| **CDF** | Centro de Distribución Fármaco, el almacén de DICEGSA donde corre todo esto. |
| **Alisto** | Preparación de un pedido: recorrer las ubicaciones y juntar las líneas. Picking. |
| **Alistador** | Quien hace el alisto. Es el sujeto principal de la medición. |
| **Validador** ◆ | Revisa el PKL que entrega el alistador y registra los errores. La transcripción de la entrevista lo escribía "valeador". Rol mejor pago; un error suyo pesa más — [D-036](../decisiones/POR-ACLARAR.md). |
| **PKL** ◆ | _Picking list_: el identificador de la orden de alisto. Agrupa varios pedidos, se asigna a un alistador y es lo que se trabaja — [D-031](../decisiones/POR-ACLARAR.md). |
| **Pedido** ◆ | Lo que compra un cliente. Llega del ERP cuando lo libera televentas, con sus productos, lote y vencimiento. |
| **Televentas** ◆ | Área que toma los pedidos y los libera al almacén. Da de baja lo que no tiene existencias. |
| **Línea** | Un producto distinto dentro del pedido, con su lote y cantidad. La unidad que se cuenta: 15 líneas/hora es el estándar. |
| **Unidades** | La suma de cantidades del pedido. 5 jabones íntimos y 4 de cuerpo son 2 líneas y 9 unidades. |
| **Handheld** ◆ | El equipo que el entrevistado asocia al alistador. Fuera del alcance: el alistador usa la web en las computadoras del almacén — [D-020](../decisiones/POR-ACLARAR.md). |
| **Mesa de control** ◆ | Recibe los pedidos del ERP, les asigna zonas y asigna los PKL a los alistadores — [D-032](../decisiones/POR-ACLARAR.md). |
| **Zona de despacho** ◆ | A dónde va el pedido: Managua, Sur oriente, Occidente, Correo. Configurable. |
| **Zona de inventario** ◆ | Área del almacén de donde sale: cuarto frío y climatizado, medicamentos instituciones y controlados, dispositivos médicos, picking. Configurable. |
| **Ventana de entrega** ◆ | Compromiso con el cliente. Va de 24 horas a 10-15 minutos según el cliente. |
| **OLE** | Overall Labor Effectiveness. El indicador que introduce el proyecto. |

## El indicador

```
OLE = Disponibilidad Neta (D) × Desempeño Estándar (P) × Calidad Operativa (Q)
```

- **D — Disponibilidad Neta:** descuenta los tiempos de bloqueo registrados en el Kanban. Mide solo el tiempo en que el operario tuvo material y sistema disponibles.
- **P — Desempeño Estándar:** líneas alistadas sobre el estándar. La línea base vigente en CDF es **15 líneas/hora por alistador**, plana; el proyecto agrega la ponderación por complejidad del pedido (alta rotación, cadena de frío, psicotrópicos).
- **Q — Calidad Operativa:** tasa de precisión de las auditorías de despacho — cero errores en SKU, lote o conteo.

## Alcance (visión)
- Tablero Kanban de órdenes de alisto con estados y transiciones, sincronizado por WebSocket.
- Ventana de entrega por orden y alerta de proximidad de vencimiento, con el tablero ordenado por urgencia relativa.
- Cronometraje por orden y por línea, con latencia de milisegundos.
- Registro tipificado de paradas, distinguiendo imputables y no imputables al colaborador.
- Registro tipificado de errores de calidad por causa de origen (SKU, lote, cantidad).
- Motor de cálculo OLE por colaborador, turno y período.
- Catálogo de tiempos estándar por tipo de orden y complejidad.
- Panel de supervisión en vivo y reportes comparativos (método tradicional vs. OLE).
- Control de acceso por roles.

**Fuera del alcance:** despacho y asignación de rutas, porque el ciclo del PKL termina en la validación ([D-036](../decisiones/POR-ACLARAR.md)); inventario, stock, catálogo de productos y ubicaciones en la bodega, que siguen en el ERP corporativo ([D-030](../decisiones/POR-ACLARAR.md)); y el cálculo de bonificaciones o sanciones, que hace otro departamento con las métricas ([D-029](../decisiones/POR-ACLARAR.md)).

## Principios de diseño
1. **No invasivo.** Cero escrituras al ERP corporativo. La plataforma es un sistema paralelo de medición.
2. **La parada se registra cuando ocurre, no se reconstruye después.** Un bloqueo no capturado en vivo es tiempo perdido que el modelo no puede devolverle al operario.
3. **Equidad auditable.** Toda cifra de OLE debe poder desarmarse hasta los eventos que la produjeron.
4. **Baja carga cognitiva.** Computadora compartida, de pie, una mano ocupada, prisa: pocos toques, objetivos grandes, sin texto libre donde alcance un botón.
5. **Costo marginal.** Open source, sin licenciamiento privativo, sobre la infraestructura ya instalada.
6. **Configurable, no fijo.** Causas, tramos, estándares, ponderaciones y tipos de error son configuración que ajusta el cliente, no valores escritos en el código.
7. **Todo deja rastro.** Qué usuario hizo qué y cuándo, y qué órdenes tuvo cada operario. Es el control sobre la operación.

## Ejes del proyecto
| Eje | Objetivo específico | Dónde vive |
|---|---|---|
| OE-1 Diagnóstico | Diagnosticar las limitaciones del método actual: tiempos estándar, causas raíz de paradas, registros de error. | Trabajo de campo (previo al software) |
| OE-2 Modelado | Modelar matemáticamente el OLE adaptado al alisto farmacéutico. | [`REQUERIMIENTOS.md`](REQUERIMIENTOS.md), [`../ingenieria/ARQUITECTURA.md`](../ingenieria/ARQUITECTURA.md) |
| OE-3 Construcción | Construir Kanban + motor analítico OLE en tiempo real. | [`ROADMAP.md`](ROADMAP.md) |
| OE-4 Validación | Contrastar la evaluación nueva contra la tradicional con datasets reales. | [`ROADMAP.md`](ROADMAP.md) |

## Estado
Tema aprobado y stack definido. Hechos: cuentas y acceso, eventos en vivo, catálogo de causas de parada y perfil de colaborador. Las órdenes y el tablero esperan a que se confirme qué es un PKL.
Requisitos en [`REQUERIMIENTOS.md`](REQUERIMIENTOS.md); fases en [`ROADMAP.md`](ROADMAP.md);
decisiones en [`../decisiones/POR-ACLARAR.md`](../decisiones/POR-ACLARAR.md);
arquitectura en [`../ingenieria/ARQUITECTURA.md`](../ingenieria/ARQUITECTURA.md);
documentos fuente en [`../fuentes/`](../fuentes/).
