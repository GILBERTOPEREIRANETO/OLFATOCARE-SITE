'use client';

import {useMemo,useRef,useState} from 'react';
import * as tus from 'tus-js-client';
import {createClient} from '@/lib/supabase/client';

export type RawStudyInfo={
  id:string;
  exam_id:string;
  storage_path:string;
  original_filename:string;
  mime_type:string|null;
  size_bytes:number;
  created_at?:string;
};

function safeName(name:string){return name.replace(/[^a-zA-Z0-9._,'!*$@=;:+?() -]/g,'_').replace(/\s+/g,'_')}
export function formatBytes(bytes:number|null|undefined){
  if(bytes==null)return '—';
  if(bytes>=1024**3)return `${(bytes/1024**3).toFixed(2)} GB`;
  if(bytes>=1024**2)return `${(bytes/1024**2).toFixed(1)} MB`;
  if(bytes>=1024)return `${(bytes/1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

export default function RawStudyBox({examId,current,onChanged,canUpload=true,canDownload=true}:{examId:string;current?:RawStudyInfo|null;onChanged?:()=>void|Promise<void>;canUpload?:boolean;canDownload?:boolean}){
  const [file,setFile]=useState<File|null>(null),[progress,setProgress]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState(''),[ok,setOk]=useState('');
  const uploadRef=useRef<tus.Upload|null>(null);
  const publicKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'';
  const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL||'';
  const directEndpoint=useMemo(()=>{
    if(!supabaseUrl)return '';
    try{
      const u=new URL(supabaseUrl);
      const host=u.hostname.endsWith('.supabase.co')?u.hostname.replace('.supabase.co','.storage.supabase.co'):u.hostname;
      return `${u.protocol}//${host}/storage/v1/upload/resumable`;
    }catch{return `${supabaseUrl.replace(/\/$/,'')}/storage/v1/upload/resumable`}
  },[supabaseUrl]);

  async function download(){
    if(!current)return;
    setError('');
    const q=await createClient().storage.from('isj-psg-raw').createSignedUrl(current.storage_path,900,{download:current.original_filename});
    if(q.error)return setError(q.error.message);
    window.open(q.data.signedUrl,'_blank');
  }

  async function startUpload(){
    if(!file)return setError('Selecione o arquivo bruto da polissonografia.');
    if(file.size>1024**3)return setError('Nesta versão o sistema aceita até 1 GB por estudo.');
    if(!directEndpoint||!publicKey)return setError('Configuração do Supabase ausente.');
    setBusy(true);setError('');setOk('');setProgress(0);
    const s=createClient();
    const session=(await s.auth.getSession()).data.session;
    const user=session?.user;
    if(!session||!user){setError('Sessão expirada. Entre novamente.');setBusy(false);return}
    const objectName=`${examId}/${Date.now()}-${safeName(file.name)}`;
    const oldPath=current?.storage_path||null;
    const upload=new tus.Upload(file,{
      endpoint:directEndpoint,
      retryDelays:[0,3000,5000,10000,20000],
      chunkSize:6*1024*1024,
      removeFingerprintOnSuccess:true,
      headers:{
        authorization:`Bearer ${session.access_token}`,
        apikey:publicKey,
        'x-upsert':'false'
      },
      metadata:{
        bucketName:'isj-psg-raw',
        objectName,
        contentType:file.type||'application/octet-stream',
        cacheControl:'3600'
      },
      onError:(e)=>{setError(`Falha no upload: ${e.message}`);setBusy(false)},
      onProgress:(sent,total)=>setProgress(total?Math.round(sent/total*100):0),
      onSuccess:async()=>{
        const row={exam_id:examId,storage_path:objectName,original_filename:file.name,mime_type:file.type||null,size_bytes:file.size,uploaded_by:user.id,updated_at:new Date().toISOString()};
        const q=await s.from('psg_raw_files').upsert(row,{onConflict:'exam_id'});
        if(q.error){setError(`Arquivo enviado, mas o registro falhou: ${q.error.message}`);setBusy(false);return}
        if(oldPath&&oldPath!==objectName)await s.storage.from('isj-psg-raw').remove([oldPath]);
        await s.from('audit_logs').insert({user_id:user.id,exam_id:examId,action:oldPath?'psg_raw_replaced':'psg_raw_uploaded',metadata:{filename:file.name,size_bytes:file.size,storage_path:objectName}});
        setFile(null);setProgress(100);setOk(oldPath?'Estudo bruto substituído na nuvem.':'Estudo bruto armazenado na nuvem.');setBusy(false);await onChanged?.();
      }
    });
    uploadRef.current=upload;
    try{
      const previous=await upload.findPreviousUploads();
      if(previous.length)upload.resumeFromPreviousUpload(previous[0]);
      upload.start();
    }catch(e:any){setError(e?.message||'Não foi possível iniciar o upload.');setBusy(false)}
  }

  function cancel(){uploadRef.current?.abort();setBusy(false);setError('Upload pausado. Ao selecionar novamente o mesmo arquivo, o sistema tentará retomar do ponto anterior.')}

  return <div className="raw-study-box">
    <div className="top raw-study-head"><div><b>Estudo bruto Neurovirtual — nuvem</b><div className="muted small">Arquivo original da polissonografia. Upload resumível para arquivos grandes.</div></div>{current&&<span className="badge active">Disponível</span>}</div>
    {current?<div className="raw-study-current"><div><b>{current.original_filename}</b><div className="muted">{formatBytes(current.size_bytes)}</div></div>{canDownload&&<button className="btn" onClick={download}>Baixar estudo</button>}</div>:<div className="message info">Nenhum estudo bruto enviado para a nuvem.</div>}
    {canUpload&&<>
      <div className="field" style={{marginTop:12}}><label>{current?'Substituir estudo bruto':'Enviar estudo bruto'}</label><input className="input" type="file" onChange={e=>{setFile(e.target.files?.[0]||null);setProgress(0);setError('');setOk('')}}/><small className="muted">Para arquivos grandes, o upload é resumível e pode ser retomado em caso de interrupção.</small></div>
      {file&&<div className="muted small">Selecionado: {file.name} • {formatBytes(file.size)}</div>}
      {busy&&<><div className="upload-progress"><div style={{width:`${progress}%`}}/></div><div className="muted small">Enviando… {progress}%</div></>}
      {error&&<div className="message error">{error}</div>}{ok&&<div className="message ok">{ok}</div>}
      <div className="toolbar"><button className="btn primary" disabled={!file||busy} onClick={startUpload}>{busy?'Enviando…':current?'Substituir na nuvem':'Enviar para nuvem'}</button>{busy&&<button className="btn" onClick={cancel}>Pausar</button>}</div>
    </>}
    {!canUpload&&error&&<div className="message error">{error}</div>}
  </div>
}
