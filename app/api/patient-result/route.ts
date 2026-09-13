import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

export async function POST(req: NextRequest){
  try{
    const {code,birthDate}=await req.json();
    if(!code||!birthDate) return NextResponse.json({error:'Dados incompletos.'},{status:400});
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const secret=process.env.SUPABASE_SECRET_KEY;
    if(!secret) return NextResponse.json({error:'Servidor ainda não configurado para entrega de laudos.'},{status:500});
    const supabase=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
    const hash=createHash('sha256').update(String(code).trim().toUpperCase()).digest('hex');
    const {data,error}=await supabase.rpc('patient_result_lookup',{p_code_hash:hash,p_birth_date:birthDate});
    if(error) return NextResponse.json({error:'Não foi possível consultar o resultado.'},{status:500});
    const row=data?.[0];
    if(!row) return NextResponse.json({error:'Código ou data de nascimento não conferem.'},{status:404});
    if(!row.final_storage_path || !['released','finalized','rectified'].includes(row.status)) return NextResponse.json({ready:false,patientName:row.patient_name,examDate:row.exam_date,status:row.status});
    const signed=await supabase.storage.from('isj-documents').createSignedUrl(row.final_storage_path,300);
    if(signed.error) return NextResponse.json({error:'Não foi possível abrir o PDF.'},{status:500});
    return NextResponse.json({ready:true,patientName:row.patient_name,examDate:row.exam_date,url:signed.data.signedUrl});
  }catch{return NextResponse.json({error:'Falha na consulta.'},{status:500})}
}
