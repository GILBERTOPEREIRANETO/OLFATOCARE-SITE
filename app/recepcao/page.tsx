'use client';
import {useRouter} from 'next/navigation';
import RoleGuard from '@/components/role-guard';
import ExamAdmin from '@/components/exam-admin';
import {createClient} from '@/lib/supabase/client';
export default function Recepcao(){const router=useRouter();async function logout(){await createClient().auth.signOut();router.replace('/')}return <RoleGuard allowed={['reception']}><main className="wrap"><div className="top"><div className="role-brand"><img className="isj-logo isj-logo-role" src="/isj-logo.png" alt="Instituto do Sono Jundiaí"/><div className="muted">Recepção</div></div><button className="btn" onClick={logout}>Sair</button></div><ExamAdmin reception/></main></RoleGuard>}
