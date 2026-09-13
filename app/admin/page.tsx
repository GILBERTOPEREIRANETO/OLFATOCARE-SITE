'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RoleGuard from '@/components/role-guard';
import { createClient } from '@/lib/supabase/client';
import ExamAdmin from '@/components/exam-admin';

type Role = 'admin'|'reception'|'polysomnography_technician'|'technician'|'doctor'|'pending';
type Profile = { id:string; full_name:string; email:string|null; role:Role; requested_role:Role|null; crm:string|null; active:boolean; created_at:string };

const roleLabel: Record<Role,string> = {admin:'Administrador',reception:'Recepção',polysomnography_technician:'Técnica de Polissonografia',technician:'Laudadora',doctor:'Médico',pending:'Pendente'};

export default function AdminPage(){
  const router=useRouter();
  const [profiles,setProfiles]=useState<Profile[]>([]);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState<string|null>(null);

  const load=useCallback(async()=>{
    const supabase=createClient();
    const {data,error}=await supabase.from('profiles').select('id,full_name,email,role,requested_role,crm,active,created_at').order('created_at',{ascending:false});
    if(error){setError(error.message);return;} setProfiles((data||[]) as Profile[]);
  },[]);
  useEffect(()=>{load();},[load]);

  async function approve(p:Profile,role:Exclude<Role,'pending'>){
    setBusy(p.id);setError('');const supabase=createClient();
    const {error}=await supabase.from('profiles').update({role,active:true,approved_at:new Date().toISOString()}).eq('id',p.id);
    if(error)setError(error.message); else await load(); setBusy(null);
  }
  async function deactivate(p:Profile){
    if(p.role==='admin') return;
    setBusy(p.id);const supabase=createClient();
    const {error}=await supabase.from('profiles').update({active:false}).eq('id',p.id);
    if(error)setError(error.message); else await load(); setBusy(null);
  }
  async function logout(){const supabase=createClient();await supabase.auth.signOut();router.replace('/');}

  const pending=profiles.filter(p=>p.role==='pending'||!p.active);
  const active=profiles.filter(p=>p.active&&p.role!=='pending');

  return <RoleGuard allowed={['admin']}><main className="wrap">
    <div className="top"><div className="role-brand"><img className="isj-logo isj-logo-role" src="/isj-logo.png" alt="Instituto do Sono Jundiaí"/><div className="muted">Administração</div></div><div className="toolbar"><button className="btn" onClick={logout}>Sair</button></div></div>
    <div className="grid cards" style={{marginBottom:18}}><div className="card"><span className="muted">Solicitações pendentes</span><div className="metric">{pending.length}</div></div><div className="card"><span className="muted">Usuários ativos</span><div className="metric">{active.length}</div></div><div className="card"><span className="muted">Exames</span><div className="metric">—</div><small className="muted">próxima etapa</small></div></div>
    {error&&<div className="message error">{error}</div>}
    <ExamAdmin/><section className="card" style={{marginBottom:18}}><h2 className="section-title">Solicitações de acesso</h2>
      {pending.length===0?<div className="empty">Nenhuma solicitação pendente.</div>:pending.map(p=><div className="user-row" key={p.id}><div><b>{p.full_name}</b><div className="muted">{p.email||'—'}</div></div><div>Solicitou: <b>{p.requested_role?roleLabel[p.requested_role]:'—'}</b>{p.crm&&<div className="muted">CRM {p.crm}</div>}</div><select className="select" id={`role-${p.id}`} defaultValue={(p.requested_role && p.requested_role!=='pending')?p.requested_role:'reception'}><option value="reception">Recepção</option><option value="polysomnography_technician">Técnica de Polissonografia</option><option value="technician">Laudadora</option><option value="doctor">Médico</option></select><span className="badge pending">Aguardando</span><button className="btn primary" disabled={busy===p.id} onClick={()=>{const el=document.getElementById(`role-${p.id}`) as HTMLSelectElement;approve(p,el.value as Exclude<Role,'pending'>)}}>Aprovar</button></div>)}
    </section>
    <section className="card"><h2 className="section-title">Usuários ativos</h2>
      {active.map(p=><div className="user-row" key={p.id}><div><b>{p.full_name}</b><div className="muted">{p.email||'—'}</div></div><div>{roleLabel[p.role]}{p.crm&&<div className="muted">CRM {p.crm}</div>}</div><span className="badge active">Ativo</span><span></span>{p.role!=='admin'?<button className="btn danger" disabled={busy===p.id} onClick={()=>deactivate(p)}>Desativar</button>:<span className="muted">Conta principal</span>}</div>)}
    </section>
  </main></RoleGuard>;
}
