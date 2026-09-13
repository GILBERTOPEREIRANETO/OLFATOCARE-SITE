-- ============================================================
-- ISJ-LAUDOS V2.3 — ESTUDO BRUTO DE POLISSONOGRAFIA NA NUVEM
-- Bucket privado + metadados + RLS
-- ============================================================

create table if not exists public.psg_raw_files (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null unique references public.exams(id) on delete cascade,
  storage_path text not null,
  original_filename text not null,
  mime_type text,
  size_bytes bigint not null check (size_bytes > 0),
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.psg_raw_files enable row level security;

-- Bucket privado. O limite real de tamanho é controlado também pelo limite global
-- do projeto em Storage Settings. No Free, o máximo atual é 50 MB.
insert into storage.buckets (id,name,public)
values ('isj-psg-raw','isj-psg-raw',false)
on conflict (id) do update set public=false;

-- Metadados: Admin e Recepção podem acompanhar disponibilidade.
drop policy if exists "admin reception read psg raw metadata" on public.psg_raw_files;
create policy "admin reception read psg raw metadata"
on public.psg_raw_files for select to authenticated
using (public.is_admin() or public.is_reception());

-- Técnica pode ler estudos da própria fila / ainda não assumidos.
drop policy if exists "technician read permitted psg raw metadata" on public.psg_raw_files;
create policy "technician read permitted psg raw metadata"
on public.psg_raw_files for select to authenticated
using (
  public.is_technician() and exists (
    select 1 from public.exams e
    where e.id=psg_raw_files.exam_id
      and (e.technician_id=auth.uid() or e.technician_id is null)
  )
);

-- Médico pode consultar o estudo do exame atribuído a ele.
drop policy if exists "doctor read assigned psg raw metadata" on public.psg_raw_files;
create policy "doctor read assigned psg raw metadata"
on public.psg_raw_files for select to authenticated
using (
  public.is_doctor() and exists (
    select 1 from public.exams e
    where e.id=psg_raw_files.exam_id and e.doctor_id=auth.uid()
  )
);

-- Técnica/Admin podem criar ou substituir o registro.
drop policy if exists "technician admin insert psg raw metadata" on public.psg_raw_files;
create policy "technician admin insert psg raw metadata"
on public.psg_raw_files for insert to authenticated
with check (
  public.is_admin() or (
    public.is_technician() and exists (
      select 1 from public.exams e
      where e.id=psg_raw_files.exam_id
        and (e.technician_id=auth.uid() or e.technician_id is null)
    )
  )
);

drop policy if exists "technician admin update psg raw metadata" on public.psg_raw_files;
create policy "technician admin update psg raw metadata"
on public.psg_raw_files for update to authenticated
using (
  public.is_admin() or (
    public.is_technician() and exists (
      select 1 from public.exams e
      where e.id=psg_raw_files.exam_id
        and (e.technician_id=auth.uid() or e.technician_id is null)
    )
  )
)
with check (
  public.is_admin() or (
    public.is_technician() and exists (
      select 1 from public.exams e
      where e.id=psg_raw_files.exam_id
        and (e.technician_id=auth.uid() or e.technician_id is null)
    )
  )
);

-- Storage: leitura controlada por exame. Recepção vê metadados, mas não baixa o bruto.
drop policy if exists "staff read psg raw storage" on storage.objects;
create policy "staff read psg raw storage"
on storage.objects for select to authenticated
using (
  bucket_id='isj-psg-raw'
  and exists (
    select 1 from public.exams e
    where e.id::text=(storage.foldername(objects.name))[1]
      and (
        public.is_admin()
        or (public.is_technician() and (e.technician_id=auth.uid() or e.technician_id is null))
        or (public.is_doctor() and e.doctor_id=auth.uid())
      )
  )
);

-- Técnica/Admin fazem upload.
drop policy if exists "technician admin upload psg raw storage" on storage.objects;
create policy "technician admin upload psg raw storage"
on storage.objects for insert to authenticated
with check (
  bucket_id='isj-psg-raw'
  and exists (
    select 1 from public.exams e
    where e.id::text=(storage.foldername(objects.name))[1]
      and (
        public.is_admin()
        or (public.is_technician() and (e.technician_id=auth.uid() or e.technician_id is null))
      )
  )
);

-- Necessário para substituição/limpeza do arquivo anterior.
drop policy if exists "technician admin delete psg raw storage" on storage.objects;
create policy "technician admin delete psg raw storage"
on storage.objects for delete to authenticated
using (
  bucket_id='isj-psg-raw'
  and exists (
    select 1 from public.exams e
    where e.id::text=(storage.foldername(objects.name))[1]
      and (
        public.is_admin()
        or (public.is_technician() and (e.technician_id=auth.uid() or e.technician_id is null))
      )
  )
);

comment on table public.psg_raw_files is 'Metadados do arquivo bruto de polissonografia armazenado no bucket privado isj-psg-raw.';
