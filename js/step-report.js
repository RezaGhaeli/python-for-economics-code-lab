/*
   Step report: turns one student's stepwise exam (LAB.exam.tries) into a PDF the student hands in.
   Uses jsPDF (loaded by index.html). The PDF lists each step's trials, the checks, and the code of
   every trial; the submission itself also travels in the PDF's Keywords property ("labdata " + base64
   JSON), so a grading tool can read it back later.

   A submission ("sub"), from app.js swSubmission():
   { v: 1, kind: 'steps', lab: { title, kicker, footer, storageKey, url }, name, sid, idLabel, tries, minutes,
     reportTag, started, finished, auto, steps: [{ id, title, module, topic, file, earned, total, counted,
     trials: [{ earned, total, score, at, code, tips, checks: [{ text, pts, ok, found }] }] }] }
*/
const KIND = typeof LAB !== 'undefined' && LAB.exam && LAB.exam.practice ? 'Lab report' : 'Exam report';   // exam.practice: a practice lab
const StepReport = (() => {
  const plain = s => String(s || '').replace(/`([^`]+)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1');
  /* the PDF's built-in fonts only know Latin-1: map the usual typographic characters, replace the rest */
  const safe = s => String(s == null ? '' : s).replace(/[“”„]/g, '"').replace(/[‘’‚]/g, "'").replace(/[–—]/g, '-').replace(/…/g, '...')
    .replace(/→/g, '->').replace(/←/g, '<-').replace(/[✓✔]/g, 'ok').replace(/[✗✘]/g, 'x').replace(/•/g, '-').replace(/\t/g, '  ')
    .replace(/[^\x0A\x20-\x7E\xA0-\xFF]/g, '?');
  const when = iso => iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
  const dur = (a, b) => { if (!a || !b) return '—'; const s = Math.max(0, Math.round((new Date(b) - new Date(a)) / 1000)); return Math.floor(s / 60) + ' min ' + String(s % 60).padStart(2, '0') + ' s'; };
  const totals = sub => { const e = sub.steps.reduce((s, x) => s + x.earned, 0), t = sub.steps.reduce((s, x) => s + x.total, 0); return { e, t, p: t ? Math.round(100 * e / t) : 0 }; };
  const b64 = str => btoa(unescape(encodeURIComponent(str)));
  const C = { ink: [31, 39, 51], muted: [95, 105, 118], ok: [30, 123, 79], bad: [176, 48, 42], rule: [205, 211, 222], code: [244, 245, 248], head: [235, 240, 247] };

  function pdf(sub) {
    if (!window.jspdf) throw new Error('the PDF library did not load (check the internet connection)');
    const doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'letter' });
    const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 48, CW = W - 2 * M, FOOT = 30;
    let y = M;
    const need = h => { if (y + h > H - M - FOOT) { doc.addPage(); y = M; } };
    const font = (size, style = 'normal', face = 'helvetica', color = C.ink) => { doc.setFont(face, style); doc.setFontSize(size); doc.setTextColor(...color); };
    function text(s, o = {}) {
      const size = o.size || 10, lh = size * 1.3, x = M + (o.indent || 0);
      font(size, o.bold ? 'bold' : 'normal', o.face || 'helvetica', o.color || C.ink);
      for (const line of doc.splitTextToSize(safe(s), o.width || CW - (o.indent || 0))) { need(lh); doc.text(line, x, y + size); y += lh; }
      y += o.gap == null ? 4 : o.gap;
    }
    const rule = (gap = 10) => { need(gap * 2); y += gap / 2; doc.setDrawColor(...C.rule); doc.setLineWidth(0.8); doc.line(M, y, W - M, y); y += gap; };
    function code(src) {
      const size = 7.6, lh = size * 1.32, pad = 6;
      font(size, 'normal', 'courier', C.ink);
      const lines = [];
      String(src || '').replace(/\s+$/, '').split('\n').forEach((l, i) => doc.splitTextToSize(safe(l) || ' ', CW - 2 * pad - 22).forEach((w, k) => lines.push([k ? '' : String(i + 1), w])));
      if (!lines.length) lines.push(['', '(empty)']);
      let i = 0;
      while (i < lines.length) {
        need(lh * 2 + 2 * pad);
        const fit = Math.max(1, Math.floor((H - M - FOOT - y - 2 * pad) / lh)), chunk = lines.slice(i, i + fit);
        doc.setFillColor(...C.code); doc.rect(M, y, CW, chunk.length * lh + 2 * pad, 'F');
        doc.setDrawColor(...C.rule); doc.setLineWidth(2); doc.line(M, y, M, y + chunk.length * lh + 2 * pad);
        font(size, 'normal', 'courier', C.ink);
        chunk.forEach(([n, l], k) => { doc.setTextColor(...C.muted); doc.text(n, M + pad + 14, y + pad + k * lh + size, { align: 'right' }); doc.setTextColor(...C.ink); doc.text(l, M + pad + 22, y + pad + k * lh + size); });
        y += chunk.length * lh + 2 * pad + 6; i += fit;
      }
    }

    const T = totals(sub), L = sub.lab || {};
    /* header */
    text(L.kicker || '', { size: 8.5, bold: true, color: C.muted, gap: 2 });
    text(L.title || 'Exam report', { size: 20, bold: true, gap: 2 });
    text(KIND, { size: 11, color: C.muted, gap: 8 });
    rule(6);
    const facts = [['Name', sub.name], [sub.idLabel || 'Student number', sub.sid], ['Started', when(sub.started)], ['Finished', when(sub.finished) + (sub.auto ? ' (time limit)' : '')], ['Time taken', dur(sub.started, sub.finished)]];
    facts.forEach(([k, v]) => { need(14); font(10, 'bold'); doc.text(safe(k), M, y + 10); font(10); doc.text(safe(v || '—'), M + 110, y + 10); y += 14; });
    y += 6;
    need(40); doc.setFillColor(...C.head); doc.rect(M, y, CW, 34, 'F');
    font(16, 'bold'); doc.text(safe(`Total: ${T.e} of ${T.t} points (${T.p}%)`), M + 12, y + 22);
    font(9, 'normal', 'helvetica', C.muted); doc.text(safe(`Each step counts the best of ${sub.tries} trials.`), W - M - 12, y + 21, { align: 'right' });
    y += 46;

    /* summary table */
    const step = Math.min(66, (W - 2 * M - 270 - 40) / Math.max(1, sub.tries));   // 2 to 5 trials fit the page
    const trialX = i => M + 270 + step * i, markX = trialX(sub.tries);
    need(18); font(9, 'bold', 'helvetica', C.muted);
    doc.text('Step', M, y + 10);
    for (let i = 0; i < sub.tries; i++) doc.text('Trial ' + (i + 1), trialX(i), y + 10);
    doc.text('Mark', markX, y + 10);
    y += 14; doc.setDrawColor(...C.rule); doc.setLineWidth(0.6); doc.line(M, y, W - M, y); y += 4;
    for (const s of sub.steps) {
      need(16); font(9.5);
      doc.text(doc.splitTextToSize(safe(`${s.id}. ${s.module ? s.module + ': ' : ''}${s.title}`), 262)[0], M, y + 10);
      for (let i = 0; i < sub.tries; i++) { const t = s.trials[i]; doc.text(t ? `${t.earned} / ${t.total}` : '-', trialX(i), y + 10); }
      font(9.5, 'bold'); doc.text(`${s.earned} / ${s.total}`, markX, y + 10);
      y += 16;
    }

    /* each step */
    for (const s of sub.steps) {
      doc.addPage(); y = M;
      text(`${s.module ? s.module + ' · ' : ''}Step ${s.id}`, { size: 8.5, bold: true, color: C.muted, gap: 2 });
      text(s.title, { size: 15, bold: true, gap: 2 });
      text(`Mark: ${s.earned} of ${s.total} points` + (s.trials.length ? ` · ${s.trials.length} trial${s.trials.length > 1 ? 's' : ''}` : ' · not attempted'), { size: 10, color: C.muted, gap: 6 });
      s.trials.forEach((t, i) => {
        rule(8);
        text(`Trial ${i + 1}: ${t.earned} of ${t.total} points` + (i === s.counted && s.trials.length > 1 ? '  (counted)' : '') + `  ·  ${when(t.at)}`, { size: 11, bold: true, gap: 4 });
        for (const c of t.checks) {
          need(14);
          font(8, 'bold', 'helvetica', c.ok ? C.ok : C.bad); doc.text(c.ok ? 'PASS' : 'MISS', M, y + 9);
          font(8.5, 'normal', 'helvetica', C.muted); doc.text(`${c.ok ? c.pts : 0}/${c.pts}`, W - M, y + 9, { align: 'right' });
          text(plain(c.text), { size: 9, indent: 34, width: CW - 74, gap: 0 });
          if (!c.ok && c.found) text('Found: ' + c.found, { size: 8, indent: 34, color: C.muted, gap: 0 });
          y += 3;
        }
        if (t.tips && t.tips.length) { y += 2; text('Suggestions (not marked):', { size: 8.5, bold: true, color: C.muted, gap: 1 }); t.tips.forEach(m => text('- ' + plain(m), { size: 8, indent: 10, color: C.muted, gap: 0 })); }
        y += 4;
        text(`Code (${s.file || 'file'}):`, { size: 9, bold: true, gap: 3 });
        code(t.code);
      });
    }

    /* footer on every page */
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i); font(7.5, 'normal', 'helvetica', C.muted);
      doc.text(safe(`${sub.name} · ${sub.sid} · ${L.title || ''}`), M, H - 22);
      doc.text(`Page ${i} of ${n}`, W - M, H - 22, { align: 'right' });
    }
    doc.setProperties({ title: safe(`${L.title || 'Exam'}: ${sub.name} (${sub.sid})`), subject: KIND, author: safe(sub.name), creator: safe(L.title || ''),
      keywords: 'labdata ' + b64(JSON.stringify(sub)) });
    return doc.output('blob');
  }

  function filename(sub) {
    const last = (String(sub.name || 'student').trim().split(/\s+/).pop() || 'student').replace(/[^\w-]+/g, '');
    return `${String(sub.sid || 'id').replace(/[^\w-]+/g, '')}_${last}${sub.reportTag ? '_' + sub.reportTag : ''}_report.pdf`;
  }
  function download(blob, name) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  return { pdf, filename, download, totals, when, dur };
})();
