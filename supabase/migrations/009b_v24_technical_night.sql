-- ============================================================
-- ISJ-LAUDOS V2.4 — REGISTRO TÉCNICO DA NOITE
-- Rode SOMENTE depois do 009a ter concluído com Success.
-- ============================================================

create or replace function public.is_polysomnography_technician()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.profiles
    where id=auth.uid() and active=true and role='polysomnography_technician'::public.user_role
  );
$$;

-- Permite cadastro/solicitação do novo perfil.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare requested public.user_role;
begin
  requested := case new.raw_user_meta_data->>'requested_role'
    when 'reception' then 'reception'::public.user_role
    when 'polysomnography_technician' then 'polysomnography_technician'::public.user_role
    when 'technician' then 'technician'::public.user_role
    when 'doctor' then 'doctor'::public.user_role
    else null
  end;
  insert into public.profiles(id,full_name,email,role,requested_role,crm,active)
  values(new.id,coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),split_part(new.email,'@',1)),new.email,'pending',requested,nullif(trim(new.raw_user_meta_data->>'crm'),''),false)
  on conflict(id) do nothing;
  return new;
end;
$$;

create table if not exists public.sleep_technical_reports(
  exam_id uuid primary key references public.exams(id) on delete cascade,
  arrival_time time,
  room_lab text,
  neck_cm numeric(5,1),
  abdomen_cm numeric(5,1),
  basal_spo2 smallint check (basal_spo2 between 40 and 100),
  snoring_present boolean,
  snoring_intensity text check (snoring_intensity is null or snoring_intensity in ('light','moderate','intense')),
  snoring_frequency text check (snoring_frequency is null or snoring_frequency in ('sporadic','intermittent','constant')),
  pap_mode text,
  mask_type text,
  initial_pressure numeric(5,1),
  final_pressure numeric(5,1),
  usual_pressure numeric(5,1),
  post_slept_well boolean,
  post_discomfort text check (post_discomfort is null or post_discomfort in ('none','moderate','much')),
  post_discomfort_reason text,
  post_pain boolean,
  post_pain_location text,
  post_sleep_timing text check (post_sleep_timing is null or post_sleep_timing in ('earlier','usual','later')),
  post_more_sleep_minutes integer check (post_more_sleep_minutes is null or post_more_sleep_minutes>=0),
  post_wake_timing text check (post_wake_timing is null or post_wake_timing in ('earlier','usual','later')),
  post_rested boolean,
  post_estimated_sleep_hours numeric(4,1) check (post_estimated_sleep_hours is null or post_estimated_sleep_hours between 0 and 24),
  general_notes text,
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.sleep_technical_events(
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  event_time time,
  category text not null default 'Observação',
  description text not null,
  pressure_cmh2o numeric(5,1),
  spo2 smallint check (spo2 is null or spo2 between 40 and 100),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists sleep_technical_events_exam_time_idx on public.sleep_technical_events(exam_id,event_time);

alter table public.sleep_technical_reports enable row level security;
alter table public.sleep_technical_events enable row level security;

-- A técnica de polissonografia precisa localizar paciente/exame, mas não alterar cadastro.
drop policy if exists "polysomnography technician read exams" on public.exams;
create policy "polysomnography technician read exams" on public.exams
for select to authenticated using(public.is_polysomnography_technician());

drop policy if exists "polysomnography technician read patients" on public.patients;
create policy "polysomnography technician read patients" on public.patients
for select to authenticated using(public.is_polysomnography_technician());

-- Registro técnico: leitura pela cadeia assistencial.
drop policy if exists "sleep technical report read" on public.sleep_technical_reports;
create policy "sleep technical report read" on public.sleep_technical_reports
for select to authenticated using(
  public.is_admin() or public.is_reception() or public.is_polysomnography_technician() or public.is_technician()
  or (public.is_doctor() and exists(select 1 from public.exams e where e.id=sleep_technical_reports.exam_id and e.doctor_id=auth.uid()))
);
drop policy if exists "sleep technical events read" on public.sleep_technical_events;
create policy "sleep technical events read" on public.sleep_technical_events
for select to authenticated using(
  public.is_admin() or public.is_reception() or public.is_polysomnography_technician() or public.is_technician()
  or (public.is_doctor() and exists(select 1 from public.exams e where e.id=sleep_technical_events.exam_id and e.doctor_id=auth.uid()))
);

-- Escrita: técnica noturna e admin. Recepção pode consultar, mas não altera registro clínico.
drop policy if exists "sleep technical report write" on public.sleep_technical_reports;
create policy "sleep technical report write" on public.sleep_technical_reports
for insert to authenticated with check(public.is_admin() or public.is_polysomnography_technician());
drop policy if exists "sleep technical report update" on public.sleep_technical_reports;
create policy "sleep technical report update" on public.sleep_technical_reports
for update to authenticated using(public.is_admin() or public.is_polysomnography_technician())
with check(public.is_admin() or public.is_polysomnography_technician());

drop policy if exists "sleep technical events insert" on public.sleep_technical_events;
create policy "sleep technical events insert" on public.sleep_technical_events
for insert to authenticated with check(public.is_admin() or public.is_polysomnography_technician());
drop policy if exists "sleep technical events update" on public.sleep_technical_events;
create policy "sleep technical events update" on public.sleep_technical_events
for update to authenticated using(public.is_admin() or public.is_polysomnography_technician())
with check(public.is_admin() or public.is_polysomnography_technician());
drop policy if exists "sleep technical events delete" on public.sleep_technical_events;
create policy "sleep technical events delete" on public.sleep_technical_events
for delete to authenticated using(public.is_admin() or public.is_polysomnography_technician());

-- PSG BRUTO: origem (Recepção/Admin) envia e pode substituir.
-- Laudadora recebe/baixa, mas não pode substituir.
drop policy if exists "technician admin insert psg raw metadata" on public.psg_raw_files;
drop policy if exists "technician admin update psg raw metadata" on public.psg_raw_files;
drop policy if exists "staff upload psg raw metadata" on public.psg_raw_files;
drop policy if exists "staff update psg raw metadata" on public.psg_raw_files;

create policy "reception admin insert psg raw metadata" on public.psg_raw_files
for insert to authenticated with check(public.is_admin() or public.is_reception());
create policy "reception admin update psg raw metadata" on public.psg_raw_files
for update to authenticated using(public.is_admin() or public.is_reception())
with check(public.is_admin() or public.is_reception());

drop policy if exists "technician admin upload psg raw storage" on storage.objects;
drop policy if exists "staff upload psg raw storage" on storage.objects;
drop policy if exists "technician admin delete psg raw storage" on storage.objects;
drop policy if exists "staff delete psg raw storage" on storage.objects;

create policy "reception admin upload psg raw storage" on storage.objects
for insert to authenticated with check(
  bucket_id='isj-psg-raw' and exists(
    select 1 from public.exams e
    where e.id::text=(storage.foldername(objects.name))[1]
      and (public.is_admin() or public.is_reception())
  )
);
create policy "reception admin delete psg raw storage" on storage.objects
for delete to authenticated using(
  bucket_id='isj-psg-raw' and exists(
    select 1 from public.exams e
    where e.id::text=(storage.foldername(objects.name))[1]
      and (public.is_admin() or public.is_reception())
  )
);

comment on table public.sleep_technical_reports is 'Registro técnico estruturado da noite e pós-sono.';
comment on table public.sleep_technical_events is 'Linha do tempo de eventos observados pela técnica de polissonografia.';
