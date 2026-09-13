alter table public.exams add column if not exists updated_at timestamptz not null default now();
alter table public.exams add column if not exists technician_started_at timestamptz;
create unique index if not exists exams_neurovirtual_id_unique on public.exams(neurovirtual_id) where neurovirtual_id is not null and neurovirtual_id <> '';
drop policy if exists "reception upload storage" on storage.objects;
create policy "reception upload storage" on storage.objects for insert to authenticated with check (bucket_id='isj-documents' and (public.is_admin() or public.is_reception()) and exists (select 1 from public.exams e where e.id::text=(storage.foldername(name))[1]));
