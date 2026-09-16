# Dicegsa — Arquitectura

## Modelo de dominio

| Entidad | Qué es | Notas |
|---|---|---|
| `Cuenta` | Credencial de acceso: nombre de cuenta, hash de contraseña, rol, estado. | Sin correo. Creada y reseteada solo por administrador. |
| `Colaborador` | Persona que opera en CDF. | Ligado a una `Cuenta` y a un `RolOperativo`. |
| `RolOperativo` | Alistador o valeador. | Roles distintos, con salario y estándar distintos. El costo de un error depende del rol. |
| `EventoAdmin` | Alta, reseteo, cambio de rol o baja, con autor y fecha. | Rastro de auditoría del poder administrativo. |
| `Turno` | Ventana de trabajo de un colaborador. | Define el denominador de tiempo de la Disponibilidad. |
| `Orden` | Pedido de alisto ingestado desde el ERP, identificado por su **código de PKL**. | En el piso se la nombra por ese código. Tiene tipo, nivel de complejidad y **ventana de entrega** propia. |
| `VentanaEntrega` | Compromiso de entrega heredado del cliente. | Va de 24 horas a 10-15 minutos. Define la urgencia relativa y dispara las alertas. **Sin modelar todavía:** falta saber si es un lapso o un punto fijo en el tiempo — [P-018](../decisiones/POR-ACLARAR.md). |
| `Linea` | Ítem de una orden: SKU, lote, cantidad. | Unidad de conteo del Desempeño: el estándar vigente son 15 líneas/hora. |
| `EstadoKanban` | Columna del tablero y sus transiciones. | Cada transición es un evento con marca de tiempo. |
| `Parada` | Bloqueo con inicio, fin y causa. | Clasificada imputable / no imputable — esta bandera es la que decide si descuenta. |
| `CausaParada` | Catálogo tipificado de causas. | Quiebre de stock, caída de ERP, espera de regencia, etc. |
| `ErrorDespacho` | Hallazgo de auditoría sobre una línea. | Tipificado por causa de origen: SKU, lote, cantidad. |
| `Estandar` | Rendimiento esperado por rol y tipo de orden. | Línea base vigente: 15 líneas/hora por alistador, plana. La ponderación por complejidad la agrega el proyecto. |
| `CalculoOLE` | D, P, Q y el compuesto para un colaborador y período. | Derivado, reproducible desde los eventos. |

`CalculoOLE` no es una entidad de captura: es una proyección. Si se recalcula desde los eventos, debe dar lo mismo.

## Flujos

**Alisto de una orden**
1. La orden se ingesta del ERP y "cae" al tablero con su código de PKL; desde ese momento corre su ventana de entrega.
2. El supervisor la asigna a un colaborador y turno.
3. El operario la toma: transición de estado → arranca el cronómetro del servidor.
4. Si se traba, registra la parada en un toque eligiendo causa del catálogo → el cronómetro de trabajo efectivo se detiene.
5. Al destrabarse, cierra la parada → el cronómetro reanuda.
6. Cierra la orden: se congelan tiempo bruto, tiempo bloqueado por causa, y líneas alistadas.

**Auditoría de despacho**
Auditoría revisa el despacho y registra los `ErrorDespacho` encontrados contra las líneas. Alimenta Q, no descuenta tiempo.

**Cálculo de OLE**
Cerrado el turno, el motor recorre los eventos: D desde turno menos paradas no imputables, P desde líneas ponderadas contra `Estandar`, Q desde auditorías. Resultado persistido con enlace a los eventos que lo componen.

**Alerta de vencimiento**
Cada orden lleva su ventana de entrega. El tablero ordena por tiempo restante relativo a esa ventana, no por antigüedad, y avisa cuando una orden se acerca a vencer. Una orden de 15 minutos recién ingresada es más urgente que una de 24 horas que lleva medio turno.

**Tiempo real**
Toda transición de estado y toda parada se emiten por WebSocket a las conexiones suscritas. El tablero de supervisión no hace polling.

El transporte es Socket.io sobre el mismo servidor HTTP de Fastify. La conexión se autentica con el JWT en el handshake y se rechaza si el token no verifica o si la contraseña sigue siendo la de un solo uso. Cada conexión entra a las salas que le corresponden por rol:

| Sala | Contenido | Quién |
|---|---|---|
| `tablero` | Transiciones del Kanban y paradas. | supervisor, gerencia, admin |
| `cuentas` | Altas, reseteos, cambios de rol y bajas. | admin |

El operario no se suscribe al tablero completo: recibe sus propias órdenes por petición, porque suscribirlo a todo le filtraría el desempeño de sus compañeros.

El reparto es en proceso. Una segunda instancia de API necesita el adaptador de Redis, porque cada proceso solo conoce sus propias conexiones — ver [D-006](../decisiones/POR-ACLARAR.md).

## Stack
Plataforma web reactiva, desacoplada y de alta concurrencia.

- **Runtime:** Bun. Ejecuta el backend y es el gestor de paquetes y el runner de tests.
- **Backend:** NestJS + TypeScript sobre adaptador **Fastify** (`@nestjs/platform-fastify`). Módulos por dominio con DI nativa, entrypoint en `src/main.ts`.
- **Persistencia:** PostgreSQL con **Drizzle ORM** (`drizzle-orm` + `drizzle-kit`). Esquema en TypeScript como fuente de verdad, migraciones generadas y versionadas.
- **Tiempo real:** WebSockets vía gateway de Nest sobre Fastify, para emisión de eventos instantáneos (tablero Kanban, cronometraje con latencia de ms).
- **Caché y fan-out:** Redis, **si aplica** — ver [D-006](../decisiones/POR-ACLARAR.md). Con una sola instancia de backend los eventos se reparten en proceso; Redis entra cuando haya más de una instancia o caché que lo justifique.
- **Auth:** nombre de cuenta + contraseña, JWT, guards por rol. Cuentas entregadas y recuperadas por administrador — ver abajo.
- **Frontend:** Next.js + TypeScript en modo **SPA** (`output: 'export'`, client-side rendering). Build estático servido por nginx. El cliente del operario es el **handheld** de bodega: pantalla chica, uso de pie, una mano ocupada. Interfaces táctiles y de baja carga cognitiva. Iconos `lucide-react`, estilos TailwindCSS.
- **Infra:** VPS Linux de bajo consumo, acceso desde el navegador del handheld en red local institucional. nginx sirve el estático del frontend y hace reverse proxy al API. Stack open source, sin licenciamiento privativo.

### Autenticación y ciclo de vida de cuentas ([D-005](../decisiones/POR-ACLARAR.md))
El operario de bodega no tiene correo corporativo. El correo no sirve ni como identificador ni como canal de recuperación, así que el modelo es cerrado y administrado:

- **Identificador:** nombre de cuenta, no correo. Único, sin distinción de mayúsculas.
- **Alta:** no hay auto-registro. El administrador crea la cuenta y entrega la credencial inicial.
- **Primer ingreso:** la contraseña entregada es de un solo uso — el sistema obliga a cambiarla antes de dar acceso a nada más.
- **Contraseña inicial:** la genera el sistema, aleatoria. Largo mínimo 8, sin reglas de composición: una política de escritorio en un handheld termina en un papel pegado al equipo.
- **Recuperación:** no hay "olvidé mi contraseña" por correo, porque no hay correo. El administrador resetea y vuelve a entregar, y el ciclo de primer ingreso se repite.
- **Rastro:** toda alta, reseteo, cambio de rol y baja queda registrada con quién la hizo y cuándo. Si el admin puede tomar la identidad de cualquiera, el registro es lo único que lo hace auditable.
- **Baja:** las cuentas se desactivan, no se borran — sus eventos de alisto y sus cálculos de OLE tienen que seguir siendo trazables.

### Frontend SPA — decisión ([D-002](../decisiones/POR-ACLARAR.md))
App detrás de login (sin SEO), con datos en tiempo real por WebSocket. SSR no aporta: renderizaría estado viejo y rehidrataría. Se opta por SPA:

- **Render:** client-side. Next `output: 'export'` → HTML/JS/CSS estáticos.
- **Datos:** todo contra el API Nest (REST + WebSocket). Auth por JWT; sin route handlers ni middleware de Next.
- **Deploy:** archivos estáticos tras nginx. El VPS corre un solo proceso (el API en Bun); el frontend no suma un segundo.
- **Migración futura:** si aparece un portal público con SEO/SSR, se pasa a Next con server Node reusando el mismo código.

## Invariantes críticas
1. **Cero escrituras al ERP.** La plataforma lee órdenes y nunca toca la base transaccional corporativa (S-3.2).
2. **El handheld bloquea y reintenta ante corte de red.** Sin cola local: una cola local vuelve a meter el reloj del equipo en el cronometraje.
3. **El tiempo lo pone el servidor.** Las marcas de tiempo nunca vienen del reloj del handheld: relojes desajustados en bodega falsean el cronometraje.
4. **Toda parada tiene causa del catálogo.** No existe parada sin tipificar; sin causa no se puede decidir si descuenta.
5. **Solo las paradas no imputables descuentan de la Disponibilidad.** Es la invariante que sostiene toda la tesis de equidad.
6. **`OLE` es derivable.** Recalcular desde los eventos debe reproducir el valor almacenado; si no, el desglose auditable (REQ-013) es mentira.
7. **Los tres factores están acotados a [0, 1].** Un factor fuera de rango es un bug del modelo, no un desempeño excepcional.
8. **Un error de calidad nunca descuenta tiempo.** Entra por Q, por causa de origen, nunca como deducción al tiempo total (S-2.2).
9. **La contraseña solo se guarda hasheada.** Argon2id o bcrypt. Que el admin la entregue en mano no la vuelve un dato en claro.
10. **Toda acción administrativa sobre cuentas deja rastro.** Es la contrapartida de que el admin pueda resetear a cualquiera.
11. **Una cuenta nunca se borra.** Se desactiva, para no romper la trazabilidad de los eventos que produjo.
