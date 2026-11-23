'use strict';
(function(root){
  class CsvError extends Error { constructor(message,line){super(`${message} (line ${line})`);this.name='CsvError';this.line=line;} }
  function parse(text,delimiter=',') {
    if(typeof text!=='string') throw new Error('CSV input must be text.');
    if(![',',';','\t','|'].includes(delimiter)) throw new Error('Choose a supported delimiter.');
    if(text.charCodeAt(0)===0xFEFF) text=text.slice(1);
    if(text.includes('\0')||text.includes('\uFFFD')) throw new Error('Unsupported encoding or binary content. Re-export as UTF-8.');
    if(!text.length) throw new Error('The file is empty.');
    let rows=[],row=[],cell='',state='start',line=1,start=1,ended=false;
    function field(){row.push(cell);cell='';state='start';}
    function record(){field();rows.push({cells:row,line:start});row=[];start=line+1;ended=true;}
    for(let i=0;i<text.length;i++) {
      const c=text[i];ended=false;
      if(state==='quoted') {
        if(c==='"'){ if(text[i+1]==='"'){cell+='"';i++;}else state='closed'; }
        else {cell+=c;if(c==='\n')line++;else if(c==='\r'){if(text[i+1]==='\n'){cell+='\n';i++;}line++;}}
      } else if(c===delimiter){field();}
      else if(c==='\n'||c==='\r') {record();if(c==='\r'&&text[i+1]==='\n')i++;line++;}
      else if(c==='"'){if(state!=='start')throw new CsvError('Unexpected quote in an unquoted field',line);state='quoted';}
      else {if(state==='closed')throw new CsvError('Unexpected text after a closing quote',line);cell+=c;state='plain';}
    }
    if(state==='quoted')throw new CsvError('Unclosed quoted field',start);
    if(!ended) {field();rows.push({cells:row,line:start});}
    if(!rows.length)throw new Error('The file has no records.');
    const headers=rows.shift().cells;
    if(headers.some(h=>!h.trim()))throw new Error('Every column needs a non-empty header.');
    if(new Set(headers).size!==headers.length)throw new Error('Duplicate column headers are ambiguous. Rename them at the source.');
    for(const r of rows)if(r.cells.length!==headers.length)throw new CsvError(`Expected ${headers.length} fields, found ${r.cells.length}`,r.line);
    return {headers,rows};
  }
  function compare(oldData,newData,options) {
    const keys=options.keys||[],allowed=options.allowed||[];
    if(!keys.length)throw new Error('Choose at least one stable key column.');
    if(new Set(keys).size!==keys.length)throw new Error('Key columns must be unique.');
    const oldH=oldData.headers,newH=newData.headers;
    for(const h of [...keys,...allowed])if(!oldH.includes(h)||!newH.includes(h))throw new Error(`Column missing from one file: ${h}`);
    if(keys.some(k=>allowed.includes(k)))throw new Error('Key columns cannot be allowed to change.');
    const issues=[],changes=[],added=[],removed=[];
    const missingColumns=oldH.filter(h=>!newH.includes(h)),extraColumns=newH.filter(h=>!oldH.includes(h));
    if(missingColumns.length||extraColumns.length)issues.push({type:'schema',message:'Column set changed',missing:missingColumns,extra:extraColumns});
    function index(data,side){
      const ix=new Map();
      for(const r of data.rows){
        const values=keys.map(k=>r.cells[data.headers.indexOf(k)]);
        if(values.some(v=>v.trim()==='')){issues.push({type:'empty-key',side,line:r.line,message:'Empty key value'});continue;}
        const key=JSON.stringify(values);
        if(ix.has(key)){issues.push({type:'duplicate-key',side,key:values,line:r.line,firstLine:ix.get(key).line,message:'Duplicate key'});}
        else ix.set(key,{...r,key:values});
      }
      return ix;
    }
    const before=index(oldData,'baseline'),after=index(newData,'candidate');
    // Never report a potentially misleading row match when keys are ambiguous.
    const ambiguous=issues.some(i=>i.type==='duplicate-key'||i.type==='empty-key');
    if(!ambiguous){
      for(const [k,r] of before){
        const n=after.get(k);
        if(!n){removed.push({key:r.key,line:r.line});continue;}
        for(const h of oldH){
          if(!newH.includes(h)||keys.includes(h))continue;
          const a=r.cells[oldH.indexOf(h)],b=n.cells[newH.indexOf(h)];
          if(a!==b)changes.push({key:r.key,column:h,before:a,after:b,allowed:allowed.includes(h),baselineLine:r.line,candidateLine:n.line});
        }
      }
      for(const [k,r] of after)if(!before.has(k))added.push({key:r.key,line:r.line});
    }
    const protectedCount=changes.filter(c=>!c.allowed).length;
    const blocked=!!issues.length||!!protectedCount||!!added.length||!!removed.length;
    return {version:1,status:blocked?'REVIEW REQUIRED':'WITHIN SELECTED RULES',keys:[...keys],allowed:[...allowed],counts:{baseline:oldData.rows.length,candidate:newData.rows.length,changed:changes.length,protected:protectedCount,added:added.length,removed:removed.length},issues,changes,added,removed,ambiguous};
  }
  function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function report(result,meta={}) {
    const e=escapeHtml;
    return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Supplier Gate review</title><style>body{font:16px system-ui;max-width:1100px;margin:40px auto;padding:20px;color:#172a36}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border:1px solid #ccd6dd;padding:10px;text-align:left;white-space:pre-wrap;overflow-wrap:anywhere}th{background:#edf3f5}h1{font-size:30px}code{overflow-wrap:anywhere} @media print{body{margin:0}tr{break-inside:avoid}}</style><h1>Supplier Gate: ${e(result.status)}</h1><p>This checks selected rules, not business correctness or permission to import. No store was changed.</p><p>Baseline: ${e(meta.baseline||'not recorded')}<br>Candidate: ${e(meta.candidate||'not recorded')}<br>Baseline SHA-256: <code>${e(meta.baselineHash||'not recorded')}</code><br>Candidate SHA-256: <code>${e(meta.candidateHash||'not recorded')}</code></p><p>Keys: ${e(result.keys.join(', '))}. Allowed edits: ${e(result.allowed.join(', ')||'none')}.</p><pre>${e(JSON.stringify(result.counts,null,2))}</pre><p>Hash scope: ${e(meta.hashScope||'not recorded')}</p><h2>Blocking issues</h2><pre>${e(JSON.stringify(result.issues,null,2))}</pre><h2>Field changes</h2><table><tr><th>Key</th><th>Column</th><th>Before</th><th>After</th><th>Rule</th><th>Lines (old/new)</th></tr>${result.changes.map(c=>`<tr><td>${e(JSON.stringify(c.key))}</td><td>${e(c.column)}</td><td>${e(c.before)}</td><td>${e(c.after)}</td><td>${c.allowed?'Allowed':'Protected'}</td><td>${c.baselineLine}/${c.candidateLine}</td></tr>`).join('')}</table><h2>Added keys</h2><pre>${e(JSON.stringify(result.added,null,2))}</pre><h2>Removed keys</h2><pre>${e(JSON.stringify(result.removed,null,2))}</pre><p>Strings are compared exactly. No trimming, numeric conversion, guessing or repair. If a key changes it appears as removal plus addition. Duplicate or empty keys stop matching.</p></html>`;
  }
  const api={parse,compare,report,escapeHtml};
  if(typeof module!=='undefined')module.exports=api;
  root.SupplierGate=api;
})(typeof globalThis!=='undefined'?globalThis:this);
