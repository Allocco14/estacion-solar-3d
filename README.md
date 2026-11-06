# Estación solar portátil para emergencias

**Sitio:** <https://allocco14.github.io/estacion-solar-3d/>

Página del proyecto Solar del curso Diseño de Sistemas Electrónicos (DSE 2026-2, Universidad Nacional de Colombia). Es HTML estático, sin compilar.

| Ruta | Qué es |
|---|---|
| [`index.html`](index.html) | Portada de producto de **Solar**: hero con el render 3D ([`producto3d.js`](producto3d.js), three.js; `?modo=noche` abre de noche), características, ficha técnica y preguntas. Estilo en [`producto.css`](producto.css) |
| [`proyecto/`](proyecto/) | Página del curso: el equipo, la arquitectura (diagramas) y el avance |
| [`requerimientos/`](requerimientos/) | Diagramas de bloques (hardware y flujo de información, del artifact del equipo), solicitudes, requerimientos, restricciones, atributos de calidad e historias de usuario (clase 19). Se imprime a PDF |
| [`simulacion/`](simulacion/) | Simulación 3D (three.js + WebXR). Ver su [README](simulacion/README.md) |
| [`estilo.css`](estilo.css) | Estilo de `proyecto/` y `requerimientos/`, oscuro por defecto y claro con el botón Tema; al imprimir siempre claro |

## Actualizar

- **Kanban:** está en Kanbanchi, enlazado desde la página de requerimientos.
- **Roles del equipo:** en `proyecto/index.html`, sección `#equipo` (atributo `data-rol`; vacío no se muestra).
- **Datos de la portada:** salen del documento de requerimientos; si cambian ahí, se cambian en `index.html` (cifras, ficha técnica, preguntas).

## Verlo localmente

```sh
cd sitio
python -m http.server 8080
```

Y se abre <http://localhost:8080/>. `proyecto/` y los requerimientos también abren directo desde el archivo. La portada (render 3D) y la simulación necesitan HTTP.

## Publicación

La fuente está en `sitio/` del repo del curso, que es privado. Se publica en el repo público [Allocco14/estacion-solar-3d](https://github.com/Allocco14/estacion-solar-3d), con esta carpeta como raíz. Desde la raíz del repo del curso, después de hacer commit:

```sh
sh scripts/publicar-sitio.sh
```

Cada push a `main` del repo público lo publica en GitHub Pages ([`.github/workflows/pages.yml`](.github/workflows/pages.yml)).
