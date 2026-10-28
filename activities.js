'use strict';
/* =========================================================
   PANEL DE VIDA · activities.js
   Actividades tipo Strava: carreras y bici con mapa (archivo GPX),
   entrada en un toque desde un atajo de iPhone, lista y gráficas.
   Las actividades se guardan en tu calendario de entrenos (trainLog),
   así cuentan como hechas y suben tu objetivo de calorías los días de carrera.
   Usa las utilidades de app.js y health.js.
   ========================================================= */

const ACT = {
  tiles: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', // se oscurece con CSS para el modo oscuro
  tilesAttribution: '&copy; OpenStreetMap',
  leafletJs: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  leafletCss: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  maxRoutePoints: 400, // el recorrido se simplifica para que la sincronización con Drive sea ligera
  listSize: 8,
};

const fmtKm = (km) => Number(km).toLocaleString('es-ES', { maximumFractionDigits: 2 });
const round2 = (v) => Math.round(v * 100) / 100;
let actMap = null;
let gpxDraft = null;
let pendingActivity = null;

/* ---------------------------------------------------------
   GEOMETRÍA · distancia, simplificado y codificación del recorrido
   --------------------------------------------------------- */
function distM(a, b) {
  const toR = Math.PI / 180;
  const dLat = (b[0] - a[0]) * toR, dLon = (b[1] - a[1]) * toR;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * toR) * Math.cos(b[0] * toR) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

function perpDist(p, a, b) {
  const x = p[1] - a[1], y = p[0] - a[0], dx = b[1] - a[1], dy = b[0] - a[0];
  const len = dx * dx + dy * dy;
  if (!len) return Math.hypot(x, y);
  const t = Math.max(0, Math.min(1, (x * dx + y * dy) / len));
  return Math.hypot(x - t * dx, y - t * dy);
}

// Douglas-Peucker sin recursión
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    let maxD = 0, idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = perpDist(pts[i], pts[s], pts[e]);
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > tol && idx > 0) { keep[idx] = 1; stack.push([s, idx], [idx, e]); }
  }
  return pts.filter((_, i) => keep[i]);
}

function simplifyTo(pts, max) {
  let tol = 0.00002, out = simplify(pts, tol);
  while (out.length > max) { tol *= 1.6; out = simplify(pts, tol); }
  return out;
}

// Algoritmo de polilínea de Google (compacto para guardar el recorrido)
function encodePolyline(points) {
  let out = '', pLat = 0, pLon = 0;
  const enc = (v) => {
    let x = v < 0 ? ~(v << 1) : v << 1, s = '';
    while (x >= 0x20) { s += String.fromCharCode((0x20 | (x & 0x1f)) + 63); x >>= 5; }
    return s + String.fromCharCode(x + 63);
  };
  points.forEach(([lat, lon]) => {
    const a = Math.round(lat * 1e5), b = Math.round(lon * 1e5);
    out += enc(a - pLat) + enc(b - pLon);
    pLat = a; pLon = b;
  });
  return out;
}

function decodePolyline(str = '') {
  const pts = [];
  let i = 0, lat = 0, lon = 0;
  const dec = () => {
    let r = 0, s = 0, b;
    do { b = str.charCodeAt(i++) - 63; r |= (b & 0x1f) << s; s += 5; } while (b >= 0x20);
    return (r & 1) ? ~(r >> 1) : (r >> 1);
  };
  while (i < str.length) { lat += dec(); lon += dec(); pts.push([lat / 1e5, lon / 1e5]); }
  return pts;
}

const sampleSeries = (values, n) => {
  const vals = values.filter((v) => v != null);
  if (vals.length < 2) return null;
  return Array.from({ length: n }, (_, i) => Math.round(vals[Math.round((i * (vals.length - 1)) / (n - 1))]));
};

/* ---------------------------------------------------------
   LECTURA DE GPX
   --------------------------------------------------------- */
function parseGpx(text) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('El archivo no es un GPX válido.');
  let nodes = [...doc.getElementsByTagName('trkpt')];
  if (nodes.length < 2) nodes = [...doc.getElementsByTagName('rtept')];
  const child = (n, tag) => n.getElementsByTagName(tag)[0]?.textContent;
  const pts = nodes.map((n) => {
    const hr = n.getElementsByTagNameNS('*', 'hr')[0];
    return {
      lat: Number(n.getAttribute('lat')), lon: Number(n.getAttribute('lon')),
      ele: child(n, 'ele') != null ? Number(child(n, 'ele')) : null,
      t: child(n, 'time') ? Date.parse(child(n, 'time')) : null,
      hr: hr ? Number(hr.textContent) : null,
    };
  }).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));
  if (pts.length < 2) throw new Error('El GPX no tiene puntos de recorrido.');

  // Distancia, tiempo en movimiento (sin paradas) y desnivel positivo
  let total = 0, moving = 0, gain = 0, lastEle = pts[0].ele;
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    const d = distM([pts[i - 1].lat, pts[i - 1].lon], [pts[i].lat, pts[i].lon]);
    total += d;
    cum.push(total);
    const dt = pts[i].t && pts[i - 1].t ? (pts[i].t - pts[i - 1].t) / 1000 : 0;
    if (dt > 0 && dt < 120 && d / dt > 0.6) moving += dt;
    if (pts[i].ele != null) {
      if (lastEle == null) lastEle = pts[i].ele;
      const de = pts[i].ele - lastEle;
      if (Math.abs(de) >= 3) { if (de > 0) gain += de; lastEle = pts[i].ele; } // filtra el ruido del GPS
    }
  }
  const hasTime = !!(pts[0].t && pts.at(-1).t);
  const elapsed = hasTime ? (pts.at(-1).t - pts[0].t) / 1000 : 0;
  if (!moving) moving = elapsed;
  const km = total / 1000;
  const kmh = moving ? km / (moving / 3600) : 0;
  const typeText = (doc.getElementsByTagName('type')[0]?.textContent || '').toLowerCase();
  const type = /bik|cycl|ride|bici/.test(typeText) ? 'bike'
    : /run|correr|carrera|walk/.test(typeText) ? 'run'
    : kmh > 14 ? 'bike' : 'run';

  // Parciales: cada km corriendo, cada 5 km en bici (tiempo real, con paradas)
  const splitLen = type === 'bike' ? 5000 : 1000;
  const splits = [];
  if (hasTime) {
    let next = splitLen, lastT = pts[0].t;
    for (let i = 1; i < pts.length; i++) {
      while (cum[i] >= next) {
        const f = (next - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
        const tAt = pts[i - 1].t + f * (pts[i].t - pts[i - 1].t);
        splits.push(Math.round((tAt - lastT) / 1000));
        lastT = tAt;
        next += splitLen;
      }
    }
  }
  const hrs = pts.map((p) => p.hr).filter((v) => v > 0);
  return {
    name: child(doc, 'name')?.trim() || '',
    type, km: round2(km), sec: Math.round(moving), elapsed: Math.round(elapsed),
    elev: Math.round(gain), hr: hrs.length ? Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length) : null,
    start: hasTime ? new Date(pts[0].t) : null,
    route: encodePolyline(simplifyTo(pts.map((p) => [p.lat, p.lon]), ACT.maxRoutePoints)),
    eleProfile: sampleSeries(pts.map((p) => p.ele), 60),
    splits, splitLen,
  };
}

// Calorías aproximadas si no vienen del reloj: correr ≈ 1 kcal/kg/km; bici según velocidad (MET)
function estimateKcal(type, km, sec) {
  const w = profile?.weight || 70;
  if (type === 'run') return Math.round(w * km);
  const h = sec / 3600;
  const v = h ? km / h : 0;
  const met = v < 16 ? 4 : v < 19 ? 6 : v < 22 ? 8 : v < 25 ? 10 : 12;
  return Math.round(met * w * h);
}

const defaultTitle = (type, date) => {
  const h = (date || new Date()).getHours();
  const part = h < 12 ? 'por la mañana' : h < 20 ? 'por la tarde' : 'por la noche';
  return `${type === 'bike' ? 'Bici' : 'Carrera'} ${part}`;
};

/* ---------------------------------------------------------
   DATOS · todas tus actividades (carreras y bici con km)
   --------------------------------------------------------- */
function allActivities() {
  const list = [];
  Object.entries(trainLog).forEach(([key, entries]) => entries.forEach((e) => {
    if ((e.type === 'run' || e.type === 'bike') && e.done && e.km) list.push({ key, e });
  }));
  return list.sort((a, b) => (b.key + (b.e.startTime || '')).localeCompare(a.key + (a.e.startTime || '')));
}

const speedOf = (e) => (e.sec ? e.km / (e.sec / 3600) : 0);
const actStats = (e) => [
  `${fmtKm(e.km)} km`,
  e.sec ? fmtDuration(e.sec) : '',
  e.sec ? (e.type === 'bike' ? `${round1(speedOf(e)).toLocaleString('es-ES')} km/h` : `${fmtPace(e.sec / e.km)} /km`) : '',
  e.kcal ? `${e.kcal} kcal${e.kcalEst ? '*' : ''}` : '',
].filter(Boolean).join(' · ');

// Miniatura del recorrido en SVG (sin mapa de fondo, como la lista de Strava)
function routeSvg(route, cls = 'act-thumb') {
  const pts = decodePolyline(route);
  if (pts.length < 2) return '';
  const lats = pts.map((p) => p[0]), lons = pts.map((p) => p[1]);
  const k = Math.cos(((Math.min(...lats) + Math.max(...lats)) / 2) * Math.PI / 180);
  const minX = Math.min(...lons) * k, maxX = Math.max(...lons) * k, minY = Math.min(...lats), maxY = Math.max(...lats);
  const W = 100, H = 70, pad = 6;
  const s = Math.min((W - 2 * pad) / ((maxX - minX) || 1e-9), (H - 2 * pad) / ((maxY - minY) || 1e-9));
  const ox = (W - (maxX - minX) * s) / 2, oy = (H - (maxY - minY) * s) / 2;
  const d = pts.map(([la, lo]) => `${(ox + (lo * k - minX) * s).toFixed(1)},${(oy + (maxY - la) * s).toFixed(1)}`).join(' ');
  return `<svg class="${cls}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><polyline points="${d}"/></svg>`;
}

/* ---------------------------------------------------------
   RENDER · panel de Actividades
   --------------------------------------------------------- */
function renderActivities() {
  const all = allActivities();
  const byType = (t) => all.filter((a) => a.e.type === t).map((a) => ({ ...a.e, date: a.key })).reverse(); // antiguas → nuevas
  const runs = byType('run'), bikes = byType('bike');
  const weekStart = dateKey(mondayOf()), month = TODAY.slice(0, 7);
  const sumKm = (arr, from) => arr.filter((r) => r.date >= from).reduce((s, r) => s + r.km, 0);
  const monthKm = (arr) => arr.filter((r) => r.date.slice(0, 7) === month).reduce((s, r) => s + r.km, 0);

  const chart = (arr, label) => {
    const last = arr.slice(-10);
    const maxKm = Math.max(...last.map((r) => r.km), 1);
    return `<div class="pace-chart">${last.map((r) => {
      const d = parseKey(r.date);
      return `<div class="col" title="${esc(entryTitle(r))} · ${fmtKm(r.km)} km">
        <em>${label(r)}</em>
        <i style="height:${Math.max(6, (r.km / maxKm) * 64)}px"></i>
        <small>${d.getDate()}/${d.getMonth() + 1}</small>
      </div>`;
    }).join('')}</div>`;
  };

  let html = '';
  if (runs.length || !bikes.length) {
    const recent = runs.slice(-5);
    const avg = recent.filter((r) => r.sec).length
      ? recent.filter((r) => r.sec).reduce((s, r) => s + r.sec, 0) / recent.filter((r) => r.sec).reduce((s, r) => s + r.km, 0) : 0;
    const last = runs.at(-1);
    html += `
      <div class="act-section" style="--c:var(--c-viaje)">
        <div class="act-section-head"><span>🏃 Carrera</span><span class="muted small">${fmtKm(round1(sumKm(runs, weekStart)))} km semana · ${fmtKm(round1(monthKm(runs)))} mes</span></div>
        <div class="run-kpis">
          <div class="kpi"><b>${last?.sec ? fmtPace(last.sec / last.km) : '—'}</b><span>Último ritmo /km</span></div>
          <div class="kpi"><b>${avg ? fmtPace(avg) : '—'}</b><span>Media últimas 5</span></div>
          <div class="kpi"><b>${runs.length}</b><span>Carreras</span></div>
        </div>
        ${runs.length ? chart(runs, (r) => (r.sec ? fmtPace(r.sec / r.km) : `${fmtKm(r.km)}`)) : '<p class="muted small">Aún no hay carreras. Súbelas con un GPX, el atajo o a mano.</p>'}
      </div>`;
  }
  if (bikes.length) {
    const last = bikes.at(-1);
    html += `
      <div class="act-section" style="--c:var(--c-proyecto)">
        <div class="act-section-head"><span>🚴 Bici</span><span class="muted small">${Math.round(sumKm(bikes, weekStart))} km semana · ${Math.round(monthKm(bikes))} mes</span></div>
        <div class="run-kpis">
          <div class="kpi"><b>${last?.sec ? round1(speedOf(last)).toLocaleString('es-ES') : '—'}</b><span>Última km/h</span></div>
          <div class="kpi"><b>${fmtKm(round1(last.km))}</b><span>Última km</span></div>
          <div class="kpi"><b>${bikes.length}</b><span>Salidas</span></div>
        </div>
        ${chart(bikes, (r) => (r.sec ? `${Math.round(speedOf(r))}` : `${Math.round(r.km)}`))}
      </div>`;
  }
  $('#actCharts').innerHTML = html;

  $('#actList').innerHTML = all.length ? all.slice(0, ACT.listSize).map(({ key, e }) => {
    const d = parseKey(key);
    const when = `${capitalize(d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }))}${e.startTime ? ` · ${e.startTime}` : ''}`;
    return `
      <li class="act-item" data-act-key="${key}" data-act-id="${e.id}" style="--c:var(--c-${TYPES[e.type].color})" tabindex="0" role="button">
        ${e.route ? routeSvg(e.route) : `<span class="act-thumb act-icon">${TYPES[e.type].emoji}</span>`}
        <span class="act-body">
          <b>${esc(entryTitle(e))}</b>
          <span class="muted small">${when}</span>
          <span class="act-line">${esc(actStats(e))}</span>
        </span>
      </li>`;
  }).join('') : '';
}

/* ---------------------------------------------------------
   FICHA DE UNA ACTIVIDAD · mapa, datos, parciales y desnivel
   --------------------------------------------------------- */
function loadLeaflet() {
  if (window.L) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = ACT.leafletCss;
    document.head.append(css);
    const js = document.createElement('script');
    js.src = ACT.leafletJs;
    js.onload = resolve;
    js.onerror = () => reject(new Error('No se pudo cargar el mapa'));
    document.head.append(js);
  });
}

function openActivity(key, id) {
  const e = (trainLog[key] || []).find((x) => x.id === id);
  if (!e) return;
  const dialog = $('#activityDialog');
  dialog.dataset.key = key;
  dialog.dataset.id = id;
  const d = parseKey(key);
  $('#actTitle').textContent = entryTitle(e);
  $('#actMeta').textContent = [
    capitalize(d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })),
    e.startTime, TYPES[e.type].label,
    e.source === 'gpx' ? 'GPX' : e.source === 'atajo' ? 'Atajo de iPhone' : 'A mano',
  ].filter(Boolean).join(' · ');

  const stat = (v, l) => (v ? `<div class="kpi"><b>${v}</b><span>${l}</span></div>` : '');
  $('#actStats').innerHTML = `
    ${stat(`${fmtKm(e.km)}`, 'km')}
    ${stat(e.sec && fmtDuration(e.sec), 'en movimiento')}
    ${stat(e.sec && (e.type === 'bike' ? round1(speedOf(e)).toLocaleString('es-ES') : fmtPace(e.sec / e.km)), e.type === 'bike' ? 'km/h' : 'ritmo /km')}
    ${stat(e.kcal && `${e.kcal}${e.kcalEst ? '*' : ''}`, 'kcal')}
    ${stat(e.elev != null && e.route ? `${e.elev} m` : '', 'desnivel +')}
    ${stat(e.hr, 'ppm media')}`;
  $('#actNote').textContent = e.kcalEst ? '* Calorías estimadas con tu peso. ' : '';

  // Desnivel
  const prof = e.eleProfile;
  if (prof?.length > 1) {
    const min = Math.min(...prof), max = Math.max(...prof), span = (max - min) || 1;
    const pts = prof.map((v, i) => `${((i / (prof.length - 1)) * 300).toFixed(1)},${(55 - ((v - min) / span) * 45).toFixed(1)}`);
    $('#actElev').innerHTML = `
      <div class="act-sub">Altitud <span class="muted small">${Math.round(min)}–${Math.round(max)} m</span></div>
      <svg class="act-elev" viewBox="0 0 300 60" preserveAspectRatio="none"><polygon points="0,60 ${pts.join(' ')} 300,60"/><polyline points="${pts.join(' ')}"/></svg>`;
  } else $('#actElev').innerHTML = '';

  // Parciales
  if (e.splits?.length) {
    const len = (e.splitLen || 1000) / 1000;
    const best = Math.min(...e.splits);
    const maxS = Math.max(...e.splits);
    $('#actSplits').innerHTML = `
      <div class="act-sub">Parciales <span class="muted small">cada ${len} km</span></div>
      <table class="splits">${e.splits.map((s, i) => `
        <tr class="${s === best ? 'is-best' : ''}">
          <td>${(i + 1) * len}</td>
          <td>${e.type === 'bike' ? `${round1(len / (s / 3600)).toLocaleString('es-ES')} km/h` : `${fmtPace(s / len)} /km`}</td>
          <td class="split-bar"><i style="width:${Math.round((best / s) * 100)}%"></i></td>
          <td class="muted">${fmtDuration(s)}</td>
        </tr>`).join('')}</table>
      ${maxS ? '' : ''}`;
  } else $('#actSplits').innerHTML = '';

  const mapBox = $('#actMap');
  mapBox.hidden = !e.route;
  $('#actNoMap').hidden = !!e.route;
  dialog.showModal();
  if (e.route) {
    loadLeaflet().then(() => {
      if (actMap) actMap.remove();
      const pts = decodePolyline(e.route);
      actMap = L.map(mapBox, { zoomControl: false, attributionControl: true, scrollWheelZoom: false });
      L.tileLayer(ACT.tiles, { attribution: ACT.tilesAttribution, maxZoom: 19 }).addTo(actMap);
      const color = getComputedStyle(document.documentElement).getPropertyValue(`--c-${TYPES[e.type].color}`).trim() || '#6ec7dd';
      const line = L.polyline(pts, { color, weight: 4, opacity: 0.95 }).addTo(actMap);
      L.circleMarker(pts[0], { radius: 5, color: '#63cfa5', fillOpacity: 1 }).addTo(actMap);
      L.circleMarker(pts.at(-1), { radius: 5, color: '#ee7f8d', fillOpacity: 1 }).addTo(actMap);
      actMap.fitBounds(line.getBounds(), { padding: [20, 20] });
      setTimeout(() => actMap.invalidateSize(), 60);
    }).catch(() => { mapBox.hidden = true; $('#actNoMap').hidden = false; $('#actNoMap').textContent = 'No se pudo cargar el mapa (¿sin conexión?).'; });
  }
}

/* ---------------------------------------------------------
   GUARDAR UNA ACTIVIDAD (GPX, atajo o a mano)
   --------------------------------------------------------- */
function saveActivity(key, entry) {
  // Evita duplicados: mismo día, mismo tipo, misma distancia y duración
  const dup = (trainLog[key] || []).find((x) => x.type === entry.type && Math.abs((x.km || 0) - entry.km) < 0.05
    && Math.abs((x.sec || 0) - (entry.sec || 0)) < 30);
  if (dup && !confirm('Ya tienes una actividad casi igual ese día. ¿Guardarla de todas formas?')) return null;
  // Si ese día había una carrera/bici planificada sin hacer, se sustituye por esta
  const list = (trainLog[key] || []).filter((x) => !(x.type === entry.type && !x.done && !x.km));
  const planned = (trainLog[key] || []).find((x) => x.type === entry.type && !x.done && !x.km);
  if (planned?.routineId) entry.routineId = planned.routineId;
  trainLog = { ...trainLog, [key]: [...list, entry] };
  saveTrainLog();
  refreshTraining();
  return entry;
}

/* ---------------------------------------------------------
   ATAJO DE IPHONE · #actividad?tipo=run&km=5,2&min=31&kcal=410
   El fragmento (#) nunca se envía a ningún servidor.
   --------------------------------------------------------- */
function readActivityFromUrl() {
  const m = location.hash.match(/^#actividad\?(.+)$/);
  if (!m) return null;
  history.replaceState(null, '', location.pathname + location.search);
  const q = new URLSearchParams(m[1]);
  const num = (k) => parseFloat(String(q.get(k) || '').replace(',', '.').replace(/[^\d.]/g, ''));
  const type = /bike|bici|cycl/i.test(q.get('tipo') || '') ? 'bike' : 'run';
  const rawKm = num('km'), min = num('min'), kcal = num('kcal');
  const km = rawKm > 300 ? rawKm / 1000 : rawKm; // por si Salud lo manda en metros
  if (!(km > 0)) { alert('El atajo no ha enviado los kilómetros. Revisa la acción de distancia.'); return null; }
  return { type, km: round2(km), sec: min > 0 ? Math.round(min * 60) : 0, kcal: kcal > 0 ? Math.round(kcal) : 0, title: (q.get('titulo') || '').slice(0, 60) };
}

function runPendingActivity() {
  if (!pendingActivity) return;
  const a = pendingActivity;
  pendingActivity = null;
  const start = new Date(Date.now() - a.sec * 1000);
  const label = `${a.type === 'bike' ? 'Bici' : 'Carrera'} de ${fmtKm(a.km)} km${a.sec ? ` en ${fmtDuration(a.sec)}` : ''}${a.kcal ? ` · ${a.kcal} kcal` : ''}`;
  if (!confirm(`¿Guardar esta actividad de hoy?\n\n${label}`)) return;
  const entry = saveActivity(dateKey(start), {
    id: uid(), type: a.type, title: a.title || defaultTitle(a.type, start), done: true,
    km: a.km, sec: a.sec || undefined, kcal: a.kcal || estimateKcal(a.type, a.km, a.sec), kcalEst: !a.kcal,
    startTime: fmtHour(start), source: 'atajo',
  });
  if (entry) openActivity(dateKey(start), entry.id);
}

/* ---------------------------------------------------------
   SUBIR GPX · vista previa antes de guardar
   --------------------------------------------------------- */
function openGpxPreview(data) {
  gpxDraft = data;
  const start = data.start || new Date();
  $('#gpxThumb').innerHTML = routeSvg(data.route, 'act-thumb act-thumb-lg');
  $('#gpxTitle').value = data.name || defaultTitle(data.type, start);
  $('#gpxType').value = data.type;
  $('#gpxDate').value = dateKey(start);
  $('#gpxSummary').textContent = [
    `${fmtKm(data.km)} km`, data.sec ? fmtDuration(data.sec) : 'sin tiempos',
    data.elev ? `${data.elev} m de desnivel` : '', data.hr ? `${data.hr} ppm` : '',
  ].filter(Boolean).join(' · ');
  $('#gpxDialog').showModal();
}

function bindActivities() {
  $('#gpxFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      openGpxPreview(parseGpx(await file.text()));
    } catch (err) {
      alert(err.message || 'No se pudo leer el archivo.');
    }
  });
  $('#gpxForm').addEventListener('submit', (e) => {
    if (e.submitter?.value !== 'save' || !gpxDraft) return;
    const g = gpxDraft;
    const type = $('#gpxType').value;
    const key = $('#gpxDate').value || TODAY;
    const entry = saveActivity(key, {
      id: uid(), type, title: $('#gpxTitle').value.trim() || defaultTitle(type, g.start), done: true,
      km: g.km, sec: g.sec || undefined, kcal: estimateKcal(type, g.km, g.sec), kcalEst: true,
      elev: g.elev, hr: g.hr || undefined, route: g.route, eleProfile: g.eleProfile || undefined,
      splits: g.splits?.length ? g.splits : undefined, splitLen: type === 'bike' ? 5000 : 1000,
      startTime: g.start ? fmtHour(g.start) : '', source: 'gpx',
    });
    gpxDraft = null;
    if (entry) setTimeout(() => openActivity(key, entry.id), 50);
  });

  const open = (li) => li && openActivity(li.dataset.actKey, li.dataset.actId);
  $('#actList').addEventListener('click', (e) => open(e.target.closest('.act-item')));
  $('#actList').addEventListener('keydown', (e) => { if (e.key === 'Enter') open(e.target.closest('.act-item')); });

  $('#actDelete').addEventListener('click', () => {
    const dialog = $('#activityDialog');
    if (!confirm('¿Borrar esta actividad?')) return;
    const { key, id } = dialog.dataset;
    trainLog = { ...trainLog, [key]: (trainLog[key] || []).filter((x) => x.id !== id) };
    if (!trainLog[key].length) delete trainLog[key];
    saveTrainLog();
    dialog.close();
    refreshTraining();
  });
  $('#activityDialog').addEventListener('close', () => { if (actMap) { actMap.remove(); actMap = null; } });

  $('#shortcutHelp').addEventListener('click', () => $('#shortcutDialog').showModal());
  $('#shortcutUrl').textContent = `${location.origin}${location.pathname}#actividad?tipo=run&km=KM&min=MINUTOS&kcal=KCAL`;
}
