'use strict';
/* =========================================================
   PANEL DE VIDA · app.js
   Funciona 100% con datos simulados + localStorage.
   Busca los comentarios "🔌 API" para saber dónde conectar
   tus servicios reales (Google Calendar, Gmail, Strava...).
   ========================================================= */

/* ---------------------------------------------------------
   CONFIGURACIÓN PERSONAL · edita aquí tus datos
   --------------------------------------------------------- */
const CONFIG = {
  userName: 'Delio',

  /* 🔌 API · GOOGLE (Calendar + sincronización móvil/ordenador)
     Pega aquí el "ID de cliente" OAuth de tu proyecto de Google Cloud
     (termina en .apps.googleusercontent.com). No es secreto: puede ir en el código.
     Los pasos para crearlo están en el README. */
  googleClientId: '37836378505-0nuu9bd8t377qfh4eh4p23paacsth9gp.apps.googleusercontent.com',

  financeUrl: 'https://deliio.github.io/finanzas/',

  // Viaje a Milán (cambia las fechas por las de tu billete)
  milanTrip: {
    start: new Date('2026-12-04T07:00:00'),
    end: new Date('2026-12-08T22:00:00'),
    booked: new Date('2026-09-15T00:00:00'), // cuándo lo reservaste (para la barra de progreso)
    detail: 'Vuelo a Milán Malpensa (MXP) · 4 noches',
  },

  // Salud y deporte: plan de rodillas, ritmo y rutina están en health.js

  // Categorías con su color por defecto (editables desde el botón "Colores")
  categories: {
    uni:      { label: 'Universidad', color: '#7f9cf5' },
    proyecto: { label: 'Proyecto',    color: '#63cfa5' },
    personal: { label: 'Personal',    color: '#e0b46e' },
    urgente:  { label: 'Urgente',     color: '#ee7f8d' },
    examen:   { label: 'Examen',      color: '#f4a261' },
    salud:    { label: 'Salud',       color: '#b29cf7' },
    viaje:    { label: 'Viaje',       color: '#6ec7dd' },
    finanzas: { label: 'Finanzas',    color: '#d99ac4' },
  },

  reminders: [
    'Bebe agua: objetivo 2,5 L hoy.',
    'Revisa Moovi por si hay avisos nuevos.',
    'Prepara la mochila del gimnasio la noche anterior.',
    'Bloquea 90 min de foco sin móvil.',
  ],
};

/* ---------------------------------------------------------
   UTILIDADES
   --------------------------------------------------------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const uid = () => Math.random().toString(36).slice(2, 10);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const joinEs = (arr) => (arr.length < 2 ? arr.join('') : `${arr.slice(0, -1).join(', ')} y ${arr.at(-1)}`);

const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = (k) => new Date(`${k}T00:00:00`);
const addDays = (n, base = new Date()) => { const d = new Date(base); d.setDate(d.getDate() + n); return d; };
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const daysUntil = (d) => Math.round((startOfDay(d) - startOfDay(new Date())) / 86400000);
const mondayOf = (d = new Date()) => startOfDay(addDays(-((d.getDay() + 6) % 7), d));
const fmtRel = (d) => {
  const n = daysUntil(d);
  if (n === 0) return 'Hoy';
  if (n === 1) return 'Mañana';
  if (n < 0) return `Venció hace ${-n} d`;
  return `En ${n} días`;
};
const fmtHour = (d) => d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
const fmtPace = (sec) => { const s = Math.round(sec); return `${Math.floor(s / 60)}:${pad(s % 60)}`; };
const parseTime = (str) => { // "mm:ss" o "h:mm:ss" -> segundos
  const p = str.split(':').map(Number);
  return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1];
};

// localStorage con try/catch (modo privado, almacenamiento bloqueado...)
const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(`lifedash:${key}`); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(`lifedash:${key}`, JSON.stringify(value)); } catch { /* sin persistencia */ }
    window.GoogleSync?.markDirty(); // sube el cambio a Google Drive si estás conectado
  },
};

const catLabel = (cat) => CONFIG.categories[cat]?.label ?? cat;
const tagHTML = (cat, text = catLabel(cat)) => `<span class="tag" style="--c:var(--c-${cat})">${esc(text)}</span>`;

/* ---------------------------------------------------------
   DATOS SIMULADOS
   --------------------------------------------------------- */

/* 🔌 API · GMAIL (ya conectado en google.js)
   Mientras no conectes Google se muestran estos correos de ejemplo.
   Al conectar, GoogleSync.loadGmail() trae tus no leídos de la bandeja de entrada
   (solo remitente, asunto y fragmento: nunca el cuerpo completo).
   Para un resumen generado por IA, envía los asuntos/snippets a TU backend
   (nunca pongas claves de API en este archivo) y pinta la respuesta en #briefingText. */
const MOCK_EMAILS = [
  { id: 'e1', from: 'Moovi · UVigo', subject: 'Nueva entrega: Práctica 3 de Bases de Datos', summary: 'Fecha límite el jueves a las 23:59. Subir PDF + script SQL.', time: '08:12', cat: 'uni', important: true },
  { id: 'e2', from: 'Prof. Martínez', subject: 'Cambio de aula para el parcial', summary: 'El examen de Estadística pasa al aula B-204.', time: '07:45', cat: 'uni', important: true },
  { id: 'e3', from: 'Equipo proyecto', subject: 'Feedback del dashboard de ventas', summary: 'Piden añadir un filtro por región en Power BI.', time: 'Ayer', cat: 'proyecto', important: false },
  { id: 'e4', from: 'Vueling', subject: 'Tu reserva a Milán está confirmada', summary: 'Check-in online disponible 7 días antes del vuelo.', time: 'Ayer', cat: 'viaje', important: false },
  { id: 'e5', from: 'Strava', subject: 'Tu resumen semanal', summary: '3 actividades, 18,4 km. Ritmo medio mejorado 4 s/km.', time: 'Lun', cat: 'salud', important: false },
];

let emails = MOCK_EMAILS;
let emailsSyncedAt = null; // null = datos simulados

/* ---------------------------------------------------------
   HOJA DE RUTA · plan de carrera (del documento "FUTURO")
   start/end marcan qué fase está activa ("Ahora").
   --------------------------------------------------------- */
const ROADMAP = [
  {
    id: 'p1', period: 'Sep 2026', start: '2026-09-01', end: '2026-10-31',
    title: 'Inicio de 3º ADE',
    goal: 'Entrar a 3º con ventaja y acostumbrar el ojo a la terminología en inglés (ETL, Star Schema, Measures).',
    items: [
      { id: 'p1a', text: 'Subir los primeros dashboards al portfolio (Kaggle / GitHub)' },
      { id: 'p1b', text: 'Compartir los primeros hitos en LinkedIn' },
      { id: 'p1c', text: 'Cambiar el sistema operativo y los programas a inglés' },
    ],
  },
  {
    id: 'p2', period: 'Curso 2026/27', start: '2026-09-01', end: '2027-06-30',
    title: '3º de ADE',
    goal: 'Perfil híbrido ADE + Python + Power BI + SQL, y desbloquear el límite de créditos para las prácticas.',
    items: [
      { id: 'p2a', text: 'Recuperar las 2 materias pendientes y superar los 120 ECTS' },
      { id: 'p2b', text: 'Microcredencial de Python para Análisis de Datos (UVigo & Santander)' },
      { id: 'p2c', text: 'Dominar Pandas y NumPy' },
      { id: 'p2d', text: 'Aprender la sintaxis básica de SQL' },
      { id: 'p2e', text: 'Simulación Forage · Accenture Data' },
      { id: 'p2f', text: 'Simulación Forage · Deloitte Consulting' },
    ],
    links: [{ label: 'Forage', url: 'https://www.theforage.com' }],
  },
  {
    id: 'p3', period: 'Ene 2027', start: '2027-01-01', end: '2027-02-28',
    title: 'Base Microsoft (sin gastar dinero)',
    goal: 'Aprovechar la baja carga lectiva para preparar PL-300 y DP-600 con material oficial y entornos gratuitos.',
    items: [
      { id: 'p3a', text: 'Ruta de Microsoft Learn para PL-300 (con laboratorios)' },
      { id: 'p3b', text: 'Ruta de Microsoft Learn para DP-600' },
      { id: 'p3c', text: 'Activar la prueba gratuita de Fabric (60 días) a principios de enero' },
      { id: 'p3d', text: 'Crear un Lakehouse, ingerir datos y conectarlo a Power BI' },
      { id: 'p3e', text: 'Modelado y primeros pasos con DAX (Datdata, en español)' },
      { id: 'p3f', text: 'Arquitectura de Fabric con Guy in a Cube y DAX avanzado con SQLBI' },
    ],
    links: [
      { label: 'Microsoft Learn', url: 'https://learn.microsoft.com/es-es/training/browse/?terms=PL-300' },
      { label: 'Fabric', url: 'https://app.fabric.microsoft.com' },
      { label: 'Guy in a Cube', url: 'https://www.youtube.com/@GuyInACube' },
      { label: 'SQLBI', url: 'https://www.youtube.com/@SQLBI' },
    ],
  },
  {
    id: 'p4', period: 'Mar – Jun 2027', start: '2027-03-01', end: '2027-06-30',
    title: 'Final de 3º',
    goal: 'Asegurar la plaza de verano en Data & Analytics / Business Intelligence de Altia en Vigo.',
    items: [
      { id: 'p4a', text: 'Tramitar el convenio de prácticas extracurriculares (Telepráctica UVigo)' },
      { id: 'p4b', text: 'Portfolio con 4–5 proyectos prácticos' },
      { id: 'p4c', text: 'Presentar el portfolio de Power BI y Python a los responsables de Altia' },
    ],
  },
  {
    id: 'p5', period: 'Verano 2027', start: '2027-07-01', end: '2027-09-14',
    title: 'Prácticas en Altia',
    goal: 'Demostrar solvencia técnica y visión de negocio desde el primer día para seguir durante 4º.',
    items: [
      { id: 'p5a', text: 'Aplicar modelado Star Schema, flujos ETL y dashboards ejecutivos' },
      { id: 'p5b', text: 'Familiarizarme con Microsoft Fabric' },
      { id: 'p5c', text: 'Metodologías ágiles (Scrum / Jira)' },
    ],
  },
  {
    id: 'p6', period: 'Curso 2027/28', start: '2027-09-15', end: '2028-06-30',
    title: '4º de ADE',
    goal: 'Graduarme con más de un año de experiencia real en consultoría.',
    items: [
      { id: 'p6a', text: 'Enlazar con prácticas curriculares en Altia para convalidar créditos' },
      { id: 'p6b', text: 'Solicitar la convalidación de créditos optativos' },
      { id: 'p6c', text: 'TFG aplicado a Business Intelligence / analítica empresarial' },
    ],
  },
  {
    id: 'p7', period: 'Años 1–2', start: '2028-07-01', end: '2030-06-30',
    title: 'Consolidación',
    goal: 'Blindar el CV con la acreditación de Microsoft y un máster oficial mientras genero ingresos en Vigo.',
    items: [
      { id: 'p7a', text: 'Contrato fijo en Altia como Junior BI Consultant (20–26k)' },
      { id: 'p7b', text: 'Máster oficial compatible con el trabajo (Beca MEC)' },
      { id: 'p7c', text: 'Aprobar la certificación Microsoft PL-300 (Power BI Data Analyst)' },
    ],
  },
  {
    id: 'p8', period: 'Años 3–5', start: '2030-07-01', end: '2033-06-30',
    title: 'El salto global',
    goal: 'Multiplicar el salario (45–65k €+) en remoto o en multinacionales: inglés + PL-300 + experiencia.',
    items: [
      { id: 'p8a', text: 'CV y LinkedIn 100% en inglés' },
      { id: 'p8b', text: 'Big Four (Deloitte, PwC) o full remote para Reino Unido, EE. UU. o norte de Europa' },
    ],
  },
  {
    id: 'p9', period: 'Año 6+', start: '2033-07-01', end: null,
    title: 'La meta final',
    goal: 'Superar los 80–100k € anuales con autonomía, liderazgo de equipos y flexibilidad geográfica.',
    items: [
      { id: 'p9a', text: 'Lead Data Consultant, BI Manager o responsable de datos en cliente internacional' },
    ],
  },
];

// Próximos pasos concretos que se añaden una vez al Kanban (ids fijos para no duplicar entre dispositivos)
const ROADMAP_TASKS = [
  { id: 'rm-portfolio', title: 'Subir primeros dashboards al portfolio (Kaggle / GitHub)', cat: 'proyecto', status: 'todo', due: null },
  { id: 'rm-linkedin', title: 'Compartir primeros hitos en LinkedIn', cat: 'proyecto', status: 'todo', due: null },
  { id: 'rm-ingles', title: 'Poner el sistema operativo y los programas en inglés', cat: 'personal', status: 'todo', due: null },
  { id: 'rm-ects', title: 'Recuperar las 2 materias pendientes (120 ECTS)', cat: 'urgente', status: 'todo', due: null },
  { id: 'rm-python', title: 'Microcredencial Python para Análisis de Datos (UVigo & Santander)', cat: 'uni', status: 'todo', due: null },
  { id: 'rm-sql', title: 'Aprender sintaxis básica de SQL', cat: 'proyecto', status: 'todo', due: null },
  { id: 'rm-forage', title: 'Simulaciones Forage: Accenture Data y Deloitte Consulting', cat: 'proyecto', status: 'todo', due: null },
  { id: 'rm-fabric', title: 'Activar prueba gratuita de Fabric (60 días)', cat: 'proyecto', status: 'todo', due: '2027-01-07' },
];

const DEFAULT_TASKS = [
  { id: uid(), title: 'Práctica 3 · Bases de Datos', cat: 'uni', status: 'todo', due: dateKey(addDays(2)) },
  { id: uid(), title: 'Estudiar tema 4 de Estadística', cat: 'urgente', status: 'todo', due: dateKey(addDays(3)) },
  { id: uid(), title: 'Filtro por región en el informe Power BI', cat: 'proyecto', status: 'doing', due: dateKey(addDays(5)) },
  { id: uid(), title: 'Modelo de datos en Fabric (lakehouse)', cat: 'proyecto', status: 'doing', due: dateKey(addDays(9)) },
  { id: uid(), title: 'Reservar entradas para el Duomo', cat: 'viaje', status: 'todo', due: dateKey(addDays(14)) },
  { id: uid(), title: 'Resumen apuntes Econometría', cat: 'uni', status: 'done', due: dateKey(addDays(-1)) },
];

/* 🔌 API · GOOGLE CALENDAR (ya conectado en google.js)
   Mientras no conectes Google se muestran estos eventos de ejemplo.
   Al conectar, GoogleSync.loadCalendar() los sustituye por los reales
   y categorize() les pone la etiqueta según palabras del título. */
const MOCK_EVENTS = [
  { title: 'Reunión de proyecto (Teams)', date: addDays(1, setTime(10, 0)), place: 'Online', cat: 'proyecto' },
  { title: 'Entrega Práctica 3 · BBDD', date: addDays(2, setTime(23, 59)), place: 'Moovi', cat: 'uni' },
  { title: 'Parcial de Estadística', date: addDays(3, setTime(9, 30)), place: 'Aula B-204', cat: 'examen', exam: true },
  { title: 'Cena con amigos', date: addDays(6, setTime(21, 0)), place: 'Centro', cat: 'personal' },
  { title: 'Carrera popular 10K', date: addDays(12, setTime(10, 0)), place: 'Salida en el puerto', cat: 'salud' },
  { title: 'Vuelo a Milán', date: CONFIG.milanTrip.start, place: 'Aeropuerto', cat: 'viaje' },
];
function setTime(h, m) { const d = new Date(); d.setHours(h, m, 0, 0); return d; }

const CATEGORY_RULES = [
  ['viaje', /vuelo|viaje|mil[aá]n|hotel|aeropuerto|\btren\b/],
  ['urgente', /examen|parcial|urgente/],
  ['uni', /\bclase|entrega|pr[aá]ctica|tutor[ií]a|\buni(versidad)?\b|moovi|uvigo|seminario|\btfg\b/],
  ['salud', /gym|gimnasio|entreno|carrera|running|correr|fuerza|m[eé]dico|fisio/],
  ['proyecto', /reuni[oó]n|proyecto|power ?bi|fabric|\bcall\b|\bmeet/],
  ['finanzas', /pago|factura|banco|recibo|alquiler|n[oó]mina/],
];
const categorize = (title) => CATEGORY_RULES.find(([, re]) => re.test(title.toLowerCase()))?.[0] || 'personal';

let events = MOCK_EVENTS;
let calendarSyncedAt = null; // null = datos simulados

const TRIP_CHECKLIST = ['Check-in online', 'DNI / pasaporte', 'Reservar Última Cena (Da Vinci)', 'Abrigo y paraguas'];

const TOOLS = [
  { name: 'Finanzas', desc: 'Mi app de finanzas', url: CONFIG.financeUrl, icon: '€', cat: 'finanzas' },
  { name: 'Moovi', desc: 'Campus virtual UVigo', url: 'https://moovi.uvigo.gal', icon: 'Mo', cat: 'uni' },
  { name: 'Gmail', desc: 'Correo', url: 'https://mail.google.com', icon: 'G', cat: 'urgente' },
  { name: 'Excel', desc: 'Hojas de cálculo', url: 'https://www.office.com/launch/excel', icon: 'X', cat: 'proyecto' },
  { name: 'Fabric', desc: 'Microsoft Fabric', url: 'https://app.fabric.microsoft.com', icon: 'Fa', cat: 'viaje' },
  { name: 'Power BI', desc: 'Informes y dashboards', url: 'https://app.powerbi.com', icon: 'BI', cat: 'personal' },
  { name: 'Calendar', desc: 'Google Calendar', url: 'https://calendar.google.com', icon: 'Ca', cat: 'salud' },
];

/* ---------------------------------------------------------
   ESTADO (persistido en localStorage)
   --------------------------------------------------------- */
let TODAY, WEEK, tasks, readEmails, strengthDone, tripChecks, roadmapDone;

// Se vuelve a llamar al llegar datos de otro dispositivo o al cambiar de día
function loadState() {
  TODAY = dateKey();
  WEEK = dateKey(mondayOf());
  tasks = store.get('tasks', DEFAULT_TASKS);
  readEmails = store.get('readEmails', []);
  tripChecks = store.get('tripChecks', []);
  roadmapDone = store.get('roadmap', []);
  loadHealthState(); // health.js
}

// Añade los próximos pasos de la hoja de ruta al Kanban una sola vez.
// Se llama tras sincronizar con Drive para no pisar los datos de otro dispositivo.
function seedRoadmapTasks() {
  if (store.get('roadmapSeeded', false)) return;
  const have = new Set(tasks.map((t) => t.id));
  tasks = [...tasks, ...ROADMAP_TASKS.filter((t) => !have.has(t.id))];
  store.set('tasks', tasks);
  store.set('roadmapSeeded', true);
  renderKanban();
  renderBriefing();
}

/* ---------------------------------------------------------
   COLOR CODING PERSONALIZABLE
   --------------------------------------------------------- */
function applyColors() {
  const custom = store.get('colors', {});
  Object.entries(CONFIG.categories).forEach(([k, c]) => {
    document.documentElement.style.setProperty(`--c-${k}`, custom[k] || c.color);
  });
}

function renderColorSettings() {
  const custom = store.get('colors', {});
  $('#colorList').innerHTML = Object.entries(CONFIG.categories).map(([k, c]) => `
    <label class="color-row">
      ${tagHTML(k)}
      <input type="color" data-cat="${k}" value="${custom[k] || c.color}">
    </label>`).join('');
}

/* ---------------------------------------------------------
   1 · RESUMEN MATUTINO
   --------------------------------------------------------- */
function summarizeEmails(list) {
  if (!list.length) return 'Bandeja al día: no tienes correos sin leer.';
  const byCat = {};
  list.forEach((e) => { byCat[e.cat] = (byCat[e.cat] || 0) + 1; });
  const parts = Object.entries(byCat).map(([c, n]) => `${n} de ${catLabel(c).toLowerCase()}`);
  let s = `Tienes <strong>${list.length} correo${list.length > 1 ? 's' : ''} sin leer</strong> (${joinEs(parts)}).`;
  const important = list.filter((e) => e.important);
  if (important.length) {
    s += ` Lo importante: ${important.map((e) => `«${esc(e.subject)}» de ${esc(e.from)}`).join('; ')}.`;
  }
  return s;
}

function pickReminder(pending) {
  // Prioridad: tarea que vence antes → evento próximo → recordatorio genérico del día
  const soonTask = pending
    .filter((t) => t.due && daysUntil(parseKey(t.due)) <= 3)
    .sort((a, b) => a.due.localeCompare(b.due))[0];
  if (soonTask) return `${esc(soonTask.title)} · <strong>${fmtRel(parseKey(soonTask.due)).toLowerCase()}</strong>.`;

  const soonEvent = events.find((e) => daysUntil(e.date) >= 0 && daysUntil(e.date) <= 2);
  if (soonEvent) return `${esc(soonEvent.title)} · ${fmtRel(soonEvent.date).toLowerCase()}.`;

  return CONFIG.reminders[new Date().getDate() % CONFIG.reminders.length];
}

function renderBriefing() {
  const now = new Date();
  const h = now.getHours();
  const saludo = h < 6 ? 'Buenas noches' : h < 13 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches';
  $('#greeting').textContent = `${saludo}, ${CONFIG.userName}`;
  $('#today').textContent = capitalize(now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));

  const pending = tasks.filter((t) => t.status !== 'done');
  const doing = tasks.filter((t) => t.status === 'doing').length;
  const dueSoon = pending.filter((t) => t.due && daysUntil(parseKey(t.due)) <= 2).length;
  const training = todayWorkout(); // health.js
  const unread = emails.filter((e) => !readEmails.includes(e.id));
  const milanDays = Math.max(0, Math.floor((CONFIG.milanTrip.start - now) / 86400000));

  const trainingText = healthBriefing(); // health.js

  const todayEvents = events.filter((e) => daysUntil(e.date) === 0);
  const agendaText = todayEvents.length
    ? `Hoy tienes <strong>${todayEvents.length} evento${todayEvents.length > 1 ? 's' : ''}</strong>: ${todayEvents.slice(0, 3).map((e) => `${e.allDay ? '' : `${fmtHour(e.date)} `}${esc(e.title)}`).join(' · ')}${todayEvents.length > 3 ? '…' : ''}.`
    : 'Hoy no tienes eventos en el calendario.';

  $('#briefingText').innerHTML = `
    <p>Tienes <strong>${pending.length} tarea${pending.length !== 1 ? 's' : ''} pendiente${pending.length !== 1 ? 's' : ''}</strong>${doing ? ` (${doing} en proceso)` : ''}${dueSoon ? ` y <strong>${dueSoon}</strong> vence${dueSoon > 1 ? 'n' : ''} en 2 días o menos` : ''}.</p>
    <p>${agendaText}</p>
    ${examText()}
    <p>${trainingText}</p>
    <p>${summarizeEmails(unread)}</p>
    ${roadmapText() ? `<p>${roadmapText()}</p>` : ''}
    <p class="reminder">⏰ Recordatorio: ${pickReminder(pending)}</p>`;

  const stats = [
    { v: pending.length, l: 'Tareas pendientes', c: 'uni' },
    { v: { gym: '🏋️', run: '🏃', bike: '🚴', other: '✦', rest: '—' }[training.kind], l: training.kind === 'rest' ? 'Sin entreno apuntado' : `Hoy: ${esc(training.label)}`, c: 'salud' },
    { v: unread.length, l: 'Correos sin leer', c: 'urgente' },
    { v: milanDays, l: 'Días para Milán', c: 'viaje' },
  ];
  $('#briefingStats').innerHTML = stats.map((s) => `
    <div class="stat" style="--c:var(--c-${s.c})"><b>${s.v}</b><span>${s.l}</span><i></i></div>`).join('');

  renderEmails();
}

function renderEmails() {
  $('#mailSource').textContent = emailsSyncedAt ? `Gmail · ${fmtHour(emailsSyncedAt)}` : 'Ejemplo';
  if (!emails.length) {
    $('#emailList').innerHTML = '<li class="empty">No tienes correos sin leer.</li>';
    return;
  }
  $('#emailList').innerHTML = emails.map((e) => {
    const read = readEmails.includes(e.id);
    return `
      <li class="mail ${read ? 'is-read' : ''}" data-id="${e.id}" title="${read ? 'Marcar como no leído' : 'Marcar como leído'}">
        <span class="avatar" style="--c:var(--c-${e.cat})">${esc(e.from.charAt(0))}</span>
        <div style="min-width:0">
          <div class="mail-from">${esc(e.from)}</div>
          <div class="mail-subj">${esc(e.subject)}</div>
          <div class="mail-sum">${esc(e.summary)}</div>
        </div>
        <span class="mail-time">${esc(e.time)}${e.url ? `<a class="mail-open" href="${e.url}" target="_blank" rel="noopener" title="Abrir en Gmail">↗</a>` : ''}</span>
      </li>`;
  }).join('');
}

// Llega desde google.js con tus correos no leídos reales
function onGmailMessages(list) {
  const now = new Date();
  emails = list.map((m) => {
    const sameDay = daysUntil(m.date) === 0;
    return {
      ...m,
      cat: categorize(`${m.subject} ${m.from}`),
      time: sameDay ? fmtHour(m.date)
        : daysUntil(m.date) === -1 ? 'Ayer'
        : capitalize(m.date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')),
      url: `https://mail.google.com/mail/u/0/#inbox/${m.threadId}`,
    };
  });
  emailsSyncedAt = now;
  // Olvida los "vistos" de correos que ya no están sin leer
  const ids = new Set(emails.map((e) => e.id));
  const kept = readEmails.filter((id) => ids.has(id));
  if (kept.length !== readEmails.length) { readEmails = kept; store.set('readEmails', readEmails); }
  renderBriefing();
}

/* ---------------------------------------------------------
   HOJA DE RUTA
   --------------------------------------------------------- */
function phaseState(p) {
  const today = startOfDay(new Date());
  if (today < parseKey(p.start)) return 'next';
  if (p.end && today > parseKey(p.end)) return 'past';
  return 'now';
}

// Fase activa con pasos pendientes (para el briefing)
function roadmapText() {
  const phase = ROADMAP.find((p) => phaseState(p) === 'now' && p.items.some((i) => !roadmapDone.includes(i.id)));
  if (!phase) return '';
  const done = phase.items.filter((i) => roadmapDone.includes(i.id)).length;
  const next = phase.items.find((i) => !roadmapDone.includes(i.id));
  return `Hoja de ruta: <strong>${esc(phase.title)}</strong> (${done}/${phase.items.length}). Siguiente paso: ${esc(next.text)}.`;
}

function renderRoadmap() {
  const all = ROADMAP.flatMap((p) => p.items);
  $('#roadmapProgress').textContent = `${all.filter((i) => roadmapDone.includes(i.id)).length}/${all.length} pasos`;

  $('#roadmap').innerHTML = ROADMAP.map((p) => {
    const state = phaseState(p);
    const done = p.items.filter((i) => roadmapDone.includes(i.id)).length;
    const pct = Math.round((done / p.items.length) * 100);
    return `
      <article class="phase is-${state}" data-phase="${p.id}">
        <div class="phase-head">
          <span class="phase-period">${esc(p.period)}</span>
          ${state === 'now' ? tagHTML('proyecto', 'Ahora') : state === 'past' ? '<span class="muted small">Pasado</span>' : ''}
        </div>
        <h3>${esc(p.title)}</h3>
        <p class="phase-goal">${esc(p.goal)}</p>
        <div class="bar" style="--c:var(--c-proyecto)"><span style="--p:${pct}%"></span></div>
        <ul class="checklist">
          ${p.items.map((i) => `
            <li><label class="check" style="--c:var(--c-proyecto)">
              <input type="checkbox" data-id="${i.id}" ${roadmapDone.includes(i.id) ? 'checked' : ''}>
              <span>${esc(i.text)}</span>
            </label></li>`).join('')}
        </ul>
        ${p.links ? `<div class="phase-links">${p.links.map((l) => `<a href="${l.url}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join('')}</div>` : ''}
      </article>`;
  }).join('');
}

function bindRoadmap() {
  $('#roadmap').addEventListener('change', (e) => {
    const id = e.target.dataset.id;
    if (!id) return;
    roadmapDone = e.target.checked ? [...roadmapDone, id] : roadmapDone.filter((x) => x !== id);
    store.set('roadmap', roadmapDone);
    renderRoadmap();
    renderBriefing();
  });
}

// Centra la línea temporal en la fase actual
function scrollRoadmapToNow() {
  const el = $('#roadmap .phase.is-now');
  if (el) $('#roadmap').scrollLeft = el.offsetLeft - $('#roadmap').offsetLeft;
}

/* ---------------------------------------------------------
   2 · KANBAN (Hub universitario & proyectos)
   --------------------------------------------------------- */
const COLUMNS = [
  { id: 'todo', label: 'Pendiente' },
  { id: 'doing', label: 'En proceso' },
  { id: 'done', label: 'Hecho' },
];

function saveTasks() {
  store.set('tasks', tasks);
  renderKanban();
  renderBriefing();
}

function cardHTML(t) {
  const i = COLUMNS.findIndex((c) => c.id === t.status);
  const due = t.due ? parseKey(t.due) : null;
  const late = due && t.status !== 'done' && daysUntil(due) < 0;
  return `
    <div class="kcard ${t.status === 'done' ? 'is-done' : ''}" draggable="true" data-id="${t.id}">
      <div class="kcard-top">${tagHTML(t.cat)}<button class="icon-btn" data-action="del" title="Eliminar" type="button">×</button></div>
      <div class="kcard-title">${esc(t.title)}</div>
      <div class="kcard-foot">
        <span class="due ${late ? 'late' : ''}">${due ? (t.status === 'done' ? 'Completada' : fmtRel(due)) : 'Sin fecha'}</span>
        <span class="move">
          ${i > 0 ? '<button class="icon-btn" data-action="prev" title="Mover atrás" type="button">←</button>' : ''}
          ${i < COLUMNS.length - 1 ? '<button class="icon-btn" data-action="next" title="Mover adelante" type="button">→</button>' : ''}
        </span>
      </div>
    </div>`;
}

function renderKanban() {
  $('#board').innerHTML = COLUMNS.map((col) => {
    const items = tasks
      .filter((t) => t.status === col.id)
      .sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));
    return `
      <div class="column" data-status="${col.id}">
        <div class="column-head"><span class="dot dot-${col.id}"></span>${col.label}<span class="count">${items.length}</span></div>
        <div class="column-body">${items.map(cardHTML).join('') || '<div class="empty">Arrastra tareas aquí</div>'}</div>
      </div>`;
  }).join('');
}

function bindKanban() {
  const board = $('#board');

  board.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = btn.closest('.kcard').dataset.id;
    const task = tasks.find((t) => t.id === id);
    const i = COLUMNS.findIndex((c) => c.id === task.status);
    if (btn.dataset.action === 'del') tasks = tasks.filter((t) => t.id !== id);
    if (btn.dataset.action === 'prev') task.status = COLUMNS[i - 1].id;
    if (btn.dataset.action === 'next') task.status = COLUMNS[i + 1].id;
    saveTasks();
  });

  // Drag & drop nativo HTML5
  board.addEventListener('dragstart', (e) => {
    const card = e.target.closest('.kcard');
    if (!card) return;
    e.dataTransfer.setData('text/plain', card.dataset.id);
    e.dataTransfer.effectAllowed = 'move';
    card.classList.add('dragging');
  });
  board.addEventListener('dragend', (e) => e.target.closest('.kcard')?.classList.remove('dragging'));
  board.addEventListener('dragover', (e) => {
    const col = e.target.closest('.column');
    if (!col) return;
    e.preventDefault();
    board.querySelectorAll('.drag-over').forEach((c) => c !== col && c.classList.remove('drag-over'));
    col.classList.add('drag-over');
  });
  board.addEventListener('dragleave', (e) => {
    const col = e.target.closest('.column');
    if (col && !col.contains(e.relatedTarget)) col.classList.remove('drag-over');
  });
  board.addEventListener('drop', (e) => {
    const col = e.target.closest('.column');
    if (!col) return;
    e.preventDefault();
    const task = tasks.find((t) => t.id === e.dataTransfer.getData('text/plain'));
    if (task) { task.status = col.dataset.status; saveTasks(); }
  });

  // Formulario de nueva tarea
  $('#taskCat').innerHTML = Object.entries(CONFIG.categories)
    .map(([k, c]) => `<option value="${k}">${esc(c.label)}</option>`).join('');
  $('#taskForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = $('#taskTitle').value.trim();
    if (!title) return;
    tasks.push({ id: uid(), title, cat: $('#taskCat').value, status: 'todo', due: $('#taskDue').value || null });
    e.target.reset();
    saveTasks();
  });
}

/* ---------------------------------------------------------
   3 · SALUD Y DEPORTE → health.js
   --------------------------------------------------------- */

/* ---------------------------------------------------------
   4 · AGENDA Y VIAJES
   --------------------------------------------------------- */
// Línea del briefing con el próximo examen (y cuántos hay en las próximas 2 semanas)
function examText() {
  const exams = upcomingExams();
  if (!exams.length) return '';
  const next = exams[0];
  const n = daysUntil(next.date);
  const when = n === 0 ? '<strong>hoy</strong>' : n === 1 ? '<strong>mañana</strong>' : `en <strong>${n} días</strong>`;
  const soon = exams.filter((e) => daysUntil(e.date) <= 14).length;
  return `<p class="exam-line">📝 Próximo examen: <strong>${esc(next.title)}</strong> ${when} (${next.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}).${soon > 1 ? ` Tienes ${soon} exámenes en las próximas 2 semanas.` : ''}</p>`;
}

// Exámenes: los del calendario «Exams» de Google
const upcomingExams = () => events
  .filter((e) => e.exam && ((e.end || e.date) >= new Date() || daysUntil(e.date) === 0))
  .sort((a, b) => a.date - b.date);

function renderExams() {
  const exams = upcomingExams();
  const box = $('#exams');
  box.hidden = !exams.length;
  if (!exams.length) return;
  const when = (e) => {
    const n = daysUntil(e.date);
    return n === 0 ? 'Hoy' : n === 1 ? 'Mañana' : `${n} días`;
  };
  box.innerHTML = `
    <div class="exams-head"><span>📝 Próximos exámenes</span><span class="muted small">${exams.length}</span></div>
    <ul>
      ${exams.slice(0, 5).map((e) => `
        <li class="${daysUntil(e.date) <= 7 ? 'is-soon' : ''}">
          <span class="exam-days"><b>${when(e)}</b></span>
          <span class="exam-title">${esc(e.title)}</span>
          <span class="muted small">${capitalize(e.date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }))}${e.allDay ? '' : ` · ${fmtHour(e.date)}`}${e.place ? ` · ${esc(e.place)}` : ''}</span>
        </li>`).join('')}
    </ul>`;
}

function renderAgenda() {
  renderExams();
  const upcoming = events
    .filter((e) => (e.end || e.date) >= new Date() || daysUntil(e.date) === 0)
    .sort((a, b) => a.date - b.date)
    .slice(0, 6);

  $('#agendaSource').textContent = calendarSyncedAt
    ? `Google Calendar · ${fmtHour(calendarSyncedAt)}`
    : 'Ejemplo · conecta Google';

  if (!upcoming.length) {
    $('#events').innerHTML = '<li class="empty">No tienes eventos próximos.</li>';
    return;
  }
  $('#events').innerHTML = upcoming.map((e) => `
    <li class="event ${e.exam ? 'is-exam' : ''}">
      <div class="event-date">
        <b>${e.date.getDate()}</b>
        <span>${e.date.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')}</span>
      </div>
      <div style="min-width:0">
        <div class="event-title">${esc(e.title)}</div>
        <div class="event-meta">${[e.allDay ? 'Todo el día' : fmtHour(e.date), e.place].filter(Boolean).map(esc).join(' · ')}</div>
      </div>
      <div class="event-right">${tagHTML(e.cat)}<span class="muted small">${fmtRel(e.date)}</span></div>
    </li>`).join('');
}

// Llega desde google.js con los eventos reales de tu Google Calendar
function onCalendarEvents(list) {
  events = list.map((e) => {
    const exam = /exam/i.test(e.calendar || ''); // tu calendario «Exams»
    return { ...e, exam, cat: exam ? 'examen' : categorize(e.title) };
  });
  calendarSyncedAt = new Date();

  // Si tienes el viaje en el calendario, la cuenta atrás usa esa fecha
  const milan = events.find((e) => /mil[aá]n/i.test(e.title) && e.date.getMonth() === 11);
  if (milan) {
    CONFIG.milanTrip.start = milan.date;
    if (milan.end && milan.end - milan.date > 86400000) CONFIG.milanTrip.end = milan.end;
  }
  renderAgenda();
  renderBriefing();
  tickCountdown();
}

function tickCountdown() {
  const { start, end, booked, detail } = CONFIG.milanTrip;
  const now = new Date();
  let diff = Math.max(0, start - now);
  const units = {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
  Object.entries(units).forEach(([u, v]) => { $(`#countdown [data-u="${u}"]`).textContent = pad(v); });

  const pct = clamp(((now - booked) / (start - booked)) * 100, 0, 100);
  $('#tripProgress').style.setProperty('--p', `${pct}%`);

  const range = `${start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;
  $('#tripMeta').textContent = now > end ? '¡Viaje completado! Ciao, Milano 👋'
    : now >= start ? '¡Estás en Milán! Buon viaggio ✨'
    : `${detail} · ${range}`;
}

function renderTripChecklist() {
  $('#tripChecklist').innerHTML = TRIP_CHECKLIST.map((item, i) => `
    <li><label class="check">
      <input type="checkbox" data-i="${i}" ${tripChecks.includes(i) ? 'checked' : ''}>
      <span>${esc(item)}</span>
    </label></li>`).join('');
}

/* ---------------------------------------------------------
   5 · HERRAMIENTAS CONECTADAS
   --------------------------------------------------------- */
/* 🔌 API · Si quieres enlazar documentos concretos (un Excel de OneDrive,
   un informe de Power BI o un workspace de Fabric), cambia la "url" de TOOLS
   por el enlace directo del archivo/informe. */
function renderTools() {
  $('#financeLink').href = CONFIG.financeUrl;
  $('#tools').innerHTML = TOOLS.map((t) => `
    <a class="tool" href="${t.url}" target="_blank" rel="noopener noreferrer" style="--c:var(--c-${t.cat})">
      <span class="tool-icon">${esc(t.icon)}</span>
      <span><b>${esc(t.name)}</b><span>${esc(t.desc)}</span></span>
    </a>`).join('');
}

/* ---------------------------------------------------------
   RELOJ, NAVEGACIÓN Y AJUSTES
   --------------------------------------------------------- */
function tickClock() {
  $('#clock').textContent = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function bindNav() {
  const links = [...document.querySelectorAll('.nav-link[href^="#"]')];
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === `#${en.target.id}`));
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  links.forEach((l) => { const s = $(l.getAttribute('href')); if (s) observer.observe(s); });
}

function bindGlobal() {
  $('#emailList').addEventListener('click', (e) => {
    if (e.target.closest('a')) return; // el enlace ↗ abre Gmail sin marcar como visto
    const id = e.target.closest('.mail')?.dataset.id;
    if (!id) return;
    readEmails = readEmails.includes(id) ? readEmails.filter((x) => x !== id) : [...readEmails, id];
    store.set('readEmails', readEmails);
    renderBriefing();
  });
  $('#markAllRead').addEventListener('click', () => {
    readEmails = emails.map((e) => e.id);
    store.set('readEmails', readEmails);
    renderBriefing();
  });
  $('#refreshBriefing').addEventListener('click', renderBriefing);

  $('#tripChecklist').addEventListener('change', (e) => {
    const i = Number(e.target.dataset.i);
    tripChecks = e.target.checked ? [...tripChecks, i] : tripChecks.filter((x) => x !== i);
    store.set('tripChecks', tripChecks);
  });

  // Diálogo de colores
  const dialog = $('#settings');
  $('#openSettings').addEventListener('click', () => { renderColorSettings(); dialog.showModal(); });
  $('#colorList').addEventListener('input', (e) => {
    const cat = e.target.dataset.cat;
    if (!cat) return;
    const custom = store.get('colors', {});
    custom[cat] = e.target.value;
    store.set('colors', custom);
    document.documentElement.style.setProperty(`--c-${cat}`, e.target.value);
  });
  $('#resetColors').addEventListener('click', () => {
    store.set('colors', {});
    applyColors();
    renderColorSettings();
  });

  // Google: conectar, o si ya estás conectado, sincronizar ahora
  $('#googleBtn').addEventListener('click', () => {
    GoogleSync.isConnected() ? GoogleSync.refresh(true) : GoogleSync.connect();
  });
  $('#disconnectGoogle').addEventListener('click', () => {
    GoogleSync.disconnect();
    events = MOCK_EVENTS;
    calendarSyncedAt = null;
    renderAgenda();
    renderBriefing();
  });
}

function renderSyncStatus(state, text) {
  $('#googleBtn').dataset.state = state;
  $('#googleLabel').textContent = text;
  $('#disconnectGoogle').hidden = state === 'off' || state === 'setup';
}

function renderAll() {
  applyColors();
  renderBriefing();
  renderKanban();
  renderHealth(); // health.js
  renderAgenda();
  renderTripChecklist();
  renderRoadmap();
}

/* ---------------------------------------------------------
   INICIO
   --------------------------------------------------------- */
function init() {
  loadState();
  bindKanban();
  bindRoadmap();
  bindHealth();
  bindGlobal();
  bindNav();
  renderAll();
  renderTools();
  scrollRoadmapToNow();

  tickClock();
  tickCountdown();
  setInterval(() => {
    tickClock();
    tickCountdown();
    if (dateKey() !== TODAY) { loadState(); renderAll(); } // pasó la medianoche con la app abierta
  }, 1000);

  pendingImport = readImportFromUrl(); // health.js · enlace #importar=…
  pendingActivity = readActivityFromUrl(); // activities.js · atajo de iPhone #actividad?…
  GoogleSync.init({
    clientId: CONFIG.googleClientId,
    onStatus: renderSyncStatus,
    onEvents: onCalendarEvents,
    onEmails: onGmailMessages,
    onSynced: () => { seedRoadmapTasks(); runPendingImport(); runPendingActivity(); }, // tras traer los datos de Drive
    onRemoteData: () => { loadState(); renderAll(); }, // cambios hechos en otro dispositivo
  });
  loadStrava(); // health.js · tus actividades a través del puente de Strava
  // Sin Google conectado se importa ya; conectado, se espera a la sincronización (con red de seguridad)
  if (pendingImport) setTimeout(runPendingImport, GoogleSync.isConnected() ? 8000 : 300);
  if (pendingActivity) setTimeout(runPendingActivity, GoogleSync.isConnected() ? 8000 : 300);

  // App instalable (PWA): funciona sin conexión y se puede añadir a la pantalla de inicio
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

document.addEventListener('DOMContentLoaded', init);
