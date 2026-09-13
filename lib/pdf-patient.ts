export function normalizePersonName(v:string){
  return v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z ]/g,' ').replace(/\s+/g,' ').trim()
}

function scoreNameSimilarity(a:string,b:string){
  const aa=normalizePersonName(a).split(' ').filter(x=>x.length>1),bb=normalizePersonName(b).split(' ').filter(x=>x.length>1)
  if(!aa.length||!bb.length)return 0
  const sa=new Set(aa),sb=new Set(bb);let common=0;sa.forEach(x=>{if(sb.has(x))common++})
  return common/Math.max(sa.size,sb.size)
}

export function namesClearlyMismatch(registered:string,detected:string){
  const a=normalizePersonName(registered),b=normalizePersonName(detected)
  if(!a||!b)return false
  if(a===b)return false
  if(a.includes(b)||b.includes(a))return false
  return scoreNameSimilarity(a,b)<0.5
}

export async function extractPatientNameFromPdf(input:ArrayBuffer|Uint8Array){
  const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs')
  const data=input instanceof Uint8Array?input:new Uint8Array(input)
  const task=pdfjs.getDocument({data,disableWorker:true} as any)
  const pdf=await task.promise
  const maxPages=Math.min(pdf.numPages,3)
  const pages:string[]=[]
  for(let i=1;i<=maxPages;i++){
    const page=await pdf.getPage(i),content=await page.getTextContent()
    const txt=(content.items as any[]).map((x:any)=>String(x.str||'')).join(' ').replace(/\s+/g,' ').trim()
    pages.push(txt)
  }
  const all=pages.join('\n')
  const patterns=[
    /(?:NOME\s*(?:DO\s*PACIENTE)?\s*[:\-]\s*)([A-ZÀ-ÖØ-Ý][A-ZÀ-ÖØ-Ý'´`.-]+(?:\s+[A-ZÀ-ÖØ-Ý][A-ZÀ-ÖØ-Ý'´`.-]+){1,7})/i,
    /(?:PACIENTE\s*[:\-]\s*)([A-ZÀ-ÖØ-Ý][A-ZÀ-ÖØ-Ý'´`.-]+(?:\s+[A-ZÀ-ÖØ-Ý][A-ZÀ-ÖØ-Ý'´`.-]+){1,7})/i
  ]
  for(const p of patterns){const m=all.match(p);if(m?.[1])return m[1].trim().replace(/\s+/g,' ')}
  return ''
}
