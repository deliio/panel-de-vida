# Panel de vida

Dashboard personal en una sola página (HTML, CSS y JavaScript nativo, sin frameworks) con modo oscuro estricto.
Se instala como app en el móvil y en el ordenador, y se sincroniza entre los dos con tu cuenta de Google.

**Web:** https://deliio.github.io/panel-de-vida/

## Módulos
- **Resumen matutino**: saludo dinámico, tareas pendientes, eventos de hoy, entrenamiento del día, resumen de tus correos de Gmail, paso actual de la hoja de ruta y recordatorio.
- **Hoja de ruta · Futuro**: plan de carrera por fases (3º ADE → PL-300 → Altia → salto global) con pasos marcables.
- **Hub universitario & proyectos**: Kanban (Pendiente / En proceso / Hecho) con arrastrar y soltar y etiquetas de color.
- **Salud & deporte**: rutinas de fuerza (tren superior / piernas), running (objetivo < 6:10 /km) y tracker de proteína.
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

## Personalizar
Edita `CONFIG` al principio de `app.js` (nombre, fechas del viaje, objetivos, plan semanal, enlace de Finanzas).
Busca `🔌 API` para ver dónde se conectan los servicios externos.
