'use strict';
const $=id=>document.getElementById(id),MAX=10*1024*1024;
let revision=0;
let parsed=null,result=null,meta=null,page=0,currentFiles={old:null,new:null};
const selected=id=>Array.from($(id).querySelectorAll('input:checked')).map(x=>x.value);
function error(e){$('errors').textContent=e?.message||String(e);}
function invalidate(){revision++;result=null;$('results').hidden=true;}
function invalidateColumns(){invalidate();parsed=null;$('compare').disabled=true;$('save-policy').disabled=true;$('keys').replaceChildren();$('allowed').replaceChildren();}
function delim(side){return $(side+'-delim').value==='tab'?'\t':$(side+'-delim').value;}
function readData(){
 const values={};
 for(const side of ['old','new']){
  const text=$(side+'-text').value;
  if(new TextEncoder().encode(text).length>MAX)throw new Error('Each file is limited to 10 MB.');
  values[side]=SupplierGate.parse(text,delim(side));
  if(values[side].rows.length>50000)throw new Error('Each file is limited to 50,000 data rows.');
 }
 return values;
}
function loadColumns(policy){
 $('errors').textContent='';invalidate();parsed=readData();
 const common=parsed.old.headers.filter(h=>parsed.new.headers.includes(h));
 if(!common.length)throw new Error('The files share no column names.');
 if(policy){
  if(policy.version!==1||!Array.isArray(policy.keys)||!Array.isArray(policy.allowed)||[...policy.keys,...policy.allowed].some(x=>typeof x!=='string'||!common.includes(x))||policy.keys.some(k=>policy.allowed.includes(k)))throw new Error('Rules do not match these files. Load columns and choose them again.');
 }
 for(const id of ['keys','allowed']){
  $(id).replaceChildren();
  for(const h of common){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.value=h;input.checked=policy?policy[id].includes(h):false;input.addEventListener('change',()=>{if(id==='keys'&&input.checked){for(const x of $('allowed').querySelectorAll('input'))if(x.value===h)x.checked=false;}invalidate();});label.append(input,document.createTextNode(h));$(id).append(label);}
 }
 $('compare').disabled=false;$('save-policy').disabled=false;
}
function save(name,body,type){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([body],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function rules(){return {version:1,keys:selected('keys'),allowed:selected('allowed')};}
async function hash(text){if(!globalThis.crypto?.subtle)return 'Unavailable in this browser context';const buffer=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return Array.from(new Uint8Array(buffer)).map(b=>b.toString(16).padStart(2,'0')).join('');}
function showResult(){
 $('results').hidden=false;const s=$('status');s.replaceChildren();s.className='status'+(result.status==='WITHIN SELECTED RULES'?' good':'');
 const h=document.createElement('h2');h.textContent=result.status==='WITHIN SELECTED RULES'?'Within your selected rules':'Review required';
 const p=document.createElement('p');p.style.margin='0';p.className='hint';p.textContent=result.ambiguous?'Row matching stopped: resolve empty or duplicate keys first.':result.status==='WITHIN SELECTED RULES'?'No protected fields, keys or column sets changed. This is not approval to import.':'Protected changes, added or removed keys, or structural issues need attention.';s.append(h,p);
 $('stats').replaceChildren();for(const [n,v] of [['Rows before',result.counts.baseline],['Field changes',result.counts.changed],['Protected edits',result.counts.protected],['Added keys',result.counts.added],['Removed keys',result.counts.removed]]){const d=document.createElement('div');d.className='stat';const value=document.createElement('strong'),label=document.createElement('span');value.textContent=v;label.textContent=n;d.append(value,label);$('stats').append(d);}
 $('details').textContent=JSON.stringify({issues:result.issues,added:result.added,removed:result.removed},null,2);page=0;renderChanges();
}
function renderChanges(){
 if(!result)return;const q=$('search').value.toLocaleLowerCase(),f=$('filter').value;
 const list=result.changes.filter(c=>(f==='all'||c.allowed===(f==='allowed'))&&(!q||JSON.stringify(c).toLocaleLowerCase().includes(q)));
 const pages=Math.max(1,Math.ceil(list.length/50));page=Math.max(0,Math.min(page,pages-1));$('changes').replaceChildren();
 for(const c of list.slice(page*50,page*50+50)){const tr=document.createElement('tr');for(const value of [JSON.stringify(c.key),c.column,c.before,c.after]){const td=document.createElement('td');td.textContent=value;tr.append(td);}const td=document.createElement('td'),tag=document.createElement('span');tag.textContent=c.allowed?'Allowed':'Protected';tag.className='tag'+(c.allowed?' ok':'');td.append(tag);tr.append(td);$('changes').append(tr);}
 if(!list.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=5;td.textContent=result.ambiguous?'No matches computed until key issues are fixed.':'No field changes match this view.';tr.append(td);$('changes').append(tr);}
 $('page').textContent=`${list.length} changes · Page ${page+1} of ${pages}`;$('prev').disabled=page===0;$('next').disabled=page+1===pages;
}
for(const side of ['old','new']){
 $(side+'-file').addEventListener('change',async ev=>{try{invalidateColumns();$('errors').textContent='';const file=ev.target.files[0];if(!file)return;if(file.size>MAX)throw new Error('Each file is limited to 10 MB.');const text=new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer());$(side+'-text').value=text;currentFiles[side]=file.name;}catch(e){$(side+'-text').value='';currentFiles[side]=null;error(e);}});
 $(side+'-text').addEventListener('input',()=>{currentFiles[side]=null;$(side+'-file').value='';invalidateColumns();});
 $(side+'-delim').addEventListener('change',invalidateColumns);
}
$('columns').onclick=()=>{try{loadColumns();}catch(e){invalidateColumns();error(e);}};
$('compare').onclick=async()=>{try{$('errors').textContent='';const runRevision=revision;const data=readData();const nextResult=SupplierGate.compare(data.old,data.new,rules());const nextMeta={baseline:currentFiles.old||'Pasted baseline',candidate:currentFiles.new||'Pasted candidate',hashScope:'SHA-256 of UTF-8 text after browser newline/BOM decoding, not source-file bytes',baselineHash:await hash($('old-text').value),candidateHash:await hash($('new-text').value)};if(runRevision!==revision)return;result=nextResult;meta=nextMeta;showResult();}catch(e){invalidate();error(e);}};
$('save-policy').onclick=()=>{try{const p=rules();if(!p.keys.length)throw new Error('Select a key before saving rules.');if(p.keys.some(k=>p.allowed.includes(k)))throw new Error('A key cannot be editable.');save('supplier-gate-rules.json',JSON.stringify(p,null,2),'application/json');}catch(e){error(e);}};
$('import-policy').onclick=()=>$('policy-file').click();
$('policy-file').onchange=async ev=>{try{const f=ev.target.files[0];if(!f)return;if(f.size>100000)throw new Error('Rules file too large.');loadColumns(JSON.parse(await f.text()));}catch(e){invalidateColumns();error(e);}finally{ev.target.value='';}};
$('html-report').onclick=()=>{if(result)save('supplier-gate-review.html',SupplierGate.report(result,meta),'text/html');};
$('json-report').onclick=()=>{if(result)save('supplier-gate-review.json',JSON.stringify({meta,...result},null,2),'application/json');};
$('filter').onchange=$('search').oninput=()=>{page=0;renderChanges();};$('prev').onclick=()=>{page--;renderChanges();};$('next').onclick=()=>{page++;renderChanges();};
$('reset').onclick=()=>{for(const side of ['old','new']){$(side+'-text').value='';$(side+'-file').value='';$(side+'-delim').value=',';currentFiles[side]=null;}$('errors').textContent='';invalidateColumns();};
$('demo').onclick=()=>{for(const s of ['old','new']){$(s+'-delim').value=',';$(s+'-file').value='';currentFiles[s]=null;}$('old-text').value='SKU,Name,Price,Stock\n001,Green mug,12.00,24\n002,Blue bowl,18.00,12\n003,Linen towel,9.00,40';$('new-text').value='SKU,Name,Price,Stock\n002,Blue bowl - renamed,18.00,12\n001,Green mug,13.50,19\n004,Glass jar,7.50,30';try{loadColumns({version:1,keys:['SKU'],allowed:['Price','Stock']});$('compare').click();}catch(e){error(e);}};
