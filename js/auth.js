/* =========================================================
   PaperMind — mock authentication (frontend only, localStorage)
   ========================================================= */
(function () {
  'use strict';
  const PM = (window.PM = window.PM || {});
  const SESSION_KEY = 'papermind.session';

  const auth = {
    current() {
      try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; }
    },
    login(role, id, secret) {
      const st = PM.data.state;
      id = String(id || '').trim().toLowerCase();
      if (role === 'teacher') {
        const t = st.teacher;
        if (id !== t.email.toLowerCase()) return { ok: false, field: 'id', error: 'We couldn’t find a teacher account with that email.' };
        if (secret !== t.password) return { ok: false, field: 'secret', error: 'That password is not correct. Check Caps Lock and try again.' };
        this._set({ role: 'teacher', userId: t.id });
        return { ok: true, redirect: 'teacher.html' };
      }
      const s = st.students.find((x) => x.username === id || x.no.toLowerCase() === id || ('#' + x.no.toLowerCase()) === id);
      if (!s) return { ok: false, field: 'id', error: 'Hmm, we can’t find that name. It looks like firstname.lastname — e.g. salma.ahmed' };
      if (String(secret).trim() !== s.pin) return { ok: false, field: 'secret', error: 'Oops! That PIN is not right. Try again — it has 4 numbers.' };
      this._set({ role: 'student', userId: s.id });
      return { ok: true, redirect: 'student.html' };
    },
    _set(sess) { sess.at = Date.now(); localStorage.setItem(SESSION_KEY, JSON.stringify(sess)); },
    logout() { localStorage.removeItem(SESSION_KEY); sessionStorage.setItem('papermind.loggedOut', '1'); location.href = 'index.html'; },
    guard(role) {
      const s = this.current();
      if (!s || s.role !== role) { location.replace('index.html'); return null; }
      return s;
    }
  };
  PM.auth = auth;

  /* ---------------- Login page ---------------- */
  function initLogin() {
    PM.data.load();
    const ui = PM.ui;
    const sess = auth.current();
    if (sess && sess.role) { location.replace(sess.role === 'teacher' ? 'teacher.html' : 'student.html'); return; }

    const form = document.getElementById('login-form');
    const idInput = document.getElementById('login-id');
    const secret = document.getElementById('login-secret');
    const alertBox = document.getElementById('login-alert');
    let role = new URLSearchParams(location.search).get('role') === 'teacher' ? 'teacher' : 'student';

    const COPY = {
      student: { idLabel: 'Student Username / ID', idPh: 'e.g. salma.ahmed', idType: 'text', idAuto: 'username', secLabel: 'Student PIN', secPh: '4-number PIN', secMode: 'numeric', btn: 'Log In to PaperMind 🚀',
        heroTitle: 'Learn, Track, Shine! ⭐', heroText: 'Grades 1–5 Learning Companion. Discover your strengths and unlock badges!', lead: 'Enter your username and PIN to open your portal.' },
      teacher: { idLabel: 'School Email', idPh: 'name@papermind.school', idType: 'email', idAuto: 'email', secLabel: 'Password', secPh: 'Your password', secMode: 'text', btn: 'Sign In to Teacher Portal',
        heroTitle: 'Grade smarter, stay in control.', heroText: 'Verify scans, review AI suggestions and give every child the feedback they need. You make the final decision.', lead: 'Sign in with your school account to review exams.' }
    };

    function applyRole() {
      const c = COPY[role];
      document.querySelectorAll('.role-option').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.role === role)));
      document.getElementById('id-label').textContent = c.idLabel;
      document.getElementById('secret-label').textContent = c.secLabel;
      idInput.placeholder = c.idPh; idInput.type = c.idType; idInput.autocomplete = c.idAuto;
      secret.placeholder = c.secPh; secret.inputMode = c.secMode;
      secret.maxLength = role === 'student' ? 4 : 64;
      document.getElementById('login-submit').textContent = c.btn;
      document.getElementById('hero-title').textContent = c.heroTitle;
      document.getElementById('hero-text').textContent = c.heroText;
      document.getElementById('hero-role').textContent = role === 'teacher' ? 'Teacher Portal' : 'Student Portal';
      document.getElementById('login-lead').textContent = c.lead;
      document.body.dataset.role = role;
      ui.clearErrors(form); alertBox.hidden = true;
    }
    document.querySelectorAll('.role-option').forEach((b) => {
      b.addEventListener('click', () => { role = b.dataset.role; applyRole(); idInput.value = ''; secret.value = ''; idInput.focus(); });
      b.addEventListener('keydown', (e) => {
        if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
          e.preventDefault(); role = role === 'student' ? 'teacher' : 'student'; applyRole();
          document.querySelector('.role-option[data-role="' + role + '"]').focus();
        }
      });
    });
    document.getElementById('pw-toggle').addEventListener('click', (e) => {
      const show = secret.type === 'password';
      secret.type = show ? 'text' : 'password';
      e.currentTarget.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      e.currentTarget.setAttribute('aria-pressed', String(show));
      e.currentTarget.innerHTML = ui.icon(show ? 'eyeOff' : 'eye');
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      ui.clearErrors(form); alertBox.hidden = true;
      let bad = false;
      if (!idInput.value.trim()) { ui.setError(idInput, role === 'teacher' ? 'Please enter your school email.' : 'Please type your username.'); bad = true; }
      else if (role === 'teacher' && !/^\S+@\S+\.\S+$/.test(idInput.value.trim())) { ui.setError(idInput, 'That doesn’t look like an email address (name@school…).'); bad = true; }
      if (!secret.value) { ui.setError(secret, role === 'teacher' ? 'Please enter your password.' : 'Please type your 4-number PIN.'); bad = true; }
      else if (role === 'student' && !/^\d{4}$/.test(secret.value.trim())) { ui.setError(secret, 'Your PIN has exactly 4 numbers.'); bad = true; }
      if (bad) { form.querySelector('[aria-invalid="true"]').focus(); return; }
      const res = auth.login(role, idInput.value, secret.value);
      if (!res.ok) {
        const target = res.field === 'id' ? idInput : secret;
        ui.setError(target, res.error); target.focus();
        return;
      }
      const btn = document.getElementById('login-submit');
      btn.disabled = true; btn.textContent = 'Opening your portal…';
      location.href = res.redirect;
    });
    document.querySelectorAll('[data-fill]').forEach((b) => b.addEventListener('click', () => {
      const [r, a, p] = b.dataset.fill.split('|');
      role = r; applyRole(); idInput.value = a; secret.value = p; document.getElementById('login-submit').focus();
    }));
    document.getElementById('reset-data').addEventListener('click', async () => {
      const ok = await ui.confirm({ title: 'Restore the sample class?', message: 'This puts all exams, grades, practice and messages back to how they were at the start. Anything you changed in this browser will be removed.', confirmLabel: 'Restore', danger: true, icon: 'refresh' });
      if (ok) { PM.data.reset(); ui.toast('success', 'Sample class restored', 'Everything is back to the starting point.'); }
    });
    if (sessionStorage.getItem('papermind.loggedOut')) {
      sessionStorage.removeItem('papermind.loggedOut');
      ui.toast('info', 'You have been logged out', 'See you next time!');
    }
    applyRole();
  }

  if (document.body && document.body.dataset.page === 'login') initLogin();
  else document.addEventListener('DOMContentLoaded', () => { if (document.body.dataset.page === 'login') initLogin(); });
})();
