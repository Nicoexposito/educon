-- Suro: a dedicated subject board for materials, notes, photos and board events.

create table if not exists public.suro_items (
    id uuid primary key default gen_random_uuid(),
    subject_id uuid not null references public.subjects(id) on delete cascade,
    teacher_id uuid not null references public.users(id) on delete cascade,
    item_type text not null default 'note',
    title text not null,
    description text,
    attachment_url text,
    event_start timestamptz,
    event_end timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint suro_items_title_not_blank check (length(trim(title)) > 0),
    constraint suro_items_type_check check (item_type in ('note', 'pdf', 'book', 'image', 'video', 'link', 'event')),
    constraint suro_items_event_dates_check check (
        item_type <> 'event'
        or event_start is null
        or event_end is null
        or event_end >= event_start
    )
);

alter table public.suro_items enable row level security;

select private.drop_policies_for_table('public.suro_items'::regclass);

create policy "suro_items_select_by_subject_access"
on public.suro_items
for select
to authenticated
using (private.can_access_subject(subject_id));

create policy "suro_items_insert_by_teacher_or_admin"
on public.suro_items
for insert
to authenticated
with check (
    exists (
        select 1
        from public.subjects s
        where s.id = suro_items.subject_id
          and (
            (s.teacher_id = (select auth.uid()) and suro_items.teacher_id = (select auth.uid()))
            or private.is_center_admin(s.institute_id)
          )
    )
);

create policy "suro_items_update_by_owner_or_admin"
on public.suro_items
for update
to authenticated
using (
    teacher_id = (select auth.uid())
    or exists (
        select 1
        from public.subjects s
        where s.id = suro_items.subject_id
          and private.is_center_admin(s.institute_id)
    )
)
with check (
    exists (
        select 1
        from public.subjects s
        where s.id = suro_items.subject_id
          and (
            (s.teacher_id = (select auth.uid()) and suro_items.teacher_id = (select auth.uid()))
            or private.is_center_admin(s.institute_id)
          )
    )
);

create policy "suro_items_delete_by_owner_or_admin"
on public.suro_items
for delete
to authenticated
using (
    teacher_id = (select auth.uid())
    or exists (
        select 1
        from public.subjects s
        where s.id = suro_items.subject_id
          and private.is_center_admin(s.institute_id)
    )
);

create index if not exists suro_items_subject_created_idx
on public.suro_items(subject_id, created_at desc);

create index if not exists suro_items_teacher_created_idx
on public.suro_items(teacher_id, created_at desc);

create index if not exists suro_items_event_start_idx
on public.suro_items(event_start)
where item_type = 'event' and event_start is not null;
