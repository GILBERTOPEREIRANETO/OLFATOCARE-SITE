'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Profile = { role: 'admin'|'reception'|'polysomnography_technician'|'technician'|'doctor'|'pending'; active: boolean };

function destination(profile: Profile) {
  if (!profile.active || profile.role === 'pending') return null;
  if (profile.role === 'admin') return '/admin';
  if (profile.role === 'reception') return '/recepcao';
  if (profile.role === 'polysomnography_technician') return '/polissonografia';
  if (profile.role === 'technician') return '/tecnica';
  if (profile.role === 'doctor') return '/medico';
  return null;
}

export default function Home() {
  const router = useRouter();
  const [loginEmail,setLoginEmail] = useState('');
  const [loginPassword,setLoginPassword] = useState('');
  const [loginMsg,setLoginMsg] = useState('');
  const [signupMsg,setSignupMsg] = useState('');
  const [busy,setBusy] = useState(false);
  const [showSignup,setShowSignup] = useState(false);

  useEffect(() => {
    async function existingSession() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('role,active').eq('id',user.id).single();
      if (!data) return;
      const target = destination(data as Profile);
      if (target) router.replace(target);
    }
    existingSession();
  }, [router]);

  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setLoginMsg('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({email:loginEmail,password:loginPassword});
    if (error) { setLoginMsg('E-mail ou senha inválidos.'); setBusy(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoginMsg('Não foi possível abrir a sessão.'); setBusy(false); return; }
    const { data: profile } = await supabase.from('profiles').select('role,active').eq('id',user.id).single();
    if (!profile) { setLoginMsg('Conta sem perfil cadastrado. Fale com o administrador.'); setBusy(false); return; }
    const target = destination(profile as Profile);
    if (!target) {
      setLoginMsg('Seu cadastro ainda está aguardando aprovação do administrador.');
      await supabase.auth.signOut();
      setBusy(false); return;
    }
    router.push(target);
  }

  async function signup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setSignupMsg('');
    const form = new FormData(e.currentTarget);
    const fullName = String(form.get('full_name') || '').trim();
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    const requestedRole = String(form.get('requested_role') || '');
    const crm = String(form.get('crm') || '').trim();
    if (!fullName || !email || password.length < 8 || !['reception','polysomnography_technician','technician','doctor'].includes(requestedRole)) {
      setSignupMsg('Preencha todos os campos. A senha deve ter pelo menos 8 caracteres.'); setBusy(false); return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, requested_role: requestedRole, crm } },
    });
    if (error) { setSignupMsg(error.message); setBusy(false); return; }
    setSignupMsg('Cadastro recebido. Se o Supabase solicitar confirmação de e-mail, confirme-o. O acesso só será liberado após aprovação do administrador.');
    (e.currentTarget as HTMLFormElement).reset();
    setBusy(false);
  }

  return <main className="auth-shell">
    <div className="auth-head"><img className="isj-logo isj-logo-home" src="/isj-logo.png" alt="Instituto do Sono Jundiaí"/><div className="muted">Sistema de laudos de polissonografia</div></div>
    <Link href="/paciente" className="patient-hero">PACIENTE — ACESSE SEU RESULTADO</Link>
    <div className="auth-grid single-login">
      <section className="card"><h2 className="section-title">Acesso da equipe</h2>
        <form onSubmit={login}>
          <div className="field"><label>E-mail</label><input className="input" type="email" required value={loginEmail} onChange={e=>setLoginEmail(e.target.value)}/></div>
          <div className="field"><label>Senha</label><input className="input" type="password" required value={loginPassword} onChange={e=>setLoginPassword(e.target.value)}/></div>
          {loginMsg && <div className="message error">{loginMsg}</div>}
          <button className="btn primary" style={{width:'100%'}} disabled={busy}>Entrar</button>
        </form>
        <p className="muted" style={{fontSize:13,marginTop:16}}>Acesso individual da equipe autorizada.</p>
      </section>
    </div>
    <div className="professional-toggle"><button className="link-button" onClick={()=>setShowSignup(!showSignup)}>Solicitar acesso profissional</button></div>
    {showSignup&&<section className="card signup-card"><h2 className="section-title">Solicitar acesso profissional</h2>
      <form onSubmit={signup} className="form-grid">
        <div className="field"><label>Nome completo</label><input className="input" name="full_name" required/></div>
        <div className="field"><label>E-mail</label><input className="input" name="email" type="email" required/></div>
        <div className="field"><label>Função</label><select className="select" name="requested_role" required defaultValue=""><option value="" disabled>Selecione</option><option value="reception">Recepção</option><option value="polysomnography_technician">Técnica de Polissonografia</option><option value="technician">Laudadora</option><option value="doctor">Médico</option></select></div>
        <div className="field"><label>CRM (somente médico)</label><input className="input" name="crm"/></div>
        <div className="field full"><label>Crie uma senha</label><input className="input" name="password" type="password" minLength={8} required/></div>
        {signupMsg && <div className="message ok full">{signupMsg}</div>}
        <button className="btn full" disabled={busy}>Enviar solicitação</button>
      </form>
    </section>}
  </main>;
}
