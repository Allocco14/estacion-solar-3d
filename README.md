# Estación solar portátil para emergencias

**Sitio:** <https://allocco14.github.io/estacion-solar-3d/>

Página del proyecto Solar del curso Diseño de Sistemas Electrónicos (DSE 2026-2, Universidad Nacional de Colombia). Es HTML estático, sin compilar.

| Ruta | Qué es |
|---|---|
| [`index.html`](index.html) | Portada: el proyecto, el equipo, la arquitectura, el avance |
| [`requerimientos/`](requerimientos/) | Diagramas de bloques (hardware y flujo de información, del artifact del equipo), solicitudes, requerimientos, restricciones, atributos de calidad e historias de usuario (clase 19). Se imprime a PDF |
| [`simulacion/`](simulacion/) | Simulación 3D (three.js + WebXR). Ver su [README](simulacion/README.md) |
| [`estilo.css`](estilo.css) | Estilo compartido, con modo claro y oscuro |

## Actualizar

- **Kanban:** está en Kanbanchi, enlazado desde la página de requerimientos.
- **Roles del equipo:** en `index.html`, sección `#equipo`.

## Verlo localmente

```sh
cd sitio
python -m http.server 8080
```

Y se abre <http://localhost:8080/>. La portada y los requerimientos también abren directo desde el archivo. La simulación necesita HTTP.

## Publicación

La fuente está en `sitio/` del repo del curso, que es privado. Se publica en el repo público [Allocco14/estacion-solar-3d](https://github.com/Allocco14/estacion-solar-3d), con esta carpeta como raíz. Desde la raíz del repo del curso, después de hacer commit:

```sh
sh scripts/publicar-sitio.sh
```

Cada push a `main` del repo público lo publica en GitHub Pages ([`.github/workflows/pages.yml`](.github/workflows/pages.yml)).
