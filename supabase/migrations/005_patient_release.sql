-- V5: liberação ao paciente. Não adiciona enum novo.
-- O PDF completo enviado pela técnica usa document_type = neurovirtual_report.

create or replace function public.patient_result_lookup(p_code_hash text, p_birth_date date)
returns table(exam_id uuid, patient_name text, exam_date date, status public.exam_status, final_storage_path text)
language sql
security definer
set search_path = public
as $$
  select e.id, p.full_name, e.exam_date, e.status, d.storage_path
  from public.exams e
  join public.patients p on p.id = e.patient_id
  left join public.report_versions rv on rv.exam_id=e.id and rv.is_current=true and rv.finalized_at is not null
  left join public.documents d on d.id=rv.finalized_pdf_document_id
  where e.patient_access_code_hash = p_code_hash
    and p.birth_date = p_birth_date
  limit 1;
$$;
revoke all on function public.patient_result_lookup(text,date) from public, anon, authenticated;

alter table public.exams add column if not exists patient_access_code text;
