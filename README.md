# Simulación 3D: estación solar portátil para emergencias

**Verla:** <https://allocco14.github.io/estacion-solar-3d/>

Gemelo 3D del proyecto Solar (DSE 2026-2), hecho en la línea de [NexoRobot](https://github.com/Ojperdomoc/NexoRobot): una sola página (`index.html`) con three.js, sin compilar y sin servidor. La geometría sigue el diseño mecánico del proyecto (Fusion v4):

- **Seguidor de 2 ejes:** cruz de perfil 2020, mástil de 40 × 40, rodamiento tipo *lazy susan*, horquilla, panel de 440 × 350 mm y 4 LDR con divisor en X en el borde norte.
- **Caja de control** de 306 × 176 × 121 mm. Lleva la AGM 12 V 7 Ah, el controlador PWM, el fusible y una placa de acrílico con la **Raspberry Pi Zero 2 W**, que reemplaza a la LicheeRV Nano porque nunca llegó. Sobre la misma placa van el STM32 Blue Pill, el INA226, los 2 LM2596 y los 3 relés. En el frente hay un LCD 16×2, 3 interruptores y 2 USB-A.
- Lámpara LED de 12 V, celulares cargando y un **panel fijo de referencia virtual** (10° al sur) para medir la ganancia del seguidor.

Al hacer clic sobre una pieza aparece una ficha con su función y su valor en vivo. La tapa se puede volver transparente o quitar.

## Situaciones

| # | Situación | Qué se ve |
|---|---|---|
| 1 | Día soleado (08–16 h) | Seguidor vs. panel fijo. Ganancia de ~+17 % en el día; casi nula al mediodía porque en Bogotá el sol pasa cerca del cenit |
| 2 | Amanecer (05:20–07:00) | El seguidor amaneció mirando al oeste y vuelve al este con una rampa suave al detectar luz |
| 3 | Nubes pasajeras (50 %) | La corriente cae con cada nube; el filtro y la banda muerta evitan perseguir el ruido de las LDR |
| 4 | Noche de apagón | Lámpara hasta las 22:00 + 2 celulares: la batería pasa de 100 % a ~30 %, y el STM32 apaga la RPi |
| 5 | Batería baja | El relé 3 corta a 11,8 V, la RPi se apaga y el sistema reconecta a 12,4 V al día siguiente (~10 h) |
| 6 | Día de emergencia (24 h) | Uso típico con 6 cargas de celular y lámpara: el balance es negativo con la AGM de 7 Ah y el corte actúa |
| 7 | **Juego: la estación del barrio** | Tú eres el agente durante 24 h (ver abajo) |

Las teclas `1`–`7` cargan las situaciones, `espacio` pausa y `T` cambia la tapa. **Tapar el sol** pone una nube entre el sol y el panel; con un clic se aparta. El botón **Compartir** genera un enlace y un QR a la situación actual (`?escenario=soleado|amanecer|nubes|noche|bateria|emergencia|juego`).

## Juego: la estación del barrio

El juego empieza a las 06:00 con la batería al 35 % y dura 24 h, unos 2,4 min a 10 min/s. Durante ese tiempo:

- Los vecinos piden cargar el celular (9 pedidos de 1,5 h cada uno). Se aceptan o se rechazan, con un máximo de 2 a la vez por los 2 USB.
- De 18:00 a 22:00 el barrio necesita la lámpara.
- En el día llegan 3 nubes y se quedan tapando el panel hasta que alguien las aparta.
- El agente (la RPi) avisa si la energía alcanza para la noche antes de aceptar un celular.

| Acción | Puntos |
|---|---|
| Celular cargado al 80 % | +10 |
| Hora de lámpara entre 18 y 22 h | +10 |
| Nube apartada | +3 |
| Corte por bajo voltaje | −30 |
| Amanecer con SoC ≥ 40 % | +20 |

Corrimos partidas automáticas desde la consola con el modelo de arriba. Aceptar todo da ~77 puntos (6 celulares, pero hay un corte a las ~22 h). Rechazar todo da ~69, y seguir al agente da ~99 (5 celulares, sin corte). Si no se apartan las nubes, el corte llega aunque se siga al agente (~60).

## Realidad mixta (Meta Quest)

La página usa WebXR. Si el navegador soporta `immersive-ar` (Meta Quest Browser), aparece el botón **Entrar en MR**; si solo soporta `immersive-vr`, el botón dice **Entrar en VR**.

- La estación aparece **a escala real** sobre el piso, 1,7 m delante del usuario y con la caja mirando hacia él. En MR se oculta el suelo virtual y las sombras caen sobre el piso real.
- **Mover:** con *hit-test* aparece un anillo en el piso real; se aprieta el gatillo sobre él para poner la estación ahí. Sin *hit-test*, el botón Mover la vuelve a poner delante.
- **Controles o manos** (el pellizco cuenta como gatillo):
  - Tocar una pieza muestra su ficha en el tablero flotante.
  - LUZ y USB se conmutan en el frente de la caja.
  - El letrero junto a la caja acepta un celular.
- **Sol de mano:** la esfera amarilla está a 1 m del panel, en la dirección del sol. Si se agarra y se arrastra, el sol pasa a modo manual y el seguidor lo persigue con el error de sus 4 LDR. La simulación queda a 10× para que se vea la respuesta.
- **Nube:** se agarra y se mueve. Si queda en la línea panel–sol, la corriente cae (DNI −95 %). Un toque la aparta.
- **Tablero flotante:** muestra la hora, el SoC, el panel, el consumo, el estado del seguidor y el puntaje o la ficha de la pieza. Botones: Juego, Situación ▸, Sol (real/manual), Nube, Tapa, Pausa, Mover y Salir.

Del modo MR solo se probaron en escritorio la lógica, el raycast y el tablero. Antes de la sesión con las gafas hay que probarlo en una Quest real.

## Supuestos del modelo

Son aproximados: el modelo sirve para comparar casos, no para dimensionar. Están también en el botón **Ayuda** de la página.

- **Sol:** latitud 4,6° N, 22 de octubre, hora solar. Cielo despejado con el modelo de masa de aire de Meinel. Las nubes quitan hasta el 95 % del haz directo y aumentan la difusa.
- **Panel:** 20 W, Isc ≈ 1,2 A. Con el controlador PWM entrega I ≈ Isc·G/1000 al voltaje de la batería.
- **Seguidor:** error diferencial de las LDR, filtro τ ≈ 20 s, banda muerta ≈ 2°, rampa de 3°/s. Azimut de este a oeste por el sur, inclinación ±60°. Sin luz útil queda quieto.
- **Batería AGM 7 Ah:** voltaje en reposo ≈ 11,5 V + 1,2 V·SoC, R interna de 40 mΩ, eficiencia de carga del 90 %. El controlador reduce la corriente sobre el 92 %.
- **Cargas:**
  - Lámpara de 5 W.
  - USB QC de 10 W por celular (batería de 15 Wh) con convertidor al 88 %.
  - Lógica en el LM2596 al 85 %: STM32 0,1 W, LCD 0,15 W y relés de 0,36 W.
  - Servos: 3 W cada uno mientras se mueven.
  - RPi Zero 2 W: 0,6 W en reposo y 2,5 W trabajando. El STM32 la enciende con más de 3 W de excedente promediado o con SoC > 70 %, y la apaga sin excedente cuando el SoC baja del 50 %.
- **LVD (relé 3):** abre si V < 11,8 V durante 10 s y cierra cuando el voltaje en reposo estimado (V − I·R) llega a 12,4 V.

## Verla localmente

Hay que servirla por HTTP, porque el `importmap` no funciona abriendo el archivo directamente. Necesita conexión a internet para three.js (cdn.jsdelivr.net) y para el QR.

```sh
cd simulacion
python -m http.server 8080
```

Después se abre <http://localhost:8080/>. Desde la consola del navegador, `solar.S` muestra el estado del modelo y `solar.G` el del juego. WebXR necesita HTTPS (o `localhost`), así que en la Quest conviene usar la versión publicada.

## Publicación

La fuente está en `simulacion/` del repositorio del curso, que es privado. El sitio
sale del repositorio público
[Allocco14/estacion-solar-3d](https://github.com/Allocco14/estacion-solar-3d), que
tiene esta carpeta como raíz. Para actualizarlo, desde la raíz del repo del curso
y después de hacer commit:

```sh
git subtree push --prefix simulacion https://github.com/Allocco14/estacion-solar-3d.git main
```

Cada push a `main` del repo público lo publica en GitHub Pages
([`.github/workflows/pages.yml`](.github/workflows/pages.yml)).
