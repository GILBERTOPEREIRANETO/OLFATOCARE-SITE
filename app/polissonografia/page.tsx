'use client';
import {useCallback,useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import RoleGuard from '@/components/role-guard';
import {createClient} from '@/lib/supabase/client';

type Exam={id:string;exam_date:string;exam_type:string;appointment_time:string|null;neurovirtual_id:string|null;patient:{full_name:string}|null};
type Event={id?:string;event_time:string;category:string;description:string;pressure_cmh2o:string;spo2:string};
const emptyEvent=():Event=>({event_time:'',category:'Observação',description:'',pressure_cmh2o:'',spo2:''});

export default function Polissonografia(){
 const router=useRouter(),[exams,setExams]=useState<Exam[]>([]),[selected,setSelected]=useState<Exam|null>(null),[report,setReport]=useState<any>({}),[events,setEvents]=useState<Event[]>([]),[error,setError]=useState(''),[ok,setOk]=useState(''),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{
   const s=createClient();
   const e=await s.from('exams')
     .select('id,exam_date,exam_type,appointment_time,neurovirtual_id,patient:patients(full_name)')
     .not('status','in','(\"released\",\"finalized\",\"rectified\")')
     .order('exam_date',{ascending:false})
     .limit(80);

   if(e.error){setError(e.error.message);return}

   const list=(e.data||[]) as unknown as Exam[];
   const ids=list.map(x=>x.id);
   if(!ids.length){setExams([]);return}

   const done=await s.from('sleep_technical_reports')
     .select('exam_id,completed_at')
     .in('exam_id',ids)
     .not('completed_at','is',null);

   if(done.error){setError(done.error.message);return}

   const completed=new Set((done.data||[]).map((x:any)=>x.exam_id));
   setExams(list.filter(x=>!completed.has(x.id)));
 },[]);
 useEffect(()=>{load()},[load]);
 async function open(e:Exam){setSelected(e);setError('');setOk('');const s=createClient();const [r,ev]=await Promise.all([s.from('sleep_technical_reports').select('*').eq('exam_id',e.id).maybeSingle(),s.from('sleep_technical_events').select('*').eq('exam_id',e.id).order('event_time')]);setReport(r.data||{});setEvents((ev.data||[]).map((x:any)=>({...x,event_time:x.event_time?.slice(0,5)||'',pressure_cmh2o:x.pressure_cmh2o?.toString()||'',spo2:x.spo2?.toString()||''})))}
 const set=(k:string,v:any)=>setReport((p:any)=>({...p,[k]:v}));
 async function save(complete=false){if(!selected)return;setBusy(true);setError('');setOk('');const s=createClient(),u=(await s.auth.getUser()).data.user;
   const row={exam_id:selected.id,arrival_time:report.arrival_time||null,room_lab:report.room_lab||null,neck_cm:report.neck_cm||null,abdomen_cm:report.abdomen_cm||null,basal_spo2:report.basal_spo2||null,snoring_present:report.snoring_present??null,snoring_intensity:report.snoring_intensity||null,snoring_frequency:report.snoring_frequency||null,pap_mode:report.pap_mode||null,mask_type:report.mask_type||null,initial_pressure:report.initial_pressure||null,final_pressure:report.final_pressure||null,usual_pressure:report.usual_pressure||null,post_slept_well:report.post_slept_well??null,post_discomfort:report.post_discomfort||null,post_discomfort_reason:report.post_discomfort_reason||null,post_pain:report.post_pain??null,post_pain_location:report.post_pain_location||null,post_sleep_timing:report.post_sleep_timing||null,post_more_sleep_minutes:report.post_more_sleep_minutes||null,post_wake_timing:report.post_wake_timing||null,post_rested:report.post_rested??null,post_estimated_sleep_hours:report.post_estimated_sleep_hours||null,general_notes:report.general_notes||null,updated_by:u?.id||null,completed_at:complete?new Date().toISOString():(report.completed_at||null)};
   const q=await s.from('sleep_technical_reports').upsert(row,{onConflict:'exam_id'});if(q.error){setError(q.error.message);setBusy(false);return}
   await s.from('sleep_technical_events').delete().eq('exam_id',selected.id);
   const valid=events.filter(x=>x.description.trim()).map(x=>({exam_id:selected.id,event_time:x.event_time||null,category:x.category,description:x.description.trim(),pressure_cmh2o:x.pressure_cmh2o?Number(x.pressure_cmh2o):null,spo2:x.spo2?Number(x.spo2):null,created_by:u?.id||null}));
   if(valid.length){const ev=await s.from('sleep_technical_events').insert(valid);if(ev.error){setError(ev.error.message);setBusy(false);return}}
   await s.from('audit_logs').insert({user_id:u?.id,exam_id:selected.id,action:complete?'sleep_technical_report_completed':'sleep_technical_report_saved',metadata:{events:valid.length}});
   setOk(complete?'Registro técnico concluído.':'Registro técnico salvo.');
   setReport((p:any)=>({...p,completed_at:complete?new Date().toISOString():p.completed_at}));
   if(complete){
     setSelected(null);
     await load();
   }
   setBusy(false)
 }
 async function logout(){await createClient().auth.signOut();router.replace('/')}
 return <RoleGuard allowed={['polysomnography_technician']}><main className="wrap wide">
  <div className="top"><div className="role-brand"><img className="isj-logo isj-logo-role" src="/isj-logo.png" alt="Instituto do Sono Jundiaí"/><div><div className="brand">Técnica de Polissonografia</div><div className="muted">Registro técnico da noite</div></div></div><button className="btn" onClick={logout}>Sair</button></div>
  {error&&<div className="message error">{error}</div>}{ok&&<div className="message ok">{ok}</div>}
  <section className="card"><h2 className="section-title">Exames em andamento</h2>{!exams.length?<div className="empty">Nenhum exame disponível.</div>:exams.map(e=><div className="night-exam-row" key={e.id}><div><b>{e.patient?.full_name}</b><div className="muted">{e.exam_type} • {new Date(e.exam_date+'T12:00:00').toLocaleDateString('pt-BR')} {e.appointment_time?.slice(0,5)||''}</div></div><button className="btn primary" onClick={()=>open(e)}>Registrar</button></div>)}</section>
  {selected&&<section className="card" style={{marginTop:18}}><div className="top"><div><h2 className="section-title">{selected.patient?.full_name}</h2><div className="muted">{selected.exam_type} • {new Date(selected.exam_date+'T12:00:00').toLocaleDateString('pt-BR')}</div></div><button className="btn" onClick={()=>setSelected(null)}>Fechar</button></div>
   <h3>Dados técnicos gerais</h3><div className="form-grid">
    <div className="field"><label>Horário de chegada</label><input className="input" type="time" value={report.arrival_time?.slice(0,5)||''} onChange={e=>set('arrival_time',e.target.value)}/></div>
    <div className="field"><label>Laboratório / quarto</label><input className="input" value={report.room_lab||''} onChange={e=>set('room_lab',e.target.value)}/></div>
    <div className="field"><label>Circunferência cervical (cm)</label><input className="input" type="number" step="0.1" value={report.neck_cm||''} onChange={e=>set('neck_cm',e.target.value)}/></div>
    <div className="field"><label>Circunferência abdominal (cm)</label><input className="input" type="number" step="0.1" value={report.abdomen_cm||''} onChange={e=>set('abdomen_cm',e.target.value)}/></div>
    <div className="field"><label>SpO₂ basal (%)</label><input className="input" type="number" min="50" max="100" value={report.basal_spo2||''} onChange={e=>set('basal_spo2',e.target.value)}/></div>
    <div className="field"><label>Ronco</label><select className="select" value={report.snoring_present===true?'yes':report.snoring_present===false?'no':''} onChange={e=>set('snoring_present',e.target.value===''?null:e.target.value==='yes')}><option value="">Selecione</option><option value="no">Ausente</option><option value="yes">Presente</option></select></div>
    <div className="field"><label>Intensidade do ronco</label><select className="select" value={report.snoring_intensity||''} onChange={e=>set('snoring_intensity',e.target.value)}><option value="">—</option><option value="light">Leve</option><option value="moderate">Moderado</option><option value="intense">Intenso</option></select></div>
    <div className="field"><label>Frequência do ronco</label><select className="select" value={report.snoring_frequency||''} onChange={e=>set('snoring_frequency',e.target.value)}><option value="">—</option><option value="sporadic">Esporádico</option><option value="intermittent">Intermitente</option><option value="constant">Constante</option></select></div>
   </div>
   <h3>CPAP / titulação <span className="muted small">(preencher quando aplicável)</span></h3><div className="form-grid">
    <div className="field"><label>Modalidade</label><select className="select" value={report.pap_mode||''} onChange={e=>set('pap_mode',e.target.value)}><option value="">Não se aplica</option><option>CPAP C-Flex</option><option>Auto CPAP</option><option>Auto CPAP A-Flex</option><option>BiPAP</option></select></div>
    <div className="field"><label>Máscara</label><select className="select" value={report.mask_type||''} onChange={e=>set('mask_type',e.target.value)}><option value="">—</option><option>Nasal</option><option>Oronasal</option></select></div>
    <div className="field"><label>Pressão inicial (cmH₂O)</label><input className="input" type="number" step="0.5" value={report.initial_pressure||''} onChange={e=>set('initial_pressure',e.target.value)}/></div>
    <div className="field"><label>Pressão final (cmH₂O)</label><input className="input" type="number" step="0.5" value={report.final_pressure||''} onChange={e=>set('final_pressure',e.target.value)}/></div>
    <div className="field"><label>Pressão habitual (cmH₂O)</label><input className="input" type="number" step="0.5" value={report.usual_pressure||''} onChange={e=>set('usual_pressure',e.target.value)}/></div>
   </div>
   <div className="night-events-editor"><div className="top"><div><h3>Linha do tempo da noite</h3><div className="muted">Registre CPAP, máscara, despertar, movimento, parassonia/sonambulismo e outras intercorrências.</div></div><button className="btn" onClick={()=>setEvents(p=>[...p,emptyEvent()])}>+ Adicionar evento</button></div>
    {events.length===0?<div className="empty">Nenhum evento registrado.</div>:events.map((x,i)=><div className="night-event-edit" key={i}><input className="input" type="time" value={x.event_time} onChange={e=>setEvents(p=>p.map((v,j)=>j===i?{...v,event_time:e.target.value}:v))}/><select className="select" value={x.category} onChange={e=>setEvents(p=>p.map((v,j)=>j===i?{...v,category:e.target.value}:v))}>{['Observação','CPAP','Máscara','Despertar','Movimento','Parassonia / sonambulismo','Ronco','Intercorrência'].map(v=><option key={v}>{v}</option>)}</select><input className="input" placeholder="Descreva o que ocorreu" value={x.description} onChange={e=>setEvents(p=>p.map((v,j)=>j===i?{...v,description:e.target.value}:v))}/><input className="input" type="number" step="0.5" placeholder="CPAP" value={x.pressure_cmh2o} onChange={e=>setEvents(p=>p.map((v,j)=>j===i?{...v,pressure_cmh2o:e.target.value}:v))}/><input className="input" type="number" placeholder="SpO₂" value={x.spo2} onChange={e=>setEvents(p=>p.map((v,j)=>j===i?{...v,spo2:e.target.value}:v))}/><button className="btn danger" onClick={()=>setEvents(p=>p.filter((_,j)=>j!==i))}>Excluir</button></div>)}
   </div>
   <h3>Pós-sono</h3><div className="form-grid">
    <div className="field"><label>Dormiu bem nesta noite?</label><select className="select" value={report.post_slept_well===true?'yes':report.post_slept_well===false?'no':''} onChange={e=>set('post_slept_well',e.target.value===''?null:e.target.value==='yes')}><option value="">Selecione</option><option value="yes">Sim</option><option value="no">Não</option></select></div>
    <div className="field"><label>Incômodo ao dormir no laboratório</label><select className="select" value={report.post_discomfort||''} onChange={e=>set('post_discomfort',e.target.value)}><option value="">Selecione</option><option value="none">Nenhum</option><option value="moderate">Moderado</option><option value="much">Muito</option></select></div>
    <div className="field full"><label>Se houve incômodo, qual?</label><input className="input" value={report.post_discomfort_reason||''} onChange={e=>set('post_discomfort_reason',e.target.value)}/></div>
    <div className="field"><label>Sentiu dor?</label><select className="select" value={report.post_pain===true?'yes':report.post_pain===false?'no':''} onChange={e=>set('post_pain',e.target.value===''?null:e.target.value==='yes')}><option value="">Selecione</option><option value="no">Não</option><option value="yes">Sim</option></select></div>
    <div className="field"><label>Onde?</label><input className="input" value={report.post_pain_location||''} onChange={e=>set('post_pain_location',e.target.value)}/></div>
    <div className="field"><label>Comparado ao habitual, dormiu</label><select className="select" value={report.post_sleep_timing||''} onChange={e=>set('post_sleep_timing',e.target.value)}><option value="">—</option><option value="earlier">Mais cedo</option><option value="usual">No horário normal</option><option value="later">Mais tarde</option></select></div>
    <div className="field"><label>Quanto tempo mais dormiria? (min)</label><input className="input" type="number" min="0" value={report.post_more_sleep_minutes||''} onChange={e=>set('post_more_sleep_minutes',e.target.value)}/></div>
    <div className="field"><label>Comparado ao habitual, despertou</label><select className="select" value={report.post_wake_timing||''} onChange={e=>set('post_wake_timing',e.target.value)}><option value="">—</option><option value="earlier">Mais cedo</option><option value="usual">No horário normal</option><option value="later">Mais tarde</option></select></div>
    <div className="field"><label>Sente-se descansado?</label><select className="select" value={report.post_rested===true?'yes':report.post_rested===false?'no':''} onChange={e=>set('post_rested',e.target.value===''?null:e.target.value==='yes')}><option value="">Selecione</option><option value="yes">Sim</option><option value="no">Não</option></select></div>
    <div className="field"><label>Quantas horas acha que dormiu?</label><input className="input" type="number" min="0" max="24" step="0.5" value={report.post_estimated_sleep_hours||''} onChange={e=>set('post_estimated_sleep_hours',e.target.value)}/></div>
    <div className="field full"><label>Observações gerais</label><textarea className="editor compact" value={report.general_notes||''} onChange={e=>set('general_notes',e.target.value)}/></div>
   </div>
   <div className="toolbar" style={{justifyContent:'flex-end'}}><button className="btn" disabled={busy} onClick={()=>save(false)}>Salvar rascunho</button><button className="btn primary" disabled={busy} onClick={()=>save(true)}>{busy?'Salvando…':'Concluir registro técnico'}</button></div>
  </section>}
 </main></RoleGuard>
}
