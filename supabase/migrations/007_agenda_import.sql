-- V7: importação da agenda diária XLS/XLSX para pré-cadastro em lote.
-- Mantém o cadastro manual para encaixes e exceções.

alter table public.exams
  add column if not exists appointment_time time,
  add column if not exists payer text,
  add column if not exists appointment_status text,
  add column if not exists import_source text,
  add column if not exists import_fingerprint text;

create unique index if not exists exams_import_fingerprint_unique
on public.exams(import_fingerprint)
where import_fingerprint is not null and import_fingerprint <> '';

create index if not exists exams_exam_date_appointment_time_idx
on public.exams(exam_date, appointment_time);
