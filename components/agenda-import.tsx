'use client';
import {useState} from 'react';
import {createClient} from '@/lib/supabase/client';

type ImportRow={key:string;selected:boolean;date:string;time:string;type:string;rawType:string;name:string;payer:string;phone:string;status:string;cpf:string;birth:string;ignoredReason?:string};

function onlyDigits(v:string){return String(v||'').replace(/\D/g,'')}
function fmtCpf(v:string){const d=onlyDigits(v).slice(0,11);return d.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2')}
function norm(s:string){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase()}
function validPhone(v:string){const d=onlyDigits(v);return d.length>=8?String(v).trim():''}
function isoDate(v:any){
  if(v===null||v===undefined||v==='')return '';
  if(typeof v==='number'){const epoch=new Date(Date.UTC(1899,11,30));epoch.setUTCDate(epoch.getUTCDate()+Math.floor(v));return epoch.toISOString().slice(0,10)}
  const s=String(v).trim();
  let m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if(m)return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m?`${m[1]}-${m[2]}-${m[3]}`:'';
}
function normalizeType(v:string){
  const t=norm(v);
  if(t==='CIPAP'||t==='CPAP')return 'CPAP';
  if(t==='BASAL')return 'Basal';
  if(t.includes('BRUX'))return 'Bruxismo';
  if(t.includes('SPLIT'))return 'Split-night';
  if(t.includes('LAT'))return 'Latência';
  if(t.includes('NEURO'))return 'Neuro';
  return String(v||'Outro').trim()||'Outro';
}
async function makeCode(){
  const code=Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b%32]).join('').match(/.{1,4}/g)!.join('-');
  const hashBuf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(code.toUpperCase()));
  const hash=Array.from(new Uint8Array(hashBuf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  return {code,hash};
}
async function fingerprint(row:ImportRow){
  const raw=[row.date,row.time,onlyDigits(row.cpf),norm(row.name),norm(row.rawType)].join('|');
  const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');
}

export default function AgendaImport(){
  const [rows,setRows]=useState<ImportRow[]>([]);
  const [filename,setFilename]=useState('');
  const [open,setOpen]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [ok,setOk]=useState('');

  async function parse(file:File){
    setError('');setOk('');setFilename(file.name);
    try{
      const XLSX=await import('xlsx');
      const data=await file.arrayBuffer();
      const wb=XLSX.read(data,{type:'array',cellDates:false});
      const ws=wb.Sheets[wb.SheetNames[0]];
      const source=XLSX.utils.sheet_to_json<Record<string,any>>(ws,{defval:'',raw:true});
      const get=(r:Record<string,any>,wanted:string[])=>{const k=Object.keys(r).find(x=>wanted.includes(norm(x)));return k?r[k]:''};
      const parsed=source.map((r,i)=>{
        const rawType=String(get(r,['TIPO']));
        const name=String(get(r,['PACIENTE'])).trim();
        const cpf=onlyDigits(String(get(r,['CPF'])));
        const date=isoDate(get(r,['DATA']));
        const birth=isoDate(get(r,['DATA DE NASCIMENTO','NASCIMENTO','DATA NASCIMENTO']));
        const phone=validPhone(String(get(r,['CELULAR'])))||validPhone(String(get(r,['TELEFONE'])));
        const isConsult=norm(rawType)==='CONSULTA';
        const reason=isConsult?'CONSULTA/ACOMPANHANTE':(!name?'Sem paciente':(!date?'Sem data':(!birth?'Sem nascimento':(cpf.length!==11?'CPF inválido':''))));
        return {key:`${i}-${name}`,selected:!reason,date,time:String(get(r,['INICIO','HORARIO','HORA'])).trim(),type:normalizeType(rawType),rawType,name,payer:String(get(r,['OPERADORA','CONVENIO'])).trim(),phone,status:String(get(r,['STATUS'])).trim(),cpf,birth,ignoredReason:reason||undefined} as ImportRow;
      }).filter(r=>r.name||r.rawType);
      setRows(parsed);setOpen(true);
    }catch(e:any){setError('Não foi possível ler a planilha: '+(e.message||String(e)))}
  }

  async function upsertPatient(s:any,r:ImportRow){
    const existing=await s.from('patients').select('id').eq('cpf',r.cpf).maybeSingle();
    if(existing.error)throw existing.error;
    if(existing.data?.id){
      const up=await s.from('patients').update({full_name:r.name,birth_date:r.birth,phone:r.phone||null}).eq('id',existing.data.id);
      if(up.error)throw up.error;
      return existing.data.id as string;
    }
    const p=await s.from('patients').insert({full_name:r.name,birth_date:r.birth,cpf:r.cpf,phone:r.phone||null}).select('id').single();
    if(p.error||!p.data)throw p.error||new Error('Falha ao criar paciente');
    return p.data.id as string;
  }

  async function importRows(){
    const chosen=rows.filter(r=>r.selected&&!r.ignoredReason);
    if(!chosen.length)return setError('Selecione ao menos um exame válido.');
    setBusy(true);setError('');setOk('');
    let created=0,duplicates=0;
    try{
      const s=createClient(),u=(await s.auth.getUser()).data.user;
      for(const r of chosen){
        const fp=await fingerprint(r);
        const dup=await s.from('exams').select('id').eq('import_fingerprint',fp).maybeSingle();
        if(dup.error)throw dup.error;
        if(dup.data){duplicates++;continue}
        const patientId=await upsertPatient(s,r);
        const {code,hash}=await makeCode();
        const ins=await s.from('exams').insert({
          patient_id:patientId,exam_date:r.date,appointment_time:r.time||null,exam_type:r.type,
          payer:r.payer||null,appointment_status:r.status||null,status:'created',created_by:u?.id||null,
          patient_access_code:code,patient_access_code_hash:hash,preregistered_at:new Date().toISOString(),
          import_source:filename||'agenda',import_fingerprint:fp
        }).select('id').single();
        if(ins.error){if(ins.error.code==='23505'){duplicates++;continue}throw ins.error}
        created++;
        await s.from('audit_logs').insert({user_id:u?.id,exam_id:ins.data.id,action:'exam_preregistered',metadata:{code_issued:true,source:'agenda_import',filename,status:r.status,payer:r.payer}});
      }
      setOk(`${created} pré-cadastro(s) criado(s)${duplicates?` • ${duplicates} duplicado(s) ignorado(s)`:''}.`);
      setRows([]);setOpen(false);
      setTimeout(()=>window.location.reload(),900);
    }catch(e:any){setError(e.message||String(e))}
    finally{setBusy(false)}
  }

  const valid=rows.filter(r=>!r.ignoredReason).length,ignored=rows.filter(r=>r.ignoredReason).length,selected=rows.filter(r=>r.selected&&!r.ignoredReason).length;
  return <div className="agenda-import">
    <label className="btn import-btn">Importar agenda XLS/XLSX
      <input type="file" accept=".xls,.xlsx" hidden onChange={e=>{const f=e.target.files?.[0];if(f)parse(f);e.currentTarget.value=''}}/>
    </label>
    {error&&<div className="message error import-message">{error}</div>}
    {ok&&<div className="message ok import-message">{ok}</div>}
    {open&&<div className="import-modal">
      <div className="import-card">
        <div className="top"><div><h2 className="section-title">Conferir agenda antes de importar</h2><div className="muted">{filename} • {valid} exame(s) reconhecido(s) • {ignored} ignorado(s)</div></div><button className="btn" onClick={()=>{setOpen(false);setRows([])}}>Fechar</button></div>
        <div className="message info">CONSULTA/acompanhante é ignorado automaticamente. CIPAP é normalizado para CPAP. Desmarque qualquer paciente que não deva ser pré-cadastrado.</div>
        <div className="table-scroll import-preview"><table><thead><tr><th>Importar</th><th>Horário</th><th>Paciente</th><th>Nascimento</th><th>CPF</th><th>Tipo</th><th>Operadora</th><th>Status</th><th>Observação</th></tr></thead><tbody>
          {rows.map((r,i)=><tr key={r.key} className={r.ignoredReason?'row-muted':''}>
            <td><input type="checkbox" checked={r.selected} disabled={!!r.ignoredReason} onChange={e=>setRows(p=>p.map((x,j)=>j===i?{...x,selected:e.target.checked}:x))}/></td>
            <td>{r.time||'—'}</td><td><b>{r.name||'—'}</b><div className="muted">{r.phone||'sem telefone'}</div></td>
            <td>{r.birth?new Date(r.birth+'T12:00:00').toLocaleDateString('pt-BR'):'—'}</td><td>{r.cpf?fmtCpf(r.cpf):'—'}</td><td>{r.type}</td><td>{r.payer||'—'}</td><td>{r.status||'—'}</td><td>{r.ignoredReason||''}</td>
          </tr>)}
        </tbody></table></div>
        <div className="toolbar" style={{marginTop:14}}><button className="btn primary" disabled={busy||!selected} onClick={importRows}>{busy?'Importando…':`IMPORTAR ${selected} EXAME(S)`}</button><button className="btn" onClick={()=>setRows(p=>p.map(r=>({...r,selected:!r.ignoredReason})))}>Selecionar válidos</button></div>
      </div>
    </div>}
  </div>
}
