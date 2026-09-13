-- V4: rodízio sequencial dos médicos + texto técnico + revisão médica.

create sequence if not exists public.doctor_rotation_order_seq;

alter table public.profiles
  add column if not exists rotation_order bigint;

alter table public.exams
  add column if not exists assigned_at timestamptz,
  add column if not exists technical_text text,
  add column if not exists technician_document_id uuid references public.documents(id);

-- Numera os médicos já existentes uma única vez.
update public.profiles
set rotation_order = nextval('public.doctor_rotation_order_seq')
where role = 'doctor' and rotation_order is null;

create unique index if not exists profiles_doctor_rotation_order_unique
on public.profiles(rotation_order)
where role = 'doctor' and rotation_order is not null;

create or replace function public.set_doctor_rotation_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'doctor' and new.rotation_order is null then
    new.rotation_order := nextval('public.doctor_rotation_order_seq');
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_set_doctor_rotation_order on public.profiles;
create trigger profiles_set_doctor_rotation_order
before insert or update of role on public.profiles
for each row execute function public.set_doctor_rotation_order();

create table if not exists public.doctor_rotation_state (
  id smallint primary key check (id = 1),
  last_rotation_order bigint not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.doctor_rotation_state (id, last_rotation_order)
values (1, 0)
on conflict (id) do nothing;

alter table public.doctor_rotation_state enable row level security;

create or replace function public.next_doctor_id()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last bigint;
  v_id uuid;
  v_order bigint;
begin
  select last_rotation_order
    into v_last
  from public.doctor_rotation_state
  where id = 1
  for update;

  select id, rotation_order
    into v_id, v_order
  from public.profiles
  where role = 'doctor'
    and active = true
    and rotation_order is not null
    and rotation_order > v_last
  order by rotation_order
  limit 1;

  if v_id is null then
    select id, rotation_order
      into v_id, v_order
    from public.profiles
    where role = 'doctor'
      and active = true
      and rotation_order is not null
    order by rotation_order
    limit 1;
  end if;

  if v_id is null then
    return null;
  end if;

  update public.doctor_rotation_state
  set last_rotation_order = v_order,
      updated_at = now()
  where id = 1;

  return v_id;
end;
$$;

revoke all on function public.next_doctor_id() from public, anon, authenticated;

create or replace function public.assign_doctor_on_exam_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.doctor_id is null then
    new.doctor_id := public.next_doctor_id();
  end if;

  if new.doctor_id is null then
    raise exception 'Nenhum médico ativo disponível no rodízio.';
  end if;

  new.assigned_at := coalesce(new.assigned_at, now());
  return new;
end;
$$;

drop trigger if exists exams_assign_doctor_round_robin on public.exams;
create trigger exams_assign_doctor_round_robin
before insert on public.exams
for each row execute function public.assign_doctor_on_exam_insert();

-- Permite ao admin/recepção recuperar exames antigos que ficaram sem médico.
create or replace function public.assign_exam_next_doctor(p_exam_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_doctor uuid;
begin
  select role into v_role
  from public.profiles
  where id = auth.uid() and active = true;

  if v_role not in ('admin','reception') then
    raise exception 'Acesso negado.';
  end if;

  select doctor_id into v_doctor
  from public.exams
  where id = p_exam_id;

  if v_doctor is not null then
    return v_doctor;
  end if;

  v_doctor := public.next_doctor_id();
  if v_doctor is null then
    raise exception 'Nenhum médico ativo disponível no rodízio.';
  end if;

  update public.exams
  set doctor_id = v_doctor,
      assigned_at = now(),
      status = case when status = 'technical_done' then 'awaiting_doctor'::public.exam_status else status end,
      updated_at = now()
  where id = p_exam_id;

  return v_doctor;
end;
$$;

grant execute on function public.assign_exam_next_doctor(uuid) to authenticated;

-- A técnica passa a poder criar o rascunho textual de origem apenas nos exames que assumiu.
-- O texto fica no próprio exame; o médico cria as versões formais em report_versions.

-- Garante no máximo uma versão corrente por exame.
create unique index if not exists report_versions_one_current_per_exam
on public.report_versions(exam_id)
where is_current = true;
