'use strict';
/* =========================================================
   PANEL DE VIDA · google.js
   Inicio de sesión con Google (Google Identity Services) para:
   1) Leer tu Google Calendar (solo lectura).
   2) Sincronizar los datos del panel entre móvil y ordenador,
      guardándolos en una carpeta oculta y privada de TU Google Drive
      (appDataFolder: solo esta app puede verla y no ocupa sitio visible).
   3) Ver tus correos no leídos de Gmail (solo remitente, asunto y fragmento;
      el permiso "metadata" no da acceso al cuerpo de los mensajes).
   No hay servidor: el token vive solo en este navegador y caduca en 1 h.
   ========================================================= */

window.GoogleSync = (() => {
  const SCOPE_LIST = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/drive.appdata',
    'https://www.googleapis.com/auth/gmail.metadata',
  ];
  const SCOPES = SCOPE_LIST.join(' ');
  const FILE_NAME = 'panel-de-vida.json';
  const DATA_PREFIX = 'lifedash:';      // lo que se sincroniza
  const META_PREFIX = 'lifedash-meta:'; // token y marcas de tiempo (solo este dispositivo)

  let opts = {};
  let tokenClient = null;
  let fileId = null;
  let pushTimer = null;
  let lastRefresh = 0;
  let applyingRemote = false;

  const meta = {
    get(k) { try { return JSON.parse(localStorage.getItem(META_PREFIX + k)); } catch { return null; } },
    set(k, v) {
      try { v == null ? localStorage.removeItem(META_PREFIX + k) : localStorage.setItem(META_PREFIX + k, JSON.stringify(v)); }
      catch { /* sin almacenamiento */ }
    },
  };

  const hhmm = () => new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const status = (state, text) => opts.onStatus?.(state, text);
  const token = () => {
    const t = meta.get('token');
    return t && t.expiresAt > Date.now() + 60000 ? t.value : null;
  };
  // ¿El permiso concedido incluye todo lo que pide esta versión? (p. ej. Gmail añadido después)
  const missingScopes = () => {
    const granted = (meta.get('token')?.scope || '').split(' ');
    return SCOPE_LIST.some((s) => !granted.includes(s));
  };
  const idleStatus = () => (meta.get('connected')
    ? status('expired', 'Reconectar Google')
    : status('off', 'Conectar Google'));

  async function api(url, init = {}) {
    const t = token();
    if (!t) throw new Error('no-token');
    const res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${t}`, ...(init.headers || {}) } });
    if (res.status === 401) { meta.set('token', null); throw new Error('no-token'); }
    if (!res.ok) throw new Error(`HTTP ${res.status} · ${url.split('?')[0]}`);
    return res.status === 204 ? null : res.json();
  }

  function handleError(e) {
    if (e.message === 'no-token') { idleStatus(); return; }
    console.error('[GoogleSync]', e);
    status('error', 'Error al sincronizar');
  }

  /* ---------- Sincronización con Google Drive ---------- */
  function snapshot() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k.startsWith(DATA_PREFIX)) continue;
      try { data[k.slice(DATA_PREFIX.length)] = JSON.parse(localStorage.getItem(k)); } catch { /* ignora */ }
    }
    return { updatedAt: meta.get('localUpdatedAt') || 0, data };
  }

  function applyRemote(remote) {
    applyingRemote = true;
    Object.keys(localStorage).filter((k) => k.startsWith(DATA_PREFIX)).forEach((k) => localStorage.removeItem(k));
    Object.entries(remote.data || {}).forEach(([k, v]) => localStorage.setItem(DATA_PREFIX + k, JSON.stringify(v)));
    meta.set('localUpdatedAt', remote.updatedAt);
    applyingRemote = false;
    opts.onRemoteData?.();
  }

  async function findFile() {
    if (fileId) return fileId;
    const q = encodeURIComponent(`name='${FILE_NAME}'`);
    const r = await api(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id)`);
    fileId = r.files?.[0]?.id || null;
    return fileId;
  }

  async function push() {
    const body = JSON.stringify(snapshot());
    const id = await findFile();
    if (id) {
      await api(`https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body,
      });
    } else {
      const b = `pdv${Date.now()}`;
      const multipart = [
        `--${b}`, 'Content-Type: application/json; charset=UTF-8', '', JSON.stringify({ name: FILE_NAME, parents: ['appDataFolder'] }),
        `--${b}`, 'Content-Type: application/json', '', body, `--${b}--`,
      ].join('\r\n');
      const r = await api('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
        method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${b}` }, body: multipart,
      });
      fileId = r.id;
    }
    status('ok', `Sincronizado ${hhmm()}`);
  }

  // Gana la versión más reciente. Un dispositivo "virgen" (sin datos propios) siempre recibe la de Drive.
  async function pull() {
    const local = snapshot();
    const id = await findFile();
    if (!id) {
      if (Object.keys(local.data).length) {
        if (!local.updatedAt) meta.set('localUpdatedAt', Date.now());
        await push();
      }
      return;
    }
    const remote = (await api(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`)) || {};
    const remoteAt = remote.updatedAt || 0;
    if (remoteAt > local.updatedAt) applyRemote(remote);
    else if (local.updatedAt > remoteAt) await push();
  }

  function markDirty() {
    if (applyingRemote) return;
    meta.set('localUpdatedAt', Date.now());
    if (!token()) return;
    clearTimeout(pushTimer);
    status('sync', 'Guardando…');
    pushTimer = setTimeout(() => push().catch(handleError), 1500);
  }

  /* ---------- Google Calendar ---------- */
  async function loadCalendar() {
    const timeMin = new Date(); timeMin.setHours(0, 0, 0, 0);
    const timeMax = new Date(timeMin); timeMax.setDate(timeMax.getDate() + (opts.calendarDays || 90));

    const list = await api('https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader&fields=items(id,selected,primary)');
    const calendars = (list.items || []).filter((c) => c.selected || c.primary);
    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(), timeMax: timeMax.toISOString(),
      singleEvents: 'true', orderBy: 'startTime', maxResults: '50',
      fields: 'items(id,summary,location,start,end,status)',
    });
    const results = await Promise.all(calendars.map((c) =>
      api(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(c.id)}/events?${params}`)
        .then((r) => r.items || [])
        .catch(() => [])));

    const events = results.flat()
      .filter((e) => e.status !== 'cancelled')
      .map((e) => ({
        title: e.summary || '(Sin título)',
        place: e.location || '',
        allDay: !e.start.dateTime,
        date: e.start.dateTime ? new Date(e.start.dateTime) : new Date(`${e.start.date}T00:00:00`),
        end: e.end?.dateTime ? new Date(e.end.dateTime) : e.end?.date ? new Date(`${e.end.date}T00:00:00`) : null,
      }))
      .sort((a, b) => a.date - b.date);
    opts.onEvents?.(events);
  }

  /* ---------- Gmail (no leídos de la bandeja de entrada) ---------- */
  const decodeEntities = (s) => new DOMParser().parseFromString(s, 'text/html').documentElement.textContent;

  async function loadGmail() {
    const list = await api('https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&labelIds=UNREAD&maxResults=10');
    const ids = (list.messages || []).map((m) => m.id);
    const fields = 'id,threadId,snippet,internalDate,labelIds,payload/headers';
    const messages = await Promise.all(ids.map((id) =>
      api(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&fields=${fields}`)
        .catch(() => null)));

    const emails = messages.filter(Boolean).map((m) => {
      const header = (name) => m.payload?.headers?.find((h) => h.name.toLowerCase() === name)?.value || '';
      const from = header('from');
      return {
        id: m.id,
        threadId: m.threadId,
        from: (from.match(/^\s*"?([^"<]+?)"?\s*</)?.[1] || from.replace(/[<>]/g, '')).trim() || '(desconocido)',
        subject: header('subject') || '(Sin asunto)',
        summary: decodeEntities(m.snippet || ''),
        date: new Date(Number(m.internalDate)),
        important: (m.labelIds || []).includes('IMPORTANT'),
      };
    });
    opts.onEmails?.(emails);
  }

  /* ---------- Conexión ---------- */
  async function refresh(force = false) {
    if (!token()) { idleStatus(); return; }
    if (missingScopes()) { status('expired', 'Activar Gmail'); return; }
    if (!force && Date.now() - lastRefresh < 60000) return;
    lastRefresh = Date.now();
    status('sync', 'Sincronizando…');
    try {
      await Promise.all([
        pull().then(() => opts.onSynced?.()),
        loadCalendar(),
        loadGmail().catch((e) => { if (e.message === 'no-token') throw e; console.warn('[GoogleSync] Gmail', e); }),
      ]);
      status('ok', `Sincronizado ${hhmm()}`);
    } catch (e) { handleError(e); }
  }

  function connect() {
    if (!opts.clientId) {
      status('setup', 'Falta configurar Google');
      alert('Para conectar Google, pega tu Client ID de OAuth en CONFIG.googleClientId (app.js). Los pasos están en el README.');
      return;
    }
    if (!window.google?.accounts?.oauth2) { status('error', 'Google aún no ha cargado'); return; }
    tokenClient ||= google.accounts.oauth2.initTokenClient({
      client_id: opts.clientId,
      scope: SCOPES,
      callback: (r) => {
        if (r.error) { handleError(new Error(r.error)); return; }
        meta.set('token', { value: r.access_token, scope: r.scope, expiresAt: Date.now() + Number(r.expires_in) * 1000 });
        meta.set('connected', true);
        if (missingScopes()) { status('expired', 'Falta marcar algún permiso'); return; }
        refresh(true);
      },
      error_callback: idleStatus, // ventana cerrada o bloqueada
    });
    // Pide consentimiento la primera vez o si esta versión necesita permisos nuevos
    const needsConsent = !meta.get('connected') || (meta.get('token') && missingScopes());
    tokenClient.requestAccessToken({ prompt: needsConsent ? 'consent' : '' });
  }

  function disconnect() {
    const t = token();
    if (t && window.google?.accounts?.oauth2) google.accounts.oauth2.revoke(t, () => {});
    meta.set('token', null);
    meta.set('connected', null);
    fileId = null;
    status('off', 'Conectar Google');
  }

  function init(options) {
    opts = options;
    if (token()) refresh(true); else idleStatus();
    // Al volver a la app (p. ej. cambias del móvil al ordenador) trae los últimos cambios
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') refresh(false);
    });
  }

  return { init, connect, disconnect, refresh, markDirty, isConnected: () => !!token() && !missingScopes() };
})();
