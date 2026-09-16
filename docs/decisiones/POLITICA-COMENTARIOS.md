---
titulo: "Política de comentarios en el código"
proyecto: "Dicegsa — OLE y Kanban en CDF"
area: "Decisiones"
tipo: plan
estado: vigente
actualizado: 2026-09-15
tags:
  - doc
  - plan
  - codigo
---

# Política de comentarios en el código

Los comentarios documentan el **estado actual y verificable del sistema**, no la historia
del desarrollo.

> **El código explica qué hace. El comentario explica una restricción o decisión que el
> código, por sí solo, no puede expresar. Nunca explica cómo llegamos hasta acá.**

## 1. Test obligatorio

Antes de conservar o escribir un comentario:

**A. Si elimino el resto del repositorio y dejo únicamente este archivo, ¿el comentario
sigue siendo verdadero?**

**B. Si leo el comentario, ¿cambia mi comprensión de cómo debo interpretar, mantener o
modificar este código?**

- Sí + Sí → **conservar**.
- No en A → **reescribirlo** para expresar la restricción técnica real, o eliminarlo.
- No en B → **eliminarlo**.

El comentario tiene que seguir siendo válido independientemente de commits, PRs, ramas,
conversaciones o decisiones históricas.

## 2. Historia vs. restricciones actuales

Prohibido documentar historia de implementación dentro del código:

- cambios anteriores o posteriores;
- commits, PRs, issues o tickets;
- ramas, desarrolladores o conversaciones;
- "antes hacía X";
- "se cambió X por Y";
- "esto arregla X";
- referencias a decisiones tomadas durante el desarrollo.

Ejemplos que se eliminan:

```ts
// Cambiado de REST a GraphQL después del PR #412
// Antes esto usaba el flujo de auth viejo
// Arregla el bug reportado en el issue #183
// Según lo conversado con el equipo de backend
```

Una restricción externa, técnica y vigente **sí se documenta**, aunque su origen se haya
descubierto durante un issue o un cambio:

```ts
// Postgres trunca los timestamp a microsegundos; dos eventos en el mismo microsegundo
// se desempatan por id.
```

La distinción:

**Historia de cómo llegamos al código → fuera del código.**
**Restricción que actualmente determina cómo debe funcionar el código → dentro del código.**

## 3. Información temporal o de desarrollo

No registrar estados transitorios:

```ts
// TODO: refactorizar esto más adelante
// Solución temporal
// Se elimina cuando esté listo el endpoint nuevo
// Datos de prueba por ahora
```

Si hay una limitación actual que afecta al comportamiento, se expresa como estado o
restricción presente:

```ts
// Esta vista todavía no tiene fuente de datos real; los valores son estáticos a propósito.
```

```ts
// Ningún endpoint expone el histórico de paradas todavía, así que la vista muestra un
// estado vacío explícito.
```

Los `TODO` y `FIXME` sólo quedan cuando representan trabajo pendiente que el proyecto
exige conservar explícitamente. El detalle histórico o de seguimiento se migra a
[`../producto/REQUERIMIENTOS.md`](../producto/REQUERIMIENTOS.md), no se convierte en
narrativa dentro del código.

Un dato inventado que parece real es peor que un dato faltante. Nunca usar comentarios
para hacer que mocks, fixtures o datos temporales parezcan venir de una fuente real.

## 4. Severidad durante una auditoría

Cada comentario existente se clasifica en una sola categoría:

| Categoría | Cuándo |
|---|---|
| **BORRAR** | Redundante, histórico, narrativo, obvio o sin información necesaria. |
| **REESCRIBIR** | Información válida, pero expresada como historia, contexto local o implementación en vez de como restricción actual. |
| **CONSERVAR** | Explica una restricción, comportamiento no evidente, contrato externo, edge case, trade-off o requisito vigente. |

Una auditoría de comentarios no es una reescritura estética. Si un comentario es válido,
se conserva aunque pudiera redactarse de otra manera.

## 5. Contexto externo verificable

No confundir "repo-local" con "externo".

Se documenta dentro del código cualquier comportamiento externo que afecte directamente a
la implementación:

- contratos de APIs;
- códigos de error;
- límites de una librería;
- comportamiento conocido de un runtime;
- restricciones de un proveedor;
- bugs reproducibles de una dependencia;
- requisitos de protocolos o estándares;
- compatibilidad entre versiones.

El comentario describe el comportamiento o la restricción, no su historia:

```ts
// El navegador cierra el WebSocket tras 60 s sin tráfico; por eso el gateway manda ping
// cada 30 s.
```

No:

```ts
// Agregado después de descubrir el corte de WebSocket en el issue #42.
```

### Prohibido: estado del registro e IDs de tarea

Lo más grave, y lo primero que se saca en una auditoría:

- **IDs de registro o de tarea**: `REQ-014`, `D-005`, `P-003`, `tarea 121`.
- **Estado de una tarea**: "REQ-014 hecho", "esto cierra P-003", "queda pendiente".
- **Rutas a archivos de documentación**: `docs/…`, rutas absolutas de la máquina.
- **Commits y fechas de release**: "validado contra el esquema (commit `drizzle`, 2026-09-02)".

El estado del registro cambia sin que nadie toque el código, así que el comentario queda
mintiendo en silencio. Ese estado vive en
[`../producto/REQUERIMIENTOS.md`](../producto/REQUERIMIENTOS.md) y en
[`POR-ACLARAR.md`](POR-ACLARAR.md), que es donde se lee.

Cuando el ID acompaña una restricción real, se conserva la restricción y se tira el ID:

```ts
// REQ-004: registro de bloqueo en un toque.
// →
// Una parada sin causa del catálogo no se puede clasificar como imputable,
// así que la causa es obligatoria al abrirla.
```

### Referencias a otro archivo del repositorio

Una ruta a otro archivo del mismo repo es repo-local pero **no es historia**. Se conserva
cuando describe un acoplamiento vigente y la ruta existe; el test A se lee como *¿sigue
siendo verdadero?*, no como *¿sigue siendo resoluble?*. Si la ruta ya no existe, el
comentario miente y se borra.

## 6. Qué no comentar

No comentar código cuyo comportamiento ya es evidente por nombres y estructura:

```ts
// Obtener el colaborador
const colaborador = await getColaborador(id);
```

```ts
// Incrementar el contador
lineasAlistadas++;
```

No narrar el código línea por línea, repetir nombres de variables, describir operaciones
sintácticas ni justificar decisiones que se expresan mejor con nombres o estructura.

### No redeclarar lo que ya dicen el nombre y el tipo

El caso más común y más inútil: un comentario que repite en castellano lo que la firma ya
declara. Si el nombre dice que es una fecha y el tipo dice que es una fecha, el comentario
no puede limitarse a decir que es una fecha.

```ts
/** Fecha de creación de la orden. */
createdAt: string                          ← no aporta nada

/** Rango de fechas. */
dateFrom?: string                          ← no aporta nada

/** Se llama cuando se cierra el modal. */
onClose: () => void                        ← no aporta nada
```

El comentario se justifica sólo si agrega algo que la firma no puede expresar: formato,
unidad, zona horaria, qué significa el vacío o el nulo, quién lo produce, o un efecto que
no se deduce del nombre.

```ts
/** Marca de tiempo del servidor en ISO 8601 UTC; nunca del reloj de la terminal. */
iniciadoEn: string

/** Rango de fechas en formato YYYY-MM-DD; el backend lo interpreta en UTC. */
dateFrom?: string

/** Paradas de la orden, en orden de apertura. Vacío = la orden nunca se bloqueó. */
paradas: Parada[]
```

Vale también para separadores narrativos del tipo `// ---- Handlers ----` o
`// ---- Estado ----`: si la sección se distingue sola, el rótulo sobra.

"Obvio" no es un criterio de auditoría independiente. Si un comentario falla el test de la
sección 1, se elimina aunque alguien lo considere útil.

## 7. JSDoc y API pública

La documentación de APIs públicas es una excepción válida. Los módulos, clases, funciones,
tipos y métodos exportados pueden usar JSDoc cuando documentar su **contrato público**
ayude a sus consumidores.

Un resumen breve de una API pública es válido:

```ts
/**
 * Devuelve el perfil de la cuenta autenticada.
 */
export async function getProfile(): Promise<Profile> {
```

También son válidos: parámetros cuyo significado no sea evidente, valores de retorno
relevantes, errores o excepciones contractuales, precondiciones, efectos secundarios,
restricciones de uso y ejemplos cuando hagan falta para consumir bien la API.

El JSDoc no se convierte en narración de la implementación ni en changelog.

## 8. Idioma y estilo

**Todos los comentarios se escriben en español neutro. Sin excepciones de idioma.**
Un comentario en inglés se traduce, no se deja "porque ya estaba".

Neutro, no rioplatense: los comentarios los lee cualquiera. Nada de voseo ni de
regionalismos, aunque el resto de la documentación del proyecto sí use voseo.

| En vez de | Escribir |
|---|---|
| `fijate que`, `tenés que`, `podés` | `notar que`, `hay que`, `se puede` |
| `acá` | `aquí` |
| `nomás`, `pinta`, `laburo` | (no usarlos) |

Preferir la forma impersonal: "se pide el listado", "no se interpreta como…", en lugar de
dirigirse a alguien.

Lo único que sigue en inglés es lo que *no es prosa*: nombres de símbolos, rutas de
endpoint, códigos de error, claves de privilegio, directivas de herramientas
(`eslint-disable`, `@ts-expect-error`) y términos técnicos que no tienen traducción de uso
corriente en el equipo (`polling`, `fan-out`, `deep-link`, `hook`). Eso es terminología,
no idioma.

```ts
// Protected routes: verify session, then require the operator role    ← no
// Rutas protegidas: validar sesión y después exigir el rol de operario ← sí

// WHY server clock: terminal clocks drift in the warehouse             ← no
// El tiempo lo pone el servidor: el reloj de la terminal se desfasa    ← sí
```

Vale también para los prefijos de énfasis en inglés (`WHY:`, `NOTE:`, `HACK:`): el
comentario arranca con la información, no con una etiqueta.

**Cero emojis dentro de comentarios.** Ni decorativos ni de énfasis. Un comentario que
necesita un emoji para que se note es un comentario mal redactado. Si algo es crítico, se
dice con palabras y va primero.

```ts
// [emoji] Vista con datos MOCK: el ERP todavía no expone órdenes.   ← no
// Vista con datos MOCK: el ERP todavía no expone órdenes.           ← sí
```

Aplica sólo a comentarios. Los emojis en strings de UI, i18n o datos son otra cosa y no
los toca esta política.

Frases cortas, directas y concretas. Sin tono narrativo, corporativo ni artificial. Sin
relleno:

```ts
// Es importante notar que...
// Cabe aclarar que...
// Aquí se puede ver que...
```

El comentario arranca directamente con la información relevante.

## Relación con las invariantes del sistema

Las invariantes críticas de
[`../ingenieria/ARQUITECTURA.md`](../ingenieria/ARQUITECTURA.md) son el caso típico de
restricción que sí va dentro del código: determinan cómo debe comportarse y no se deducen
de la firma.

```ts
// El tiempo lo pone el servidor: el reloj de la terminal de bodega no es confiable.
```

```ts
// Solo las paradas no imputables descuentan de la Disponibilidad.
```

Se escribe la restricción en presente, nunca su origen ni el número de invariante.
