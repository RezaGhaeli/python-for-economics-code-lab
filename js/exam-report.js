/*
   Exam report: turns one student's exam result into a Word document (.docx), and reads it back.
   Used by app.js (the student downloads it) and grade.html (the instructor re-grades it).
   The .docx is written by hand (WordprocessingML zipped with JSZip). It also carries the
   submission as a Custom XML part (customXml/item1.xml, which Word keeps when the file is
   saved again), so grade.html can re-grade the code the student wrote.

   A submission ("sub"):
   { v: 1, lab: { title, kicker, footer, storageKey, url }, name, sid, started, finished, auto, minutes,
     regraded?: ISO date, sections: [{ id, title, module, topic, file, earned, total, score,
     checks: [{ text, pts, ok, found }], code }] }
*/
const ExamReport = (() => {
  const XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
  const x = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  const plain = s => String(s || '').replace(/`([^`]+)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1');
  const COL = { dark: '4B2E1F', accent: '96603A', ok: '1E7B4F', bad: 'B0302A', muted: '6B5A4E', head: 'EFE7DF', code: 'F6F3EE', line: 'D9CBBD' };
  const when = iso => iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
  const dur = (a, b) => { if (!a || !b) return '—'; const s = Math.max(0, Math.round((new Date(b) - new Date(a)) / 1000)); return Math.floor(s / 60) + ' min ' + String(s % 60).padStart(2, '0') + ' s'; };
  const totals = sub => { const e = sub.sections.reduce((s, x) => s + x.earned, 0), t = sub.sections.reduce((s, x) => s + x.total, 0); return { e, t, p: t ? Math.round(100 * e / t) : 0 }; };

  /* ---- WordprocessingML pieces */
  function run(text, o = {}) {
    const pr = [o.font ? `<w:rFonts w:ascii="${o.font}" w:hAnsi="${o.font}" w:cs="${o.font}"/>` : '', o.bold ? '<w:b/>' : '', o.italic ? '<w:i/>' : '',
      o.color ? `<w:color w:val="${o.color}"/>` : '', o.size ? `<w:sz w:val="${o.size}"/><w:szCs w:val="${o.size}"/>` : ''].join('');
    return `<w:r>${pr ? `<w:rPr>${pr}</w:rPr>` : ''}<w:t xml:space="preserve">${x(text)}</w:t></w:r>`;
  }
  /* runs: a string or [[text, opts], …] */
  function para(runs, o = {}) {
    const rs = typeof runs === 'string' ? run(runs, o) : runs.map(([t, ro]) => run(t, Object.assign({}, o.run || {}, ro || {}))).join('');
    const pr = [o.style ? `<w:pStyle w:val="${o.style}"/>` : '', o.keep ? '<w:keepNext/>' : '', o.pageBreak ? '<w:pageBreakBefore/>' : '',
      o.shade ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.shade}"/>` : '',
      `<w:spacing w:before="${o.before || 0}" w:after="${o.after == null ? 80 : o.after}"${o.line ? ` w:line="${o.line}" w:lineRule="auto"` : ''}/>`,
      o.indent ? `<w:ind w:left="${o.indent}"/>` : '', o.align ? `<w:jc w:val="${o.align}"/>` : ''].join('');
    return `<w:p><w:pPr>${pr}</w:pPr>${rs}</w:p>`;
  }
  function cell(content, width, o = {}) {
    const body = content && content.paras ? content.paras.join('') : para(content, Object.assign({ after: 0 }, o.p || {}));
    return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${o.shade ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.shade}"/>` : ''}<w:vAlign w:val="top"/></w:tcPr>${body}</w:tc>`;
  }
  function table(rows, widths, o = {}) {
    const b = s => `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="${COL.line}"/>`;
    const grid = widths.map(w => `<w:gridCol w:w="${w}"/>`).join('');
    const trs = rows.map((r, i) => `<w:tr>${i === 0 && o.header ? '<w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>' : '<w:trPr><w:cantSplit/></w:trPr>'}${r.map((c, k) => {
      const isHead = i === 0 && o.header, opts = typeof c === 'object' && c && !Array.isArray(c) && c.cell ? c : { text: c };
      return cell(opts.paras ? { paras: opts.paras } : (isHead ? [[opts.text, { bold: true, color: 'FFFFFF' }]] : opts.runs || String(opts.text == null ? '' : opts.text)), widths[k],
        { shade: isHead ? COL.dark : opts.shade, p: { run: { size: o.size || 19 } } });
    }).join('')}</w:tr>`).join('');
    return `<w:tbl><w:tblPr><w:tblW w:w="${widths.reduce((s, w) => s + w, 0)}" w:type="dxa"/>` +
      `<w:tblBorders>${b('top')}${b('left')}${b('bottom')}${b('right')}${b('insideH')}${b('insideV')}</w:tblBorders><w:tblLayout w:type="fixed"/>` +
      `<w:tblCellMar><w:top w:w="50" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="50" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar></w:tblPr>` +
      `<w:tblGrid>${grid}</w:tblGrid>${trs}</w:tbl>` + para('', { after: 60 });
  }

  function documentXml(sub) {
    const T = totals(sub), out = [];
    out.push(para([[sub.lab.kicker || '', { color: COL.accent, bold: true, size: 18 }]], { after: 40 }));
    out.push(para(sub.lab.title + ': Results Report', { style: 'Title' }));
    out.push(para([[sub.regraded ? 'Re-graded by the instructor on ' + when(sub.regraded) + ' from the code below.' : 'Graded automatically when the exam was finished. The code each section was graded on is included below.', { italic: true, color: COL.muted, size: 18 }]], { after: 160 }));
    const info = [
      ['Student', sub.name || '—'], [sub.idLabel || 'Student number', sub.sid || '—'],
      ['Started', when(sub.started)], ['Finished', when(sub.finished) + (sub.auto ? '  (time limit reached)' : '')],
      ['Time used', dur(sub.started, sub.finished) + (sub.minutes ? '  (limit ' + sub.minutes + ' min)' : '')],
      ['Score', { cell: true, runs: [[T.e + ' / ' + T.t + ' points  (' + T.p + '%)', { bold: true, size: 22, color: COL.dark }]] }]
    ];
    out.push(table(info.map(([k, v]) => [{ cell: true, runs: [[k, { bold: true }]], shade: COL.head }, v]), [2600, 7480]));

    out.push(para('Score by section', { style: 'Heading1', keep: true }));
    out.push(table([['Section', 'Topic', 'Points', 'Score']].concat(sub.sections.map(s => [s.id + '. ' + s.title, (s.module ? s.module + ' · ' : '') + s.topic, s.earned + ' / ' + s.total, s.score + '%']))
      .concat([[{ cell: true, runs: [['Total', { bold: true }]] }, '', { cell: true, runs: [[T.e + ' / ' + T.t, { bold: true }]] }, { cell: true, runs: [[T.p + '%', { bold: true }]] }]]), [3700, 3780, 1300, 1300], { header: true }));

    sub.sections.forEach(s => {
      out.push(para('Section ' + s.id + ': ' + s.title + '   (' + s.earned + ' / ' + s.total + ')', { style: 'Heading1', keep: true, pageBreak: true }));
      out.push(para([[(s.module ? s.module + ' · ' : '') + s.topic, { color: COL.muted, italic: true }]], { after: 120 }));
      out.push(table([['', 'Check', 'Points', 'What the grader found']].concat(s.checks.map(c => [
        { cell: true, runs: [[c.ok ? '✓' : '✗', { bold: true, color: c.ok ? COL.ok : COL.bad }]] },
        plain(c.text), (c.ok ? c.pts : 0) + ' / ' + c.pts, c.ok ? '' : (c.found || '')])), [460, 4900, 900, 3820], { header: true, size: 18 }));
      out.push(para('Submitted ' + (s.file || 'code'), { style: 'Heading2', keep: true }));
      const lines = String(s.code || '').replace(/\s+$/, '').split('\n');
      lines.forEach((l, i) => out.push(para([[String(i + 1).padStart(3, ' ') + '  ', { color: '9A8B80' }], [l.replace(/\t/g, '  ')]], { shade: COL.code, after: 0, line: 228, run: { font: 'Courier New', size: 16 } })));
      out.push(para('', { after: 120 }));
    });
    out.push(para([[sub.lab.footer || '', { color: COL.muted, size: 16 }], [sub.lab.url ? '  ·  ' + sub.lab.url : '', { color: COL.muted, size: 16 }]], { before: 200 }));
    const sect = '<w:sectPr><w:footerReference w:type="default" r:id="rIdFooter"/><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="600" w:footer="600" w:gutter="0"/></w:sectPr>';
    return XML_HEAD + `<w:document ${W}><w:body>${out.join('')}${sect}</w:body></w:document>`;
  }
  const footerXml = sub => XML_HEAD + `<w:ftr ${W}><w:p><w:pPr><w:jc w:val="center"/></w:pPr>` +
    run((sub.name || 'Student') + ' · ' + (sub.sid || '') + ' · ' + sub.lab.title + ' · page ', { size: 16, color: COL.muted }) +
    '<w:r><w:rPr><w:sz w:val="16"/><w:color w:val="6B5A4E"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:rPr><w:sz w:val="16"/><w:color w:val="6B5A4E"/></w:rPr><w:t>1</w:t></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>';
  const STYLES = XML_HEAD + `<w:styles ${W}>
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:color w:val="2B2B2B"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:lang w:val="en-CA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="80" w:line="259" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="60"/></w:pPr><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia" w:cs="Georgia"/><w:b/><w:color w:val="${COL.dark}"/><w:sz w:val="40"/><w:szCs w:val="40"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="2" w:color="C8A27A"/></w:pBdr><w:spacing w:before="240" w:after="60"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia" w:cs="Georgia"/><w:b/><w:color w:val="${COL.dark}"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="180" w:after="60"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:color w:val="${COL.accent}"/><w:sz w:val="23"/><w:szCs w:val="23"/></w:rPr></w:style>
</w:styles>`;
  const CONTENT_TYPES = XML_HEAD + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/customXml/itemProps1.xml" ContentType="application/vnd.openxmlformats-officedocument.customXmlProperties+xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
    '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>' +
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>';
  const ROOT_RELS = XML_HEAD + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>';
  const DOC_RELS = XML_HEAD + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    '<Relationship Id="rIdFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>' +
    '<Relationship Id="rIdExam" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml" Target="../customXml/item1.xml"/></Relationships>';
  /* the submission travels inside the document as a Custom XML part */
  const NS = 'urn:code-lab:exam-submission';
  const ITEM_RELS = XML_HEAD + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXmlProps" Target="itemProps1.xml"/></Relationships>';
  const ITEM_PROPS = XML_HEAD + '<ds:datastoreItem ds:itemID="{6F1C2B9A-3D4E-4F50-9A61-7B8C9D0E1F23}" xmlns:ds="http://schemas.openxmlformats.org/officeDocument/2006/customXml"><ds:schemaRefs><ds:schemaRef ds:uri="' + NS + '"/></ds:schemaRefs></ds:datastoreItem>';
  const core = sub => XML_HEAD + '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
    `<dc:title>${x(sub.lab.title + ' results: ' + (sub.name || ''))}</dc:title><dc:creator>${x(sub.name || 'Student')}</dc:creator><dc:subject>${x(sub.sid || '')}</dc:subject>` +
    `<dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</dcterms:created></cp:coreProperties>`;

  async function docx(sub) {
    if (typeof JSZip === 'undefined') throw new Error('JSZip did not load (check your internet connection)');
    const z = new JSZip();
    z.file('[Content_Types].xml', CONTENT_TYPES);
    z.file('_rels/.rels', ROOT_RELS);
    z.file('word/document.xml', documentXml(sub));
    z.file('word/styles.xml', STYLES);
    z.file('word/footer1.xml', footerXml(sub));
    z.file('word/_rels/document.xml.rels', DOC_RELS);
    z.file('docProps/core.xml', core(sub));
    z.file('customXml/item1.xml', XML_HEAD + `<submission xmlns="${NS}">${x(JSON.stringify(sub))}</submission>`);
    z.file('customXml/itemProps1.xml', ITEM_PROPS);
    z.file('customXml/_rels/item1.xml.rels', ITEM_RELS);
    return z.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', compression: 'DEFLATE' });
  }
  /* Read the submission back out of a report (.docx File/Blob). */
  async function read(file) {
    const z = await JSZip.loadAsync(file);
    /* Word may renumber custom XML parts when it saves, so look through all of them */
    for (const f of z.file(/^customXml\/item\d+\.xml$/)) {
      const text = await f.async('string');
      if (!text.includes(NS)) continue;
      const el = new DOMParser().parseFromString(text, 'application/xml').documentElement;
      return JSON.parse(el.textContent);
    }
    throw new Error('not an exam report (no submission inside)');
  }
  const safe = s => String(s || '').normalize('NFKD').replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
  const filename = sub => [safe(sub.lab.title) || 'Exam', safe(sub.sid), safe(sub.name)].filter(Boolean).join('_') + (sub.regraded ? '_regraded' : '') + '.docx';
  function download(blob, name) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }
  async function sha256(text) {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(text).trim().toLowerCase()));
    return [...new Uint8Array(b)].map(n => n.toString(16).padStart(2, '0')).join('');
  }
  return { docx, read, filename, download, totals, sha256, when, dur };
})();
