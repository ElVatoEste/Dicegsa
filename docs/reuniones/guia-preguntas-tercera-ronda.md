dale ---
titulo: "Guía de preguntas — tercera ronda"
proyecto: "Dicegsa — OLE y Kanban en CDF"
area: "Reuniones"
tipo: guia
estado: vigente
actualizado: 2026-09-15
tags:
  - guia
  - diagnostico
---

# Guía de preguntas — tercera ronda

Cierra las dudas abiertas del [registro](../decisiones/POR-ACLARAR.md) después de las dos
rondas del [2026-09-10](2026-09-10-minuta-entrevista-operacion.md).

Son cuatro interlocutores distintos. **El bloque A destraba el arranque del MVP y se
responde por teléfono**; el bloque B es el que sostiene el modelo OLE; el bloque C es la voz
que todavía no se escuchó.

Antes de empezar: **registrar nombre y cargo de cada entrevistado** — la minuta anterior no
los tiene ([P-012](../decisiones/POR-ACLARAR.md)).

## Bloque A · TI y sistemas de DICEGSA

Lo más urgente y lo más barato. Sin esto no se puede escribir la primera línea de código.

1. ¿Qué marca y modelo son los handhelds que usan los alistadores?
2. ¿Qué navegador tienen y qué versión? *(Pedir que abran el navegador en un equipo y lean
   la versión ahí mismo.)* — [P-019](../decisiones/POR-ACLARAR.md)
3. ¿La wifi cubre toda la bodega o hay zonas donde el equipo se queda sin señal?
   *(Si hay zonas muertas, se reevalúa [D-012](../decisiones/POR-ACLARAR.md).)*
4. ¿Cómo podríamos leer las órdenes del ERP: hay API, una vista de solo lectura, una
   exportación programada, una réplica de base? — [P-006](../decisiones/POR-ACLARAR.md)
5. ¿Con qué frecuencia caen las órdenes al piso: de a una, por tandas, en horarios fijos?
6. ¿El handheld reporta la ubicación del operario, o la posición se deduce de la lectura del
   rack? — [P-020](../decisiones/POR-ACLARAR.md)

## Bloque B · Supervisión y jefatura de CDF

### B.1 Paradas y bloqueos

Lleva dos rondas sin preguntarse y es el insumo del factor Disponibilidad. Sin estas
respuestas no hay motor OLE. — [P-001](../decisiones/POR-ACLARAR.md)

7. Cuando un alistador se traba y no puede seguir, ¿qué es lo que más pasa?
8. ¿Cuáles de esas causas dirías que no son culpa del alistador?
9. ¿Cuánto suele durar cada una de esas paradas?
10. ¿Cómo se entera hoy el supervisor de que alguien está trabado?
11. ¿Queda registro de esas paradas en algún lado, o se pierden?

### B.2 Unidad de trabajo y tiempos

12. ¿Un PKL es una sola orden, o agrupa varias?
    — [P-017](../decisiones/POR-ACLARAR.md)
13. ¿Un alistador trabaja un PKL a la vez, o lleva varios en paralelo?
14. ¿Podría marcar el avance línea por línea, o solo al terminar el PKL?
    — [P-003](../decisiones/POR-ACLARAR.md)
15. ¿Hay tipos de orden que razonablemente lleven más tiempo? ¿Cadena de frío, psicotrópicos
    o alta rotación cambian el ritmo? — [P-002](../decisiones/POR-ACLARAR.md)
16. Entonces, ¿las quince líneas por hora aplican parejo a todo, o deberían variar?

### B.3 Ventanas de entrega

17. ¿Cuántos tramos de ventana de entrega hay? Mencionaste veinticuatro horas y diez o
    quince minutos, ¿hay algo en el medio? — [P-018](../decisiones/POR-ACLARAR.md)
18. ¿Cómo se sabe qué ventana le toca a cada orden? ¿Viene con el pedido desde el sistema?
19. ¿Qué pasa hoy cuando una orden se vence?

### B.4 Calidad y errores

20. ¿Se audita cada despacho o una muestra? — [P-004](../decisiones/POR-ACLARAR.md)
21. ¿Sobre cuántas líneas se cuentan los errores, y en qué período?
22. ¿Qué tipos de error se registran? ¿SKU, lote, cantidad, alguno más?
23. ¿Cómo se entera el alistador de que cometió un error, y cuándo?

### B.5 Roles y estaciones

24. ¿Qué hace exactamente un valeador y en qué punto del flujo entra?
    — [P-015](../decisiones/POR-ACLARAR.md)
25. ¿Qué es la mesa de control y qué hace hoy? ¿La plataforma la reemplazaría o la
    alimentaría? — [P-014](../decisiones/POR-ACLARAR.md)
26. ¿Cómo se asignan los pedidos hoy y cómo se reparte la carga entre el equipo?
    *(Se preguntó en la segunda ronda pero la respuesta no se recuperó del audio.)*

### B.6 El handheld en el piso

27. ¿El handheld es de cada persona durante el turno, o rota entre operarios?
    — [P-010](../decisiones/POR-ACLARAR.md)
28. ¿Cuántos handhelds hay y cuántos alistadores por turno?
29. Mencionaste "la gente que ande sin handheld": ¿pasa seguido, y por qué?

## Bloque C · Alistadores

**Dos o tres personas, por separado.** Es la voz que falta: hasta ahora solo se escuchó a
quien evalúa, no a quien es evaluado. Son quienes conocen las paradas de primera mano.

30. ¿Cómo sabés si te fue bien en el turno?
31. ¿Te ha pasado que te baje el número por algo que no dependía de vos? ¿Qué fue?
32. ¿Qué es lo que más tiempo te hace perder en el día?
33. Si pudieras avisar en el momento que estás trabado, ¿lo usarías? ¿Cómo te gustaría
    avisar?
34. ¿Cómo te llevás con el handheld? ¿Qué te molesta de usarlo?
35. Si el sistema descontara los tiempos que no dependen de vos, ¿te parecería más justo que
    lo de ahora?

## Bloque D · Gerencia y recursos humanos

36. ¿Cómo se traduce hoy el desempeño en bonificación?
    — [P-005](../decisiones/POR-ACLARAR.md)
37. ¿Estarían dispuestos a cambiar la fórmula del bono si el modelo lo justifica con datos?
38. ¿Hay alguna restricción legal, contractual o sindical para cambiar la forma de evaluar?

## Qué se destraba con cada bloque

| Bloque | Cierra | Habilita |
|---|---|---|
| A | P-006, P-019, P-020 | Arrancar el MVP |
| B.1 | P-001 | El factor Disponibilidad |
| B.2 | P-002, P-003, P-017 | El factor Desempeño y el modelo de datos |
| B.3 | P-018 | Alertas de vencimiento (REQ-035 a REQ-037) |
| B.4 | P-004 | El factor Calidad |
| B.5 | P-014, P-015 | Modelo de roles y REQ-006 |
| B.6 | P-010 | Diseño del login y REQ-039 |
| C | — | Evidencia del lado evaluado; insumo de P-001 |
| D | P-005 | Viabilidad de aplicar el modelo al bono |

## Lo que no se pregunta

Ya está decidido de este lado; no se lleva a la reunión:

| Decisión | Qué se resolvió |
|---|---|
| [D-010](../decisiones/POR-ACLARAR.md) | Contraseñas: el sistema genera una aleatoria de un solo uso, cambio obligatorio al primer ingreso, largo mínimo 8 y sin reglas de composición. |
| [D-011](../decisiones/POR-ACLARAR.md) | El rol `admin` existe; quién lo ocupa lo define DICEGSA al desplegar. El OLE del MVP mide alistadores; el valeador se modela pero queda fuera del cálculo inicial. |
| [D-012](../decisiones/POR-ACLARAR.md) | Corte de red: el handheld bloquea y reintenta, sin cola local. Solo se reevalúa si la pregunta 3 revela zonas sin cobertura. |
