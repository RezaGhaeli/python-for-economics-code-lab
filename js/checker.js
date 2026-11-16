/*
   Code Lab checker: renders a student's files and grades them.
   The page is rendered twice in hidden frames (desktop and phone width), then each check runs
   against the real DOM, computed styles, CSS rules, and (for JavaScript) the running page.
   With LAB.jsx = true, the JS file is compiled from JSX with Babel (in this page) before it runs,
   and grading waits for React to render. With LAB.express = true, the JS file is an Express server
   (js/expresslab.js runs it in the page) and checks send it requests with c.get / c.post.
   See references/authoring-activities.md for the check API.
*/
const Checker = (() => {
  const CFG = typeof LAB !== 'undefined' ? LAB : {};
  const DESK = CFG.desktopWidth || 960;
  const PHONE = CFG.phoneWidth || 400;
  /* Python labs have one file, lab.py (see pylab.js); web labs have up to three. */
  const NAMES = CFG.python ? { py: (CFG.files && CFG.files.py) || 'lab.py' }
                           : Object.assign({ html: 'index.html', css: 'style.css', js: 'script.js' }, CFG.files || {});
  const JSX = !!CFG.jsx;
  const EXPRESS = !!CFG.express;
  /* console labs (LAB.console): prompt()/confirm()/alert() answered by the lab, fixed Math.random, loop guard, console view.
     Other labs run student code exactly as a browser would. */
  const CONSOLE = !!CFG.console && !EXPRESS && !CFG.python;
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  /* console noise that is not the student's fault (library deprecation notices) */
  const IGNORE = [/React Router Future Flag Warning/i, /Download the React DevTools/i].concat(CFG.ignoreWarnings || []);

  /* Records errors, console.log output, and console.error/warn (React's warnings) before any student code runs. */
  const PROBE = '<script>window.__lab={errors:[],logs:[],warnings:[]};' +
    'window.addEventListener("error",function(e){var s=window.__labJsStart,l=e.lineno;' +
    '__lab.errors.push(e.message+(l?(s&&l>=s?" (' + NAMES.js + ' line "+(l-s+1)+")":" (line "+l+")"):""));});' +
    '(function(){function fmt(a){a=[].slice.call(a);var f=a[0];if(typeof f==="string"&&/%[sdo]/.test(f)){var i=1;f=f.replace(/%[sdo]/g,function(){return String(a[i++]);});a=[f].concat(a.slice(i));}' +
    'return a.map(function(x){return typeof x==="object"?(function(){try{return JSON.stringify(x);}catch(e){return String(x);}})():String(x);}).join(" ");}' +
    'var l=console.log,er=console.error,w=console.warn;' +
    'console.log=function(){try{if(__lab.logs.length<5000)__lab.logs.push(fmt(arguments));}catch(x){}return l.apply(console,arguments);};' +
    'console.error=function(){try{__lab.warnings.push(fmt(arguments));}catch(x){}return er.apply(console,arguments);};' +
    'console.warn=function(){try{__lab.warnings.push(fmt(arguments));}catch(x){}return w.apply(console,arguments);};' +
    /* remember what code focused; only really move focus once the student has clicked into this page,
       so a preview that calls focus() (useRef/autofocus lessons) never steals the cursor from the editor */
    'var fo=HTMLElement.prototype.focus;HTMLElement.prototype.focus=function(){__lab.focused=this;if(document.hasFocus())return fo.apply(this,arguments);};})();<\/script>';

  /* Console programs (prompt, Math.random, loops). Runs right after PROBE in every page of a console lab (LAB.console).
     o = { answers: ['Maya', '42'], random: [0.5, 0.1], view: true }
     - prompt() takes the next answer (null = Cancel once they run out), confirm() too ('no'/'' = false), alert() logs;
       a real dialog would stop the page on every keystroke, and hidden grading frames can never answer one.
     - random: Math.random() returns these values in turn (checks and tests get the same numbers every time).
     - __lab.term: everything in order (logs, prompts, warnings, errors), shown by the console view.
     - __labLoop(): the loop guard that guardLoops() puts at the top of every loop body.
     - view: draw the console over the page (console labs: the preview and the report show the console). */
  function labIO(o) {
    var L = window.__lab, MAX = 1500;
    L.term = []; L.prompts = []; L.answers = (o.answers || []).map(String);
    var put = L.put = function (s, always) { if (L.term.length < MAX || always) L.term.push(s); else if (L.term.length === MAX) L.term.push('… (more output is not shown)'); };
    function wrap(name, list, mark) {
      var f = console[name];
      console[name] = function () { var n = L[list].length, r = f.apply(console, arguments); if (L[list].length > n) put(mark + L[list][L[list].length - 1]); return r; };
    }
    wrap('log', 'logs', ''); wrap('error', 'warnings', '△ '); wrap('warn', 'warnings', '△ ');
    console.info = function () { return console.log.apply(console, arguments); };
    window.addEventListener('error', function () { var e = L.errors[L.errors.length - 1]; if (e) put('⚠ ' + e, true); });
    var show = function (q) { return q === undefined ? '' : JSON.stringify(String(q)); };
    window.prompt = function (q) {
      var a = L.answers.length ? L.answers.shift() : null;
      L.prompts.push({ q: q === undefined ? '' : String(q), a: a });
      put('▸ prompt(' + show(q) + ') → ' + (a === null ? 'null  (Cancel: no answers left)' : JSON.stringify(a)));
      return a;
    };
    window.confirm = function (q) {
      var a = L.answers.length ? L.answers.shift() : null, ok = a !== null && !/^\s*(no|n|false|cancel|0)?\s*$/i.test(a);
      L.prompts.push({ q: q === undefined ? '' : String(q), a: a, confirm: true });
      put('▸ confirm(' + show(q) + ') → ' + ok);
      return ok;
    };
    window.alert = function (q) { put('▸ alert(' + show(q) + ')'); };
    if (o.random && o.random.length) { var i = 0, R = o.random; Math.random = function () { return R[i++ % R.length]; }; }
    var n = 0, sch = false;
    window.__labLoop = function () { if (!sch) { sch = true; setTimeout(function () { n = 0; sch = false; }, 0); } return ++n > 100000; };
    if (!o.view) return;
    window.addEventListener('load', function () {
      var box = document.createElement('div'), last = -1;
      box.id = '__labcon';
      box.style.cssText = 'position:fixed;inset:0;margin:0;z-index:2147483647;overflow:auto;background:#1F1B18;color:#E9E2D8;padding:12px 14px;font:13px/1.55 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap;word-break:break-word';
      document.body.appendChild(box);
      var draw = function () {
        if (L.term.length === last) return; last = L.term.length;
        box.textContent = '';
        if (!L.term.length) { var e = document.createElement('div'); e.textContent = '(nothing logged yet)'; e.style.color = '#9C8F82'; box.appendChild(e); }
        L.term.forEach(function (t) {
          var d = document.createElement('div'); d.textContent = t;
          d.style.cssText = 'padding:1px 0;border-bottom:1px solid #2E2823';
          if (t.charAt(0) === '▸') d.style.color = '#7FD1C3';
          else if (t.charAt(0) === '⚠') { d.style.color = '#FFB4A8'; d.style.background = '#3A1F1B'; }
          else if (t.charAt(0) === '△') d.style.color = '#F6D58E';
          box.appendChild(d);
        });
      };
      var drawn = function () { var n = last; draw(); if (last !== n) box.scrollTop = box.scrollHeight; };   // like a real console: show the newest lines
      drawn(); setInterval(drawn, 250);
    });
  }
  const ioScript = o => '<script>(' + labIO.toString() + ')(' + JSON.stringify({ answers: (o && o.answers) || [], random: (o && o.random) || null, view: !!(o && o.view) }).replace(/</g, '\\u003c') + ');<\/script>';

  /* Loop guard: put `if(__labLoop())throw …` at the top of every for/while/do body (same line, so error lines
     still match the student's file), so an endless loop stops with a clear message instead of freezing the tab. */
  const LOOP_MSG = 'Infinite loop? This loop ran 100,000 times, so the lab stopped it. Check that something inside the loop changes so its condition becomes false (or that it reaches break).';
  function guardLoops(js) {
    try { new Function(js); } catch (e) { return js; }            // syntax errors are reported as they are
    const G = 'if(__labLoop())throw new Error(' + JSON.stringify(LOOP_MSG) + ');';
    const n = js.length;
    /* end index of the string, template literal, or comment that starts at k (or k + 1 for anything else) */
    function skip(k) {
      const ch = js[k];
      if (ch === '/' && js[k + 1] === '/') { const j = js.indexOf('\n', k); return j < 0 ? n : j; }
      if (ch === '/' && js[k + 1] === '*') { const j = js.indexOf('*/', k + 2); return j < 0 ? n : j + 2; }
      if (ch === '"' || ch === "'") { let j = k + 1; while (j < n && js[j] !== ch && js[j] !== '\n') j += js[j] === '\\' ? 2 : 1; return j + 1; }
      if (ch === '`') {
        let j = k + 1;
        while (j < n && js[j] !== '`') {
          if (js[j] === '\\') j += 2;
          else if (js[j] === '$' && js[j + 1] === '{') { let d = 1; j += 2; while (j < n && d) { if (js[j] === '{') d++; else if (js[j] === '}') d--; if (d) j = /["'`]/.test(js[j]) || (js[j] === '/' && /[/*]/.test(js[j + 1])) ? skip(j) : j + 1; else j++; } }
          else j++;
        }
        return j + 1;
      }
      return k + 1;
    }
    const gap = k => { while (k < n) { if (/\s/.test(js[k])) k++; else if (js[k] === '/' && /[/*]/.test(js[k + 1])) k = skip(k); else break; } return k; };
    let out = '', i = 0;
    while (i < n) {
      const ch = js[i];
      if (/["'`]/.test(ch) || (ch === '/' && /[/*]/.test(js[i + 1]))) { const e = skip(i); out += js.slice(i, e); i = e; continue; }
      if (/[A-Za-z_$]/.test(ch)) {
        let e = i; while (e < n && /[\w$]/.test(js[e])) e++;
        const word = js.slice(i, e), prev = out.replace(/\s+$/, '').slice(-1);
        let body = -1;
        if (prev !== '.' && (word === 'for' || word === 'while')) {
          let k = gap(e);
          if (js[k] === '(') { let d = 0; do { if (js[k] === '(') d++; else if (js[k] === ')') d--; k = d ? skip(k) : k + 1; } while (k < n && d); k = gap(k); if (js[k] === '{') body = k; }
        } else if (prev !== '.' && word === 'do') { const k = gap(e); if (js[k] === '{') body = k; }
        if (body >= 0) { out += js.slice(i, body + 1) + G; i = body + 1; } else { out += word; i = e; }
        continue;
      }
      out += ch; i++;
    }
    try { new Function(out); return out; } catch (e) { return js; }
  }

  /* JSX → plain JavaScript, keeping line numbers. Returns { code } or { error, line }. */
  const cache = new Map();
  function compile(js) {
    if (!JSX) return { code: js };
    if (cache.has(js)) return cache.get(js);
    let out;
    try {
      if (typeof Babel === 'undefined') throw new Error('Babel did not load (check your internet connection)');
      out = { code: Babel.transform(js, { presets: ['react'], retainLines: true, sourceType: 'script', filename: NAMES.js }).code };
    } catch (e) {
      const line = e.loc ? e.loc.line : null;
      const msg = String(e.message || e).split('\n')[0].replace(/^[^:]*?:\s*/, '').replace(/\s*\(\d+:\d+\)\s*$/, '');
      out = { error: 'SyntaxError: ' + msg + (line ? ' (' + NAMES.js + ' line ' + line + ')' : ''), line };
    }
    if (cache.size > 60) cache.clear();
    cache.set(js, out);
    return out;
  }

  /* Put the CSS and JS files into the page the way <link> and <script src> would.
     Express labs: the page is a mini browser talking to the student's server; opts.path is the first URL it opens. */
  function compose(html, css, js, opts) {
    if (EXPRESS) return ExpressLab.compose(js, opts, PROBE);
    if (CONSOLE && !JSX && js) js = guardLoops(js);
    let doc = String(html || '');
    doc = doc.replace(new RegExp('<link[^>]*href=["\']?(\\./)?' + esc(NAMES.css) + '["\']?[^>]*>', 'i'), '');
    doc = doc.replace(new RegExp('<script[^>]*src=["\']?(\\./)?' + esc(NAMES.js) + '["\']?[^>]*>\\s*</script>', 'i'), '');
    if (JSX) doc = doc.replace(/<script[^>]*babel[^>]*>\s*<\/script>/gi, '');   // the lab compiles JSX itself
    const head = PROBE + (CONSOLE ? ioScript(opts) : '') + '\n<style id="lab-css">\n' + (css || '') + '\n</style>';
    doc = /<\/head>/i.test(doc) ? doc.replace(/<\/head>/i, () => head + '\n</head>') : head + '\n' + doc;   // a function: $$ or $& in the code must stay as written
    if (js && js.trim()) {
      const r = compile(js);
      const body = r.error ? 'window.__lab.errors.push(' + JSON.stringify(r.error) + ');' : r.code;
      const tag = '<script>window.__labJsStart=@@LINE@@;<\/script>\n<script id="lab-js">\n' + body.replace(/<\/script/gi, '<\\/script') + '\n<\/script>';
      doc = /<\/body>/i.test(doc) ? doc.replace(/<\/body>(?![\s\S]*<\/body>)/i, () => tag + '\n</body>') : doc + '\n' + tag;
      /* line numbers in errors should refer to the student's file, not to the combined page */
      const before = doc.slice(0, doc.indexOf('<script id="lab-js">')).split('\n').length;
      doc = doc.replace('@@LINE@@', String(before + 1));
    }
    return doc;
  }

  /* what a page of this activity runs with: its prompt() answers and fixed random numbers (activity.answers / .random) */
  function io(activity, answers, view) {
    return { answers: answers || (activity && activity.answers) || [], random: (activity && activity.random) || null, view: !!view };
  }

  function frame(width) {
    const f = document.createElement('iframe');
    f.setAttribute('aria-hidden', 'true');
    f.tabIndex = -1;
    /* off-screen but not visibility:hidden, so elements can take focus (useRef/focus checks) */
    f.style.cssText = 'position:absolute;left:-12000px;top:0;height:900px;border:0;opacity:0;pointer-events:none;width:' + width + 'px';
    document.body.appendChild(f);
    return f;
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function load(f, src) {
    return new Promise(res => {
      let done = false;
      const finish = () => { if (!done) { done = true; setTimeout(res, 80); } };
      f.onload = finish;
      f.srcdoc = src;
      setTimeout(finish, 9000);
    });
  }
  /* React renders after the scripts run; wait until the root has content (or an error), up to 2.5 s. */
  async function settleRender(f) {
    const sel = CFG.readySelector || (JSX ? '#root' : null);
    if (!sel) return;
    for (let t = 0; t < 50; t++) {
      const d = f.contentDocument, w = f.contentWindow;
      const el = d && d.querySelector(sel);
      if ((el && el.childElementCount) || (w && w.__lab && w.__lab.errors.length)) break;
      await sleep(50);
    }
    await sleep(40);
  }

  /* Flatten every style rule, including those inside @media. */
  function flatRules(doc) {
    const out = [], media = [];
    const sheet = doc.getElementById('lab-css');
    if (!sheet || !sheet.sheet) return { out, media };
    (function walk(list, inMedia) {
      for (const r of list) {
        if (r.type === 1) { r.inMedia = inMedia; out.push(r); }
        else if (r.type === 4) { media.push(r); walk(r.cssRules, true); }
      }
    })(sheet.sheet.cssRules, false);
    return { out, media };
  }

  /* ---- Express labs: a response with helpers to read the HTML the server sent */
  function response(method, url, r, data) {
    const doc = new DOMParser().parseFromString(/html/i.test((r.headers || {})['content-type'] || '') ? r.body : '<pre>' + String(r.body || '').replace(/</g, '&lt;') + '</pre>', 'text/html');
    const tidy = s => String(s || '').replace(/\s+/g, ' ').trim();
    const q = s => { try { return doc.querySelector(s); } catch (e) { return null; } };
    const text = tidy(doc.body ? doc.body.textContent : '');
    const what = r.refused ? 'the server is not running (it crashed while starting, or app.listen() was not called)'
      : r.timeout ? 'no response after 1.5 s (a middleware did not call next(), or the route never sent a response)'
      : r.status + ' ' + (STATUS_TEXT[r.status] || '') + (text ? ': “' + (text.length > 90 ? text.slice(0, 90) + '…' : text) + '”' : ' (empty page)');
    return Object.assign({}, r, {
      method, url, data, doc, text, location: (r.headers || {}).location || null, type: (r.headers || {})['content-type'] || '',
      json: (() => { try { return /json/i.test((r.headers || {})['content-type'] || '') ? JSON.parse(r.body) : undefined; } catch (e) { return undefined; } })(),
      q, qa: s => { try { return [...doc.querySelectorAll(s)]; } catch (e) { return []; } },
      has: s => !!q(s),
      textOf: s => { const e = q(s); return e ? tidy(e.textContent) : ''; },
      attr: (s, n) => { const e = q(s); return e ? e.getAttribute(n) : null; },
      desc: method + ' ' + url + ' → ' + what
    });
  }
  const STATUS_TEXT = { 200: 'OK', 201: 'Created', 204: 'No Content', 301: 'Moved Permanently', 302: 'Found', 303: 'See Other', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 500: 'Internal Server Error' };

  function makeContext(wide, narrow, src, opts) {
    const doc = wide.contentDocument, win = wide.contentWindow;
    const ndoc = narrow.contentDocument, nwin = narrow.contentWindow;
    const { out: rules, media } = flatRules(doc);
    const lab = win.__lab || { errors: [], logs: [], warnings: [] };
    lab.warnings = (lab.warnings || []).filter(w => !IGNORE.some(re => re.test(w)));
    const c = {
      doc, win, ndoc, nwin, src,
      /* the student's code without comments, for text checks (starter comments often contain the very words you look for) */
      code: {
        html: (src.html || '').replace(/<!--[\s\S]*?-->/g, ''),
        css: (src.css || '').replace(/\/\*[\s\S]*?\*\//g, ''),
        js: (src.js || '').replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'`\\])\/\/.*$/gm, '$1')
      },
      /* ---- HTML ---- */
      q: s => { try { return doc.querySelector(s); } catch (e) { return null; } },
      qa: s => { try { return [...doc.querySelectorAll(s)]; } catch (e) { return []; } },
      has: s => !!c.q(s),
      text: s => { const e = c.q(s); return e ? e.textContent.trim().replace(/\s+/g, ' ') : ''; },
      attr: (s, n) => { const e = c.q(s); return e ? e.getAttribute(n) : null; },
      /* ---- CSS and layout ---- */
      cs: (s, p) => { const e = c.q(s); return e ? win.getComputedStyle(e).getPropertyValue(p).trim() : '(element not found)'; },
      csN: (s, p) => { let e = null; try { e = ndoc.querySelector(s); } catch (x) {} return e ? nwin.getComputedStyle(e).getPropertyValue(p).trim() : '(element not found)'; },
      rect: s => { const e = c.q(s); return e ? e.getBoundingClientRect() : { width: 0, height: 0, top: 0, bottom: 0, left: 0, right: 0 }; },
      rectN: s => { let e = null; try { e = ndoc.querySelector(s); } catch (x) {} return e ? e.getBoundingClientRect() : { width: 0, height: 0, top: 0, bottom: 0, left: 0, right: 0 }; },
      px: v => parseFloat(v) || 0,
      rules: () => rules,
      media: () => media,
      /* ---- JavaScript ---- */
      errors: lab.errors,                       // runtime errors (and JSX syntax errors) while the page ran
      logs: lab.logs,                           // everything passed to console.log
      warnings: lab.warnings,                   // console.error / console.warn, e.g. React's "unique key" warning
      fn: name => typeof win[name] === 'function',
      call: (name, ...args) => { if (typeof win[name] !== 'function') throw new Error('no function named ' + name); return win[name](...args); },
      click: s => { const e = typeof s === 'string' ? c.q(s) : s; if (!e) return false; e.click(); return true; },
      /* sets the value the way a user does, so React's onChange fires on controlled inputs */
      type: (s, v) => {
        const e = typeof s === 'string' ? c.q(s) : s; if (!e) return false;
        const d = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(e), 'value');
        if (d && d.set) d.set.call(e, v); else e.value = v;
        e.dispatchEvent(new win.Event('input', { bubbles: true })); e.dispatchEvent(new win.Event('change', { bubbles: true }));
        return true;
      },
      submit: s => { const f = c.q(s || 'form'); if (!f) return false; f.dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true })); return true; },
      /* wait for re-renders, effects, and timers: tests that use it must be async and await it */
      settle: (ms = 60) => sleep(ms),
      /* the element the code last called .focus() on (or the active element) */
      focused: () => (win.__lab && win.__lab.focused) || doc.activeElement,
      /* ---- console programs (prompt, Math.random) ---- */
      prompts: lab.prompts || [],               // every prompt()/confirm() the page asked: [{ q, a }]
      term: lab.term || [],                     // the console in order: logs, ▸ prompts, △ warnings, ⚠ errors
      /* a global variable of the student's script, const/let included (they are not window properties) */
      val: name => { try { return { ok: true, value: win.eval(name) }; } catch (e) { return { ok: false, error: e.message }; } },
      /* answers for the next prompt() calls and fixed Math.random values, e.g. before c.call('playGame') */
      answers: (...a) => { if (win.__lab) win.__lab.answers = a.flat().map(String); },
      random: (...r) => { const R = r.flat(); let i = 0; win.Math.random = () => R[i++ % R.length]; },
      /* run the whole program again in the desktop frame with other answers / random numbers, or with changed code
         ({ answers: ['Sam', '5'], random: [0], js: patched }); returns a new context (use it, not c, afterwards). */
      rerun: async (o = {}) => {
        const o2 = Object.assign({}, opts || {}, o, { view: false });
        await load(wide, compose(src.html, src.css, o.js != null ? o.js : src.js, o2)); await settleRender(wide);
        return makeContext(wide, narrow, src, o2);
      },
      /* ---- result ---- */
      ok: (ok, found) => ({ ok: !!ok, found })
    };
    if (EXPRESS) {
      const S = win.__labServer;
      const body = d => d == null ? null : typeof d === 'string' ? d : new URLSearchParams(d).toString();
      Object.assign(c, {
        server: S,
        listening: () => !!(S && S.app),
        /* send one request to the student's server; data (object or 'a=1&b=2') is sent as a submitted form */
        request: async (method, url, data, headers) => {
          if (!S) return response(method, url, { status: 0, refused: true, headers: {}, body: '' }, data);
          const b = body(data);
          return response(method, url, await S.request({ method, url, body: b, headers: Object.assign(b != null ? { 'content-type': 'application/x-www-form-urlencoded' } : {}, headers || {}) }), data);
        },
        get: url => c.request('GET', url),
        post: (url, data) => c.request('POST', url, data == null ? {} : data),
        /* REST APIs: send an object as a JSON body (Content-Type: application/json); r.json is the parsed reply */
        send: (method, url, obj) => c.request(method, url, obj == null ? null : JSON.stringify(obj), obj == null ? {} : { 'content-type': 'application/json' }),
        /* the server's middleware and routes, in order: [{ method: 'GET' | 'USE' | …, path, error }] */
        routes: () => S && S.app && S.app._router ? S.app._router.stack.map(l => ({ method: l.method || 'USE', path: l.path, error: l.fn.length === 4, params: l.fn.length })) : []
      });
    }
    return c;
  }

  /* Tags that must be closed explicitly; a mismatch usually means a missing end tag. */
  const PAIRED = ['header', 'nav', 'main', 'section', 'article', 'aside', 'footer', 'div', 'ul', 'ol', 'form', 'fieldset',
                  'select', 'textarea', 'video', 'audio', 'blockquote', 'a', 'h1', 'h2', 'h3', 'button', 'label', 'p', 'li', 'table', 'script'];
  function lintHtml(html) {
    const clean = html.replace(/<!--[\s\S]*?-->/g, '');
    const notes = [];
    for (const t of PAIRED) {
      const open = (clean.match(new RegExp('<' + t + '(\\s[^>]*)?>', 'gi')) || []).length;
      const close = (clean.match(new RegExp('</' + t + '\\s*>', 'gi')) || []).length;
      if (open > close && !(t === 'li' || t === 'p')) notes.push('`<' + t + '>` is opened ' + open + '× but closed ' + close + '×: check for a missing `</' + t + '>`.');
      else if (close > open) notes.push('`</' + t + '>` appears ' + close + '× but `<' + t + '>` only ' + open + '×: check for an extra closing tag.');
    }
    if (/<img(?![^>]*\balt=)[^>]*>/i.test(clean)) notes.push('An `<img>` has no `alt` attribute.');
    return notes;
  }
  function lintCss(css) {
    const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const notes = [];
    const o = (clean.match(/{/g) || []).length, cl = (clean.match(/}/g) || []).length;
    if (o !== cl) notes.push('Your CSS has ' + o + ' `{` but ' + cl + ' `}`: a rule is not closed, so the rules after it may be ignored.');
    for (const body of clean.match(/{[^{}]*}/g) || []) {
      const lines = body.slice(1, -1).split('\n').map(l => l.trim()).filter(Boolean);
      for (let i = 0; i < lines.length - 1; i++) {
        if (/^[a-z-]+\s*:/i.test(lines[i]) && !/;$/.test(lines[i]) && /^[a-z-]+\s*:/i.test(lines[i + 1])) {
          notes.push('A semicolon is missing after `' + lines[i] + '`, so the next declaration is ignored too.');
        }
      }
    }
    if (/:\s*#[0-9a-f]{1,2}(?![0-9a-f])/i.test(clean) || /:\s*#[0-9a-f]{4,5}(?![0-9a-f])/i.test(clean)) notes.push('A colour like `#3B26` has the wrong number of digits; use 3 or 6 hex digits.');
    return notes;
  }
  function lintJs(js, errors, warnings) {
    const notes = [];
    if (JSX) { const r = compile(js); if (r.error) notes.push('Your code has a syntax error: ' + r.error.replace(/^SyntaxError: /, '') + '. Nothing in the file runs until it is fixed.'); }
    else { try { new Function(EXPRESS ? ExpressLab.transform(js) : js); } catch (e) { notes.push('Your JavaScript has a syntax error: ' + e.message + '. Nothing in the file runs until it is fixed.'); } }
    for (const e of (errors || []).filter(e => !/^SyntaxError/.test(e)).slice(0, 3)) notes.push((EXPRESS ? 'Your server reported an error: `' : 'When the page ran, the browser reported: `') + e + '`.');
    if (!EXPRESS) for (const w of [...new Set(warnings || [])].slice(0, 2)) notes.push('The console showed a warning: `' + w.replace(/\s+/g, ' ').slice(0, 220) + '`.');
    return notes;
  }

  let frames = null;
  function getFrames() {
    if (!frames) frames = { wide: frame(DESK), narrow: frame(PHONE) };
    return frames;
  }

  /* Grade one activity. files = { html, css, js } (or { py } in a Python lab). Returns { score, earned, total, results, lint } */
  async function grade(activity, files) {
    if (CFG.python) return PyLab.grade(activity, files);
    const { wide, narrow } = getFrames();
    const opts = EXPRESS ? undefined : io(activity);
    const src = compose(files.html, files.css, files.js, opts);
    await Promise.all([load(wide, src), load(narrow, src)]);
    await Promise.all([settleRender(wide), settleRender(narrow)]);
    const c = makeContext(wide, narrow, { html: files.html || '', css: files.css || '', js: files.js || '' }, opts);
    let earned = 0, total = 0;
    const results = [];
    for (const ch of activity.checks) {           // in order: interaction checks change the page
      total += ch.pts;
      let r;
      try { r = await ch.test(c); } catch (e) { r = { ok: false, found: 'could not check (' + e.message + ')' }; }
      if (typeof r === 'boolean') r = { ok: r, found: r ? '' : 'not found' };
      if (r.ok) earned += ch.pts;
      results.push({ check: ch, ok: r.ok, found: r.found || '' });
    }
    const lint = activity.edit === 'html' ? lintHtml(files.html || '') : activity.edit === 'css' ? lintCss(files.css || '') : lintJs(files.js || '', c.errors, c.warnings);
    /* tips: unscored suggestions (activity.tips = [c => 'advice' or null]), e.g. where code is better placed */
    const tips = [];
    for (const t of activity.tips || []) { try { const m = await t(c); if (m) tips.push(m); } catch (e) {} }
    return { score: Math.round(100 * earned / total), earned, total, results, lint, tips };
  }

  return { grade, compose, compile, io, guardLoops, lintHtml, lintCss, lintJs, NAMES, IGNORE };
})();
