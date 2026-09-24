---
titulo: "Entrevista — método de evaluación actual en CDF"
area: "Reuniones"
tipo: minuta
estado: vigente
actualizado: 2026-09-15
tags:
  - minuta
  - diagnostico
---

# Entrevista — método de evaluación actual en CDF

**Fecha:** jueves 2026-09-10
**Entrevistado:** _(pendiente: nombre y rol — ver [P-012](../decisiones/POR-ACLARAR.md))_
**Propósito:** OE-1, diagnóstico del método vigente; y validación preliminar del modelo OLE, que se le explicó durante la entrevista.

Insumo de campo para la Fase 0 del [roadmap](../producto/ROADMAP.md). Lo que sigue son las
citas y lo que se desprende de ellas; las dudas que abrió van al
[registro](../decisiones/POR-ACLARAR.md).

La segunda ronda se registró por audio de WhatsApp y se transcribió automáticamente. Las
citas de esa ronda se reproducen con la incoherencia de la transcripción; donde el sentido
no se recupera, se dice y no se completa.

## Guía de preguntas — segunda ronda

**Bloque 2 · Medición y evaluación del desempeño**
1. ¿Cómo se evalúa y califica el rendimiento del personal operativo en este momento?
2. ¿Qué ventajas y qué limitaciones encuentra en la forma en que se mide hoy?
3. ¿Cómo perciben la supervisión y los trabajadores la justicia y precisión de esas evaluaciones?

**Bloque 3 · Seguimiento y control de la operación**
4. ¿De qué manera la supervisión monitorea el avance y estado de las órdenes durante la jornada?
5. ¿Qué información operativa le hace falta de forma inmediata para decidir en el piso?
6. ¿Cómo se maneja la asignación de pedidos y la distribución de carga entre el equipo?

**Bloque 4 · Visión y expectativas del nuevo sistema**
7. ¿Cómo imagina una herramienta tecnológica ideal para supervisar y apoyar el trabajo?
8. ¿Qué datos y funciones son indispensables para supervisión y para operarios?
9. ¿Qué es crucial para que la solución sea bien recibida y adoptada por el personal?

## 1. El estándar de productividad existe y es plano

> "El rendimiento, el desempeño se mide, la productividad, que son **quince líneas por hora
> por alistador**. Por tanto, si hace menos de quince, se mira, es deficiente. Si hace más
> de quince es un buen desempeño. Eso es todo básicamente, o sea, número de líneas
> estipuladas, que son quince, por número de líneas reales."

Hallazgo central. El almacén **ya tiene un estándar de rendimiento**: 15 líneas/hora por
alistador, y la evaluación es el cociente entre líneas reales y ese estándar.

Dos consecuencias:

- Hay línea base para el factor **Desempeño (P)** sin esperar un cronoanálisis desde cero.
- El estándar es **plano**: no distingue tipo de orden ni complejidad. La propuesta plantea
  ponderar por alta rotación, cadena de frío y psicotrópicos, así que esa ponderación es
  una **adición del proyecto, no un ajuste de algo existente**, y hay que sustentarla y
  calibrarla. Ver [P-002](../decisiones/POR-ACLARAR.md).

## 2. El propio entrevistado no le encuentra ventaja al método actual

> "A nivel de ventaja no le veo mucho, para ser honesto. (…) Solo estás midiendo cantidad
> de líneas, y si hablas de desempeño, el desempeño no solo es alistar. Hay número de
> factores para medir desempeño, **como el OLE que te está explicando**. (…) Qué ventaja
> puede haber, no lo tengo contemplado."

Testimonio directo que sostiene el planteamiento del problema (OE-1): la medición
unidimensional la reconoce como insuficiente alguien de la propia operación, no solo el
proyecto. Preguntado por las ventajas del método vigente, no encuentra ninguna.

La frase marcada confirma además que el OLE se le explicó durante la entrevista, así que
todo lo que valora después se refiere al modelo propuesto.

## 3. Valida el modelo propuesto: lo considera justo y preciso

Acá ya se le había explicado el OLE. Lo que evalúa en este bloque es **la propuesta**, no el
método actual:

> "Para mí es justo porque se mide parejo. Unos valen más, otros valen menos, porque unos
> ganan más y otros ganan menos. Entonces un error puede valer **doscientos pesos para un
> valeador**, pero es que el valeador gana más que un alistador. Entonces se mide, para mí
> se mide justamente. Es preciso también, porque mide número de errores cometidos por
> alistador, y ese viene siendo su desempeño y su evaluación: el número de errores.
> Bastante preciso, es fácil, es bastante preciso."

Dos cosas, ambas a favor del proyecto:

- **Validación de concepto.** Alguien de la operación, con el modelo explicado, lo califica
  de justo y preciso. Es evidencia temprana para OE-4, antes de cualquier piloto.
- **Insumo de diseño para Q.** Introduce un criterio que la propuesta no tenía: el **costo
  del error se pondera por el valor del rol**. Un error de valeador pesa más que uno de
  alistador porque el valeador gana más. Y aparece el rol `valeador`, distinto del
  alistador, que no estaba en el modelo de dominio.

Queda por definir si el OLE mide también al valeador y si Q incorpora esa ponderación por
rol. Ver [P-015](../decisiones/POR-ACLARAR.md).

## 4. Qué espera de la herramienta

> "Potenciaría bastante, porque da mejor visual de todo el estado de los alistadores y de
> las tareas por avanzar. Es un visual más general, globalizado. **Un GPS de alistadores**,
> por así decirlo."

Lo que pide es exactamente el panel de supervisión en vivo
([REQ-014](../producto/REQUERIMIENTOS.md)). "GPS de alistadores" es la formulación del
propio usuario de lo que espera ver.

## 5. El seguimiento hoy ya pasa por el sistema

> "Se evalúa a través del sistema, sí, a través del sistema, dando seguimiento a los
> alistadores, monitoreando los pedidos más atrasados. Los de mesa te dan un estado en
> cuanto se los puedas pedir."

- El seguimiento ya es sistematizado; la plataforma no introduce la práctica, la vuelve
  continua en lugar de a demanda.
- "Los de mesa te dan un estado **en cuanto se los puedas pedir**" describe el modo actual:
  el estado se consulta, no se emite. Es justo la diferencia que introduce el WebSocket.
- **"Los de mesa" no quedó definido** en la entrevista. Ver
  [P-014](../decisiones/POR-ACLARAR.md).

## 6. Las ventanas de entrega son heterogéneas y hoy no hay alerta

> "Hay que buscar una mejora, una alerta para las tareas o los PKL que ya están pronto a
> finalizar, porque **cada uno de los clientes tiene un tipo de entrega diferente**. Hay
> clientes que tenemos para **veinticuatro horas**, hay clientes que tenemos para **diez,
> quince minutos**. Entonces un aviso del tiempo que lleva el PKL desde haberse caído (…) y
> de lo que le falta. Una alerta que te diga **esto se está por vencer**, (…) o **esto es lo
> prioritario**."

Lo pidió dos veces en la misma ronda, así que es su necesidad principal.

El dato duro: **el compromiso de entrega no es uniforme, va por cliente**, y el rango es
enorme — de 24 horas a 10-15 minutos. Eso no estaba en ninguna parte de la propuesta y
cambia el tablero: una orden no vale por antigüedad sino por cuánto le queda de su propia
ventana.

Consecuencias:

- La orden necesita **ventana de entrega** y **tiempo restante**, no solo estado.
- El Kanban necesita ordenar por urgencia relativa, no por orden de llegada.
- Hace falta alerta por proximidad de vencimiento.

De acá salen [REQ-035](../producto/REQUERIMIENTOS.md) a
[REQ-037](../producto/REQUERIMIENTOS.md).

Sobre **PKL**: por cómo se usa —algo que "cae", acumula tiempo y tiene ventana— se modela
como el código que identifica a la orden de alisto en el piso. Es un supuesto de trabajo,
no una confirmación de CDF. Ver [P-017](../decisiones/POR-ACLARAR.md).

## 7. La meta agregada tapa el desempeño individual

> "El personal no (todos) se desempeñan de la mejor manera. Hay unos que sí cumplen con su
> métrica y hay otros que se quedan por debajo. (…) **Si al final llegás al número, si
> cumplimos la meta, pero no porque el cien por ciento** (…)."

La meta se evalúa agregada: el almacén cumple aunque adentro haya gente por debajo del
estándar. Refuerza la medición **por colaborador** ([REQ-012](../producto/REQUERIMIENTOS.md)),
que es lo que el agregado esconde.

## 8. Reconoce factores externos y que hoy no se mide con exactitud

> "Hay que tomar en cuenta varios factores y muchas veces eso te limita. No siempre vas a
> tener los resultados. ¿Por qué? **Factores que te alteran.** (…) **No lo medís con
> exactitud.**"

Es el argumento de la **Disponibilidad Neta** dicho por la operación: hay factores que
alteran el resultado y la medición actual no los aísla. Es el respaldo más directo que hay
hasta ahora para el factor D, y viene de quien evalúa.

Sigue faltando el catálogo de cuáles son esos factores — [P-001](../decisiones/POR-ACLARAR.md).

## 9. Qué espera de la herramienta, segunda ronda

Lo recuperable de un bloque con transcripción degradada:

- **Monitoreo del proceso en tiempo real**, en formato de tablero analítico: *"un Power B[I]
  para ir monitoreando en tiempo real cómo se comporta el proceso"*.
- **Ubicación y actividad del alistador**: *"desde aquí podés saber dónde está un alistador,
  qué está haciendo"*. Repite la metáfora del GPS de la primera ronda.
- **Sin papel.** Preguntado si le gustaría que no haya papel: *"Sí, sí señor."*
- **Rapidez y pocos pasos**: pide que sea *"más rápido"*, con *"esta pestañita para tal
  cosa"*. Coincide con el principio de baja carga cognitiva.
- Menciona **"mesa de control"**, lo que aclara parcialmente a "los de mesa" de la primera
  ronda: es una estación de control, no un rol suelto. Ver [P-014](../decisiones/POR-ACLARAR.md).

Lo que la transcripción escribe como **"el ángel"** (y como "janel") es **handheld**: el
equipo con el que trabaja el alistador en el piso. Con eso el bloque se lee entero:

> "Un dispositivo (…) **tipo handheld**. (…) Y un Power B[I] para ir monitoreando en tiempo
> real cómo se comporta el proceso, porque el handheld te dice (…) es como un GPS: vos desde
> aquí podés saber dónde está un alistador, qué está haciendo, muchas cosas. (…) Y monitorea
> **la gente que ande sin handheld**."

Tres consecuencias:

- **El cliente objetivo es un handheld, no una terminal fija.** Pantalla chica, uso de pie,
  una mano ocupada. Define el diseño de toda la interfaz de operario.
- **El handheld es la fuente de los eventos.** Lo que él llama GPS es el equipo reportando
  posición y actividad; es el mismo flujo que alimenta el Kanban y el cronometraje.
- **"La gente que ande sin handheld" es un hueco de medición.** Un alistador trabajando sin
  equipo no genera eventos, y sin eventos no hay OLE. Ver
  [REQ-039](../producto/REQUERIMIENTOS.md).

**No recuperable:** el tramo sobre asignación de pedidos y distribución de carga (pregunta 6
del Bloque 3) quedó ininteligible en la transcripción. La pregunta sigue sin responder.

## Qué cambia en la documentación

| Efecto | Dónde |
|---|---|
| Estándar de 15 líneas/hora como línea base de P | [`PRODUCTO.md`](../producto/PRODUCTO.md), [`REQ-008`](../producto/REQUERIMIENTOS.md) |
| Rol `valeador` y ponderación del error por valor del rol | [`ARQUITECTURA.md`](../ingenieria/ARQUITECTURA.md) |
| P-002 avanza: hay estándar plano, falta la ponderación por complejidad | [`POR-ACLARAR.md`](../decisiones/POR-ACLARAR.md) |
| Ventanas de entrega por cliente y alertas de vencimiento | [`REQ-035`…`REQ-038`](../producto/REQUERIMIENTOS.md) |
| Factores externos reconocidos por la operación, respaldo de D | [`PRODUCTO.md`](../producto/PRODUCTO.md) |
| P-012, P-014, P-015, P-016, P-017, P-018 abiertas | [`POR-ACLARAR.md`](../decisiones/POR-ACLARAR.md) |

## Qué no se preguntó y hace falta

- Causas de parada y su tipificación — el tema central de [P-001](../decisiones/POR-ACLARAR.md) no se tocó.
- Denominador de la tasa de calidad: errores sobre qué universo, y en qué período.
- Cómo se pondera concretamente el error por rol: si es el salario, una tabla fija, o el costo real del reproceso.
- Qué hace exactamente un valeador y en qué punto del flujo entra.
- Cómo salen las órdenes del sistema actual ([P-006](../decisiones/POR-ACLARAR.md)).
- Asignación de pedidos y distribución de carga: se preguntó, pero la respuesta no se recuperó de la transcripción.
- Fecha exacta de la segunda ronda: no quedó registrada.
