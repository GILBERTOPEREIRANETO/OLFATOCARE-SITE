-- V6: pré-cadastro na recepção antes do exame, código entregue ao paciente,
-- e envio ao fluxo técnico somente após o exame.

alter table public.patients
  add column if not exists cpf text,
  add column if not exists phone text,
  add column if not exists email text;

create unique index if not exists patients_cpf_unique
on public.patients(cpf)
where cpf is not null and cpf <> '';

alter table public.exams
  add column if not exists preregistered_at timestamptz,
  add column if not exists sent_to_technician_at timestamptz;

-- O rodízio não deve consumir médico no pré-cadastro.
create or replace function public.assign_doctor_on_exam_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'created' then
    return new;
  end if;

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

-- Recepção/Admin conclui o registro após o exame.
-- O médico é escolhido aqui, para o rodízio considerar apenas exames efetivamente realizados.
create or replace function public.send_exam_to_technician(p_exam_id uuid, p_neurovirtual_id text)
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
  where id = p_exam_id
  for update;

  if v_doctor is null then
    v_doctor := public.next_doctor_id();
    if v_doctor is null then
      raise exception 'Nenhum médico ativo disponível no rodízio.';
    end if;
  end if;

  update public.exams
  set neurovirtual_id = nullif(trim(p_neurovirtual_id),''),
      doctor_id = v_doctor,
      assigned_at = coalesce(assigned_at, now()),
      status = 'awaiting_technician',
      sent_to_technician_at = now()
  where id = p_exam_id;

  return v_doctor;
end;
$$;

grant execute on function public.send_exam_to_technician(uuid,text) to authenticated;

-- A rota de servidor do portal do paciente usa a chave secret/service_role.
grant execute on function public.patient_result_lookup(text,date) to service_role;

create unique index if not exists exams_patient_access_code_hash_unique
on public.exams(patient_access_code_hash)
where patient_access_code_hash is not null;
