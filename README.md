# Panel de vida

Dashboard personal en una sola página (HTML, CSS y JavaScript nativo, sin frameworks) con modo oscuro estricto.
Se instala como app en el móvil y en el ordenador, y se sincroniza entre los dos con tu cuenta de Google.

**Web:** https://deliio.github.io/panel-de-vida/

## Módulos
- **Resumen matutino**: saludo dinámico, tareas pendientes, eventos de hoy, entrenamiento del día, resumen de tus correos de Gmail, paso actual de la hoja de ruta y recordatorio.
- **Hoja de ruta · Futuro**: plan de carrera por fases (3º ADE → PL-300 → Altia → salto global) con pasos marcables.
- **Hub universitario & proyectos**: Kanban (Pendiente / En proceso / Hecho) con arrastrar y soltar y etiquetas de color.
- **Salud & deporte**: rutina de gimnasio semanal editable, running con Strava (ritmo objetivo 5:45–6:00 /km) y registro diario de dolor de rodillas con plan progresivo de vuelta a correr.
- **Calendario de entrenos**: mes a mes, qué tocaba y qué hiciste (gimnasio, running, bici).
- **Nutrición & calorías**: diario de comidas (alimentos comunes + búsqueda en Open Food Facts) y objetivo de calorías con déficit según tus datos.
- **Agenda & viajes**: tus próximos eventos de Google Calendar y cuenta atrás para el viaje a Milán.
- **Herramientas conectadas**: accesos a Finanzas, Moovi, Gmail, Excel, Fabric, Power BI y Google Calendar.

## Instalar como app
- **Android (Chrome):** abre la web → menú ⋮ → *Instalar aplicación*.
- **iPhone (Safari):** abre la web → Compartir → *Añadir a pantalla de inicio*.
- **Ordenador (Chrome/Edge):** icono de instalar en la barra de direcciones.

## Conectar Google (Calendar + sincronización)
Pulsa **Conectar Google** en el panel. Se pide permiso para:
- *Ver tus calendarios* (solo lectura).
- *Guardar los datos del panel en una carpeta oculta de tu Drive* (`appDataFolder`), para que móvil y ordenador muestren lo mismo.
- *Ver los metadatos de tus correos* (remitente, asunto y fragmento de los no leídos; nunca el cuerpo).

No hay servidor: los datos van directamente de tu navegador a tu Google Drive.

### Crear el Client ID (una sola vez)
1. Entra en https://console.cloud.google.com y crea un proyecto (p. ej. "Panel de vida").
2. *APIs y servicios → Biblioteca*: habilita **Google Calendar API**, **Google Drive API** y **Gmail API**.
3. *Google Auth Platform* (pantalla de consentimiento): tipo **Externo**, nombre de la app y tu email.
   En *Público → Usuarios de prueba*, añade tu Gmail.
4. *Clientes → Crear cliente*: tipo **Aplicación web**. En *Orígenes de JavaScript autorizados* añade
   `https://deliio.github.io` y `http://localhost:5173`.
5. Copia el **ID de cliente** y pégalo en `CONFIG.googleClientId` (al principio de `app.js`).

## Conectar Strava
Strava obliga a guardar una clave secreta que no puede ir en una web pública, así que el panel usa un pequeño
"puente" gratuito en tu Google Apps Script: [`bridge/strava-bridge.gs`](bridge/strava-bridge.gs). No contiene secretos.

1. **App de Strava:** en https://www.strava.com/settings/api crea una aplicación
   (nombre "Panel de vida", web `https://deliio.github.io/panel-de-vida/`,
   *Authorization Callback Domain*: `script.google.com`). Anota el **Client ID** y el **Client Secret**.
2. **Proyecto de Apps Script:** en https://script.google.com crea un proyecto nuevo ("Puente Strava"),
   borra el código de ejemplo y pega el contenido de `bridge/strava-bridge.gs`.
3. **Secretos:** *Configuración del proyecto → Propiedades del script*: añade `STRAVA_CLIENT_ID` y `STRAVA_CLIENT_SECRET`.
4. **Clave del panel:** elige la función `setup` y pulsa *Ejecutar* (Google te pedirá permiso la primera vez).
   Copia la clave que aparece en el registro.
5. **Publicar:** *Implementar → Nueva implementación → Aplicación web*, ejecutar como **Yo**, acceso **Cualquier usuario**.
   Copia la URL que acaba en `/exec`.
6. **Autorizar:** abre esa URL, pulsa *Conectar con Strava* y acepta.
7. **En el panel:** Running → *Conectar Strava* → pega la URL y la clave.

La clave del panel se guarda en tu Drive privado (sincronizada entre dispositivos), nunca en este repositorio.

## Personalizar
Edita `CONFIG` al principio de `app.js` (nombre, fechas del viaje, enlace de Finanzas) y `HEALTH` al principio de
`health.js` (plan de vuelta a correr, ritmo objetivo). La rutina semanal y tus datos de calorías se editan desde el propio panel.
Busca `🔌 API` para ver dónde se conectan los servicios externos.
