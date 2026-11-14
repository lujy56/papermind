/* =========================================================
   PaperMind — Teacher portal
   ========================================================= */
(function () {
  'use strict';
  const PM = window.PM, D = PM.data, U = PM.ui, I = U.icon, esc = U.esc;
  if (!PM.auth.guard('teacher')) return;
  D.load();
  D.state.exams.forEach((e) => { delete e._running; });

  const st = () => D.state;
  const cid = () => st().ui.classId;
  const cls = () => D.cls(cid());
  const T = () => st().teacher;
  const save = () => D.save();
  const go = (h) => PM.shell.go(h);
  const rer = () => PM.shell.rerender();
  const sname = (id) => (D.student(id) || {}).name || 'Unknown student';
  const sfirst = (id) => (D.student(id) || {}).first || 'the student';
  const GAPS = D.GAPS;

  const AV_COLORS = [['#fff1c7', '#8a5a00'], ['#e5e6ff', '#3b3fb5'], ['#dcf7ea', '#0b7a4c'], ['#ffe2e6', '#b4233f'], ['#e2f0ff', '#1d4ed8'], ['#f3e8ff', '#7e22ce']];
  function avInit(id, size) {
    const s = D.student(id); const n = s ? s.name : '?';
    const c = AV_COLORS[(parseInt(String(id).replace(/\D/g, ''), 10) || 0) % AV_COLORS.length];
    return '<span class="av-initials" style="background:' + c[0] + ';color:' + c[1] + (size ? ';width:' + size + 'px;height:' + size + 'px;font-size:' + Math.round(size / 3) + 'px' : '') + '" aria-hidden="true">' + U.initials(n) + '</span>';
  }
  const chip = (kind, text, ic) => '<span class="chip chip-' + kind + '">' + (ic ? I(ic) : '') + esc(text) + '</span>';
  const teacherAvatar = (size) => '<span class="avatar ' + (size || '') + '" aria-hidden="true">' + U.initials(T().displayName) + '</span>';

  /* ---------- exam status helpers ---------- */
  const STEP = { ocr: 1, ai: 2, confirm: 3, feedback: 4, published: 5 };
  function statusChip(e) {
    switch (e.status) {
      case 'ocr': return chip('amber', 'OCR verification needed', 'alert');
      case 'ai': return chip('purple', 'AI suggested ' + e.ai.pct + '%', 'sparkles');
      case 'confirm': return chip('blue', 'Step 3 · awaiting your confirmation', 'clock');
      case 'feedback': return chip('blue', 'Step 4 · ready to publish', 'send');
      default: return chip('green', 'Grade: ' + e.published.pct + '%', 'checkCircle');
    }
  }
  function cta(e) {
    const href = '#/grading/' + e.id;
    switch (e.status) {
      case 'ocr': return { label: 'Start Step 1', href, primary: true };
      case 'ai': return { label: 'Confirm AI Grade', href, primary: true };
      case 'confirm': return { label: 'Continue Step 3', href, primary: true };
      case 'feedback': return { label: 'Review & Publish', href, primary: true };
      default: return { label: 'View Published', href, primary: false };
    }
  }
  const filterKey = (e) => (e.status === 'ocr' ? 'ocr' : e.status === 'published' ? 'published' : 'ai');
  const pending = () => D.classExams(cid()).filter((e) => e.status !== 'published').sort((a, b) => STEP[a.status] - STEP[b.status] || b.uploadedAt - a.uploadedAt);
  const unreadTeacher = () => st().notifications.filter((n) => n.to === 'teacher' && !n.read).length;
  const pendingRedFlags = () => pending().filter((e) => e.ai && e.ai.redFlag && !e.review.redFlagDecision).length;

  /* =========================================================
     Topbar: class selector, bell, profile, help
     ========================================================= */
  function topbar() {
    const c = cls();
    const classItems = st().classes.map((k) => '<button role="menuitemradio" aria-checked="' + (k.id === cid()) + '" data-action="set-class" data-id="' + k.id + '">' +
      '<span>' + esc(k.name) + (k.id === T().classroom ? ' (Current)' : '') + '<span class="menu-sub">' + esc(k.subject) + ' · ' + U.plural(D.classStudents(k.id).length, 'student') + '</span></span>' +
      (k.id === cid() ? '<span class="check-mark">' + I('check', 'icon-sm') + '</span>' : '') + '</button>').join('');
    const notes = st().notifications.filter((n) => n.to === 'teacher').slice(0, 8);
    const unread = unreadTeacher();
    return '<div class="dropdown"><button class="dropdown-btn" type="button" data-action="toggle-popup" aria-haspopup="menu" aria-expanded="false" aria-controls="class-menu" aria-label="Selected class: ' + esc(c.name) + '. Change class">' +
      I('users', 'icon-sm') + esc(c.name) + (c.id === T().classroom ? ' (Current)' : '') + I('chevDown', 'chev') + '</button>' +
      '<div class="menu" id="class-menu" role="menu" aria-label="Choose a class" data-popup hidden>' + classItems + '</div></div>' +
      '<div class="dropdown"><button class="icon-btn" type="button" data-action="toggle-popup" aria-haspopup="true" aria-expanded="false" aria-controls="bell-panel" aria-label="Notifications, ' + unread + ' unread">' + I('bell') + (unread ? '<span class="dot">' + unread + '</span>' : '') + '</button>' +
      '<div class="panel" id="bell-panel" data-popup hidden><div class="panel-head"><strong>Notifications</strong>' + (unread ? '<button class="link-btn tiny" type="button" data-action="teacher-read-all">Mark all as read</button>' : '<span class="tiny muted">All caught up</span>') + '</div>' +
      '<div class="panel-list">' + (notes.length ? notes.map((n) => '<button class="panel-item" type="button" data-action="open-tnote" data-id="' + n.id + '"><span class="' + (n.read ? 'read-dot' : 'unread-dot') + '" aria-hidden="true"></span><span><strong class="small">' + esc(n.title) + '</strong>' + (n.read ? '' : '<span class="sr-only"> (unread)</span>') + '<span class="tiny muted" style="display:block">' + esc(n.body) + '</span><span class="tiny muted">' + U.timeAgo(n.at) + '</span></span></button>').join('') : '<p class="small muted" style="padding:14px">No notifications yet.</p>') +
      '</div><div style="padding:10px;border-top:1px solid var(--border)"><a class="btn btn-sm btn-block" href="#/notifications?tab=inbox">See all notifications</a></div></div></div>' +
      '<button class="icon-btn" type="button" data-action="open-help" aria-label="Help and keyboard shortcuts">' + I('help') + '</button>' +
      '<button class="icon-btn" type="button" data-action="open-profile" aria-label="Open your profile" style="padding:0;border:0">' + teacherAvatar() + '</button>';
  }

  /* =========================================================
     DASHBOARD
     ========================================================= */
  function attentionItems() {
    const items = [];
    pending().forEach((e) => {
      const s = D.student(e.studentId);
      if (e.status === 'ocr') items.push({ p: 1, at: e.uploadedAt, sid: e.studentId, title: s.name, meta: e.title + ' • ' + e.topics, state: 'OCR verification needed', tone: 'amber', btn: 'Start Step 1', href: '#/grading/' + e.id });
      else items.push({ p: e.ai && e.ai.redFlag && !e.review.redFlagDecision ? 0 : 2, at: e.uploadedAt, sid: e.studentId, title: s.name, meta: e.title + ' • ' + e.topics, state: e.ai && e.ai.redFlag && !e.review.redFlagDecision ? 'Red flag suggested · AI grade awaiting your review' : 'AI grade awaiting teacher review', tone: e.ai && e.ai.redFlag && !e.review.redFlagDecision ? 'red' : 'blue', btn: 'Review', href: '#/grading/' + e.id });
    });
    st().practice.filter((p) => p.classId === cid() && U.isOverdue(p.due)).forEach((p) => {
      p.assignedTo.filter((sid) => !p.completion[sid]).forEach((sid) => items.push({ p: 3, at: Date.parse(p.due), sid, title: sname(sid), meta: 'Practice • ' + p.title, state: 'Practice overdue; send a reminder', tone: 'red', btn: 'Remind', action: 'remind-one', data: 'data-p="' + p.id + '" data-s="' + sid + '"' }));
    });
    const sort = st().ui.dashSort || 'priority';
    items.sort((a, b) => (sort === 'priority' ? a.p - b.p || b.at - a.at : b.at - a.at));
    return items;
  }
  function attentionStudents() {
    const out = [];
    D.classStudents(cid()).forEach((s) => {
      const reasons = [];
      const pubs = st().exams.filter((e) => e.studentId === s.id && e.status === 'published').sort((a, b) => b.published.at - a.published.at);
      if (pubs[0] && pubs[0].published.redFlag) reasons.push('Confirmed red flag: ' + pubs[0].published.redFlag.title.replace(/^Potential /, ''));
      if (pubs[0] && pubs[0].published.pct < 60) reasons.push('Latest grade ' + pubs[0].published.pct + '%');
      const overdue = st().practice.filter((p) => p.assignedTo.includes(s.id) && !p.completion[s.id] && U.isOverdue(p.due));
      if (overdue.length) reasons.push(U.plural(overdue.length, 'overdue practice', 'overdue practices'));
      const rec = st().recurring.filter((r) => r.studentId === s.id && r.status === 'confirmed' && [...r.history, r.latest].filter((h) => h && !h.ok).length >= 3);
      if (rec.length) reasons.push('Recurring mistake (3×)');
      if (reasons.length) out.push({ s, reasons });
    });
    return out;
  }

  function vDashboard() {
    const c = cls(), ex = D.classExams(cid());
    const week = ex.filter((e) => e.uploadedAt > Date.now() - 7 * D.DAY).length;
    const ocrN = ex.filter((e) => e.status === 'ocr').length;
    const aiN = ex.filter((e) => ['ai', 'confirm', 'feedback'].includes(e.status)).length;
    const pubN = ex.filter((e) => e.status === 'published').length;
    const rf = pendingRedFlags();
    const h = new Date().getHours();
    const greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    const items = attentionItems();
    const sort = st().ui.dashSort || 'priority';
    const attnStudents = attentionStudents();
    const acts = st().activity.filter((a) => a.classId === cid()).slice(0, 4);
    const next = pending()[0];
    const donePct = ex.length ? Math.round(pubN / ex.length * 100) : 100;
    const sessUp = st().sessions.filter((x) => x.classId === cid() && x.at > Date.now()).sort((a, b) => a.at - b.at)[0];
    const pr = st().practice.filter((p) => p.classId === cid());
    const prDone = pr.reduce((n, p) => n + p.assignedTo.filter((s) => p.completion[s]).length, 0), prAll = pr.reduce((n, p) => n + p.assignedTo.length, 0);
    const stat = (n, label, ic, tone, href, sub, extra) => '<a class="stat-card fade-up ' + (extra || '') + '" href="' + href + '"><div class="row-between"><span class="s-ico ico-' + tone + '">' + I(ic) + '</span><span class="s-go" aria-hidden="true">' + I('arrowRight', 'icon-sm') + '</span></div><span class="s-num">' + n + '</span><span class="s-label">' + label + '</span><span class="s-sub">' + sub + '</span></a>';
    return {
      title: 'Teacher Dashboard', hideTitle: true,
      html: '<section class="t-hero"><div class="t-hero-main"><span class="t-date">' + I('calendar', 'icon-sm') + U.todayLabel() + ' · ' + esc(c.name) + '</span><h2>' + greet + ', ' + esc(T().displayName) + ' <span class="wave" aria-hidden="true">👋</span></h2>' +
        '<p>' + (aiN + ocrN ? 'You have <b>' + (aiN + ocrN) + ' exam' + (aiN + ocrN > 1 ? 's' : '') + '</b> waiting in ' + esc(c.name) + (rf ? ' and <b>' + rf + ' red flag' + (rf > 1 ? 's' : '') + '</b> to review' : '') + '.' : 'Everything in ' + esc(c.name) + ' is graded and published. 🎉') + '</p>' +
        '<div class="row row-wrap mt-16">' + (next ? '<a class="btn btn-hero" href="#/grading/' + next.id + '">' + I('play', 'icon-sm') + 'Continue grading · ' + esc(sfirst(next.studentId)) + '</a>' : '') + '<a class="btn btn-hero-ghost" href="#/insights">' + I('chart', 'icon-sm') + 'Class insights</a></div></div>' +
        '<div class="t-hero-stats"><div class="hero-ring">' + U.ring(donePct, 112, '#a5b4fc', '<b>' + donePct + '%</b><small>published</small>', donePct + ' percent of exams published') + '</div>' +
        '<ul class="hero-list"><li><span>' + I('file', 'icon-sm') + '</span><b>' + pubN + '/' + ex.length + '</b> exams published</li><li><span>' + I('practice', 'icon-sm') + '</span><b>' + prDone + '/' + prAll + '</b> practice done</li><li><span>' + I('calendar', 'icon-sm') + '</span>' + (sessUp ? 'Next session <b>' + esc(U.fmtWhen(sessUp.at).split(' · ')[0]) + '</b>' : 'No session planned') + '</li></ul></div>' +
        '<img class="t-hero-mascot" src="assets/logo.png" alt=""></section>' +
        '<div class="grid grid-4">' +
        stat(week, 'Exams submitted', 'file', 'blue', '#/submissions', 'in the last 7 days') +
        stat(ocrN, 'OCR reviews needed', 'scan', 'amber', '#/submissions?filter=ocr', ocrN ? 'Start with step 1' : 'Nothing to verify', ocrN ? 'warn' : '') +
        stat(aiN, 'Pending AI grades', 'sparkles', 'purple', '#/submissions?filter=ai', aiN ? 'Waiting for your decision' : 'All confirmed') +
        stat(rf, 'Red flag suggestion' + (rf === 1 ? '' : 's'), 'flag', 'red', rf ? '#/grading' : '#/insights', rf ? 'Confirm or dismiss' : 'None pending', rf ? 'danger' : '') + '</div>' +
        '<div class="grid grid-main-side mt-24"><section class="card" aria-labelledby="attn-h"><div class="card-head"><h3 id="attn-h" class="card-title-ico"><span class="ti ico-amber">' + I('alert') + '</span>Needs your attention <span class="count-pill">' + items.length + '</span></h3>' +
        '<button class="btn btn-ghost btn-sm" type="button" data-action="dash-sort" aria-label="Sort by ' + (sort === 'priority' ? 'newest first' : 'priority') + '">' + I('sort', 'icon-sm') + (sort === 'priority' ? 'Priority sorting' : 'Newest first') + '</button></div>' +
        (items.length ? '<div class="stack">' + items.slice(0, 5).map((it) => '<div class="attn-item tone-' + it.tone + '">' + avInit(it.sid) + '<div class="who"><strong>' + esc(it.title) + '</strong><div class="meta">' + esc(it.meta) + '</div><div class="state c-' + it.tone + '"><span class="dot dot-' + it.tone + '"></span>' + esc(it.state) + '</div></div>' +
          (it.href ? '<a class="btn btn-primary btn-sm" href="' + it.href + '">' + esc(it.btn) + '</a>' : '<button class="btn btn-primary btn-sm" type="button" data-action="' + it.action + '" ' + it.data + '>' + esc(it.btn) + '</button>') + '</div>').join('') + '</div>' +
          '<div class="row-between mt-16"><span class="small muted">' + (items.length > 5 ? '+' + (items.length - 5) + ' more in the queue' : 'Showing everything') + '</span><a class="btn btn-sm" href="#/submissions">Open submission queue ' + I('arrowRight', 'icon-sm') + '</a></div>'
          : '<div class="empty">' + I('checkCircle') + '<h3>All caught up!</h3><p>No exams or reminders are waiting for you in ' + esc(c.name) + '.</p></div>') + '</section>' +
        '<div class="stack"><section class="card" aria-labelledby="snap-h"><div class="card-head"><h3 id="snap-h" class="card-title-ico"><span class="ti ico-green">' + I('trending') + '</span>Class snapshot</h3><a class="link-btn small" href="#/insights">Insights ' + I('arrowRight', 'icon-xs') + '</a></div>' +
        c.snapshot.map(([n, v]) => bar(n, v)).join('') + '</section>' +
        '<section class="card" aria-labelledby="att-h"><div class="card-head"><h3 id="att-h" class="card-title-ico"><span class="ti ico-red">' + I('users') + '</span>Students needing attention</h3></div>' +
        (attnStudents.length ? '<div class="stack">' + attnStudents.map((a) => '<a class="student-line" href="#/gaps?student=' + a.s.id + '">' + avInit(a.s.id, 36) + '<div style="flex:1;min-width:0"><strong class="small">' + esc(a.s.name) + '</strong><div class="tiny muted">' + a.reasons.map(esc).join(' • ') + '</div></div>' + I('chevRight', 'icon-sm') + '</a>').join('') + '</div>'
          : '<p class="small muted">No students are flagged right now. 🌈</p>') + '</section></div></div>' +
        '<div class="grid grid-main-side mt-24"><section class="card" aria-labelledby="ra-h"><div class="card-head"><h3 id="ra-h" class="card-title-ico"><span class="ti ico-blue">' + I('clock') + '</span>Recent activity</h3><a class="link-btn small" href="#/notifications">See all ' + I('arrowRight', 'icon-xs') + '</a></div><div class="timeline-t">' +
        (acts.length ? acts.map(actItem).join('') : '<p class="small muted">No activity yet.</p>') + '</div></section>' +
        '<section class="card" aria-labelledby="qa-h"><div class="card-head"><h3 id="qa-h" class="card-title-ico"><span class="ti ico-purple">' + I('zap') + '</span>Quick actions</h3></div><div class="quick-actions">' +
        '<a class="quick" href="#/practice"><span class="s-ico ico-green">' + I('practice') + '</span><span>Assign practice<small>Video, worksheet & quiz</small></span>' + I('chevRight', 'icon-sm') + '</a>' +
        '<a class="quick" href="#/sessions"><span class="s-ico ico-purple">' + I('users') + '</span><span>Recommend a session<small>For a group with a shared gap</small></span>' + I('chevRight', 'icon-sm') + '</a>' +
        '<a class="quick" href="#/gaps"><span class="s-ico ico-amber">' + I('target') + '</span><span>Group similar mistakes<small>AI pre-selects students</small></span>' + I('chevRight', 'icon-sm') + '</a>' +
        '<a class="quick" href="#/notifications"><span class="s-ico ico-blue">' + I('send') + '</span><span>Send an announcement<small>Class, group or one student</small></span>' + I('chevRight', 'icon-sm') + '</a></div></section></div>'
    };
  }
  function bar(name, v, extraLabel, fixedTone) {
    const tone = fixedTone != null ? fixedTone : v >= 75 ? '' : v >= 55 ? 'amber' : 'red';
    const label = extraLabel ? extraLabel(v) : v + '%';
    return '<div class="bar-row"><div class="bar-label"><span>' + esc(name) + '</span><span class="' + (tone === 'red' ? 'c-red' : tone === 'amber' ? 'c-amber' : tone === 'indigo' ? 'c-purple' : 'c-green') + '">' + label + '</span></div>' +
      '<div class="bar ' + tone + '" role="progressbar" aria-label="' + esc(name) + '" aria-valuenow="' + v + '" aria-valuemin="0" aria-valuemax="100"><span style="width:' + v + '%"></span></div></div>';
  }
  const ACT_ICON = { upload: ['upload', 'amber'], ai: ['sparkles', 'purple'], practice: ['checkCircle', 'green'], session: ['users', 'blue'], publish: ['send', 'green'], message: ['message', 'blue'], group: ['group', 'purple'] };
  function actItem(a) {
    const [ic, tone] = ACT_ICON[a.kind] || ['info', 'blue'];
    return '<div class="act-item"><span class="a-ico ico-' + tone + '">' + I(ic) + '</span><div class="a-body"><div class="a-top"><strong>' + esc(a.title) + '</strong><time datetime="' + new Date(a.at).toISOString() + '">' + U.timeAgo(a.at) + '</time></div><p>' + a.text + '</p>' +
      (a.link ? '<div class="a-acts"><a class="btn btn-xs btn-outline" href="' + a.link + '">' + esc(a.action || 'Open') + '</a></div>' : '') + '</div></div>';
  }

  /* =========================================================
     SUBMISSIONS
     ========================================================= */
  const STAGE_NAMES = ['OCR check', 'AI grading', 'Your confirmation', 'Ready to publish'];
  function examCard(e) {
    const c = cta(e), step = STEP[e.status];
    const when = e.status === 'published' ? 'Published ' + U.timeAgo(e.published.at) : 'Scanned ' + U.timeAgo(e.uploadedAt);
    const right = e.status === 'published' ? U.ring(e.published.pct, 52, e.published.pct >= 75 ? 'var(--green-500)' : e.published.pct >= 55 ? 'var(--amber-400)' : 'var(--red-500)', null, 'Grade ' + e.published.pct + ' percent')
      : e.ai ? U.ring(e.ai.pct, 52, 'var(--indigo-500)', e.ai.pct + '%', 'AI suggested ' + e.ai.pct + ' percent') : '<span class="ocr-badge" title="Waiting for OCR check">' + I('scan') + '</span>';
    return '<article class="card sub-card st-' + e.status + ' fade-up"><div class="top">' + avInit(e.studentId) + '<div class="who"><strong>' + esc(sname(e.studentId)) + '</strong><span class="ex-title">' + (D.BANKS && e.subject === 'Science' ? '🌱 ' : e.subject === 'English' ? '📖 ' : '🧮 ') + esc(e.title) + '</span><span class="ex-meta">' + esc(e.topics) + ' · ' + esc(e.lang) + (e.file ? ' · ' + I('image', 'icon-xs') + ' photo' : '') + '</span></div>' + right + '</div>' +
      (step < 5 ? '<div class="stage-line"><div class="row-between tiny"><span class="bold">Step ' + step + ' · ' + STAGE_NAMES[step - 1] + '</span>' + statusChip(e) + '</div><div class="step-mini" aria-label="Grading step ' + step + ' of 4">' + [1, 2, 3, 4].map((i) => '<span class="' + (i < step ? 'done' : i === step ? 'on' : '') + '"></span>').join('') + '</div></div>'
        : '<div class="stage-line"><div class="row-between tiny"><span class="bold c-green">' + I('checkCircle', 'icon-xs') + ' Visible to ' + esc(sfirst(e.studentId)) + '</span>' + (e.published.redFlag ? chip('red', 'Red flag', 'flag') : '') + '</div></div>') +
      '<div class="bottom"><span class="small muted">' + I('clock', 'icon-xs') + ' ' + when + '</span><a class="btn ' + (c.primary ? 'btn-primary' : 'btn-outline') + ' btn-sm" href="' + c.href + '" aria-label="' + esc(c.label + ' for ' + sname(e.studentId) + ', ' + e.title) + '">' + esc(c.label) + '</a></div></article>';
  }
  function pipeline(active) {
    const ex = D.classExams(cid());
    const n = (k) => ex.filter((e) => e.status === k).length;
    const stages = [['ocr', 'Needs OCR', 'scan', 'amber', 'ocr'], ['ai', 'AI suggested', 'sparkles', 'purple', 'ai'], ['confirm', 'Your confirmation', 'grading', 'blue', 'ai'], ['feedback', 'Ready to publish', 'send', 'sky', 'ai'], ['published', 'Published', 'checkCircle', 'green', 'published']];
    return '<nav class="pipeline" aria-label="Review workflow">' + stages.map(([k, l, ic, tone, f], i) => (i ? '<span class="pipe-arrow" aria-hidden="true">' + I('chevRight', 'icon-sm') + '</span>' : '') +
      '<a class="pipe ' + tone + (active === f ? ' on' : '') + '" href="#/submissions?filter=' + f + '"><span class="pipe-ico">' + I(ic) + '</span><span><b>' + n(k) + '</b><small>' + l + '</small></span></a>').join('') + '</nav>';
  }
  function subList(filter, q) {
    let list = D.classExams(cid()).slice().sort((a, b) => (a.status === 'published') - (b.status === 'published') || STEP[a.status] - STEP[b.status] || b.uploadedAt - a.uploadedAt);
    if (filter && filter !== 'all') list = list.filter((e) => filterKey(e) === filter);
    if (q) list = list.filter((e) => sname(e.studentId).toLowerCase().includes(q.toLowerCase()));
    if (!list.length) return '<div class="empty" style="grid-column:1/-1">' + I('search') + '<h3>No exams match</h3><p>' + (q ? 'No student named “' + esc(q) + '” in this view. ' : '') + 'Try another filter or clear the search.</p>' +
      '<button class="btn btn-sm mt-12" type="button" data-action="clear-sub-filters">Clear search & filters</button></div>';
    return list.map(examCard).join('');
  }
  function vSubmissions(p, q) {
    const filter = q.filter || 'all';
    const ex = D.classExams(cid());
    const count = (k) => (k === 'all' ? ex.length : ex.filter((e) => filterKey(e) === k).length);
    const tabs = [['all', 'All exams'], ['ocr', 'Needs OCR'], ['ai', 'AI Review'], ['published', 'Published']];
    const search = st().ui.subQuery || '';
    return {
      title: 'Submissions',
      html: '<div class="page-head"><div class="ph"><span class="ph-ico">' + I('file') + '</span><div><h2>Student Submissions</h2><p>Every uploaded exam in ' + esc(cls().name) + ' and where it is in the review workflow.</p></div></div></div>' +
        pipeline(filter) +
        '<div class="toolbar"><div class="pill-tabs" role="group" aria-label="Filter by status">' + tabs.map(([k, l]) => '<button type="button" aria-pressed="' + (filter === k) + '" data-action="sub-filter" data-f="' + k + '">' + l + ' <span class="pt-n">' + count(k) + '</span></button>').join('') + '</div>' +
        '<label class="search"><span class="sr-only">Search student name</span>' + I('search') + '<input class="input" id="sub-search" type="search" placeholder="Search student…" value="' + esc(search) + '" data-input="sub-search" autocomplete="off"><kbd class="kbd-hint" aria-hidden="true">/</kbd></label></div>' +
        '<div class="sub-grid" id="sub-list" aria-live="polite">' + subList(filter, search) + '</div>'
    };
  }

  /* =========================================================
     GRADING WORKFLOW
     ========================================================= */
  function vGradingQueue() {
    const list = pending();
    return {
      title: 'Grading',
      html: '<div class="page-head"><div class="ph"><span class="ph-ico">' + I('grading') + '</span><div><h2>Grading Queue</h2><p>Pick an exam to continue. Each exam goes through 4 steps: OCR → AI grading → your confirmation → feedback.</p></div></div></div>' +
        pipeline('') +
        (list.length ? '<div class="sub-grid">' + list.map(examCard).join('') + '</div>'
          : '<div class="empty">' + I('checkCircle') + '<h3>Nothing to grade in ' + esc(cls().name) + '</h3><p>New exams appear here as soon as students upload them.</p><a class="btn btn-sm mt-12" href="#/submissions?filter=published">View published exams</a></div>')
    };
  }

  function stepperHTML(e, step) {
    const max = Math.min(STEP[e.status], 4);
    const names = ['OCR Verification', 'AI Grading', 'Confirmation', 'Notification'];
    return '<ol class="stepper" aria-label="Grading steps">' + names.map((n, i) => {
      const k = i + 1;
      const cls_ = k === step ? 'current' : k < max ? 'done' : k <= max ? 'available' : 'locked';
      const lab = (k < max && k !== step ? '' : '') + k + '. ' + n;
      return '<li class="' + cls_ + '"><button type="button" data-action="goto-step" data-step="' + k + '" ' + (k === step ? 'aria-current="step"' : '') + (cls_ === 'locked' ? ' aria-disabled="true"' : '') + ' aria-label="Step ' + k + ': ' + n + (cls_ === 'done' ? ' (completed)' : cls_ === 'locked' ? ' (locked)' : '') + '">' +
        '<span class="num">' + (cls_ === 'done' ? I('check', 'icon-xs') : cls_ === 'locked' ? I('lock', 'icon-xs') : k) + '</span>' + esc(lab) + '</button></li>';
    }).join('') + '</ol>';
  }
  function wfHead(e, step) {
    const s = D.student(e.studentId);
    return '<section class="card wf-head"><nav class="breadcrumb" aria-label="Breadcrumb"><a href="#/submissions">Submissions</a>' + I('chevRight', 'icon-xs') + '<span>' + esc(s.name) + '</span></nav>' +
      '<div class="wf-title"><div><div class="eyebrow">Evaluation workflow</div><h2>Grading Exam: ' + esc(s.name) + '</h2><div class="meta">' + esc(e.title) + ' • ' + esc(e.topics) + ' • ' + esc(e.lang) + ' • scanned ' + U.timeAgo(e.uploadedAt) + (e.pages ? ' • ' + U.plural(e.pages, 'page') : '') + '</div></div>' +
      '<span class="chip chip-purple">' + I('clock') + 'Step ' + step + ' of 4</span></div>' + stepperHTML(e, step) + '</section>';
  }

  function vGrading(params) {
    if (!params[0]) return vGradingQueue();
    const e = D.exam(params[0]);
    if (!e) return { title: 'Grading', html: '<div class="empty">' + I('alertCircle') + '<h3>Exam not found</h3><p>It may have been removed. Go back to the submission queue.</p><a class="btn btn-primary btn-sm mt-12" href="#/submissions">Open submissions</a></div>' };
    if (e.classId !== cid()) { st().ui.classId = e.classId; save(); }
    if (e.status === 'published') return vPublished(e);
    if (e._running) return { title: 'Grading', html: wfHead(e, Math.min(STEP[e.status], 2)) + '<section class="card loading-ai" role="status"><div class="spinner" aria-hidden="true"></div><h3>PaperMind AI is grading…</h3><p class="muted small">Using the answers you confirmed in Step 1.</p></section>' };
    const max = STEP[e.status];
    let step = parseInt(params[1], 10) || max;
    if (step > max) { U.toast('warning', 'Finish the earlier step first', 'Step ' + step + ' unlocks after step ' + max + ' is completed.'); return { redirect: '#/grading/' + e.id + '/' + max }; }
    const body = step === 1 ? step1(e) : step === 2 ? step2(e) : step === 3 ? step3(e) : step4(e);
    return { title: 'Grading', html: wfHead(e, step) + body.html, after: body.after };
  }

  /* ---------- Step 1: OCR verification ---------- */
  function step1(e) {
    const s = D.student(e.studentId);
    const unresolved = e.questions.filter((q) => !q.resolved);
    const active = st().ui.ocrActive;
    const paper = '<div class="paper" role="list" aria-label="Original handwritten answers"><div class="paper-name" aria-hidden="true">' + esc(s.first + ' ' + s.name.split(' ')[1][0] + '. · ' + e.classId) + '</div>' +
      e.questions.map((q, i) => '<button type="button" role="listitem" class="paper-line ' + (q.conf < 80 ? 'uncertain ' : '') + (active === q.id ? 'active' : '') + '" data-action="ocr-focus" data-q="' + q.id + '" aria-label="Question ' + (i + 1) + ': ' + esc(q.prompt) + '. Handwritten answer: ' + esc(q.read) + (q.conf < 80 ? '. OCR is unsure.' : '') + ' Compare with the extracted answer.">' +
        '<span class="qn">Q' + (i + 1) + '</span><span class="qp">' + esc(q.prompt) + '</span><span class="hand" aria-hidden="true">' + esc(q.read) + '</span></button>').join('') + '</div>';
    const fileBtn = e.file && e.file.dataUrl ? '<button class="btn btn-sm btn-outline" type="button" data-action="view-upload" data-id="' + e.id + '">' + I('image', 'icon-sm') + 'View uploaded file</button>' : e.file ? '<span class="chip">' + I('file') + esc(e.file.name) + '</span>' : '';
    const qcards = e.questions.map((q, i) => {
      const unsure = q.conf < 80;
      const conf = unsure ? chip('amber', q.conf + '% sure', 'alert') : chip('green', q.conf + '% sure', 'check');
      let inner;
      if (unsure && !q.resolved) {
        inner = '<p class="small bold mb-8">Which did ' + esc(s.first) + ' write?</p><div class="choice-row" role="group" aria-label="Suggested readings for question ' + (i + 1) + '">' +
          q.alts.map(([v, p]) => '<button type="button" class="choice" data-action="ocr-pick" data-q="' + q.id + '" data-v="' + esc(v) + '" aria-pressed="' + (q.value === v && q.pick !== 'custom') + '">' + esc(v) + '<sup>' + p + '%</sup></button>').join('') +
          '<label class="sr-only" for="ocr-custom-' + q.id + '">Or type the answer yourself</label><input class="input" id="ocr-custom-' + q.id + '" placeholder="or type it yourself" value="' + (q.pick === 'custom' ? esc(q.value) : '') + '" data-input="ocr-custom" data-q="' + q.id + '"></div>' +
          '<div class="row-between"><span class="tiny muted">Compare with the dashed box on the scan.</span><button class="btn btn-success btn-sm" type="button" data-action="ocr-resolve" data-q="' + q.id + '">' + I('check', 'icon-sm') + 'Confirm this reading</button></div>';
      } else {
        inner = '<label class="sr-only" for="ocr-v-' + q.id + '">Extracted answer for question ' + (i + 1) + '</label><input class="input" id="ocr-v-' + q.id + '" value="' + esc(q.value) + '" data-input="ocr-edit" data-q="' + q.id + '">' +
          (unsure ? '<div class="row-between mt-8"><span class="tiny c-green bold">' + I('checkCircle', 'icon-xs') + ' Confirmed by you</span><button class="link-btn tiny" type="button" data-action="ocr-reopen" data-q="' + q.id + '">Change reading</button></div>' :
            (q.value !== q.read ? '<div class="tiny c-purple bold mt-8">' + I('edit', 'icon-xs') + ' Corrected (OCR read “' + esc(q.read) + '”) <button class="link-btn tiny" type="button" data-action="ocr-undo" data-q="' + q.id + '">Undo</button></div>' : ''));
      }
      return '<div class="ocr-q ' + (unsure ? (q.resolved ? 'resolved' : 'uncertain') : '') + '" id="ocrq-' + q.id + '"><div class="q-head"><span><b>Q' + (i + 1) + '</b> ' + esc(q.label) + ' <span class="lang-tag">' + esc(q.format) + '</span></span>' + conf + '</div>' + inner + '</div>';
    }).join('');
    const ready = !unresolved.length;
    return {
      html: '<div class="ocr-layout"><section class="card" aria-labelledby="scan-h"><div class="card-head"><div><div class="eyebrow" id="scan-h">Original paper scan</div><div class="card-sub">Click a line to compare it with the extracted answer.</div></div>' + fileBtn + '</div>' + paper +
        '<div class="legend"><span class="sw" aria-hidden="true"></span>Dashed amber box = OCR is not sure what was written</div></section>' +
        '<section class="card" aria-labelledby="ocr-h"><div class="card-head"><div><div class="eyebrow" id="ocr-h">OCR extracted answers</div><div class="mt-8">' + (unresolved.length ? chip('amber', unresolved.length + ' uncertain — check before grading', 'alert') : chip('green', 'All answers checked', 'checkCircle')) + '</div></div></div>' +
        '<div class="notice mb-16">' + I('user') + '<span><b>' + esc(s.name) + '</b> (ID: ' + esc(s.no) + ') • ' + esc(e.title) + ' • ' + esc(e.lang) + '</span></div>' + qcards + '</section></div>' +
        '<div class="action-bar" role="region" aria-label="Step 1 actions"><div class="status ' + (ready ? 'ok' : '') + '" role="status">' + I(ready ? 'checkCircle' : 'alertCircle') +
        (ready ? 'All answers are checked. Corrections are saved automatically.' : 'Resolve ' + (unresolved.length === 1 ? 'the uncertain answer' : 'the ' + unresolved.length + ' uncertain answers') + ' before AI grading can start.') + '</div>' +
        '<div class="btns"><a class="btn btn-outline" href="#/submissions">Save & exit</a><button class="btn btn-primary" type="button" data-action="run-ai" ' + (ready ? '' : 'aria-disabled="true"') + '>Save Corrections & Run AI Grading ' + I('arrowRight', 'icon-sm') + '</button></div></div>',
      after: () => {
        if (active) { const el = document.getElementById('ocrq-' + active); if (el) el.classList.add('flash'); }
      }
    };
  }

  /* ---------- Step 2: AI grading ---------- */
  function step2(e) {
    const a = e.ai, s = D.student(e.studentId);
    const cards = e.questions.map((q, i) => {
      const r = a.scores[q.id];
      const kind = r.score === q.max ? '' : r.score > 0 ? 'partial' : 'wrong';
      const tone = kind === '' ? 'green' : kind === 'partial' ? 'amber' : 'red';
      return '<article class="q-card ' + kind + '"><div class="row-between"><span class="q-k">Question ' + (i + 1) + '</span>' + chip(tone, r.score + '/' + q.max) + '</div><h4>' + esc(q.label) + '</h4>' +
        '<p class="tiny muted">' + esc(q.prompt) + ' → <b>' + esc(q.value) + '</b></p><p class="' + (kind ? 'c-' + tone : '') + '">' + esc(r.reasoning) + '</p>' +
        '<div class="foot c-' + tone + '">' + I(kind === '' ? 'checkCircle' : kind === 'partial' ? 'flag' : 'xCircle', 'icon-xs') + ' ' + esc(r.tag) + '</div></article>';
    }).join('');
    const mastered = e.questions.filter((q) => a.scores[q.id].score === q.max).reduce((n, q) => n + q.max, 0);
    return {
      html: '<section class="card"><div class="score-hero"><div class="score-box" aria-label="AI suggested score ' + a.pct + ' percent"><div><b>' + a.pct + '%</b><span>SUGGESTED</span></div></div>' +
        '<div style="flex:1;min-width:240px"><div class="row row-wrap"><h3 style="font-size:20px">PaperMind AI Suggested Score</h3>' + chip('purple', 'AI Suggested Grade', 'sparkles') + '</div>' +
        '<p class="mt-8"><b>' + a.total + ' / ' + a.max + ' points</b> <span class="muted small">· Calculated from the OCR transcript you confirmed in Step 1. Nothing is final until you confirm it in Step 3.</span></p></div>' +
        (a.redFlag ? chip('amber', '1 Red Flag Suggested', 'flag') : chip('green', 'No red flag suggested', 'check')) + '</div></section>' +
        '<section class="mt-24"><div class="row-between mb-16"><h3>Itemized Problem Breakdown</h3><div class="row tiny"><span class="dot dot-green"></span>Mastered (' + mastered + ' pts) <span class="dot dot-red" style="margin-left:10px"></span>Needs attention (' + (a.max - mastered) + ' pts)</div></div><div class="q-cards">' + cards + '</div></section>' +
        '<div class="grid grid-2 mt-24"><section class="card"><div class="card-head"><h3>' + I('lightbulb', 'icon-sm') + ' AI Analysis</h3>' + chip('purple', 'Suggestion', 'sparkles') + '</div><p>' + esc(a.insight) + '</p>' +
        '<h4 class="mt-16 mb-8 small">Suggested learning gaps</h4>' + (a.gaps.length ? '<div class="stack">' + a.gaps.map((g) => '<div class="row-between small"><span>' + GAPS[g.id].emoji + ' ' + esc(GAPS[g.id].title) + '</span>' + chip(g.confidence >= 75 ? 'green' : 'amber', 'AI confidence ' + g.confidence + '%') + '</div>').join('') + '</div>' : '<p class="small muted">No learning gaps detected.</p>') + '</section>' +
        '<section class="card ' + (a.redFlag ? 'flag-card' : '') + '"><div class="card-head"><h3>' + I('flag', 'icon-sm') + ' Possible red flag</h3></div>' +
        (a.redFlag ? '<p><b>' + esc(a.redFlag.title) + '</b></p><p class="small mt-8">' + esc(a.redFlag.reason) + '</p>' : '<p class="small muted">The AI did not find a pattern that needs a red flag.</p>') +
        (a.recurring.length ? '<p class="small mt-12">' + I('refresh', 'icon-xs') + ' ' + U.plural(a.recurring.length, 'recurring mistake') + ' matched from earlier exams.</p>' : '') +
        '<div class="notice mt-16">' + I('info') + '<span>You will <b>confirm or dismiss</b> every gap, recurring mistake and red flag in Step 3. ' + esc(s.first) + ' sees nothing until you publish.</span></div></section></div>' +
        '<div class="action-bar" role="region" aria-label="Step 2 actions"><a class="btn btn-outline" href="#/grading/' + e.id + '/1">' + I('arrowLeft', 'icon-sm') + 'Back to OCR</a>' +
        '<div class="btns"><button class="btn btn-ghost" type="button" data-action="rerun-ai">' + I('refresh', 'icon-sm') + 'Re-run AI Grader</button><button class="btn btn-primary" type="button" data-action="to-step3">Proceed to Teacher Confirmation ' + I('arrowRight', 'icon-sm') + '</button></div></div>'
    };
  }

  /* ---------- Step 3: teacher confirmation ---------- */
  function finalScore(e) {
    const total = e.questions.reduce((n, q) => n + (Number(e.review.scores[q.id]) || 0), 0);
    const max = e.questions.reduce((n, q) => n + q.max, 0);
    return { total, max, pct: Math.round((total / max) * 100) };
  }
  function decisionsLeft(e) {
    const a = e.ai, r = e.review;
    let n = a.gaps.filter((g) => !r.gapDecisions[g.id]).length;
    n += a.recurring.filter((id) => !r.recurringDecisions[id]).length;
    if (a.redFlag && !r.redFlagDecision) n++;
    return n;
  }
  const decBtns = (kind, id, val, labels) => '<div class="row"><button type="button" class="toggle-btn ok" data-action="decide" data-kind="' + kind + '" data-id="' + id + '" data-v="confirmed" aria-pressed="' + (val === 'confirmed') + '">' + I('check', 'icon-xs') + (labels ? labels[0] : 'Confirm') + '</button>' +
    '<button type="button" class="toggle-btn no" data-action="decide" data-kind="' + kind + '" data-id="' + id + '" data-v="dismissed" aria-pressed="' + (val === 'dismissed') + '">' + I('x', 'icon-xs') + (labels ? labels[1] : 'Dismiss') + '</button></div>';
  const decChip = (v) => (v === 'confirmed' ? chip('green', 'Confirmed', 'check') : v === 'dismissed' ? chip('', 'Dismissed', 'x') : chip('amber', 'Needs your decision'));

  function step3(e) {
    const a = e.ai, r = e.review, s = D.student(e.studentId);
    const fs = finalScore(e);
    const rows = e.questions.map((q, i) => {
      const ai = a.scores[q.id];
      const kind = ai.score === q.max ? '' : ai.score > 0 ? 'partial' : 'wrong';
      const changed = Number(r.scores[q.id]) !== ai.score;
      return '<tr><td><b>Q' + (i + 1) + '</b> ' + esc(q.prompt) + '<div class="tiny muted">Correct: ' + esc(q.correct) + '</div></td><td><span class="hand">' + esc(q.value) + '</span></td>' +
        '<td><div class="reason-bubble ' + kind + '">' + I('sparkles', 'icon-xs') + ' ' + esc(ai.reasoning) + '</div></td>' +
        '<td><div class="pts"><label class="sr-only" for="pts-' + q.id + '">Points for question ' + (i + 1) + ' out of ' + q.max + '</label><input class="input ' + (changed ? 'changed' : '') + '" type="number" min="0" max="' + q.max + '" step="1" id="pts-' + q.id + '" value="' + esc(r.scores[q.id]) + '" data-input="score" data-q="' + q.id + '"> <span class="small">/' + q.max + '</span></div><div class="tiny muted" style="text-align:right">AI: ' + ai.score + '</div></td></tr>' +
        '<tr class="override-reason" id="reason-row-' + q.id + '" ' + (changed ? '' : 'hidden') + '><td colspan="4"><div class="field" style="margin:8px 0 0"><label for="reason-' + q.id + '">Why did you change Q' + (i + 1) + '? (required, private to teachers)</label><input class="input" id="reason-' + q.id + '" value="' + esc(r.reasons[q.id] || '') + '" placeholder="e.g. Method was correct, small copying error" data-input="reason" data-q="' + q.id + '"></div></td></tr>';
    }).join('');

    const gapCards = a.gaps.map((g) => {
      const G = GAPS[g.id], v = r.gapDecisions[g.id];
      return '<div class="decision ' + (v || '') + '"><div class="row-between"><h4>' + esc(G.title) + '</h4>' + decChip(v) + '</div><div class="ev">Evidence: ' + esc(g.evidence) + '</div>' +
        '<div class="acts">' + chip(g.confidence >= 75 ? 'green' : 'amber', 'AI confidence ' + g.confidence + '%') + decBtns('gap', g.id, v) + '</div></div>';
    }).join('') || '<p class="small muted">No learning gaps were suggested for this exam.</p>';

    const recCards = a.recurring.map((id) => {
      const rec = st().recurring.find((x) => x.id === id); if (!rec) return '';
      const v = r.recurringDecisions[id];
      const times = rec.history.filter((h) => !h.ok).length + 1;
      return '<div class="decision ' + (v || '') + '"><div class="row-between"><h4>' + esc(rec.pattern) + '</h4>' + decChip(v) + '</div><div class="hist">' +
        rec.history.concat(rec.latest ? [rec.latest] : []).map((h) => '<div class="' + (h.ok ? 'ok' : '') + '">' + (h.ok ? '✓ ' : '✗ ') + esc(h.title) + '<small>' + esc(h.when + ' · ' + h.lang) + '</small></div>').join('') +
        '<div class="now">✗ ' + esc(e.title) + '<small>Today · ' + esc(e.lang) + '</small></div></div><div class="acts"><span class="small muted">Same pattern ' + times + '× across exams</span>' + decBtns('rec', id, v) + '</div></div>';
    }).join('');

    let flag = '';
    if (a.redFlag) {
      const v = r.redFlagDecision;
      flag = '<section class="card flag-card ' + (v === 'confirmed' ? 'confirmed' : '') + '"><div class="row-between"><h3 style="font-size:16px">' + I('flag', 'icon-sm') + ' AI-flagged issue: ' + esc(a.redFlag.title) + '</h3>' + decChip(v) + '</div>' +
        '<p class="small mt-8">' + esc(a.redFlag.reason) + '</p><div class="student-sees"><b>If you confirm, ' + esc(s.first) + ' sees:</b> “' + esc(a.redFlag.studentText) + '”</div>' +
        '<div class="field"><label for="flag-note">Private note for teachers (optional)</label><input class="input" id="flag-note" value="' + esc(r.privateNote) + '" data-input="flag-note" placeholder="Only teachers can see this"></div>' +
        '<div class="row" style="justify-content:flex-end">' + decBtns('flag', 'flag', v, ['Confirm Flag', 'Dismiss']) + '</div></section>';
    }
    const lp = st().langProfiles[e.studentId], hyp = D.langHypothesis(lp);
    const lang = lp && hyp && ['language', 'both'].includes(hyp.key) ? '<section class="card lang-card"><h3 style="font-size:16px">' + I('globe', 'icon-sm') + ' Language check</h3><p class="small mt-8">' + esc(s.first) + ' scores <b>' + lp.direct + '%</b> on the same ' + esc(lp.concept.toLowerCase()) + ' skills in direct questions, but <b>' + lp.wordDe + '%</b> when the word problem is in German. This looks <b>' + esc(hyp.label.toLowerCase()) + '</b>-related — a suggestion, not a diagnosis.</p><a class="link-btn small mt-12" href="#/gaps?student=' + s.id + '">Open language vs concept analysis ' + I('arrowRight', 'icon-xs') + '</a></section>' : '';
    const left = decisionsLeft(e);
    return {
      html: '<section class="card"><div class="card-head"><div><h3>Confirm or Override the Grade</h3><p class="card-sub">Change any question’s points. A short reason is required for every change.</p></div>' +
        '<div class="final-pill">AI: ' + a.pct + '% ' + I('arrowRight', 'icon-xs') + ' Final Grade: <b id="final-grade" aria-live="polite">' + fs.pct + '%</b><span class="tiny muted" id="final-pts">' + fs.total + '/' + fs.max + '</span></div></div>' +
        '<div class="table-wrap"><table class="table confirm-table"><thead><tr><th scope="col">Question</th><th scope="col">' + esc(s.first) + ' wrote</th><th scope="col">AI reasoning</th><th scope="col" style="text-align:right">Points</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>' +
        '<div class="grid grid-2 mt-24" style="align-items:start"><div class="stack"><div><h3>Learning Gaps for ' + esc(s.first) + '</h3><p class="small muted">AI suggests, you decide.</p></div>' + gapCards +
        (recCards ? '<h3 class="mt-8">Recurring Mistake' + (a.recurring.length > 1 ? 's' : '') + '</h3>' + recCards : '') + '</div>' +
        '<div class="stack">' + flag + lang +
        '<section class="card"><div class="row-between"><h3 style="font-size:16px">Feedback to ' + esc(s.first) + ' <span class="small muted">(shown in ' + (s.avatar === '👦' ? 'his' : 'her') + ' portal)</span></h3><button class="link-btn tiny" type="button" data-action="restore-draft">' + I('undo', 'icon-xs') + 'Restore AI draft</button></div>' +
        '<p class="tiny c-purple mt-8">' + I('sparkles', 'icon-xs') + ' AI draft written for a Grade 4 reader — edit anything before publishing.</p>' +
        '<div class="field mt-8"><label class="sr-only" for="fb">Feedback text</label><textarea class="textarea" id="fb" rows="6" data-input="feedback" maxlength="600">' + esc(r.feedback) + '</textarea><div class="hint" id="fb-count">' + r.feedback.length + ' / 600 characters</div></div></section></div></div>' +
        '<div class="action-bar" role="region" aria-label="Step 3 actions"><a class="btn btn-outline" href="#/grading/' + e.id + '/2">' + I('arrowLeft', 'icon-sm') + 'Back to AI Grade</a>' +
        '<div class="btns" style="align-items:center"><span class="small ' + (left ? 'c-amber bold' : 'c-green bold') + '" id="dec-left" role="status">' + (left ? left + (left === 1 ? ' decision left' : ' decisions left') : '✓ 0 decisions left') + '</span>' +
        '<button class="btn btn-primary" type="button" data-action="confirm-grade" ' + (left ? 'aria-disabled="true" title="Confirm or dismiss every item first"' : '') + '>Confirm Grade & Feedback ' + I('arrowRight', 'icon-sm') + '</button></div></div>'
    };
  }

  /* ---------- Step 4: feedback & notification ---------- */
  function step4(e) {
    const a = e.ai, r = e.review, s = D.student(e.studentId), fs = finalScore(e);
    const gaps = a.gaps.filter((g) => r.gapDecisions[g.id] === 'confirmed');
    const flagOn = a.redFlag && r.redFlagDecision === 'confirmed';
    const overrides = e.questions.filter((q) => Number(r.scores[q.id]) !== a.scores[q.id].score).length;
    const prac = st().practice.filter((p) => p.classId === e.classId);
    const sess = st().sessions.filter((x) => x.classId === e.classId && x.at > Date.now());
    if (r.practiceId === '' && !r._practiceTouched) { const cand = prac.filter((p) => gaps.some((g) => g.id === p.gapId) && !p.completion[s.id]); const sug = cand.find((p) => !p.assignedTo.includes(s.id)) || cand[0]; if (sug) r.practiceId = sug.id; }
    if (r.sessionId === '' && !r._sessionTouched && flagOn) { const sug = sess.find((x) => { const g = st().groups.find((gg) => gg.id === x.groupId); return g && gaps.some((gp) => gp.id === g.gapId); }); if (sug) r.sessionId = sug.id; }
    const p = prac.find((x) => x.id === r.practiceId), ss = sess.find((x) => x.id === r.sessionId);
    return {
      html: '<section class="card"><div class="publish-banner"><span class="big-check">' + I('check') + '</span><div><b>Ready to Publish to ' + esc(s.first) + '’s Portal</b><div class="small muted">Nothing is visible to ' + esc(s.first) + ' until you press Publish.</div></div></div>' +
        '<div class="grid grid-2"><div class="card card-tight" style="box-shadow:none"><div class="eyebrow mb-8" style="color:var(--muted)">Summary</div>' +
        '<div class="sum-row"><span>Final grade</span><b>' + fs.pct + '% (' + fs.total + '/' + fs.max + ')</b></div>' +
        '<div class="sum-row"><span>Your changes</span><b>' + (overrides ? U.plural(overrides, 'score override') : 'AI grade accepted') + '</b></div>' +
        '<div class="sum-row"><span>Learning gaps shown</span><b>' + (gaps.length ? gaps.map((g) => esc(GAPS[g.id].short)).join(', ') : 'None') + '</b></div>' +
        '<div class="sum-row"><span>Red flag</span><b>' + (!a.redFlag ? 'None suggested' : flagOn ? 'Confirmed (shown kindly)' : 'Dismissed (not shown)') + '</b></div>' +
        '<div class="field mt-16"><label for="att-practice">Attach practice (optional)</label><select class="select" id="att-practice" data-input="att-practice"><option value="">No practice</option>' + prac.map((x) => '<option value="' + x.id + '" ' + (x.id === r.practiceId ? 'selected' : '') + '>' + esc(x.title) + (x.assignedTo.includes(s.id) ? ' (already assigned)' : '') + '</option>').join('') + '</select><a class="hint" href="#/practice?student=' + s.id + '">Create new practice for ' + esc(s.first) + ' →</a></div>' +
        '<div class="field"><label for="att-session">Recommend a support session (optional)</label><select class="select" id="att-session" data-input="att-session"><option value="">No session</option>' + sess.map((x) => '<option value="' + x.id + '" ' + (x.id === r.sessionId ? 'selected' : '') + '>' + esc(x.title) + ' · ' + U.fmtWhen(x.at) + '</option>').join('') + '</select></div></div>' +
        '<div class="card card-tight preview-card" style="box-shadow:none"><div class="row-between"><div class="eyebrow">Student view preview</div>' + chip('amber', '⭐ ' + s.stars + ' Stars Total') + '</div>' +
        '<h4 class="mt-12">' + esc(e.title) + ' — ' + esc(e.topics) + ' • Result: ' + fs.pct + '%</h4><div class="quote">“' + esc(r.feedback) + '”</div><div class="row row-wrap">' +
        gaps.map((g) => chip('purple', GAPS[g.id].emoji + ' ' + GAPS[g.id].short)).join('') + (flagOn ? chip('amber', '💛 Extra help with ' + GAPS[a.redFlag.gapId || (gaps[0] && gaps[0].id) || 'g-de-vocab'].short) : '') +
        (p ? chip('blue', '📘 Practice: ' + p.title) : '') + (ss ? chip('green', '📅 Session invite') : '') + '</div>' +
        '<p class="tiny muted mt-16">' + I('mail', 'icon-xs') + ' ' + esc(s.first) + ' gets a notification in the student portal when you publish.</p></div></div></section>' +
        '<div class="action-bar" role="region" aria-label="Step 4 actions"><a class="btn btn-outline" href="#/grading/' + e.id + '/3">' + I('arrowLeft', 'icon-sm') + 'Back to Edit</a>' +
        '<button class="btn btn-success btn-lg" type="button" data-action="publish">Publish Feedback & Notify ' + esc(s.first) + ' 🚀</button></div>'
    };
  }

  function vPublished(e) {
    const s = D.student(e.studentId), pb = e.published;
    const next = pending()[0];
    const p = pb.practiceId && st().practice.find((x) => x.id === pb.practiceId);
    return {
      title: 'Grading',
      html: '<section class="card wf-head"><nav class="breadcrumb" aria-label="Breadcrumb"><a href="#/submissions?filter=published">Published</a>' + I('chevRight', 'icon-xs') + '<span>' + esc(s.name) + '</span></nav>' +
        '<div class="wf-title"><div><div class="eyebrow">Published</div><h2>' + esc(e.title) + ' — ' + esc(s.name) + '</h2><div class="meta">Published ' + U.timeAgo(pb.at) + ' • visible in ' + esc(s.first) + '’s portal</div></div>' + chip('green', 'Grade: ' + pb.pct + '%', 'checkCircle') + '</div></section>' +
        '<div class="grid grid-2"><section class="card"><h3>What ' + esc(s.first) + ' sees</h3><div class="quote">“' + esc(pb.feedback) + '”</div>' +
        '<div class="sum-row"><span>Grade</span><b>' + pb.pct + '%' + (pb.max ? ' (' + pb.score + '/' + pb.max + ')' : '') + '</b></div>' +
        '<div class="sum-row"><span>Learning gaps</span><b>' + (pb.gaps.length ? pb.gaps.map((g) => esc(GAPS[g.id].short)).join(', ') : 'None') + '</b></div>' +
        '<div class="sum-row"><span>Red flag</span><b>' + (pb.redFlag ? 'Confirmed: ' + esc(pb.redFlag.title.replace(/^Potential /, '')) : 'None') + '</b></div>' +
        '<div class="sum-row"><span>Practice</span><b>' + (p ? esc(p.title) : 'None attached') + '</b></div></section>' +
        '<section class="card"><h3>Next steps</h3><div class="stack mt-16">' +
        (next ? '<a class="btn btn-primary" href="#/grading/' + next.id + '">Grade next exam: ' + esc(sname(next.studentId)) + ' ' + I('arrowRight', 'icon-sm') + '</a>' : '<div class="notice ok">' + I('checkCircle') + '<span>Queue is empty — every exam in ' + esc(cls().name) + ' is published.</span></div>') +
        '<a class="btn" href="#/practice?student=' + s.id + '">Assign practice to ' + esc(s.first) + '</a><a class="btn" href="#/notifications?to=' + s.id + '">Send ' + esc(s.first) + ' a message</a><a class="btn btn-outline" href="#/submissions">Back to submissions</a></div></section></div>'
    };
  }

  /* =========================================================
     LEARNING GAPS
     ========================================================= */
  function clusters() {
    const map = {};
    D.classStudents(cid()).forEach((s) => (st().studentGaps[s.id] || []).forEach((g) => { (map[g] = map[g] || []).push(s.id); }));
    return Object.entries(map).map(([g, ids]) => ({ g, ids })).sort((a, b) => b.ids.length - a.ids.length);
  }
  function vGaps(p, q) {
    const ui = st().ui, cl = clusters(), studs = D.classStudents(cid());
    if (q.student && D.student(q.student) && D.student(q.student).classId === cid()) ui.langStudent = q.student;
    if (!ui.langStudent || !studs.find((s) => s.id === ui.langStudent)) ui.langStudent = studs[0] && studs[0].id;
    const draft = ui.groupDraft && ui.groupDraft.classId === cid() ? ui.groupDraft : null;
    const gapOpts = cl.map((c) => c.g);
    const gSel = draft ? draft.gapId : gapOpts[0];
    const preset = draft && draft.ids ? draft.ids : (cl.find((c) => c.g === gSel) || { ids: [] }).ids;
    const sugg = (cl.find((c) => c.g === gSel) || { ids: [] }).ids;
    const groups = st().groups.filter((g) => g.classId === cid());

    const clusterHTML = cl.length ? cl.map((c) => {
      const sev = c.ids.length >= 3 ? ['high', 'red', 'High severity'] : c.ids.length === 2 ? ['medium', 'amber', 'Medium severity'] : ['low', 'blue', 'Low severity'];
      return '<article class="card cluster ' + sev[0] + '"><div class="row-between">' + chip(sev[1], sev[2]) + '<button class="btn btn-primary btn-xs" type="button" data-action="prefill-group" data-g="' + c.g + '">' + I('group', 'icon-xs') + 'Group ' + U.plural(c.ids.length, 'student') + '</button></div>' +
        '<h3>' + GAPS[c.g].emoji + ' ' + esc(GAPS[c.g].title) + '</h3><p class="small muted">' + esc(GAPS[c.g].simple) + '</p><div class="row row-wrap mt-12"><span class="tiny muted">Affecting:</span>' + c.ids.map((id) => '<span class="chip">' + esc(sname(id)) + '</span>').join('') + '</div></article>';
    }).join('') : '<div class="empty">' + I('target') + '<h3>No confirmed learning gaps yet</h3><p>Gaps appear here after you confirm them while grading.</p></div>';

    const groupForm = '<form class="card sticky-form" data-form="create-group" novalidate aria-labelledby="cg-h"><h3 id="cg-h" class="card-title-ico"><span class="ti ico-amber">' + I('sparkles') + '</span>Create Targeted Group</h3><p class="card-sub mb-16">Group students who share a confirmed gap, then assign practice or a session.</p>' +
      '<div class="field"><label for="g-name">Group name</label><input class="input" id="g-name" name="name" data-input="group-name" value="' + esc(draft && draft.name || (gSel ? GAPS[gSel].short + ' Support' : '')) + '" maxlength="60" required></div>' +
      '<div class="field"><label for="g-gap">Based on confirmed gap</label><select class="select" id="g-gap" name="gap" data-input="group-gap">' + Object.keys(GAPS).filter((g) => gapOpts.includes(g)).map((g) => '<option value="' + g + '" ' + (g === gSel ? 'selected' : '') + '>' + esc(GAPS[g].short) + '</option>').join('') + (gapOpts.length ? '' : '<option value="">No confirmed gaps yet</option>') + '</select></div>' +
      '<div class="notice mb-16">' + I('sparkles') + '<span>AI pre-ticked students who share this confirmed gap. Tick or untick anyone.</span></div>' +
      '<fieldset style="border:0;padding:0;margin:0"><legend class="sr-only">Students</legend><div class="check-grid">' + studs.map((s) => {
        const on = preset.includes(s.id);
        return '<label class="check ' + (on ? 'is-checked' : '') + '"><input type="checkbox" name="students" value="' + s.id + '" ' + (on ? 'checked' : '') + ' data-input="group-check">' + esc(s.name) + (sugg.includes(s.id) ? '<span class="tag">AI</span>' : '') + '</label>';
      }).join('') + '</div></fieldset>' +
      '<button class="btn btn-primary btn-block mt-16" type="submit" id="g-submit" ' + (preset.length >= 2 && (draft && draft.name || gSel) ? '' : 'aria-disabled="true"') + '>Create Group (' + preset.length + ' students)</button><p class="hint mt-8" style="text-align:center">Enabled once the group has a name and at least 2 students.</p></form>';
    const savedGroups = '<section class="card" aria-labelledby="sg-h"><div class="card-head"><h3 id="sg-h" class="card-title-ico"><span class="ti ico-purple">' + I('group') + '</span>Saved groups <span class="count-pill">' + groups.length + '</span></h3></div>' + (groups.length ? '<div class="stack">' + groups.map((g) => '<div class="assign-card"><div class="row-between"><h4>' + esc(g.name) + '</h4>' + chip(g.source === 'AI-suggested' ? 'purple' : '', g.source) + '</div><div class="meta">' + g.studentIds.map(sname).map(esc).join(', ') + ' · ' + esc(GAPS[g.gapId] ? GAPS[g.gapId].short : '') + '</div>' +
        '<div class="acts"><a class="btn btn-xs" href="#/practice?group=' + g.id + '">' + I('practice', 'icon-xs') + 'Assign practice</a><a class="btn btn-xs" href="#/sessions?group=' + g.id + '">' + I('calendar', 'icon-xs') + 'Recommend session</a><button class="btn btn-xs btn-danger" type="button" data-action="delete-group" data-id="' + g.id + '">' + I('trash', 'icon-xs') + 'Delete</button></div></div>').join('') + '</div>' : '<p class="small muted">No groups yet — create one with the form.</p>') + '</section>';

    const recs = st().recurring.filter((r) => r.classId === cid());
    const mk = (h) => (!h ? '<span class="mark na" title="Not graded yet">–</span><span class="sr-only">not graded yet</span>' : h.ok ? '<span class="mark ok">' + I('check') + '</span><span class="sr-only">correct</span>' : '<span class="mark x">' + I('x') + '</span><span class="sr-only">mistake</span>');
    const recTable = recs.length ? '<div class="table-wrap"><table class="table"><thead><tr><th scope="col">Mistake pattern</th><th scope="col">Student</th><th scope="col">Exam 1</th><th scope="col">Exam 2</th><th scope="col">Latest</th><th scope="col">Times</th><th scope="col"><span class="sr-only">Evidence</span></th></tr></thead><tbody>' +
      recs.map((r) => { const times = [...r.history, r.latest].filter((h) => h && !h.ok).length; return '<tr><td>' + esc(r.pattern) + (r.status === 'dismissed' ? ' ' + chip('', 'Dismissed') : '') + '</td><td>' + esc(sname(r.studentId)) + '</td>' + [r.history[0], r.history[1], r.latest].map((h) => '<td title="' + esc(h ? h.title + ' · ' + h.when : 'Not graded yet') + '">' + mk(h) + '<div class="tiny muted">' + esc(h ? h.title : '—') + '</div></td>').join('') + '<td><b class="' + (times >= 3 ? 'c-red' : 'c-amber') + '">' + times + '×</b></td><td><button class="btn btn-xs btn-outline" type="button" data-action="rec-evidence" data-id="' + r.id + '">Evidence</button></td></tr>'; }).join('') + '</tbody></table></div>'
      : '<p class="small muted">No recurring mistakes detected in this class yet.</p>';

    const ls = D.student(ui.langStudent), lp = ls && st().langProfiles[ls.id], hyp = D.langHypothesis(lp);
    const dec = lp && lp.decision;
    const pend = ui.langPending && ui.langPending.sid === (ls && ls.id) ? ui.langPending.v : dec ? dec.value : null;
    const langHTML = ls && lp ? '<div class="grid grid-2" style="align-items:start"><div><p class="small mb-16">Concept: <b>' + esc(lp.concept) + '</b> · ' + U.plural(lp.samples, 'answer') + ' analysed</p>' +
      bar('Direct questions', lp.direct, (v) => v + '%') + bar('Word problems (English)', lp.wordEn, (v) => v + '%') + bar('Textaufgaben — word problems (German)', lp.wordDe, (v) => v + '%') + '</div>' +
      '<div><div class="hyp"><b>' + I('sparkles', 'icon-sm') + ' AI hypothesis: ' + esc(hyp.label) + '</b><p class="small mt-8">' + esc(hyp.text) + '</p><p class="tiny muted mt-8"><i>This is only a suggestion — the teacher makes the final decision.</i></p></div>' +
      '<fieldset style="border:0;padding:0;margin:16px 0 0"><legend class="small bold mb-8">Your decision (final)</legend><div class="radio-chips">' +
      [['concept', 'Concept difficulty'], ['language', 'Language difficulty'], ['both', 'Both'], ['insufficient', 'Insufficient evidence']].map(([k, l]) => '<label><input type="radio" name="lang-dec" value="' + k + '" ' + (pend === k ? 'checked' : '') + ' data-input="lang-dec"><span>' + l + '</span></label>').join('') + '</div></fieldset>' +
      '<div class="row-between mt-16"><span class="small ' + (dec ? 'c-green bold' : 'muted') + '" role="status">' + (dec ? I('check', 'icon-xs') + ' Saved: ' + esc(labelDec(dec.value)) + ' · ' + U.timeAgo(dec.at) : 'No decision saved yet') + '</span>' +
      '<button class="btn btn-primary btn-sm" type="button" data-action="save-lang" ' + (!pend || (dec && dec.value === pend) ? 'aria-disabled="true"' : '') + '>Save decision</button></div></div></div>' : '<p class="small muted">No data for this student yet.</p>';

    return {
      title: 'Learning Gaps',
      html: '<div class="page-head"><div class="ph"><span class="ph-ico amber">' + I('target') + '</span><div><h2>Learning Gaps & Clusters</h2><p>AI detects patterns; you confirm them. Only confirmed gaps are shown here and to students.</p></div></div></div>' +
        kpis([[cl.length, 'Confirmed gaps', 'target', 'amber'], [new Set(cl.flatMap((c) => c.ids)).size + '/' + studs.length, 'Students affected', 'users', 'red'], [recs.filter((r) => r.status === 'confirmed').length, 'Recurring patterns', 'refresh', 'purple'], [groups.length, 'Support groups', 'group', 'green']]) +
        '<div class="grid grid-main-side" style="align-items:start"><div class="stack">' + clusterHTML + savedGroups + '</div>' + groupForm + '</div>' +
        '<section class="card mt-24" aria-labelledby="rm-h"><div class="card-head"><div><h3 id="rm-h">Recurring Mistakes Across Exams</h3><p class="card-sub">The same error pattern repeated in more than one assessment • ' + esc(cls().name) + '</p></div></div>' + recTable + '</section>' +
        '<section class="card mt-24" id="lang" aria-labelledby="lang-h"><div class="card-head"><div><h3 id="lang-h">' + I('globe', 'icon-sm') + ' Language vs Concept Analysis</h3><p class="card-sub">Same math concept, different question formats and languages. Is the difficulty the <b>math</b> or the <b>language</b>?</p></div>' +
        '<label class="sr-only" for="lang-student">Student</label><select class="select" id="lang-student" style="width:auto;min-width:200px" data-input="lang-student">' + studs.map((s) => '<option value="' + s.id + '" ' + (s.id === ui.langStudent ? 'selected' : '') + '>' + esc(s.name) + (st().langProfiles[s.id] && st().langProfiles[s.id].decision ? ' ✓' : '') + '</option>').join('') + '</select></div>' + langHTML + '</section>',
      after: () => { if (q.student) { const el = document.getElementById('lang'); if (el) el.scrollIntoView({ block: 'start' }); } }
    };
  }
  const labelDec = (k) => ({ concept: 'Concept difficulty', language: 'Language difficulty', both: 'Both', insufficient: 'Insufficient evidence' }[k] || k);

  /* =========================================================
     PRACTICE
     ========================================================= */
  const kpis = (arr) => '<div class="kpis">' + arr.map(([n, l, ic, tone]) => '<div class="kpi fade-up"><span class="s-ico ico-' + tone + '">' + I(ic) + '</span><div><b>' + n + '</b><span>' + l + '</span></div></div>').join('') + '</div>';
  function targetOptions(selected) {
    const groups = st().groups.filter((g) => g.classId === cid());
    return '<option value="">Choose a student or group…</option>' +
      (groups.length ? '<optgroup label="Groups">' + groups.map((g) => '<option value="group:' + g.id + '" ' + (selected === 'group:' + g.id ? 'selected' : '') + '>' + esc(g.name) + ' (' + g.studentIds.length + ' students)</option>').join('') + '</optgroup>' : '') +
      '<optgroup label="Students">' + D.classStudents(cid()).map((s) => '<option value="student:' + s.id + '" ' + (selected === 'student:' + s.id ? 'selected' : '') + '>' + esc(s.name) + ' (' + esc(cls().name) + ')</option>').join('') + '</optgroup>';
  }
  function resolveTarget(v) {
    if (!v) return [];
    const [k, id] = v.split(':');
    if (k === 'group') { const g = st().groups.find((x) => x.id === id); return g ? g.studentIds.slice() : []; }
    return [id];
  }
  function practiceStatus(p) {
    const done = p.assignedTo.filter((s) => p.completion[s]).length;
    return { done, total: p.assignedTo.length, all: done === p.assignedTo.length && p.assignedTo.length > 0 };
  }
  function vPractice(params, q) {
    const list = st().practice.filter((p) => p.classId === cid()).sort((a, b) => b.createdAt - a.createdAt);
    const f = st().ui.pracFilter || 'all';
    const shown = list.filter((p) => f === 'all' ? true : f === 'done' ? practiceStatus(p).all : !practiceStatus(p).all);
    const sel = q.group ? 'group:' + q.group : q.student ? 'student:' + q.student : '';
    let gapPre = '';
    if (q.group) { const g = st().groups.find((x) => x.id === q.group); if (g) gapPre = g.gapId; }
    if (q.student) gapPre = (st().studentGaps[q.student] || [])[0] || '';
    const cards = shown.map((p) => {
      const s = practiceStatus(p), overdue = U.isOverdue(p.due) && !s.all;
      return '<article class="assign-card prac-row fade-up">' + U.ring(s.total ? s.done / s.total * 100 : 0, 58, s.all ? 'var(--green-500)' : overdue ? 'var(--red-500)' : 'var(--amber-400)', s.done + '/' + s.total, s.done + ' of ' + s.total + ' completed') + '<div style="flex:1;min-width:0"><div class="row-between"><h4>' + p.emoji + ' ' + esc(p.title) + '</h4>' +
        (s.all ? chip('green', 'Completed', 'check') : chip(overdue ? 'red' : 'amber', U.fmtDue(p.due), 'clock')) + '</div>' +
        '<div class="meta">Topic: ' + esc(p.topic) + ' · Gap: ' + esc(GAPS[p.gapId] ? GAPS[p.gapId].short : '—') + (p.worksheet ? ' · ' + I('file', 'icon-xs') + ' ' + esc(p.worksheet.name) : '') + '</div>' +
        '<div class="meta">Assigned to: ' + p.assignedTo.map(sname).map(esc).join(', ') + '</div>' +
        '<div class="acts"><button class="btn btn-xs" type="button" data-action="practice-results" data-id="' + p.id + '">' + I('eye', 'icon-xs') + 'View Results</button>' +
        '<button class="btn btn-xs" type="button" data-action="practice-nudge" data-id="' + p.id + '" ' + (s.all ? 'aria-disabled="true"' : '') + '>' + I('bell', 'icon-xs') + 'Send Reminder</button>' +
        '<button class="btn btn-xs btn-danger" type="button" data-action="practice-delete" data-id="' + p.id + '">' + I('trash', 'icon-xs') + 'Remove</button></div></div></article>';
    }).join('');
    const gapsInClass = Object.keys(GAPS);
    return {
      title: 'Practice',
      html: '<div class="page-head"><div class="ph"><span class="ph-ico green">' + I('practice') + '</span><div><h2>Adaptive Practice Assignments</h2><p>Assign or upload practice for a student or group, based on confirmed learning gaps.</p></div></div></div>' +
        kpis([[list.length, 'Assignments', 'practice', 'green'], [list.reduce((n, p) => n + practiceStatus(p).done, 0) + '/' + list.reduce((n, p) => n + p.assignedTo.length, 0), 'Student completions', 'checkCircle', 'blue'], [list.filter((p) => U.isOverdue(p.due) && !practiceStatus(p).all).length, 'Overdue', 'clock', 'red'], [new Set(list.flatMap((p) => p.assignedTo)).size, 'Students practising', 'users', 'purple']]) +
        '<div class="grid grid-2" style="align-items:start"><form class="card" data-form="assign-practice" novalidate aria-labelledby="ap-h"><h3 id="ap-h" class="mb-16 card-title-ico"><span class="ti ico-green">' + I('plus') + '</span>Assign New Practice</h3>' +
        '<div class="field"><label for="p-target">Select student or group</label><select class="select" id="p-target" name="target" required>' + targetOptions(sel) + '</select></div>' +
        '<div class="field"><label for="p-title">Practice title</label><input class="input" id="p-title" name="title" maxlength="70" placeholder="e.g. Word Problems with German Visual Clues" required></div>' +
        '<div class="field"><label for="p-gap">For learning gap</label><select class="select" id="p-gap" name="gap" required><option value="">Choose a gap…</option>' + gapsInClass.map((g) => '<option value="' + g + '" ' + (g === gapPre ? 'selected' : '') + '>' + esc(GAPS[g].short) + '</option>').join('') + '</select><span class="hint">Students get a video, a worksheet and a 5-question quiz for this gap.</span></div>' +
        '<div class="field"><label for="p-desc">Instructions for students (optional)</label><input class="input" id="p-desc" name="desc" maxlength="140" placeholder="Short and friendly, e.g. Find out what is left over!"></div>' +
        '<div class="field"><span class="label" id="p-file-l">Upload worksheet (optional)</span><label class="file-btn" id="p-file-box"><input id="p-file" class="sr-only" name="file" type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" data-input="p-file" aria-labelledby="p-file-l"><span class="fb-ico">' + I('upload', 'icon-sm') + '</span><span><span class="fb-t" id="p-file-name">Choose a worksheet file</span><span class="fb-s" id="p-file-hint">PDF, image or Word · up to 5 MB</span></span></label></div>' +
        '<div class="form-row"><div class="field"><label for="p-due">Due date</label><input class="input" id="p-due" name="due" type="date" min="' + D.isoDay(0) + '" value="' + D.isoDay(3) + '" required></div>' +
        '<div class="field"><label for="p-min">Time needed</label><select class="select" id="p-min" name="minutes"><option value="5">5 minutes</option><option value="10" selected>10 minutes</option><option value="15">15 minutes</option></select></div></div>' +
        '<button class="btn btn-primary btn-block" type="submit">' + I('send', 'icon-sm') + 'Publish to Student Portal</button></form>' +
        '<section class="card" aria-labelledby="am-h"><div class="card-head"><h3 id="am-h" class="card-title-ico"><span class="ti ico-green">' + I('layers') + '</span>Active Assignments</h3><div class="seg" role="group" aria-label="Filter assignments">' + [['all', 'All'], ['open', 'In progress'], ['done', 'Completed']].map(([k, l]) => '<button type="button" aria-pressed="' + (f === k) + '" data-action="prac-filter" data-f="' + k + '">' + l + '</button>').join('') + '</div></div>' +
        '<div class="stack">' + (cards || '<div class="empty">' + I('practice') + '<h3>No assignments here</h3><p>Use the form to assign practice.</p></div>') + '</div></section></div>'
    };
  }

  /* =========================================================
     SUPPORT SESSIONS
     ========================================================= */
  function weekStrip(list) {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 7 }, (_, i) => new Date(t.getTime() + i * D.DAY));
    return '<section class="card week-card" aria-labelledby="wk-h"><div class="card-head"><h3 id="wk-h" class="card-title-ico"><span class="ti ico-purple">' + I('calendar') + '</span>Next 7 days</h3><span class="tiny muted">' + U.plural(list.filter((x) => x.at >= t.getTime() && x.at < t.getTime() + 7 * D.DAY).length, 'session') + '</span></div><div class="week">' +
      days.map((d, i) => { const ss = list.filter((x) => new Date(x.at).toDateString() === d.toDateString()); return '<div class="day ' + (i === 0 ? 'today ' : '') + (ss.length ? 'has' : '') + '"><span class="dn">' + ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()] + '</span><span class="dd">' + d.getDate() + '</span>' + ss.map((x) => '<span class="dev" title="' + esc(x.title) + '">' + U.fmtTime(x.at) + '</span>').join('') + '</div>'; }).join('') + '</div></section>';
  }
  function vSessions(params, q) {
    const groups = st().groups.filter((g) => g.classId === cid());
    const sel = q.group || (groups[0] && groups[0].id) || '';
    const g = groups.find((x) => x.id === sel);
    const list = st().sessions.filter((x) => x.classId === cid()).sort((a, b) => a.at - b.at);
    const def = new Date(Date.now() + 2 * D.DAY); def.setHours(15, 30, 0, 0);
    const dtVal = def.getFullYear() + '-' + String(def.getMonth() + 1).padStart(2, '0') + '-' + String(def.getDate()).padStart(2, '0') + 'T15:30';
    const cards = list.map((x) => {
      const past = x.at < Date.now();
      const grp = st().groups.find((gg) => gg.id === x.groupId);
      return '<article class="session-card fade-up"><div class="row-between">' + chip(past ? '' : 'purple', U.fmtWhen(x.at) + ' (' + x.duration + ' min)', 'clock') + '<div class="count"><b>' + x.registrations.length + '/' + x.capacity + '</b><span>registered</span></div></div>' +
        '<h4>' + esc(x.title) + '</h4><p class="small muted">' + I('pin', 'icon-xs') + ' ' + esc(x.location) + ' · Group: ' + esc(grp ? grp.name : 'Selected students') + ' · Why: ' + esc(x.why) + '</p>' +
        '<div class="seats mt-12" role="img" aria-label="' + x.registrations.length + ' of ' + x.capacity + ' seats taken">' + Array.from({ length: x.capacity }, (_, i) => '<span class="seat ' + (i < x.registrations.length ? 'on' : i < x.invitees.length ? 'inv' : '') + '"></span>').join('') + '<span class="tiny muted" style="margin-left:6px">' + (x.capacity - x.registrations.length) + ' seats free</span></div>' +
        '<div class="row row-wrap mt-12">' + x.invitees.map((sid) => x.registrations.includes(sid) ? chip('green', 'Registered · ' + sname(sid), 'check') : chip('', 'Invited · ' + sname(sid), 'mail')).join('') + '</div>' +
        '<div class="row row-wrap mt-16"><button class="btn btn-xs" type="button" data-action="session-remind" data-id="' + x.id + '" ' + (x.invitees.every((s) => x.registrations.includes(s)) || past ? 'aria-disabled="true"' : '') + '>' + I('bell', 'icon-xs') + 'Remind invited students</button>' +
        '<button class="btn btn-xs btn-danger" type="button" data-action="session-cancel" data-id="' + x.id + '">' + I('x', 'icon-xs') + 'Cancel session</button></div></article>';
    }).join('');
    return {
      title: 'Support Sessions',
      html: '<div class="page-head"><div class="ph"><span class="ph-ico sky">' + I('users') + '</span><div><h2>Targeted Support Sessions</h2><p>Recommend an after-school session to a group of students who share a confirmed learning gap.</p></div></div></div>' +
        kpis([[list.filter((x) => x.at > Date.now()).length, 'Upcoming sessions', 'calendar', 'purple'], [list.reduce((n, x) => n + x.registrations.length, 0), 'Registrations', 'checkCircle', 'green'], [list.reduce((n, x) => n + x.invitees.filter((i) => !x.registrations.includes(i)).length, 0), 'Waiting for reply', 'mail', 'amber'], [groups.length, 'Groups to invite', 'group', 'blue']]) +
        '<div class="grid grid-2" style="align-items:start"><form class="card" data-form="create-session" novalidate aria-labelledby="rs-h"><h3 id="rs-h" class="mb-16 card-title-ico"><span class="ti ico-blue">' + I('plus') + '</span>Recommend a Session</h3>' +
        '<div class="field"><label for="s-title">Session title</label><input class="input" id="s-title" name="title" maxlength="70" value="' + esc(g ? GAPS[g.gapId].short + ' Review' : '') + '" required></div>' +
        '<div class="field"><label for="s-group">Invite group (shared learning gap)</label><select class="select" id="s-group" name="group" data-input="session-group" required>' + (groups.length ? groups.map((x) => '<option value="' + x.id + '" ' + (x.id === sel ? 'selected' : '') + '>' + esc(x.name) + ' (' + x.studentIds.length + ' students)</option>').join('') : '<option value="">Create a group in Learning Gaps first</option>') + '</select>' +
        '<span class="hint" id="s-invites">' + (g ? 'Invites: ' + g.studentIds.map(sname).map(esc).join(', ') : '<a href="#/gaps">Create a group →</a>') + '</span></div>' +
        '<div class="form-row"><div class="field"><label for="s-at">Date & time</label><input class="input" id="s-at" name="at" type="datetime-local" value="' + dtVal + '" required></div>' +
        '<div class="field"><label for="s-cap">Capacity</label><input class="input" id="s-cap" name="capacity" type="number" min="1" max="40" value="6" required></div></div>' +
        '<div class="form-row"><div class="field"><label for="s-loc">Location</label><input class="input" id="s-loc" name="location" value="Room ' + esc(cid()) + '" maxlength="40" required></div>' +
        '<div class="field"><label for="s-dur">Length</label><select class="select" id="s-dur" name="duration"><option value="30">30 minutes</option><option value="45" selected>45 minutes</option><option value="60">60 minutes</option></select></div></div>' +
        '<div class="field"><label for="s-why">Why recommended (students see this)</label><input class="input" id="s-why" name="why" maxlength="120" value="' + esc(g ? 'To practise ' + GAPS[g.gapId].short.toLowerCase() + ' together.' : '') + '" required><span class="hint">Use simple, kind words — Grade 4 students will read this.</span></div>' +
        '<button class="btn btn-primary btn-block" type="submit" ' + (groups.length ? '' : 'disabled') + '>' + I('send', 'icon-sm') + 'Recommend & Notify Group</button></form>' +
        '<div class="stack">' + weekStrip(list) + '<section class="card" aria-labelledby="sr-h"><div class="card-head"><h3 id="sr-h" class="card-title-ico"><span class="ti ico-blue">' + I('users') + '</span>Sessions & Registrations</h3></div><div class="stack">' + (cards || '<div class="empty">' + I('calendar') + '<h3>No sessions yet</h3><p>Recommend one with the form.</p></div>') + '</div></section></div></div>'
    };
  }

  /* =========================================================
     INSIGHTS
     ========================================================= */
  function weeklyChart(w) {
    const W = 460, H = 220, pad = 30, n = w.labels.length, gw = (W - pad * 2) / n, bw = 22;
    const y = (v) => H - 30 - (v / 100) * (H - 50);
    let bars = '';
    w.labels.forEach((l, i) => {
      const x = pad + i * gw + gw / 2;
      bars += '<rect x="' + (x - bw - 3) + '" y="' + y(w.a.v[i]) + '" width="' + bw + '" height="' + (H - 30 - y(w.a.v[i])) + '" rx="6" fill="#f43f5e"><title>' + esc(w.a.name) + ', ' + l + ': ' + w.a.v[i] + '%</title></rect>' +
        '<rect x="' + (x + 3) + '" y="' + y(w.b.v[i]) + '" width="' + bw + '" height="' + (H - 30 - y(w.b.v[i])) + '" rx="6" fill="#14b8a6"><title>' + esc(w.b.name) + ', ' + l + ': ' + w.b.v[i] + '%</title></rect>' +
        '<text x="' + x + '" y="' + (H - 10) + '" text-anchor="middle" font-size="12" fill="#646a88">' + l + '</text>';
    });
    const grid = [25, 50, 75, 100].map((v) => '<line x1="' + pad + '" x2="' + (W - pad) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#eef0f7"/><text x="' + (pad - 6) + '" y="' + (y(v) + 4) + '" font-size="10" text-anchor="end" fill="#8a8fab">' + v + '</text>').join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Weekly class mastery: ' + esc(w.a.name) + ' ' + w.a.v.join(', ') + ' percent; ' + esc(w.b.name) + ' ' + w.b.v.join(', ') + ' percent.">' + grid + bars + '</svg>' +
      '<div class="chart-legend"><span><i style="background:#f43f5e"></i>' + esc(w.a.name) + '</span><span><i style="background:#14b8a6"></i>' + esc(w.b.name) + '</span></div>';
  }
  function vInsights() {
    const c = cls();
    const lastA = c.weekly.a.v[c.weekly.a.v.length - 1], lastB = c.weekly.b.v[c.weekly.b.v.length - 1];
    const weakest = lastA <= lastB ? c.weekly.a.name : c.weekly.b.name;
    const prac = st().practice.filter((p) => p.classId === cid());
    const o = c.ocr, flagged = Math.round(o.flagged / o.answers * 100), corrected = Math.round(o.corrected / o.answers * 100);
    const gapCount = clusters();
    const masteryLabel = (v) => v + '% (' + (v >= 85 ? 'Mastered' : v >= 75 ? 'Proficient' : v >= 55 ? 'Developing' : 'Requires Focus') + ')';
    const attn = attentionStudents();
    return {
      title: 'Insights',
      html: '<div class="page-head"><div class="ph"><span class="ph-ico ">' + I('chart') + '</span><div><h2>Class Analytics & Progress Insights</h2><p>Class trends from teacher-confirmed grades · ' + esc(c.name) + ' · last 4 weeks.</p></div></div><button class="btn btn-outline no-print" type="button" data-action="print">' + I('printer', 'icon-sm') + 'Export Class Report (PDF)</button></div>' +
        '<div class="grid grid-2"><section class="card"><h3 class="mb-16">Curriculum Concept Mastery</h3>' + c.mastery.map(([n, v]) => bar(n, v, masteryLabel)).join('') + '</section>' +
        '<section class="card"><h3>Remediation Impact</h3><p class="card-sub mb-16">Average score of the ' + c.remediation.n + ' students who did the ' + esc(c.remediation.topic) + ': before vs. after (observed change, not proof that the practice caused it).</p>' +
        '<div class="big-compare"><div><small>BEFORE SUPPORT</small><b>' + c.remediation.before + '%</b></div><span aria-hidden="true" class="c-purple">' + I('arrowRight') + '</span><div><small class="c-green">AFTER PRACTICE</small><b class="c-green">' + c.remediation.after + '%</b></div></div>' +
        '<ul class="small mt-16" style="padding-left:18px;color:var(--text-2)"><li>Observed change: <b>' + (c.remediation.after - c.remediation.before >= 0 ? '+' : '') + (c.remediation.after - c.remediation.before) + ' points</b></li><li><b>' + c.remediation.improved + ' of ' + c.remediation.n + '</b> students improved</li></ul></section>' +
        '<section class="card"><div class="row-between mb-16"><h3>Weekly Weakness Trend</h3>' + chip('red', 'Weakest this week: ' + weakest) + '</div><p class="card-sub">Class mastery per week for the two weakest concepts.</p>' + weeklyChart(c.weekly) + '</section>' +
        '<section class="card"><h3 class="mb-16">Practice Completion & Gap Closure</h3><div class="stack">' + (prac.length ? prac.map((p) => {
          const s = practiceStatus(p), scores = Object.values(p.completion).map((x) => Math.round(x.score / x.total * 100));
          const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
          const tag = !s.done ? chip('amber', 'Not enough data yet') : p.after != null ? chip('green', 'Gap improving · ' + p.baseline + '% → ' + p.after + '%') : chip('blue', 'Practice quiz avg ' + avg + '%');
          return '<div class="assign-card"><div class="row-between"><div><h4 class="small">' + esc(p.title) + '</h4><div class="tiny muted">' + s.done + ' of ' + s.total + ' completed · ' + U.fmtDue(p.due) + '</div></div>' + tag + '</div><div class="bar mt-8 ' + (s.all ? '' : 'amber') + '"><span style="width:' + (s.total ? s.done / s.total * 100 : 0) + '%"></span></div></div>';
        }).join('') : '<p class="small muted">No practice assigned yet.</p>') + '</div><p class="tiny muted mt-16">Gap closure = class mastery of the practised concept before vs. after the practice was completed.</p></section>' +
        '<section class="card"><div class="row-between mb-16"><h3>OCR Quality</h3>' + chip('', 'Last 4 weeks · ' + o.exams + ' exams') + '</div><div class="ocr-tiles"><div><b>' + (100 - corrected) + '%</b><small>Read correctly</small></div><div style="background:var(--amber-50)"><b class="c-amber">' + flagged + '%</b><small class="c-amber">Flagged uncertain</small></div><div style="background:var(--red-50)"><b class="c-red">' + corrected + '%</b><small class="c-red">Teacher corrected</small></div></div>' +
        '<p class="tiny muted mt-16">' + o.answers + ' answers checked · ' + esc(o.note) + '</p></section>' +
        '<section class="card"><div class="row-between mb-16"><h3>Red Flag Patterns</h3>' + chip('', 'Confirmed flags only') + '</div><div class="table-wrap"><table class="table"><thead><tr><th scope="col">Concept</th><th scope="col">Sep</th><th scope="col">Oct</th><th scope="col">Nov</th></tr></thead><tbody>' +
        c.flags.map(([n, a, b, d]) => '<tr><td>' + esc(n) + '</td>' + [a, b, d].map((v) => '<td><span class="heat heat-' + Math.min(v, 3) + '">' + v + '</span></td>').join('') + '</tr>').join('') + '</tbody></table></div></section>' +
        '<section class="card"><h3 class="mb-16">Most Frequent Learning Gaps</h3>' + (gapCount.length ? gapCount.map((x) => bar(GAPS[x.g].short, Math.round(x.ids.length / D.classStudents(cid()).length * 100), (v) => x.ids.length + ' of ' + D.classStudents(cid()).length + ' students', 'indigo')).join('') : '<p class="small muted">None confirmed yet.</p>') + '<a class="link-btn small" href="#/gaps">Open Learning Gaps ' + I('arrowRight', 'icon-xs') + '</a></section>' +
        '<section class="card"><h3 class="mb-16">Students Who May Need Attention</h3>' + (attn.length ? '<div class="stack">' + attn.map((a) => '<div class="row">' + avInit(a.s.id, 34) + '<div style="flex:1"><b class="small">' + esc(a.s.name) + '</b><div class="tiny muted">' + a.reasons.map(esc).join(' • ') + '</div></div></div>').join('') + '</div>' : '<p class="small muted">Nobody needs extra attention right now.</p>') + '</section></div>'
    };
  }

  /* =========================================================
     NOTIFICATIONS
     ========================================================= */
  function vNotifications(params, q) {
    const tab = q.tab || st().ui.notifTab || 'activity';
    const studs = D.classStudents(cid()), groups = st().groups.filter((g) => g.classId === cid());
    const to = q.to ? 'student:' + q.to : 'all';
    const inbox = st().notifications.filter((n) => n.to === 'teacher');
    const sent = st().sent.filter((m) => m.classId === cid());
    const af = st().ui.actFilter || 'all';
    const acts = st().activity.filter((a) => a.classId === cid() && (af === 'all' || (af === 'exams' ? ['upload', 'ai', 'publish'].includes(a.kind) : af === 'practice' ? a.kind === 'practice' : ['session', 'message', 'group'].includes(a.kind))));
    const tabBtn = (k, l) => '<button type="button" role="tab" aria-selected="' + (tab === k) + '" data-action="notif-tab" data-t="' + k + '">' + l + '</button>';
    let right;
    if (tab === 'inbox') right = inbox.length ? inbox.map((n) => '<div class="act-item ' + (n.read ? '' : 'unread') + '"><span class="a-ico ico-' + (n.kind === 'practice' ? 'green' : n.kind === 'session' ? 'blue' : 'amber') + '">' + I(n.kind === 'practice' ? 'checkCircle' : n.kind === 'session' ? 'users' : 'file') + '</span><div class="a-body"><div class="a-top"><strong>' + esc(n.title) + (n.read ? '' : ' <span class="sr-only">(unread)</span>') + '</strong><time>' + U.timeAgo(n.at) + '</time></div><p>' + esc(n.body) + '</p><div class="a-acts">' + (n.link ? '<button class="btn btn-xs btn-outline" type="button" data-action="open-tnote" data-id="' + n.id + '">Open</button>' : '') + (n.read ? '' : '<button class="btn btn-xs btn-ghost" type="button" data-action="tnote-read" data-id="' + n.id + '">Mark as read</button>') + '</div></div></div>').join('') : '<p class="small muted">Your inbox is empty.</p>';
    else if (tab === 'sent') right = sent.length ? sent.map((m) => '<div class="act-item"><span class="a-ico ico-blue">' + I('send') + '</span><div class="a-body"><div class="a-top"><strong>' + esc(m.title) + '</strong><time>' + U.timeAgo(m.at) + '</time></div><p>' + esc(m.body) + '</p><div class="tiny muted mt-8">To: ' + esc(m.toLabel) + ' · ' + U.plural(m.to.length + (m.parents || 0), 'recipient') + '</div></div></div>').join('') : '<p class="small muted">You have not sent any messages in ' + esc(cls().name) + ' yet.</p>';
    else right = '<div class="pill-tabs mb-16" role="group" aria-label="Filter activity">' + [['all', 'All'], ['exams', 'Exams'], ['practice', 'Practice'], ['sessions', 'Sessions & messages']].map(([k, l]) => '<button type="button" aria-pressed="' + (af === k) + '" data-action="act-filter" data-f="' + k + '">' + l + '</button>').join('') + '</div>' + (acts.length ? acts.slice(0, st().ui.actMore ? 50 : 6).map(actItem).join('') : '<p class="small muted">No activity for this filter.</p>') +
      (acts.length > 6 && !st().ui.actMore ? '<button class="btn btn-ghost btn-sm" type="button" data-action="act-more">View older activity ' + I('arrowRight', 'icon-xs') + '</button>' : '');
    const inboxUnread = inbox.filter((n) => !n.read).length;
    return {
      title: 'Notifications',
      html: '<div class="page-head"><div class="ph"><span class="ph-ico rose">' + I('bell') + '</span><div><h2>Notifications & Direct Announcements</h2><p>Send comments, reminders or encouragement to a student, a group or the whole class.</p></div></div></div>' +
        '<div class="grid grid-2" style="align-items:start"><form class="card" data-form="send-message" novalidate aria-labelledby="sa-h"><div class="row-between mb-16"><h3 id="sa-h">Send Announcement</h3>' + I('send') + '</div>' +
        '<div class="field"><label for="m-to">Recipients</label><select class="select" id="m-to" name="to" data-input="m-to" required><optgroup label="Whole grade"><option value="all" ' + (to === 'all' ? 'selected' : '') + '>All ' + esc(cls().name) + ' students (' + studs.length + ')</option><option value="all+parents">' + esc(cls().name) + ' students & parents (' + studs.length * 2 + ')</option><option value="parents">' + esc(cls().name) + ' parents only (' + studs.length + ')</option></optgroup>' +
        (groups.length ? '<optgroup label="Groups">' + groups.map((g) => '<option value="group:' + g.id + '">' + esc(g.name) + ' (' + g.studentIds.length + ')</option>').join('') + '</optgroup>' : '') +
        '<optgroup label="Individual students">' + studs.map((s) => '<option value="student:' + s.id + '" ' + (to === 'student:' + s.id ? 'selected' : '') + '>' + esc(s.name) + '</option>').join('') + '</optgroup></select></div>' +
        '<div class="field"><label for="m-type">Message type</label><select class="select" id="m-type" name="kind"><option value="message">Comment / encouragement</option><option value="feedback">Feedback message</option><option value="reminder">Reminder</option><option value="practice">Practice recommendation</option></select></div>' +
        '<div class="field"><label for="m-title">Message title</label><input class="input" id="m-title" name="title" maxlength="80" placeholder="e.g. Fantastic job on today’s fractions work!" required></div>' +
        '<div class="field"><label for="m-body">Message content</label><textarea class="textarea" id="m-body" name="body" maxlength="400" placeholder="Write a short, friendly message…" required data-input="m-body"></textarea><div class="row-between"><span class="hint" id="m-tone">' + I('info', 'icon-xs') + ' Students will read this — write in simple words at a Grade 4 level.</span><span class="hint" id="m-count">0 / 400 characters</span></div></div>' +
        '<div class="field"><span class="label">Quick tags</span><div class="row row-wrap">' + [['🌟 Great effort', 'You put in great effort today — well done! '], ['📘 Practice in portal', 'There is new practice waiting for you in your portal. '], ['⏰ Reminder', 'Friendly reminder: please finish your practice before the due date. '], ['🧮 Check problem 3', 'Have another look at problem 3 if you want to try the extra star challenge. ']].map(([l, t]) => '<button class="tag-btn" type="button" data-action="quick-tag" data-t="' + esc(t) + '">' + esc(l) + '</button>').join('') + '</div></div>' +
        '<button class="btn btn-primary btn-block" type="submit">' + I('send', 'icon-sm') + 'Send Notification</button></form>' +
        '<section class="card"><div class="card-head"><div><h3>Activity & messages</h3><p class="card-sub">Exam uploads, grading updates, practice and replies.</p></div></div><div class="seg mb-16" role="tablist" aria-label="Notification views">' + tabBtn('activity', 'Recent activity') + tabBtn('inbox', 'Inbox' + (inboxUnread ? ' (' + inboxUnread + ')' : '')) + tabBtn('sent', 'Sent') + '</div><div class="stack">' + right + '</div></section></div>'
    };
  }

  /* =========================================================
     PROFILE
     ========================================================= */
  function openProfile() {
    const t = T();
    U.modal({
      title: 'Teacher Profile', cls: 'modal-profile',
      body: '<div class="prof-hero">' + teacherAvatar('avatar-xl') + '<div class="ph-txt"><b>' + esc(t.displayName) + '</b><span>' + esc(t.email) + '</span><div class="row row-wrap mt-8"><span class="chip chip-purple">' + I('award') + esc(t.role) + '</span><span class="chip chip-blue">' + I('users') + esc(D.cls(t.classroom).name) + '</span></div></div></div>' +
        '<div class="prof-stats"><div><b>' + st().exams.filter((e) => e.status === 'published').length + '</b><span>Exams published</span></div><div><b>' + st().practice.length + '</b><span>Practices assigned</span></div><div><b>' + st().sessions.length + '</b><span>Sessions</span></div></div>' +
        '<form id="tp-form" novalidate><div class="field"><label for="tp-display">Display name (students see this)</label><input class="input" id="tp-display" value="' + esc(t.displayName) + '" maxlength="30" required></div>' +
        '<div class="field"><label for="tp-full">Full name</label><input class="input" id="tp-full" value="' + esc(t.fullName) + '" maxlength="60" required></div>' +
        '<div class="field"><label for="tp-email">School email</label><input class="input" id="tp-email" type="email" value="' + esc(t.email) + '" required><span class="hint">You use this email to sign in.</span></div>' +
        '<div class="field"><label for="tp-class">Assigned classroom</label><select class="select" id="tp-class">' + st().classes.map((c) => '<option value="' + c.id + '" ' + (c.id === t.classroom ? 'selected' : '') + '>' + esc(c.name + ' (' + c.subject + ')') + '</option>').join('') + '</select></div>' +
        '<div class="field"><label for="tp-role">Role</label><input class="input" id="tp-role" value="' + esc(t.role) + '" maxlength="40"></div></form>',
      foot: '<button class="btn btn-ghost" type="button" data-close>Cancel</button><button class="btn btn-primary" type="button" id="tp-save">Save Changes</button>',
      onOpen: (dlg, api) => {
        dlg.querySelector('#tp-save').onclick = () => {
          const f = dlg.querySelector('#tp-form'); U.clearErrors(f);
          const dn = dlg.querySelector('#tp-display'), fn = dlg.querySelector('#tp-full'), em = dlg.querySelector('#tp-email');
          let bad = false;
          if (!dn.value.trim()) { U.setError(dn, 'Display name can’t be empty.'); bad = true; }
          if (!fn.value.trim()) { U.setError(fn, 'Please enter your full name.'); bad = true; }
          if (!/^\S+@\S+\.\S+$/.test(em.value.trim())) { U.setError(em, 'Enter a valid email, e.g. name@school.org'); bad = true; }
          if (bad) { f.querySelector('[aria-invalid="true"]').focus(); U.toast('error', 'Profile not saved', 'Please fix the highlighted fields.'); return; }
          Object.assign(t, { displayName: dn.value.trim(), fullName: fn.value.trim(), email: em.value.trim(), classroom: dlg.querySelector('#tp-class').value, role: dlg.querySelector('#tp-role').value.trim() || t.role });
          save(); api.close(); rer(); U.toast('success', 'Profile updated', 'Students now see you as ' + t.displayName + '.');
        };
      }
    });
  }

  /* =========================================================
     ACTIONS
     ========================================================= */
  const curExam = () => D.exam(PM.shell.current().params[0]);
  function sendToStudents(ids, n) { ids.forEach((sid) => D.notify(sid, Object.assign({ from: T().displayName }, n))); }

  async function runAiFlow(e) {
    const changed = !e.ai || JSON.stringify(e.questions.map((q) => q.value)) !== JSON.stringify(e.aiInput || []);
    if (!e.ocrCounted) {
      const c = D.cls(e.classId);
      c.ocr.answers += e.questions.length; c.ocr.flagged += e.questions.filter((q) => q.conf < 80).length;
      c.ocr.corrected += e.questions.filter((q) => D.norm(q.value) !== D.norm(q.read)).length; c.ocr.exams += 1;
      e.ocrCounted = true;
    }
    e.ocrConfirmedAt = Date.now();
    if (!changed && e.status !== 'ocr') { save(); U.toast('info', 'OCR unchanged', 'The AI grade from before is still valid.'); go('#/grading/' + e.id + '/2'); return; }
    const wasLater = e.status !== 'ocr';
    e._running = true; save(); go('#/grading/' + e.id + '/2');
    await new Promise((r) => setTimeout(r, 900));
    delete e._running;
    D.runAI(st(), e);
    e.aiInput = e.questions.map((q) => q.value);
    e.status = 'ai';
    D.log(e.classId, { kind: 'ai', title: 'AI Grading Completed', text: '<b>' + esc(sname(e.studentId)) + '</b>’s ' + esc(e.title) + ': AI suggested ' + e.ai.pct + '% · waiting for your confirmation.', link: '#/grading/' + e.id, action: 'Review AI Grade' });
    save(); rer();
    if (wasLater) U.toast('warning', 'AI grade recalculated', 'You changed OCR answers, so earlier decisions were reset. Please review Step 3 again.');
    else U.toast('success', 'OCR verification completed', 'AI suggested ' + e.ai.pct + '%. Review it, then continue to confirmation.');
  }

  const actions = {
    'open-profile': openProfile,
    'set-class': (el) => {
      st().ui.classId = el.dataset.id; st().ui.groupDraft = null; st().ui.langStudent = null; save();
      const r = PM.shell.current().name;
      if (r === 'grading' && PM.shell.current().params[0]) go('#/grading'); else rer();
      U.toast('info', 'Showing ' + D.cls(el.dataset.id).name, 'Submissions, gaps, practice and insights now show this class.');
    },
    'teacher-read-all': () => { st().notifications.forEach((n) => { if (n.to === 'teacher') n.read = true; }); save(); rer(); U.toast('success', 'All notifications marked as read'); },
    'open-tnote': (el) => { const n = st().notifications.find((x) => x.id === el.dataset.id); if (!n) return; n.read = true; save(); if (n.link) go(n.link); else rer(); },
    'tnote-read': (el) => { const n = st().notifications.find((x) => x.id === el.dataset.id); if (n) { n.read = true; save(); rer(); } },
    'dash-sort': () => { st().ui.dashSort = (st().ui.dashSort || 'priority') === 'priority' ? 'newest' : 'priority'; save(); rer(); },
    'remind-one': (el) => {
      const p = st().practice.find((x) => x.id === el.dataset.p); const sid = el.dataset.s;
      D.notify(sid, { kind: 'reminder', title: 'Reminder: ' + p.title, body: T().displayName + ' says: don’t forget your practice — you can do it! 💪', link: '#/practice', from: T().displayName });
      p.reminded[sid] = Date.now(); save(); U.toast('success', 'Reminder sent', sname(sid) + ' will see it in their notifications.');
    },
    'sub-filter': (el) => go('#/submissions' + (el.dataset.f === 'all' ? '' : '?filter=' + el.dataset.f)),
    'clear-sub-filters': () => { st().ui.subQuery = ''; save(); go('#/submissions'); },
    'goto-step': (el) => {
      const e = curExam(); const k = +el.dataset.step;
      if (k > STEP[e.status]) { U.toast('warning', 'Step ' + k + ' is locked', k === 2 ? 'Resolve uncertain OCR answers and run AI grading first.' : 'Finish step ' + STEP[e.status] + ' first.'); return; }
      go('#/grading/' + e.id + '/' + k);
    },
    'ocr-focus': (el) => {
      st().ui.ocrActive = el.dataset.q;
      document.querySelectorAll('.paper-line').forEach((x) => x.classList.toggle('active', x === el));
      const card = document.getElementById('ocrq-' + el.dataset.q);
      if (card) { document.querySelectorAll('.ocr-q.flash').forEach((x) => x.classList.remove('flash')); card.classList.add('flash'); card.scrollIntoView({ block: 'center', behavior: 'smooth' }); const f = card.querySelector('input, button'); if (f) setTimeout(() => f.focus({ preventScroll: true }), 300); }
    },
    'ocr-pick': (el) => { const e = curExam(); const q = e.questions.find((x) => x.id === el.dataset.q); q.value = el.dataset.v; q.pick = 'alt'; save(); rer(); const b = document.querySelector('.choice[data-q="' + q.id + '"][aria-pressed="true"]'); if (b) b.focus(); },
    'ocr-resolve': (el) => {
      const e = curExam(); const q = e.questions.find((x) => x.id === el.dataset.q);
      if (!String(q.value).trim()) { U.toast('error', 'Choose or type an answer', 'Pick one of the suggested readings or type what the student wrote.'); return; }
      q.resolved = true; save(); rer();
      U.toast('success', 'OCR correction saved', 'Q' + (e.questions.indexOf(q) + 1) + ' reading confirmed as “' + q.value + '”.');
      const nxt = e.questions.find((x) => !x.resolved); if (!nxt) { const b = document.querySelector('[data-action="run-ai"]'); if (b) b.focus(); }
    },
    'ocr-reopen': (el) => { const e = curExam(); const q = e.questions.find((x) => x.id === el.dataset.q); q.resolved = false; save(); rer(); },
    'ocr-undo': (el) => { const e = curExam(); const q = e.questions.find((x) => x.id === el.dataset.q); q.value = q.read; save(); rer(); U.toast('info', 'Correction undone', 'Back to the original OCR reading.'); },
    'view-upload': (el) => {
      const e = D.exam(el.dataset.id);
      const isPdf = /pdf/.test(e.file.type);
      U.modal({ title: 'Uploaded file', sub: esc(e.file.name), wide: true, body: isPdf ? '<iframe title="Uploaded PDF" src="' + e.file.dataUrl + '" style="width:100%;height:70vh;border:0;border-radius:12px"></iframe>' : '<img src="' + e.file.dataUrl + '" alt="Exam uploaded by ' + esc(sname(e.studentId)) + '" style="border-radius:12px;margin:auto">', foot: '<button class="btn btn-primary" type="button" data-close>Close</button>' });
    },
    'run-ai': (el) => {
      const e = curExam(); const un = e.questions.filter((q) => !q.resolved);
      if (un.length) {
        U.toast('error', 'AI grading can’t start yet', U.plural(un.length, 'uncertain answer') + ' still need' + (un.length === 1 ? 's' : '') + ' your decision.');
        const c = document.getElementById('ocrq-' + un[0].id); if (c) { c.scrollIntoView({ block: 'center', behavior: 'smooth' }); c.classList.add('flash'); const f = c.querySelector('button'); if (f) f.focus({ preventScroll: true }); }
        return;
      }
      const empty = e.questions.find((q) => !String(q.value).trim());
      if (empty) { U.toast('error', 'An answer is empty', 'Q' + (e.questions.indexOf(empty) + 1) + ' has no text. Type what the student wrote (or “blank”).'); document.getElementById('ocr-v-' + empty.id).focus(); return; }
      runAiFlow(e);
    },
    'rerun-ai': async () => {
      const e = curExam();
      e._running = true; rer();
      await new Promise((r) => setTimeout(r, 700));
      delete e._running; D.runAI(st(), e); save(); rer();
      U.toast('info', 'AI grader re-run', 'Same confirmed answers → ' + e.ai.pct + '%.');
    },
    'to-step3': () => { const e = curExam(); if (e.status === 'ai') e.status = 'confirm'; save(); go('#/grading/' + e.id + '/3'); },
    decide: (el) => {
      const e = curExam(), r = e.review, v = el.dataset.v, id = el.dataset.id;
      if (el.dataset.kind === 'gap') r.gapDecisions[id] = r.gapDecisions[id] === v ? null : v;
      else if (el.dataset.kind === 'rec') r.recurringDecisions[id] = r.recurringDecisions[id] === v ? null : v;
      else r.redFlagDecision = r.redFlagDecision === v ? null : v;
      save(); rer();
      const same = document.querySelector('[data-action="decide"][data-kind="' + el.dataset.kind + '"][data-id="' + id + '"][data-v="' + v + '"]'); if (same) same.focus();
    },
    'restore-draft': async () => {
      const e = curExam();
      if (e.review.feedback === e.ai.feedbackDraft) { U.toast('info', 'Already the AI draft'); return; }
      if (await U.confirm({ title: 'Restore the AI draft?', message: 'Your edits to the feedback text will be replaced by the original AI draft.', confirmLabel: 'Restore draft', danger: true, icon: 'undo' })) { e.review.feedback = e.ai.feedbackDraft; save(); rer(); U.toast('success', 'AI draft restored'); }
    },
    'confirm-grade': () => {
      const e = curExam(), r = e.review;
      const left = decisionsLeft(e);
      const missing = e.questions.filter((q) => Number(r.scores[q.id]) !== e.ai.scores[q.id].score && !(r.reasons[q.id] || '').trim());
      const invalid = e.questions.filter((q) => { const v = Number(r.scores[q.id]); return r.scores[q.id] === '' || isNaN(v) || v < 0 || v > q.max; });
      if (invalid.length) { U.toast('error', 'Check the points', 'Q' + (e.questions.indexOf(invalid[0]) + 1) + ' must be between 0 and ' + invalid[0].max + '.'); document.getElementById('pts-' + invalid[0].id).focus(); return; }
      if (missing.length) { U.toast('error', 'Add a reason for each change', 'Q' + (e.questions.indexOf(missing[0]) + 1) + ' was changed from the AI score.'); const i = document.getElementById('reason-' + missing[0].id); U.setError(i, 'Please add a short reason.'); i.focus(); return; }
      if (left) { U.toast('warning', U.plural(left, 'decision') + ' left', 'Confirm or dismiss every learning gap, recurring mistake and red flag.'); const b = document.querySelector('.decision:not(.confirmed):not(.dismissed) .toggle-btn, .flag-card:not(.confirmed) .toggle-btn[aria-pressed="false"]'); if (b) { b.scrollIntoView({ block: 'center', behavior: 'smooth' }); b.focus({ preventScroll: true }); } return; }
      if (r.feedback.trim().length < 10) { U.toast('error', 'Feedback is too short', 'Write at least one helpful sentence for the student.'); document.getElementById('fb').focus(); return; }
      e.status = 'feedback'; r.confirmedAt = Date.now(); save();
      U.toast('success', 'Teacher grade confirmed', 'Final grade ' + finalScore(e).pct + '%. Check the preview, then publish.');
      go('#/grading/' + e.id + '/4');
    },
    publish: async () => {
      const e = curExam(), r = e.review, a = e.ai, s = D.student(e.studentId), fs = finalScore(e);
      const ok = await U.confirm({ title: 'Publish to ' + s.first + '’s portal?', message: s.first + ' will see the grade (' + fs.pct + '%), your feedback and the confirmed learning gaps, and gets a notification.', confirmLabel: 'Publish & notify', icon: 'send', tone: 'success' });
      if (!ok) return;
      const gaps = a.gaps.filter((g) => r.gapDecisions[g.id] === 'confirmed').map((g) => ({ id: g.id }));
      const flagOn = a.redFlag && r.redFlagDecision === 'confirmed';
      e.published = { pct: fs.pct, score: fs.total, max: fs.max, feedback: r.feedback.trim(), gaps, redFlag: flagOn ? { title: a.redFlag.title, studentText: a.redFlag.studentText, gapId: a.redFlag.gapId } : null, practiceId: r.practiceId || '', sessionId: r.sessionId || '', at: Date.now(), answers: e.questions.map((q) => ({ prompt: q.prompt, value: q.value, score: Number(r.scores[q.id]), max: q.max, correct: q.correct })) };
      e.status = 'published';
      const sg = st().studentGaps[s.id] = st().studentGaps[s.id] || [];
      gaps.forEach((g) => { if (!sg.includes(g.id)) sg.push(g.id); });
      a.recurring.forEach((id) => {
        const rec = st().recurring.find((x) => x.id === id); if (!rec) return;
        if (r.recurringDecisions[id] === 'confirmed') { if (rec.latest) rec.history.push(rec.latest); rec.latest = { title: e.title, when: U.fmtShort(Date.now()), lang: e.lang, ok: false }; rec.status = 'confirmed'; }
      });
      if (flagOn) { const c = D.cls(e.classId); const concept = GAPS[a.redFlag.gapId] ? GAPS[a.redFlag.gapId].concept : 'Fractions'; let row = c.flags.find((f) => f[0].toLowerCase() === concept.toLowerCase()); if (!row) { row = [concept, 0, 0, 0]; c.flags.push(row); } row[3]++; }
      D.notify(s.id, { kind: 'feedback', title: 'New feedback: ' + e.title, body: T().displayName + ': “' + (r.feedback.length > 120 ? r.feedback.slice(0, 117) + '…' : r.feedback) + '”', link: '#/results/' + e.id, from: T().displayName, examId: e.id });
      if (r.practiceId) {
        const p = st().practice.find((x) => x.id === r.practiceId);
        if (p && !p.assignedTo.includes(s.id)) { p.assignedTo.push(s.id); D.notify(s.id, { kind: 'practice', title: 'New practice: ' + p.title, body: T().displayName + ' picked this practice to help you. ' + p.emoji, link: '#/practice', from: T().displayName }); }
      }
      if (r.sessionId) {
        const x = st().sessions.find((y) => y.id === r.sessionId);
        if (x && !x.invitees.includes(s.id)) { x.invitees.push(s.id); D.notify(s.id, { kind: 'session', title: 'You are invited: ' + x.title, body: T().displayName + ' invited you to a small help session. Why? ' + x.why, link: '#/sessions', sessionId: x.id, from: T().displayName }); }
      }
      D.log(e.classId, { kind: 'publish', title: 'Feedback Published', text: 'You published <b>' + esc(s.name) + '</b>’s ' + esc(e.title) + ' (' + fs.pct + '%) and notified ' + esc(s.first) + '.', link: '#/grading/' + e.id, action: 'Open' });
      save(); rer();
      U.toast('success', 'Feedback published', s.first + ' has been notified in the student portal.');
    },
    'prefill-group': (el) => {
      const g = el.dataset.g; const ids = (clusters().find((c) => c.g === g) || { ids: [] }).ids;
      st().ui.groupDraft = { classId: cid(), gapId: g, name: GAPS[g].short + ' Support', ids }; save(); rer();
      const n = document.getElementById('g-name'); if (n) { n.scrollIntoView({ block: 'center', behavior: 'smooth' }); n.focus({ preventScroll: true }); }
    },
    'delete-group': async (el) => {
      const g = st().groups.find((x) => x.id === el.dataset.id);
      const used = st().sessions.filter((x) => x.groupId === g.id).length;
      if (!(await U.confirm({ title: 'Delete “' + g.name + '”?', message: 'The group is removed. ' + (used ? 'Sessions already sent to this group stay as they are.' : 'Students are not notified.'), confirmLabel: 'Delete group', danger: true, icon: 'trash' }))) return;
      st().groups = st().groups.filter((x) => x.id !== g.id); save(); rer(); U.toast('success', 'Group deleted', g.name + ' was removed.');
    },
    'rec-evidence': (el) => {
      const r = st().recurring.find((x) => x.id === el.dataset.id);
      const all = [...r.history, r.latest].filter(Boolean);
      U.modal({ title: 'Recurring mistake evidence', sub: esc(sname(r.studentId)) + ' · ' + esc(GAPS[r.gapId].short),
        body: '<p class="mb-16"><b>' + esc(r.pattern) + '</b></p><div class="hist">' + all.map((h) => '<div class="' + (h.ok ? 'ok' : '') + '">' + (h.ok ? '✓ ' : '✗ ') + esc(h.title) + '<small>' + esc(h.when + ' · ' + h.lang) + '</small></div>').join('') + '</div>' +
          '<p class="small muted mt-16">' + GAPS[r.gapId].emoji + ' ' + esc(GAPS[r.gapId].simple) + '</p>',
        foot: '<a class="btn" href="#/practice?student=' + r.studentId + '" data-close>Assign practice</a><a class="btn btn-primary" href="#/gaps?student=' + r.studentId + '" data-close>Language vs concept</a>' });
    },
    'save-lang': (el) => {
      if (el.getAttribute('aria-disabled') === 'true') { U.toast('info', 'Choose a decision first', 'Select one of the four options, then save.'); return; }
      const ui = st().ui, p = st().langProfiles[ui.langStudent];
      p.decision = { value: ui.langPending.v, at: Date.now() }; ui.langPending = null; save(); rer();
      U.toast('success', 'Decision saved for ' + sname(ui.langStudent) + ': ' + labelDec(p.decision.value));
    },
    'prac-filter': (el) => { st().ui.pracFilter = el.dataset.f; save(); rer(); },
    'practice-results': (el) => {
      const p = st().practice.find((x) => x.id === el.dataset.id);
      U.modal({ title: esc(p.title), sub: 'Results · ' + U.fmtDue(p.due), wide: true,
        body: '<div class="table-wrap"><table class="table"><thead><tr><th scope="col">Student</th><th scope="col">Status</th><th scope="col">Quiz score</th><th scope="col">Video</th><th scope="col">Worksheet</th></tr></thead><tbody>' +
          p.assignedTo.map((sid) => { const c = p.completion[sid], pr = p.progress[sid] || {}; return '<tr><td>' + esc(sname(sid)) + '</td><td>' + (c ? chip('green', 'Completed ' + U.timeAgo(c.at), 'check') : pr.video || pr.worksheet ? chip('blue', 'In progress') : U.isOverdue(p.due) ? chip('red', 'Overdue') : chip('amber', 'Not started')) + (p.reminded[sid] ? '<div class="tiny muted">Reminded ' + U.timeAgo(p.reminded[sid]) + '</div>' : '') + '</td><td>' + (c ? '<b>' + c.score + '/' + c.total + '</b>' : '—') + '</td><td>' + (pr.video ? '✓' : '—') + '</td><td>' + (pr.worksheet ? '✓' : '—') + '</td></tr>'; }).join('') + '</tbody></table></div>',
        foot: '<button class="btn btn-primary" type="button" data-close>Close</button>' });
    },
    'practice-nudge': (el) => {
      const p = st().practice.find((x) => x.id === el.dataset.id);
      const todo = p.assignedTo.filter((s) => !p.completion[s]);
      if (!todo.length) { U.toast('info', 'Everyone is done', 'All students completed this practice.'); return; }
      todo.forEach((sid) => { D.notify(sid, { kind: 'reminder', title: 'Reminder: ' + p.title, body: T().displayName + ' says: your practice is ' + U.fmtDue(p.due).toLowerCase() + '. You can do it! 💪', link: '#/practice', from: T().displayName }); p.reminded[sid] = Date.now(); });
      D.log(cid(), { kind: 'message', title: 'Reminder Sent', text: 'Reminder for <b>' + esc(p.title) + '</b> sent to ' + todo.map(sname).map(esc).join(', ') + '.', link: '#/practice', action: 'View practice' });
      save(); rer(); U.toast('success', 'Reminder sent', 'Sent to ' + todo.map(sfirst).join(', ') + '.');
    },
    'practice-delete': async (el) => {
      const p = st().practice.find((x) => x.id === el.dataset.id);
      if (!(await U.confirm({ title: 'Remove “' + p.title + '”?', message: 'It disappears from the student portal. Completed results are deleted too.', confirmLabel: 'Remove practice', danger: true, icon: 'trash' }))) return;
      st().practice = st().practice.filter((x) => x.id !== p.id); save(); rer(); U.toast('success', 'Practice removed');
    },
    'session-remind': (el) => {
      const x = st().sessions.find((y) => y.id === el.dataset.id);
      const todo = x.invitees.filter((s) => !x.registrations.includes(s));
      if (!todo.length || x.at < Date.now()) { U.toast('info', 'Nobody to remind', 'All invited students are already registered.'); return; }
      todo.forEach((sid) => D.notify(sid, { kind: 'session', title: 'Reminder: ' + x.title, body: 'There are still seats left on ' + U.fmtWhen(x.at) + '. Register in your portal!', link: '#/sessions', sessionId: x.id, from: T().displayName }));
      save(); U.toast('success', 'Reminder sent', 'Sent to ' + todo.map(sfirst).join(', ') + '.');
    },
    'session-cancel': async (el) => {
      const x = st().sessions.find((y) => y.id === el.dataset.id);
      if (!(await U.confirm({ title: 'Cancel this session?', message: '“' + x.title + '” will be removed and the ' + U.plural(x.invitees.length, 'invited student') + ' are told it was cancelled.', confirmLabel: 'Cancel session', cancelLabel: 'Keep session', danger: true, icon: 'calendar' }))) return;
      x.invitees.forEach((sid) => D.notify(sid, { kind: 'session', title: 'Session cancelled: ' + x.title, body: T().displayName + ' cancelled this session. You will get a new invitation if it is moved.', link: '#/sessions', from: T().displayName }));
      st().sessions = st().sessions.filter((y) => y.id !== x.id); save(); rer(); U.toast('success', 'Session cancelled', 'Invited students were notified.');
    },
    print: () => window.print(),
    'notif-tab': (el) => { st().ui.notifTab = el.dataset.t; save(); go('#/notifications?tab=' + el.dataset.t); },
    'act-filter': (el) => { st().ui.actFilter = el.dataset.f; save(); rer(); },
    'act-more': () => { st().ui.actMore = true; save(); rer(); },
    'quick-tag': (el) => {
      const ta = document.getElementById('m-body'); ta.value = (ta.value + (ta.value && !/\s$/.test(ta.value) ? ' ' : '') + el.dataset.t).slice(0, 400);
      document.getElementById('m-count').textContent = ta.value.length + ' / 400 characters'; ta.focus();
    }
  };

  /* ---------- live inputs ---------- */
  function syncGroupBtn(f) {
    const ok = f.name.value.trim() && f.querySelectorAll('input[name="students"]:checked').length >= 2;
    const b = document.getElementById('g-submit'); if (ok) b.removeAttribute('aria-disabled'); else b.setAttribute('aria-disabled', 'true');
  }
  const inputs = {
    'sub-search': (el) => {
      st().ui.subQuery = el.value; save();
      const list = document.getElementById('sub-list'); if (list) list.innerHTML = subList(PM.shell.current().query.filter || 'all', el.value);
    },
    'ocr-edit': (el) => { const e = curExam(); const q = e.questions.find((x) => x.id === el.dataset.q); q.value = el.value; save(); },
    'ocr-custom': (el) => {
      const e = curExam(); const q = e.questions.find((x) => x.id === el.dataset.q);
      q.value = el.value; q.pick = el.value ? 'custom' : 'alt'; save();
      document.querySelectorAll('.choice[data-q="' + q.id + '"]').forEach((b) => b.setAttribute('aria-pressed', String(!el.value && b.dataset.v === q.value)));
    },
    score: (el) => {
      const e = curExam(), q = e.questions.find((x) => x.id === el.dataset.q);
      e.review.scores[q.id] = el.value === '' ? '' : Number(el.value); save();
      const changed = Number(el.value) !== e.ai.scores[q.id].score;
      el.classList.toggle('changed', changed);
      document.getElementById('reason-row-' + q.id).hidden = !changed;
      const fs = finalScore(e);
      document.getElementById('final-grade').textContent = fs.pct + '%';
      document.getElementById('final-pts').textContent = fs.total + '/' + fs.max;
      const v = Number(el.value);
      if (el.value !== '' && (v < 0 || v > q.max)) U.setError(el, '0–' + q.max); else el.removeAttribute('aria-invalid');
    },
    reason: (el) => { const e = curExam(); e.review.reasons[el.dataset.q] = el.value; save(); if (el.value.trim()) { el.removeAttribute('aria-invalid'); const er = el.closest('.field').querySelector('.error-text'); if (er) er.remove(); } },
    'flag-note': (el) => { curExam().review.privateNote = el.value; save(); },
    feedback: (el) => { curExam().review.feedback = el.value; save(); document.getElementById('fb-count').textContent = el.value.length + ' / 600 characters'; },
    'att-practice': (el) => { const r = curExam().review; r.practiceId = el.value; r._practiceTouched = true; save(); rer(); },
    'att-session': (el) => { const r = curExam().review; r.sessionId = el.value; r._sessionTouched = true; save(); rer(); },
    'group-gap': (el) => {
      const ids = (clusters().find((c) => c.g === el.value) || { ids: [] }).ids;
      st().ui.groupDraft = { classId: cid(), gapId: el.value, name: GAPS[el.value].short + ' Support', ids }; save(); rer();
      document.getElementById('g-gap').focus();
    },
    'group-check': (el) => {
      el.closest('.check').classList.toggle('is-checked', el.checked);
      const f = el.form; const n = f.querySelectorAll('input[name="students"]:checked').length;
      document.getElementById('g-submit').textContent = 'Create Group (' + n + ' student' + (n === 1 ? '' : 's') + ')';
      syncGroupBtn(f);
      const d = st().ui.groupDraft || { classId: cid(), gapId: f.gap.value, name: f.name.value };
      d.ids = [...f.querySelectorAll('input[name="students"]:checked')].map((x) => x.value); d.name = f.name.value; st().ui.groupDraft = d; save();
    },
    'group-name': (el) => { syncGroupBtn(el.form); const d = st().ui.groupDraft; if (d) { d.name = el.value; save(); } },
    'lang-student': (el) => { st().ui.langStudent = el.value; st().ui.langPending = null; save(); go('#/gaps?student=' + el.value); },
    'lang-dec': (el) => {
      st().ui.langPending = { sid: st().ui.langStudent, v: el.value }; save();
      const b = document.querySelector('[data-action="save-lang"]'); const p = st().langProfiles[st().ui.langStudent];
      if (b) b.setAttribute('aria-disabled', String(!!(p.decision && p.decision.value === el.value)));
    },
    'p-file': (el) => {
      const f = el.files[0], hint = document.getElementById('p-file-hint');
      const box = document.getElementById('p-file-box'), nm = document.getElementById('p-file-name');
      if (!f) { hint.textContent = 'PDF, image or Word · up to 5 MB'; nm.textContent = 'Choose a worksheet file'; box.classList.remove('has-file'); return; }
      if (f.size > 5 * 1024 * 1024) { U.setError(el, 'That file is ' + (f.size / 1048576).toFixed(1) + ' MB. Please choose one under 5 MB.'); el.value = ''; return; }
      el.removeAttribute('aria-invalid'); const er = el.closest('.field').querySelector('.error-text'); if (er) er.remove();
      nm.textContent = f.name; hint.textContent = Math.max(1, Math.round(f.size / 1024)) + ' KB · click to change'; box.classList.add('has-file');
    },
    'session-group': (el) => {
      const g = st().groups.find((x) => x.id === el.value);
      document.getElementById('s-invites').textContent = g ? 'Invites: ' + g.studentIds.map(sname).join(', ') : '';
      const t = document.getElementById('s-title'), w = document.getElementById('s-why');
      if (g) { if (!t.dataset.touched) t.value = GAPS[g.gapId].short + ' Review'; if (!w.dataset.touched) w.value = 'To practise ' + GAPS[g.gapId].short.toLowerCase() + ' together.'; }
    },
    'm-to': (el) => {
      const parentsOnly = el.value === 'parents';
      document.getElementById('m-tone').innerHTML = I('info', 'icon-xs') + (parentsOnly ? ' Only parents will read this — use a normal adult tone.' : ' Students will read this — write in simple words at a Grade 4 level.');
      document.getElementById('m-body').placeholder = parentsOnly ? 'Dear parents, …' : 'Write a short, friendly message…';
    },
    'm-body': (el) => { document.getElementById('m-count').textContent = el.value.length + ' / 400 characters'; }
  };
  document.addEventListener('input', (e) => { if (e.target.id === 's-title' || e.target.id === 's-why') e.target.dataset.touched = '1'; });

  /* ---------- forms ---------- */
  const readFile = (f) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => res(null); r.readAsDataURL(f); });
  const forms = {
    'create-group': (f) => {
      U.clearErrors(f);
      const name = f.name.value.trim(), gap = f.gap.value, ids = [...f.querySelectorAll('input[name="students"]:checked')].map((x) => x.value);
      let bad = false;
      if (!name) { U.setError(f.name, 'Give the group a name.'); bad = true; }
      else if (st().groups.some((g) => g.classId === cid() && g.name.toLowerCase() === name.toLowerCase())) { U.setError(f.name, 'A group with this name already exists.'); bad = true; }
      if (!gap) { U.setError(f.gap, 'Choose the confirmed gap this group shares.'); bad = true; }
      if (ids.length < 2) { U.toast('error', 'Select at least 2 students', 'A group needs two or more students.'); bad = true; }
      if (bad) { const x = f.querySelector('[aria-invalid="true"]'); if (x) x.focus(); return; }
      const sugg = (clusters().find((c) => c.g === gap) || { ids: [] }).ids;
      const same = sugg.length === ids.length && sugg.every((x) => ids.includes(x));
      st().groups.push({ id: D.uid('g'), classId: cid(), name, gapId: gap, studentIds: ids, source: same ? 'AI-suggested' : 'Manual', createdAt: Date.now() });
      st().ui.groupDraft = null;
      D.log(cid(), { kind: 'group', title: 'Group Created', text: 'You grouped ' + ids.map(sname).map(esc).join(', ') + ' as <b>' + esc(name) + '</b>.', link: '#/gaps', action: 'View groups' });
      save(); rer(); U.toast('success', 'Group created', name + ' · ' + ids.length + ' students. You can now assign practice or a session.');
    },
    'assign-practice': async (f) => {
      U.clearErrors(f);
      let bad = false;
      const ids = resolveTarget(f.target.value);
      if (!ids.length) { U.setError(f.target, 'Choose who gets this practice.'); bad = true; }
      if (!f.title.value.trim()) { U.setError(f.title, 'Give the practice a title students will understand.'); bad = true; }
      if (!f.gap.value) { U.setError(f.gap, 'Choose the learning gap this practice targets.'); bad = true; }
      if (!f.due.value) { U.setError(f.due, 'Choose a due date.'); bad = true; }
      else if (f.due.value < D.isoDay(0)) { U.setError(f.due, 'The due date can’t be in the past.'); bad = true; }
      if (bad) { f.querySelector('[aria-invalid="true"]').focus(); U.toast('error', 'Missing required information', 'Please fix the highlighted fields.'); return; }
      const file = f.file.files[0];
      let worksheet = null;
      if (file) { worksheet = { name: file.name, size: file.size, type: file.type }; if (file.size < 1.5 * 1024 * 1024) worksheet.dataUrl = await readFile(file); }
      const gap = f.gap.value;
      const emoji = { 'g-de-vocab': '🍬', 'g-lessthan': '⚖️', 'g-mixed': '🍕', 'g-times': '⚡' }[gap] || '📘';
      const p = { id: D.uid('p'), classId: cid(), title: f.title.value.trim(), topic: GAPS[gap].short, desc: f.desc.value.trim() || 'A short practice picked just for you by ' + T().displayName + '.', emoji, minutes: +f.minutes.value, gapId: gap, quiz: D.QUIZ_FOR_GAP[gap] || 'general', assignedTo: ids, due: f.due.value, worksheet, createdAt: Date.now(), baseline: 55, after: null, completion: {}, progress: {}, reminded: {} };
      st().practice.push(p);
      sendToStudents(ids, { kind: 'practice', title: 'New practice: ' + p.title, body: T().displayName + ' picked this practice to help you. ' + emoji + ' ' + U.fmtDue(p.due) + '.', link: '#/practice' });
      D.log(cid(), { kind: 'practice', title: 'Practice Assigned', text: '<b>' + esc(p.title) + '</b> assigned to ' + ids.map(sname).map(esc).join(', ') + '.', link: '#/practice', action: 'View practice' });
      if (!save()) { st().practice.pop(); return; }
      rer(); U.toast('success', 'Practice assignment created', 'Sent to ' + U.plural(ids.length, 'student') + ' in their portal.');
    },
    'create-session': (f) => {
      U.clearErrors(f);
      let bad = false;
      const g = st().groups.find((x) => x.id === f.group.value);
      const at = f.at.value ? new Date(f.at.value).getTime() : NaN;
      const cap = parseInt(f.capacity.value, 10);
      if (!f.title.value.trim()) { U.setError(f.title, 'Give the session a title.'); bad = true; }
      if (!g) { U.setError(f.group, 'Choose a group to invite.'); bad = true; }
      if (isNaN(at)) { U.setError(f.at, 'Choose a date and time.'); bad = true; }
      else if (at < Date.now()) { U.setError(f.at, 'Pick a time in the future.'); bad = true; }
      if (isNaN(cap) || cap < 1) { U.setError(f.capacity, 'Capacity must be at least 1.'); bad = true; }
      else if (g && cap < g.studentIds.length) { U.setError(f.capacity, 'This group has ' + g.studentIds.length + ' students — raise capacity so everyone fits.'); bad = true; }
      if (!f.location.value.trim()) { U.setError(f.location, 'Where will you meet?'); bad = true; }
      if (!f.why.value.trim()) { U.setError(f.why, 'Tell students why they are invited.'); bad = true; }
      if (bad) { f.querySelector('[aria-invalid="true"]').focus(); U.toast('error', 'Missing required information', 'Please fix the highlighted fields.'); return; }
      const x = { id: D.uid('ss'), classId: cid(), title: f.title.value.trim(), groupId: g.id, invitees: g.studentIds.slice(), at, duration: +f.duration.value, capacity: cap, location: f.location.value.trim(), why: f.why.value.trim(), registrations: [], createdAt: Date.now() };
      st().sessions.push(x);
      sendToStudents(x.invitees, { kind: 'session', title: 'You are invited: ' + x.title, body: T().displayName + ' invited you to a small help session on ' + U.fmtWhen(x.at) + '. Why? ' + x.why, link: '#/sessions', sessionId: x.id });
      D.log(cid(), { kind: 'session', title: 'Session Recommended', text: '<b>' + esc(x.title) + '</b> recommended to ' + esc(g.name) + '.', link: '#/sessions', action: 'View session' });
      save(); rer(); U.toast('success', 'Session recommended', 'Invitations sent to ' + g.studentIds.map(sfirst).join(', ') + '.');
    },
    'send-message': (f) => {
      U.clearErrors(f);
      let bad = false;
      const v = f.to.value; let ids, label;
      let parents = 0;
      if (v === 'all' || v === 'all+parents' || v === 'parents') {
        const all = D.classStudents(cid());
        ids = v === 'parents' ? [] : all.map((s) => s.id);
        parents = v === 'all' ? 0 : all.length;
        label = v === 'all' ? 'All ' + cls().name + ' students' : v === 'parents' ? cls().name + ' parents' : cls().name + ' students & parents';
      }
      else { ids = resolveTarget(v); const [k, id] = v.split(':'); label = k === 'group' ? st().groups.find((g) => g.id === id).name : sname(id); }
      if (!ids.length && !parents) { U.setError(f.to, 'Choose who should receive this.'); bad = true; }
      if (!f.title.value.trim()) { U.setError(f.title, 'Add a short title.'); bad = true; }
      if (f.body.value.trim().length < 5) { U.setError(f.body, 'Write a message (at least a few words).'); bad = true; }
      if (bad) { f.querySelector('[aria-invalid="true"]').focus(); return; }
      const kind = f.kind.value;
      const link = kind === 'practice' ? '#/practice' : kind === 'feedback' ? '#/exams' : '#/notifications';
      sendToStudents(ids, { kind: kind === 'reminder' ? 'reminder' : kind === 'practice' ? 'practice' : 'message', title: f.title.value.trim(), body: f.body.value.trim(), link });
      st().sent.unshift({ id: D.uid('m'), classId: cid(), title: f.title.value.trim(), body: f.body.value.trim(), toLabel: label, to: ids, parents, at: Date.now() });
      D.log(cid(), { kind: 'message', title: 'Announcement Sent', text: '“' + esc(f.title.value.trim()) + '” sent to ' + esc(label) + '.', link: '#/notifications?tab=sent', action: 'View sent' });
      save(); st().ui.notifTab = 'sent'; save(); go('#/notifications?tab=sent');
      U.toast('success', 'Notification sent', 'Sent to ' + [ids.length ? U.plural(ids.length, 'student') : '', parents ? U.plural(parents, 'parent') : ''].filter(Boolean).join(' and ') + ' (' + label + ').');
    }
  };

  /* ---------- help ---------- */
  const HELP = {
    dashboard: '<p>The dashboard shows what needs you first.</p><h3>Tips</h3><ul><li>Click a stat card to open the matching filtered list.</li><li><b>Priority sorting</b> puts red flags and OCR checks first.</li><li>Use the class menu at the top to switch class.</li></ul>',
    submissions: '<h3>Statuses</h3><ul><li><b>Needs OCR</b> – check the scanned answers (Step 1).</li><li><b>AI Review</b> – the AI suggested a grade; you confirm it (Steps 2–4).</li><li><b>Published</b> – the student can see grade and feedback.</li></ul><h3>Shortcut</h3><ul><li>Press <kbd>/</kbd> to jump to the search box.</li></ul>',
    grading: '<h3>The 4 steps</h3><ul><li><b>1. OCR Verification</b> – compare the scan with the extracted text. Dashed amber boxes are uncertain; pick a reading or type it.</li><li><b>2. AI Grading</b> – a suggestion only.</li><li><b>3. Confirmation</b> – change any points (with a reason), confirm or dismiss every gap and red flag, edit the feedback.</li><li><b>4. Notification</b> – preview what the student sees, then publish.</li></ul><p class="mt-12">Your edits are saved automatically. You can go back to any finished step.</p>',
    gaps: '<ul><li><b>Clusters</b> show confirmed gaps shared by several students.</li><li><b>Create Targeted Group</b> – AI pre-ticks students; you decide.</li><li><b>Language vs Concept</b> compares the same concept in direct, English and German questions. The AI hypothesis is a suggestion; save your own decision.</li></ul>',
    practice: '<ul><li>Choose a student or a group, a gap and a due date.</li><li>Students get a short video, a worksheet and a 5-question quiz.</li><li>Completion updates here automatically. Use <b>Send Reminder</b> for students who have not finished.</li></ul>',
    sessions: '<ul><li>Sessions go to a group with a shared gap.</li><li>Students register from their portal; the seat count updates here.</li><li>The “Why recommended” text is shown to students — keep it simple.</li></ul>',
    insights: '<ul><li>Insights use confirmed grades only.</li><li>Before/after numbers show an observed change, not proof that practice caused it.</li><li><b>Export</b> opens your browser’s print dialog — choose “Save as PDF”.</li></ul>',
    notifications: '<ul><li>Send to the whole class, a group or one student.</li><li>Quick tags add ready-made sentences.</li><li><b>Inbox</b> shows registrations and completed practice; <b>Sent</b> shows your messages.</li></ul>'
  };

  PM.shell.start({
    roleLabel: 'Teacher Portal',
    defaultRoute: 'dashboard',
    nav: () => [
      { route: 'dashboard', label: 'Home', icon: 'home' },
      { route: 'submissions', label: 'Submissions', icon: 'file' },
      { route: 'grading', label: 'Grading', icon: 'grading' },
      { route: 'gaps', label: 'Learning Gaps', icon: 'target' },
      { route: 'practice', label: 'Practice', icon: 'practice' },
      { route: 'sessions', label: 'Support Sessions', icon: 'users' },
      { route: 'insights', label: 'Insights', icon: 'chart' },
      { route: 'notifications', label: 'Notifications', icon: 'bell', badge: unreadTeacher }
    ],
    profile: () => ({ name: T().displayName, sub: cls().name + ' • ' + (T().classroom === cid() ? 'Lead' : 'Viewing'), avatar: teacherAvatar() }),
    routes: { dashboard: vDashboard, submissions: vSubmissions, grading: vGrading, gaps: vGaps, practice: vPractice, sessions: vSessions, insights: vInsights, notifications: vNotifications },
    topbar,
    actions, inputs, forms,
    help: (r) => (HELP[r] || HELP.dashboard) + '<h3>Keyboard</h3><ul><li><kbd>?</kbd> opens this help.</li><li><kbd>/</kbd> searches submissions.</li><li><kbd>Esc</kbd> closes dialogs and menus.</li></ul>',
    keys: {
      '/': () => { if (PM.shell.current().name !== 'submissions') { go('#/submissions'); setTimeout(() => { const s = document.getElementById('sub-search'); if (s) s.focus(); }, 50); } else document.getElementById('sub-search').focus(); }
    }
  });
})();
