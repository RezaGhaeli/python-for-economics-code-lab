/* Code Lab engine: views, editors, progress, and scoring. Settings come from config.js (LAB).
   With LAB.exam set, it runs as a timed exam instead: see the "exam" section below.
   With LAB.exam.tries set too, the exam is stepwise: see the "stepwise exam" section. */
(() => {
  const KEY = LAB.storageKey || 'codeLab.v1';
  const N = ACTIVITIES.length;
  const FILES = Checker.NAMES;                       // file names shown on the tabs (LAB.files)
  const MODES = { html: 'htmlmixed', css: 'css', js: LAB.jsx ? 'jsx' : 'javascript', py: 'python' };
  const PY = !!LAB.python;                           // Python lab: Run button and output panel instead of a page preview
  const EX = !!LAB.express;                          // Express lab: server.js runs in a mini browser (js/expresslab.js)
  const startOf = (a, w) => ({ path: (w && w.__labPath) || a.start || '/' });   // the URL an Express preview opens (keeps the student's place)
  const CON = !!LAB.console && !EX && !PY;           // console lab: programs that log, prompt() and loop; the preview shows the console
  /* what a page of activity a runs with: Express start URL, or prompt() answers / fixed random numbers (and the console view) */
  const pageOpts = (a, w, answers) => EX ? startOf(a, w) : Checker.io(a, answers, CON);
  const splitAnswers = t => String(t || '').split(',').map(x => x.trim()).filter((x, i, all) => x !== '' || all.length > 1);
  const EXAM = LAB.exam || null;                     // exam mode: timed, no feedback until the student finishes
  const SW = !!(EXAM && EXAM.tries);                 // stepwise exam: one step at a time, EXAM.tries trials each, marked and explained per step
  const WORD = SW ? 'Step' : EXAM ? 'Section' : 'Activity';
  const $ = (s, el = document) => el.querySelector(s);
  const view = $('#view');

  /* ---------------------------------------------------------------- state */
  const NOUN = typeof LAB !== 'undefined' && LAB.exam && LAB.exam.practice ? 'lab' : 'exam';   // exam.practice: a stepwise practice lab, not a test
  const fresh = () => ({ name: '', sid: '', exam: null, run: newRun(1), history: [] });
  function newRun(n) { return { n, started: new Date().toISOString(), results: {}, drafts: {}, trials: {}, quiz: {} }; }
  function loadState() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.run) return s; } catch (e) {} return fresh(); }
  let state = loadState();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };

  const result = id => state.run.results[id];
  const unlocked = id => EXAM ? examStarted() && (!SW || id === 1 || !!result(id - 1)) : id === 1 || !!result(id - 1);
  const examStarted = () => !!(state.exam && state.exam.started);
  const examLive = () => examStarted() && !state.exam.finished;
  const examDone = () => examStarted() && !!state.exam.finished;
  const nextOpen = () => { for (let i = 1; i <= N; i++) if (!result(i)) return i; return null; };
  const overall = () => { if (SW) return swTotals().p; if (EXAM) return ExamReport.totals(submission()).p; const r = ACTIVITIES.map(a => result(a.id)).filter(Boolean); return r.length ? Math.round(r.reduce((s, x) => s + x.score, 0) / N) : 0; };
  const bestEver = () => state.history.reduce((m, h) => Math.max(m, h.overall), 0);
  const filesOf = a => Object.keys(FILES).filter(f => a.starter[f] != null || a.solution[f] != null);
  const kind = f => f === 'js' && LAB.jsx ? 'JSX' : f === 'py' ? 'Python' : f.toUpperCase();   // what students call the file they write
  /* Multiple-choice questions (a.quiz, practice labs only): answered under the code, graded with it on Submit, 1 point each. */
  const quizOf = a => !EXAM && Array.isArray(a.quiz) ? a.quiz : [];
  const picksOf = id => ((state.run.quiz || {})[id]) || [];

  /* ---------------------------------------------------------------- helpers */
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const md = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  const verdict = p => p >= 90 ? ['Excellent', 'You have this topic nailed.'] : p >= 75 ? ['Good work', 'A few details to tidy up.'] : p >= 50 ? ['Getting there', 'Review the explanations below and try again.'] : ['Keep practising', 'Read each explanation, compare with the proper code, and try again.'];
  const band = p => p >= 90 ? 'great' : p >= 75 ? 'good' : p >= 50 ? 'ok' : 'low';
  /* An image, or a coloured banner when there is no picture. */
  const art = (src, cls, label, alt = '') => src ? `<img class="${cls}" src="${src}" alt="${esc(alt)}">` : `<div class="${cls} art-fallback" aria-hidden="true"><span>${esc(label)}</span></div>`;
  function ring(p, size = 120) {
    const r = size / 2 - 9, C = 2 * Math.PI * r;
    return `<svg class="ring ${band(p)}" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${p} percent">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-bg"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="ring-fg" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - p / 100)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
      <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle">${p}%</text></svg>`;
  }
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  /* Line diff (LCS) so students can see which lines differ from the proper code. */
  function diff(a, b) {
    const norm = l => l.trim().replace(/\s+/g, ' ').toLowerCase();
    const A = String(a).replace(/\s+$/, '').split('\n'), B = String(b).replace(/\s+$/, '').split('\n');
    const n = A.length, m = B.length, dp = Array.from({ length: n + 1 }, () => new Int16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
      dp[i][j] = norm(A[i]) === norm(B[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const left = [], right = [];
    let i = 0, j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && norm(A[i]) === norm(B[j])) { left.push([A[i], 'same']); right.push([B[j], 'same']); i++; j++; }
      else if (j < m && (i >= n || dp[i][j + 1] >= dp[i + 1][j])) { right.push([B[j], norm(B[j]) ? 'add' : 'same']); j++; }
      else { left.push([A[i], norm(A[i]) ? 'del' : 'same']); i++; }
    }
    return { left, right };
  }
  /* JavaScript: red lines that differ from the proper code only by a missing ";" at the end get a note, so students know
     why they are highlighted (the code usually still runs, but ending statements with ";" is recommended). */
  function semicolonNote(d, edit) {
    if (edit !== 'js') return '';
    const bare = l => l.trim().replace(/\s+/g, ' ').toLowerCase().replace(/;$/, '');
    const proper = new Set(d.right.filter(([t, k]) => k === 'add' && /;\s*$/.test(t)).map(([t]) => bare(t)));
    const n = d.left.filter(([t, k]) => k === 'del' && !/;\s*$/.test(t) && proper.has(bare(t))).length;
    if (!n) return '';
    return `<p class="semi-note"><strong>${n === 1 ? 'One red line differs' : n + ' red lines differ'} only by the <code>;</code> at the end.</strong> ` +
      'JavaScript usually runs without it, so a missing semicolon does not cost points. Still, ending each statement with ' +
      '<code>;</code> is recommended: it is how the proper code is written, and it prevents rare bugs where JavaScript joins two lines into one.</p>';
  }
  const codeLines = (lines) => '<pre class="diff">' + lines.map(([t, k], i) => `<span class="ln ${k}"><i>${i + 1}</i>${esc(t) || ' '}</span>`).join('') + '</pre>';

  /* The author's name, linked to their page when LAB.author.url is set. */
  const byline = () => LAB.author.url ? `<a href="${esc(LAB.author.url)}" target="_blank" rel="noopener author">${esc(LAB.author.name)}</a>` : esc(LAB.author.name);

  /* ---------------------------------------------------------------- top bar */
  function renderTop() {
    document.title = LAB.title;
    $('.brand').innerHTML = (LAB.logo ? `<img src="${LAB.logo}" alt="">` : '') + `<span>${esc(LAB.brand || LAB.title)}</span>`;
    $('.brand').classList.toggle('no-logo', !LAB.logo);
    const au = LAB.author;
    if (au && au.name) {
      const m = document.createElement('meta'); m.name = 'author'; m.content = au.name; document.head.appendChild(m);
    }
    if (EXAM && !$('#timer')) { const t = document.createElement('span'); t.id = 'timer'; t.className = 'exam-timer'; t.hidden = true; t.setAttribute('role', 'timer'); $('#summaryLink').before(t); }
    if (EXAM) $('#summaryLink').textContent = 'Results';
    $('#footText').innerHTML = esc(LAB.footer || LAB.title) + (au && au.name ? ` · Created by ${byline()}` : '') + (LAB.guide ? ` · <a href="${LAB.guide}" target="_blank" rel="noopener">Student guide (PDF)</a>` : '') + (EXAM ? ' · Your answers are saved in this browser until you finish.' : ' · Your progress is saved in this browser only.');
  }
  function renderStepper(current) {
    $('#stepper').innerHTML = ACTIVITIES.map(a => {
      const r = result(a.id), open = unlocked(a.id);
      const shown = r && (!EXAM || SW || examDone());
      const cls = ['step', shown ? 'done ' + band(r.score) : EXAM && started(a) ? 'begun' : '', a.id === current ? 'current' : '', open ? '' : 'locked'].join(' ');
      const label = `${WORD} ${a.id}: ${a.title}` + (shown ? `, ${r.score}%` : open ? '' : ' (locked)');
      return open ? `<a class="${cls}" href="#/activity/${a.id}" title="${esc(label)}" aria-label="${esc(label)}">${a.id}</a>`
                  : `<span class="${cls}" title="${esc(label)}" aria-label="${esc(label)}">${a.id}</span>`;
    }).join('');
  }

  /* ---------------------------------------------------------------- home */
  function home() {
    if (EXAM) return examHome();
    renderStepper(0);
    const next = nextOpen(), done = Object.keys(state.run.results).length;
    const startLabel = done === 0 ? 'Start Activity 1' : next ? `Continue with Activity ${next}` : 'See my results';
    const startHref = next ? `#/activity/${next}` : '#/summary';
    const guide = LAB.guide ? `<a class="btn ghost" href="${LAB.guide}" target="_blank" rel="noopener" id="guideBtn">📘 Student guide (PDF)</a>` : '';
    view.innerHTML = `
    <section class="hero">
      <div class="hero-text">
        <p class="kicker">${esc(LAB.kicker || '')}</p>
        <h1>${esc(LAB.title)}</h1>
        ${LAB.author && LAB.author.name ? `<p class="byline">Created by ${byline()}${LAB.author.url ? ` · <a href="${esc(LAB.author.url)}" target="_blank" rel="noopener">${esc(LAB.author.url.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a>` : ''}</p>` : ''}
        <p class="lead">${md(LAB.lead || '')}</p>
        <label class="name-field">Your name (shown on your results)
          <input id="nameInput" type="text" autocomplete="name" placeholder="e.g. Jordan Lee" value="${esc(state.name)}">
        </label>
        <div class="hero-actions">
          <a class="btn primary" href="${startHref}" id="startBtn">${startLabel}</a>
          ${guide}
          ${done ? `<span class="muted">Run ${state.run.n}: ${done} of ${N} submitted · ${overall()}% so far</span>` : ''}
        </div>
      </div>
      ${art(LAB.heroArt, 'hero-art', LAB.title, LAB.heroAlt)}
    </section>

    <section class="how">
      <h2>How it works</h2>
      <ol class="how-list">
        ${(LAB.how || []).map((h, i) => `<li>${art(h.img, 'how-art', String(i + 1))}<strong>${esc(h.title)}</strong><span>${esc(h.text)}</span></li>`).join('')}
      </ol>
      <p class="muted">Submit an activity to unlock the next one. You can redo any activity, and start the whole lab again as many times as you like.${LAB.guide ? ` New here? Read the <a href="${LAB.guide}" target="_blank" rel="noopener">student guide</a> first.` : ''}</p>
    </section>

    <section class="cards-grid">
      <h2>The activities</h2>
      <div class="act-grid">
        ${ACTIVITIES.map(a => { const r = result(a.id), open = unlocked(a.id); return `
        <${open ? 'a' : 'div'} class="act-card ${open ? '' : 'locked'}" ${open ? `href="#/activity/${a.id}"` : 'aria-disabled="true"'}>
          ${art(a.art, 'act-art', String(a.id))}
          <div class="act-body">
            <span class="chip">${esc(a.module)}${PY ? '' : ' · ' + kind(a.edit)}</span>
            <strong>${a.id}. ${esc(a.title)}</strong>
            <span class="muted">${esc(a.topic)}</span>
          </div>
          <span class="act-status ${r ? band(r.score) : ''}">${r ? r.score + '%' : open ? 'Open' : '🔒'}</span>
        </${open ? 'a' : 'div'}>`; }).join('')}
      </div>
    </section>

    ${state.history.length ? `
    <section class="history">
      <h2>Your earlier runs</h2>
      <table><thead><tr><th>Run</th><th>Finished</th><th>Overall</th></tr></thead><tbody>
      ${state.history.slice().reverse().map(h => `<tr><td>${h.n}</td><td>${new Date(h.finished).toLocaleString()}</td><td><span class="pill ${band(h.overall)}">${h.overall}%</span></td></tr>`).join('')}
      </tbody></table>
      <p class="muted">Best overall so far: <strong>${bestEver()}%</strong></p>
    </section>` : ''}`;
    $('#nameInput').addEventListener('input', e => { state.name = e.target.value.slice(0, 60); save(); });
  }

  /* ---------------------------------------------------------------- editors */
  let cm = null;
  function editors() {
    if (cm) return cm;
    const mk = mode => { const n = mode === 'python' ? 4 : 2; return CodeMirror(document.createElement('div'), { mode, lineNumbers: true, tabSize: n, indentUnit: n, lineWrapping: true,
      autoCloseTags: mode === 'htmlmixed', autoCloseBrackets: true, matchBrackets: true, viewportMargin: Infinity,
      extraKeys: mode === 'python' ? { Tab: c => c.somethingSelected() ? c.indentSelection('add') : c.replaceSelection('    ') } : {} }); };
    cm = {};
    for (const f of Object.keys(FILES)) cm[f] = mk(MODES[f]);
    return cm;
  }
  const current = () => { const ed = editors(), o = {}; for (const f of Object.keys(FILES)) o[f] = ed[f].getValue(); return o; };

  /* ---------------------------------------------------------------- Python output */
  const goalRuns = {};                               // the proper code's output, per activity (run once)
  const lastRuns = {};                               // the latest graded run, per activity (with figures)
  function pyOutput(r) {
    if (!r) return '<p class="py-empty">Press <strong>▶ Run</strong> (or Ctrl+Enter) to run your code.</p>';
    const parts = [];
    if (r.out) parts.push(`<pre class="py-text">${esc(r.out)}</pre>`);
    for (const f of r.figs || []) parts.push(`<img class="py-fig" alt="A chart your code drew" src="data:image/png;base64,${f}">`);
    if (!(r.figs || []).length && r.nfigs) parts.push(`<p class="py-empty">(${r.nfigs} chart${r.nfigs > 1 ? 's' : ''}: run the code to see ${r.nfigs > 1 ? 'them' : 'it'})</p>`);
    const warn = (r.err || '').trim();
    if (warn) parts.push(`<pre class="py-warn">${esc(warn.split('\n').slice(-6).join('\n'))}</pre>`);
    if (r.error) parts.push(`<pre class="py-error">${r.line ? 'Line ' + r.line + ': ' : ''}${esc(r.error)}</pre>`);
    return parts.join('') || '<p class="py-empty">Your code ran without printing anything. Use <code>print()</code> to see values.</p>';
  }
  const goalRun = a => goalRuns[a.id] || (goalRuns[a.id] = PyLab.run(a.solution.py));

  /* ---------------------------------------------------------------- activity */
  function activity(id) {
    const a = ACTIVITIES[id - 1];
    if (!a) return go('#/');
    if (EXAM && !examStarted()) return go('#/');
    curId = id;
    renderStepper(id);
    if (!unlocked(id)) {
      const nx = nextOpen() || 1;
      view.innerHTML = `<section class="locked-view">${art(LAB.summaryArt, 'locked-art', '🔒')}<h1>${WORD} ${id} is locked</h1>
        <p>${SW ? `Finish ${WORD} ${id - 1} first. Each step opens when the one before it is marked.` : `Submit Activity ${id - 1} first. Each activity unlocks when you submit the one before it.`}</p>
        <a class="btn primary" href="#/activity/${nx}">Go to ${WORD} ${nx}</a></section>`;
      return;
    }
    const draft = state.run.drafts[id] || {};
    const files = filesOf(a);
    const start = f => draft[f] != null ? draft[f] : (a.starter[f] || '');
    const given = files.filter(f => f !== a.edit).map(f => kind(f) === 'JSX' ? 'JS' : kind(f));

    view.innerHTML = `
    <div class="workspace">
      <aside class="brief">
        ${art(a.art, 'brief-art', a.module + ' · ' + WORD + ' ' + a.id)}
        <p class="chip-row"><span class="chip">${esc(a.module)}</span><span class="chip outline">${esc(a.topic)}</span></p>
        <h1><span class="num">${WORD} ${a.id} of ${N}${EXAM ? ' · ' + points(a) + ' point' + (points(a) === 1 ? '' : 's') : ''}</span>${esc(a.title)}</h1>
        <p>${md(a.story)}</p>
        <div class="you-edit ${a.edit}">You write the <strong>${kind(a.edit)}</strong> in <code>${FILES[a.edit]}</code>.${given.length ? ` The ${given.join(' and ')} ${given.length > 1 ? 'are' : 'is'} given.` : ''}${a.data ? ` Data: ${a.data.map(d => `<code>${esc(d)}</code>`).join(', ')}.` : ''}</div>
        <h2>Your task</h2>
        <ol class="steps">${a.steps.map(s => typeof s === 'string' ? `<li>${md(s)}</li>` : `<li>${md(s.text)}${s.code ? `<pre class="step-code">${esc(s.code)}</pre>` : ''}</li>`).join('')}</ol>
        <details class="checklist"${EXAM ? ' open' : ''}><summary>What will be checked (${a.checks.length} items)</summary>
          <ul>${a.checks.map(c => `<li>${md(c.text)} <span class="pts">${c.pts} pt${c.pts > 1 ? 's' : ''}</span></li>`).join('')}</ul>
        </details>
        <p class="practise">${(a.practise || []).map(p => `<span class="tag">${esc(p)}</span>`).join('')}</p>
      </aside>

      <section class="work">
        <div class="panel editor-panel">
          <div class="tabs" role="tablist">
            ${files.map(f => `<button role="tab" class="tab" data-file="${f}">${FILES[f]} ${a.edit === f ? '<em>edit</em>' : '<em class="lock">given</em>'}</button>`).join('')}
            <span class="spacer"></span>
            <button class="btn small ghost" id="resetBtn" title="Put the starter code back">Reset</button>
          </div>
          <div class="cm-host" id="cmHost"></div>
          <p class="readonly-note" id="roNote" hidden>This file is given and read-only. Switch to the tab marked EDIT to write your code.</p>
        </div>

        ${PY ? `<div class="panel preview-panel py-panel">
          <div class="preview-bar">
            <div class="seg" role="group" aria-label="Which output">
              <button class="on" data-show="mine">Your output</button><button data-show="goal">Goal output</button>
            </div>
            <button class="btn small primary" id="runBtn" title="Run your code (Ctrl+Enter)">▶ Run</button>
            <span class="spacer"></span>
            <span class="live" id="liveNote"></span>
          </div>
          <div class="py-out" id="pyOut" aria-live="polite">${pyOutput(null)}</div>
        </div>` : `<div class="panel preview-panel">
          <div class="preview-bar">
            <div class="seg" role="group" aria-label="What to preview">
              <button class="on" data-show="mine">${EX ? 'Your server' : CON ? 'Your program' : 'Your page'}</button><button data-show="goal">Goal</button>
            </div>
            ${CON && a.answers ? `<label class="answers-in" title="prompt() returns these, one per question, in order. Separate them with commas.">prompt() answers <input id="answersIn" type="text" spellcheck="false" value="${(a.answers || []).join(', ').replace(/"/g, '&quot;')}"></label>` : ''}
            ${CON ? '<button class="btn small" id="rerunBtn" title="Run the program again (new random numbers)">↻ Run again</button>' : ''}
            ${EX || CON ? '' : `<div class="seg" role="group" aria-label="Screen size">
              <button class="on" data-size="desk">Desktop</button><button data-size="phone">Phone</button>
            </div>`}
            <span class="spacer"></span>
            <span class="live" id="liveNote">${EX ? 'Restarts as you type' : CON ? 'Console · runs as you type' : 'Updates as you type'}</span>
          </div>
          <div class="frame-wrap${EX ? ' express' : CON ? ' console-view' : ''}" id="frameWrap"><iframe id="preview" title="${EX ? 'A browser showing what your server sends' : CON ? 'The console of your program' : 'Preview of your page'}"></iframe></div>
          ${files.includes('js') && !CON ? `<div class="console" aria-live="polite"><span class="console-label">${EX ? 'Terminal' : 'Console'}</span><pre id="consoleOut">(nothing logged yet)</pre></div>` : ''}
        </div>`}

        ${quizBlock(a)}

        ${SW ? swNav(a) : EXAM ? examNav(a) : `<div class="submit-row">
          <p class="muted">Happy with it? Submit to see your score, your mistakes, and the proper code.${quizOf(a).length ? ' Your quiz answers are marked too.' : ''}</p>
          <button class="btn primary big" id="submitBtn">Submit Activity ${a.id}</button>
        </div>`}

        <section id="report" class="report" tabindex="-1" hidden></section>
      </section>
    </div>`;
    if (!PY) $('#frameWrap').style.setProperty('--phone', (LAB.phoneWidth || 400) + 'px');

    const ed = editors();
    for (const f of Object.keys(FILES)) {
      $('#cmHost').appendChild(ed[f].getWrapperElement());
      ed[f].off('change', ed[f]._keep);
      ed[f].setValue(start(f));
      ed[f].setOption('readOnly', a.edit !== f || (EXAM && !examLive()) || (SW && !!result(id)));
      ed[f].clearHistory();
    }

    view.querySelectorAll('.quiz input[type=radio]').forEach(r => r.addEventListener('change', () => {
      if (!state.run.quiz) state.run.quiz = {};
      const p = (state.run.quiz[id] = picksOf(id).slice());
      p[+r.dataset.q] = +r.value; save();
    }));
    let showing = 'mine';
    if (PY) return wirePython(a, ed);
    const preview = $('#preview');
    /* Console panel (JS activities): mirror the preview's console.log output and errors. */
    clearInterval(window.__labConsole);
    if ($('#consoleOut')) {
      let last = '';
      window.__labConsole = setInterval(() => {
        const out = $('#consoleOut'); if (!out) return clearInterval(window.__labConsole);
        const lab = preview.contentWindow && preview.contentWindow.__lab;
        const text = lab && lab.term ? lab.term.filter(t => !(/^△ /.test(t) && Checker.IGNORE.some(re => re.test(t)))).join('\n') : lab ? [...lab.logs, ...[...new Set(lab.warnings || [])].filter(w => !Checker.IGNORE.some(re => re.test(w))).map(w => '△ ' + w.replace(/\s+/g, ' ').slice(0, 300)), ...lab.errors.map(e => '⚠ ' + e)].join('\n') : '';
        if (text !== last) { last = text; out.textContent = text || '(nothing logged yet)'; out.classList.toggle('has-error', !!(lab && lab.errors.length)); out.classList.toggle('has-warning', /△/.test(text)); }
      }, 400);
    }
    const run = () => {
      if (showing === 'goal' && EXAM) { preview.srcdoc = goalPicture(a); return; }
      const s = showing === 'goal' ? a.solution : current();
      preview.srcdoc = Checker.compose(s.html, s.css, s.js, pageOpts(a, preview.contentWindow, $('#answersIn') ? splitAnswers($('#answersIn').value) : null));
    };
    const keep = debounce(() => { if ((!EXAM || examLive()) && !(SW && result(id))) { state.run.drafts[id] = current(); save(); } if (showing === 'mine') run(); }, 450);
    for (const f of Object.keys(FILES)) { ed[f]._keep = keep; ed[f].on('change', keep); }

    const tabs = [...view.querySelectorAll('.tab')];
    const show = f => {
      tabs.forEach(t => t.setAttribute('aria-selected', t.dataset.file === f));
      for (const g of Object.keys(FILES)) ed[g].getWrapperElement().style.display = g === f ? '' : 'none';
      $('#roNote').hidden = f === a.edit;
      ed[f].refresh(); if (f === a.edit) ed[f].focus();
    };
    tabs.forEach(t => t.addEventListener('click', () => show(t.dataset.file)));
    show(a.edit);

    view.querySelectorAll('[data-show]').forEach(b => b.addEventListener('click', () => {
      showing = b.dataset.show;
      view.querySelectorAll('[data-show]').forEach(x => x.classList.toggle('on', x === b));
      $('#liveNote').textContent = showing === 'goal' ? (EXAM ? 'A picture of the finished app' : EX ? 'The finished server: try its routes' : CON ? 'The console of the finished program' : 'This is what you are aiming for') : EX ? 'Restarts as you type' : CON ? 'Console · runs as you type' : 'Updates as you type';
      run();
    }));
    view.querySelectorAll('[data-size]').forEach(b => b.addEventListener('click', () => {
      view.querySelectorAll('[data-size]').forEach(x => x.classList.toggle('on', x === b));
      $('#frameWrap').classList.toggle('phone', b.dataset.size === 'phone');
    }));
    if ($('#answersIn')) $('#answersIn').addEventListener('input', debounce(() => run(), 450));
    if ($('#rerunBtn')) $('#rerunBtn').addEventListener('click', () => run());
    $('#resetBtn').addEventListener('click', () => {
      if ((EXAM && !examLive()) || (SW && result(id))) return;
      if (!confirm(`Replace your code with the starter code for this ${WORD.toLowerCase()}?`)) return;
      ed[a.edit].setValue(a.starter[a.edit] || '');
    });
    if (SW) { $('#resetBtn').hidden = !examLive() || !!result(id); wireSw(a); run(); return; }
    if (EXAM) { wireExamNav(a); $('#resetBtn').hidden = !examLive(); run(); if (examDone() && result(id)) examSectionReport(a, result(id)); return; }
    $('#submitBtn').addEventListener('click', () => submit(a));
    run();
    if (result(id)) report(a, result(id), false);
  }

  /* Python labs: nothing runs while typing; ▶ Run (or Ctrl+Enter) runs lab.py and shows its output. */
  function wirePython(a, ed) {
    const id = a.id, out = $('#pyOut'), note = $('#liveNote'), runBtn = $('#runBtn');
    let showing = 'mine', mine = null;
    PyLab.onStatus(s => { if (note && document.body.contains(note)) { note.textContent = s.note; note.classList.toggle('busy', s.state === 'loading' || s.state === 'running'); } });
    PyLab.boot().catch(() => {});
    const runMine = async () => {
      if (showing !== 'mine') setShowing('mine');
      runBtn.disabled = true; out.classList.add('stale');
      mine = await PyLab.run(current().py);
      runBtn.disabled = false; out.classList.remove('stale');
      if (showing === 'mine' && document.body.contains(out)) out.innerHTML = pyOutput(mine);
    };
    const setShowing = w => {
      showing = w;
      view.querySelectorAll('[data-show]').forEach(x => x.classList.toggle('on', x.dataset.show === w));
      if (w === 'mine') { out.innerHTML = pyOutput(mine); return; }
      out.innerHTML = '<p class="py-empty">Running the proper code…</p>';
      goalRun(a).then(r => { if (showing === 'goal' && document.body.contains(out)) out.innerHTML = pyOutput(r); });
    };
    ed.py.setOption('extraKeys', Object.assign({}, ed.py.getOption('extraKeys'), { 'Ctrl-Enter': runMine, 'Cmd-Enter': runMine }));
    ed.py._keep = debounce(() => { state.run.drafts[id] = current(); save(); }, 450);
    ed.py.on('change', ed.py._keep);
    /* open at the student's part, below any given code */
    const yours = ed.py.getValue().split('\n').findIndex(l => /^#.*your code/i.test(l));
    ed.py.refresh(); ed.py.focus();
    if (yours > 0) { ed.py.setCursor({ line: yours + 1, ch: 0 }); ed.py.scrollTo(null, ed.py.heightAtLine(yours, 'local') - 8); }
    view.querySelector('.tab').setAttribute('aria-selected', 'true');
    view.querySelectorAll('[data-show]').forEach(b => b.addEventListener('click', () => setShowing(b.dataset.show)));
    runBtn.addEventListener('click', runMine);
    $('#resetBtn').addEventListener('click', () => {
      if (!confirm('Replace your code with the starter code for this activity?')) return;
      ed.py.setValue(a.starter.py || '');
    });
    $('#submitBtn').addEventListener('click', () => submit(a));
    if (result(id)) report(a, result(id), false);
  }

  function quizBlock(a) {
    const Q = quizOf(a); if (!Q.length) return '';
    const p = picksOf(a.id);
    return `<section class="quiz" aria-labelledby="quizH${a.id}">
      <h2 id="quizH${a.id}">Check your understanding <span class="muted">${Q.length} question${Q.length > 1 ? 's' : ''} · 1 point each</span></h2>
      <ol class="quiz-list">${Q.map((q, i) => `<li><p class="quiz-q" id="q${a.id}-${i}">${md(q.q)}</p>${q.code ? `<pre class="quiz-code">${esc(q.code)}</pre>` : ''}
        <div role="radiogroup" aria-labelledby="q${a.id}-${i}">${q.options.map((o, k) => `<label class="quiz-opt"><input type="radio" name="q${a.id}-${i}" value="${k}" data-q="${i}"${p[i] === k ? ' checked' : ''}><span>${md(o)}</span></label>`).join('')}</div></li>`).join('')}</ol>
    </section>`;
  }
  function quizReport(a, r) {
    const Q = quizOf(a); if (!Q.length || !r.quiz) return '';
    const n = r.quiz.ok.filter(Boolean).length;
    return `<h3 class="${n === Q.length ? '' : 'bad-h'}">Check your understanding: ${n} of ${Q.length}</h3>
      <ol class="results quiz-results">${Q.map((q, i) => { const pick = r.quiz.picked[i], ok = r.quiz.ok[i]; return `
        <li class="${ok ? 'pass' : 'fail'}">
          <p class="r-title">${ok ? '✓' : '✗'} ${md(q.q)} <span class="pts">${ok ? 1 : 0} / 1</span></p>
          ${q.code ? `<pre class="quiz-code">${esc(q.code)}</pre>` : ''}
          <p class="found"><strong>Your answer:</strong> ${pick == null ? 'not answered' : md(q.options[pick])}</p>
          ${ok ? '' : `<p class="found"><strong>Correct answer:</strong> ${md(q.options[q.answer])}</p>`}
          <p class="why"><strong>Why:</strong> ${md(q.explain)}</p>
        </li>`; }).join('')}</ol>`;
  }

  async function submit(a) {
    const btn = $('#submitBtn');
    btn.disabled = true; btn.textContent = 'Checking…';
    const files = current();
    const g = await Checker.grade(a, files);
    const prev = result(a.id);
    const r = { score: g.score, earned: g.earned, total: g.total, at: new Date().toISOString(), attempts: (prev ? prev.attempts : 0) + 1,
                files, passed: g.results.map(x => x.ok), found: g.results.map(x => x.found), lint: g.lint.concat(g.tips || []) };
    const Q = quizOf(a);
    if (Q.length) {                                  // the quiz counts 1 point per question, added to the code's points
      const p = picksOf(a.id), ok = Q.map((q, i) => p[i] === q.answer);
      r.quiz = { picked: Q.map((q, i) => p[i] == null ? null : p[i]), ok };
      r.code = { earned: g.earned, total: g.total };
      r.earned = g.earned + ok.filter(Boolean).length; r.total = g.total + Q.length;
      r.score = Math.round(100 * r.earned / r.total);
    }
    if (g.run) { lastRuns[a.id] = g.run; r.output = { out: g.run.out.slice(0, 6000), err: g.run.err.slice(0, 1500), error: g.run.error, line: g.run.line, nfigs: g.run.figs.length }; }
    state.run.results[a.id] = r; save();
    btn.disabled = false; btn.textContent = 'Submit again';
    renderStepper(a.id);
    report(a, r, true);
  }

  function report(a, r, focus) {
    const el = $('#report');
    const [title, sub] = verdict(r.score);
    const files = r.files || { html: r.html, css: r.css, js: r.js };
    const d = diff(files[a.edit] || '', a.solution[a.edit] || '');
    const failed = a.checks.map((c, i) => ({ c, ok: r.passed[i], found: r.found[i] })).filter(x => !x.ok);
    const passed = a.checks.map((c, i) => ({ c, ok: r.passed[i] })).filter(x => x.ok);
    const last = a.id === N;
    el.hidden = false;
    el.innerHTML = `
      <div class="report-head">
        ${ring(r.score)}
        <div>
          <p class="kicker">Activity ${a.id} result · attempt ${r.attempts}</p>
          <h2>${title}: ${r.score}%</h2>
          <p>${sub} You earned <strong>${r.earned} of ${r.total}</strong> points.</p>
        </div>
      </div>

      ${failed.length ? `<h3 class="bad-h">What to fix (${failed.length})</h3>
      <ol class="results">${failed.map(x => `
        <li class="fail">
          <p class="r-title">✗ ${md(x.c.text)} <span class="pts">0 / ${x.c.pts}</span></p>
          ${x.found ? `<p class="found"><strong>We found:</strong> ${esc(x.found)}</p>` : ''}
          <p class="why"><strong>Why:</strong> ${md(x.c.explain)}</p>
          <p class="fix-label">The correct code:</p>
          <pre class="fix">${esc(x.c.fix)}</pre>
        </li>`).join('')}</ol>` : `<p class="all-good">✓ Every ${quizOf(a).length ? 'code ' : ''}check passed. Nicely done!</p>`}

      ${quizReport(a, r)}

      ${r.lint && r.lint.length ? `<div class="lint"><strong>Also worth a look in your code (not scored):</strong><ul>${r.lint.map(n => `<li>${md(n)}</li>`).join('')}</ul></div>` : ''}

      ${passed.length ? `<details class="passed"><summary>✓ What you got right (${passed.length})</summary>
        <ul>${passed.map(x => `<li>${md(x.c.text)} <span class="pts">${x.c.pts} / ${x.c.pts}</span><br><span class="muted">${md(x.c.explain)}</span></li>`).join('')}</ul></details>` : ''}

      <h3>Compare your ${kind(a.edit)} with the proper code</h3>
      <p class="muted legend"><span class="ln del">red</span> lines in yours are different or extra · <span class="ln add">green</span> lines in the proper code are the ones you were missing or wrote differently.</p>
      ${semicolonNote(d, a.edit)}
      <div class="compare">
        <div><h4>Your code</h4>${codeLines(d.left)}</div>
        <div><h4>Proper code</h4>${codeLines(d.right)}</div>
      </div>

      <h3>Compare the results</h3>
      <div class="compare">
        ${PY ? `<div><h4>Your output</h4><div class="py-out small" id="mineOut">${pyOutput(lastRuns[a.id] || r.output || { out: '' })}</div></div>
        <div><h4>Goal output</h4><div class="py-out small" id="goalOut"><p class="py-empty">Running the proper code…</p></div></div>`
        : `<div><h4>${EX ? 'Your server' : CON ? 'Your console' : 'Your page'}</h4><div class="mini-frame${CON ? ' console-view' : ''}"><iframe title="Your submitted page" id="mineFrame"></iframe></div></div>
        <div><h4>${CON ? 'Goal console' : 'Goal'}</h4><div class="mini-frame${CON ? ' console-view' : ''}"><iframe title="The goal page" id="goalFrame"></iframe></div></div>`}
      </div>

      <div class="report-actions">
        <button class="btn ghost" id="retryBtn">Try this activity again</button>
        <a class="btn primary big" href="${last ? '#/summary' : '#/activity/' + (a.id + 1)}">${last ? 'See my final results →' : 'Next: Activity ' + (a.id + 1) + ' →'}</a>
      </div>`;
    if (PY) goalRun(a).then(g => { const el = $('#goalOut'); if (el) el.innerHTML = pyOutput(g); });
    else {
      $('#mineFrame').srcdoc = Checker.compose(files.html, files.css, files.js, pageOpts(a));
      $('#goalFrame').srcdoc = Checker.compose(a.solution.html, a.solution.css, a.solution.js, pageOpts(a));
    }
    $('#retryBtn').addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); editors()[a.edit].focus(); });
    if (focus) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); el.focus({ preventScroll: true }); }
  }

  /* ---------------------------------------------------------------- summary */
  function summary() {
    if (SW) return swSummary();
    if (EXAM) return examSummary();
    renderStepper(0);
    const done = ACTIVITIES.filter(a => result(a.id)).length, p = overall();
    if (done < N) {
      view.innerHTML = `<section class="locked-view">${art(LAB.summaryArt, 'locked-art', LAB.title)}
        <h1>Your results so far</h1>
        <p>You have submitted <strong>${done} of ${N}</strong> activities in run ${state.run.n}. Finish all ${N} to get your full-cycle score.</p>
        ${bars()}
        <a class="btn primary" href="#/activity/${nextOpen()}">Continue with Activity ${nextOpen()}</a></section>`;
      return;
    }
    const [title, sub] = verdict(p), best = bestEver();
    const pass = LAB.passMark || 80;
    const weakest = ACTIVITIES.slice().sort((x, y) => result(x.id).score - result(y.id).score).slice(0, 3).filter(a => result(a.id).score < 100);
    view.innerHTML = `
    <section class="summary">
      <div class="summary-head">
        ${art(LAB.summaryArt, 'summary-art', '✓')}
        <div>
          <p class="kicker">Full cycle · Run ${state.run.n} complete</p>
          <h1>${esc(state.name ? state.name + ', y' : 'Y')}ou finished the ${esc(LAB.title)}!</h1>
          <div class="summary-score">${ring(p, 150)}<div><h2>${title}</h2><p>${sub}</p>
            <p class="muted">Approximate overall score${LAB.scope ? ' across ' + esc(LAB.scope) : ''}.${best ? ` Your best earlier run: ${best}%.` : ''}</p></div></div>
        </div>
      </div>
      <h2>Score by activity</h2>
      ${bars()}
      ${weakest.length ? `<div class="advice"><h3>Where to practise next</h3><ul>${weakest.map(a => `<li><a href="#/activity/${a.id}">Activity ${a.id}: ${esc(a.title)}</a>: ${result(a.id).score}% (${esc(a.module)}, ${esc(a.topic)})${result(a.id).score < pass ? ' · below ' + pass + '%' : ''}</li>`).join('')}</ul></div>` : ''}
      <div class="report-actions">
        <button class="btn ghost" onclick="window.print()">Print or save as PDF</button>
        <button class="btn primary big" id="newRun">Start the lab again</button>
      </div>
      <p class="muted print-note">Printed ${new Date().toLocaleString()} · ${esc(state.name || 'Student')} · Run ${state.run.n}${LAB.author && LAB.author.name ? ` · ${esc(LAB.title)} by ${esc(LAB.author.name)}${LAB.author.url ? ' (' + esc(LAB.author.url) + ')' : ''}` : ''}</p>
    </section>`;
    $('#newRun').addEventListener('click', () => {
      if (!confirm('Start a new run? This run’s scores are saved in your history, and every activity starts fresh.')) return;
      state.history.push({ n: state.run.n, finished: new Date().toISOString(), overall: p, scores: ACTIVITIES.map(a => result(a.id).score) });
      state.run = newRun(state.run.n + 1); save(); go('#/activity/1');
    });
  }
  function bars() {
    return `<ol class="bars">${ACTIVITIES.map(a => { const r = result(a.id); const s = r ? r.score : 0; return `
      <li><a href="${unlocked(a.id) ? '#/activity/' + a.id : '#/'}"><span class="b-label">${a.id}. ${esc(a.title)} <em>${esc(a.module)}</em></span>
      <span class="b-track"><span class="b-fill ${r ? band(s) : 'none'}" style="width:${s}%"></span></span>
      <span class="b-val">${r ? s + '%' : '–'}</span></a></li>`; }).join('')}</ol>`;
  }

  /* ---------------------------------------------------------------- exam
     LAB.exam = { minutes, idLabel, accessCode, rules, review }. Students enter their name and id and
     start the timer; every section is open; the editor autosaves; nothing is graded or shown until
     Finish exam (or the time limit). Then each section is graded from the saved code, and the
     results page offers a Word report (.docx, js/exam-report.js) that carries the code for re-grading. */
  let curId = 0, finishing = false;
  const points = a => a.checks.reduce((s, c) => s + c.pts, 0);
  const allPoints = () => ACTIVITIES.reduce((s, a) => s + points(a), 0);
  const started = a => { const d = state.run.drafts[a.id]; return !!d && d[a.edit] != null && d[a.edit] !== a.starter[a.edit]; };
  const filesFor = a => { const d = state.run.drafts[a.id]; return Object.assign({}, a.starter, { [a.edit]: d && d[a.edit] != null ? d[a.edit] : a.starter[a.edit] }); };
  const mmss = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const timeLeft = () => state.exam && state.exam.deadline ? new Date(state.exam.deadline) - Date.now() : Infinity;
  const pageUrl = () => location.href.replace(/#.*$/, '');
  /* the goal is a picture (exam builds publish no solutions); shown inside the preview frame */
  const goalPicture = a => a.goal ? `<!DOCTYPE html><html><body style="margin:0;background:#f4f1ec"><img src="${esc(new URL(a.goal, pageUrl()).href)}" alt="The finished app" style="display:block;max-width:100%;margin:0 auto"></body></html>`
    : '<!DOCTYPE html><p style="font:16px Arial;padding:20px;color:#555">No picture of the goal for this section: follow the steps.</p>';

  function examHome() {
    if (examDone()) return go('#/summary');
    renderStepper(0);
    const ex = EXAM, live = examLive();
    const facts = `<p class="exam-facts"><span><strong>${N}</strong> ${WORD.toLowerCase()}s</span><span><strong>${allPoints()}</strong> points</span>${SW ? `<span><strong>${ex.tries}</strong> trials per step</span>` : ''}${ex.minutes ? `<span><strong>${ex.minutes}</strong> minutes</span>` : ''}</p>`;
    const cardOpen = a => live && unlocked(a.id);
    const cardStatus = a => !live ? '' : SW ? (result(a.id) ? `${result(a.id).earned} / ${result(a.id).total}` : unlocked(a.id) ? `Trial ${trialsOf(a.id).length + 1} of ${ex.tries}` : '🔒') : started(a) ? 'In progress' : 'Not started';
    const cards = `<section class="cards-grid">
      <h2>The ${WORD.toLowerCase()}s</h2>
      <div class="act-grid">
        ${ACTIVITIES.map(a => `
        <${cardOpen(a) ? 'a' : 'div'} class="act-card ${cardOpen(a) ? '' : 'locked'}" ${cardOpen(a) ? `href="#/activity/${a.id}"` : ''}>
          ${art(a.art, 'act-art', String(a.id))}
          <div class="act-body">
            <span class="chip">${esc(a.module)} · ${points(a)} point${points(a) === 1 ? '' : 's'}</span>
            <strong>${a.id}. ${esc(a.title)}</strong>
            <span class="muted">${esc(a.topic)}</span>
          </div>
          <span class="act-status ${SW && result(a.id) ? band(result(a.id).score) : ''}">${cardStatus(a)}</span>
        </${cardOpen(a) ? 'a' : 'div'}>`).join('')}
      </div>
    </section>`;
    if (live) {
      const next = SW ? ACTIVITIES[(nextOpen() || 1) - 1] : ACTIVITIES.find(a => !started(a)) || ACTIVITIES[0];
      view.innerHTML = `
      <section class="hero exam-hero">
        <div class="hero-text">
          <p class="kicker">${esc(LAB.kicker || '')}</p>
          <h1>${esc(LAB.title)}</h1>
          <p class="exam-who"><strong>${esc(state.name)}</strong> · ${esc(ex.idLabel || 'Student number')} ${esc(state.sid)} · started ${new Date(state.exam.started).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          ${facts}
          ${ex.minutes ? `<p class="exam-left">Time left: <strong class="exam-clock">${mmss(timeLeft())}</strong></p>` : ''}
          <div class="hero-actions">
            <a class="btn primary" href="#/activity/${next.id}">Go to ${WORD} ${next.id}</a>
            ${SW ? '' : '<button class="btn ghost" id="finishBtn">Finish exam</button>'}
          </div>
        </div>
        <aside class="exam-rules"><h2>Reminders</h2><ul>${(ex.rules || []).map(r => `<li>${md(r)}</li>`).join('')}</ul></aside>
      </section>${cards}`;
      if ($('#finishBtn')) $('#finishBtn').addEventListener('click', () => confirmFinish());
      return;
    }
    view.innerHTML = `
    <section class="hero exam-hero">
      <div class="hero-text">
        <p class="kicker">${esc(LAB.kicker || '')}</p>
        <h1>${esc(LAB.title)}</h1>
        ${LAB.author && LAB.author.name ? `<p class="byline">Created by ${byline()}</p>` : ''}
        <p class="lead">${md(LAB.lead || '')}</p>
        ${facts}
        <form class="exam-start" id="startForm" novalidate>
          <label>Full name<input id="nameInput" type="text" autocomplete="name" required maxlength="60" value="${esc(state.name)}"></label>
          <label>${esc(ex.idLabel || 'Student number')}<input id="sidInput" type="text" autocomplete="off" required maxlength="30" value="${esc(state.sid || '')}"></label>
          ${ex.accessCode ? '<label>Access code (from your instructor)<input id="codeInput" type="text" autocomplete="off" required></label>' : ''}
          <p class="exam-err" id="startErr" role="alert"></p>
          <button class="btn primary big" type="submit" id="startBtn">Start the ${NOUN}${ex.minutes ? ` (${ex.minutes} min)` : ''}</button>
        </form>
      </div>
      <aside class="exam-rules"><h2>Before you start</h2><ul>${(ex.rules || []).map(r => `<li>${md(r)}</li>`).join('')}</ul>
        <p class="muted">${SW ? `Work through the steps in order. Each step gives you ${ex.tries} trials; after the last trial (or a perfect one) it is marked, you see what was wrong and the proper code, and the next step opens. ` : ''}${ex.minutes ? 'The timer starts when you press Start and keeps running if you close or reload the page.' : 'Your work is saved in this browser if you close or reload the page.'}</p></aside>
    </section>${cards}`;
    $('#startForm').addEventListener('submit', async e => {
      e.preventDefault();
      const name = $('#nameInput').value.trim().replace(/\s+/g, ' '), sid = $('#sidInput').value.trim(), err = $('#startErr');
      if (name.length < 2) { err.textContent = 'Enter your full name.'; return $('#nameInput').focus(); }
      if (!sid) { err.textContent = 'Enter your ' + (ex.idLabel || 'student number').toLowerCase() + '.'; return $('#sidInput').focus(); }
      if (ex.accessCode) {
        let ok = false; try { ok = (await ExamReport.sha256($('#codeInput').value)) === String(ex.accessCode).toLowerCase(); } catch (x) {}
        if (!ok) { err.textContent = 'That access code is not right. Your instructor gives it out when the exam starts.'; return $('#codeInput').focus(); }
      }
      const now = new Date();
      state.name = name; state.sid = sid; state.run = newRun(1);
      state.exam = { started: now.toISOString(), deadline: ex.minutes ? new Date(+now + ex.minutes * 60000).toISOString() : null, finished: null, auto: false };
      save(); tick(); go('#/activity/1');
    });
  }

  function examNav(a) {
    if (examDone()) return `<div class="submit-row exam-row"><p class="muted">The exam is finished: this is the code that was graded.</p><a class="btn primary" href="#/summary">See my results</a></div>`;
    return `<div class="submit-row exam-row">
      <p class="muted">Your code is saved as you type. What is in the editor when the exam ends is graded.</p>
      ${a.id > 1 ? `<a class="btn ghost" href="#/activity/${a.id - 1}">← Section ${a.id - 1}</a>` : ''}
      ${a.id < N ? `<a class="btn primary" href="#/activity/${a.id + 1}">Section ${a.id + 1} →</a>` : ''}
      <button class="btn ${a.id === N ? 'primary' : 'ghost'}" id="finishBtn">Finish exam</button>
    </div>`;
  }
  function wireExamNav() { const b = $('#finishBtn'); if (b) b.addEventListener('click', () => confirmFinish()); }

  function confirmFinish() {
    flush();
    const untouched = ACTIVITIES.filter(a => !started(a)).map(a => a.id);
    const msg = 'Finish the ' + NOUN + ' now? Your code is graded and you cannot change it afterwards.' + (untouched.length ? `\n\nYou have not started section${untouched.length > 1 ? 's' : ''} ${untouched.join(', ')}.` : '');
    if (confirm(msg)) finishExam(false);
  }
  /* keep what is in the editor right now (the autosave waits for a pause in typing) */
  function flush() {
    if (!examLive() || !curId || !/^#\/activity\//.test(location.hash) || !cm) return;
    const a = ACTIVITIES[curId - 1]; if (a) { state.run.drafts[a.id] = current(); save(); }
  }

  async function finishExam(auto) {
    if (finishing || !examLive()) return;
    finishing = true; flush();
    if (cm) Object.values(cm).forEach(e => e.setOption('readOnly', true));
    const box = document.createElement('div'); box.className = 'exam-overlay'; box.setAttribute('role', 'status');
    box.innerHTML = `<div><h2>${auto ? 'Time is up' : 'Finishing the ' + NOUN}</h2><p id="gradeNote">Grading your code…</p></div>`;
    document.body.appendChild(box);
    for (const a of ACTIVITIES) {
      box.querySelector('#gradeNote').textContent = `Grading section ${a.id} of ${N}…`;
      const files = filesFor(a);
      let g;
      try { g = await Checker.grade(a, files); }
      catch (e) { g = { score: 0, earned: 0, total: points(a), results: a.checks.map(c => ({ ok: false, found: 'could not grade (' + e.message + ')' })), lint: [] }; }
      state.run.results[a.id] = { score: g.score, earned: g.earned, total: g.total, at: new Date().toISOString(), attempts: 1,
        files, passed: g.results.map(x => x.ok), found: g.results.map(x => x.found), lint: g.lint };
      save();
    }
    state.exam.finished = auto && state.exam.deadline && Date.now() > +new Date(state.exam.deadline) ? state.exam.deadline : new Date().toISOString();
    state.exam.auto = !!auto; save();
    box.remove(); finishing = false; tick();
    go('#/summary');
  }

  /* everything the report needs, from the saved results */
  function submission() {
    return { v: 1, lab: { title: LAB.title, kicker: LAB.kicker, footer: LAB.footer, storageKey: LAB.storageKey, url: pageUrl() },
      name: state.name, sid: state.sid, idLabel: EXAM.idLabel, minutes: EXAM.minutes || 0,
      started: state.exam && state.exam.started, finished: state.exam && state.exam.finished, auto: !!(state.exam && state.exam.auto),
      sections: ACTIVITIES.map(a => { const r = result(a.id) || { earned: 0, total: points(a), score: 0, passed: [], found: [] };
        return { id: a.id, title: a.title, module: a.module, topic: a.topic, file: FILES[a.edit], earned: r.earned, total: r.total, score: r.score,
          checks: a.checks.map((c, i) => ({ text: c.text, pts: c.pts, ok: !!r.passed[i], found: r.found[i] || '' })), code: (r.files || filesFor(a))[a.edit] || '' }; }) };
  }

  function checkList(a, r) {
    return `<ul class="exam-checks">${a.checks.map((c, i) => { const ok = r.passed[i]; return `
      <li class="${ok ? 'pass' : 'fail'}"><span class="mark">${ok ? '✓' : '✗'}</span><span>${md(c.text)}
        ${!ok && r.found[i] ? `<br><span class="found">Found: ${esc(r.found[i])}</span>` : ''}
        ${EXAM.review ? `<br><span class="muted">${md(c.explain)}</span>` : ''}</span><span class="pts">${ok ? c.pts : 0} / ${c.pts}</span></li>`; }).join('')}</ul>`;
  }
  function examSectionReport(a, r) {
    const el = $('#report'); el.hidden = false;
    el.innerHTML = `<div class="report-head">${ring(r.score)}<div><p class="kicker">Section ${a.id} result</p><h2>${r.earned} of ${r.total} points</h2>
      <p class="muted">Graded when the exam finished.</p></div></div>${checkList(a, r)}`;
  }

  function examSummary() {
    renderStepper(0);
    if (!examDone()) {
      view.innerHTML = `<section class="locked-view">${art(LAB.summaryArt, 'locked-art', LAB.title)}<h1>No results yet</h1>
        <p>${examLive() ? 'Your results appear here after you finish the ' + NOUN + '.' : 'Start the ' + NOUN + ' on the home page.'}</p>
        <a class="btn primary" href="#/">Back to the exam</a></section>`;
      return;
    }
    const sub = submission(), T = ExamReport.totals(sub), [title] = verdict(T.p);
    view.innerHTML = `
    <section class="summary">
      <div class="summary-head">
        ${art(LAB.summaryArt, 'summary-art', '✓')}
        <div>
          <p class="kicker">${esc(LAB.title)} · finished${sub.auto ? ' (time limit reached)' : ''}</p>
          <h1>${esc(sub.name)}</h1>
          <p class="exam-who">${esc(EXAM.idLabel || 'Student number')} <strong>${esc(sub.sid)}</strong> · started ${esc(ExamReport.when(sub.started))} · finished ${esc(ExamReport.when(sub.finished))} · ${esc(ExamReport.dur(sub.started, sub.finished))}</p>
          <div class="summary-score">${ring(T.p, 150)}<div><h2>${T.e} of ${T.t} points</h2><p>${title}.</p>
            <p class="muted">Your instructor re-grades the code in your report, so this score can still change.</p></div></div>
        </div>
      </div>
      <div class="exam-download">
        <div><h2>Hand in your report</h2><p>Download the Word report and upload it to the course page now. It holds your name, your scores, and the code you wrote in every section.</p></div>
        <div class="report-actions"><button class="btn primary big" id="docxBtn">⬇ Download report (.docx)</button>
        <button class="btn ghost" onclick="window.print()">Print or save as PDF</button></div>
        <p class="exam-err" id="docxErr" role="alert"></p>
      </div>
      <h2>Score by section</h2>
      ${bars()}
      ${ACTIVITIES.map(a => { const r = result(a.id); return `<details class="exam-detail"><summary><strong>Section ${a.id}: ${esc(a.title)}</strong> <span class="pts">${r.earned} / ${r.total}</span></summary>${checkList(a, r)}</details>`; }).join('')}
      <p class="muted print-note">Printed ${new Date().toLocaleString()} · ${esc(sub.name)} · ${esc(sub.sid)} · ${esc(LAB.title)}${LAB.author && LAB.author.name ? ` by ${esc(LAB.author.name)}` : ''}</p>
    </section>`;
    $('#docxBtn').addEventListener('click', async () => {
      try { ExamReport.download(await ExamReport.docx(submission()), ExamReport.filename(sub)); }
      catch (e) { $('#docxErr').textContent = 'Could not make the report: ' + e.message + '. Use Print or save as PDF instead.'; }
    });
  }

  /* for the instructor, before the exam on a shared machine: #/reset-exam */
  function examReset() {
    if (confirm('Erase this browser’s ' + NOUN + ' (name, code, and results) so a new student can start?')) { state = fresh(); save(); }
    go('#/');
  }

  function tick() {
    const t = $('#timer'); if (!t) return;
    const live = examLive();
    t.hidden = !live || !EXAM.minutes;
    if (!live) return;
    const left = timeLeft();
    if (EXAM.minutes) {
      t.textContent = '⏱ ' + mmss(left) + ' left';
      t.classList.toggle('warn', left < 5 * 60000); t.classList.toggle('urgent', left < 60000);
      view.querySelectorAll('.exam-clock').forEach(e => { e.textContent = mmss(left); });
    }
    if (left <= 0) (SW ? swFinish(true) : finishExam(true));
  }

  /* ---------------------------------------------------------------- stepwise exam
     LAB.exam.tries = 2 (for example). Steps open one at a time. Each "Check my answer" grades the code
     as one trial; the step is marked after a perfect trial or the last one (best trial counts). Then
     the student sees what went wrong, why, and the proper code, and the next step opens with the
     proper code so far as its starter. At the end the results page makes a PDF report (js/step-report.js).
     The proper code, the starters of steps 2…N, and the fix strings are not in activities.js: they come
     from js/keypack.js (KEYPACK, written by scripts/pack_key.js from the answer key) and are applied to
     a step only when it opens (starter) or is marked (solution and fixes). */
  const PACK = (() => {
    if (!SW || typeof KEYPACK === 'undefined') return null;
    try {
      const k = LAB.storageKey || 'lab', bin = atob(KEYPACK);
      const bytes = Uint8Array.from(bin, (ch, i) => ch.charCodeAt(0) ^ k.charCodeAt(i % k.length));
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch (e) { return null; }
  })();
  function reveal(id) {
    const a = ACTIVITIES[id - 1]; if (!a || !PACK) return;
    if (PACK.sol && PACK.sol[id] != null) a.solution[a.edit] = PACK.sol[id];
    ((PACK.fix && PACK.fix[id]) || []).forEach((f, i) => { if (f && a.checks[i]) a.checks[i].fix = f; });
  }
  function openStep(id) {
    const a = ACTIVITIES[id - 1]; if (!a || !PACK) return;
    if (PACK.start && PACK.start[id] != null) a.starter[a.edit] = PACK.start[id];
  }
  const trialsOf = (id, make) => { const T = state.run.trials || (state.run.trials = {}); if (make && !T[id]) T[id] = []; return T[id] || []; };
  const fbTrial = id => trialsOf(id).slice().reverse().find(x => x.score < 100) || null;   // the trial the feedback explains
  const swTotals = () => { const e = ACTIVITIES.reduce((s, a) => s + (result(a.id) ? result(a.id).earned : 0), 0), t = allPoints(); return { e, t, p: t ? Math.round(100 * e / t) : 0 }; };

  function swNav(a) {
    const r = result(a.id), t = trialsOf(a.id), T = EXAM.tries;
    const next = a.id < N ? `<a class="btn primary big" href="#/activity/${a.id + 1}">Next: ${WORD} ${a.id + 1} →</a>` : `<a class="btn primary big" href="#/summary">See my results and get the report →</a>`;
    if (r) return `<div class="submit-row exam-row"><p class="muted">${WORD} ${a.id} is marked: <strong>${r.earned} of ${r.total} points</strong>. Read the feedback below, then go on.</p>${next}</div>`;
    if (!examLive()) return `<div class="submit-row exam-row"><p class="muted">The exam is finished.</p><a class="btn primary" href="#/summary">See my results</a></div>`;
    const k = t.length + 1;
    return `<div class="submit-row exam-row">
      <p class="muted">${k >= T ? '<strong>Last trial.</strong> After this check the step is marked and you see the proper code.' : `You have <strong>${T} trials</strong> for this step. Test your server first: a perfect trial marks the step at once; otherwise your best trial counts.`}</p>
      <button class="btn primary big" id="submitBtn">Check my answer · trial ${k} of ${T}</button>
    </div>`;
  }
  function wireSw(a) {
    const b = $('#submitBtn'); if (b) b.addEventListener('click', () => swSubmit(a));
    const r = result(a.id), t = trialsOf(a.id);
    if (r) swReport(a, r, false);
    else if (t.length) swTrialReport(a, t[t.length - 1], t.length, false);
  }
  const trialOf = (g, files) => ({ score: g.score, earned: g.earned, total: g.total, at: new Date().toISOString(),
    files, passed: g.results.map(x => x.ok), found: g.results.map(x => x.found), tips: g.tips || [] });
  const failGrade = (a, e) => ({ score: 0, earned: 0, total: points(a), results: a.checks.map(() => ({ ok: false, found: 'could not grade (' + e.message + ')' })) });
  /* unscored suggestions from activity.tips (e.g. where code is better placed) */
  const tipsBlock = list => list && list.length ? `<div class="lint"><strong>Suggestions (not marked):</strong><ul>${list.map(n => `<li>${md(n)}</li>`).join('')}</ul></div>` : '';

  async function swSubmit(a) {
    if (!examLive() || result(a.id)) return;
    const btn = $('#submitBtn'); btn.disabled = true; btn.textContent = 'Checking…';
    const files = current(); state.run.drafts[a.id] = files;
    let g; try { g = await Checker.grade(a, files); } catch (e) { g = failGrade(a, e); }
    const t = trialsOf(a.id, true); t.push(trialOf(g, files));
    if (g.score === 100 || t.length >= EXAM.tries) lockStep(a);
    save();
    if (result(a.id) && a.id === N) swFinish(false);
    activity(a.id);
    const el = $('#report'); if (el && !el.hidden) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); el.focus({ preventScroll: true }); }
  }
  /* mark a step: the best trial counts; the feedback shows the last trial that was not perfect */
  function lockStep(a) {
    const t = trialsOf(a.id);
    const best = t.reduce((b, x) => !b || x.earned > b.earned ? x : b, null), last = t[t.length - 1];
    state.run.results[a.id] = best
      ? { score: best.score, earned: best.earned, total: best.total, at: new Date().toISOString(), attempts: t.length, counted: t.indexOf(best),
          files: last.files, passed: last.passed, found: last.found, lint: [] }
      : { score: 0, earned: 0, total: points(a), at: new Date().toISOString(), attempts: 0, counted: -1,
          files: filesFor(a), passed: a.checks.map(() => false), found: a.checks.map(() => 'not attempted'), lint: [] };
    reveal(a.id);
    if (a.id < N) openStep(a.id + 1);
  }
  /* the end: after the last step, or when the time limit runs out (open steps are graded as they are) */
  async function swFinish(auto) {
    if (finishing || !examLive()) return;
    finishing = true;
    if (auto) {
      flush();
      for (const a of ACTIVITIES) {
        if (result(a.id)) continue;
        if (unlocked(a.id) && started(a) && trialsOf(a.id).length < EXAM.tries) {
          let g; try { g = await Checker.grade(a, filesFor(a)); } catch (e) { g = failGrade(a, e); }
          trialsOf(a.id, true).push(trialOf(g, filesFor(a)));
        }
        lockStep(a);
      }
    }
    state.exam.finished = auto && state.exam.deadline && Date.now() > +new Date(state.exam.deadline) ? state.exam.deadline : new Date().toISOString();
    state.exam.auto = !!auto; save();
    finishing = false; tick();
    if (auto) go('#/summary');
  }

  function swTrialReport(a, x, n, focus) {
    const el = $('#report'); el.hidden = false;
    const left = EXAM.tries - n;
    el.innerHTML = `<div class="report-head">${ring(x.score)}<div><p class="kicker">${WORD} ${a.id} · trial ${n} of ${EXAM.tries}</p>
      <h2>${x.earned} of ${x.total} points</h2>
      <p>Fix what is marked ✗, test your server, and check again. You have <strong>${left} trial${left === 1 ? '' : 's'} left</strong>; your best trial counts.</p></div></div>
      ${checkList(a, x)}${tipsBlock(x.tips)}`;
    if (focus) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function swReport(a, r, focus) {
    const el = $('#report'); el.hidden = false;
    const t = trialsOf(a.id), fb = fbTrial(a.id);
    const tline = t.length ? t.map((x, i) => `Trial ${i + 1}: ${x.earned} / ${x.total}${i === r.counted && t.length > 1 ? ' (counted)' : ''}`).join(' · ') : 'Not attempted';
    const failed = fb ? a.checks.map((c, i) => ({ c, found: fb.found[i], ok: fb.passed[i] })).filter(y => !y.ok) : [];
    const fbN = fb ? t.indexOf(fb) + 1 : 0;
    const fixedLater = fb && fbN < t.length;
    const fbFiles = fb ? fb.files : filesFor(a);
    const d = diff(fbFiles[a.edit] || '', a.solution[a.edit] || '');
    el.innerHTML = `
      <div class="report-head">${ring(r.score)}<div><p class="kicker">${WORD} ${a.id} · marked</p>
        <h2>${r.earned} of ${r.total} points</h2><p>${tline}</p></div></div>
      ${t.length ? tipsBlock(t[t.length - 1].tips) : ''}
      ${!fb ? `<p class="all-good">✓ Every check passed on trial ${t.length}. Nicely done!</p>` : `
      <h3 class="bad-h">What went wrong${t.length ? ` on trial ${fbN}` : ''}${fixedLater ? ' (you fixed it on your next trial)' : ''} (${failed.length})</h3>
      <ol class="results">${failed.map(y => `
        <li class="fail">
          <p class="r-title">✗ ${md(y.c.text)} <span class="pts">0 / ${y.c.pts}</span></p>
          ${y.found ? `<p class="found"><strong>We found:</strong> ${esc(y.found)}</p>` : ''}
          <p class="why"><strong>Why:</strong> ${md(y.c.explain)}</p>
          ${y.c.fix ? `<p class="fix-label">What you should have written:</p><pre class="fix">${esc(y.c.fix)}</pre>` : ''}
        </li>`).join('')}</ol>
      <h3>Your code${t.length ? ` (trial ${fbN})` : ''} and the proper code</h3>
      <p class="muted legend"><span class="ln del">red</span> lines in yours are different or extra · <span class="ln add">green</span> lines in the proper code are the ones you were missing or wrote differently.</p>
      ${semicolonNote(d, a.edit)}
      <div class="compare">
        <div><h4>Your code</h4>${codeLines(d.left)}</div>
        <div><h4>Proper code</h4>${codeLines(d.right)}</div>
      </div>
      <h3>Compare the results</h3>
      <div class="compare">
        <div><h4>${EX ? 'Your server' : CON ? 'Your console' : 'Your page'}</h4><div class="mini-frame${CON ? ' console-view' : ''}"><iframe title="Your code" id="mineFrame"></iframe></div></div>
        <div><h4>Proper ${EX ? 'server' : CON ? 'console' : 'page'}</h4><div class="mini-frame${CON ? ' console-view' : ''}"><iframe title="The proper code" id="goalFrame"></iframe></div></div>
      </div>`}
      <div class="report-actions">${a.id < N ? `<a class="btn primary big" href="#/activity/${a.id + 1}">Next: ${WORD} ${a.id + 1} →</a>` : `<a class="btn primary big" href="#/summary">See my results and get the report →</a>`}</div>`;
    if (fb && !PY) {
      $('#mineFrame').srcdoc = Checker.compose(fbFiles.html, fbFiles.css, fbFiles.js, pageOpts(a));
      $('#goalFrame').srcdoc = Checker.compose(a.solution.html, a.solution.css, a.solution.js, pageOpts(a));
    }
    if (focus) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function swSubmission() {
    return { v: 1, kind: 'steps', lab: { title: LAB.title, kicker: LAB.kicker, footer: LAB.footer, storageKey: LAB.storageKey, url: pageUrl() },
      name: state.name, sid: state.sid, idLabel: EXAM.idLabel || 'Student number', tries: EXAM.tries, minutes: EXAM.minutes || 0, reportTag: EXAM.reportTag || '',
      started: state.exam && state.exam.started, finished: state.exam && state.exam.finished, auto: !!(state.exam && state.exam.auto),
      steps: ACTIVITIES.map(a => { const r = result(a.id) || { earned: 0, total: points(a), counted: -1 };
        return { id: a.id, title: a.title, module: a.module, topic: a.topic, file: FILES[a.edit], earned: r.earned, total: r.total, counted: r.counted,
          trials: trialsOf(a.id).map(x => ({ earned: x.earned, total: x.total, score: x.score, at: x.at, code: (x.files || {})[a.edit] || '', tips: x.tips || [],
            checks: a.checks.map((c, i) => ({ text: c.text, pts: c.pts, ok: !!x.passed[i], found: x.found[i] || '' })) })) }; }) };
  }

  function swSummary() {
    renderStepper(0);
    if (!examStarted()) { go('#/'); return; }
    const T = swTotals(), sub = swSubmission();
    if (!examDone()) {
      const nx = nextOpen() || 1;
      view.innerHTML = `<section class="locked-view">${art(LAB.summaryArt, 'locked-art', LAB.title)}<h1>Your results so far</h1>
        <p>${ACTIVITIES.filter(a => result(a.id)).length} of ${N} steps marked · <strong>${T.e} of ${T.t} points</strong> so far. Finish every step to get your report.</p>
        ${bars()}<a class="btn primary" href="#/activity/${nx}">Continue with ${WORD} ${nx}</a></section>`;
      return;
    }
    const [title] = verdict(T.p);
    view.innerHTML = `
    <section class="summary">
      <div class="summary-head">
        ${art(LAB.summaryArt, 'summary-art', '✓')}
        <div>
          <p class="kicker">${esc(LAB.title)} · finished${sub.auto ? ' (time limit reached)' : ''}</p>
          <h1>${esc(sub.name)}</h1>
          <p class="exam-who">${esc(sub.idLabel)} <strong>${esc(sub.sid)}</strong> · started ${esc(StepReport.when(sub.started))} · finished ${esc(StepReport.when(sub.finished))} · ${esc(StepReport.dur(sub.started, sub.finished))}</p>
          <div class="summary-score">${ring(T.p, 150)}<div><h2>${T.e} of ${T.t} points</h2><p>${title}.</p>
            <p class="muted">Each step counts your best trial. Your instructor checks the code in your report.</p></div></div>
        </div>
      </div>
      <div class="exam-download">
        <div><h2>Hand in your report</h2><p>Download the PDF report and upload it to the course page now. It holds your name, your marks, and the code of every trial.</p></div>
        <div class="report-actions"><button class="btn primary big" id="pdfBtn">⬇ Download report (.pdf)</button></div>
        <p class="exam-err" id="pdfErr" role="alert"></p>
      </div>
      <h2>Marks by step</h2>
      <table class="trial-table"><thead><tr><th>Step</th>${Array.from({ length: EXAM.tries }, (_, i) => `<th>Trial ${i + 1}</th>`).join('')}<th>Mark</th></tr></thead><tbody>
      ${sub.steps.map(s => `<tr><td><a href="#/activity/${s.id}">${s.id}. ${esc(s.title)}</a></td>${Array.from({ length: EXAM.tries }, (_, i) => `<td>${s.trials[i] ? s.trials[i].earned + ' / ' + s.trials[i].total : '–'}</td>`).join('')}<td><strong>${s.earned} / ${s.total}</strong></td></tr>`).join('')}
      </tbody></table>
      <p class="muted print-note">${esc(sub.name)} · ${esc(sub.sid)} · ${esc(LAB.title)}${LAB.author && LAB.author.name ? ` by ${esc(LAB.author.name)}` : ''}</p>
    </section>`;
    $('#pdfBtn').addEventListener('click', () => {
      try { StepReport.download(StepReport.pdf(swSubmission()), StepReport.filename(swSubmission())); }
      catch (e) { $('#pdfErr').textContent = 'Could not make the report: ' + e.message + '. Reload the page and try again.'; }
    });
  }
  if (SW) for (const a of ACTIVITIES) if (result(a.id)) { reveal(a.id); openStep(a.id + 1); }

  /* ---------------------------------------------------------------- router */
  function go(h) { if (location.hash === h) route(); else location.hash = h; }
  function route() {
    const h = location.hash || '#/';
    let m;
    if (EXAM && h.startsWith('#/reset-exam')) return examReset();
    if ((m = h.match(/^#\/activity\/(\d+)/))) activity(+m[1]);
    else if (h.startsWith('#/summary')) summary();
    else home();
    view.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  /* LAB.chromeOnly: the lab opens only in Google Chrome (Client Hints brands; Edge, Opera, Brave and other
     Chromium browsers name themselves there). Automated test browsers (navigator.webdriver) are let through. */
  function isChrome() {
    const d = navigator.userAgentData, b = d && d.brands ? d.brands.map(x => x.brand) : [];
    return b.includes('Google Chrome') && !b.some(x => /edge|opera|brave|vivaldi|yandex|samsung|whale|duckduckgo/i.test(x));
  }
  renderTop();
  if (LAB.chromeOnly && !navigator.webdriver && !isChrome()) {
    $('#stepper').innerHTML = ''; $('#summaryLink').hidden = true;
    view.innerHTML = `<section class="locked-view">
      <h1>Please open this page in Google Chrome</h1>
      <p>${esc(LAB.title)} works only in the <strong>Google Chrome</strong> browser on a computer. Copy this page's address, open Chrome, and paste it there.</p>
      <p><input class="copy-url" readonly value="${esc(location.href)}" onclick="this.select()" aria-label="This page's address"></p>
      <p class="muted">No Chrome yet? Download it from <a href="https://www.google.com/chrome/" target="_blank" rel="noopener">google.com/chrome</a>.</p></section>`;
    return;
  }
  window.addEventListener('hashchange', route);
  if (EXAM) { setInterval(tick, 1000); tick(); }
  route();
})();
