'use strict';
/* =========================================================
   PANEL DE VIDA · health.js
   Rutina semanal editable, calendario de entrenos, rodillas,
   running (con Strava) y diario de comidas con calorías.
   Tus datos personales (peso, altura, dolor, comidas…) NO están
   en este archivo: se guardan en tu navegador y en tu Drive privado.
   Usa las utilidades de app.js ($, esc, store, dateKey, addDays…).
   ========================================================= */

const HEALTH = {
  // Plan de vuelta a correr: km de cada paso, salidas sin dolor para subir de paso y dolor máximo (0–10)
  knee: { start: '2026-10-22', steps: [1, 2, 3, 3.5], runsPerStep: 2, painLimit: 3 },
  pace: { min: 5 * 60 + 45, max: 6 * 60 }, // ritmo objetivo 5:45–6:00 /km
  stravaDays: 120,                          // días de historial que se piden a Strava
};

const KINDS = { gym: 'Gimnasio', run: 'Running', bike: 'Bici', rest: 'Descanso' };
const KIND_COLOR = { gym: 'salud', run: 'viaje', bike: 'proyecto', rest: 'personal' };
const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MEAL_NAMES = ['Desayuno', 'Comida', 'Merienda', 'Cena', 'Snack'];

const DEFAULT_ROUTINE = {
  days: { 0: 'bike', 1: 'upper', 2: 'run', 3: 'legs', 4: 'bike', 5: 'upper', 6: 'run' },
  workouts: {
    upper: {
      label: 'Tren superior', kind: 'gym',
      items: [
        { name: 'Press banca', sets: '4×8' },
        { name: 'Dominadas', sets: '4×6' },
        { name: 'Press militar', sets: '3×10' },
        { name: 'Remo con barra', sets: '4×8' },
        { name: 'Fondos', sets: '3×12' },
      ],
    },
    legs: {
      label: 'Piernas', kind: 'gym',
      items: [
        { name: 'Sentadilla', sets: '4×6' },
        { name: 'Peso muerto rumano', sets: '3×8' },
        { name: 'Prensa', sets: '3×12' },
        { name: 'Zancadas', sets: '3×10' },
        { name: 'Gemelos', sets: '4×15' },
      ],
    },
    run: { label: 'Running', kind: 'run', items: [] },
    bike: { label: 'Bici', kind: 'bike', items: [] },
    rest: { label: 'Descanso activo', kind: 'rest', items: [] },
  },
};

// Ejemplo mientras no conectes Strava ni registres carreras
const DEFAULT_RUNS = [
  { date: dateKey(addDays(-9)), km: 6.2, sec: 39 * 60 + 40 },
  { date: dateKey(addDays(-6)), km: 5.0, sec: 31 * 60 + 5 },
  { date: dateKey(addDays(-3)), km: 5.5, sec: 33 * 60 + 50 },
];

/* Alimentos comunes · valores aproximados por 100 g (kcal, proteína, hidratos, grasa).
   u = ración típica en gramos. Para productos envasados usa la búsqueda de Open Food Facts. */
const FOOD_DB = [
  { n: 'Pechuga de pollo (cocinada)', kcal: 165, p: 31, c: 0, f: 3.6 },
  { n: 'Pechuga de pollo (cruda)', kcal: 120, p: 22.5, c: 0, f: 2.6 },
  { n: 'Pechuga de pavo (fiambre)', kcal: 100, p: 18, c: 2.5, f: 2 },
  { n: 'Ternera magra', kcal: 143, p: 21, c: 0, f: 6 },
  { n: 'Carne picada mixta', kcal: 250, p: 17, c: 0, f: 20 },
  { n: 'Jamón serrano', kcal: 241, p: 31, c: 0, f: 13 },
  { n: 'Salmón', kcal: 208, p: 20, c: 0, f: 13 },
  { n: 'Merluza', kcal: 86, p: 17, c: 0, f: 2 },
  { n: 'Atún al natural (lata)', kcal: 116, p: 26, c: 0, f: 1, u: { label: '1 lata', g: 56 } },
  { n: 'Huevo entero', kcal: 143, p: 12.6, c: 0.7, f: 9.5, u: { label: '1 huevo', g: 60 } },
  { n: 'Claras de huevo', kcal: 52, p: 10.9, c: 0.7, f: 0.2 },
  { n: 'Yogur griego natural', kcal: 97, p: 9, c: 3.9, f: 5, u: { label: '1 yogur', g: 125 } },
  { n: 'Yogur griego 0%', kcal: 59, p: 10, c: 3.6, f: 0.4, u: { label: '1 yogur', g: 125 } },
  { n: 'Queso fresco batido 0%', kcal: 46, p: 8, c: 3.6, f: 0.2 },
  { n: 'Queso curado', kcal: 390, p: 26, c: 0.5, f: 32 },
  { n: 'Leche semidesnatada', kcal: 46, p: 3.3, c: 4.8, f: 1.6, u: { label: '1 vaso', g: 250 } },
  { n: 'Proteína whey (polvo)', kcal: 400, p: 80, c: 8, f: 6, u: { label: '1 scoop', g: 30 } },
  { n: 'Copos de avena', kcal: 389, p: 16.9, c: 66, f: 6.9 },
  { n: 'Arroz blanco (cocido)', kcal: 130, p: 2.7, c: 28, f: 0.3 },
  { n: 'Arroz blanco (crudo)', kcal: 360, p: 7, c: 79, f: 0.6 },
  { n: 'Pasta (cocida)', kcal: 158, p: 5.8, c: 31, f: 0.9 },
  { n: 'Pasta (cruda)', kcal: 371, p: 13, c: 75, f: 1.5 },
  { n: 'Pan blanco', kcal: 265, p: 9, c: 49, f: 3.2, u: { label: '1 rebanada', g: 30 } },
  { n: 'Pan integral', kcal: 247, p: 13, c: 41, f: 3.4, u: { label: '1 rebanada', g: 30 } },
  { n: 'Patata cocida', kcal: 87, p: 1.9, c: 20, f: 0.1 },
  { n: 'Boniato', kcal: 86, p: 1.6, c: 20, f: 0.1 },
  { n: 'Lentejas (cocidas)', kcal: 116, p: 9, c: 20, f: 0.4 },
  { n: 'Garbanzos (cocidos)', kcal: 164, p: 8.9, c: 27, f: 2.6 },
  { n: 'Plátano', kcal: 89, p: 1.1, c: 23, f: 0.3, u: { label: '1 plátano', g: 120 } },
  { n: 'Manzana', kcal: 52, p: 0.3, c: 14, f: 0.2, u: { label: '1 manzana', g: 180 } },
  { n: 'Naranja', kcal: 47, p: 0.9, c: 12, f: 0.1, u: { label: '1 naranja', g: 150 } },
  { n: 'Frutos rojos', kcal: 50, p: 1, c: 12, f: 0.3 },
  { n: 'Brócoli', kcal: 34, p: 2.8, c: 7, f: 0.4 },
  { n: 'Ensalada (lechuga y tomate)', kcal: 18, p: 1, c: 3.5, f: 0.2 },
  { n: 'Aguacate', kcal: 160, p: 2, c: 9, f: 15 },
  { n: 'Aceite de oliva', kcal: 884, p: 0, c: 0, f: 100, u: { label: '1 cucharada', g: 10 } },
  { n: 'Almendras', kcal: 579, p: 21, c: 22, f: 50, u: { label: 'puñado', g: 25 } },
  { n: 'Nueces', kcal: 654, p: 15, c: 14, f: 65, u: { label: 'puñado', g: 25 } },
  { n: 'Crema de cacahuete', kcal: 588, p: 25, c: 20, f: 50, u: { label: '1 cucharada', g: 15 } },
  { n: 'Chocolate negro 85%', kcal: 600, p: 11, c: 20, f: 50, u: { label: '2 onzas', g: 20 } },
  { n: 'Tortilla de patatas', kcal: 180, p: 6.5, c: 15, f: 11 },
  { n: 'Pizza', kcal: 266, p: 11, c: 33, f: 10 },
  { n: 'Cerveza', kcal: 43, p: 0.5, c: 3.6, f: 0, u: { label: '1 caña', g: 200 } },
];

/* ---------------------------------------------------------
   ESTADO
   --------------------------------------------------------- */
let routine, gymLog, kneeLog, profile, runsManual, stravaCfg, food;
let foodOffset = 0;   // 0 = hoy, -1 = ayer…
let kneeOffset = 0;
let calCursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedFood = null;
let activities = [];
let stravaSyncedAt = null;
let stravaError = null;

// Caché local que NO se sincroniza con Drive (cada dispositivo pide Strava por su cuenta)
const cache = {
  get(k) { try { return JSON.parse(localStorage.getItem(`lifedash-cache:${k}`)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(`lifedash-cache:${k}`, JSON.stringify(v)); } catch { /* sin caché */ } },
};

const foodDay = () => dateKey(addDays(foodOffset));
const kneeDay = () => dateKey(addDays(kneeOffset));

function loadHealthState() {
  routine = store.get('routine', DEFAULT_ROUTINE);
  gymLog = store.get('gymLog', {});
  kneeLog = store.get('knee', {});
  profile = store.get('profile', null);
  runsManual = store.get('runs', null); // null = nunca registraste nada → ejemplo
  stravaCfg = store.get('strava', null);
  strengthDone = store.get(`strength:${WEEK}`, {});
  food = store.get(`food:${foodDay()}`, []);
  const cached = cache.get('strava');
  if (cached?.list) { activities = cached.list; stravaSyncedAt = new Date(cached.at); }
}

/* ---------------------------------------------------------
   UTILIDADES DE ENTRENO
   --------------------------------------------------------- */
const workoutFor = (weekday) => {
  const id = routine.days[weekday];
  return { id, ...(routine.workouts[id] || routine.workouts.rest || { label: 'Descanso', kind: 'rest', items: [] }) };
};
const todayWorkout = () => workoutFor(new Date().getDay());

function kindOf(type = '') {
  if (/Run/.test(type)) return 'run';
  if (/Ride|Cycl/.test(type)) return 'bike';
  if (/Weight|Workout|Crossfit|HIIT/.test(type)) return 'gym';
  return 'other';
}
const actsOn = (key) => activities.filter((a) => a.start.slice(0, 10) === key);

function allRuns() {
  const strava = activities
    .filter((a) => kindOf(a.type) === 'run' && a.km > 0)
    .map((a) => ({ date: a.start.slice(0, 10), km: a.km, sec: a.sec, name: a.name, source: 'strava' }));
  if (!strava.length && runsManual === null) return DEFAULT_RUNS;
  return [...strava, ...(runsManual || [])].sort((a, b) => a.date.localeCompare(b.date));
}

// Peor rodilla de un día, o null si ese día no apuntaste dolor
const maxPain = (entry) => (entry && (entry.l != null || entry.r != null) ? Math.max(entry.l ?? 0, entry.r ?? 0) : null);

const paceRange = () => `${fmtPace(HEALTH.pace.min)}–${fmtPace(HEALTH.pace.max)}`;
const painClass = (v) => (v == null ? '' : v <= HEALTH.knee.painLimit ? 'ok' : v <= 6 ? 'warn' : 'bad');

/* ---------------------------------------------------------
   RODILLAS · plan de vuelta a correr
   Cada salida desde el inicio del plan cuenta si llega a la distancia del paso
   y el dolor de ese día (la peor rodilla) no supera el límite.
   --------------------------------------------------------- */
function kneeStatus() {
  const { start, steps, runsPerStep, painLimit } = HEALTH.knee;
  let step = 0, okCount = 0;
  const history = [];
  for (const r of allRuns().filter((x) => x.date >= start)) {
    if (step >= steps.length) break;
    const max = maxPain(kneeLog[r.date]);
    const target = steps[step];
    let result;
    if (max == null) result = 'sin dolor apuntado';
    else if (max > painLimit) { result = 'dolor alto'; okCount = 0; }
    else if (r.km >= target * 0.9) {
      result = 'ok';
      if (++okCount >= runsPerStep) { step++; okCount = 0; }
    } else result = 'más corta';
    history.push({ ...r, max, result, target });
  }
  const lastLogged = Object.keys(kneeLog).filter((k) => k <= TODAY && maxPain(kneeLog[k]) != null).sort().at(-1);
  const lastPain = lastLogged ? maxPain(kneeLog[lastLogged]) : null;
  return { step, okCount, done: step >= steps.length, history, lastLogged, lastPain };
}

function kneeAdvice(st = kneeStatus()) {
  const { steps, painLimit } = HEALTH.knee;
  if (TODAY < HEALTH.knee.start) return `El plan empieza el ${parseKey(HEALTH.knee.start).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}: primera salida de ${steps[0]} km a ${paceRange()} /km.`;
  if (st.done) return 'Has completado el plan. Antes de subir más kilómetros, coméntalo con tu médico o fisio.';
  const recent = st.lastLogged && daysUntil(parseKey(st.lastLogged)) >= -2;
  if (recent && st.lastPain > painLimit) {
    return `Tu último dolor fue ${st.lastPain}/10 (tu límite es ${painLimit}). Según tu plan no subas de paso: descansa o repite distancia, y si sigue, coméntalo con tu médico.`;
  }
  const km = steps[st.step];
  return todayWorkout().kind === 'run'
    ? `Hoy toca correr ${km} km a ${paceRange()} /km. Apunta el dolor al terminar y mañana por la mañana.`
    : `Próxima salida: ${km} km a ${paceRange()} /km.`;
}

/* ---------------------------------------------------------
   NUTRICIÓN · Mifflin-St Jeor
   --------------------------------------------------------- */
function nutritionTargets() {
  const p = profile;
  if (!p?.weight || !p?.height || !p?.age) return null;
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === 'f' ? -161 : 5);
  const tdee = bmr * (p.activity || 1.55);
  const kcal = Math.round(tdee - (p.deficit ?? 400));
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    deficit: p.deficit ?? 400,
    kcal,
    protein: Math.round(p.weight * (p.proteinPerKg || 1.8)),
    belowBmr: kcal < bmr,
  };
}

const sumFood = (list) => list.reduce((t, i) => ({
  kcal: t.kcal + i.kcal, p: t.p + i.p, c: t.c + i.c, f: t.f + i.f,
}), { kcal: 0, p: 0, c: 0, f: 0 });

const round1 = (v) => Math.round(v * 10) / 10;

/* ---------------------------------------------------------
   TEXTO PARA EL BRIEFING (lo usa app.js)
   --------------------------------------------------------- */
function healthBriefing() {
  const w = todayWorkout();
  const parts = [];
  if (w.kind === 'rest') parts.push('Hoy toca <strong>descanso activo</strong>.');
  else if (w.kind === 'gym') parts.push(`Hoy toca <strong>gimnasio · ${esc(w.label)}</strong> (${w.items.length} ejercicios).`);
  else if (w.kind === 'bike') parts.push('Hoy toca <strong>bici</strong>.');
  else if (w.kind === 'run') {
    const st = kneeStatus();
    parts.push(TODAY < HEALTH.knee.start
      ? `Hoy toca <strong>correr</strong>. Tu plan de rodillas empieza el ${parseKey(HEALTH.knee.start).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} con ${HEALTH.knee.steps[0]} km a ${paceRange()} /km.`
      : st.done
      ? `Hoy toca <strong>correr</strong> a ${paceRange()} /km.`
      : `Hoy toca <strong>correr ${HEALTH.knee.steps[st.step]} km</strong> a ${paceRange()} /km (paso ${st.step + 1} de ${HEALTH.knee.steps.length} del plan de rodillas).`);
  }
  if (maxPain(kneeLog[TODAY]) == null) parts.push('Recuerda apuntar el dolor de rodillas de hoy.');
  const t = nutritionTargets();
  if (t) {
    const today = sumFood(store.get(`food:${TODAY}`, []));
    parts.push(`Llevas <strong>${Math.round(today.kcal)} de ${t.kcal} kcal</strong> y ${Math.round(today.p)} de ${t.protein} g de proteína.`);
  }
  return parts.join(' ');
}

/* ---------------------------------------------------------
   RENDER · Rutina de fuerza
   --------------------------------------------------------- */
function renderStrength() {
  const today = todayWorkout();
  const gyms = Object.entries(routine.workouts).filter(([, w]) => w.kind === 'gym');
  if (!gyms.length) {
    $('#strength').innerHTML = '<p class="muted small">No tienes entrenamientos de gimnasio. Añádelos en «Editar rutina».</p>';
    return;
  }
  $('#strength').innerHTML = gyms.map(([id, w]) => {
    const done = strengthDone[id] || [];
    const pct = w.items.length ? Math.round((done.length / w.items.length) * 100) : 0;
    const days = Object.entries(routine.days).filter(([, wid]) => wid === id).map(([d]) => WEEKDAYS[d].slice(0, 3)).join(' · ');
    return `
      <div class="routine ${today.id === id ? 'is-today' : ''}" data-routine="${id}">
        <div class="routine-head">
          <span>${esc(w.label)}</span>
          ${today.id === id ? tagHTML('salud', 'Hoy') : `<span class="muted small">${days}</span>`}
          <span class="muted small">${done.length}/${w.items.length}</span>
        </div>
        <div class="bar" style="--c:var(--c-salud)"><span style="--p:${pct}%"></span></div>
        <ul class="checklist">
          ${w.items.map((it, i) => `
            <li><label class="check">
              <input type="checkbox" data-i="${i}" ${done.includes(i) ? 'checked' : ''}>
              <span>${esc(it.name)}</span><em>${esc(it.sets)}</em>
            </label></li>`).join('')}
        </ul>
      </div>`;
  }).join('');
}

/* ---------------------------------------------------------
   RENDER · Running
   --------------------------------------------------------- */
function renderRunning() {
  const runs = allRuns();
  const last = runs.at(-1);
  const recent = runs.slice(-5);
  const avgPace = recent.length ? recent.reduce((s, r) => s + r.sec, 0) / recent.reduce((s, r) => s + r.km, 0) : 0;
  const weekKm = runs.filter((r) => parseKey(r.date) >= mondayOf()).reduce((s, r) => s + r.km, 0);
  const lastPace = last ? last.sec / last.km : 0;
  // Verde: dentro del ritmo o más suave. Ámbar: más rápido de lo planeado.
  const paceCls = (p) => (!p ? '' : p < HEALTH.pace.min ? 'warn' : 'ok');

  $('#runTag').textContent = `Ritmo ${paceRange()} /km`;
  $('#runSource').innerHTML = stravaCfg?.url
    ? (stravaError
      ? `<span class="bad-text">Strava: ${esc(stravaError)}</span> · <button class="link-btn" data-strava="open" type="button">Revisar</button>`
      : `Strava${stravaSyncedAt ? ` · ${fmtHour(stravaSyncedAt)}` : ' · cargando…'}`)
    : `${runsManual === null ? 'Ejemplo' : 'Manual'} · <button class="link-btn" data-strava="open" type="button">Conectar Strava</button>`;

  $('#runKpis').innerHTML = `
    <div class="kpi"><b class="${paceCls(lastPace)}">${last ? fmtPace(lastPace) : '—'}</b><span>Último ritmo /km</span></div>
    <div class="kpi"><b class="${paceCls(avgPace)}">${avgPace ? fmtPace(avgPace) : '—'}</b><span>Media últimas 5</span></div>
    <div class="kpi"><b>${weekKm.toFixed(1)}</b><span>km esta semana</span></div>`;

  // Barra más alta = más rápido. Las líneas marcan la franja de ritmo objetivo.
  const SLOW = 7 * 60 + 30, FAST = 4 * 60 + 30, MAX_H = 64;
  const hFor = (p) => clamp((SLOW - p) / (SLOW - FAST), 0.08, 1) * MAX_H;
  $('#paceChart').innerHTML = `
    ${runs.slice(-8).map((r) => {
      const p = r.sec / r.km;
      const d = parseKey(r.date);
      return `<div class="col" title="${esc(r.name || 'Carrera')} · ${r.km} km · ${fmtPace(p)} /km">
        <em>${fmtPace(p)}</em>
        <i class="${paceCls(p)}" style="height:${hFor(p)}px"></i>
        <small>${d.getDate()}/${d.getMonth() + 1}</small>
      </div>`;
    }).join('') || '<p class="muted small">Sin carreras todavía.</p>'}
    <div class="target" style="bottom:${18 + hFor(HEALTH.pace.min)}px"><span>${paceRange()}</span></div>
    <div class="target" style="bottom:${18 + hFor(HEALTH.pace.max)}px"></div>`;
}

/* ---------------------------------------------------------
   RENDER · Rodillas
   --------------------------------------------------------- */
function renderKnee() {
  const key = kneeDay();
  const entry = kneeLog[key] || {};
  const st = kneeStatus();
  const { steps, runsPerStep, painLimit } = HEALTH.knee;
  const dayLabel = kneeOffset === 0 ? 'Hoy' : kneeOffset === -1 ? 'Ayer' : parseKey(key).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const slider = (side, label) => {
    const v = entry[side];
    return `
      <label class="pain">
        <span>${label}</span>
        <input type="range" min="0" max="10" step="1" value="${v ?? 0}" data-side="${side}" class="${v == null ? 'is-empty' : ''}">
        <b class="${painClass(v)}">${v ?? '–'}</b>
      </label>`;
  };

  $('#kneePanel').innerHTML = `
    <h3>Rodillas
      <span class="day-nav">
        <button class="icon-btn" data-knee-nav="-1" type="button" aria-label="Día anterior">‹</button>
        <span>${dayLabel}</span>
        <button class="icon-btn" data-knee-nav="1" type="button" aria-label="Día siguiente" ${kneeOffset >= 0 ? 'disabled' : ''}>›</button>
      </span>
    </h3>
    <p class="muted small">Dolor de 0 (nada) a 10 (máximo). Tu límite para subir de paso: ${painLimit}.</p>
    ${slider('l', 'Izquierda')}
    ${slider('r', 'Derecha')}
    <button class="btn btn-sm btn-ghost" type="button" data-knee-zero>Sin dolor en ninguna (0 y 0)</button>
    <input type="text" class="knee-note" data-side="note" maxlength="140" placeholder="Nota (p. ej. molestia al bajar escaleras)" value="${esc(entry.note || '')}">

    <div class="steps">
      ${steps.map((km, i) => `
        <span class="step ${i < st.step ? 'is-done' : i === st.step && !st.done ? 'is-current' : ''}">
          ${km} km${i < st.step ? ' ✓' : i === st.step && !st.done ? ` · ${st.okCount}/${runsPerStep}` : ''}
        </span>`).join('')}
    </div>
    <p class="knee-advice">${esc(kneeAdvice(st))}</p>
    ${kneeChart()}
    ${st.history.length ? `<p class="muted small">Última salida del plan: ${st.history.at(-1).km} km · ${st.history.at(-1).result}.</p>` : ''}`;
}

// Últimos 28 días: dolor de cada rodilla (líneas) y km corridos (barras)
function kneeChart() {
  const W = 280, H = 90, DAYS = 28, top = 6, base = 78;
  const x = (i) => 4 + (i * (W - 8)) / (DAYS - 1);
  const y = (v) => base - (v / 10) * (base - top);
  const keys = Array.from({ length: DAYS }, (_, i) => dateKey(addDays(i - DAYS + 1)));
  const runsByDay = {};
  allRuns().forEach((r) => { runsByDay[r.date] = (runsByDay[r.date] || 0) + r.km; });
  const line = (side) => keys
    .map((k, i) => (kneeLog[k]?.[side] != null ? `${x(i).toFixed(1)},${y(kneeLog[k][side]).toFixed(1)}` : null))
    .filter(Boolean).join(' ');
  const bars = keys.map((k, i) => {
    const km = runsByDay[k];
    if (!km) return '';
    const h = Math.min(km / 10, 1) * 40;
    return `<rect x="${(x(i) - 3).toFixed(1)}" y="${(base - h).toFixed(1)}" width="6" height="${h.toFixed(1)}" rx="1.5" class="kc-run"><title>${k}: ${km.toFixed(1)} km</title></rect>`;
  }).join('');
  const limitY = y(HEALTH.knee.painLimit).toFixed(1);
  return `
    <svg class="knee-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Dolor de rodillas y kilómetros de los últimos 28 días">
      ${bars}
      <line x1="0" x2="${W}" y1="${limitY}" y2="${limitY}" class="kc-limit"/>
      <polyline points="${line('l')}" class="kc-l"/>
      <polyline points="${line('r')}" class="kc-r"/>
      <line x1="0" x2="${W}" y1="${base}" y2="${base}" class="kc-base"/>
      <text x="0" y="${H - 1}" class="kc-label">hace 4 sem.</text>
      <text x="${W}" y="${H - 1}" text-anchor="end" class="kc-label">hoy</text>
    </svg>
    <div class="legend">
      <span><i class="lg-l"></i>Izquierda</span><span><i class="lg-r"></i>Derecha</span>
      <span><i class="lg-run"></i>km</span><span><i class="lg-limit"></i>Límite ${HEALTH.knee.painLimit}</span>
    </div>`;
}

/* ---------------------------------------------------------
   RENDER · Calendario de entrenos
   --------------------------------------------------------- */
function renderCalendar() {
  const y = calCursor.getFullYear(), m = calCursor.getMonth();
  const offset = (new Date(y, m, 1).getDay() + 6) % 7; // lunes primero
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const stats = { gym: 0, gymPlanned: 0, run: 0, runKm: 0, bike: 0, bikeKm: 0 };
  const runsManualByDay = {};
  (runsManual || []).forEach((r) => { runsManualByDay[r.date] = (runsManualByDay[r.date] || 0) + r.km; });

  let cells = '<span class="cal-pad"></span>'.repeat(offset);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(y, m, d);
    const key = dateKey(date);
    const plan = workoutFor(date.getDay());
    const acts = actsOn(key);
    const did = {
      gym: !!gymLog[key] || acts.some((a) => kindOf(a.type) === 'gym'),
      run: acts.some((a) => kindOf(a.type) === 'run') || !!runsManualByDay[key],
      bike: acts.some((a) => kindOf(a.type) === 'bike'),
    };
    const past = key < TODAY;
    const counts = key <= TODAY;
    if (counts && plan.kind === 'gym') stats.gymPlanned++;
    if (did.gym) stats.gym++;
    if (did.run) { stats.run++; stats.runKm += acts.filter((a) => kindOf(a.type) === 'run').reduce((s, a) => s + a.km, 0) + (runsManualByDay[key] || 0); }
    if (did.bike) { stats.bike++; stats.bikeKm += acts.filter((a) => kindOf(a.type) === 'bike').reduce((s, a) => s + a.km, 0); }
    const missed = past && ((plan.kind === 'gym' && !did.gym) || (plan.kind === 'run' && !did.run));
    const title = [
      `${WEEKDAYS[date.getDay()]} ${d}: toca ${plan.label}`,
      ...acts.map((a) => `${a.name} (${a.km ? `${a.km} km` : fmtDuration(a.sec)})`),
      gymLog[key] ? 'Gimnasio (marcado)' : '',
    ].filter(Boolean).join('\n');
    cells += `
      <button type="button" class="cal-day ${key === TODAY ? 'is-today' : ''} ${missed ? 'is-missed' : ''} ${key > TODAY ? 'is-future' : ''}"
        data-date="${key}" title="${esc(title)}" ${key > TODAY ? 'disabled' : ''}>
        <span class="cal-num">${d}</span>
        <span class="cal-plan" style="--c:var(--c-${KIND_COLOR[plan.kind]})">${esc(plan.label)}</span>
        <span class="cal-dots">
          ${did.gym ? '<i style="--c:var(--c-salud)"></i>' : ''}${did.run ? '<i style="--c:var(--c-viaje)"></i>' : ''}${did.bike ? '<i style="--c:var(--c-proyecto)"></i>' : ''}
        </span>
      </button>`;
  }

  $('#calTitle').textContent = capitalize(calCursor.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }));
  $('#calendar').innerHTML = ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => `<span class="cal-wd">${d}</span>`).join('') + cells;
  $('#calStats').innerHTML = `
    <div class="stat" style="--c:var(--c-salud)"><b>${stats.gym}${stats.gymPlanned ? `<small>/${stats.gymPlanned}</small>` : ''}</b><span>Días de gimnasio</span><i></i></div>
    <div class="stat" style="--c:var(--c-viaje)"><b>${stats.run}</b><span>Carreras · ${stats.runKm.toFixed(1)} km</span><i></i></div>
    <div class="stat" style="--c:var(--c-proyecto)"><b>${stats.bike}</b><span>Salidas en bici · ${Math.round(stats.bikeKm)} km</span><i></i></div>`;
}

const fmtDuration = (sec) => `${Math.floor(sec / 3600) ? `${Math.floor(sec / 3600)} h ` : ''}${Math.round((sec % 3600) / 60)} min`;

/* ---------------------------------------------------------
   RENDER · Nutrición
   --------------------------------------------------------- */
function renderNutrition() {
  const t = nutritionTargets();
  const total = sumFood(food);
  const key = foodDay();

  if (!t) {
    $('#nutriSummary').innerHTML = `
      <h3>Calorías</h3>
      <p class="muted small">Pon tu peso, altura, edad, actividad y el déficit que quieres para calcular tu objetivo diario.</p>
      <button class="btn btn-primary btn-sm" type="button" data-open-profile>Poner mis datos</button>
      <p class="muted small">Llevas ${Math.round(total.kcal)} kcal y ${Math.round(total.p)} g de proteína.</p>`;
  } else {
    const left = t.kcal - total.kcal;
    const pct = clamp((total.kcal / t.kcal) * 100, 0, 100);
    const macro = (label, v, goal, cls) => `
      <div class="macro">
        <div class="muted small"><span>${label}</span><span>${Math.round(v)}${goal ? ` / ${goal}` : ''} g</span></div>
        <div class="bar" style="--c:var(--c-${cls})"><span style="--p:${goal ? clamp((v / goal) * 100, 0, 100) : 0}%"></span></div>
      </div>`;
    // Reparto orientativo del resto: 30% grasa, el resto hidratos
    const fatGoal = Math.round((t.kcal * 0.3) / 9);
    const carbGoal = Math.max(0, Math.round((t.kcal - t.protein * 4 - fatGoal * 9) / 4));
    $('#nutriSummary').innerHTML = `
      <h3>Calorías <span class="muted small">${key === TODAY ? 'hoy' : parseKey(key).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span></h3>
      <div class="kcal-big"><b>${Math.round(total.kcal)}</b><span>/ ${t.kcal} kcal</span></div>
      <div class="bar kcal-bar ${left < 0 ? 'is-over' : ''}" style="--c:var(--c-personal)"><span style="--p:${pct}%"></span></div>
      <p class="small ${left < 0 ? 'bad-text' : 'muted'}">${left >= 0 ? `Te quedan ${Math.round(left)} kcal` : `Te has pasado ${Math.round(-left)} kcal`}</p>
      ${macro('Proteína', total.p, t.protein, 'salud')}
      ${macro('Hidratos', total.c, carbGoal, 'uni')}
      ${macro('Grasas', total.f, fatGoal, 'personal')}
      <p class="muted small calc-note">Gasto estimado ${t.tdee} kcal (metabolismo basal ${t.bmr} × actividad) − déficit ${t.deficit}.
        <button class="link-btn" type="button" data-open-profile>Cambiar mis datos</button></p>
      ${t.belowBmr ? '<p class="small bad-text">Tu objetivo queda por debajo de tu metabolismo basal: es un déficit muy agresivo, sobre todo entrenando tanto. Coméntalo con un profesional.</p>' : ''}`;
  }

  $('#foodDayLabel').textContent = foodOffset === 0 ? 'Hoy' : foodOffset === -1 ? 'Ayer' : parseKey(key).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  $('[data-food-nav="1"]').disabled = foodOffset >= 0;

  if (!food.length) {
    $('#foodList').innerHTML = '<p class="muted small">Aún no has apuntado nada este día.</p>';
    return;
  }
  $('#foodList').innerHTML = MEAL_NAMES.map((meal) => {
    const items = food.filter((i) => i.meal === meal);
    if (!items.length) return '';
    const s = sumFood(items);
    return `
      <div class="meal">
        <div class="meal-head"><span>${meal}</span><span class="muted small">${Math.round(s.kcal)} kcal · ${Math.round(s.p)} g prot.</span></div>
        <ul>
          ${items.map((i) => `
            <li>
              <span class="food-name">${esc(i.name)}${i.g ? ` <em>${i.g} g</em>` : ''}</span>
              <span class="food-kcal">${Math.round(i.kcal)}</span>
              <button class="icon-btn" type="button" data-food-del="${i.id}" aria-label="Quitar">×</button>
            </li>`).join('')}
        </ul>
      </div>`;
  }).join('');
}

function renderFoodResults(list, note = '') {
  $('#foodResults').innerHTML = list.map((f, i) => `
    <li><button type="button" data-food-pick="${i}">
      <span>${esc(f.n)}${f.brand ? ` <em>${esc(f.brand)}</em>` : ''}</span>
      <span class="muted small">${Math.round(f.kcal)} kcal · ${round1(f.p)} g P /100 g</span>
    </button></li>`).join('') + (note ? `<li class="muted small">${esc(note)}</li>` : '');
  $('#foodResults')._items = list;
}

function renderSelectedFood() {
  const box = $('#foodSelected');
  if (!selectedFood) { box.hidden = true; return; }
  const f = selectedFood;
  box.hidden = false;
  box.innerHTML = `
    <div class="sel-head"><b>${esc(f.n)}</b><button class="icon-btn" type="button" data-food-clear aria-label="Quitar selección">×</button></div>
    <p class="muted small">Por 100 g: ${Math.round(f.kcal)} kcal · ${round1(f.p)} g proteína · ${round1(f.c)} g hidratos · ${round1(f.f)} g grasa</p>
    <div class="sel-row">
      <input type="number" id="foodGrams" min="1" step="1" value="${f.u?.g || 100}" aria-label="Gramos"> <span class="muted small">g</span>
      ${f.u ? `<button class="btn btn-sm btn-ghost" type="button" data-food-unit="${f.u.g}">${esc(f.u.label)} (${f.u.g} g)</button>` : ''}
      <button class="btn btn-primary btn-sm" type="submit">Añadir</button>
    </div>
    <p class="muted small" id="foodPreview"></p>`;
  updateFoodPreview();
}

function updateFoodPreview() {
  const g = Number($('#foodGrams')?.value) || 0;
  if (!selectedFood || !$('#foodPreview')) return;
  $('#foodPreview').textContent = `= ${Math.round((selectedFood.kcal * g) / 100)} kcal · ${round1((selectedFood.p * g) / 100)} g proteína`;
}

/* ---------------------------------------------------------
   EDITOR DE RUTINA
   --------------------------------------------------------- */
function renderRoutineEditor(r = routine) {
  const options = (sel) => Object.entries(r.workouts)
    .map(([id, w]) => `<option value="${id}" ${id === sel ? 'selected' : ''}>${esc(w.label)}</option>`).join('');
  $('#routineDays').innerHTML = [1, 2, 3, 4, 5, 6, 0].map((d) => `
    <label class="week-row"><span>${WEEKDAYS[d]}</span><select data-day="${d}">${options(r.days[d])}</select></label>`).join('');
  $('#routineWorkouts').innerHTML = Object.entries(r.workouts).map(([id, w]) => `
    <fieldset class="workout-edit" data-wid="${id}">
      <div class="we-row">
        <input type="text" class="we-label" value="${esc(w.label)}" maxlength="40" aria-label="Nombre del entrenamiento" required>
        <select class="we-kind" aria-label="Tipo">${Object.entries(KINDS).map(([k, l]) => `<option value="${k}" ${k === w.kind ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <button class="icon-btn" type="button" data-del-workout="${id}" aria-label="Eliminar entrenamiento">×</button>
      </div>
      <textarea class="we-items" rows="${Math.max(2, w.items.length)}" placeholder="Un ejercicio por línea: Press banca | 4×8" ${w.kind === 'gym' ? '' : 'hidden'}>${esc(w.items.map((i) => `${i.name} | ${i.sets}`).join('\n'))}</textarea>
    </fieldset>`).join('');
}

function readRoutineEditor() {
  const workouts = {};
  document.querySelectorAll('#routineWorkouts .workout-edit').forEach((fs) => {
    const kind = fs.querySelector('.we-kind').value;
    workouts[fs.dataset.wid] = {
      label: fs.querySelector('.we-label').value.trim() || 'Entrenamiento',
      kind,
      items: kind !== 'gym' ? [] : fs.querySelector('.we-items').value.split('\n').map((l) => l.trim()).filter(Boolean)
        .map((l) => { const [name, sets = ''] = l.split('|').map((s) => s.trim()); return { name, sets }; }),
    };
  });
  if (!Object.keys(workouts).length) workouts.rest = { label: 'Descanso', kind: 'rest', items: [] };
  const fallback = Object.keys(workouts).find((k) => workouts[k].kind === 'rest') || Object.keys(workouts)[0];
  const days = {};
  document.querySelectorAll('#routineDays select').forEach((s) => { days[s.dataset.day] = workouts[s.value] ? s.value : fallback; });
  return { days, workouts };
}

/* ---------------------------------------------------------
   STRAVA (a través de tu puente de Google Apps Script)
   --------------------------------------------------------- */
async function loadStrava(force = false) {
  if (!stravaCfg?.url || !stravaCfg?.key) return;
  const cached = cache.get('strava');
  if (!force && cached && Date.now() - cached.at < 10 * 60 * 1000) return;
  try {
    const after = Math.floor(startOfDay(addDays(-HEALTH.stravaDays)).getTime() / 1000);
    // text/plain evita la petición previa de CORS; la clave va en el cuerpo, no en la URL
    const res = await fetch(stravaCfg.url, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ key: stravaCfg.key, after }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error === 'unauthorized' ? 'clave incorrecta' : data.error === 'not_connected' ? 'falta autorizar Strava en el puente' : data.error);
    activities = (data.activities || []).filter((a) => a.start);
    cache.set('strava', { at: Date.now(), list: activities });
    stravaSyncedAt = new Date();
    stravaError = null;
  } catch (e) {
    stravaError = e.message === 'Failed to fetch' ? 'no se pudo conectar con el puente' : e.message;
  }
  renderHealth();
  renderBriefing();
}

/* ---------------------------------------------------------
   RENDER GLOBAL Y EVENTOS
   --------------------------------------------------------- */
function renderHealth() {
  const start = mondayOf();
  $('#weekLabel').textContent = `Semana del ${start.getDate()}/${start.getMonth() + 1}`;
  renderStrength();
  renderRunning();
  renderKnee();
  renderCalendar();
  renderNutrition();
}

function bindHealth() {
  // Rutina de fuerza: marcar un ejercicio también apunta que hoy fuiste al gimnasio
  $('#strength').addEventListener('change', (e) => {
    const id = e.target.closest('[data-routine]').dataset.routine;
    const i = Number(e.target.dataset.i);
    const list = strengthDone[id] || (strengthDone[id] = []);
    e.target.checked ? list.push(i) : list.splice(list.indexOf(i), 1);
    store.set(`strength:${WEEK}`, strengthDone);
    if (e.target.checked && !gymLog[TODAY]) { gymLog[TODAY] = true; store.set('gymLog', gymLog); }
    renderStrength();
    renderCalendar();
  });

  $('#runForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const km = parseFloat($('#runKm').value);
    const sec = parseTime($('#runTime').value);
    if (!km || !sec) return;
    runsManual = [...(runsManual || []), { date: TODAY, km, sec }];
    store.set('runs', runsManual);
    e.target.reset();
    renderHealth();
  });

  // Rodillas
  const kneePanel = $('#kneePanel');
  const saveKnee = (side, value) => {
    const key = kneeDay();
    kneeLog = { ...kneeLog, [key]: { ...(kneeLog[key] || {}), [side]: value } };
    store.set('knee', kneeLog);
  };
  kneePanel.addEventListener('input', (e) => {
    const side = e.target.dataset.side;
    if (side === 'l' || side === 'r') {
      e.target.classList.remove('is-empty');
      const b = e.target.nextElementSibling;
      b.textContent = e.target.value;
      b.className = painClass(Number(e.target.value));
    }
  });
  kneePanel.addEventListener('change', (e) => {
    const side = e.target.dataset.side;
    if (!side) return;
    saveKnee(side, side === 'note' ? e.target.value.trim() : Number(e.target.value));
    renderKnee();
    renderBriefing();
  });
  kneePanel.addEventListener('click', (e) => {
    if (e.target.closest('[data-knee-zero]')) {
      saveKnee('l', 0);
      saveKnee('r', 0);
      renderKnee();
      renderBriefing();
      return;
    }
    const nav = e.target.closest('[data-knee-nav]');
    if (!nav) return;
    kneeOffset = Math.min(0, kneeOffset + Number(nav.dataset.kneeNav));
    renderKnee();
  });

  // Calendario: tocar un día marca o desmarca que fuiste al gimnasio
  $('#calendar').addEventListener('click', (e) => {
    const day = e.target.closest('.cal-day');
    if (!day || day.disabled) return;
    const key = day.dataset.date;
    gymLog = { ...gymLog };
    if (gymLog[key]) delete gymLog[key]; else gymLog[key] = true;
    store.set('gymLog', gymLog);
    renderCalendar();
  });
  document.querySelectorAll('[data-cal-nav]').forEach((b) => b.addEventListener('click', () => {
    calCursor = new Date(calCursor.getFullYear(), calCursor.getMonth() + Number(b.dataset.calNav), 1);
    renderCalendar();
  }));

  // Editor de rutina
  const routineDialog = $('#routineDialog');
  let draft = null;
  $('#editRoutine').addEventListener('click', () => {
    draft = JSON.parse(JSON.stringify(routine));
    renderRoutineEditor(draft);
    routineDialog.showModal();
  });
  $('#routineWorkouts').addEventListener('change', (e) => {
    if (e.target.classList.contains('we-kind')) {
      e.target.closest('.workout-edit').querySelector('.we-items').hidden = e.target.value !== 'gym';
    }
  });
  $('#routineWorkouts').addEventListener('click', (e) => {
    const del = e.target.closest('[data-del-workout]');
    if (!del) return;
    draft = readRoutineEditor();
    delete draft.workouts[del.dataset.delWorkout];
    renderRoutineEditor(readRoutineFromDraft(draft));
  });
  $('#addWorkout').addEventListener('click', () => {
    draft = readRoutineEditor();
    draft.workouts[`w${uid()}`] = { label: 'Nuevo entrenamiento', kind: 'gym', items: [] };
    renderRoutineEditor(draft);
  });
  $('#saveRoutine').addEventListener('click', (e) => {
    e.preventDefault();
    routine = readRoutineEditor();
    store.set('routine', routine);
    routineDialog.close();
    renderHealth();
    renderBriefing();
  });

  // Perfil (peso, altura…)
  const profileDialog = $('#profileDialog');
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-open-profile]')) return;
    const p = profile || { sex: 'm', activity: 1.55, deficit: 400, proteinPerKg: 1.8 };
    const f = $('#profileForm');
    ['sex', 'age', 'height', 'weight', 'activity', 'deficit', 'proteinPerKg'].forEach((k) => { if (p[k] != null) f.elements[k].value = p[k]; });
    profileDialog.showModal();
  });
  $('#profileForm').addEventListener('submit', (e) => {
    if (e.submitter?.value !== 'save') return;
    const f = e.target.elements;
    profile = {
      sex: f.sex.value, age: Number(f.age.value), height: Number(f.height.value), weight: Number(f.weight.value),
      activity: Number(f.activity.value), deficit: Number(f.deficit.value), proteinPerKg: Number(f.proteinPerKg.value),
    };
    store.set('profile', profile);
    const weights = store.get('weightLog', {});
    if (weights[TODAY] !== profile.weight) store.set('weightLog', { ...weights, [TODAY]: profile.weight });
    renderNutrition();
    renderBriefing();
  });

  // Comidas: búsqueda en la lista local mientras escribes
  $('#foodSearch').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (q.length < 2) { renderFoodResults([]); return; }
    const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    renderFoodResults(FOOD_DB.filter((f) => norm(f.n).includes(q)).slice(0, 8));
  });
  $('#foodOff').addEventListener('click', async () => {
    const q = $('#foodSearch').value.trim();
    if (q.length < 2) { $('#foodSearch').focus(); return; }
    renderFoodResults([], 'Buscando en Open Food Facts…');
    try {
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=10&fields=product_name,brands,nutriments`;
      const data = await (await fetch(url)).json();
      const list = (data.products || [])
        .filter((p) => p.product_name && p.nutriments?.['energy-kcal_100g'] != null)
        .map((p) => ({
          n: p.product_name, brand: (p.brands || '').split(',')[0],
          kcal: p.nutriments['energy-kcal_100g'], p: p.nutriments.proteins_100g || 0,
          c: p.nutriments.carbohydrates_100g || 0, f: p.nutriments.fat_100g || 0,
        }));
      renderFoodResults(list, list.length ? '' : 'Sin resultados. Prueba otro nombre o añádelo a mano.');
    } catch {
      renderFoodResults([], 'No se pudo conectar con Open Food Facts.');
    }
  });
  $('#foodResults').addEventListener('click', (e) => {
    const b = e.target.closest('[data-food-pick]');
    if (!b) return;
    selectedFood = $('#foodResults')._items[Number(b.dataset.foodPick)];
    renderFoodResults([]);
    renderSelectedFood();
    $('#foodGrams')?.focus();
  });
  $('#foodSelected').addEventListener('input', updateFoodPreview);
  $('#foodSelected').addEventListener('click', (e) => {
    if (e.target.closest('[data-food-clear]')) { selectedFood = null; renderSelectedFood(); }
    const unit = e.target.closest('[data-food-unit]');
    if (unit) {
      const g = $('#foodGrams');
      g.value = (Number(g.value) === Number(unit.dataset.foodUnit) ? 0 : Number(g.value) || 0) + Number(unit.dataset.foodUnit);
      updateFoodPreview();
    }
  });
  const addFood = (item) => {
    food = [...food, { id: uid(), meal: $('#foodMeal').value, ...item }];
    store.set(`food:${foodDay()}`, food);
    renderNutrition();
    renderBriefing();
  };
  $('#foodForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!selectedFood) return;
    const g = Number($('#foodGrams').value);
    if (!g) return;
    const s = selectedFood;
    addFood({ name: s.n, g, kcal: (s.kcal * g) / 100, p: round1((s.p * g) / 100), c: round1((s.c * g) / 100), f: round1((s.f * g) / 100) });
    selectedFood = null;
    $('#foodSearch').value = '';
    renderSelectedFood();
  });
  $('#manualFood').addEventListener('click', () => {
    const name = $('#mfName').value.trim();
    const kcal = Number($('#mfKcal').value);
    if (!name || !kcal) return;
    addFood({ name, g: null, kcal, p: Number($('#mfProt').value) || 0, c: 0, f: 0 });
    ['#mfName', '#mfKcal', '#mfProt'].forEach((s) => { $(s).value = ''; });
  });
  $('#foodList').addEventListener('click', (e) => {
    const del = e.target.closest('[data-food-del]');
    if (!del) return;
    food = food.filter((i) => i.id !== del.dataset.foodDel);
    store.set(`food:${foodDay()}`, food);
    renderNutrition();
    renderBriefing();
  });
  document.querySelectorAll('[data-food-nav]').forEach((b) => b.addEventListener('click', () => {
    foodOffset = Math.min(0, foodOffset + Number(b.dataset.foodNav));
    food = store.get(`food:${foodDay()}`, []);
    renderNutrition();
  }));
  // Elegir la comida según la hora
  const h = new Date().getHours();
  $('#foodMeal').value = h < 11 ? 'Desayuno' : h < 16 ? 'Comida' : h < 19 ? 'Merienda' : 'Cena';

  // Strava
  const stravaDialog = $('#stravaDialog');
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-strava="open"]')) return;
    $('#stravaUrl').value = stravaCfg?.url || '';
    $('#stravaKey').value = stravaCfg?.key || '';
    $('#stravaStatus').textContent = stravaError ? `Último error: ${stravaError}` : stravaSyncedAt ? `Conectado · ${fmtHour(stravaSyncedAt)}` : '';
    stravaDialog.showModal();
  });
  $('#stravaForm').addEventListener('submit', (e) => {
    if (e.submitter?.value !== 'save') return;
    const url = $('#stravaUrl').value.trim();
    const key = $('#stravaKey').value.trim();
    stravaCfg = url && key ? { url, key } : null;
    store.set('strava', stravaCfg);
    stravaError = null;
    if (!stravaCfg) { activities = []; cache.set('strava', null); }
    renderHealth();
    loadStrava(true);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') loadStrava(false);
  });
}

// El editor borra un entrenamiento: los días que lo usaban pasan a descanso
function readRoutineFromDraft(d) {
  const fallback = Object.keys(d.workouts).find((k) => d.workouts[k].kind === 'rest') || Object.keys(d.workouts)[0];
  Object.keys(d.days).forEach((day) => { if (!d.workouts[d.days[day]]) d.days[day] = fallback; });
  return d;
}
