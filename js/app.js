/* =========================================================
   PaperMind — shared UI kit + portal shell
   ========================================================= */
(function () {
  'use strict';
  const PM = (window.PM = window.PM || {});

  /* ---------- Icons (inline SVG, Lucide-style strokes) ---------- */
  const P = {
    home: '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    grading: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 12 2 2 4-4M15 12h2M7 17h10"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    book: '<path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6.5A2.5 2.5 0 0 0 4 21.5 2.5 2.5 0 0 0 6.5 24"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H19"/>',
    practice: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 3v4h6V3M8 12h8M8 16h5"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    chevDown: '<path d="m6 9 6 6 6-6"/>', chevRight: '<path d="m9 18 6-6-6-6"/>', chevLeft: '<path d="m15 18-6-6 6-6"/>',
    arrowRight: '<path d="M5 12h14M13 5l7 7-7 7"/>', arrowLeft: '<path d="M19 12H5M11 19l-7-7 7-7"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    check: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    xCircle: '<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    alertCircle: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
    upload: '<path d="M16 16l-4-4-4 4M12 12v9"/><path d="M20.4 18.4A5 5 0 0 0 18 9h-1.3A8 8 0 1 0 3 16.3"/>',
    trending: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
    sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 3v4M21 5h-4M5 17v4M7 19H3"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M9.9 4.2A10 10 0 0 1 12 4c6.5 0 10 7 10 7a17 17 0 0 1-2.2 3.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M2 2l20 20"/><path d="M14.1 14.1a3 3 0 1 1-4.2-4.2"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    printer: '<path d="M6 9V2h12v7"/><rect x="6" y="14" width="12" height="8"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
    play: '<path d="m6 3 14 9-14 9z"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
    filter: '<path d="M3 4h18l-7 8v6l-4 2v-8z"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M8.2 13.4 7 22l5-3 5 3-1.2-8.6"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/>',
    sort: '<path d="M3 6h18M7 12h10M10 18h4"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
    keyboard: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M7 15h10"/>',
    undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>',
    group: '<circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M15 14.5a5 5 0 0 1 6.5 4.5"/>',
    lightbulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V16h8v-1.3A7 7 0 0 0 12 2z"/>'
  };
  function icon(name, cls) {
    return '<svg class="icon ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (P[name] || P.info) + '</svg>';
  }

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- formatting ---------- */
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function timeAgo(ts) {
    const d = Date.now() - ts;
    if (d < 0) return 'just now';
    const m = Math.round(d / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + (m === 1 ? ' min ago' : ' mins ago');
    const h = Math.round(m / 60);
    if (h < 24) return h + (h === 1 ? ' hour ago' : ' hours ago');
    const days = Math.round(h / 24);
    if (days === 1) return 'yesterday';
    if (days < 14) return days + ' days ago';
    return fmtDate(ts);
  }
  function fmtDate(ts) { const d = new Date(ts); return MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(); }
  function fmtShort(ts) { const d = new Date(ts); return MONTHS[d.getMonth()] + ' ' + d.getDate(); }
  function fmtTime(ts) { const d = new Date(ts); let h = d.getHours(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return h + ':' + String(d.getMinutes()).padStart(2, '0') + ' ' + ap; }
  function fmtWhen(ts) {
    const d = new Date(ts), t = new Date(); t.setHours(0, 0, 0, 0);
    const diff = Math.round((new Date(d).setHours(0, 0, 0, 0) - t.getTime()) / 86400000);
    const day = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : diff === -1 ? 'Yesterday' : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()] + ', ' + fmtShort(ts);
    return day + ' · ' + fmtTime(ts);
  }
  function fmtDue(iso) {
    if (!iso) return 'No due date';
    const [y, m, dd] = iso.split('-').map(Number);
    const d = new Date(y, m - 1, dd); const t = new Date(); t.setHours(0, 0, 0, 0);
    const diff = Math.round((d - t) / 86400000);
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    if (diff < 0) return 'Was due ' + MONTHS[d.getMonth()] + ' ' + d.getDate();
    return 'Due ' + MONTHS[d.getMonth()] + ' ' + d.getDate();
  }
  const isOverdue = (iso) => { if (!iso) return false; const [y, m, d] = iso.split('-').map(Number); const t = new Date(); t.setHours(0, 0, 0, 0); return new Date(y, m - 1, d) < t; };
  const initials = (name) => { const w = String(name || '?').replace(/^(Ms|Mrs|Mr|Dr)\.?\s+/i, '').trim().split(/\s+/); return (w.length > 1 ? w[0][0] + w[1][0] : w[0].slice(0, 2)).toUpperCase(); };
  const plural = (n, w, pl) => n + ' ' + (n === 1 ? w : (pl || w + 's'));

  /* ---------- Toasts ---------- */
  let region;
  const recent = new Map();
  function toast(type, title, msg, opts) {
    opts = opts || {};
    if (!region) {
      region = document.createElement('div');
      region.className = 'toast-region';
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-relevant', 'additions');
      document.body.appendChild(region);
    }
    const key = type + '|' + title + '|' + (msg || '');
    const last = recent.get(key);
    if (last && Date.now() - last < 2500) return; // de-duplicate rapid repeats
    recent.set(key, Date.now());
    while (region.children.length >= 3) region.firstElementChild.remove();
    const ic = { success: 'checkCircle', error: 'xCircle', warning: 'alert', info: 'info' }[type] || 'info';
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.innerHTML = '<div class="t-icon">' + icon(ic) + '</div><div class="t-body"><div class="t-title">' + esc(title) + '</div>' +
      (msg ? '<div class="t-msg">' + esc(msg) + '</div>' : '') +
      (opts.action ? '<div class="t-action"><button class="btn btn-xs" type="button">' + esc(opts.action.label) + '</button></div>' : '') +
      '</div><button class="t-close" type="button" aria-label="Dismiss notification">' + icon('x', 'icon-sm') + '</button>';
    region.appendChild(el);
    const remove = () => { if (!el.isConnected) return; el.classList.add('leaving'); setTimeout(() => el.remove(), 200); };
    el.querySelector('.t-close').onclick = remove;
    if (opts.action) el.querySelector('.t-action button').onclick = () => { opts.action.onClick(); remove(); };
    const dur = opts.duration != null ? opts.duration : type === 'error' ? 7000 : type === 'warning' ? 6000 : 3500;
    if (dur > 0) {
      let timer = setTimeout(remove, dur);
      el.addEventListener('mouseenter', () => clearTimeout(timer));
      el.addEventListener('mouseleave', () => { timer = setTimeout(remove, 2000); });
    }
  }

  /* ---------- Modals ---------- */
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const openModals = [];
  function modal(o) {
    const prev = document.activeElement;
    const back = document.createElement('div');
    back.className = 'modal-backdrop';
    const id = 'm' + Math.random().toString(36).slice(2, 7);
    back.innerHTML = '<div class="modal ' + (o.wide ? 'modal-wide ' : '') + (o.cls || '') + '" role="dialog" aria-modal="true" aria-labelledby="' + id + '-t">' +
      '<div class="modal-head">' + (o.lead || '') + '<div><h2 id="' + id + '-t">' + o.title + '</h2>' + (o.sub ? '<div class="sub">' + o.sub + '</div>' : '') + '</div>' +
      '<button class="icon-btn close" type="button" data-close aria-label="Close dialog">' + icon('x') + '</button></div>' +
      '<div class="modal-body">' + (o.body || '') + '</div>' + (o.foot ? '<div class="modal-foot">' + o.foot + '</div>' : '') + '</div>';
    document.body.appendChild(back);
    const dlg = back.querySelector('.modal');
    const api = {
      el: dlg,
      close(result) {
        if (!back.isConnected) return;
        back.remove();
        openModals.splice(openModals.indexOf(api), 1);
        document.removeEventListener('keydown', onKey, true);
        if (o.onClose) o.onClose(result);
        if (prev && prev.focus && prev.isConnected) prev.focus();
      }
    };
    function onKey(e) {
      if (openModals[openModals.length - 1] !== api) return;
      if (e.key === 'Escape') { e.preventDefault(); api.close(); }
      if (e.key === 'Tab') {
        const f = [...dlg.querySelectorAll(FOCUSABLE)].filter((x) => x.offsetParent !== null);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', onKey, true);
    back.addEventListener('mousedown', (e) => { if (e.target === back && !o.sticky) api.close(); });
    back.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) api.close(); });
    openModals.push(api);
    if (o.onOpen) o.onOpen(dlg, api);
    const auto = dlg.querySelector('[autofocus]') || dlg.querySelector('.modal-body ' + FOCUSABLE) || dlg.querySelector(FOCUSABLE);
    if (auto) setTimeout(() => auto.focus(), 20);
    return api;
  }
  function confirmDialog(o) {
    return new Promise((resolve) => {
      let done = false;
      const kid = document.body.classList.contains('portal-student');
      const ic = o.icon || (o.danger ? 'alert' : 'help');
      const tone = o.danger ? 'danger' : (o.tone || 'primary');
      const lead = kid && !o.danger ? '<span class="confirm-art kid" aria-hidden="true"><img src="assets/logo.png" alt=""></span>' : '<span class="confirm-art ' + tone + '" aria-hidden="true">' + icon(ic) + '</span>';
      const m = modal({
        title: esc(o.title), sub: o.sub, cls: 'modal-confirm ' + tone, lead,
        body: '<p class="confirm-msg">' + (o.html ? o.message : esc(o.message)) + '</p>',
        foot: '<button class="btn btn-outline" type="button" data-close>' + esc(o.cancelLabel || 'Cancel') + '</button>' +
          '<button class="btn ' + (o.danger ? 'btn-danger-solid' : 'btn-primary') + '" type="button" data-ok>' + esc(o.confirmLabel || 'Confirm') + '</button>',
        onClose: () => { if (!done) resolve(false); },
        onOpen: (dlg, api) => {
          dlg.querySelector('[data-ok]').addEventListener('click', () => { done = true; resolve(true); api.close(); });
          setTimeout(() => dlg.querySelector(o.danger ? '[data-close]' : '[data-ok]').focus(), 30);
        }
      });
      return m;
    });
  }
  const anyModalOpen = () => openModals.length > 0;

  /* ---------- field validation helpers ---------- */
  function setError(input, msg) {
    const field = input.closest('.field');
    input.setAttribute('aria-invalid', 'true');
    let e = field && field.querySelector('.error-text');
    if (field && !e) { e = document.createElement('div'); e.className = 'error-text'; e.id = (input.id || 'f' + Math.random().toString(36).slice(2, 6)) + '-err'; field.appendChild(e); }
    if (e) { e.innerHTML = icon('alertCircle', 'icon-xs') + esc(msg); input.setAttribute('aria-describedby', e.id); }
  }
  function clearErrors(scope) {
    scope.querySelectorAll('[aria-invalid="true"]').forEach((i) => i.removeAttribute('aria-invalid'));
    scope.querySelectorAll('.error-text').forEach((e) => e.remove());
  }

  /* ---------- download helper ---------- */
  function openHTML(html) {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (!w) { toast('warning', 'Pop-up blocked', 'Allow pop-ups for this site to open the worksheet in a new tab.'); }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  /* ---------- visual helpers ---------- */
  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function ring(pct, size, color, inner, label) {
    size = size || 56; pct = Math.max(0, Math.min(100, pct || 0));
    const r = (size - 8) / 2, c = 2 * Math.PI * r;
    return '<span class="ring" style="width:' + size + 'px;height:' + size + 'px" role="img" aria-label="' + esc(label || pct + ' percent') + '"><svg viewBox="0 0 ' + size + ' ' + size + '" aria-hidden="true">' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--ring-track,#e9ecf6)" stroke-width="7"/>' +
      '<circle class="ring-val" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + (color || 'var(--indigo-500)') + '" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + (c * (1 - pct / 100)) + '" style="--c:' + c + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/></svg>' +
      '<span class="ring-in" aria-hidden="true">' + (inner == null ? Math.round(pct) + '%' : inner) + '</span></span>';
  }
  function countUp(el, to, suffix, dur) {
    if (!el) return;
    if (reduced()) { el.textContent = to + (suffix || ''); return; }
    const t0 = performance.now(); dur = dur || 900;
    const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e) + (suffix || ''); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  function confetti(n) {
    if (reduced()) return;
    const cv = document.createElement('canvas'); cv.className = 'confetti'; cv.setAttribute('aria-hidden', 'true');
    cv.width = innerWidth; cv.height = innerHeight; document.body.appendChild(cv);
    const ctx = cv.getContext('2d'), cols = ['#6366f1', '#f5b83d', '#10b981', '#f43f5e', '#3b82f6', '#a855f7'];
    const ps = Array.from({ length: n || 140 }, () => ({ x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .35, vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4, s: 5 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: cols[Math.floor(Math.random() * cols.length)] }));
    const t0 = performance.now();
    (function frame(t) {
      ctx.clearRect(0, 0, cv.width, cv.height);
      ps.forEach((p) => { p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); });
      if (t - t0 < 2600) requestAnimationFrame(frame); else cv.remove();
    })(t0);
  }
  function todayLabel() { const d = new Date(); return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate(); }

  PM.ui = { ring, countUp, confetti, todayLabel, reduced, icon, esc, toast, modal, confirm: confirmDialog, anyModalOpen, setError, clearErrors, timeAgo, fmtDate, fmtShort, fmtTime, fmtWhen, fmtDue, isOverdue, initials, plural, openHTML };

  /* =========================================================
     Portal shell: sidebar, router, delegation, help, sync
     ========================================================= */
  const shell = {};
  let cfg, current = { name: null, params: [], query: {} };

  function parseHash() {
    const h = (location.hash || '').replace(/^#\/?/, '');
    const [path, qs] = h.split('?');
    const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
    const query = {};
    (qs || '').split('&').filter(Boolean).forEach((kv) => { const [k, v] = kv.split('='); query[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
    return { name: parts[0] || cfg.defaultRoute, params: parts.slice(1), query };
  }

  shell.go = function (hash) { if (location.hash === hash) shell.render(); else location.hash = hash; };
  shell.current = () => current;

  shell.renderSidebar = function () {
    const sb = document.getElementById('sidebar');
    const items = cfg.nav().map((n) => {
      const active = (n.match || [n.route]).includes(current.name);
      const badge = n.badge ? n.badge() : 0;
      return '<a href="#/' + n.route + '" ' + (active ? 'aria-current="page"' : '') + '>' + icon(n.icon) + '<span>' + esc(n.label) + '</span>' +
        (badge ? '<span class="count-badge" aria-label="' + badge + ' unread">' + badge + '</span>' : '') + '</a>';
    }).join('');
    const p = cfg.profile();
    sb.innerHTML = '<a class="brand" href="#/' + cfg.defaultRoute + '" aria-label="PaperMind home"><span class="brand-mark"><img src="assets/logo.png" alt=""></span>' +
      '<span><span class="brand-name">PaperMind</span><br><span class="brand-role">' + esc(cfg.roleLabel) + '</span></span></a>' +
      '<nav class="nav" aria-label="Main">' + items + '</nav>' +
      '<div class="sidebar-bottom"><button class="profile-card" type="button" data-action="open-profile" aria-label="Open profile for ' + esc(p.name) + '">' + p.avatar +
      '<span class="who"><strong>' + esc(p.name) + '</strong><span>' + esc(p.sub) + '</span></span>' + icon('chevRight', 'icon-sm') + '</button>' +
      '<button class="logout-btn" type="button" data-action="logout">' + icon('logout', 'icon-sm') + 'Log Out</button></div>';
  };

  shell.render = function (keepScroll) {
    const prevName = current.name;
    current = parseHash();
    const route = cfg.routes[current.name];
    if (!route) { location.replace('#/' + cfg.defaultRoute); return; }
    const out = route(current.params, current.query) || {};
    if (out.redirect) { location.replace(out.redirect); return; }
    const view = document.getElementById('view');
    const y = window.scrollY;
    const h1 = document.getElementById('page-title'); h1.textContent = out.title || ''; h1.classList.toggle('sr-only', !!out.hideTitle);
    document.title = (out.title ? out.title + ' · ' : '') + 'PaperMind ' + cfg.roleLabel.replace(' Portal', '');
    view.innerHTML = out.html || '';
    shell.renderSidebar();
    if (cfg.topbar) document.getElementById('topbar-actions').innerHTML = cfg.topbar(current);
    document.body.classList.remove('nav-open');
    if (out.after) out.after(view);
    const same = prevName === current.name;
    if (keepScroll || same) window.scrollTo(0, y);
    else { window.scrollTo(0, 0); view.focus({ preventScroll: true }); }
  };
  shell.rerender = () => shell.render(true);

  shell.help = function () {
    const content = cfg.help ? cfg.help(current.name) : '';
    const d = document.createElement('div');
    d.innerHTML = '<div class="modal-backdrop" style="background:rgba(18,18,63,.25);backdrop-filter:none"></div><aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="help-title">' +
      '<div class="modal-head"><div><h2 id="help-title">Help & tips</h2><div class="sub">For the page you are on</div></div><button class="icon-btn close" type="button" data-close aria-label="Close help">' + icon('x') + '</button></div>' +
      '<div class="drawer-body">' + content + '</div></aside>';
    document.body.appendChild(d);
    const prev = document.activeElement;
    const close = () => { d.remove(); document.removeEventListener('keydown', onKey, true); if (prev && prev.focus) prev.focus(); };
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
    document.addEventListener('keydown', onKey, true);
    d.querySelector('.modal-backdrop').onclick = close;
    d.querySelector('[data-close]').onclick = close;
    setTimeout(() => d.querySelector('[data-close]').focus(), 20);
  };

  shell.start = function (config) {
    cfg = config;
    // delegated clicks
    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-action]');
      if (!t) return;
      const fn = cfg.actions[t.dataset.action] || shellActions[t.dataset.action];
      if (fn) { e.preventDefault(); fn(t, e); }
    });
    document.addEventListener('submit', (e) => {
      const f = e.target.closest('form[data-form]');
      if (!f) return;
      e.preventDefault();
      const fn = cfg.forms && cfg.forms[f.dataset.form];
      if (fn) fn(f, e);
    });
    ['input', 'change'].forEach((type) => document.addEventListener(type, (e) => {
      const t = e.target.closest('[data-input]');
      if (!t) return;
      const fn = cfg.inputs && cfg.inputs[t.dataset.input];
      if (fn) fn(t, e);
    }));
    document.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      const typing = ['input', 'textarea', 'select'].includes(tag) || e.target.isContentEditable;
      if (typing || anyModalOpen() || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === '?') { e.preventDefault(); shell.help(); }
      if (cfg.keys && cfg.keys[e.key]) { e.preventDefault(); cfg.keys[e.key](); }
    });
    // close dropdowns on outside click / Esc
    document.addEventListener('click', (e) => {
      document.querySelectorAll('[data-popup]:not([hidden])').forEach((p) => {
        const owner = document.querySelector('[aria-controls="' + p.id + '"]');
        if (!p.contains(e.target) && !(owner && owner.contains(e.target))) { p.hidden = true; if (owner) owner.setAttribute('aria-expanded', 'false'); }
      });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      document.querySelectorAll('[data-popup]:not([hidden])').forEach((p) => {
        p.hidden = true; const owner = document.querySelector('[aria-controls="' + p.id + '"]');
        if (owner) { owner.setAttribute('aria-expanded', 'false'); owner.focus(); }
      });
    });
    window.addEventListener('hashchange', () => shell.render());
    // keep both portals in sync when they are open in two tabs of the same browser
    window.addEventListener('storage', (e) => {
      if (e.key !== PM.data.KEY) return;
      PM.data.reloadFromStorage();
      const active = document.activeElement;
      const typing = active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName);
      if (!anyModalOpen() && !typing) shell.rerender(); else shell.renderSidebar();
    });
    PM.data.onChange(() => { /* saved */ });
    shell.render();
  };

  const shellActions = {
    'toggle-nav': () => document.body.classList.toggle('nav-open'),
    'open-help': () => shell.help(),
    'toggle-popup': (el) => {
      const p = document.getElementById(el.getAttribute('aria-controls'));
      const open = p.hidden;
      document.querySelectorAll('[data-popup]').forEach((x) => { if (x !== p) { x.hidden = true; const o = document.querySelector('[aria-controls="' + x.id + '"]'); if (o) o.setAttribute('aria-expanded', 'false'); } });
      p.hidden = !open; el.setAttribute('aria-expanded', String(open));
      if (open) { const f = p.querySelector('[aria-checked="true"]') || p.querySelector('button, a'); if (f) f.focus(); }
    },
    logout: async () => {
      const kid = document.body.classList.contains('portal-student');
      const ok = await confirmDialog({ title: kid ? 'Leaving already? 👋' : 'Log out of PaperMind?', message: kid ? 'Your stars and work are saved. See you next time!' : 'You will return to the login page. Your work is saved.', confirmLabel: 'Log out', cancelLabel: kid ? 'Stay here' : 'Cancel', icon: 'logout' });
      if (ok) PM.auth.logout();
    }
  };

  PM.shell = shell;
})();
