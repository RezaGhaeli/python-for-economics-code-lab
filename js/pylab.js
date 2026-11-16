/*
   Python labs (LAB.python = true): runs and grades lab.py with Pyodide in a Web Worker (pyworker.js).
   The student's code runs top to bottom in a fresh namespace; each check is then a Python expression
   evaluated in that namespace, where L holds trusted helpers (L.np, L.pd, every public name from the
   common scikit-learn modules, L.fitted(model)). See "Python labs" in references/authoring-activities.md.
*/
const PyLab = (() => {
  const CFG = typeof LAB !== 'undefined' ? LAB : {};
  const BASE = CFG.pyodide || 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
  const TIMEOUT = CFG.pyTimeout || 60000;

  /* Helpers for checks: L.<name> for numpy, pandas, and scikit-learn, so a check never depends on
     what the student happened to import. */
  const HELPERS = String.raw`
try:
    import numpy as _np, pandas as _pd
    _L.np, _L.pd = _np, _pd
    import importlib
    for _mod in ('sklearn.tree', 'sklearn.neighbors', 'sklearn.linear_model', 'sklearn.svm', 'sklearn.naive_bayes',
                 'sklearn.ensemble', 'sklearn.metrics', 'sklearn.model_selection', 'sklearn.preprocessing',
                 'sklearn.pipeline', 'sklearn.base', 'sklearn.datasets', 'sklearn.impute', 'sklearn.cluster'):
        _m = importlib.import_module(_mod)
        for _n in getattr(_m, '__all__', [n for n in dir(_m) if not n.startswith('_')]):
            if not hasattr(_L, _n): setattr(_L, _n, getattr(_m, _n))
    from sklearn.utils.validation import check_is_fitted as _cif
    def _fitted(m):
        try:
            _cif(m)
            return True
        except Exception:
            return False
    _L.fitted = _fitted
except ImportError:
    pass
`;

  let worker = null, booting = null, seq = 0, queue = Promise.resolve();
  const pending = new Map();
  let listener = null;   // the open activity's status line (one at a time)
  let status = { state: 'idle', note: '' };
  const setStatus = (state, note = '') => { status = { state, note }; if (listener) listener(status); };

  function post(cmd, data, ms) {
    const id = ++seq;
    return new Promise((res, rej) => {
      const t = setTimeout(() => { pending.delete(id); restart(); rej(new Error('timeout')); }, ms);
      pending.set(id, { res, rej, t });
      worker.postMessage(Object.assign({ id, cmd }, data));
    });
  }
  function restart() {
    if (worker) worker.terminate();
    for (const p of pending.values()) { clearTimeout(p.t); p.rej(new Error('stopped')); }
    pending.clear(); worker = null; booting = null; setStatus('idle');
  }
  /* Start Python (once). The first load downloads Pyodide and the packages (about 10 s); later loads come from the cache. */
  function boot() {
    if (booting) return booting;
    worker = new Worker('js/pyworker.js');
    worker.onmessage = e => {
      const p = pending.get(e.data.id); if (!p) return;
      pending.delete(e.data.id); clearTimeout(p.t);
      e.data.ok ? p.res(e.data.out) : p.rej(new Error(e.data.error));
    };
    setStatus('loading', 'Starting Python and loading ' + (CFG.pyPackages || ['scikit-learn']).slice(-1)[0] + '…');
    booting = post('init', {
      base: BASE,
      packages: CFG.pyPackages || ['numpy', 'pandas', 'scikit-learn'],
      data: (CFG.pyData || []).map(u => new URL(u, location.href).href),
      prelude: HELPERS + (CFG.pyPrelude || '')
    }, 240000);
    booting.then(v => setStatus('ready', 'Python ' + v.version + ' ready'), e => { setStatus('failed', 'Python could not start (' + e.message + '). Check your internet connection and reload.'); booting = null; });
    return booting;
  }
  async function send(cmd, data, ms = 20000) { await boot(); return post(cmd, data, ms); }
  /* One job at a time: a grade (run + checks) must not interleave with a Run from the editor. */
  const exclusive = job => { const p = queue.then(job, job); queue = p.catch(() => {}); return p; };

  async function execute(code) {
    const t0 = performance.now();
    let r;
    try { r = await send('run', { code: code || '' }, TIMEOUT); }
    catch (e) {
      r = { out: '', err: '', figs: [], line: null,
            error: e.message === 'timeout' ? 'Your code ran for more than ' + Math.round(TIMEOUT / 1000) + ' seconds and was stopped (an endless loop, or a model that is far too big?).' : 'Python error: ' + e.message };
    }
    r.ms = Math.round(performance.now() - t0);
    return r;
  }
  const run = code => exclusive(() => { setStatus('running', 'Running…'); return execute(code).then(r => { setStatus('ready', 'Ran in ' + (r.ms / 1000).toFixed(1) + ' s'); return r; }); });

  /* Python source without comments (so a check never matches the words in a starter's # TODO). */
  function stripComments(src) {
    return String(src || '').split('\n').map(line => {
      let q = null;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (q) { if (ch === '\\') i++; else if (ch === q) q = null; }
        else if (ch === '"' || ch === "'") q = ch;
        else if (ch === '#') return line.slice(0, i).replace(/\s+$/, '');
      }
      return line;
    }).join('\n');
  }

  function context(files, r) {
    return {
      src: files, code: { py: stripComments(files.py) },
      out: r.out || '', err: r.err || '', error: r.error, line: r.line, figs: (r.figs || []).length,
      /* check('python condition', 'python expression shown as "We found" when it fails') */
      check: (cond, found) => send('check', { cond, found: found || '' }),
      /* value('python expression') → the value as JSON (numbers, lists, dicts) */
      value: async expr => { const v = await send('value', { expr }); if (v.error) throw new Error(v.error); return v.value; },
      ok: (ok, found) => ({ ok: !!ok, found })
    };
  }

  function lint(r) {
    const notes = [];
    if (r.error) notes.push('Your code stopped with an error' + (r.line ? ' on line ' + r.line : '') + ': `' + r.error.slice(0, 260) + '`. Nothing after that line ran, so the checks that need it fail too.');
    const warn = (r.err || '').split('\n').filter(l => /Warning:/.test(l)).map(l => l.replace(/^.*?(\w+Warning:)/, '$1').trim());
    for (const w of [...new Set(warn)].slice(0, 2)) notes.push('Python printed a warning: `' + w.slice(0, 220) + '`.');
    return notes;
  }

  /* Grade one activity. files = { py }. Returns { score, earned, total, results, lint, run }. */
  function grade(activity, files) {
    return exclusive(async () => {
      setStatus('running', 'Checking…');
      const r = await execute(files.py);
      const c = context(files, r);
      let earned = 0, total = 0;
      const results = [];
      for (const ch of activity.checks) {
        total += ch.pts;
        let x;
        try { x = await ch.test(c); } catch (e) { x = { ok: false, found: 'could not check (' + e.message + ')' }; }
        if (typeof x === 'boolean') x = { ok: x, found: x ? '' : 'not found' };
        if (x.ok) earned += ch.pts;
        results.push({ check: ch, ok: x.ok, found: x.found || '' });
      }
      setStatus('ready', 'Checked in ' + (r.ms / 1000).toFixed(1) + ' s');
      return { score: Math.round(100 * earned / total), earned, total, results, lint: lint(r), run: r };
    });
  }

  return { boot, run, grade, stripComments, onStatus: fn => { listener = fn; if (fn) fn(status); }, status: () => status };
})();
