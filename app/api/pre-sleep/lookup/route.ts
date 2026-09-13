export const runtime = 'nodejs';
export const maxDuration = 30;
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
function sc(){const u=process.env.NEXT_PUBLIC_SUPABASE_URL!,k=process.env.SUPABASE_SECRET_KEY;return k?createClient(u,k,{auth:{persistSession:false,autoRefreshToken:false}}):null}
function h(c:string){return createHash('sha256').update(String(c).trim().toUpperCase()).digest('hex')}
export async function POST(req:NextRequest){try{const {code,birthDate}=await req.json();if(!code||!birthDate)return NextResponse.json({error:'Informe código e nascimento.'},{status:400});const s=sc();if(!s)return NextResponse.json({error:'Servidor não configurado.'},{status:500});const {data,error}=await s.rpc('pre_sleep_lookup',{p_code_hash:h(code),p_birth_date:birthDate});if(error)return NextResponse.json({error:'Não foi possível abrir o questionário.'},{status:500});if(!data?.[0])return NextResponse.json({error:'Código ou data de nascimento não conferem.'},{status:404});return NextResponse.json(data[0])}catch(e:any){console.error('pre-sleep lookup:',e);return NextResponse.json({error:e?.message||'Falha na consulta.'},{status:500})}}
