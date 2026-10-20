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

  // Viaje a Milán (cambia las fechas por las de tu billete)
  milanTrip: {
    start: new Date('2026-12-04T07:00:00'),
    end: new Date('2026-12-08T22:00:00'),
    booked: new Date('2026-09-15T00:00:00'), // cuándo lo reservaste (para la barra de progreso)
    detail: 'Vuelo a Milán Malpensa (MXP) · 4 noches',
  },

  paceTargetSec: 6 * 60 + 10, // objetivo: < 6:10 /km
  weeklyKmGoal: 25,
  proteinGoal: 140, // gramos/día

  // Plan semanal (0 = domingo ... 6 = sábado). type: upper | legs | run | rest
  trainingPlan: {
    0: { type: 'rest', label: 'Descanso activo' },
    1: { type: 'upper', label: 'Fuerza · Tren superior' },
    2: { type: 'run', label: 'Running · Series' },
    3: { type: 'legs', label: 'Fuerza · Piernas' },
    4: { type: 'run', label: 'Running · Rodaje suave' },
    5: { type: 'upper', label: 'Fuerza · Tren superior' },
    6: { type: 'run', label: 'Running · Tirada larga' },
  },

  // Categorías con su color por defecto (editables desde el botón "Colores")
  categories: {
    uni:      { label: 'Universidad', color: '#7f9cf5' },
    proyecto: { label: 'Proyecto',    color: '#63cfa5' },
    personal: { label: 'Personal',    color: '#e0b46e' },
    urgente:  { label: 'Urgente',     color: '#ee7f8d' },
    salud:    { label: 'Salud',       color: '#b29cf7' },
    viaje:    { label: 'Viaje',       color: '#6ec7dd' },
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
  },
};

const catLabel = (cat) => CONFIG.categories[cat]?.label ?? cat;
const tagHTML = (cat, text = catLabel(cat)) => `<span class="tag" style="--c:var(--c-${cat})">${esc(text)}</span>`;

/* ---------------------------------------------------------
   DATOS SIMULADOS
   --------------------------------------------------------- */

/* 🔌 API · GMAIL
   Sustituye MOCK_EMAILS por una llamada a la Gmail API, p. ej.:
     const res = await gapi.client.gmail.users.messages.list({ userId: 'me', q: 'is:unread newer_than:2d' });
     // y para cada id: gapi.client.gmail.users.messages.get({ userId: 'me', id, format: 'metadata' })
   Mapea cada mensaje a { id, from, subject, summary, time, cat, important }.
   Para un resumen generado por IA, envía los asuntos/snippets a TU backend
   (nunca pongas claves de API en este archivo) y pinta la respuesta en #briefingText. */
const MOCK_EMAILS = [
  { id: 'e1', from: 'Moovi · UVigo', subject: 'Nueva entrega: Práctica 3 de Bases de Datos', summary: 'Fecha límite el jueves a las 23:59. Subir PDF + script SQL.', time: '08:12', cat: 'uni', important: true },
  { id: 'e2', from: 'Prof. Martínez', subject: 'Cambio de aula para el parcial', summary: 'El examen de Estadística pasa al aula B-204.', time: '07:45', cat: 'uni', important: true },
  { id: 'e3', from: 'Equipo proyecto', subject: 'Feedback del dashboard de ventas', summary: 'Piden añadir un filtro por región en Power BI.', time: 'Ayer', cat: 'proyecto', important: false },
  { id: 'e4', from: 'Vueling', subject: 'Tu reserva a Milán está confirmada', summary: 'Check-in online disponible 7 días antes del vuelo.', time: 'Ayer', cat: 'viaje', important: false },
  { id: 'e5', from: 'Strava', subject: 'Tu resumen semanal', summary: '3 actividades, 18,4 km. Ritmo medio mejorado 4 s/km.', time: 'Lun', cat: 'salud', important: false },
];

const DEFAULT_TASKS = [
  { id: uid(), title: 'Práctica 3 · Bases de Datos', cat: 'uni', status: 'todo', due: dateKey(addDays(2)) },
  { id: uid(), title: 'Estudiar tema 4 de Estadística', cat: 'urgente', status: 'todo', due: dateKey(addDays(3)) },
  { id: uid(), title: 'Filtro por región en el informe Power BI', cat: 'proyecto', status: 'doing', due: dateKey(addDays(5)) },
  { id: uid(), title: 'Modelo de datos en Fabric (lakehouse)', cat: 'proyecto', status: 'doing', due: dateKey(addDays(9)) },
  { id: uid(), title: 'Reservar entradas para el Duomo', cat: 'viaje', status: 'todo', due: dateKey(addDays(14)) },
  { id: uid(), title: 'Resumen apuntes Econometría', cat: 'uni', status: 'done', due: dateKey(addDays(-1)) },
];

const STRENGTH = {
  upper: {
    label: 'Tren superior',
    items: [
      { name: 'Press banca', sets: '4×8' },
      { name: 'Dominadas', sets: '4×6' },
      { name: 'Press militar', sets: '3×10' },
      { name: 'Remo con barra', sets: '4×8' },
      { name: 'Fondos', sets: '3×12' },
    ],
  },
  legs: {
    label: 'Piernas',
    items: [
      { name: 'Sentadilla', sets: '4×6' },
      { name: 'Peso muerto rumano', sets: '3×8' },
      { name: 'Prensa', sets: '3×12' },
      { name: 'Zancadas', sets: '3×10' },
      { name: 'Gemelos', sets: '4×15' },
    ],
  },
};

/* 🔌 API · STRAVA
   Sustituye DEFAULT_RUNS por GET https://www.strava.com/api/v3/athlete/activities
   (OAuth desde tu backend) filtrando type === 'Run' y mapeando a
   { date: 'YYYY-MM-DD', km: distance / 1000, sec: moving_time }. */
const DEFAULT_RUNS = [
  { date: dateKey(addDays(-13)), km: 6.2, sec: 39 * 60 + 40 },
  { date: dateKey(addDays(-11)), km: 5.0, sec: 31 * 60 + 5 },
  { date: dateKey(addDays(-9)), km: 10.1, sec: 63 * 60 + 30 },
  { date: dateKey(addDays(-6)), km: 5.5, sec: 33 * 60 + 50 },
  { date: dateKey(addDays(-4)), km: 6.0, sec: 36 * 60 + 18 },
  { date: dateKey(addDays(-2)), km: 7.2, sec: 44 * 60 + 2 },
  { date: dateKey(addDays(-1)), km: 5.2, sec: 31 * 60 + 25 },
];

const MEALS = [
  { name: 'Desayuno · yogur griego + avena', g: 25 },
  { name: 'Comida · pollo, arroz y verduras', g: 40 },
  { name: 'Merienda · batido de proteína', g: 25 },
  { name: 'Cena · salmón o tortilla de claras', g: 35 },
  { name: 'Snack · requesón o frutos secos', g: 15 },
];

/* 🔌 API · GOOGLE CALENDAR
   Sustituye MOCK_EVENTS por:
     const res = await gapi.client.calendar.events.list({
       calendarId: 'primary', timeMin: new Date().toISOString(),
       singleEvents: true, orderBy: 'startTime', maxResults: 10,
     });
   y mapea res.result.items a { title: summary, date: new Date(start.dateTime || start.date), place: location, cat }.
   Puedes deducir "cat" por el color del evento (colorId) o por palabras clave del título. */
const MOCK_EVENTS = [
  { title: 'Reunión de proyecto (Teams)', date: addDays(1, setTime(10, 0)), place: 'Online', cat: 'proyecto' },
  { title: 'Entrega Práctica 3 · BBDD', date: addDays(2, setTime(23, 59)), place: 'Moovi', cat: 'uni' },
  { title: 'Parcial de Estadística', date: addDays(3, setTime(9, 30)), place: 'Aula B-204', cat: 'urgente' },
  { title: 'Cena con amigos', date: addDays(6, setTime(21, 0)), place: 'Centro', cat: 'personal' },
  { title: 'Carrera popular 10K', date: addDays(12, setTime(10, 0)), place: 'Salida en el puerto', cat: 'salud' },
  { title: 'Vuelo a Milán', date: CONFIG.milanTrip.start, place: 'Aeropuerto', cat: 'viaje' },
];
function setTime(h, m) { const d = new Date(); d.setHours(h, m, 0, 0); return d; }

const TRIP_CHECKLIST = ['Check-in online', 'DNI / pasaporte', 'Reservar Última Cena (Da Vinci)', 'Abrigo y paraguas'];

const TOOLS = [
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
const TODAY = dateKey();
const WEEK = dateKey(mondayOf());

let tasks = store.get('tasks', DEFAULT_TASKS);
let readEmails = store.get('readEmails', []);
let runs = store.get('runs', DEFAULT_RUNS);
let strengthDone = store.get(`strength:${WEEK}`, { upper: [], legs: [] });
let protein = store.get(`protein:${TODAY}`, { meals: [], extra: 0 });
let tripChecks = store.get('tripChecks', []);

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

  const soonEvent = MOCK_EVENTS.find((e) => daysUntil(e.date) >= 0 && daysUntil(e.date) <= 2);
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
  const training = CONFIG.trainingPlan[now.getDay()];
  const unread = MOCK_EMAILS.filter((e) => !readEmails.includes(e.id));
  const milanDays = Math.max(0, Math.floor((CONFIG.milanTrip.start - now) / 86400000));

  const trainingText = training.type === 'rest'
    ? 'Hoy <strong>no toca entrenamiento</strong>: día de descanso activo (movilidad y paseo).'
    : `Hoy toca <strong>${training.label}</strong>${training.type === 'run' ? ` — ritmo objetivo por debajo de ${fmtPace(CONFIG.paceTargetSec)} /km` : ''}.`;

  $('#briefingText').innerHTML = `
    <p>Tienes <strong>${pending.length} tarea${pending.length !== 1 ? 's' : ''} pendiente${pending.length !== 1 ? 's' : ''}</strong>${doing ? ` (${doing} en proceso)` : ''}${dueSoon ? ` y <strong>${dueSoon}</strong> vence${dueSoon > 1 ? 'n' : ''} en 2 días o menos` : ''}.</p>
    <p>${trainingText}</p>
    <p>${summarizeEmails(unread)}</p>
    <p class="reminder">⏰ Recordatorio: ${pickReminder(pending)}</p>`;

  const stats = [
    { v: pending.length, l: 'Tareas pendientes', c: 'uni' },
    { v: training.type === 'rest' ? '—' : '✓', l: training.type === 'rest' ? 'Descanso' : 'Entreno hoy', c: 'salud' },
    { v: unread.length, l: 'Correos sin leer', c: 'urgente' },
    { v: milanDays, l: 'Días para Milán', c: 'viaje' },
  ];
  $('#briefingStats').innerHTML = stats.map((s) => `
    <div class="stat" style="--c:var(--c-${s.c})"><b>${s.v}</b><span>${s.l}</span><i></i></div>`).join('');

  renderEmails();
}

function renderEmails() {
  $('#emailList').innerHTML = MOCK_EMAILS.map((e) => {
    const read = readEmails.includes(e.id);
    return `
      <li class="mail ${read ? 'is-read' : ''}" data-id="${e.id}" title="${read ? 'Marcar como no leído' : 'Marcar como leído'}">
        <span class="avatar" style="--c:var(--c-${e.cat})">${esc(e.from.charAt(0))}</span>
        <div style="min-width:0">
          <div class="mail-from">${esc(e.from)}</div>
          <div class="mail-subj">${esc(e.subject)}</div>
          <div class="mail-sum">${esc(e.summary)}</div>
        </div>
        <span class="mail-time">${esc(e.time)}</span>
      </li>`;
  }).join('');
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
   3 · SALUD Y DEPORTE
   --------------------------------------------------------- */
function renderStrength() {
  const todayType = CONFIG.trainingPlan[new Date().getDay()].type;
  $('#strength').innerHTML = Object.entries(STRENGTH).map(([key, r]) => {
    const done = strengthDone[key] || [];
    const pct = Math.round((done.length / r.items.length) * 100);
    return `
      <div class="routine ${todayType === key ? 'is-today' : ''}" data-routine="${key}">
        <div class="routine-head">
          <span>${r.label}</span>
          ${todayType === key ? tagHTML('salud', 'Hoy') : ''}
          <span class="muted small">${done.length}/${r.items.length}</span>
        </div>
        <div class="bar" style="--c:var(--c-salud)"><span style="--p:${pct}%"></span></div>
        <ul class="checklist">
          ${r.items.map((it, i) => `
            <li><label class="check">
              <input type="checkbox" data-i="${i}" ${done.includes(i) ? 'checked' : ''}>
              <span>${esc(it.name)}</span><em>${esc(it.sets)}</em>
            </label></li>`).join('')}
        </ul>
      </div>`;
  }).join('');
}

function renderRunning() {
  const sorted = [...runs].sort((a, b) => a.date.localeCompare(b.date));
  const last = sorted.at(-1);
  const recent = sorted.slice(-5);
  const avgPace = recent.reduce((s, r) => s + r.sec, 0) / recent.reduce((s, r) => s + r.km, 0);
  const monday = mondayOf();
  const weekKm = sorted.filter((r) => parseKey(r.date) >= monday).reduce((s, r) => s + r.km, 0);
  const target = CONFIG.paceTargetSec;
  const lastPace = last ? last.sec / last.km : 0;
  const okUnder = (p) => p < target;

  $('#runKpis').innerHTML = `
    <div class="kpi"><b class="${okUnder(lastPace) ? 'ok' : 'bad'}">${last ? fmtPace(lastPace) : '—'}</b><span>Último ritmo /km</span></div>
    <div class="kpi"><b class="${okUnder(avgPace) ? 'ok' : 'bad'}">${fmtPace(avgPace)}</b><span>Media últimas 5</span></div>
    <div class="kpi"><b>${weekKm.toFixed(1)}</b><span>km esta semana</span></div>`;

  // Gráfico de barras: barra más alta = ritmo más rápido. Línea discontinua = objetivo.
  const SLOW = 7 * 60 + 30, FAST = 4 * 60 + 45, MAX_H = 64;
  const hFor = (p) => clamp((SLOW - p) / (SLOW - FAST), 0.08, 1) * MAX_H;
  const last8 = sorted.slice(-8);
  $('#paceChart').innerHTML = `
    ${last8.map((r) => {
      const p = r.sec / r.km;
      const d = parseKey(r.date);
      return `<div class="col" title="${r.km} km · ${fmtPace(p)} /km">
        <em>${fmtPace(p)}</em>
        <i class="${okUnder(p) ? 'ok' : ''}" style="height:${hFor(p)}px"></i>
        <small>${d.getDate()}/${d.getMonth() + 1}</small>
      </div>`;
    }).join('')}
    <div class="target" style="bottom:${18 + hFor(target)}px"><span>${fmtPace(target)}</span></div>`;

  // Progreso semanal de km (se inserta antes del gráfico)
  let weekly = $('#weeklyKm');
  if (!weekly) {
    weekly = document.createElement('div');
    weekly.id = 'weeklyKm';
    weekly.className = 'weekly';
    $('#paceChart').before(weekly);
  }
  const pct = clamp((weekKm / CONFIG.weeklyKmGoal) * 100, 0, 100);
  weekly.innerHTML = `
    <div class="muted small"><span>Volumen semanal</span><span>${weekKm.toFixed(1)} / ${CONFIG.weeklyKmGoal} km</span></div>
    <div class="bar" style="--c:var(--c-salud)"><span style="--p:${pct}%"></span></div>`;
}

function renderProtein() {
  const total = protein.meals.reduce((s, i) => s + MEALS[i].g, 0) + protein.extra;
  const pct = clamp((total / CONFIG.proteinGoal) * 100, 0, 100);
  const ring = $('#proteinRing');
  ring.style.setProperty('--p', pct);
  $('#proteinValue').innerHTML = `${total}g<small>de ${CONFIG.proteinGoal}g</small>`;
  ring.title = total >= CONFIG.proteinGoal ? '¡Objetivo cumplido!' : `Faltan ${CONFIG.proteinGoal - total} g`;

  $('#meals').innerHTML = MEALS.map((m, i) => `
    <li><label class="check">
      <input type="checkbox" data-i="${i}" ${protein.meals.includes(i) ? 'checked' : ''}>
      <span>${esc(m.name)}</span><em>${m.g} g</em>
    </label></li>`).join('');
}

function bindHealth() {
  const start = mondayOf();
  $('#weekLabel').textContent = `Semana del ${start.getDate()}/${start.getMonth() + 1}`;

  $('#strength').addEventListener('change', (e) => {
    const key = e.target.closest('[data-routine]').dataset.routine;
    const i = Number(e.target.dataset.i);
    const list = strengthDone[key] || (strengthDone[key] = []);
    e.target.checked ? list.push(i) : list.splice(list.indexOf(i), 1);
    store.set(`strength:${WEEK}`, strengthDone);
    renderStrength();
  });

  $('#runForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const km = parseFloat($('#runKm').value);
    const sec = parseTime($('#runTime').value);
    if (!km || !sec) return;
    runs.push({ date: TODAY, km, sec });
    store.set('runs', runs);
    e.target.reset();
    renderRunning();
  });

  $('#meals').addEventListener('change', (e) => {
    const i = Number(e.target.dataset.i);
    protein.meals = e.target.checked ? [...protein.meals, i] : protein.meals.filter((x) => x !== i);
    store.set(`protein:${TODAY}`, protein);
    renderProtein();
  });

  $('.protein-actions').addEventListener('click', (e) => {
    const v = e.target.closest('[data-add]')?.dataset.add;
    if (!v) return;
    protein = v === 'reset' ? { meals: [], extra: 0 } : { ...protein, extra: protein.extra + Number(v) };
    store.set(`protein:${TODAY}`, protein);
    renderProtein();
  });
}

/* ---------------------------------------------------------
   4 · AGENDA Y VIAJES
   --------------------------------------------------------- */
function renderAgenda() {
  const upcoming = MOCK_EVENTS
    .filter((e) => e.date >= startOfDay(new Date()))
    .sort((a, b) => a.date - b.date)
    .slice(0, 6);

  $('#events').innerHTML = upcoming.map((e) => `
    <li class="event">
      <div class="event-date">
        <b>${e.date.getDate()}</b>
        <span>${e.date.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')}</span>
      </div>
      <div style="min-width:0">
        <div class="event-title">${esc(e.title)}</div>
        <div class="event-meta">${e.date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} · ${esc(e.place)}</div>
      </div>
      <div class="event-right">${tagHTML(e.cat)}<span class="muted small">${fmtRel(e.date)}</span></div>
    </li>`).join('');
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
  const links = [...document.querySelectorAll('.nav-link')];
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
    const id = e.target.closest('.mail')?.dataset.id;
    if (!id) return;
    readEmails = readEmails.includes(id) ? readEmails.filter((x) => x !== id) : [...readEmails, id];
    store.set('readEmails', readEmails);
    renderBriefing();
  });
  $('#markAllRead').addEventListener('click', () => {
    readEmails = MOCK_EMAILS.map((e) => e.id);
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
}

/* ---------------------------------------------------------
   INICIO
   --------------------------------------------------------- */
function init() {
  applyColors();
  bindKanban();
  bindHealth();
  bindGlobal();
  bindNav();

  renderBriefing();
  renderKanban();
  renderStrength();
  renderRunning();
  renderProtein();
  renderAgenda();
  renderTripChecklist();
  renderTools();

  tickClock();
  tickCountdown();
  setInterval(() => { tickClock(); tickCountdown(); }, 1000);
}

document.addEventListener('DOMContentLoaded', init);
