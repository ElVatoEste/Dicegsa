# Dicegsa — Branding

## Nombre y dominio
La aplicación se presenta como **Dicegsa · Almacén CDF**. Dominio _(pendiente)_: se publica
en una URL con HTTPS ([D-023](POR-ACLARAR.md)).

## Identidad visual
- **Tipografía:** Barlow para el texto, del linaje de la señalética vial: se lee rápido y de
  lejos, que es como se mira una pantalla en el almacén. IBM Plex Mono para cifras, códigos de
  pedido y PKL, y cronómetros, para que no cambien de ancho al actualizarse.
- **Color / tokens:** toda la escala de marca sale de **#a1dcff** (`brand-300`, rgb 161, 220,
  255). Los tonos claros son superficies y realces; los oscuros, texto, acción y navegación
  (`brand-950` #08243a en la barra lateral, `brand-700` #115d8f en los botones principales).
  El **rojo** queda reservado para la pronta entrega y los errores, así no compite con nada.
  Los tokens viven en [`frontend/src/app/globals.css`](../../frontend/src/app/globals.css).
- **Logo:** _(pendiente)_. El isotipo actual es una espiral cuadrada provisoria; se reemplaza
  por el SVG oficial cuando llegue.

## Movimiento
Animaciones cortas y con propósito: presión en los botones, paneles laterales que entran desde
el borde, entrada escalonada de las listas y un pulso en lo que vence pronto. Todo en CSS, por
debajo de 300 ms en la interfaz, y se reduce con `prefers-reduced-motion`. Nada anima en lo que
se repite cientos de veces por turno.
