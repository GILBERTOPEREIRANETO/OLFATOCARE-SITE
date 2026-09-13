'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {QRCodeSVG} from 'qrcode.react';
import {createClient} from '@/lib/supabase/client';
import AgendaImport from '@/components/agenda-import';
import RawStudyBox,{RawStudyInfo} from '@/components/raw-study';

type Exam={id:string;exam_date:string;exam_type:string;appointment_time:string|null;payer:string|null;appointment_status:string|null;neurovirtual_id:string|null;status:string;doctor_id:string|null;patient_access_code:string|null;patient:{full_name:string;birth_date:string;cpf:string|null;phone:string|null;email:string|null}|null;doctor:{full_name:string}|null};
const labels:Record<string,string>={created:'Pré-cadastrado',awaiting_technician:'Aguardando técnica',technical_done:'Técnica concluída',awaiting_doctor:'Aguardando médico',in_review:'Em laudo',finalized:'Finalizado',released:'Liberado',rectified:'Retificado'};
function onlyDigits(v:string){return v.replace(/\D/g,'')}
function fmtCpf(v:string){const d=onlyDigits(v).slice(0,11);return d.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2')}
function brToIso(v:string){const d=onlyDigits(v).slice(0,8);if(d.length!==8)return '';return `${d.slice(4,8)}-${d.slice(2,4)}-${d.slice(0,2)}`}
function maskDate(v:string){const d=onlyDigits(v).slice(0,8);return d.length<=2?d:d.length<=4?`${d.slice(0,2)}/${d.slice(2)}`:`${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4)}`}
function isoToBr(v:string){if(!v)return '';const [y,m,d]=v.split('-');return y&&m&&d?`${d}/${m}/${y}`:v}

export default function ExamAdmin({reception=false}:{reception?:boolean}){
 const [exams,setExams]=useState<Exam[]>([]),[show,setShow]=useState(false),[error,setError]=useState(''),[ok,setOk]=useState(''),[busy,setBusy]=useState(false),[completing,setCompleting]=useState<Exam|null>(null),[protocol,setProtocol]=useState<Exam|null>(null);
 const [view,setView]=useState<'active'|'finalized'|'all'>('active'),[search,setSearch]=useState(''),[preStatus,setPreStatus]=useState<Record<string,string>>({}),[rawSize,setRawSize]=useState<Record<string,number>>({}),[rawFiles,setRawFiles]=useState<Record<string,RawStudyInfo>>({}),[rawExam,setRawExam]=useState<Exam|null>(null);
 const [name,setName]=useState(''),[birth,setBirth]=useState(''),[cpf,setCpf]=useState(''),[phone,setPhone]=useState(''),[email,setEmail]=useState(''),[date,setDate]=useState(new Date().toLocaleDateString('pt-BR')),[type,setType]=useState('Basal');
 const [nv,setNv]=useState(''),[files,setFiles]=useState<File[]>([]);
 const baseUrl=useMemo(()=>typeof window!=='undefined'?window.location.origin:'',[]);
 const load=useCallback(async()=>{
   const s=createClient();
   const e=await s
     .from('exams')
     .select('id,exam_date,exam_type,appointment_time,payer,appointment_status,neurovirtual_id,status,doctor_id,patient_access_code,patient:patients(full_name,birth_date,cpf,phone,email),doctor:profiles!exams_doctor_id_fkey(full_name)')
     .order('created_at',{ascending:false})
     .limit(150);

   if(e.error){
     setError(e.error.message);
     return;
   }

   const list=(e.data||[]) as unknown as Exam[];
   setExams(list);

   const ids=list.map(x=>x.id);
   if(!ids.length){
     setPreStatus({});
     setRawSize({});
     setRawFiles({});
     return;
   }

   const [q,raw]=await Promise.all([
     s.from('pre_sleep_questionnaires')
       .select('exam_id,status')
       .in('exam_id',ids),
     s.from('psg_raw_files')
       .select('id,exam_id,storage_path,original_filename,mime_type,size_bytes,created_at')
       .in('exam_id',ids)
   ]);

   if(!q.error){
     setPreStatus(
       Object.fromEntries((q.data||[]).map((x:any)=>[x.exam_id,x.status]))
     );
   }

   if(!raw.error){
     setRawSize(
       Object.fromEntries((raw.data||[]).map((x:any)=>[x.exam_id,Number(x.size_bytes)]))
     );
     setRawFiles(
       Object.fromEntries(
         (raw.data||[]).map((x:any)=>[
           x.exam_id,
           {...x,size_bytes:Number(x.size_bytes)}
         ])
       )
     );
   }
 },[]);
 useEffect(()=>{load()},[load]);
 async function preregister(ev:React.FormEvent){ev.preventDefault();setBusy(true);setError('');setOk('');const s=createClient(),u=(await s.auth.getUser()).data.user;const cleanCpf=onlyDigits(cpf);if(cleanCpf.length!==11){setError('Informe um CPF com 11 dígitos.');setBusy(false);return}
   let patientId:string|null=null;const existing=await s.from('patients').select('id').eq('cpf',cleanCpf).maybeSingle();if(existing.error){setError(existing.error.message);setBusy(false);return}if(existing.data?.id){patientId=existing.data.id;const up=await s.from('patients').update({full_name:name.trim(),birth_date:brToIso(birth),phone:phone.trim(),email:email.trim()||null}).eq('id',patientId);if(up.error){setError(up.error.message);setBusy(false);return}}else{const p=await s.from('patients').insert({full_name:name.trim(),birth_date:brToIso(birth),cpf:cleanCpf,phone:phone.trim(),email:email.trim()||null}).select('id').single();if(p.error||!p.data){setError(p.error?.message||'Falha ao criar paciente');setBusy(false);return}patientId=p.data.id}
   const code=Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b%32]).join('').match(/.{1,4}/g)!.join('-');const hashBuf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(code.toUpperCase()));const codeHash=Array.from(new Uint8Array(hashBuf)).map(b=>b.toString(16).padStart(2,'0')).join('');
   const x=await s.from('exams').insert({patient_id:patientId,exam_date:brToIso(date),exam_type:type,status:'created',created_by:u?.id||null,patient_access_code:code,patient_access_code_hash:codeHash,preregistered_at:new Date().toISOString()}).select('id,exam_date,exam_type,appointment_time,payer,appointment_status,neurovirtual_id,status,doctor_id,patient_access_code,patient:patients(full_name,birth_date,cpf,phone,email),doctor:profiles!exams_doctor_id_fkey(full_name)').single();if(x.error||!x.data){setError(x.error?.message||'Falha ao pré-cadastrar exame');setBusy(false);return}
   await s.from('audit_logs').insert({user_id:u?.id,exam_id:x.data.id,action:'exam_preregistered',metadata:{code_issued:true}});setName('');setBirth('');setCpf('');setPhone('');setEmail('');setDate(new Date().toLocaleDateString('pt-BR'));setShow(false);setOk('Pré-cadastro criado. Entregue o código/QR ao paciente. Após o exame, complete o registro para enviá-lo à técnica.');await load();setProtocol(x.data as unknown as Exam);setBusy(false)}
 async function finishExam(){if(!completing)return;setBusy(true);setError('');setOk('');const s=createClient(),u=(await s.auth.getUser()).data.user;for(const f of files){const safe=f.name.replace(/[^a-zA-Z0-9._-]/g,'_'),path=`${completing.id}/sleep_questionnaire/${Date.now()}-${safe}`;const up=await s.storage.from('isj-documents').upload(path,f);if(up.error){setError('Upload falhou: '+up.error.message);setBusy(false);return}const q=await s.from('documents').insert({exam_id:completing.id,type:'sleep_questionnaire',storage_path:path,original_filename:f.name,mime_type:f.type||null,size_bytes:f.size,uploaded_by:u?.id||null});if(q.error){setError(q.error.message);setBusy(false);return}}
   const sent=await s.rpc('send_exam_to_technician',{p_exam_id:completing.id,p_neurovirtual_id:nv.trim()});if(sent.error){setError(sent.error.message);setBusy(false);return}await s.from('audit_logs').insert({user_id:u?.id,exam_id:completing.id,action:'exam_sent_to_technician',metadata:{questionnaire_files:files.length,neurovirtual_id:nv.trim()||null,assignment:'round_robin'}});setCompleting(null);setNv('');setFiles([]);setOk('Exame concluído na recepção, médico atribuído pelo rodízio e enviado à fila técnica.');await load();setBusy(false)}
 async function reopenPreSleep(e:Exam){if(preStatus[e.id]!=='completed')return;const confirmed=window.confirm(`Reabrir o pré-sono de ${e.patient?.full_name||'este paciente'}?\n\nO paciente poderá editar novamente as respostas usando o mesmo código e data de nascimento.`);if(!confirmed)return;setBusy(true);setError('');setOk('');const s=createClient();const session=(await s.auth.getSession()).data.session;if(!session){setError('Sessão inválida. Entre novamente.');setBusy(false);return}const r=await fetch('/api/pre-sleep/reopen',{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${session.access_token}`},body:JSON.stringify({examId:e.id})});const j=await r.json();if(!r.ok){setError(j.error||'Falha ao reabrir pré-sono.');setBusy(false);return}setOk('Pré-sono reaberto. O paciente pode corrigir e concluir novamente usando o mesmo código.');await load();setBusy(false)}
 function printProtocol(e:Exam){setProtocol(e);setTimeout(()=>window.print(),200)}
 const closedStatuses=new Set(['finalized','released','rectified']);
 const activeCount=exams.filter(e=>!closedStatuses.has(e.status)).length;
 const finalizedCount=exams.filter(e=>closedStatuses.has(e.status)).length;
 const normalizeSearch=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();
 const visibleExams=exams.filter(e=>{
   if(view==='active'&&closedStatuses.has(e.status))return false;
   if(view==='finalized'&&!closedStatuses.has(e.status))return false;
   const raw=search.trim(); if(!raw)return true;
   const q=normalizeSearch(raw);
   const hay=normalizeSearch([e.patient?.full_name,e.patient?.cpf,e.patient_access_code,e.neurovirtual_id,e.exam_type,e.payer,e.doctor?.full_name].filter(Boolean).join(' '));
   const qDigits=onlyDigits(raw);
   return hay.includes(q)||(qDigits.length>0&&onlyDigits(hay).includes(qDigits));
 });
 return <>
  <section className="card" style={{marginBottom:18}}><div className="top" style={{marginBottom:0}}><div><h2 className="section-title">Exames</h2><span className="muted">{activeCount} em andamento • {finalizedCount} finalizado(s) • {exams.length} total</span></div><div className="toolbar"><AgendaImport/><button className="btn primary" onClick={()=>setShow(!show)}>+ Pré-cadastrar exame</button></div></div></section>
  {error&&<div className="message error">{error}</div>}{ok&&<div className="message ok">{ok}</div>}
  {show&&<section className="card" style={{marginBottom:18}}><h2 className="section-title">Pré-cadastro do paciente</h2><div className="message info">Faça este cadastro quando o paciente chegar. O código de acompanhamento nasce agora; o médico só será consumido no rodízio depois que o exame estiver realizado.</div><form className="form-grid" onSubmit={preregister}>
   <div className="field"><label>Nome completo</label><input className="input" required value={name} onChange={e=>setName(e.target.value)}/></div><div className="field"><label>Data de nascimento</label><input className="input" inputMode="numeric" required value={birth} onChange={e=>setBirth(maskDate(e.target.value))} placeholder="DD/MM/AAAA" maxLength={10}/></div>
   <div className="field"><label>CPF</label><input className="input" required value={fmtCpf(cpf)} onChange={e=>setCpf(e.target.value)} placeholder="000.000.000-00"/></div><div className="field"><label>Telefone</label><input className="input" required value={phone} onChange={e=>setPhone(e.target.value)} placeholder="(11) 99999-9999"/></div>
   <div className="field"><label>E-mail (opcional)</label><input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)}/></div><div className="field"><label>Data do exame</label><input className="input" inputMode="numeric" required value={date} onChange={e=>setDate(maskDate(e.target.value))} placeholder="DD/MM/AAAA" maxLength={10}/></div>
   <div className="field"><label>Tipo</label><select className="select" value={type} onChange={e=>setType(e.target.value)}>{['Basal','CPAP','Split-night','Bruxismo','Latência','Neuro','Outro'].map(v=><option key={v}>{v}</option>)}</select></div><div className="field"><label>Médico laudador</label><div className="auto-field">Será definido após o exame — rodízio sequencial</div></div>
   <div className="toolbar full"><button className="btn primary" disabled={busy}>{busy?'Criando…':'Gerar código do paciente'}</button><button type="button" className="btn" onClick={()=>setShow(false)}>Cancelar</button></div></form></section>}
  {rawExam&&<section className="card" style={{marginBottom:18}}>
    <div className="top"><div><h2 className="section-title">Arquivo da polissonografia — {rawExam.patient?.full_name}</h2><div className="muted">Jundiaí → nuvem → técnica em Sorocaba</div></div><button className="btn" onClick={()=>setRawExam(null)}>Fechar</button></div>
    <RawStudyBox examId={rawExam.id} current={rawFiles[rawExam.id]||null} onChanged={load}/>
  </section>}
  {completing&&<section className="card" style={{marginBottom:18}}><h2 className="section-title">Completar exame realizado — {completing.patient?.full_name}</h2><div className="form-grid"><div className="field"><label>Nº / ID Neurovirtual</label><input className="input" value={nv} onChange={e=>setNv(e.target.value)} placeholder="Ex.: 3047"/></div><div className="field full"><label>Pré/pós-sono em arquivo (fallback opcional)</label><input className="input" type="file" multiple accept="application/pdf,image/jpeg,image/png" onChange={e=>setFiles(Array.from(e.target.files||[]))}/><small className="muted">Use apenas se o pré-sono digital não estiver disponível ou houver documento complementar.</small></div><div className="toolbar full"><button className="btn primary" disabled={busy} onClick={finishExam}>{busy?'Enviando…':'Enviar para técnica'}</button><button className="btn" onClick={()=>{setCompleting(null);setNv('');setFiles([])}}>Cancelar</button></div></div></section>}
  <section className="card" style={{marginBottom:18}}><div className="exam-list-head"><div><h2 className="section-title">Exames</h2><div className="exam-tabs"><button className={`btn ${view==='active'?'primary':''}`} onClick={()=>setView('active')}>Em andamento ({activeCount})</button><button className={`btn ${view==='finalized'?'primary':''}`} onClick={()=>setView('finalized')}>Finalizados ({finalizedCount})</button><button className={`btn ${view==='all'?'primary':''}`} onClick={()=>setView('all')}>Todos ({exams.length})</button></div></div><div className="exam-search"><input className="input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar nome, CPF, código ou Neurovirtual"/></div></div>{!visibleExams.length?<div className="empty">{search?'Nenhum exame encontrado para esta busca.':view==='active'?'Nenhum exame em andamento.':view==='finalized'?'Nenhum exame finalizado.':'Nenhum exame cadastrado.'}</div>:<div className="table-scroll"><table><thead><tr><th>Paciente</th><th>Data/Hora</th><th>Tipo</th><th>Neurovirtual</th><th>Médico</th><th>Status</th><th>Código</th><th>Ações</th></tr></thead><tbody>{visibleExams.map(e=><tr key={e.id}><td><b>{e.patient?.full_name||'—'}</b><div className="muted">CPF {e.patient?.cpf?fmtCpf(e.patient.cpf):'—'} • Nasc. {e.patient?.birth_date?new Date(e.patient.birth_date+'T12:00:00').toLocaleDateString('pt-BR'):'—'}</div><div className="muted">Pré-sono: <b>{preStatus[e.id]==='completed'?'Concluído':preStatus[e.id]==='in_progress'?'Em preenchimento':'Não iniciado'}</b></div></td><td>{new Date(e.exam_date+'T12:00:00').toLocaleDateString('pt-BR')}{e.appointment_time?<div className="muted">{e.appointment_time.slice(0,5)}</div>:null}</td><td>{e.exam_type}{e.payer?<div className="muted">{e.payer}</div>:null}</td><td>{e.neurovirtual_id||'—'}<div className="muted">Nuvem: {rawSize[e.id]?`${(rawSize[e.id]/1024/1024).toFixed(1)} MB`:'pendente'}</div></td><td>{e.doctor?.full_name||'Ainda não atribuído'}</td><td><span className={`badge ${closedStatuses.has(e.status)?'active':'pending'}`}>{labels[e.status]||e.status}</span></td><td><code>{e.patient_access_code||'—'}</code></td><td><div className="toolbar"><button className="btn" onClick={()=>printProtocol(e)}>Protocolo</button>{!closedStatuses.has(e.status)&&<button className="btn" onClick={()=>setRawExam(e)}>{rawFiles[e.id]?'Ver/substituir PSG':'Enviar PSG à nuvem'}</button>}{preStatus[e.id]==='completed'&&<button className="btn" disabled={busy} onClick={()=>reopenPreSleep(e)}>Reabrir pré-sono</button>}{e.status==='created'&&<button className="btn primary" onClick={()=>{setCompleting(e);setNv(e.neurovirtual_id||'');setFiles([])}}>Completar pós-exame</button>}</div></td></tr>)}</tbody></table></div>}</section>
  {protocol&&<div className="protocol-overlay"><div className="protocol-card" id="patient-protocol"><img className="isj-logo protocol-logo-img" src="/isj-logo.png" alt="Instituto do Sono Jundiaí"/><div className="muted">Acompanhe seu exame</div><h2>{protocol.patient?.full_name}</h2><div>Exame: {new Date(protocol.exam_date+'T12:00:00').toLocaleDateString('pt-BR')}</div><div className="protocol-code">{protocol.patient_access_code}</div>{protocol.patient_access_code&&<QRCodeSVG value={`${baseUrl}/paciente?code=${encodeURIComponent(protocol.patient_access_code)}`} size={180} includeMargin/>}<p>Escaneie o QR Code ou acesse o portal do Instituto. Use o mesmo código + sua data de nascimento para <b>preencher o questionário pré-exame</b> e, depois, consultar o resultado.</p><div className="toolbar no-print"><button className="btn primary" onClick={()=>window.print()}>Imprimir</button><button className="btn" onClick={()=>setProtocol(null)}>Fechar</button></div></div></div>}
 </>;
}
