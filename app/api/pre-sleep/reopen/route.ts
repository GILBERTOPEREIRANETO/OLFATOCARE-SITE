import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
export const runtime='nodejs';
export async function POST(req:NextRequest){try{
 const auth=req.headers.get('authorization')||''; const token=auth.startsWith('Bearer ')?auth.slice(7):'';
 if(!token)return NextResponse.json({error:'Sessão inválida.'},{status:401});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL!, pub=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, secret=process.env.SUPABASE_SECRET_KEY!;
 if(!url||!pub||!secret)return NextResponse.json({error:'Servidor não configurado.'},{status:500});
 const userClient=createClient(url,pub,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false}});
 const {data:{user},error:ue}=await userClient.auth.getUser(); if(ue||!user)return NextResponse.json({error:'Sessão inválida.'},{status:401});
 const service=createClient(url,secret,{auth:{persistSession:false}});
 const {data:profile,error:pe}=await service.from('profiles').select('role,active').eq('id',user.id).single();
 if(pe||!profile?.active||!['admin','reception'].includes(profile.role))return NextResponse.json({error:'Sem permissão para reabrir pré-sono.'},{status:403});
 const {examId}=await req.json(); if(!examId)return NextResponse.json({error:'Exame inválido.'},{status:400});
 const {data:q,error:qe}=await service.from('pre_sleep_questionnaires').select('status').eq('exam_id',examId).single();
 if(qe)return NextResponse.json({error:qe.message},{status:400}); if(q.status!=='completed')return NextResponse.json({error:'O pré-sono não está concluído.'},{status:400});
 const {error:up}=await service.from('pre_sleep_questionnaires').update({status:'in_progress',completed_at:null}).eq('exam_id',examId); if(up)return NextResponse.json({error:up.message},{status:400});
 await service.from('audit_logs').insert({user_id:user.id,exam_id:examId,action:'pre_sleep_reopened',metadata:{previous_status:'completed'}});
 return NextResponse.json({success:true});
}catch(e:any){console.error('pre-sleep reopen:',e);return NextResponse.json({error:e?.message||'Falha ao reabrir pré-sono.'},{status:500})}}
