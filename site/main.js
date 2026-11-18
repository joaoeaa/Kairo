(() => {
  'use strict';

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 899px)');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) => t * t * (3 - 2 * t);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  /* Cabeçalho: linha ao rolar e seção atual */
  const nav = document.querySelector('[data-nav]');
  const navLinks = [...document.querySelectorAll('.nav__links a')];
  const navTargets = navLinks.map((a) => document.querySelector(a.getAttribute('href')));

  /* Jornada */
  const stage = document.querySelector('[data-stage]');
  const steps = [...document.querySelectorAll('.step')];
  const values = steps.map((s) => Number(s.dataset.value));
  const periods = steps.map((s) => Number(s.dataset.period));
  const fill = document.querySelector('[data-ring-fill]');
  const ringSvg = fill && fill.closest('svg');
  const pctEl = document.querySelector('[data-pct]');
  const periodEl = document.querySelector('[data-period]');
  const rail = [...document.querySelectorAll('[data-rail] li')];
  const screens = [...document.querySelectorAll('[data-screen]')];
  const screensBox = document.querySelector('.stage__screens');

  /* No celular as telas rolam por dentro; o esmaecido embaixo indica que há mais conteúdo */
  function updateMore() {
    if (!screensBox) return;
    const more = screensBox.scrollHeight - screensBox.clientHeight - screensBox.scrollTop > 4;
    screensBox.classList.toggle('has-more', more);
  }
  if (screensBox) {
    screensBox.addEventListener('scroll', updateMore, { passive: true });
    addEventListener('resize', updateMore);
    addEventListener('load', updateMore);
  }

  let target = 0;
  let shown = 0;
  let active = -1;
  let period = 0;
  let raf = 0;

  function setActive(i) {
    if (i === active) return;
    active = i;
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    screens.forEach((s, k) => s.classList.toggle('is-active', k === Math.max(0, i)));
    if (screensBox) { screensBox.scrollTop = 0; requestAnimationFrame(updateMore); }
  }

  function setPeriod(p) {
    if (p === period) return;
    period = p;
    periodEl.textContent = p + 'º período';
    rail.forEach((li, k) => li.classList.toggle('is-on', k < p));
  }

  function readStory() {
    const vh = innerHeight;
    let trigger = vh * 0.5;
    if (narrow.matches) {
      const sb = stage.getBoundingClientRect().bottom;
      trigger = sb + (vh - sb) * 0.28;
    }
    const start = vh;
    let idx = -1;
    let t = 0;
    for (let i = 0; i < steps.length; i++) {
      const top = steps[i].firstElementChild.getBoundingClientRect().top;
      if (top < start) {
        idx = i;
        t = clamp((start - top) / (start - trigger));
      }
    }
    if (idx < 0) {
      target = 0;
      setActive(-1);
      setPeriod(1);
      return;
    }
    const prev = idx > 0 ? values[idx - 1] : 0;
    const a = t >= 0.5 ? idx : Math.max(0, idx - 1);
    target = reduced.matches ? (idx === 0 && t < 0.5 ? 0 : values[a]) : lerp(prev, values[idx], easeInOut(t));
    setActive(a);
    setPeriod(periods[a]);
  }

  function paintRing() {
    const v = Math.round(shown * 10) / 10;
    fill.style.strokeDashoffset = String(100 - v);
    pctEl.textContent = Math.round(shown) + '%';
    const done = shown >= 99.5;
    if (done !== ringSvg.classList.contains('is-complete')) ringSvg.classList.toggle('is-complete', done);
  }

  /* Painel da turma: a câmera recua do anel da Lívia para a turma inteira */
  const turma = document.querySelector('[data-turma]');
  const grid = document.querySelector('[data-grid]');
  const ME = 27; // posição da Lívia na grade (linha 4, coluna 4)
  // 48 alunos: 26 prontos (>= 75), 14 em preparação (45 a 74), 8 em atenção (< 45)
  const turmaValues = [
    88, 62, 79, 41, 93, 76, 58, 84,
    71, 90, 36, 82, 66, 95, 78, 49,
    80, 55, 87, 92, 29, 74, 83, 61,
    77, 44, 68, 100, 86, 52, 91, 39,
    85, 97, 63, 75, 33, 81, 70, 89,
    57, 79, 94, 42, 76, 65, 27, 87
  ];

  function buildGrid() {
    if (!grid) return;
    const ns = 'http://www.w3.org/2000/svg';
    const d = 'M22.95 -7.02A24 24 0 1 1 7.02 -22.95';
    const frag = document.createDocumentFragment();
    turmaValues.forEach((v, i) => {
      const cell = document.createElement('div');
      const kind = v >= 75 ? 'ready' : v >= 45 ? 'prep' : 'alert';
      cell.className = 'cell cell--' + kind + (i === ME ? ' cell--me' : '');
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '-29 -29 58 58');
      const t = document.createElementNS(ns, 'path');
      t.setAttribute('d', d); t.setAttribute('pathLength', '100'); t.setAttribute('class', 't');
      const f = document.createElementNS(ns, 'path');
      f.setAttribute('d', d); f.setAttribute('pathLength', '100'); f.setAttribute('class', 'f');
      f.style.strokeDashoffset = String(100 - v);
      svg.append(t, f);
      if (i === ME) {
        const dot = document.createElementNS(ns, 'circle');
        dot.setAttribute('cx', '16.97'); dot.setAttribute('cy', '-16.97'); dot.setAttribute('r', '7'); dot.setAttribute('class', 'd');
        svg.append(dot);
      }
      cell.append(svg);
      if (i === ME) {
        const name = document.createElement('span');
        name.className = 'cell__name';
        name.textContent = 'Lívia';
        cell.append(name);
      }
      frag.append(cell);
    });
    grid.append(frag);
  }

  let zoomFrom = 4;
  function measureGrid() {
    if (!grid) return;
    const me = grid.children[ME];
    if (!me) return;
    grid.style.transform = 'none';
    const g = grid.getBoundingClientRect();
    const m = me.getBoundingClientRect();
    const ox = m.left - g.left + m.width / 2;
    const oy = m.top - g.top + m.height / 2;
    grid.style.setProperty('--ox', ox + 'px');
    grid.style.setProperty('--oy', oy + 'px');
    // a Lívia começa do tamanho aproximado do anel da jornada
    zoomFrom = clamp((narrow.matches ? 120 : 220) / m.width, 2.2, 6);
    readTurma(true);
  }

  let lastZoom = -1;
  function readTurma(force) {
    if (!turma || !grid) return;
    const r = turma.getBoundingClientRect();
    const span = r.height - innerHeight;
    const p = clamp(-r.top / span);
    const z = reduced.matches ? 1 : lerp(zoomFrom, 1, easeInOut(clamp(p / 0.62)));
    const others = reduced.matches ? 1 : easeOut(clamp((p - 0.12) / 0.5));
    if (!force && Math.abs(z - lastZoom) < 0.0005 && grid.style.getPropertyValue('--others') === others.toFixed(3)) return;
    lastZoom = z;
    grid.style.transform = 'scale(' + z.toFixed(4) + ')';
    grid.style.setProperty('--others', others.toFixed(3));
  }

  /* Parcerias: a linha do fluxo acompanha a leitura */
  const flow = document.querySelector('[data-flow]');
  function readFlow() {
    if (!flow) return;
    if (reduced.matches) { flow.style.setProperty('--flow', '1'); return; }
    const r = flow.getBoundingClientRect();
    const vh = innerHeight;
    const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35));
    flow.style.setProperty('--flow', p.toFixed(3));
  }

  function readNav() {
    nav.classList.toggle('is-scrolled', scrollY > 8);
    const mid = innerHeight * 0.4;
    let cur = -1;
    navTargets.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) cur = i;
    });
    // gargalos e resultados pertencem ao painel da faculdade
    if (cur === -1) {
      const g = document.getElementById('gargalos').getBoundingClientRect();
      const res = document.getElementById('resultados').getBoundingClientRect();
      if ((g.top <= mid && g.bottom > mid) || (res.top <= mid && res.bottom > mid)) cur = 1;
    }
    navLinks.forEach((a, i) => (i === cur ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
  }

  function frame() {
    raf = 0;
    readNav();
    if (stage) {
      readStory();
      const diff = target - shown;
      if (reduced.matches || Math.abs(diff) < 0.05) shown = target;
      else shown += diff * 0.14;
      paintRing();
      if (shown !== target) raf = requestAnimationFrame(frame);
    }
    readTurma(false);
    readFlow();
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(frame); };

  buildGrid();
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', () => { measureGrid(); schedule(); });
  narrow.addEventListener('change', () => { measureGrid(); schedule(); });
  reduced.addEventListener('change', schedule);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measureGrid(); schedule(); });
  measureGrid();
  frame();

  /* Métricas (Umami). Se o script for bloqueado, nada quebra. */
  const track = (name, data) => {
    try { if (window.umami) window.umami.track(name, data); } catch (_) {}
  };

  /* Formulário de interesse (Netlify Forms) */
  const form = document.querySelector('[data-form]');
  if (form) {
    const status = form.querySelector('[data-status]');
    const button = form.querySelector('button[type="submit"]');
    const fields = [...form.querySelectorAll('.field')];

    /* Funil: viu o formulário -> começou a preencher -> enviou */
    if ('IntersectionObserver' in window) {
      const seen = new IntersectionObserver((entries) => {
        if (entries.some((en) => en.isIntersecting)) { track('Formulário 1: viu'); seen.disconnect(); }
      }, { threshold: 0.5 });
      seen.observe(form);
    }
    form.addEventListener('focusin', () => track('Formulário 2: começou a preencher'), { once: true });

    const check = (field) => {
      const input = field.querySelector('input, select');
      const err = field.querySelector('.field__error');
      const ok = input.checkValidity() && input.value.trim() !== '';
      field.classList.toggle('is-invalid', !ok);
      input.setAttribute('aria-invalid', ok ? 'false' : 'true');
      err.textContent = ok ? '' : err.dataset.msg;
      return ok;
    };

    fields.forEach((f) => {
      const input = f.querySelector('input, select');
      input.addEventListener('blur', () => { if (input.value) check(f); });
      input.addEventListener('input', () => { if (f.classList.contains('is-invalid')) check(f); });
      input.addEventListener('change', () => { if (f.classList.contains('is-invalid')) check(f); });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const bad = fields.filter((f) => !check(f));
      if (bad.length) { bad[0].querySelector('input, select').focus(); return; }
      button.disabled = true;
      button.querySelector('span').textContent = 'Enviando';
      status.classList.remove('is-error');
      status.textContent = '';
      try {
        const body = new URLSearchParams(new FormData(form)).toString();
        const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
        if (!res.ok) throw new Error(String(res.status));
        form.classList.add('is-sent');
        track('Formulário 3: enviou', { cargo: form.elements.cargo.value });
        status.textContent = 'Interesse registrado.';
        form.querySelector('[data-sent]').focus();
      } catch (err) {
        track('Formulário: erro no envio', { motivo: err.message });
        status.classList.add('is-error');
        status.textContent = 'O pedido não foi enviado. Confira a sua conexão e tente de novo.';
        button.disabled = false;
        button.querySelector('span').textContent = 'Quero conhecer o Kairo';
      }
    });
  }
})();
