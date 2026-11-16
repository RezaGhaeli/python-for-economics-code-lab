/*
   Python labs (LAB.python = true): runs the student's code with Pyodide in a Web Worker, so a slow
   model or an endless loop never freezes the page. pylab.js talks to it with messages:
     { cmd: 'init', base, packages, data, prelude }  load Pyodide, packages, and data files
     { cmd: 'run', code }                             run lab.py in a fresh namespace
     { cmd: 'check', cond, found }                    evaluate a check expression in that namespace
     { cmd: 'value', expr }                           evaluate an expression, return it as JSON
*/
let py = null;

const PRELUDE = String.raw`
import sys, io, json, types, base64, traceback, warnings
_LAB = {'ns': {}}

def _lab_name_error(e):
    m = str(e)
    return m.replace("name ", "", 1) if m.startswith("name ") else m

def _lab_run(code):
    ns = {'__name__': '__main__'}
    _LAB['ns'] = ns
    out, err = io.StringIO(), io.StringIO()
    old = sys.stdout, sys.stderr
    sys.stdout, sys.stderr = out, err
    error = line = None
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('default')
            warnings.simplefilter('ignore', DeprecationWarning)        # library internals, not the student's code
            warnings.simplefilter('ignore', PendingDeprecationWarning)
            exec(compile(code, 'lab.py', 'exec'), ns)
    except SyntaxError as e:
        error, line = 'SyntaxError: ' + str(e.msg), e.lineno
    except BaseException as e:
        frames = [f for f in traceback.extract_tb(e.__traceback__) if f.filename == 'lab.py']
        line = frames[-1].lineno if frames else None
        error = type(e).__name__ + (': ' + str(e) if str(e) else '')
    finally:
        sys.stdout, sys.stderr = old
    figs = []
    plt = sys.modules.get('matplotlib.pyplot')
    if plt is not None:
        for n in plt.get_fignums()[:6]:
            buf = io.BytesIO()
            plt.figure(n).savefig(buf, format='png', dpi=80, bbox_inches='tight')
            figs.append(base64.b64encode(buf.getvalue()).decode())
        plt.close('all')
    ns['__figs__'] = len(figs)
    o, e = out.getvalue(), err.getvalue()
    if len(o) > 20000: o = o[:20000] + '\n… (output cut off after 20,000 characters)'
    return json.dumps({'out': o, 'err': e[:4000], 'error': error, 'line': line, 'figs': figs})

def _lab_globals():
    g = dict(_LAB['ns'])
    g['L'] = _L
    return g

def _lab_short(v, n=300):
    s = str(v)
    return s if len(s) <= n else s[:n] + ' …'

def _lab_check(cond, found):
    g = _lab_globals()
    try:
        ok = bool(eval(cond, g))
    except NameError as e:
        return json.dumps({'ok': False, 'found': _lab_name_error(e) + ' (did your code run to the end without an error?)'})
    except Exception as e:
        return json.dumps({'ok': False, 'found': _lab_short(type(e).__name__ + ': ' + str(e))})
    f = ''
    if not ok and found:
        try:
            f = _lab_short(eval(found, g))
        except NameError as e:
            f = _lab_name_error(e)
        except Exception as e:
            f = _lab_short(type(e).__name__ + ': ' + str(e))
    return json.dumps({'ok': ok, 'found': f})

def _lab_json(v):
    try:
        import numpy as np
        if isinstance(v, np.generic): return v.item()
        if isinstance(v, np.ndarray): return v.tolist()
    except ImportError:
        pass
    if hasattr(v, 'to_dict'): return v.to_dict()
    if isinstance(v, (list, tuple, set)): return [_lab_json(x) for x in v]
    if isinstance(v, dict): return {str(k): _lab_json(x) for k, x in v.items()}
    if v is None or isinstance(v, (bool, int, float, str)): return v
    return repr(v)

def _lab_value(expr):
    try:
        return json.dumps({'value': _lab_json(eval(expr, _lab_globals()))})
    except Exception as e:
        return json.dumps({'error': type(e).__name__ + ': ' + str(e)})

_L = types.SimpleNamespace()
`;

async function init(m) {
  importScripts(m.base + 'pyodide.js');
  py = await loadPyodide({ indexURL: m.base });
  if (m.packages && m.packages.length) await py.loadPackage(m.packages);
  for (const url of m.data || []) {
    const r = await fetch(url);
    if (!r.ok) throw new Error('could not load ' + url);
    py.FS.writeFile(url.split('/').pop().split('?')[0], new Uint8Array(await r.arrayBuffer()));
  }
  py.runPython(PRELUDE);
  if (m.prelude) py.runPython(m.prelude);
  return { version: py.runPython('import sys; sys.version.split()[0]') };
}

/* Packages a run needs beyond the preloaded ones (matplotlib, seaborn …), loaded on first use. */
async function needs(code) {
  try { await py.loadPackagesFromImports(code); } catch (e) {}
  if (/^\s*(import|from)\s+seaborn/m.test(code) && !py.runPython("'seaborn' in sys.modules or __import__('importlib.util').util.find_spec('seaborn') is not None")) {
    await py.loadPackage('micropip');
    await py.pyimport('micropip').install('seaborn');
  }
  /* draw off-screen; figures are collected after the run (with or without plt.show(), as in Jupyter) */
  if (/matplotlib|seaborn|\.plot\(/.test(code)) {
    await py.loadPackage('matplotlib');
    py.runPython("import matplotlib\nmatplotlib.use('agg')\nimport matplotlib.pyplot as plt\nplt.show = lambda *a, **k: None");
  }
}

let ready = null;
onmessage = async e => {
  const { id, cmd } = e.data;
  try {
    let out;
    if (cmd === 'init') { ready = init(e.data); out = await ready; }
    else {
      await ready;
      const call = (fn, ...a) => JSON.parse(py.globals.get(fn)(...a));
      if (cmd === 'run') { await needs(e.data.code); out = call('_lab_run', e.data.code); }
      else if (cmd === 'check') out = call('_lab_check', e.data.cond, e.data.found || '');
      else if (cmd === 'value') out = call('_lab_value', e.data.expr);
    }
    postMessage({ id, ok: true, out });
  } catch (err) {
    postMessage({ id, ok: false, error: String(err && err.message || err) });
  }
};
