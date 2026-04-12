# My Journal

English version: [README.md](README.md)

My Journal es una aplicacion de escritorio para escribir, organizar y proteger un diario personal desde una experiencia local, privada y centrada en la escritura. El proyecto usa Tauri v2 para empaquetar la app, React 19 para la interfaz y un sidecar en Bun para gestionar SQLite y los flujos de dominio.

La aplicacion ya no es un ejemplo generico de TODOs. El producto real gira alrededor de diarios, entradas por fecha, privacidad, personalizacion visual y una arquitectura preparada para evolucionar hacia cifrado real, importacion/exportacion e integridad de archivos.

## Que ofrece My Journal

- Varios diarios, con un unico diario activo a la vez.
- Navegacion por calendario para escribir o revisar entradas de cualquier dia.
- Editor enriquecido con Tiptap para texto con formato, listas, tareas, enlaces, imagenes, tablas, bloques de codigo y resaltado.
- Diarios publicos y privados, con pantalla de desbloqueo para los privados.
- Persistencia local: los metadatos se indexan en SQLite y el contenido de cada entrada se guarda en archivos `.myj`.
- Interfaz bilingue en espanol e ingles.
- Sistema de temas con modo claro, oscuro o del sistema, mas presets visuales.
- Ajuste del primer dia de la semana en el calendario.

## Experiencia de uso

La app arranca mostrando el ultimo diario abierto o, si todavia no existe ninguno, una pantalla de bienvenida para crear el primero. Desde ahi puedes:

1. Crear un diario publico o privado.
2. Elegir un dia desde la barra lateral izquierda.
3. Escribir una entrada con formato enriquecido en la zona central.
4. Guardar, editar o eliminar la entrada de esa fecha.
5. Cambiar idioma, tema y preferencias visuales desde la configuracion.

La interfaz actual ya incluye una barra lateral con calendario, listado de diarios, menu superior de aplicacion, pantalla de desbloqueo para diarios privados y un editor listo para escritura diaria.

## Estado actual del proyecto

My Journal esta en una fase funcional temprana: la base del producto ya existe y se puede usar para crear diarios, escribir entradas y gestionarlas por fecha, pero parte de la hoja de ruta todavia esta pendiente.

### Implementado hoy

- Flujo de bienvenida y apertura del ultimo diario usado.
- Creacion de diarios con nombre, descripcion, privacidad y regla de titulo obligatorio.
- Bloqueo y desbloqueo de diarios privados dentro de la sesion actual.
- Guardado de entradas por fecha en archivos `.myj`.
- Indice SQLite para diarios, entradas, configuraciones y base para etiquetas.
- Hash SHA-256 del contenido de cada entrada como apoyo a futuras validaciones de integridad.
- Temas predefinidos, selector de idioma y ajuste del calendario.

### Pendiente o en evolucion segun la hoja de ruta

- Cifrado definitivo de diarios privados y de archivos `.myj`.
- Hash seguro de contrasenas y rotacion de contrasena sin riesgo para el contenido.
- Importacion y exportacion en `.zip` con comprobaciones de integridad.
- Flujo completo de etiquetas y organizacion avanzada.
- Comparticion de diarios y otras funciones de privacidad mas avanzadas.

### Nota importante sobre privacidad

La base del flujo privado ya esta implementada, pero el cifrado final descrito en [MY_JOURNAL_ROADMAP.md](MY_JOURNAL_ROADMAP.md) aun no esta completo. A dia de hoy, el proyecto ofrece control de acceso y bloqueo a nivel de aplicacion, no el modelo criptografico final previsto en la hoja de ruta.

## Como se guardan los datos

My Journal separa el contenido del indice para mantener la app ligera y preparada para crecer:

- SQLite guarda metadatos de diarios, entradas y configuraciones globales.
- Cada entrada se almacena como archivo `.myj` dentro del directorio del diario.
- La base de datos mantiene la fecha, el titulo, la ruta relativa del archivo y un hash del contenido.

En terminos practicos, el objetivo es que SQLite funcione como indice y que los textos reales vivan en archivos del usuario, alineado con la arquitectura definida en la hoja de ruta.

## Arquitectura

```text
React UI
  -> hooks y servicios tipados
  -> SidecarService (@tauri-apps/plugin-shell)
  -> JSON Lines sobre stdin/stdout
  -> sidecar Bun compilado
  -> SQLite para indices y metadatos
  -> archivos .myj para el contenido de las entradas

Tauri (Rust)
  -> empaquetado de escritorio
  -> plugins nativos (shell, store, os, opener)
```

### Responsabilidades por capa

| Capa | Responsabilidad principal |
|---|---|
| `src/` | Interfaz, hooks, i18n, temas y servicios del frontend |
| `sidecar/` | Persistencia, router IPC, SQLite, archivos de diario y logica del dominio |
| `src-tauri/` | Host nativo de Tauri, plugins y empaquetado de la app |

## Estructura del repositorio

```text
my-journal/
|- src/                    Frontend React y componentes del producto
|- sidecar/                Sidecar Bun con SQLite, handlers y tipos IPC
|- src-tauri/              Host Rust de Tauri y configuracion de escritorio
|- sidecar-drizzle/        Migraciones SQL generadas
|- scripts/                Scripts de build del sidecar
|- public/                 Recursos estaticos
|- MY_JOURNAL_ROADMAP.md   Vision funcional y direccion del producto
```

## Stack tecnologico

| Capa | Tecnologia |
|---|---|
| UI | React 19 + TypeScript + Vite 7 |
| Editor | Tiptap |
| Desktop host | Tauri v2 |
| Persistencia | SQLite via sidecar Bun |
| ORM | Drizzle ORM (`bun:sqlite`) |
| IPC | JSON Lines sobre stdin/stdout |
| Internacionalizacion | i18next |
| Temas | next-themes + presets JSON |
| Calidad | ESLint 9 + Prettier + TypeScript |

## Requisitos previos

- Node.js 18 o superior.
- Rust y cargo.
- Bun 1.2 o superior para compilar el sidecar.
- Dependencias del ecosistema Tauri para tu sistema operativo.

En Windows puedes instalar Bun con:

```powershell
powershell -ExecutionPolicy ByPass -c "irm bun.sh/install.ps1 | iex"
```

## Comandos principales

```bash
# Instalar dependencias
npm install

# Levantar solo la interfaz web de desarrollo
npm run dev

# Compilar el sidecar manualmente
npm run build:sidecar

# Ejecutar la app de escritorio completa en desarrollo
npm run tauri:dev

# Type-check del frontend
npx tsc --noEmit

# Lint
npm run lint

# Comprobar formato
npm run format:check

# Build de produccion de la app de escritorio
npm run tauri build
```

## Metodos IPC principales

El frontend habla con el sidecar mediante peticiones JSON Lines. Estos son los metodos mas relevantes del dominio actual:

| Metodo | Descripcion |
|---|---|
| `app.bootstrap` | Carga diarios disponibles y el ultimo diario usado |
| `journal.list` | Lista todos los diarios |
| `journal.create` | Crea un diario nuevo |
| `journal.open` | Abre el diario activo |
| `journal.unlock` | Desbloquea un diario privado |
| `journal.lock` | Bloquea un diario privado en la sesion |
| `entry.getByDate` | Obtiene la entrada de una fecha concreta |
| `entry.save` | Guarda o actualiza una entrada |
| `entry.delete` | Elimina una entrada |
| `entry.listMonth` | Marca en el calendario los dias con entrada |

## Direccion del producto

La referencia funcional del proyecto esta en [MY_JOURNAL_ROADMAP.md](MY_JOURNAL_ROADMAP.md). Si encuentras codigo heredado del ejemplo de TODOs, interpretalo como scaffolding de transicion y no como el destino del producto. La direccion real de My Journal es:

- diario personal primero, no una app de tareas;
- contenido de entradas en archivos, no grandes blobs en SQLite;
- privacidad fuerte para diarios privados;
- importacion, exportacion y validacion de integridad;
- una experiencia de escritorio pensada para escribir con calma y continuidad.

## Desarrollo

Si vas a extender la app, estas son las rutas mas importantes:

- `src/hooks/useJournal.ts`: orquestacion principal del estado de la aplicacion.
- `src/services/journalApi.ts`: API tipada del frontend hacia el sidecar.
- `sidecar/handlers/journals.ts`: operaciones de diarios y bootstrap.
- `sidecar/handlers/entries.ts`: guardado de entradas y lectura de archivos `.myj`.
- `sidecar/db/schema.ts`: esquema SQLite del dominio.

El proyecto todavia conserva el modulo de TODOs heredado por seguridad de migracion, pero no deberia guiar nuevas decisiones de producto.