/*
   Express labs (LAB.express = true): students write server.js, an Express 5 server, and it runs in the
   browser. There is no Node here: `runtime` is a small Express look-alike (app.use/get/post, Router,
   req.params/query/body, express.urlencoded/json, res.status/send/redirect/json, error middleware, and
   Express's own 404 and 500 pages), and `shell` is a mini browser (address bar, status badge, links and
   forms routed to the server). Both functions are inlined into the preview page with toString(), so they
   must stay self-contained. checker.js composes the page (compose) and gives checks c.get / c.post.
   See "Express labs" in references/authoring-activities.md.
*/
const ExpressLab = (() => {
  /* ---------------------------------------------------------------- the Express look-alike (runs in the preview page) */
  function runtime() {
    const W = window;
    const STATUS = { 200: 'OK', 201: 'Created', 204: 'No Content', 301: 'Moved Permanently', 302: 'Found', 303: 'See Other', 304: 'Not Modified',
      307: 'Temporary Redirect', 308: 'Permanent Redirect', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found',
      405: 'Method Not Allowed', 409: 'Conflict', 418: "I'm a Teapot", 422: 'Unprocessable Entity', 500: 'Internal Server Error', 503: 'Service Unavailable' };
    const escHtml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const server = W.__labServer = { app: null, port: null, STATUS };
    /* the terminal: console.log / console.error and unhandled errors, in the order they happened */
    const term = W.__lab.term = [];
    ['log', 'info', 'error', 'warn'].forEach(k => {
      const orig = console[k];
      console[k] = function (...a) {
        try { term.push((k === 'error' || k === 'warn' ? '! ' : '') + a.map(x => typeof x === 'string' ? x : x instanceof Error ? x.stack.split('\n')[0] : (() => { try { return JSON.stringify(x); } catch (e) { return String(x); } })()).join(' ')); } catch (e) {}
        return orig.apply(console, a);
      };
    });
    W.addEventListener('error', e => term.push('⚠ ' + (W.__lab.errors[W.__lab.errors.length - 1] || e.message)));

    /* stack frames inside the student's script → "server.js:LINE:COL"; frames from this runtime are dropped */
    function frames(err) {
      const s = W.__labJsStart, n = W.__labJsLines || 1e9, out = [];
      String(err && err.stack || '').split('\n').forEach(l => {
        const m = l.match(/about:srcdoc:(\d+):(\d+)/);
        if (m && s && +m[1] >= s && +m[1] < s + n) out.push({ fn: (l.match(/at\s+([^\s(]+)\s+\(/) || [])[1], line: +m[1] - s + 1, col: +m[2] });
      });
      return out;
    }
    function stackText(err) {
      if (!(err instanceof Error)) return String(err);
      const head = String(err.stack || '').split('\n')[0] || (err.name + ': ' + err.message);
      return [head].concat(frames(err).map(f => '    at ' + (f.fn && !/^(eval|Object\.<anonymous>)$/.test(f.fn) ? f.fn + ' (server.js:' + f.line + ':' + f.col + ')' : 'server.js:' + f.line + ':' + f.col))).join('\n');
    }
    /* Express prints every error nobody handled to the terminal (stderr) */
    function report(err, req) {
      const f = frames(err)[0], head = err instanceof Error ? String(err.stack || '').split('\n')[0] || err.message : String(err);
      const line = head + (f ? ' (server.js line ' + f.line + ')' : '') + (req ? ' while handling ' + req.method + ' ' + req.originalUrl : '');
      W.__lab.errors.push(line); term.push('⚠ ' + line);
    }
    function headersSent() {
      const e = new Error('Cannot set headers after they are sent to the client');
      e.code = 'ERR_HTTP_HEADERS_SENT'; e.stack = String(e.stack).replace(/^Error/, 'Error [ERR_HTTP_HEADERS_SENT]');
      return e;
    }

    /* Express 5 paths (path-to-regexp 8): /menu/:id, /files/*rest, optional {/:part}. "*" alone and "(" are errors in Express 5. */
    function compilePath(path, end) {
      if (typeof path !== 'string') throw new TypeError('path must be a string, got ' + typeof path);
      const keys = []; let src = '';
      for (let i = 0; i < path.length; i++) {
        const ch = path[i];
        if (ch === ':' || ch === '*') {
          const m = path.slice(i + 1).match(/^[A-Za-z_$][\w$]*/);
          if (!m) throw new TypeError('Missing parameter name at index ' + (i + 1) + ': ' + path + '; visit https://git.new/pathToRegexpError for info');
          keys.push({ name: m[0], splat: ch === '*' });
          src += ch === ':' ? '([^/]+?)' : '(.+)';
          i += m[0].length;
        } else if (ch === '{') src += '(?:';
        else if (ch === '}') src += ')?';
        else if ('()[]?+!'.includes(ch)) throw new TypeError('Unexpected ' + ch + ' at index ' + i + ': ' + path + '; visit https://git.new/pathToRegexpError for info');
        else src += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }
      if (!end) src = src.replace(/\/$/, '');
      return { keys, re: new RegExp('^' + src + (end ? '\\/?$' : '(?=\\/|$)'), 'i') };
    }
    const pathOf = url => String(url).split(/[?#]/)[0] || '/';
    const decode = v => { try { return decodeURIComponent(v); } catch (e) { return v; } };
    function parseQuery(s, nested) {
      const q = {};
      String(s || '').replace(/^\?/, '').split('&').forEach(part => {
        if (!part) return;
        const i = part.indexOf('=');
        let k = decode((i < 0 ? part : part.slice(0, i)).replace(/\+/g, ' ')); const v = i < 0 ? '' : decode(part.slice(i + 1).replace(/\+/g, ' '));
        const m = nested && k.match(/^([^[\]]+)\[([^[\]]*)\]$/);
        if (m) { if (m[2] === '') { q[m[1]] = [].concat(q[m[1]] || [], v); return; } q[m[1]] = q[m[1]] && typeof q[m[1]] === 'object' ? q[m[1]] : {}; q[m[1]][m[2]] = v; return; }
        if (Object.prototype.hasOwnProperty.call(q, k)) q[k] = [].concat(q[k], v); else q[k] = v;
      });
      return q;
    }

    function Router() {
      const stack = [];
      const router = function (req, res, out) { handle(req, res, out); };
      router.stack = stack;
      const add = (method, end, path, fns) => {
        fns = fns.flat(Infinity);
        if (!fns.length) throw new TypeError((method ? 'app.' + method.toLowerCase() : 'app.use') + '() requires a callback function');
        for (const fn of fns) {
          if (typeof fn !== 'function') throw new TypeError((method ? 'Route.' + method.toLowerCase() : 'app.use') + '() requires a callback function but got a ' + Object.prototype.toString.call(fn));
          const c = compilePath(path, end);
          stack.push({ method, path, re: c.re, keys: c.keys, fn });
        }
      };
      router.use = function (...a) { const path = typeof a[0] === 'string' ? a.shift() : '/'; add(null, false, path, a); return router; };
      ['get', 'post', 'put', 'delete', 'patch', 'all'].forEach(m => {
        router[m] = function (path, ...fns) {
          if (typeof path !== 'string') throw new TypeError('app.' + m + '() needs a path first, e.g. app.' + m + "('/', (req, res) => { … })");
          add(m.toUpperCase(), true, path, fns); return router;
        };
      });
      function handle(req, res, out) {
        let idx = 0;
        const url0 = req.url, base0 = req.baseUrl || '';
        function next(err) {
          req.url = url0; req.baseUrl = base0;
          if (err === 'router') return out && out();
          if (err === 'route') err = undefined;
          while (idx < stack.length) {
            const L = stack[idx++];
            if (L.method && L.method !== 'ALL' && L.method !== req.method) continue;
            const m = L.re.exec(pathOf(req.url));
            if (!m) continue;
            const isErr = L.fn.length === 4;
            if (!!err !== isErr) continue;
            if (L.method) {
              const p = {};
              L.keys.forEach((k, j) => { if (m[j + 1] !== undefined) p[k.name] = k.splat ? m[j + 1].split('/').map(decode) : decode(m[j + 1]); });
              req.params = p;
            } else if (m[0] && m[0] !== '/') {
              req.baseUrl = base0 + m[0];
              req.url = req.url.slice(m[0].length) || '/';
              if (req.url[0] !== '/') req.url = '/' + req.url;
            }
            try {
              const r = isErr ? L.fn(err, req, res, next) : L.fn(req, res, next);
              if (r && typeof r.then === 'function') r.then(null, e => next(e || new Error('Rejected promise')));   // Express 5 catches async errors
            } catch (e) { next(e); }
            return;
          }
          if (out) out(err);
        }
        next();
      }
      return router;
    }

    function finalhandler(err, req, res) {
      if (err) report(err, req);
      if (res.headersSent) return;
      const code = err ? (err.status >= 400 && err.status < 600 ? err.status : err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 500) : 404;
      const msg = err ? escHtml(stackText(err)).replace(/\n/g, '<br>').replace(/ {2}/g, ' &nbsp;') : 'Cannot ' + escHtml(req.method) + ' ' + escHtml(pathOf(req.originalUrl));
      res.statusCode = code;
      res._headers = { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': "default-src 'none'", 'x-content-type-options': 'nosniff' };
      res._finish('<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Error</title>\n</head>\n<body>\n<pre>' + msg + '</pre>\n</body>\n</html>\n');
    }

    const TYPES = { html: 'text/html; charset=utf-8', text: 'text/plain; charset=utf-8', txt: 'text/plain; charset=utf-8', json: 'application/json; charset=utf-8', css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8', xml: 'application/xml' };
    function makeRes(req, done) {
      const res = { statusCode: 200, headersSent: false, finished: false, writableEnded: false, locals: {}, _headers: { 'x-powered-by': 'Express' }, req };
      res.status = code => {
        if (!Number.isInteger(code) || code < 100 || code > 999) throw new RangeError('Invalid status code: ' + JSON.stringify(code) + '. Status code must be an integer.');
        res.statusCode = code; return res;
      };
      res.set = res.header = (k, v) => {
        if (k && typeof k === 'object') { Object.keys(k).forEach(x => res.set(x, k[x])); return res; }
        if (res.headersSent) throw headersSent();
        res._headers[String(k).toLowerCase()] = String(v); return res;
      };
      res.get = k => res._headers[String(k).toLowerCase()];
      res.append = (k, v) => { const o = res.get(k); return res.set(k, o ? o + ', ' + v : v); };
      res.type = res.contentType = t => res.set('content-type', String(t).includes('/') ? t : TYPES[String(t).replace(/^\./, '')] || t);
      res.location = u => res.set('location', u);
      res.cookie = (n, v) => res.append('set-cookie', n + '=' + encodeURIComponent(typeof v === 'object' ? 'j:' + JSON.stringify(v) : v) + '; Path=/');
      res.clearCookie = n => res.append('set-cookie', n + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
      res.send = body => {
        if (body !== null && typeof body === 'object' || typeof body === 'number' || typeof body === 'boolean') return res.json(body);
        if (res.headersSent) throw headersSent();
        if (!res.get('content-type')) res._headers['content-type'] = 'text/html; charset=utf-8';
        res._finish(body == null ? '' : String(body));
        return res;
      };
      res.json = obj => {
        if (res.headersSent) throw headersSent();
        if (!res.get('content-type')) res._headers['content-type'] = 'application/json; charset=utf-8';
        return res.send(JSON.stringify(obj === undefined ? null : obj));
      };
      res.sendStatus = code => { res.status(code); res.type('text'); return res.send(STATUS[code] || String(code)); };
      res.redirect = (a, b) => {
        let code = 302, url = a;
        if (typeof a === 'number') { code = a; url = b; }
        res.location(url); res.statusCode = code; res.type('html');
        return res.send('<!DOCTYPE html><head><title>' + (STATUS[code] || 'Redirecting') + '</title></head><body><p>' + (STATUS[code] || 'Redirecting') + '. Redirecting to ' + escHtml(url) + '</p></body>');
      };
      res.end = data => { if (res.writableEnded) return res; res._finish(data == null ? '' : String(data)); return res; };
      res.render = () => { throw new Error('No default engine was specified and no extension was provided.'); };
      res.sendFile = () => { throw new Error('res.sendFile() is not available in this lab: build the HTML with a template literal and send it with res.send().'); };
      res.download = res.sendFile;
      res._finish = body => {
        if (res.writableEnded) throw headersSent();
        res.headersSent = res.finished = res.writableEnded = true;
        done({ status: res.statusCode, headers: Object.assign({}, res._headers), body });
      };
      return res;
    }

    function makeReq(method, url, raw, headers) {
      const h = { host: 'localhost:' + (server.port || 3000), 'user-agent': 'Mozilla/5.0 (Code Lab browser)', accept: 'text/html' };
      Object.keys(headers || {}).forEach(k => { h[k.toLowerCase()] = String(headers[k]); });
      if (raw != null) h['content-length'] = String(raw.length);
      const req = { method, url, originalUrl: url, baseUrl: '', headers: h, params: {}, body: undefined, _raw: raw,
        protocol: 'http', secure: false, hostname: 'localhost', ip: '::1', ips: [], subdomains: [], xhr: false, cookies: {} };
      Object.defineProperty(req, 'path', { get: () => pathOf(req.url), enumerable: true });
      Object.defineProperty(req, 'query', { get: () => parseQuery(req.url.split('?').slice(1).join('?').split('#')[0]), enumerable: true });
      req.get = req.header = n => { n = String(n).toLowerCase(); return n === 'referer' || n === 'referrer' ? h.referer || h.referrer : h[n]; };
      req.is = t => { const ct = h['content-type'] || ''; return ct.includes(t === 'urlencoded' ? 'x-www-form-urlencoded' : t === 'json' ? 'json' : t) ? t : false; };
      return req;
    }

    /* body parsers: like Express 5, req.body stays undefined unless a parser for the request's type ran */
    const parser = (test, parse) => (opts = {}) => function bodyParser(req, res, next) {
      if (req._parsed || req._raw == null || !test(req.headers['content-type'] || '')) return next();
      req._parsed = true;
      try { req.body = parse(req._raw, opts); } catch (e) { e.status = 400; return next(e); }
      next();
    };

    function createApplication() {
      const router = Router(), settings = { env: 'development', 'x-powered-by': true };
      const app = function (req, res, next) { router(req, res, next); };
      app.locals = {}; app.settings = settings; app.router = app._router = router;
      app.use = (...a) => { router.use(...a); return app; };
      ['post', 'put', 'delete', 'patch', 'all'].forEach(m => { app[m] = (...a) => { router[m](...a); return app; }; });
      app.get = (...a) => { if (a.length === 1 && typeof a[0] === 'string') return settings[a[0]]; router.get(...a); return app; };
      app.set = (k, v) => { if (v === undefined) return settings[k]; settings[k] = v; return app; };
      app.enable = k => app.set(k, true); app.disable = k => app.set(k, false);
      app.enabled = k => !!settings[k]; app.disabled = k => !settings[k];
      app.engine = () => app;
      app.render = () => { throw new Error('No default engine was specified and no extension was provided.'); };
      app.handle = (req, res) => router(req, res, err => finalhandler(err, req, res));
      app.listen = (...a) => {
        const cb = a.find(x => typeof x === 'function');
        server.app = app; server.port = typeof a[0] === 'number' || typeof a[0] === 'string' ? a[0] : 3000;
        const srv = { close(f) { if (server.app === app) server.app = null; if (f) f(); return srv; }, address() { return { port: +server.port || 3000, address: '::', family: 'IPv6' }; }, on() { return srv; }, once() { return srv; } };
        setTimeout(() => { try { if (cb) cb.call(srv); } catch (e) { report(e); } }, 0);
        return srv;
      };
      return app;
    }

    const express = createApplication;
    express.Router = Router;
    express.urlencoded = parser(t => /x-www-form-urlencoded/i.test(t), (raw, o) => parseQuery(raw, !!o.extended));
    express.json = parser(t => /json/i.test(t), raw => raw.trim() ? JSON.parse(raw) : {});
    express.text = parser(t => /^text\//i.test(t), raw => raw);
    express.raw = parser(() => false, raw => raw);
    express.static = () => function serveStatic(req, res, next) { next(); };   // no files on disk in this lab
    express.default = express;

    const path = {
      sep: '/',
      join: (...p) => p.join('/').replace(/\/+/g, '/').replace(/\/\.\//g, '/'),
      resolve: (...p) => '/' + p.join('/').replace(/\/+/g, '/').replace(/^\//, ''),
      dirname: p => String(p).replace(/\/[^/]*$/, '') || '/',
      basename: (p, ext) => { const b = String(p).split('/').pop(); return ext && b.endsWith(ext) ? b.slice(0, -ext.length) : b; },
      extname: p => (String(p).split('/').pop().match(/\.[^.]*$/) || [''])[0]
    };
    path.default = path;
    const modules = { express, path };
    W.__require = name => {
      const n = String(name).replace(/^node:/, '');
      if (modules[n]) return modules[n];
      const e = new Error("Cannot find module '" + name + "' (this lab can only import express)"); e.code = 'MODULE_NOT_FOUND'; throw e;
    };
    W.__module = { exports: {} };
    W.__process = { env: {}, argv: ['node', 'server.js'], platform: 'browser', version: 'v24.0.0', versions: { node: '24.0.0' }, exit() {}, on() {}, cwd: () => '/app' };

    /* one request in, one response out: { status, headers, body }, or { status: 0, refused | timeout } */
    server.request = (o = {}) => new Promise(resolve => {
      const app = server.app;
      if (!app) { resolve({ status: 0, refused: true, headers: {}, body: '' }); return; }
      let done = false;
      const timer = setTimeout(() => { if (!done) { done = true; resolve({ status: 0, timeout: true, headers: {}, body: '' }); } }, o.timeout || 1500);
      const req = makeReq((o.method || 'GET').toUpperCase(), o.url || '/', o.body == null ? null : String(o.body), o.headers);
      const res = makeRes(req, r => { if (!done) { done = true; clearTimeout(timer); resolve(r); } });
      req.res = res; req.app = res.app = app;
      try { app.handle(req, res); } catch (e) { finalhandler(e, req, res); }
    });
  }

  /* ---------------------------------------------------------------- the mini browser (runs in the preview page) */
  function shell() {
    const W = window, S = W.__labServer, D = document;
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const host = () => 'localhost:' + (S.port || 3000);
    D.body.insertAdjacentHTML('afterbegin',
      '<div class="lb-bar">' +
        '<button type="button" class="lb-btn" id="lbBack" title="Back" aria-label="Back">&#8592;</button>' +
        '<button type="button" class="lb-btn" id="lbReload" title="Reload" aria-label="Reload">&#8635;</button>' +
        (W.__labApi ? '<select class="lb-method" id="lbMethod" aria-label="HTTP method"><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option></select>' : '') +
        '<form class="lb-url" id="lbForm"><span class="lb-host" id="lbHost">http://localhost:3000</span><input id="lbInput" value="/" aria-label="Address" spellcheck="false" autocomplete="off"></form>' +
        (W.__labApi ? '<button type="button" class="lb-send" id="lbSend">Send</button>' : '') +
        '<span class="lb-status" id="lbStatus" title="HTTP status code">…</span>' +
      '</div>' +
      (W.__labApi ? '<div class="lb-body" id="lbBodyBox" hidden><label for="lbBody">Body (JSON) sent with the request</label>' +
        '<textarea id="lbBody" spellcheck="false" rows="4">{\n  \n}</textarea></div>' : '') +
      '<div class="lb-routes" id="lbRoutes"></div>' +
      '<iframe class="lb-view" id="lbView" title="The page your server sent"></iframe>');
    const $ = id => D.getElementById(id);
    const view = $('lbView'), input = $('lbInput'), badge = $('lbStatus');
    let cur = '/', last = null;
    const history = [];

    const resolve = href => { try { const u = new URL(href, 'http://' + host() + (cur[0] === '/' ? cur : '/' + cur)); return u.host === host() ? u.pathname + u.search : null; } catch (e) { return null; } };

    async function go(method, url, body, push, type) {
      badge.textContent = '…'; badge.className = 'lb-status';
      let r = await S.request({ method, url, body, headers: body != null ? { 'content-type': type || 'application/x-www-form-urlencoded' } : {} });
      for (let hops = 0; r.status >= 300 && r.status < 400 && r.headers.location && hops < 5; hops++) {   // browsers follow redirects
        url = resolve(r.headers.location) || '/';
        if (r.status !== 307 && r.status !== 308) { method = 'GET'; body = null; }
        r = await S.request({ method, url, body });
      }
      if (push && url !== cur) history.push(cur);
      cur = url; last = { method, url, r, body, type };
      if (method === 'GET') W.__labPath = url;
      input.value = url;
      $('lbHost').textContent = 'http://' + host();
      show(method, url, r);
      routes();
    }
    function show(method, url, r) {
      let doc;
      if (r.refused) {
        badge.textContent = 'no server'; badge.className = 'lb-status bad';
        doc = page('This site can’t be reached', '<b>localhost</b> refused to connect. The server is not running: it crashed while starting (see the terminal below) or <code>app.listen()</code> was never called.');
      } else if (r.timeout) {
        badge.textContent = 'no response'; badge.className = 'lb-status bad';
        doc = page('localhost didn’t send a response', 'The browser is still waiting for <b>' + esc(method + ' ' + url) + '</b>. A middleware did not call <code>next()</code>, or the route never called <code>res.send()</code>.');
      } else {
        badge.textContent = r.status + ' ' + (S.STATUS[r.status] || '');
        badge.className = 'lb-status ' + (r.status < 300 ? 'ok' : r.status < 400 ? 'redirect' : r.status < 500 ? 'warn' : 'bad');
        const type = r.headers['content-type'] || '';
        if (W.__labApi && !/html/i.test(type)) {
          let text = r.body;
          if (/json/i.test(type)) { try { text = JSON.stringify(JSON.parse(r.body), null, 2); } catch (e) {} }
          const head = '<div style="padding:8px 12px;border-bottom:1px solid #e3e6ea;font:12px ui-monospace,Menlo,Consolas,monospace;color:#5f6368">' +
            esc(method + ' ' + url) + ' &rarr; <b>' + r.status + ' ' + esc(S.STATUS[r.status] || '') + '</b>' + (type ? ' &middot; Content-Type: ' + esc(type) : '') + '</div>';
          doc = head + (text ? '<pre style="margin:0;padding:12px;font:13px/1.5 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap">' + esc(text) + '</pre>'
            : '<p style="margin:0;padding:12px;font:italic 13px system-ui,sans-serif;color:#80868b">(no body' + (r.status === 204 ? ': 204 No Content' : '') + ')</p>');
        } else if (/html/i.test(type)) doc = r.body;
        else {
          let text = r.body;
          if (/json/i.test(type)) { try { text = JSON.stringify(JSON.parse(r.body), null, 2); } catch (e) {} }
          doc = '<pre style="margin:0;padding:12px;font:13px/1.5 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap">' + esc(text) + '</pre>';
        }
      }
      view.srcdoc = doc;
    }
    const page = (h, p) => '<div style="font:15px/1.5 system-ui,sans-serif;color:#3c4043;padding:28px 32px"><div style="font-size:42px">&#9888;&#65039;</div><h1 style="font-size:22px;font-weight:500;margin:6px 0 10px">' + h + '</h1><p style="margin:0;max-width:560px">' + p + '</p></div>';

    /* the GET routes the server knows (handy links; a :param route fills the address bar) */
    function routes() {
      const box = $('lbRoutes');
      const stack = S.app && S.app._router ? S.app._router.stack : [];
      const list = W.__labApi ? stack.filter(l => l.method && l.method !== 'USE').map(l => (l.method === 'ALL' ? 'GET' : l.method) + ' ' + l.path)
        : stack.filter(l => l.method === 'GET' || l.method === 'ALL').map(l => l.path);
      const uniq = [...new Set(list)];
      box.innerHTML = uniq.length ? '<span>Routes:</span>' + uniq.map(p => '<button type="button" data-path="' + esc(p) + '">' + esc(p) + '</button>').join('') : '';
      box.hidden = !uniq.length;
    }
    $('lbRoutes').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      let p = b.dataset.path, m = 'GET';
      if (W.__labApi) { m = p.split(' ')[0]; p = p.slice(m.length + 1); setMethod(m); }
      const i = p.search(/[:*{]/);
      if (i < 0 && m === 'GET') go('GET', p, null, true);
      else { input.value = i < 0 ? p : p.slice(0, i); input.focus(); }
    });
    function setMethod(m) {
      if (!W.__labApi) return;
      $('lbMethod').value = m;
      $('lbBodyBox').hidden = !/^(POST|PUT|PATCH)$/.test(m);
    }
    function send() {
      let v = input.value.trim().replace(/^https?:\/\/[^/]+/i, ''); if (v[0] !== '/') v = '/' + v;
      const m = W.__labApi ? $('lbMethod').value : 'GET';
      if (/^(POST|PUT|PATCH)$/.test(m)) go(m, v, $('lbBody').value, true, 'application/json');
      else go(m, v, null, true);
    }
    $('lbForm').addEventListener('submit', e => { e.preventDefault(); send(); });
    if (W.__labApi) {
      $('lbSend').addEventListener('click', send);
      $('lbMethod').addEventListener('change', e => setMethod(e.target.value));
    }
    $('lbBack').addEventListener('click', () => { if (history.length) go('GET', history.pop(), null, false); });
    $('lbReload').addEventListener('click', () => { if (W.__labApi && last) go(last.method, last.url, last.body, false, last.type); else go('GET', cur, null, false); });

    /* links and forms inside the page go to the server, as in a real browser */
    view.addEventListener('load', () => {
      const d = view.contentDocument; if (!d) return;
      d.addEventListener('click', e => {
        const a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
        const href = a.getAttribute('href'); if (!href || href[0] === '#') return;
        const u = resolve(href);
        e.preventDefault();
        if (u) go('GET', u, null, true); else W.open(a.href, '_blank', 'noopener');
      });
      d.addEventListener('submit', e => {
        const f = e.target; e.preventDefault();
        const method = (f.getAttribute('method') || 'get').toUpperCase() === 'POST' ? 'POST' : 'GET';
        const action = resolve(f.getAttribute('action') || cur) || cur;
        let data;
        try { data = new URLSearchParams(new FormData(f, e.submitter || null)).toString(); } catch (x) { data = new URLSearchParams(new FormData(f)).toString(); }
        if (method === 'GET') go('GET', action.split('?')[0] + (data ? '?' + data : ''), null, true);
        else go('POST', action, data, true);
      });
    });

    /* after app.listen's callback, so the terminal shows "listening" first, as in Node */
    W.__labBrowser = { start: url => setTimeout(() => go('GET', url || '/', null, false), 0), go };
  }

  const css = `html, body { height: 100%; margin: 0; }
body { display: flex; flex-direction: column; background: #fff; font: 13px system-ui, -apple-system, Segoe UI, sans-serif; }
.lb-bar { display: flex; align-items: center; gap: 6px; padding: 6px 8px; background: #dee1e6; border-bottom: 1px solid #c8ccd2; }
.lb-btn { border: 0; background: none; width: 28px; height: 28px; border-radius: 50%; font-size: 16px; color: #3c4043; cursor: pointer; }
.lb-btn:hover { background: #c9ccd1; }
.lb-url { flex: 1; display: flex; align-items: center; background: #fff; border-radius: 16px; padding: 0 12px; height: 30px; min-width: 0; }
.lb-url:focus-within { box-shadow: 0 0 0 2px #1a73e8; }
.lb-host { color: #80868b; white-space: nowrap; }
.lb-url input { flex: 1; min-width: 0; border: 0; outline: 0; font: inherit; color: #202124; padding: 0 0 0 1px; background: transparent; }
.lb-status { font: 700 12px ui-monospace, Menlo, Consolas, monospace; padding: 4px 9px; border-radius: 12px; background: #e8eaed; color: #3c4043; white-space: nowrap; }
.lb-status.ok { background: #e6f4ea; color: #137333; } .lb-status.redirect { background: #e8f0fe; color: #1967d2; }
.lb-status.warn { background: #fef7e0; color: #b06000; } .lb-status.bad { background: #fce8e6; color: #c5221f; }
.lb-routes { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; padding: 4px 10px; background: #f1f3f4; border-bottom: 1px solid #dadce0; color: #5f6368; }
.lb-routes[hidden] { display: none; }
.lb-routes button { font: 12px ui-monospace, Menlo, Consolas, monospace; border: 1px solid #dadce0; background: #fff; border-radius: 10px; padding: 1px 8px; cursor: pointer; color: #1a73e8; }
.lb-routes button:hover { background: #e8f0fe; }
.lb-view { flex: 1; width: 100%; border: 0; background: #fff; }
.lb-method { font: 700 12px ui-monospace, Menlo, Consolas, monospace; height: 30px; border: 0; border-radius: 15px; padding: 0 8px; background: #fff; color: #137333; cursor: pointer; }
.lb-send { font: 700 12px system-ui, sans-serif; height: 30px; border: 0; border-radius: 15px; padding: 0 14px; background: #1a73e8; color: #fff; cursor: pointer; }
.lb-send:hover { background: #1765cc; }
.lb-body { padding: 6px 10px 8px; background: #f8f9fa; border-bottom: 1px solid #dadce0; }
.lb-body[hidden] { display: none; }
.lb-body label { display: block; font-size: 11.5px; color: #5f6368; margin-bottom: 3px; }
.lb-body textarea { width: 100%; box-sizing: border-box; font: 12.5px/1.45 ui-monospace, Menlo, Consolas, monospace; border: 1px solid #dadce0; border-radius: 6px; padding: 6px 8px; resize: vertical; }`;

  /* ES module syntax → what this page can run, keeping every line where it was (error lines stay right). */
  function transform(js) {
    const named = s => s.replace(/\s+as\s+/g, ': ');
    return String(js || '')
      .replace(/^([ \t]*)import\s+([\w$]+)\s*,\s*\{([^}]*)\}\s*from\s*(['"])([^'"]+)\4[ \t]*;?/gm, (m, sp, def, n, q, mod) => sp + 'const ' + def + " = require('" + mod + "'), {" + named(n) + "} = require('" + mod + "');")
      .replace(/^([ \t]*)import\s+\*\s+as\s+([\w$]+)\s+from\s*(['"])([^'"]+)\3[ \t]*;?/gm, "$1const $2 = require('$4');")
      .replace(/^([ \t]*)import\s+([\w$]+)\s+from\s*(['"])([^'"]+)\3[ \t]*;?/gm, "$1const $2 = require('$4');")
      .replace(/^([ \t]*)import\s*\{([^}]*)\}\s*from\s*(['"])([^'"]+)\3[ \t]*;?/gm, (m, sp, n, q, mod) => sp + 'const {' + named(n) + "} = require('" + mod + "');")
      .replace(/^([ \t]*)import\s*(['"])([^'"]+)\2[ \t]*;?/gm, "$1require('$3');")
      .replace(/^([ \t]*)export\s+default\s+/gm, '$1module.exports = ')
      .replace(/^([ \t]*)export\s+(?=(const|let|var|function|class|async)\b)/gm, '$1')
      .replace(/\bimport\.meta\.dirname\b/g, '__dirname').replace(/\bimport\.meta\.filename\b/g, '__filename')
      .replace(/\bimport\.meta\.url\b/g, "'file:///app/server.js'");
  }

  /* The preview page: mini browser + Express look-alike + the student's server.js, wrapped like a Node module.
     A syntax error is reported by the browser itself (the probe maps its line to server.js). */
  function compose(js, opts, probe) {
    const start = (opts && opts.path) || '/';
    const body = '(function (require, module, exports, process, __dirname, __filename) {\'use strict\';' + transform(js) +
      '\n}).call({}, __require, __module, __module.exports, __process, \'/app\', \'/app/server.js\');';
    const doc = '<!DOCTYPE html>\n<html lang="en"><head><meta charset="utf-8">' + probe + '<style>' + css + '</style></head><body>\n' +
      '<script>' + (typeof LAB !== 'undefined' && LAB.apiTester ? 'window.__labApi=true;' : '') + '(' + runtime.toString() + ')();\n(' + shell.toString() + ')();<\/script>\n' +
      '<script>window.__labJsStart=@@LINE@@;window.__labJsLines=' + String(js || '').split('\n').length + ';<\/script>\n' +
      '<script id="lab-js">\n' + body.replace(/<\/script/gi, '<\\/script') + '\n<\/script>\n' +
      '<script>__labBrowser.start(' + JSON.stringify(start) + ');<\/script>\n</body></html>';
    const before = doc.slice(0, doc.indexOf('<script id="lab-js">')).split('\n').length;
    return doc.replace('@@LINE@@', String(before + 1));
  }

  return { runtime, shell, css, transform, compose };
})();
