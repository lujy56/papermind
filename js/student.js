/* =========================================================
   PaperMind — Student portal (Grades 1–5)
   ========================================================= */
(function () {
  'use strict';
  const PM = window.PM, D = PM.data, U = PM.ui, I = U.icon, esc = U.esc;
  const sess = PM.auth.guard('student');
  if (!sess) return;
  D.load();

  const st = () => D.state;
  const me = () => D.student(sess.userId);
  if (!me()) { PM.auth.logout(); return; }
  const save = () => D.save();
  const go = (h) => PM.shell.go(h);
  const rer = () => PM.shell.rerender();
  const teacher = () => st().teacher.displayName;
  const GAPS = D.GAPS;
  const callMe = () => me().nickname || me().first;

  const myExams = () => st().exams.filter((e) => e.studentId === me().id);
  const published = () => myExams().filter((e) => e.status === 'published').sort((a, b) => (a.published.at || a.uploadedAt) - (b.published.at || b.uploadedAt));
  const underReview = () => myExams().filter((e) => e.status !== 'published').sort((a, b) => b.uploadedAt - a.uploadedAt);
  const myNotes = () => st().notifications.filter((n) => n.to === me().id).sort((a, b) => b.at - a.at);
  const unread = () => myNotes().filter((n) => !n.read).length;
  const myPractice = () => D.studentPractice(me().id).sort((a, b) => (a.completion[me().id] ? 1 : 0) - (b.completion[me().id] ? 1 : 0) || a.due.localeCompare(b.due));
  const mySessions = () => D.studentSessions(me().id).sort((a, b) => a.at - b.at);
  const avatar = (lg) => '<span class="avatar emoji ' + (lg ? 'avatar-lg' : '') + '" aria-hidden="true">' + esc(me().avatar || '🙂') + '</span>';
  const SUBJ_EMOJI = { Math: '🧮', Science: '🌱', English: '📖' };
  const stars = (pct) => (pct >= 90 ? '⭐⭐⭐' : pct >= 70 ? '⭐⭐' : '⭐');
  const cheer = (pct) => (pct >= 90 ? 'Amazing work, ' + callMe() + '! 🌟' : pct >= 75 ? 'Great job, ' + callMe() + '! 🎉' : pct >= 60 ? 'Good effort, ' + callMe() + '! Keep going 💪' : 'You are learning, ' + callMe() + '! Let’s practise together 🌱');
  const scoreClass = (p) => (p >= 85 ? 'good' : p >= 65 ? 'ok' : 'low');
  const reviewText = (e) => (e.status === 'ocr' ? 'Your teacher is reading your answers 👀' : e.status === 'feedback' ? 'Almost ready! 🎉' : 'Your teacher is checking your grade ✏️');

  /* ---------- topbar ---------- */
  function topbar() {
    const n = unread();
    return '<span class="star-pill" title="Your stars">⭐ ' + me().stars + ' <span class="sr-only">stars</span></span>' +
      '<a class="icon-btn" href="#/notifications" aria-label="Notifications, ' + n + ' new">' + I('bell') + (n ? '<span class="dot">' + n + '</span>' : '') + '</a>' +
      '<button class="icon-btn" type="button" data-action="open-help" aria-label="Help">' + I('help') + '</button>' +
      '<button class="icon-btn" type="button" data-action="open-profile" aria-label="Open my profile" style="padding:0;border:0">' + avatar() + '</button>';
  }

  /* =========================================================
     HOME
     ========================================================= */
  function nextSteps() {
    const steps = [];
    const freshFeedback = myNotes().find((n) => n.kind === 'feedback' && !n.read && n.examId);
    if (freshFeedback) steps.push({ text: 'Read your new feedback', href: freshFeedback.link, tag: 'New!', tone: 'red' });
    myPractice().filter((p) => !p.completion[me().id]).slice(0, 2).forEach((p) => steps.push({ text: 'Finish practice: ' + p.title + ' ' + p.emoji, href: '#/practice?focus=' + p.id, tag: U.fmtDue(p.due), tone: U.isOverdue(p.due) ? 'red' : 'amber' }));
    mySessions().filter((x) => !x.registrations.includes(me().id) && x.at > Date.now()).slice(0, 1).forEach((x) => steps.push({ text: 'You are invited to a help session', href: '#/sessions', tag: U.fmtWhen(x.at).split(' · ')[0], tone: 'purple' }));
    underReview().slice(0, 1).forEach((e) => steps.push({ text: 'Wait for ' + teacher() + ' to check ' + e.title, wait: true, tag: 'Pending', tone: 'amber' }));
    steps.push({ text: 'Upload a new exam', href: '#/upload' });
    return steps.slice(0, 5);
  }
  const TIPS = ['Read every word problem twice — then underline the question! 🔎', '“bleibt übrig” means what is LEFT over. Subtract! ➖', 'Take your exam photo near a window for good light. 📷', 'Stuck? Watch the 1-minute video in Practice first. 🎬', 'Mixed numbers: 9/4 = 2 wholes and 1/4 left = 2 1/4 🍕', 'Little and often: 10 minutes a day grows your brain! 🌱', 'Check your answer at the end — does it make sense? ✅'];
  let tipIdx = Math.floor(Math.random() * 7);
  const ALL_BADGES = [['Math Explorer ⭐', 'Math Explorer', '⭐'], ['Fast Learner 🚀', 'Fast Learner', '🚀'], ['Practice Star 🏆', 'Practice Star', '🏆'], ['Word Wizard 🧙', 'Word Wizard', '🧙'], ['Streak Master 🔥', 'Streak Master', '🔥'], ['Science Sprout 🌱', 'Science Sprout', '🌱']];
  function vHome() {
    const s = me(), n = unread();
    const last = published().slice(-1)[0];
    const steps = nextSteps();
    const lvlMin = s.level * 30, lvlMax = (s.level + 1) * 40;
    const lvlPct = Math.max(4, Math.min(100, Math.round((s.stars - lvlMin) / (lvlMax - lvlMin) * 100)));
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const todayIdx = (new Date().getDay() + 6) % 7;
    const streakDots = days.map((d, i) => { const on = i <= todayIdx && todayIdx - i < s.streak; return '<span class="sd ' + (on ? 'on' : '') + (i === todayIdx ? ' today' : '') + '" title="' + d + '">' + (on ? '🔥' : d) + '</span>'; }).join('');
    const pr = myPractice(), prDone = pr.filter((x) => x.completion[s.id]).length;
    return {
      title: 'Home', hideTitle: true,
      html: '<section class="hero"><div><h2>Hi ' + esc(callMe()) + '! <span class="wave" aria-hidden="true">👋</span></h2><p>Keep going! You’re doing great! <span class="chip chip-amber">✏️ Super Learner</span><span class="chip chip-purple">🚀 Grade ' + esc(s.classId[0]) + ' Star</span></p></div>' +
        '<div class="level-card big"><img src="assets/logo.png" alt=""><div class="lv"><div class="row-between"><span class="k c-purple">Brain level ' + s.level + '</span><span class="v">⭐ <span data-count="' + s.stars + '">' + s.stars + '</span></span></div>' +
        '<div class="lv-bar" role="progressbar" aria-label="Progress to brain level ' + (s.level + 1) + '" aria-valuenow="' + lvlPct + '" aria-valuemin="0" aria-valuemax="100"><span style="width:' + lvlPct + '%"></span></div><div class="tiny muted">' + Math.max(0, lvlMax - s.stars) + ' stars to level ' + (s.level + 1) + '</div>' +
        '<div class="streak" aria-label="' + s.streak + '-day streak"><span class="k c-amber">🔥 ' + s.streak + '-day streak</span><span class="sds">' + streakDots + '</span></div></div></div></section>' +
        '<div class="big-cards"><a class="big-card bc-green" href="#/upload"><span class="b-ico">' + I('upload') + '</span><h3>Upload Exam <span class="mini-tag">📷 Scan Paper</span></h3><p>Scan or upload your exam paper</p><span class="bc-deco" aria-hidden="true">📄</span></a>' +
        '<a class="big-card bc-amber" href="#/exams"><span class="b-ico">' + I('file') + '</span><h3>My Results <span class="mini-tag">⭐ Star Grades</span></h3><p>' + (last ? 'Last result: ' + esc(last.title) + ' — ' + last.published.pct + '%' : 'View your grades and feedback') + '</p><span class="bc-deco" aria-hidden="true">🏅</span></a>' +
        '<a class="big-card bc-purple" href="#/progress"><span class="b-ico">' + I('trending') + '</span><h3>My Progress <span class="mini-tag">📈 Level Up</span></h3><p>See how you are improving</p><span class="bc-deco" aria-hidden="true">🚀</span></a></div>' +
        (n ? '<a class="notif-banner" href="#/notifications"><span class="n-ico bell-ring">' + I('bell') + '</span><div><h3>Notifications <span class="new-pill">New</span></h3><p>You have ' + n + ' new message' + (n > 1 ? 's' : '') + ' from ' + esc(teacher()) + '…</p></div><span class="more">View All ' + I('chevRight', 'icon-sm') + '</span></a>'
          : '<a class="notif-banner calm" href="#/notifications"><span class="n-ico">' + I('check') + '</span><div><h3>All caught up!</h3><p>No new messages right now.</p></div><span class="more">Open ' + I('chevRight', 'icon-sm') + '</span></a>') +
        '<div class="home-bottom"><div class="home-main"><section class="steps-card" aria-labelledby="ns-h"><div><div class="row-between"><h3 id="ns-h">Your Next Steps <span aria-hidden="true">🎯</span></h3><span class="small muted">Action checklist</span></div>' +
        steps.map((x, i) => (x.wait ? '<div class="next-step wait">' : '<a class="next-step" href="' + x.href + '">') + '<span class="n">' + (i + 1) + '</span><span class="ns-t">' + esc(x.text) + '</span><span class="right">' + (x.tag ? '<span class="chip chip-' + x.tone + '">' + esc(x.tag) + '</span>' : '') + (x.wait ? '' : I('chevRight', 'icon-sm')) + '</span>' + (x.wait ? '</div>' : '</a>')).join('') + '</div></section>' +
        (last ? '<a class="latest-card" href="#/results/' + last.id + '">' + U.ring(last.published.pct, 84, last.published.pct >= 85 ? 'var(--green-500)' : last.published.pct >= 65 ? 'var(--blue-500)' : 'var(--amber-400)', null, 'Latest grade ' + last.published.pct + ' percent') +
          '<div class="lc-b"><span class="k">Latest result · ' + esc(last.subject) + '</span><h3>' + (SUBJ_EMOJI[last.subject] || '📝') + ' ' + esc(last.title) + ' <span class="lc-stars">' + stars(last.published.pct) + '</span></h3><p>“' + esc(last.published.feedback.length > 110 ? last.published.feedback.slice(0, 107) + '…' : last.published.feedback) + '” <span class="muted">— ' + esc(teacher()) + '</span></p></div><span class="go" aria-hidden="true">' + I('chevRight', 'icon-sm') + '</span></a>' : '') + '</div>' +
        '<div class="home-side"><section class="mascot-card" aria-labelledby="tip-h"><h3 id="tip-h" class="sr-only">Tip from Brainy</h3><div class="bubble" aria-live="polite" id="tip-text">' + esc(TIPS[tipIdx % TIPS.length]) + '</div>' +
        '<button class="mascot-btn" type="button" data-action="next-tip" aria-label="Tap Brainy for another tip"><img src="assets/logo.png" alt=""></button><span class="tiny muted">Tap Brainy for another tip!</span></section>' +
        '<section class="badge-card" aria-labelledby="bd-h"><div class="row-between"><h3 id="bd-h">My Badges</h3><span class="chip chip-amber">' + s.badges.length + ' / ' + ALL_BADGES.length + '</span></div><div class="badges">' +
        ALL_BADGES.map(([key, name, emo]) => { const got = s.badges.includes(key); return '<span class="bdg ' + (got ? 'got' : '') + '" title="' + esc(name) + (got ? '' : ' (locked)') + '"><span class="bi" aria-hidden="true">' + (got ? emo : '🔒') + '</span><span class="bn">' + esc(name) + '</span>' + (got ? '' : '<span class="sr-only"> locked</span>') + '</span>'; }).join('') +
        '</div><p class="tiny muted mt-12">Practice done: <b>' + prDone + '/' + pr.length + '</b> — finish them all for “Practice Star”!</p></section></div></div>'
    };
  }

  /* =========================================================
     UPLOAD
     ========================================================= */
  const up = { file: null, step: 1, lastId: null };
  const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf', 'image/svg+xml'];
  const EXAM_NAMES = { Math: ['Math Quiz 4', 'Mathe-Test 4', 'Fractions Test', 'Multiplication Checkup'], Science: ['Science Quiz', 'Plants & Animals Test'], English: ['English Reading Check', 'Spelling Test'] };
  function vUpload() {
    const steps = ['Choose your paper', 'Tell us about it', 'Send it!'];
    const stepper = '<ol class="up-steps" aria-label="Upload steps">' + steps.map((l, i) => {
      const k = i + 1, cls_ = k < up.step ? 'done' : k === up.step ? 'on' : '';
      const can = up.step === 3 ? k === 1 : (k < up.step || (k === 2 && up.file && up.step !== 2));
      const inner = '<span class="n">' + (k < up.step ? '✓' : k) + '</span>' + l;
      return '<li class="' + cls_ + (can ? ' can' : '') + '" ' + (k === up.step ? 'aria-current="step"' : '') + '>' + (can ? '<button type="button" data-action="up-goto" data-s="' + k + '" aria-label="Go to step ' + k + ': ' + l + (up.step === 3 && k === 1 ? ' (start a new upload)' : '') + '">' + inner + '</button>' : inner) + '</li>';
    }).join('') + '</ol>';
    if (up.step === 3) {
      const e = D.exam(up.lastId);
      return { title: 'Upload Exam', html: '<p class="page-sub">Your paper was sent!</p>' + stepper + '<section class="success" role="status"><div class="party" aria-hidden="true">🎉</div><h2>Your paper is on its way to ' + esc(teacher()) + '!</h2><p class="muted">' + esc(e ? e.title : 'Your exam') + ' was uploaded. We will tell you when your grade and feedback are ready.</p>' +
        '<ol class="timeline" aria-label="What happens next"><li class="done"><span class="c">✓</span>Uploaded</li><li class="now"><span class="c">👀</span>Teacher checks answers</li><li><span class="c">⭐</span>Grade & feedback ready</li></ol>' +
        '<div class="row" style="justify-content:center;flex-wrap:wrap"><a class="btn btn-primary btn-lg" href="#/exams?tab=review">See My Exams</a><button class="btn btn-lg" type="button" data-action="upload-again">Upload another paper</button></div></section>' };
    }
    if (!up.file || up.step === 1) {
      const keep = up.file ? '<div class="keep-file"><span class="kf-ico" aria-hidden="true">' + (up.file.isPdf ? '📄' : '🖼️') + '</span><div style="flex:1;min-width:0"><b>Your chosen paper: ' + esc(up.file.name) + '</b><div class="small muted">Keep it, or choose a new file below.</div></div><button class="btn btn-primary" type="button" data-action="up-goto" data-s="2">Keep this paper ' + I('arrowRight', 'icon-sm') + '</button></div>' : '';
      return { title: 'Upload Exam', html: '<p class="page-sub">Take a photo or scan of your finished test paper.</p>' + stepper + keep +
        '<div class="dropzone" id="dropzone"><div class="cloud">' + I('upload') + '</div><h2>Upload Your Exam Paper</h2><p>Take a complete photo or scan of your finished test paper</p>' +
        '<div class="chips"><span class="chip">📷 Snap a clear photo</span><span class="chip chip-green">✨ Teacher checks it</span><span class="chip chip-amber">🌞 Earn stars</span></div>' +
        '<label class="btn btn-primary btn-lg" for="file-in" style="cursor:pointer">' + I('upload', 'icon-sm') + 'Choose File</label><input id="file-in" class="sr-only" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" data-input="file-in" aria-describedby="file-help">' +
        '<p class="mt-16"><button class="link-btn" type="button" data-action="use-sample">Or try with a sample exam paper</button></p>' +
        '<p class="tiny muted" id="file-help">You can also drag your file here. Photos (JPG, PNG) or PDF · up to 10 MB</p><div id="file-err" role="alert" class="mt-12"></div></div>' +
        '<h3 class="mt-24 mb-16">How to take a great photo 📸</h3><div class="photo-tips">' +
        [['📄', 'Whole page', 'All 4 corners are in the picture.', 'good'], ['💡', 'Good light', 'Near a window, no dark shadows.', 'good'], ['🔍', 'Sharp writing', 'Hold still so nothing is blurry.', 'good'], ['🙈', 'No fingers', 'Keep hands off the paper.', 'bad']].map(([e, t, d, k]) => '<div class="ptip ' + k + '"><span class="pt-e" aria-hidden="true">' + e + '</span><b>' + t + '</b><span>' + d + '</span><span class="pt-k">' + (k === 'good' ? '✓ Do' : '✗ Avoid') + '</span></div>').join('') + '</div>',
        after: bindDrop };
    }
    const f = up.file;
    const subj = f.subject || 'Math', fm = up.form || {};
    return { title: 'Upload Exam', html: '<p class="page-sub">Great! Now tell us which exam this is.</p>' + stepper +
      '<div class="preview-wrap"><div class="preview">' + (f.isPdf ? '<div class="pdf">' + I('file') + '<b>PDF document</b></div>' : '<img src="' + f.preview + '" alt="Preview of your exam paper">') +
      '<p class="small mt-12"><b>' + esc(f.name) + '</b><br><span class="muted">' + esc(f.sizeLabel) + '</span></p><button class="btn btn-sm mt-12" type="button" data-action="change-file">' + I('refresh', 'icon-sm') + 'Choose a different file</button></div>' +
      '<form data-form="upload" novalidate><div class="field"><label for="u-subject">Which subject?</label><select class="select" id="u-subject" name="subject" data-input="u-subject">' + ['Math', 'Science', 'English'].map((s) => '<option ' + (s === subj ? 'selected' : '') + '>' + s + '</option>').join('') + '</select></div>' +
      '<div class="field"><label for="u-title">Which exam is it?</label><select class="select" id="u-title" name="title">' + EXAM_NAMES[subj].map((n) => '<option ' + (fm.title === n ? 'selected' : '') + '>' + n + '</option>').join('') + '<option value="__other" ' + (fm.title === '__other' ? 'selected' : '') + '>Something else…</option></select></div>' +
      '<div class="field" id="u-other-wrap" ' + (fm.title === '__other' ? '' : 'hidden') + '><label for="u-other">Type the exam name</label><input class="input" id="u-other" name="other" maxlength="40" placeholder="e.g. Math Quiz 5" value="' + esc(fm.other || '') + '"></div>' +
      '<div class="field"><label class="big-check"><input type="checkbox" name="check" id="u-check" ' + (fm.check ? 'checked' : '') + '> I checked: the whole page is in the picture and I can read it 👀</label></div>' +
      '<div class="up-actions"><button class="btn btn-outline btn-lg" type="button" data-action="up-goto" data-s="1">' + I('arrowLeft', 'icon-sm') + 'Back</button><button class="btn btn-success btn-lg" type="submit">Send to ' + esc(teacher()) + ' 🚀</button></div><p class="tiny muted mt-12">Only ' + esc(teacher()) + ' can see your paper. You will get a message when it is checked.</p></form></div>' };
  }
  function bindDrop(view) {
    const dz = view.querySelector('#dropzone'); if (!dz) return;
    ['dragenter', 'dragover'].forEach((t) => dz.addEventListener(t, (e) => { e.preventDefault(); dz.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach((t) => dz.addEventListener(t, (e) => { e.preventDefault(); dz.classList.remove('drag'); }));
    dz.addEventListener('drop', (e) => { const f = e.dataTransfer.files[0]; if (f) takeFile(f); });
  }
  function fileError(msg) {
    const box = document.getElementById('file-err');
    if (box) box.innerHTML = '<div class="notice err" style="justify-content:center">' + I('alertCircle') + '<span>' + esc(msg) + '</span></div>';
    U.toast('error', 'Oops! That file won’t work', msg);
  }
  function shrinkImage(src) {
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => {
        const max = 1400, k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        try { res(c.toDataURL('image/jpeg', 0.8)); } catch (e) { res(null); }
      };
      img.onerror = () => res(null);
      img.src = src;
    });
  }
  async function takeFile(f) {
    if (!OK_TYPES.includes(f.type) && !/\.(jpe?g|png|webp|pdf)$/i.test(f.name)) { fileError('Please choose a photo (JPG or PNG) or a PDF. “' + f.name + '” is a different kind of file.'); return; }
    if (f.size > 10 * 1024 * 1024) { fileError('This file is too big (' + (f.size / 1048576).toFixed(1) + ' MB). Please choose one smaller than 10 MB.'); return; }
    if (f.size === 0) { fileError('This file looks empty. Please take the photo again.'); return; }
    const isPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
    const url = URL.createObjectURL(f);
    let dataUrl = null;
    if (!isPdf) dataUrl = await shrinkImage(url);
    else if (f.size < 1.5 * 1024 * 1024) dataUrl = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.onerror = () => r(null); fr.readAsDataURL(f); });
    if (!isPdf && !dataUrl) { fileError('We could not open this picture. Please try another photo.'); return; }
    up.file = { name: f.name, type: isPdf ? 'application/pdf' : 'image/jpeg', isPdf, preview: dataUrl || url, dataUrl, sizeLabel: (f.size / 1024 > 1024 ? (f.size / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(f.size / 1024)) + ' KB') };
    up.form = null; up.step = 2; rer();
    U.toast('success', 'Paper added!', 'Now choose the subject and exam name.');
  }

  /* =========================================================
     MY EXAMS
     ========================================================= */
  function vExams(p, q) {
    const tab = q.tab === 'review' ? 'review' : 'done';
    const subj = q.subject || 'All';
    const allDone = published().slice().reverse(), rev = underReview();
    const done = subj === 'All' ? allDone : allDone.filter((e) => e.subject === subj);
    const avg = allDone.length ? Math.round(allDone.reduce((a, e) => a + e.published.pct, 0) / allDone.length) : 0;
    const best = allDone.reduce((m, e) => (!m || e.published.pct > m.published.pct ? e : m), null);
    const ringCol = (pc) => (pc >= 85 ? 'var(--green-500)' : pc >= 65 ? 'var(--blue-500)' : 'var(--amber-400)');
    const list = tab === 'done'
      ? (done.length ? done.map((e) => '<a class="exam-row fade-up subj-' + e.subject.toLowerCase() + '" href="#/results/' + e.id + '">' + U.ring(e.published.pct, 68, ringCol(e.published.pct), null, e.published.pct + ' percent') + '<div class="info"><h3><span class="subj-emo" aria-hidden="true">' + (SUBJ_EMOJI[e.subject] || '📝') + '</span>' + esc(e.title) + ' <span class="chip chip-green">COMPLETED</span></h3><div class="meta">' + esc(e.subject) + ' · ' + esc(e.topics) + ' · ' + U.fmtDate(e.published.at) + '</div><div class="stars-row" aria-label="' + stars(e.published.pct).length / 2 + ' stars">' + stars(e.published.pct) + '</div></div><span class="link-btn small">View Analysis</span><span class="go" aria-hidden="true">' + I('chevRight', 'icon-sm') + '</span></a>').join('')
        : '<div class="empty">' + I('file') + '<h3>No results here yet</h3><p>When ' + esc(teacher()) + ' checks your exams, they will show up here.</p></div>')
      : (rev.length ? rev.map((e) => { const k = { ocr: 1, ai: 2, confirm: 2, feedback: 3 }[e.status] || 1; return '<div class="exam-row review fade-up"><span class="score" style="background:#fff3cf" aria-hidden="true">' + (SUBJ_EMOJI[e.subject] || '📝') + '</span><div class="info"><h3>' + esc(e.title) + ' <span class="chip chip-red">UNDER REVIEW</span></h3><div class="meta">' + esc(e.subject) + ' · uploaded ' + U.timeAgo(e.uploadedAt) + ' · Teacher: ' + esc(teacher()) + '</div>' +
          '<ol class="mini-track" aria-label="Checking progress">' + ['Uploaded', 'Teacher checking', 'Ready!'].map((l, i) => '<li class="' + (i < k ? 'done' : i === k ? 'now' : '') + '">' + l + '</li>').join('') + '</ol></div><span class="chip chip-amber">' + esc(reviewText(e)) + '</span></div>'; }).join('') +
        '<p class="small muted mt-8">' + I('info', 'icon-xs') + ' Your grade appears here after ' + esc(teacher()) + ' has checked and confirmed it.</p>'
        : '<div class="empty">' + I('checkCircle') + '<h3>Nothing waiting</h3><p>All your exams have been checked.</p><a class="btn btn-primary btn-sm mt-12" href="#/upload">Upload an exam</a></div>');
    return {
      title: 'My Exam Results',
      html: '<div class="row-between page-sub" style="flex-wrap:wrap"><span>Look at your graded exams and the ones your teacher is still checking.</span>' +
        '<div class="seg" role="tablist" aria-label="Exam lists"><button type="button" role="tab" aria-selected="' + (tab === 'done') + '" data-action="exam-tab" data-t="done">Completed (' + allDone.length + ')</button><button type="button" role="tab" aria-selected="' + (tab === 'review') + '" data-action="exam-tab" data-t="review">Under Review (' + rev.length + ')</button></div></div>' +
        '<div class="ex-sum"><div class="exs exs-a"><span class="ei" aria-hidden="true">📚</span><div><b>' + allDone.length + '</b><span>exams checked</span></div></div><div class="exs exs-b"><span class="ei" aria-hidden="true">🎯</span><div><b>' + avg + '%</b><span>average score</span></div></div>' +
        '<div class="exs exs-c"><span class="ei" aria-hidden="true">🏆</span><div><b>' + (best ? best.published.pct + '%' : '—') + '</b><span>' + (best ? 'best: ' + esc(best.title) : 'best score') + '</span></div></div><div class="exs exs-d"><span class="ei" aria-hidden="true">⏳</span><div><b>' + rev.length + '</b><span>being checked</span></div></div></div>' +
        (tab === 'done' ? '<div class="subj-filter" role="group" aria-label="Show subject">' + [['All', '🌈 All'], ['Math', '🧮 Math'], ['Science', '🌱 Science'], ['English', '📖 English']].map(([k, l]) => '<button type="button" aria-pressed="' + (subj === k) + '" data-action="exam-subj" data-s="' + k + '">' + l + '</button>').join('') + '</div>' : '') +
        '<div role="tabpanel">' + list + '</div>'
    };
  }

  /* =========================================================
     RESULTS
     ========================================================= */
  const celebrated = new Set();
  function vResults(params) {
    const e = D.exam(params[0]);
    if (!e || e.studentId !== me().id) return { title: 'Results', html: '<div class="empty">' + I('search') + '<h3>We can’t find that exam</h3><a class="btn btn-primary btn-sm mt-12" href="#/exams">Back to My Exams</a></div>' };
    if (e.status !== 'published') return { title: 'Results', html: '<a class="btn btn-sm mb-16" href="#/exams?tab=review">' + I('arrowLeft', 'icon-sm') + 'Back to My Exams</a><div class="empty">' + I('clock') + '<h3>' + esc(e.title) + ' is still being checked</h3><p>' + esc(reviewText(e)) + ' You will get a message when it is ready.</p></div>' };
    // reading the result marks its notification as read
    let changed = false;
    st().notifications.forEach((n) => { if (n.to === me().id && n.examId === e.id && !n.read) { n.read = true; changed = true; } });
    if (changed) save();
    const pb = e.published;
    const prev = published().filter((x) => x.subject === e.subject && x.published.at < pb.at).slice(-1)[0];
    const diff = prev ? pb.pct - prev.published.pct : null;
    const prac = pb.practiceId ? st().practice.find((p) => p.id === pb.practiceId) : myPractice().find((p) => pb.gaps.some((g) => g.id === p.gapId));
    const ses = pb.sessionId && st().sessions.find((x) => x.id === pb.sessionId && x.invitees.includes(me().id));
    const gapsHTML = pb.gaps.length ? '<ul>' + pb.gaps.map((g) => '<li><b>' + GAPS[g.id].emoji + ' ' + esc(GAPS[g.id].short) + '</b><br>' + esc(GAPS[g.id].simple) + '</li>').join('') + '</ul>' : '<p>Nothing new to practise from this exam. Wonderful! 🌈</p>';
    const flagHTML = pb.redFlag ? '<p><b>💛 Extra help is coming!</b></p><p class="mt-8">' + esc(pb.redFlag.studentText) + '</p>' : '<p>No extra help needed this time. You’ve got this! 🌈</p>';
    const answers = pb.answers ? '<section class="mt-24" aria-labelledby="ans-h"><h3 id="ans-h" class="mb-16">Your answers</h3>' + pb.answers.map((a, i) => '<div class="answer-row"><span class="q"><b>Q' + (i + 1) + '</b> ' + esc(a.prompt) + '</span><span class="hand" aria-label="You wrote ' + esc(a.value) + '">' + esc(a.value) + '</span>' + (a.score === a.max ? '<span class="chip chip-green">✓ ' + a.score + '/' + a.max + '</span>' : '<span class="chip chip-amber">' + a.score + '/' + a.max + ' · answer: ' + esc(a.correct) + '</span>') + '</div>').join('') + '</section>' : '';
    return {
      title: 'Results',
      after: () => { U.countUp(document.getElementById('grade-pct'), pb.pct, '%', 1100); if (pb.pct >= 80 && !celebrated.has(e.id)) { celebrated.add(e.id); setTimeout(() => U.confetti(120), 500); } },
      html: '<div class="row-between mb-16"><a class="btn btn-sm" href="#/exams">' + I('arrowLeft', 'icon-sm') + 'Back to My Exams</a><span class="chip chip-green">' + I('checkCircle') + 'Checked by ' + esc(teacher()) + '</span></div>' +
        '<p class="muted" style="font-size:17px">' + esc(e.subject) + ' – ' + esc(e.title) + ' · ' + esc(e.topics) + '</p><p class="small muted mb-16">Date: ' + U.fmtDate(e.uploadedAt) + '</p>' +
        '<div class="res-top"><section class="grade-card" aria-label="Your grade"><div class="row"><span style="font-size:24px" aria-hidden="true">⭐</span><b style="font-size:18px">Grade</b></div>' +
        '<div class="row mt-12" style="align-items:flex-end"><span class="pct" id="grade-pct">' + pb.pct + '%</span>' + (diff !== null ? '<span class="chip ' + (diff >= 0 ? 'chip-green' : 'chip-amber') + '">' + (diff >= 0 ? '+' : '') + diff + '% vs ' + esc(prev.title) + '</span>' : '') + '</div>' +
        '<div class="big-stars" aria-label="' + stars(pb.pct).length / 2 + ' stars">' + stars(pb.pct).split('⭐').slice(1).map((_, i) => '<span style="animation-delay:' + (0.5 + i * 0.18) + 's">⭐</span>').join('') + '</div><p class="mt-8" style="font-size:18px;font-weight:700">' + esc(cheer(pb.pct)) + '</p>' +
        '<div class="mt-16"><div class="bar-label row-between small"><span>Passing line (70%)</span><span>' + (pb.max ? pb.score + ' / ' + pb.max + ' points' : stars(pb.pct)) + '</span></div><div class="bar blue mt-8" style="height:12px" role="progressbar" aria-label="Your score" aria-valuenow="' + pb.pct + '" aria-valuemin="0" aria-valuemax="100"><span style="width:' + pb.pct + '%"></span></div></div></section>' +
        '<section class="info-card"><div class="r"><span class="i" aria-hidden="true">' + (SUBJ_EMOJI[e.subject] || '📝') + '</span><div><div class="k">Subject</div><div class="v">' + esc(e.subject) + '</div></div></div>' +
        '<div class="r"><span class="i" aria-hidden="true">📝</span><div><div class="k">Exam</div><div class="v">' + esc(e.title) + ' — ' + esc(e.topics) + '</div></div></div>' +
        '<div class="r"><span class="i" aria-hidden="true">📅</span><div><div class="k">Checked on</div><div class="v">' + U.fmtDate(pb.at) + '</div></div></div></section></div>' +
        '<h3 class="mt-24 mb-16" style="font-size:22px">Quick Overview</h3><div class="ov-grid">' +
        '<section class="ov ov-pink"><h4>' + I('message', 'icon-sm') + ' Feedback</h4><p style="white-space:pre-wrap">' + esc(pb.feedback) + '</p></section>' +
        '<section class="ov ov-yellow"><h4>' + I('target', 'icon-sm') + ' Weaknesses</h4>' + gapsHTML + '</section>' +
        '<section class="ov ' + (pb.redFlag ? 'ov-lav' : 'ov-mint') + '"><h4>' + I('flag', 'icon-sm') + ' Red Flag</h4>' + flagHTML + '</section></div>' +
        (ses ? '<div class="notice mt-24" style="font-size:15px">' + I('calendar') + '<span><b>' + esc(teacher()) + ' invited you to “' + esc(ses.title) + '”</b> on ' + U.fmtWhen(ses.at) + '. ' + (ses.registrations.includes(me().id) ? 'You are registered ✓' : '<a href="#/sessions">See details & register →</a>') + '</span></div>' : '') +
        answers +
        '<div class="mt-24">' + (prac ? '<a class="btn btn-primary cta-big" href="#/practice?focus=' + prac.id + '">View Recommended Practice ✨</a>' : '<a class="btn btn-primary cta-big" href="#/practice">Go to my practice ✨</a>') + '</div>'
    };
  }

  /* =========================================================
     PROGRESS
     ========================================================= */
  function lineChart(points) {
    const W = 760, H = 300, L = 70, R = 60, T = 24, B = 54;
    if (!points.length) return '<div class="empty">' + I('chart') + '<h3>No results yet</h3><p>Your progress line starts after your first checked exam.</p></div>';
    const x = (i) => (points.length === 1 ? (L + W - R) / 2 : L + i * (W - L - R) / (points.length - 1));
    const y = (v) => T + (1 - v / 100) * (H - T - B);
    const grid = [0, 20, 40, 60, 80, 100].map((v) => '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#eef0f7"/><text x="' + (L - 10) + '" y="' + (y(v) + 4) + '" font-size="12" text-anchor="end" fill="#8a8fab">' + v + '</text>').join('');
    const line = points.map((p, i) => (i ? 'L' : 'M') + x(i) + ' ' + y(p.v)).join(' ');
    const area = points.length === 1 ? 'M' + (x(0) - 34) + ' ' + y(points[0].v) + ' h68 V' + y(0) + ' h-68 Z' : line + ' L' + x(points.length - 1) + ' ' + y(0) + ' L' + x(0) + ' ' + y(0) + ' Z';
    const dots = points.map((p, i) => '<circle class="pt-dot" style="animation-delay:' + (0.3 + i * 0.15) + 's" tabindex="0" cx="' + x(i) + '" cy="' + y(p.v) + '" r="8" fill="#4f46e5" stroke="#fff" stroke-width="3"><title>' + esc(p.label) + ': ' + p.v + '%</title></circle>' +
      '<rect x="' + (x(i) - 24) + '" y="' + (H - B + 10) + '" width="48" height="22" rx="6" fill="#1e1e5c"/><text x="' + x(i) + '" y="' + (H - B + 25) + '" font-size="12" font-weight="700" text-anchor="middle" fill="#fff">' + p.v + '%</text>' +
      '<text x="' + x(i) + '" y="' + (H - 6) + '" font-size="12" text-anchor="middle" fill="#3b3f5c">' + esc(p.short) + '</text>').join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Your scores: ' + points.map((p) => p.label + ' ' + p.v + ' percent').join(', ') + '. Target line at 80 percent."><defs><linearGradient id="ar" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#6366f1" stop-opacity=".28"/><stop offset="1" stop-color="#6366f1" stop-opacity="0"/></linearGradient></defs>' + grid +
      '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(80) + '" y2="' + y(80) + '" stroke="#b9bfd6" stroke-dasharray="6 6" stroke-width="2"/>' +
      (points.length === 1 ? '<rect class="area-in" x="' + (x(0) - 34) + '" y="' + y(points[0].v) + '" width="68" height="' + (y(0) - y(points[0].v)) + '" rx="14" fill="url(#ar)" stroke="#c7d2fe" stroke-width="2"/>' : '<path class="area-in" d="' + area + '" fill="url(#ar)"/>') + '<path class="line-draw" pathLength="1" d="' + line + '" fill="none" stroke="#4f46e5" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>' + dots + '</svg>';
  }
  function vProgress(p, q) {
    const all = published();
    const subj = q.subject || st().ui.progSubject || 'Math';
    const list = subj === 'All' ? all : all.filter((e) => e.subject === subj);
    const pts = list.map((e) => ({ v: e.published.pct, label: e.title, short: e.title.length > 14 ? e.title.slice(0, 13) + '…' : e.title }));
    const avg = pts.length ? (pts.reduce((a, b) => a + b.v, 0) / pts.length) : 0;
    const best = pts.reduce((m, x) => (x.v > (m ? m.v : -1) ? x : m), null);
    const trend = pts.length > 1 ? pts[pts.length - 1].v - pts[pts.length - 2].v : null;
    const bySubj = ['Math', 'Science', 'English'].map((s) => { const xs = all.filter((e) => e.subject === s); return [s, xs.length ? Math.round(xs.reduce((a, e) => a + e.published.pct, 0) / xs.length) : null]; });
    const overall = all.length ? Math.round(all.reduce((a, e) => a + e.published.pct, 0) / all.length) : 0;
    const pr = myPractice(), prDone = pr.filter((x) => x.completion[me().id]).length;
    return {
      title: 'My Progress',
      html: '<div class="row-between page-sub" style="flex-wrap:wrap"><span>See how your scores change from exam to exam.</span><label class="subject-select"><span class="small muted">Subject:</span><span class="sr-only">Choose subject</span><select class="select" data-input="prog-subject">' +
        [['Math', 'Math (Operations & Fractions)'], ['Science', 'Science (Ecosystems & Living Things)'], ['English', 'English (Writing & Comprehension)'], ['All', 'All Subjects (Cumulative)']].map(([k, l]) => '<option value="' + k + '" ' + (k === subj ? 'selected' : '') + '>' + l + '</option>').join('') + '</select></label></div>' +
        '<section class="chart-card"><div class="row-between mb-8"><span class="k">Score over exams — ' + esc(subj === 'All' ? 'all subjects' : subj) + '</span><span class="small row"><span class="dot dot-purple"></span>Score <span style="display:inline-block;width:18px;border-top:2px dashed #b9bfd6;margin-left:10px"></span>Target (80%)</span></div>' + lineChart(pts) +
        (pts.length === 1 ? '<div class="chart-note">' + I('info', 'icon-sm') + '<span>You have <b>one</b> checked ' + esc(subj) + ' exam so far. After your next one, your progress line will appear here! 📈</span></div>' : '') +
        '<p class="tiny muted mt-8">Each dot is one checked exam. Only grades your teacher confirmed are shown.</p></section>' +
        '<div class="stat-tiles"><div class="stat-tile" style="background:#f8f9fd;border-color:var(--border)"><div class="k muted">Average score</div><div class="v">' + (pts.length ? avg.toFixed(1) + '%' : '—') + '</div><div class="d muted">Across ' + U.plural(pts.length, 'exam') + '</div></div>' +
        '<div class="stat-tile" style="background:#effcf6;border-color:#bfeed8"><div class="k c-green">Highest result</div><div class="v c-green">' + (best ? best.v + '%' : '—') + '</div><div class="d c-green">' + (best ? esc(best.label) : 'No exams yet') + '</div></div>' +
        '<div class="stat-tile" style="background:#fffaea;border-color:#f6e2a3"><div class="k c-amber">Recent trend</div><div class="v c-amber">' + (trend === null ? '—' : (trend >= 0 ? '+' : '') + trend + '%') + '</div><div class="d c-amber">' + (trend === null ? 'Need 2 exams to compare' : trend >= 0 ? 'Going up! Keep it up 🚀' : 'A small dip — practice helps! 💪') + '</div></div></div>' +
        '<section class="garden mt-24" aria-labelledby="gd-h"><div class="row-between"><div><h3 id="gd-h">My Skill Garden 🌻</h3><p class="small muted">Every subject is a plant. Better scores make it grow taller!</p></div><span class="chip chip-green">💧 ' + prDone + ' practice' + (prDone === 1 ? '' : 's') + ' = water</span></div><div class="beds">' +
        bySubj.map(([sj, v]) => { const plant = v === null ? '🫘' : v >= 85 ? '🌳' : v >= 70 ? '🌿' : v >= 50 ? '🌱' : '🌰'; const stage = v === null ? 'Not planted yet' : v >= 85 ? 'Big tree!' : v >= 70 ? 'Growing well' : v >= 50 ? 'Little sprout' : 'Seed — keep practising'; return '<div class="bed"><span class="plant" style="--h:' + (v || 20) + '" aria-hidden="true">' + plant + '</span><div class="soil" aria-hidden="true"></div><b>' + SUBJ_EMOJI[sj] + ' ' + sj + '</b><span class="tiny muted">' + stage + (v === null ? '' : ' · ' + v + '%') + '</span></div>'; }).join('') + '</div></section>' +
        '<section class="card mt-24" style="background:linear-gradient(180deg,#f2f7ff,#fff);border-radius:24px"><div class="row-between"><div><h3>Overall Performance Summary <span class="chip chip-purple">Cumulative</span></h3><p class="small muted mt-8">All your checked results this year</p></div><div style="text-align:right"><b style="font-size:28px">' + overall + '%</b><div class="small c-green bold">' + stars(overall) + ' Overall</div></div></div>' +
        '<div class="grid grid-3 mt-16">' + bySubj.map(([s, v]) => '<div class="card card-tight"><div class="bar-label row-between"><b>' + SUBJ_EMOJI[s] + ' ' + s + '</b><b>' + (v === null ? '—' : v + '%') + '</b></div><div class="bar ' + (s === 'Math' ? 'blue' : s === 'English' ? 'indigo' : '') + ' mt-8"><span style="width:' + (v || 0) + '%"></span></div></div>').join('') + '</div>' +
        '<p class="small mt-16">' + I('practice', 'icon-xs') + ' Practice done: <b>' + prDone + ' of ' + pr.length + '</b> · ⭐ ' + me().stars + ' stars collected</p></section>'
    };
  }

  /* =========================================================
     PRACTICE
     ========================================================= */
  function vPractice(p, q) {
    const list = myPractice(), sid = me().id;
    const done = list.filter((x) => x.completion[sid]).length;
    const f = st().ui.sPracFilter || 'todo';
    const shown = list.filter((x) => (f === 'todo' ? !x.completion[sid] : f === 'done' ? !!x.completion[sid] : true));
    const cards = shown.map((x) => {
      const c = x.completion[sid], pr = x.progress[sid] || {};
      const steps3 = [pr.video, pr.worksheet, !!c].filter(Boolean).length;
      return '<article class="prac-card fade-up band-' + (x.gapId || 'g') + ' ' + (c ? 'done ' : '') + (q.focus === x.id ? 'highlight' : '') + '" id="pc-' + x.id + '"><div class="pc-band"><span class="emo" aria-hidden="true">' + x.emoji + '</span><span class="chip">' + x.minutes + ' MINS</span>' + (c ? '<span class="pc-done" aria-hidden="true">✓</span>' : '') + '</div>' +
        '<div class="pc-steps" aria-label="' + steps3 + ' of 3 activities done"><span class="' + (pr.video ? 'on' : '') + '">🎬 Video</span><span class="' + (pr.worksheet ? 'on' : '') + '">📄 Sheet</span><span class="' + (c ? 'on' : '') + '">🎯 Quiz</span></div>' +
        '<h3>' + esc(x.title) + '</h3><p>' + esc(x.desc) + '</p><div class="row row-wrap">' + (c ? '<span class="chip chip-green">✓ Done · ' + c.score + '/' + c.total + '</span>' : (pr.video || pr.worksheet ? '<span class="chip chip-blue">Started</span>' : '<span class="chip chip-purple">New</span>') + '<span class="chip ' + (U.isOverdue(x.due) ? 'chip-red' : 'chip-amber') + '">' + U.fmtDue(x.due) + '</span>') + '<span class="chip">🎯 ' + esc(GAPS[x.gapId] ? GAPS[x.gapId].short : x.topic) + '</span></div>' +
        '<p class="tiny">From ' + esc(teacher()) + '</p><button class="btn ' + (c ? '' : 'btn-primary') + '" type="button" data-action="open-practice" data-id="' + x.id + '">' + (c ? 'Play again' : 'Start Practice') + ' →</button></article>';
    }).join('');
    return {
      title: 'Practice',
      html: '<p class="page-sub">Fun practice picked by ' + esc(teacher()) + ' to help you grow.</p>' +
        '<section class="prac-hero"><img src="assets/logo.png" alt=""><div style="flex:1;min-width:220px"><span class="chip chip-blue">Picked for you</span><h2 class="mt-8">Let’s practise together!</h2><p class="muted">Each practice has a short video, a worksheet and a mini-quiz. The quiz earns you stars ⭐</p></div>' +
        '<div class="level-card" style="background:#fff"><div><div class="k c-purple">Practice done</div><div class="v">' + done + ' / ' + list.length + '</div></div></div></section>' +
        '<div class="seg mb-16" role="group" aria-label="Show practice">' + [['todo', 'To do (' + (list.length - done) + ')'], ['done', 'Done (' + done + ')'], ['all', 'All']].map(([k, l]) => '<button type="button" aria-pressed="' + (f === k) + '" data-action="sprac-filter" data-f="' + k + '">' + l + '</button>').join('') + '</div>' +
        (cards ? '<div class="prac-grid">' + cards + '</div>' : '<div class="empty">' + I('star') + '<h3>' + (f === 'todo' ? 'All done! 🎉' : 'Nothing here yet') + '</h3><p>' + (f === 'todo' ? 'You finished all your practice. Amazing!' : 'When ' + esc(teacher()) + ' gives you practice, it shows up here.') + '</p></div>') +
        (list.length ? '<div class="badge-bar"><span aria-hidden="true" style="font-size:26px">🏆</span><span>Finish all ' + list.length + ' practices to unlock the <b>“Practice Star”</b> badge!</span><div class="bar amber" role="progressbar" aria-label="Practice completed" aria-valuenow="' + done + '" aria-valuemin="0" aria-valuemax="' + list.length + '"><span style="width:' + (done / list.length * 100) + '%"></span></div><b class="c-amber">' + done + ' / ' + list.length + ' Complete</b></div>' : ''),
      after: () => { if (q.focus) { const el = document.getElementById('pc-' + q.focus); if (el) el.scrollIntoView({ block: 'center' }); else if (f !== 'all') { st().ui.sPracFilter = 'all'; save(); rer(); } } }
    };
  }

  function openPractice(id) {
    const p = st().practice.find((x) => x.id === id), sid = me().id;
    const pr = (p.progress[sid] = p.progress[sid] || {});
    const c = p.completion[sid];
    const row = (cls_, ico, bg, title, sub, btn, done) => '<div class="act-row ' + (done ? 'done' : '') + '"><span class="a-i" style="background:' + bg + '" aria-hidden="true">' + ico + '</span><div class="t"><b>' + title + (done ? ' ✓' : '') + '</b><span>' + sub + '</span></div>' + btn + '</div>';
    const m = U.modal({
      title: esc(p.title) + ' 🚀', sub: 'Choose your learning activity:', lead: '<img src="assets/logo.png" alt="" style="width:48px;height:48px;border-radius:12px;background:var(--surface);padding:3px">',
      body: row('', '🎬', 'var(--lavender-100)', 'Interactive Video Lesson (1 min)', 'Step-by-step animation for ' + esc(GAPS[p.gapId] ? GAPS[p.gapId].short.toLowerCase() : 'this topic'), '<button class="btn btn-indigo btn-sm" type="button" data-pa="video">' + I('play', 'icon-sm') + 'Watch Video</button>', pr.video) +
        row('', '📄', 'var(--green-50)', 'Printable Worksheet' + (p.worksheet ? ' (' + esc(p.worksheet.name) + ')' : ' (PDF)'), 'Open the practice sheet to solve on paper', '<button class="btn btn-success btn-sm" type="button" data-pa="sheet">' + I('file', 'icon-sm') + 'Open File</button>', pr.worksheet) +
        row('', '🎯', 'var(--amber-50)', 'Online Mini-Quiz (5 Questions)', c ? 'Your best: ' + c.score + '/' + c.total + ' — try to beat it!' : 'Instant checking + earn up to 15 bonus stars ⭐', '<button class="btn btn-amber btn-sm" type="button" data-pa="quiz">🎯 ' + (c ? 'Play again' : 'Start Quiz') + '</button>', !!c),
      foot: '<span class="tiny muted" style="margin-right:auto">Your teacher can see when you finish.</span><button class="btn btn-ghost" type="button" data-close>Done for Now</button>',
      onOpen: (dlg, api) => {
        dlg.querySelector('[data-pa="video"]').onclick = () => { api.close(); playVideo(p); };
        dlg.querySelector('[data-pa="sheet"]').onclick = () => { openSheet(p); api.close(); rer(); };
        dlg.querySelector('[data-pa="quiz"]').onclick = () => { api.close(); runQuiz(p); };
      }
    });
    return m;
  }
  function playVideo(p) {
    const slides = D.LESSONS[p.quiz] || D.LESSONS.general;
    let i = 0, playing = true, timer;
    const m = U.modal({
      title: '🎬 Video lesson', sub: esc(p.title), wide: true,
      body: '<div class="video-stage" aria-live="polite"><span class="step-n" id="v-n"></span><div class="slide" id="v-slide"></div></div><div class="vid-bar" aria-hidden="true"><span id="v-bar" style="width:0"></span></div>' +
        '<div class="row mt-16" style="justify-content:center"><button class="btn btn-sm" type="button" id="v-prev">' + I('chevLeft', 'icon-sm') + 'Back</button><button class="btn btn-primary btn-sm" type="button" id="v-play">Pause</button><button class="btn btn-sm" type="button" id="v-next">Next' + I('chevRight', 'icon-sm') + '</button></div>',
      foot: '<button class="btn btn-ghost" type="button" data-close>Close</button>',
      onClose: () => clearInterval(timer),
      onOpen: (dlg) => {
        const show = () => {
          dlg.querySelector('#v-slide').outerHTML = '<div class="slide" id="v-slide">' + esc(slides[i]) + '</div>';
          dlg.querySelector('#v-n').textContent = 'Step ' + (i + 1) + ' of ' + slides.length;
          dlg.querySelector('#v-bar').style.width = ((i + 1) / slides.length * 100) + '%';
          if (i === slides.length - 1) finish();
        };
        const finish = () => {
          const pr = (p.progress[me().id] = p.progress[me().id] || {});
          if (!pr.video) { pr.video = true; save(); U.toast('success', 'Video watched! 🎬', 'Next: try the mini-quiz to earn stars.'); }
          playing = false; clearInterval(timer); dlg.querySelector('#v-play').textContent = 'Replay';
        };
        const tick = () => { if (i < slides.length - 1) { i++; show(); } };
        timer = setInterval(() => { if (playing) tick(); }, 2600);
        dlg.querySelector('#v-next').onclick = () => { tick(); };
        dlg.querySelector('#v-prev').onclick = () => { if (i > 0) { i--; show(); } };
        dlg.querySelector('#v-play').onclick = (e) => {
          if (e.target.textContent === 'Replay') { i = 0; playing = true; show(); clearInterval(timer); timer = setInterval(() => { if (playing) tick(); }, 2600); e.target.textContent = 'Pause'; return; }
          playing = !playing; e.target.textContent = playing ? 'Pause' : 'Play';
        };
        show();
      }
    });
    return m;
  }
  function openSheet(p) {
    const pr = (p.progress[me().id] = p.progress[me().id] || {});
    if (p.worksheet && p.worksheet.dataUrl) {
      fetch(p.worksheet.dataUrl).then((r) => r.blob()).then((b) => { const u = URL.createObjectURL(b); const w = window.open(u, '_blank'); if (!w) U.toast('warning', 'Pop-up blocked', 'Allow pop-ups to open the worksheet.'); });
    } else {
      const qs = D.QUIZZES[p.quiz] || D.QUIZZES.general;
      U.openHTML('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>' + esc(p.title) + ' – Worksheet</title><style>body{font-family:Arial,sans-serif;max-width:720px;margin:40px auto;padding:0 20px;color:#17183b}h1{font-size:26px}ol li{margin:0 0 34px;font-size:18px}.line{border-bottom:2px solid #ccd;height:34px;margin-top:8px}.top{display:flex;justify-content:space-between;color:#646a88}button{padding:10px 18px;border-radius:999px;border:0;background:#1e1e5c;color:#fff;font-weight:700;cursor:pointer}@media print{button{display:none}}</style></head><body><div class="top"><span>PaperMind · ' + esc(teacher()) + '</span><span>Name: ' + esc(me().name) + '</span></div><h1>' + p.emoji + ' ' + esc(p.title) + '</h1><p>' + esc(p.desc) + '</p><ol>' + qs.map((x) => '<li>' + esc(x.q) + '<div class="line"></div></li>').join('') + '</ol><button onclick="window.print()">Print worksheet</button></body></html>');
    }
    if (!pr.worksheet) { pr.worksheet = true; save(); U.toast('success', 'Worksheet opened 📄', 'Solve it on paper, then try the mini-quiz!'); }
  }
  function runQuiz(p) {
    const qs = D.QUIZZES[p.quiz] || D.QUIZZES.general;
    let i = 0, score = 0, answered = false, finished = false;
    const marks = [];
    const m = U.modal({
      title: '🎯 Mini-Quiz', sub: esc(p.title), wide: true, sticky: true, body: '<div id="quiz"></div>', foot: '<button class="btn btn-ghost" type="button" id="q-stop">Stop quiz</button>',
      onOpen: (dlg, api) => {
        const box = dlg.querySelector('#quiz');
        const stopBtn = dlg.querySelector('#q-stop');
        stopBtn.onclick = async () => {
          if (finished) { api.close(); return; }
          if (await U.confirm({ title: 'Stop the quiz?', message: 'Your answers so far won’t be saved. You can start again any time.', confirmLabel: 'Stop quiz', cancelLabel: 'Keep playing' })) api.close();
        };
        const render = () => {
          if (i >= qs.length) return end();
          const q = qs[i];
          answered = false;
          box.innerHTML = '<div class="quiz-prog" aria-hidden="true"><span style="width:' + (i / qs.length * 100) + '%"></span><img src="assets/logo.png" alt="" style="left:calc(' + (i / qs.length * 100) + '% - 18px)"></div><div class="row-between"><span class="small bold muted">Question ' + (i + 1) + ' of ' + qs.length + '</span><div class="q-dots" aria-hidden="true">' + qs.map((_, k) => '<span class="' + (k < i ? (marks[k] ? 'ok' : 'no') : k === i ? 'now' : '') + '"></span>').join('') + '</div></div>' +
            '<p class="quiz-q" id="qq">' + esc(q.q) + '</p><div class="quiz-choices" role="group" aria-labelledby="qq">' + q.choices.map((c, k) => '<button type="button" class="quiz-choice" data-k="' + k + '"><span class="l">' + 'ABC'[k] + '</span>' + esc(c) + '</button>').join('') + '</div><div id="q-fb" aria-live="assertive"></div>';
          box.querySelectorAll('.quiz-choice').forEach((b) => b.onclick = () => pick(+b.dataset.k));
          box.querySelector('.quiz-choice').focus();
        };
        const pick = (k) => {
          if (answered) return; answered = true;
          const q = qs[i], ok = k === q.a; marks[i] = ok; if (ok) score++;
          box.querySelectorAll('.quiz-choice').forEach((b) => { b.disabled = true; const kk = +b.dataset.k; if (kk === q.a) b.classList.add('right'); else if (kk === k) b.classList.add('wrong'); });
          box.querySelector('#q-fb').innerHTML = '<div class="quiz-feedback ' + (ok ? 'ok' : 'no') + '">' + (ok ? '<span class="fb-emo">🎉</span> Yes! That’s right!' : '<span class="fb-emo">🤔</span> Not quite. The answer is “' + esc(q.choices[q.a]) + '”.') + '</div><div class="row mt-16" style="justify-content:flex-end"><button class="btn btn-primary" type="button" id="q-next">' + (i === qs.length - 1 ? 'See my score' : 'Next question') + ' →</button></div>';
          const nb = box.querySelector('#q-next'); nb.onclick = () => { i++; render(); }; nb.focus();
        };
        const end = () => {
          finished = true;
          const sid = me().id, prev = p.completion[sid];
          const first = !prev;
          const better = !prev || score > prev.score;
          let earned = 0;
          if (first) { earned = score * 3; me().stars += earned; }
          if (better) p.completion[sid] = { score, total: qs.length, at: Date.now() };
          if (first) {
            D.notify('teacher', { kind: 'practice', title: me().name + ' completed practice', body: p.title + ' — ' + score + '/' + qs.length + ' correct.', link: '#/practice' });
            D.log(p.classId, { kind: 'practice', title: 'Practice Completed', text: '<b>' + esc(me().name) + '</b> completed ' + esc(p.title) + ' with ' + score + '/' + qs.length + ' correct.', link: '#/practice', action: 'View Results' });
            const all = myPractice().every((x) => x.completion[sid]);
            if (all && !me().badges.includes('Practice Star 🏆')) me().badges.push('Practice Star 🏆');
          }
          save();
          box.innerHTML = '<div class="success"><div class="party" aria-hidden="true">' + (score >= 4 ? '🏆' : score >= 2 ? '🌟' : '💪') + '</div><h2>You got ' + score + ' out of ' + qs.length + '!</h2><p class="muted">' + (score >= 4 ? 'Super job!' : score >= 2 ? 'Nice work — practice makes progress!' : 'Good try! Watch the video and try again.') + '</p>' +
            (earned ? '<p class="mt-12"><span class="star-pill">+' + earned + ' stars ⭐</span></p>' : better ? '<p class="mt-12 small c-green bold">New best score!</p>' : '<p class="mt-12 small muted">Your best score stays ' + prev.score + '/' + prev.total + '.</p>') +
            '<p class="small muted mt-12">' + esc(teacher()) + ' can now see that you finished.</p><button class="btn btn-primary btn-lg mt-16" type="button" id="q-done">Done</button></div>';
          stopBtn.textContent = 'Close';
          box.querySelector('#q-done').onclick = () => api.close();
          box.querySelector('#q-done').focus();
          if (first) U.toast('success', 'Practice completed! ⭐', 'You earned ' + earned + ' stars.');
          if (score >= 3) U.confetti(110);
        };
        render();
      },
      onClose: () => { if (finished) rer(); }
    });
    return m;
  }

  /* =========================================================
     SUPPORT SESSIONS
     ========================================================= */
  function vSessions() {
    const sid = me().id, list = mySessions();
    const up_ = list.filter((x) => x.at > Date.now()), past = list.filter((x) => x.at <= Date.now());
    const card = (x) => {
      const going = x.registrations.includes(sid), left = x.capacity - x.registrations.length, full = left <= 0 && !going;
      const d = new Date(x.at);
      return '<article class="sess-card fade-up ' + (going ? 'going' : '') + '"><div class="cal" aria-hidden="true"><div class="m">' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()] + '</div><div class="d">' + d.getDate() + '</div></div>' +
        '<div><h3>' + esc(x.title) + '</h3><p class="small muted mt-8">🕒 ' + U.fmtWhen(x.at) + ' (' + x.duration + ' min) · 📍 ' + esc(x.location) + ' · with ' + esc(teacher()) + '</p>' +
        '<div class="why"><b>Why you are invited:</b> ' + esc(x.why) + '</div><div class="chairs" role="img" aria-label="' + x.registrations.length + ' of ' + x.capacity + ' seats taken">' + Array.from({ length: x.capacity }, (_, i) => '<span class="chair ' + (i < x.registrations.length ? 'taken' : '') + '">' + (i < x.registrations.length ? (going && i === x.registrations.indexOf(sid) ? me().avatar : '🙂') : '🪑') + '</span>').join('') + '</div><p class="small mt-8">' + (going ? '✅ You are registered! That’s your seat.' : full ? '😕 This session is full.' : left + ' of ' + x.capacity + ' seats left — save yours!') + '</p></div>' +
        '<div>' + (x.at <= Date.now() ? '<span class="chip">Finished</span>' : going ? '<button class="btn btn-outline" type="button" data-action="unregister" data-id="' + x.id + '">I can’t come anymore</button>' : '<button class="btn btn-primary btn-lg" type="button" data-action="register" data-id="' + x.id + '" ' + (full ? 'disabled' : '') + '>Yes, I’ll come! 🙋</button>') + '</div></article>';
    };
    return {
      title: 'Support Sessions',
      html: '<p class="page-sub">Small after-school help sessions with ' + esc(teacher()) + '. Learning together is fun!</p>' +
        (up_.length ? up_.map(card).join('') : '<div class="empty">' + I('calendar') + '<h3>No invitations right now</h3><p>If ' + esc(teacher()) + ' thinks a help session is good for you, it will show up here.</p></div>') +
        '<h3 class="mt-24 mb-16">What happens at a help session? 🤔</h3><div class="how-steps">' +
        [['👋', 'Say hello', 'Meet ' + teacher() + ' and a few classmates in a small group.'], ['🧩', 'Solve together', 'Try fun puzzles about the thing you are practising.'], ['💬', 'Ask anything', 'No question is silly. Everyone is learning!'], ['⭐', 'Earn stars', 'Go home a little smarter — and with stars!']].map(([e, t, d], i) => '<div class="how"><span class="how-n">' + (i + 1) + '</span><span class="how-e" aria-hidden="true">' + e + '</span><b>' + esc(t) + '</b><span>' + esc(d) + '</span></div>').join('') + '</div>' +
        (past.length ? '<h3 class="mt-24 mb-16">Earlier</h3>' + past.map(card).join('') : '')
    };
  }
  async function register(id) {
    const x = st().sessions.find((y) => y.id === id), sid = me().id;
    if (!x) { U.toast('error', 'Session not found', 'It may have been cancelled.'); rer(); return; }
    if (x.registrations.length >= x.capacity) { U.toast('error', 'Session is full', 'Ask ' + teacher() + ' about the next one.'); return; }
    const ok = await U.confirm({ title: 'Join “' + x.title + '”?', message: '🕒 ' + U.fmtWhen(x.at) + '<br>📍 ' + esc(x.location) + '<br><br>' + esc(teacher()) + ' will know you are coming.', html: true, confirmLabel: 'Yes, register me!' });
    if (!ok) return;
    x.registrations.push(sid);
    D.notify('teacher', { kind: 'session', title: me().name + ' registered', body: me().first + ' registered for “' + x.title + '” (' + x.registrations.length + '/' + x.capacity + ').', link: '#/sessions' });
    D.log(x.classId, { kind: 'session', title: 'Session Registration', text: '<b>' + esc(me().name) + '</b> registered for ' + esc(x.title) + '.', link: '#/sessions', action: 'View Session' });
    st().notifications.forEach((n) => { if (n.to === sid && n.sessionId === id) n.read = true; });
    save(); rer();
    U.toast('success', 'Support session registration successful! 🎉', 'See you ' + U.fmtWhen(x.at) + '.'); U.confetti(70);
  }

  /* =========================================================
     NOTIFICATIONS
     ========================================================= */
  const N_STYLE = { feedback: ['💬', '#ffe0e6'], upload: ['📄', '#dceaff'], practice: ['📘', '#dcf7ea'], reminder: ['⏰', '#fff1c7'], session: ['🧑‍🏫', '#ece9ff'], message: ['✉️', '#dceaff'] };
  function vNotifications(p, q) {
    const f = q.f || 'all';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const list = myNotes().filter((n) => (f === 'today' ? n.at >= today.getTime() : f === 'earlier' ? n.at < today.getTime() : true));
    const n = unread();
    const body = list.map((x) => {
      const [emo, bg] = N_STYLE[x.kind] || ['🔔', '#eef0f7'];
      let act = '';
      if (x.kind === 'feedback' && x.link) act = '<a class="link-btn" href="' + x.link + '" data-action="note-open" data-id="' + x.id + '">View Exam Result & Feedback →</a>';
      else if (x.kind === 'session' && x.sessionId) {
        const s = st().sessions.find((y) => y.id === x.sessionId);
        act = !s ? '<span class="small muted">This session was cancelled.</span>' : s.registrations.includes(me().id) ? '<span class="chip chip-green">✓ You are registered</span> <a class="link-btn small" href="#/sessions">See details</a>' : '<span class="small muted">📅 ' + U.fmtWhen(s.at) + ' · ' + esc(s.location) + '</span><button class="btn btn-primary btn-sm" type="button" data-action="register" data-id="' + s.id + '" style="margin-left:auto">Register Now →</button>';
      } else if ((x.kind === 'practice' || x.kind === 'reminder') && x.link) act = '<a class="link-btn" href="' + x.link + '" data-action="note-open" data-id="' + x.id + '">Open my practice →</a>';
      else if (x.kind === 'upload') act = '<a class="link-btn" href="#/exams?tab=review" data-action="note-open" data-id="' + x.id + '">See My Exams →</a>';
      return '<article class="note ' + (x.read ? '' : 'unread ') + 'k-' + x.kind + '"><span class="n-i" style="background:' + bg + '" aria-hidden="true">' + emo + '</span><div class="n-b"><div class="row-between" style="align-items:flex-start"><h3>' + esc(x.title) + (x.read ? ' <span class="read-tag">Read</span>' : ' <span class="udot" aria-hidden="true"></span><span class="sr-only">(new)</span>') + '</h3><time datetime="' + new Date(x.at).toISOString() + '">' + U.timeAgo(x.at) + '</time></div>' +
        '<p>' + esc(x.body) + '</p><div class="acts">' + act + (x.read ? '' : '<button class="btn btn-ghost btn-xs" type="button" data-action="note-read" data-id="' + x.id + '">Mark as read</button>') + '</div></div></article>';
    }).join('');
    return {
      title: 'Notifications',
      html: '<div class="row-between page-sub" style="flex-wrap:wrap"><span>Updates on your exams, grades, practice and teacher notes. ' + (n ? '<span class="new-pill">' + n + ' New</span>' : '') + '</span>' +
        '<div class="row row-wrap"><div class="seg" role="group" aria-label="Show">' + [['all', 'All'], ['today', 'Today'], ['earlier', 'Earlier']].map(([k, l]) => '<button type="button" aria-pressed="' + (f === k) + '" data-action="note-filter" data-f="' + k + '">' + l + '</button>').join('') + '</div>' +
        '<button class="btn btn-ghost btn-sm" type="button" data-action="note-read-all" ' + (n ? '' : 'disabled') + '>Mark all as read</button></div></div>' +
        (body || '<div class="empty">' + I('bell') + '<h3>No notifications here</h3><p>' + (f === 'today' ? 'Nothing new today.' : 'You are all caught up!') + '</p></div>')
    };
  }

  /* =========================================================
     PROFILE
     ========================================================= */
  function openProfile() {
    const s = me();
    let editing = false, pickEmoji = s.avatar;
    const EMO = ['👧', '👦', '🧒', '🦊', '🐼', '🦄', '🚀', '🌟'];
    const view = () => '<div class="prof-hero"><span class="avatar emoji avatar-xl" aria-hidden="true">' + esc(s.avatar || '🙂') + '</span><div class="ph-txt"><b>' + esc(s.name) + (s.nickname ? ' <span class="nick">“' + esc(s.nickname) + '”</span>' : '') + '</b><div class="row row-wrap mt-8"><span class="chip chip-purple">ID: #' + esc(s.no) + '</span><span class="chip chip-amber">⭐ ' + s.stars + ' stars</span><span class="chip chip-green">🧠 Level ' + s.level + '</span></div></div></div>' +
      [['Full Name', esc(s.name)], ['Nickname', esc(s.nickname || '—')], ['Grade & Class', 'Grade ' + s.classId[0] + ' (Class ' + s.classId[0] + '-' + s.classId.slice(1) + ')'], ['School', esc(st().teacher.school)], ['Teacher', esc(teacher())], ['Guardian / Parent', esc(s.guardian.name) + '<div class="tiny muted">' + esc(s.guardian.email) + '</div>']].map(([k, v]) => '<div class="prof-row"><span>' + k + '</span><b>' + v + '</b></div>').join('') +
      '<p class="bold mt-16 mb-8">Badges Earned</p><div class="row row-wrap">' + (s.badges.length ? s.badges.map((b, i) => '<span class="chip ' + ['chip-amber', 'chip-purple', 'chip-green'][i % 3] + '" style="font-size:13px">' + esc(b) + '</span>').join('') : '<span class="small muted">Finish practice to earn your first badge!</span>') + '</div>';
    const edit = () => '<div class="field"><span class="label" id="emo-l">Pick your picture</span><div class="emoji-pick" role="group" aria-labelledby="emo-l">' + EMO.map((e) => '<button type="button" data-emo="' + e + '" aria-pressed="' + (e === pickEmoji) + '" aria-label="Picture ' + e + '">' + e + '</button>').join('') + '</div></div>' +
      '<div class="field"><label for="sp-nick">What should we call you? (optional)</label><input class="input" id="sp-nick" maxlength="20" value="' + esc(s.nickname || '') + '" placeholder="' + esc(s.first) + '"><span class="hint">Your teacher still sees your full name.</span></div>' +
      '<p class="tiny muted">To change your name, class or parent details, ask ' + esc(teacher()) + '.</p>';
    U.modal({
      title: 'My Profile', cls: 'modal-profile kid', body: '<div id="sp-body">' + view() + '</div>',
      foot: '<button class="btn" type="button" id="sp-edit">' + I('edit', 'icon-sm') + 'Edit Profile</button><button class="btn btn-primary" type="button" id="sp-close" data-close>Close</button>',
      onOpen: (dlg, api) => {
        const body = dlg.querySelector('#sp-body'), eb = dlg.querySelector('#sp-edit'), cb = dlg.querySelector('#sp-close');
        const bindEmo = () => body.querySelectorAll('[data-emo]').forEach((b) => b.onclick = () => { pickEmoji = b.dataset.emo; body.querySelectorAll('[data-emo]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); });
        eb.onclick = () => {
          if (!editing) { editing = true; body.innerHTML = edit(); bindEmo(); eb.innerHTML = 'Cancel'; cb.textContent = 'Save'; cb.removeAttribute('data-close'); body.querySelector('[data-emo]').focus(); return; }
          editing = false; body.innerHTML = view(); eb.innerHTML = I('edit', 'icon-sm') + 'Edit Profile'; cb.textContent = 'Close'; cb.setAttribute('data-close', '');
        };
        cb.onclick = (ev) => {
          if (!editing) return;
          ev.stopPropagation();
          const nick = body.querySelector('#sp-nick').value.trim();
          if (nick && !/^[\p{L}\p{N} .'-]{1,20}$/u.test(nick)) { U.setError(body.querySelector('#sp-nick'), 'Please use only letters and numbers.'); return; }
          s.avatar = pickEmoji; s.nickname = nick; save(); api.close(); rer();
          U.toast('success', 'Profile updated', 'Looking good, ' + callMe() + '! ' + s.avatar);
        };
      }
    });
  }

  /* =========================================================
     ACTIONS / INPUTS / FORMS
     ========================================================= */
  const actions = {
    'open-profile': openProfile,
    'next-tip': (el) => { tipIdx++; const t = document.getElementById('tip-text'); t.textContent = TIPS[tipIdx % TIPS.length]; t.classList.remove('pop'); void t.offsetWidth; t.classList.add('pop'); el.classList.remove('hop'); void el.offsetWidth; el.classList.add('hop'); },
    'use-sample': () => {
      up.file = { name: 'sample-exam.svg', type: 'image/svg+xml', isPdf: false, preview: 'assets/illustrations/sample-exam.svg', dataUrl: 'assets/illustrations/sample-exam.svg', sizeLabel: 'Sample paper' };
      up.form = null; up.step = 2; rer(); U.toast('info', 'Sample paper added', 'Now choose the subject and exam name.');
    },
    'change-file': () => { up.file = null; up.form = null; up.step = 1; rer(); },
    'up-goto': (el) => {
      const k = +el.dataset.s;
      if (up.step === 3) { up.file = null; up.form = null; up.lastId = null; up.step = 1; rer(); return; }
      if (up.step === 2) { const f = document.querySelector('form[data-form="upload"]'); if (f) { up.form = { title: f.title.value, other: f.other.value, check: f.check.checked }; up.file.subject = f.subject.value; } }
      if (k === 2 && !up.file) { U.toast('warning', 'Choose your paper first', 'Pick a photo or PDF, then you can go to step 2.'); return; }
      up.step = k; rer();
    },
    'upload-again': () => { up.file = null; up.form = null; up.step = 1; up.lastId = null; rer(); },
    'exam-tab': (el) => go('#/exams' + (el.dataset.t === 'review' ? '?tab=review' : '')),
    'exam-subj': (el) => go('#/exams' + (el.dataset.s === 'All' ? '' : '?subject=' + el.dataset.s)),
    'open-practice': (el) => openPractice(el.dataset.id),
    'sprac-filter': (el) => { st().ui.sPracFilter = el.dataset.f; save(); go('#/practice'); },
    register: (el) => register(el.dataset.id),
    unregister: async (el) => {
      const x = st().sessions.find((y) => y.id === el.dataset.id);
      if (!(await U.confirm({ title: 'Cancel your seat?', message: 'You will be taken off the list for “' + x.title + '”. ' + teacher() + ' will be told.', confirmLabel: 'Yes, cancel my seat', cancelLabel: 'Keep my seat', danger: true }))) return;
      x.registrations = x.registrations.filter((s) => s !== me().id);
      D.notify('teacher', { kind: 'session', title: me().name + ' cancelled', body: me().first + ' can no longer come to “' + x.title + '”.', link: '#/sessions' });
      save(); rer(); U.toast('info', 'Your seat was cancelled', 'You can register again while seats are left.');
    },
    'note-filter': (el) => go('#/notifications' + (el.dataset.f === 'all' ? '' : '?f=' + el.dataset.f)),
    'note-read': (el) => { const n = st().notifications.find((x) => x.id === el.dataset.id); if (n) { n.read = true; save(); rer(); } },
    'note-open': (el) => { const n = st().notifications.find((x) => x.id === el.dataset.id); if (n) { n.read = true; save(); } go(el.getAttribute('href')); },
    'note-read-all': () => { myNotes().forEach((n) => { n.read = true; }); save(); rer(); U.toast('success', 'All marked as read'); }
  };
  const inputs = {
    'file-in': (el, e) => { if (e.type !== 'change') return; const f = el.files[0]; if (f) takeFile(f); el.value = ''; },
    'u-subject': (el) => {
      if (up.form) up.form.title = '';
      if (up.file) up.file.subject = el.value;
      const t = document.getElementById('u-title');
      t.innerHTML = EXAM_NAMES[el.value].map((n) => '<option>' + n + '</option>').join('') + '<option value="__other">Something else…</option>';
      document.getElementById('u-other-wrap').hidden = true;
    },
    'prog-subject': (el) => { st().ui.progSubject = el.value; save(); go('#/progress?subject=' + el.value); }
  };
  document.addEventListener('change', (e) => { if (e.target.id === 'u-title') { const w = document.getElementById('u-other-wrap'); w.hidden = e.target.value !== '__other'; if (!w.hidden) document.getElementById('u-other').focus(); } });

  // leaving the upload page after a successful send starts the next visit fresh
  window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#/upload') && up.step === 3) { up.step = 1; up.lastId = null; } });

  const BANK_FOR = { Math: 'mathUpload', Science: 'science', English: 'english' };
  const forms = {
    upload: (f) => {
      U.clearErrors(f);
      if (!up.file) { U.toast('error', 'Choose your paper first'); up.step = 1; rer(); return; }
      let title = f.title.value;
      if (title === '__other') { title = f.other.value.trim(); if (!title) { U.setError(f.other, 'Please type the name of your exam.'); f.other.focus(); return; } }
      if (!f.check.checked) { U.toast('warning', 'One more check!', 'Look at your photo: can you see the whole page? Then tick the box.'); f.check.focus(); return; }
      const subject = f.subject.value;
      const e = D.makeExam(BANK_FOR[subject], { studentId: me().id, classId: me().classId, title, uploadedAt: Date.now(), pages: 1, file: { name: up.file.name, type: up.file.type, dataUrl: up.file.dataUrl } });
      st().exams.push(e);
      D.notify(me().id, { kind: 'upload', title: 'Upload received: ' + title, body: 'Your paper was uploaded. ' + teacher() + ' will check it soon.', link: '#/exams?tab=review', read: true });
      D.notify('teacher', { kind: 'upload', title: 'New exam from ' + me().name, body: title + ' is waiting for OCR verification.', link: '#/grading/' + e.id });
      D.log(me().classId, { kind: 'upload', title: 'New Exam Uploaded', text: '<b>' + esc(me().name) + '</b> uploaded ' + esc(title) + ' (1 page) · waiting for OCR check.', link: '#/grading/' + e.id, action: 'Review OCR Scan' });
      if (!save()) {
        // storage full: retry without the picture
        e.file.dataUrl = null; if (!save()) { st().exams.pop(); return; }
        U.toast('warning', 'Saved without the picture', 'Your paper was sent, but the photo was too big to keep a copy here.');
      }
      up.step = 3; up.lastId = e.id; up.file = null; up.form = null; rer(); U.confetti(90);
      U.toast('success', 'Exam successfully uploaded! 🎉', title + ' was sent to ' + teacher() + '.');
    }
  };

  const HELP = {
    home: '<ul><li><b>Upload Exam</b> – send a photo of your test.</li><li><b>My Results</b> – see grades your teacher checked.</li><li><b>Your Next Steps</b> – what to do next, in order.</li></ul>',
    upload: '<ul><li>Put your paper on a table with good light.</li><li>Take a photo of the <b>whole</b> page.</li><li>Choose the subject and the exam name, then press <b>Send</b>.</li><li>Photos (JPG, PNG) or PDF, up to 10 MB.</li></ul>',
    exams: '<ul><li><b>Completed</b> – your teacher checked it. Tap to see your grade and feedback.</li><li><b>Under Review</b> – your teacher is still checking. No grade yet!</li></ul>',
    results: '<ul><li><b>Feedback</b> – a message from your teacher.</li><li><b>Weaknesses</b> – things to practise next.</li><li><b>Red Flag</b> – something your teacher will help you with.</li></ul>',
    progress: '<ul><li>Each dot is one exam.</li><li>The dashed line is the 80% goal.</li><li>Change the subject with the menu at the top.</li></ul>',
    practice: '<ul><li>Watch the video first.</li><li>Open the worksheet to practise on paper.</li><li>Do the mini-quiz to earn stars ⭐ — your teacher sees when you finish.</li></ul>',
    sessions: '<ul><li>Your teacher may invite you to a small help group.</li><li>Press <b>Yes, I’ll come!</b> to save your seat.</li></ul>',
    notifications: '<ul><li>New messages have a red dot.</li><li>Tap a message’s link to go to it.</li><li><b>Mark all as read</b> clears the red dots.</li></ul>'
  };

  PM.shell.start({
    roleLabel: 'Student Portal',
    defaultRoute: 'home',
    nav: () => [
      { route: 'home', label: 'Home', icon: 'home' },
      { route: 'upload', label: 'Upload Exam', icon: 'upload' },
      { route: 'exams', label: 'My Exams', icon: 'file', match: ['exams', 'results'] },
      { route: 'progress', label: 'Progress', icon: 'trending' },
      { route: 'practice', label: 'Practice', icon: 'star' },
      { route: 'sessions', label: 'Support Sessions', icon: 'users' },
      { route: 'notifications', label: 'Notifications', icon: 'bell', badge: unread }
    ],
    profile: () => ({ name: me().name, sub: 'Grade ' + me().classId[0] + ' • Student', avatar: avatar() }),
    routes: { home: vHome, upload: vUpload, exams: vExams, results: vResults, progress: vProgress, practice: vPractice, sessions: vSessions, notifications: vNotifications },
    topbar, actions, inputs, forms,
    help: (r) => (HELP[r] || HELP.home) + '<h3>Need more help?</h3><ul><li>Ask ' + esc(teacher()) + ' in class.</li><li>Press <kbd>Esc</kbd> to close a window.</li></ul>'
  });
})();