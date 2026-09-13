-- Executar UMA VEZ no projeto ISJ-LAUDOS já criado.
-- Habilita cadastro próprio com aprovação administrativa.

alter type public.user_role add value if not exists 'pending';

alter table public.profiles
  add column if not exists email text,
  add column if not exists requested_role public.user_role,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references public.profiles(id);

alter table public.profiles
  alter column role set default 'pending';

-- Novos cadastros ficam inativos até aprovação do admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested public.user_role;
begin
  requested := case new.raw_user_meta_data->>'requested_role'
    when 'reception' then 'reception'::public.user_role
    when 'technician' then 'technician'::public.user_role
    when 'doctor' then 'doctor'::public.user_role
    else null
  end;

  insert into public.profiles (
    id, full_name, email, role, requested_role, crm, active
  ) values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)),
    new.email,
    'pending',
    requested,
    nullif(trim(new.raw_user_meta_data->>'crm'), ''),
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Usuário pode consultar o próprio perfil mesmo ainda pendente.
-- Admin continua consultando todos.
drop policy if exists "profiles read own" on public.profiles;
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles read own or admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

-- O admin já possui policy de gerenciamento criada no schema anterior.
-- Registra quem aprovou quando a aplicação envia approved_by.

-- Atualiza o e-mail do admin bootstrap, se ele estiver vazio.
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;
