/**
 * PANEL DE VIDA · Puente Strava (Google Apps Script)
 *
 * Strava exige guardar una "clave secreta" que no puede ir en una web pública.
 * Este script la guarda en TU cuenta de Google y le pasa tus actividades al panel.
 * No contiene ningún secreto: los pones tú en las propiedades del script.
 *
 * Pasos (detallados en el README, sección «Conectar Strava»):
 *  1. En Configuración del proyecto → Propiedades del script, añade:
 *       STRAVA_CLIENT_ID      (de strava.com/settings/api)
 *       STRAVA_CLIENT_SECRET  (de strava.com/settings/api)
 *  2. Ejecuta la función setup() una vez y copia la «clave del panel» del registro.
 *  3. Implementar → Nueva implementación → Aplicación web
 *       Ejecutar como: Yo · Quién tiene acceso: Cualquier usuario
 *  4. Abre la URL de la aplicación web y pulsa «Conectar con Strava».
 *  5. En el panel: Running → Conectar Strava → pega la URL y la clave.
 */

const PROPS = PropertiesService.getScriptProperties();

function setup() {
  if (!PROPS.getProperty('PANEL_KEY')) {
    PROPS.setProperty('PANEL_KEY', Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''));
  }
  Logger.log('Clave del panel (pégala en el panel, no la compartas): ' + PROPS.getProperty('PANEL_KEY'));
  Logger.log('Siguiente paso: Implementar → Nueva implementación → Aplicación web (Ejecutar como: Yo · Acceso: Cualquier usuario).');
}

// Página para autorizar Strava y vuelta de Strava con el código de autorización
function doGet(e) {
  const p = (e && e.parameter) || {};
  const page = (html) => HtmlService.createHtmlOutput(
    '<div style="font-family:system-ui,sans-serif;max-width:420px;margin:40px auto;line-height:1.5">' + html + '</div>');

  if (p.code) {
    const expected = CacheService.getScriptCache().get('oauth_state');
    if (!expected || p.state !== expected) return page('<p>❌ El enlace ha caducado. Vuelve a abrir la URL del puente y pulsa «Conectar con Strava».</p>');
    if (String(p.scope || '').indexOf('activity:read') === -1) return page('<p>❌ Tienes que permitir que se lean tus actividades. Vuelve a intentarlo.</p>');
    exchange_({ code: p.code, grant_type: 'authorization_code' });
    return page('<p>✅ Strava conectado. Ya puedes cerrar esta pestaña y volver al panel.</p>');
  }

  if (!PROPS.getProperty('STRAVA_CLIENT_ID') || !PROPS.getProperty('STRAVA_CLIENT_SECRET')) {
    return page('<p>Falta configurar STRAVA_CLIENT_ID y STRAVA_CLIENT_SECRET en las propiedades del script.</p>');
  }
  const state = Utilities.getUuid();
  CacheService.getScriptCache().put('oauth_state', state, 600);
  const auth = 'https://www.strava.com/oauth/authorize?' + [
    'client_id=' + encodeURIComponent(PROPS.getProperty('STRAVA_CLIENT_ID')),
    'response_type=code',
    'approval_prompt=auto',
    'scope=activity:read_all',
    'state=' + state,
    'redirect_uri=' + encodeURIComponent(ScriptApp.getService().getUrl()),
  ].join('&');
  const connected = PROPS.getProperty('REFRESH_TOKEN') ? '<p>Ya está conectado. Puedes volver a autorizar si lo necesitas.</p>' : '';
  return page('<h2>Puente Strava · Panel de vida</h2>' + connected +
    '<p><a href="' + auth + '" target="_top">Conectar con Strava</a></p>');
}

// El panel pide las actividades por POST (la clave va en el cuerpo, no en la URL)
function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) { /* cuerpo vacío o inválido */ }
  if (!body.key || body.key !== PROPS.getProperty('PANEL_KEY')) return json_({ error: 'unauthorized' });
  if (!PROPS.getProperty('REFRESH_TOKEN')) return json_({ error: 'not_connected' });
  const after = Number(body.after) || Math.floor(Date.now() / 1000) - 120 * 86400;
  try {
    return json_({ activities: activities_(after) });
  } catch (err) {
    return json_({ error: String(err.message || err) });
  }
}

function token_() {
  if (Number(PROPS.getProperty('EXPIRES_AT') || 0) - 120 > Date.now() / 1000) return PROPS.getProperty('ACCESS_TOKEN');
  return exchange_({ refresh_token: PROPS.getProperty('REFRESH_TOKEN'), grant_type: 'refresh_token' });
}

function exchange_(params) {
  const res = UrlFetchApp.fetch('https://www.strava.com/oauth/token', {
    method: 'post',
    muteHttpExceptions: true,
    payload: Object.assign({
      client_id: PROPS.getProperty('STRAVA_CLIENT_ID'),
      client_secret: PROPS.getProperty('STRAVA_CLIENT_SECRET'),
    }, params),
  });
  const t = JSON.parse(res.getContentText());
  if (!t.access_token) throw new Error('Strava rechazó la autorización: ' + res.getContentText());
  PROPS.setProperties({ ACCESS_TOKEN: t.access_token, REFRESH_TOKEN: t.refresh_token, EXPIRES_AT: String(t.expires_at) });
  return t.access_token;
}

// Solo los campos que usa el panel. Caché de 10 minutos para no gastar el límite de Strava.
function activities_(after) {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'acts_' + after;
  const hit = cache.get(cacheKey);
  if (hit) return JSON.parse(hit);

  let out = [];
  for (let page = 1; page <= 3; page++) {
    const res = UrlFetchApp.fetch(
      'https://www.strava.com/api/v3/athlete/activities?per_page=100&page=' + page + '&after=' + after,
      { headers: { Authorization: 'Bearer ' + token_() }, muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) throw new Error('Strava ' + res.getResponseCode());
    const list = JSON.parse(res.getContentText());
    out = out.concat(list.map(function (a) {
      return {
        id: String(a.id),
        name: a.name,
        type: a.sport_type || a.type,
        start: a.start_date_local,
        km: Math.round(a.distance / 10) / 100,
        sec: a.moving_time,
        elev: a.total_elevation_gain,
        hr: a.average_heartrate || null,
        kcal: a.kilojoules ? Math.round(a.kilojoules) : null,
      };
    }));
    if (list.length < 100) break;
  }
  try { cache.put(cacheKey, JSON.stringify(out), 600); } catch (err) { /* demasiado grande para la caché */ }
  return out;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
