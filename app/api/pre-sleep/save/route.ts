export const runtime = 'nodejs';
export const maxDuration = 30;
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
function sc(){const u=process.env.NEXT_PUBLIC_SUPABASE_URL!,k=process.env.SUPABASE_SECRET_KEY;return k?createClient(u,k,{auth:{persistSession:false,autoRefreshToken:false}}):null}
function h(c:string){return createHash('sha256').update(String(c).trim().toUpperCase()).digest('hex')}
export async function POST(req:NextRequest){try{const {code,birthDate,answers}=await req.json();const s=sc();if(!s)return NextResponse.json({error:'Servidor não configurado.'},{status:500});const {data,error}=await s.rpc('pre_sleep_save',{p_code_hash:h(code),p_birth_date:birthDate,p_answers:answers||{}});if(error)return NextResponse.json({error:error.message},{status:400});return NextResponse.json({success:!!data})}catch(e:any){console.error('pre-sleep save:',e);return NextResponse.json({error:e?.message||'Falha ao salvar.'},{status:500})}}
