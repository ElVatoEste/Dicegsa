# Dicegsa — Documentación

Plataforma web que mide el desempeño real del alisto en el almacén CDF (DICEGSA) con el indicador **OLE**
(Overall Labor Effectiveness) sobre un **tablero Kanban** en tiempo real, para reemplazar un esquema de
incentivos que hoy penaliza al operario por paradas que no controla. Si es tu primera vez, empezá por
[`producto/PRODUCTO.md`](producto/PRODUCTO.md).

## Producto — qué se construye y por qué
| Doc | Contenido |
|---|---|
| [`producto/PRODUCTO.md`](producto/PRODUCTO.md) | **Documento maestro.** Tesis, indicador OLE, alcance, principios de diseño. Empezar aquí. |
| [`producto/REQUERIMIENTOS.md`](producto/REQUERIMIENTOS.md) | 39 requisitos (`REQ-001`…`REQ-039`) agrupados por Kanban, modelo OLE, supervisión, plataforma, cuentas y validación. |
| [`producto/ROADMAP.md`](producto/ROADMAP.md) | Fase 0 diagnóstico → MVP Kanban → v1 motor OLE → v2 validación. |

## Ingeniería — cómo está hecho
| Doc | Contenido |
|---|---|
| [`ingenieria/ARQUITECTURA.md`](ingenieria/ARQUITECTURA.md) | Modelo de dominio, flujos de alisto y cálculo, stack, modelo de cuentas, 10 invariantes críticas. |

## Diagramas — UML y datos
Archivos `.drawio`: se abren y editan con [draw.io](https://app.diagrams.net) (web o escritorio, gratis).

| Doc | Contenido |
|---|---|
| [`diagramas/01-casos-de-uso.drawio`](diagramas/01-casos-de-uso.drawio) | Actores (alistador, validador, mesa de control, supervisor, gerencia, administrador) y sus casos de uso. |
| [`diagramas/02-clases.drawio`](diagramas/02-clases.drawio) | Modelo de dominio: PKL, pedido, línea, asignación, parada, error de validación, cálculo OLE. |
| [`diagramas/03-entidad-relacion.drawio`](diagramas/03-entidad-relacion.drawio) | Las 15 tablas de PostgreSQL con columnas y claves foráneas, tal como están en el esquema Drizzle. |
| [`diagramas/04-secuencia.drawio`](diagramas/04-secuencia.drawio) | Dos páginas: el alistador marca una línea y el validador revisa un PKL. |
| [`diagramas/05-despliegue.drawio`](diagramas/05-despliegue.drawio) | Computadoras del almacén, VPS con nginx, Bun y PostgreSQL, y ERP en solo lectura. |
| [`diagramas/png/`](diagramas/png/) | Los cinco anteriores exportados a PNG en alta resolución; la secuencia en dos imágenes. Se regeneran al cambiar un `.drawio`. |
| [`diagramas/borradores/`](diagramas/borradores/) | **Pendientes, segundo plano.** Borradores de actividad, estados y componentes, sin revisar. |

## Decisiones — el registro vivo (interno)
| Doc | Contenido |
|---|---|
| [`decisiones/POR-ACLARAR.md`](decisiones/POR-ACLARAR.md) | **Registro vivo.** 12 decisiones cerradas (`D-001`…`D-012`), 14 dudas abiertas. |
| [`decisiones/POLITICA-COMENTARIOS.md`](decisiones/POLITICA-COMENTARIOS.md) | **Regla estricta y vigente.** Qué se comenta en el código y qué no. De cumplimiento obligatorio. |
| [`decisiones/BRANDING.md`](decisiones/BRANDING.md) | Identidad de marca (tokens, tipografía, logo). |

## Fuentes — documentos originales
| Archivo | Contenido |
|---|---|
| [`fuentes/propuesta-estrategica.pdf`](fuentes/propuesta-estrategica.pdf) | Propuesta técnico-estratégica: problema, matriz de trazabilidad OE-1…OE-4, stack, viabilidad. |
| [`fuentes/anexo-1-dictamen-aprobacion.pdf`](fuentes/anexo-1-dictamen-aprobacion.pdf) | ANEXO 1 — dictamen técnico UAM, firmado. Tema **APROBADO**, título oficial y autores. |
| [`fuentes/antecedentes-internacionales.docx`](fuentes/antecedentes-internacionales.docx) | Estado del arte: 5 antecedentes que sustentan el modelo OLE y la selección tecnológica. |

## Roles
| Doc | Contenido |
|---|---|
| _(pendiente)_ | — |

## Reuniones — minutas
| Doc | Contenido |
|---|---|
| [`reuniones/guia-preguntas-tercera-ronda.md`](reuniones/guia-preguntas-tercera-ronda.md) | **Próxima ronda.** 38 preguntas en cuatro bloques: TI, supervisión, alistadores y gerencia, con qué destraba cada uno. |
| [`reuniones/2026-09-10-minuta-entrevista-operacion.md`](reuniones/2026-09-10-minuta-entrevista-operacion.md) | Dos rondas: estándar de 15 líneas/hora, OLE calificado de justo y preciso, rol valeador, ventanas de entrega por cliente y alerta de vencimiento, "GPS de alistadores". |

## Assets
| Archivo | Contenido |
|---|---|
| _(pendiente)_ | — |
