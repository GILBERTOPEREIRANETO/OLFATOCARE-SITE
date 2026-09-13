'use client';
import {useCallback,useEffect,useState} from 'react';
import {createClient} from '@/lib/supabase/client';

type Report={
 exam_id:string;arrival_time:string|null;room_lab:string|null;neck_cm:number|null;abdomen_cm:number|null;
 basal_spo2:number|null;snoring_present:boolean|null;snoring_intensity:string|null;snoring_frequency:string|null;
 pap_mode:string|null;mask_type:string|null;initial_pressure:number|null;final_pressure:number|null;usual_pressure:number|null;
 post_slept_well:boolean|null;post_discomfort:string|null;post_discomfort_reason:string|null;post_pain:boolean|null;post_pain_location:string|null;
 post_sleep_timing:string|null;post_more_sleep_minutes:number|null;post_wake_timing:string|null;post_rested:boolean|null;post_estimated_sleep_hours:number|null;
 general_notes:string|null;completed_at:string|null;
};
type Event={id:string;event_time:string|null;category:string;description:string;pressure_cmh2o:number|null;spo2:number|null};

const yn=(v:boolean|null|undefined)=>v===true?'Sim':v===false?'Não':'—';
const label=(v:string|null|undefined)=>v?({'none':'Nenhum','moderate':'Moderado','much':'Muito','earlier':'Mais cedo','usual':'Horário habitual','later':'Mais tarde','absent':'Ausente','present':'Presente','light':'Leve','intense':'Intenso','sporadic':'Esporádico','intermittent':'Intermitente','constant':'Constante'} as Record<string,string>)[v]||v:'—';

export default function TechnicalNightPanel({examId,compact=false}:{examId:string;compact?:boolean}){
 const [report,setReport]=useState<Report|null>(null),[events,setEvents]=useState<Event[]>([]);
 const load=useCallback(async()=>{const s=createClient();const [r,e]=await Promise.all([
   s.from('sleep_technical_reports').select('*').eq('exam_id',examId).maybeSingle(),
   s.from('sleep_technical_events').select('id,event_time,category,description,pressure_cmh2o,spo2').eq('exam_id',examId).order('event_time',{ascending:true})
 ]);if(!r.error)setReport(r.data as Report|null);if(!e.error)setEvents((e.data||[]) as Event[])},[examId]);
 useEffect(()=>{load()},[load]);
 if(!report&&!events.length)return <div className="message info">Registro técnico da noite ainda não preenchido.</div>;
 return <div className={compact?'night-summary compact-night':'night-summary'}>
   <div className="night-summary-grid">
    <div><b>Saturação basal:</b> {report?.basal_spo2??'—'}{report?.basal_spo2!=null?'%':''}</div>
    <div><b>Ronco:</b> {yn(report?.snoring_present)}{report?.snoring_present?` • ${label(report.snoring_intensity)} • ${label(report.snoring_frequency)}`:''}</div>
    <div><b>CPAP:</b> {report?.pap_mode||'—'}{report?.mask_type?` • ${report.mask_type}`:''}</div>
    <div><b>Pressão:</b> inicial {report?.initial_pressure??'—'} • final {report?.final_pressure??'—'} cmH₂O</div>
   </div>
   {events.length>0&&<div className="night-events"><b>Eventos da noite</b>{events.map(x=><div className="night-event" key={x.id}><span>{x.event_time?.slice(0,5)||'—'}</span><span><b>{x.category}</b> — {x.description}{x.pressure_cmh2o!=null?` • CPAP ${x.pressure_cmh2o} cmH₂O`:''}{x.spo2!=null?` • SpO₂ ${x.spo2}%`:''}</span></div>)}</div>}
   {report&&<div className="post-sleep-summary"><b>Pós-sono</b><div>Dormiu bem: {yn(report.post_slept_well)} • Descansado: {yn(report.post_rested)} • Sono estimado: {report.post_estimated_sleep_hours??'—'} h</div>{report.post_discomfort_reason&&<div>Incômodo: {report.post_discomfort_reason}</div>}{report.post_pain&&<div>Dor: {report.post_pain_location||'referida'}</div>}</div>}
   {report?.general_notes&&<div><b>Observações:</b> {report.general_notes}</div>}
 </div>
}
