-- Educon database schema export
-- Project: Educon Project (avnprqwrfjauqqevovof)
-- Generated: 2026-05-24
-- Source: Supabase MCP schema inspection + local Supabase migrations
-- Scope: schema only. This file intentionally does not include user/student data,
-- submissions, grades, attendance records, emails, phones, or other personal data.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

create schema if not exists private;

-- -----------------------------------------------------------------------------
-- Baseline tables observed in the remote Supabase project via MCP.
-- -----------------------------------------------------------------------------

create table if not exists public.institutes (
    id uuid default gen_random_uuid() not null,
    name text not null
);

create table if not exists public.users (
    id uuid default gen_random_uuid() not null,
    email text not null,
    role text not null,
    institute_id uuid,
    full_name text,
    avatar_url text,
    preferences jsonb default '{"theme": "light", "language": "es", "emailNotifications": true}'::jsonb,
    phone text,
    is_active boolean default true not null,
    must_change_password boolean default false not null,
    created_at timestamp with time zone default now() not null,
    created_by uuid,
    updated_at timestamp with time zone default now() not null
);

create table if not exists public.subjects (
    id uuid default gen_random_uuid() not null,
    name text not null,
    description text,
    teacher_id uuid,
    institute_id uuid,
    schedule text,
    color text default 'bg-blue-500'::text,
    category text default 'General'::text
);

create table if not exists public.subject_schedules (
    id uuid default gen_random_uuid() not null,
    subject_id uuid,
    day_of_week character varying(20) not null,
    start_time time without time zone not null,
    end_time time without time zone not null
);

create table if not exists public.enrollments (
    id uuid default gen_random_uuid() not null,
    student_id uuid,
    subject_id uuid,
    enrolled_at timestamp with time zone default now(),
    course_id uuid
);

create table if not exists public.assignments (
    id uuid default gen_random_uuid() not null,
    subject_id uuid,
    title text not null,
    description text,
    due_date timestamp with time zone not null,
    created_at timestamp with time zone default now(),
    content_url text,
    teacher_id uuid,
    start_date timestamp with time zone default now(),
    is_corrected boolean default false not null,
    late_due_date timestamp with time zone
);

create table if not exists public.submissions (
    id uuid default gen_random_uuid() not null,
    assignment_id uuid,
    student_id uuid,
    file_url text,
    submitted_at timestamp with time zone default now(),
    grade numeric(4,2),
    feedback text,
    status text default 'submitted'::text,
    student_comment text
);

create table if not exists public.attendance (
    id uuid default gen_random_uuid() not null,
    subject_id uuid not null,
    student_id uuid not null,
    date date default current_date not null,
    status text not null
);

create table if not exists public.grade_items (
    id uuid default gen_random_uuid() not null,
    subject_id uuid,
    name text not null,
    weight numeric(3,2) default 1.0,
    max_score numeric(4,2) default 10.0,
    created_at timestamp with time zone default now()
);

create table if not exists public.student_grades (
    id uuid default gen_random_uuid() not null,
    grade_item_id uuid,
    student_id uuid,
    score numeric(4,2),
    feedback text,
    created_at timestamp with time zone default now()
);

create table if not exists public.events (
    id uuid default gen_random_uuid() not null,
    title text not null,
    description text,
    start_time timestamp with time zone not null,
    end_time timestamp with time zone not null,
    type text default 'general'::text,
    institute_id uuid,
    subject_id uuid,
    image_url text,
    location text,
    created_by uuid
);

create table if not exists public.posts (
    id uuid default gen_random_uuid() not null,
    title text not null,
    content text not null,
    author_id uuid,
    institute_id uuid,
    created_at timestamp with time zone default now(),
    subject_id uuid,
    audience text default 'all'::text not null
);

create table if not exists public.resources (
    id uuid default gen_random_uuid() not null,
    subject_id uuid,
    title text not null,
    file_url text,
    type text,
    created_at timestamp with time zone default now()
);

create table if not exists public.notifications (
    id uuid default gen_random_uuid() not null,
    user_id uuid,
    message text not null,
    type text default 'info'::text,
    read boolean default false,
    created_at timestamp with time zone default now()
);

create table if not exists public.email_notifications (
    id uuid default gen_random_uuid() not null,
    user_id uuid,
    recipient_email text not null,
    event_type text not null,
    subject text not null,
    body text not null,
    html text,
    metadata jsonb default '{}'::jsonb not null,
    dedupe_key text,
    status text default 'pending'::text not null,
    attempts integer default 0 not null,
    last_error text,
    send_after timestamp with time zone default now() not null,
    sent_at timestamp with time zone,
    created_at timestamp with time zone default now() not null
);

create table if not exists public.justifications (
    id uuid default gen_random_uuid() not null,
    student_id uuid,
    date date not null,
    reason text not null,
    status text default 'pending'::text,
    created_at timestamp with time zone default now()
);

create table if not exists public.admin_audit_log (
    id uuid default gen_random_uuid() not null,
    institute_id uuid,
    admin_id uuid,
    event text not null,
    entity_type text not null,
    entity_id uuid,
    metadata jsonb default '{}'::jsonb not null,
    created_at timestamp with time zone default now() not null
);

create table if not exists public.courses (
    id uuid default gen_random_uuid() not null,
    institute_id uuid not null,
    name text not null,
    code text,
    description text,
    tutor_id uuid,
    tutoring_subject_id uuid,
    is_active boolean default true not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

create table if not exists public.course_subjects (
    id uuid default gen_random_uuid() not null,
    course_id uuid not null,
    subject_id uuid not null,
    created_at timestamp with time zone default now() not null
);

create table if not exists public.course_students (
    id uuid default gen_random_uuid() not null,
    course_id uuid not null,
    student_id uuid not null,
    created_at timestamp with time zone default now() not null
);

-- Core constraints observed remotely. Some later migrations also adjust constraints
-- and policies idempotently for the current application version.

alter table only public.institutes add constraint institutes_pkey primary key (id);
alter table only public.institutes add constraint institutes_name_key unique (name);
alter table only public.users add constraint users_pkey primary key (id);
alter table only public.users add constraint users_email_key unique (email);
alter table only public.subjects add constraint subjects_pkey primary key (id);
alter table only public.subject_schedules add constraint subject_schedules_pkey primary key (id);
alter table only public.enrollments add constraint enrollments_pkey primary key (id);
alter table only public.assignments add constraint assignments_pkey primary key (id);
alter table only public.submissions add constraint submissions_pkey primary key (id);
alter table only public.attendance add constraint attendance_pkey primary key (id);
alter table only public.grade_items add constraint grade_items_pkey primary key (id);
alter table only public.student_grades add constraint student_grades_pkey primary key (id);
alter table only public.events add constraint events_pkey primary key (id);
alter table only public.posts add constraint posts_pkey primary key (id);
alter table only public.resources add constraint resources_pkey primary key (id);
alter table only public.notifications add constraint notifications_pkey primary key (id);
alter table only public.email_notifications add constraint email_notifications_pkey primary key (id);
alter table only public.justifications add constraint justifications_pkey primary key (id);
alter table only public.admin_audit_log add constraint admin_audit_log_pkey primary key (id);
alter table only public.courses add constraint courses_pkey primary key (id);
alter table only public.course_subjects add constraint course_subjects_pkey primary key (id);
alter table only public.course_students add constraint course_students_pkey primary key (id);

-- Storage buckets observed via MCP. Kept as idempotent metadata inserts.
insert into storage.buckets (id, name, public)
values
    ('assignments', 'assignments', true),
    ('avatars', 'avatars', true),
    ('events-images', 'events-images', true),
    ('submissions', 'submissions', true)
on conflict (id) do update set
    name = excluded.name,
    public = excluded.public;


-- -----------------------------------------------------------------------------
-- Local migration: supabase/migrations/20260505000000_admin_center.sql
-- -----------------------------------------------------------------------------

-- Admin de centro, altas con contraseña temporal y RLS multi-tenant.

create schema if not exists private;

alter table public.users
    add column if not exists phone text,
    add column if not exists is_active boolean not null default true,
    add column if not exists must_change_password boolean not null default false,
    add column if not exists created_by uuid references public.users(id) on delete set null,
    add column if not exists created_at timestamptz not null default now(),
    add column if not exists updated_at timestamptz not null default now();

do $$
declare
    role_constraint record;
begin
    for role_constraint in
        select conname
        from pg_constraint
        where conrelid = 'public.users'::regclass
          and contype = 'c'
          and pg_get_constraintdef(oid) ilike '%role%'
    loop
        execute format('alter table public.users drop constraint %I', role_constraint.conname);
    end loop;
end $$;

alter table public.users
    add constraint users_role_check check (role in ('student', 'teacher', 'admin'));

alter table public.posts
    add column if not exists institute_id uuid references public.institutes(id) on delete cascade,
    add column if not exists author_id uuid references public.users(id) on delete set null,
    add column if not exists audience text not null default 'all',
    add column if not exists created_at timestamptz not null default now();

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conrelid = 'public.posts'::regclass
          and conname = 'posts_audience_check'
    ) then
        alter table public.posts
            add constraint posts_audience_check check (audience in ('all', 'teachers', 'students'));
    end if;
end $$;

create table if not exists public.admin_audit_log (
    id uuid primary key default gen_random_uuid(),
    institute_id uuid not null references public.institutes(id) on delete cascade,
    admin_id uuid references public.users(id) on delete set null,
    event text not null,
    entity_type text not null,
    entity_id uuid,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create or replace function private.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
    select u.role
    from public.users u
    where u.id = (select auth.uid())
      and coalesce(u.is_active, true)
$$;

create or replace function private.current_institute_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
    select u.institute_id
    from public.users u
    where u.id = (select auth.uid())
      and coalesce(u.is_active, true)
$$;

create or replace function private.is_center_admin(target_institute_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.users u
        where u.id = (select auth.uid())
          and u.role = 'admin'
          and coalesce(u.is_active, true)
          and u.institute_id = target_institute_id
    )
$$;

create or replace function private.is_teacher_of_subject(target_subject_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.subjects s
        join public.users u on u.id = (select auth.uid())
        where s.id = target_subject_id
          and s.teacher_id = u.id
          and u.role = 'teacher'
          and coalesce(u.is_active, true)
    )
$$;

create or replace function private.is_student_in_subject(target_subject_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.enrollments e
        join public.users u on u.id = (select auth.uid())
        where e.subject_id = target_subject_id
          and e.student_id = u.id
          and u.role = 'student'
          and coalesce(u.is_active, true)
    )
$$;

create or replace function private.can_access_subject(target_subject_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.subjects s
        where s.id = target_subject_id
          and (
            private.is_center_admin(s.institute_id)
            or private.is_teacher_of_subject(s.id)
            or private.is_student_in_subject(s.id)
          )
    )
$$;

create or replace function private.drop_policies_for_table(target_table regclass)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    policy_record record;
begin
    for policy_record in
        select polname
        from pg_policy
        where polrelid = target_table
    loop
        execute format('drop policy if exists %I on %s', policy_record.polname, target_table);
    end loop;
end;
$$;

select private.drop_policies_for_table('public.users'::regclass);
select private.drop_policies_for_table('public.institutes'::regclass);
select private.drop_policies_for_table('public.subjects'::regclass);
select private.drop_policies_for_table('public.subject_schedules'::regclass);
select private.drop_policies_for_table('public.enrollments'::regclass);
select private.drop_policies_for_table('public.assignments'::regclass);
select private.drop_policies_for_table('public.submissions'::regclass);
select private.drop_policies_for_table('public.attendance'::regclass);
select private.drop_policies_for_table('public.resources'::regclass);
select private.drop_policies_for_table('public.events'::regclass);
select private.drop_policies_for_table('public.posts'::regclass);
select private.drop_policies_for_table('public.notifications'::regclass);
select private.drop_policies_for_table('public.email_notifications'::regclass);
select private.drop_policies_for_table('public.grade_items'::regclass);
select private.drop_policies_for_table('public.student_grades'::regclass);
select private.drop_policies_for_table('public.admin_audit_log'::regclass);

alter table public.users enable row level security;
alter table public.institutes enable row level security;
alter table public.subjects enable row level security;
alter table public.subject_schedules enable row level security;
alter table public.enrollments enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.attendance enable row level security;
alter table public.resources enable row level security;
alter table public.events enable row level security;
alter table public.posts enable row level security;
alter table public.notifications enable row level security;
alter table public.email_notifications enable row level security;
alter table public.grade_items enable row level security;
alter table public.student_grades enable row level security;
alter table public.admin_audit_log enable row level security;

create policy "institutes_login_lookup"
on public.institutes
for select
to anon, authenticated
using (true);

create policy "users_select_by_scope"
on public.users
for select
to authenticated
using (
    id = (select auth.uid())
    or private.is_center_admin(institute_id)
    or exists (
        select 1
        from public.subjects s
        join public.enrollments e on e.subject_id = s.id
        where s.teacher_id = (select auth.uid())
          and e.student_id = users.id
    )
    or exists (
        select 1
        from public.enrollments mine
        join public.enrollments other_enrollment on other_enrollment.subject_id = mine.subject_id
        where mine.student_id = (select auth.uid())
          and other_enrollment.student_id = users.id
    )
);

create policy "users_insert_by_admin"
on public.users
for insert
to authenticated
with check (private.is_center_admin(institute_id));

create policy "users_update_by_admin"
on public.users
for update
to authenticated
using (private.is_center_admin(institute_id))
with check (private.is_center_admin(institute_id));

create policy "subjects_select_by_scope"
on public.subjects
for select
to authenticated
using (
    private.is_center_admin(institute_id)
    or teacher_id = (select auth.uid())
    or private.is_student_in_subject(id)
);

create policy "subjects_write_by_admin_or_teacher"
on public.subjects
for all
to authenticated
using (
    private.is_center_admin(institute_id)
    or teacher_id = (select auth.uid())
)
with check (
    private.is_center_admin(institute_id)
    or teacher_id = (select auth.uid())
);

create policy "subject_schedules_by_subject_access"
on public.subject_schedules
for select
to authenticated
using (private.can_access_subject(subject_id));

create policy "subject_schedules_write_by_admin"
on public.subject_schedules
for all
to authenticated
using (
    exists (
        select 1 from public.subjects s
        where s.id = subject_schedules.subject_id
          and private.is_center_admin(s.institute_id)
    )
)
with check (
    exists (
        select 1 from public.subjects s
        where s.id = subject_schedules.subject_id
          and private.is_center_admin(s.institute_id)
    )
);

create policy "enrollments_select_by_subject_access"
on public.enrollments
for select
to authenticated
using (private.can_access_subject(subject_id) or student_id = (select auth.uid()));

create policy "enrollments_write_by_admin_or_teacher"
on public.enrollments
for all
to authenticated
using (
    exists (
        select 1 from public.subjects s
        where s.id = enrollments.subject_id
          and (private.is_center_admin(s.institute_id) or s.teacher_id = (select auth.uid()))
    )
)
with check (
    exists (
        select 1 from public.subjects s
        where s.id = enrollments.subject_id
          and (private.is_center_admin(s.institute_id) or s.teacher_id = (select auth.uid()))
    )
);

create policy "assignments_select_by_subject_access"
on public.assignments
for select
to authenticated
using (
    teacher_id = (select auth.uid())
    or private.can_access_subject(subject_id)
);

create policy "assignments_write_by_teacher_or_admin"
on public.assignments
for all
to authenticated
using (
    teacher_id = (select auth.uid())
    or exists (
        select 1 from public.subjects s
        where s.id = assignments.subject_id
          and private.is_center_admin(s.institute_id)
    )
)
with check (
    teacher_id = (select auth.uid())
    or exists (
        select 1 from public.subjects s
        where s.id = assignments.subject_id
          and private.is_center_admin(s.institute_id)
    )
);

create policy "submissions_select_by_scope"
on public.submissions
for select
to authenticated
using (
    student_id = (select auth.uid())
    or exists (
        select 1
        from public.assignments a
        join public.subjects s on s.id = a.subject_id
        where a.id = submissions.assignment_id
          and (a.teacher_id = (select auth.uid()) or private.is_center_admin(s.institute_id))
    )
);

create policy "submissions_insert_by_student"
on public.submissions
for insert
to authenticated
with check (
    student_id = (select auth.uid())
    and exists (
        select 1
        from public.assignments a
        join public.enrollments e on e.subject_id = a.subject_id
        where a.id = submissions.assignment_id
          and e.student_id = (select auth.uid())
    )
);

create policy "submissions_update_by_student_teacher_admin"
on public.submissions
for update
to authenticated
using (
    student_id = (select auth.uid())
    or exists (
        select 1
        from public.assignments a
        join public.subjects s on s.id = a.subject_id
        where a.id = submissions.assignment_id
          and (a.teacher_id = (select auth.uid()) or private.is_center_admin(s.institute_id))
    )
)
with check (
    student_id = (select auth.uid())
    or exists (
        select 1
        from public.assignments a
        join public.subjects s on s.id = a.subject_id
        where a.id = submissions.assignment_id
          and (a.teacher_id = (select auth.uid()) or private.is_center_admin(s.institute_id))
    )
);

create policy "attendance_select_by_scope"
on public.attendance
for select
to authenticated
using (
    student_id = (select auth.uid())
    or private.can_access_subject(subject_id)
);

create policy "attendance_write_by_teacher_or_admin"
on public.attendance
for all
to authenticated
using (
    exists (
        select 1 from public.subjects s
        where s.id = attendance.subject_id
          and (s.teacher_id = (select auth.uid()) or private.is_center_admin(s.institute_id))
    )
)
with check (
    exists (
        select 1 from public.subjects s
        where s.id = attendance.subject_id
          and (s.teacher_id = (select auth.uid()) or private.is_center_admin(s.institute_id))
    )
);

create policy "resources_select_by_subject_access"
on public.resources
for select
to authenticated
using (private.can_access_subject(subject_id));

create policy "resources_write_by_teacher_or_admin"
on public.resources
for all
to authenticated
using (
    exists (
        select 1 from public.subjects s
        where s.id = resources.subject_id
          and (s.teacher_id = (select auth.uid()) or private.is_center_admin(s.institute_id))
    )
)
with check (
    exists (
        select 1 from public.subjects s
        where s.id = resources.subject_id
          and (s.teacher_id = (select auth.uid()) or private.is_center_admin(s.institute_id))
    )
);

create policy "events_select_by_institute"
on public.events
for select
to authenticated
using (
    institute_id = private.current_institute_id()
    or exists (
        select 1
        from public.subjects s
        where s.id = events.subject_id
          and private.can_access_subject(s.id)
    )
);

create policy "events_write_by_teacher_or_admin"
on public.events
for all
to authenticated
using (
    private.is_center_admin(institute_id)
    or created_by = (select auth.uid())
)
with check (
    private.is_center_admin(institute_id)
    or created_by = (select auth.uid())
);

create policy "posts_select_by_audience"
on public.posts
for select
to authenticated
using (
    institute_id = private.current_institute_id()
    and (
        audience = 'all'
        or (audience = 'teachers' and private.current_user_role() in ('teacher', 'admin'))
        or (audience = 'students' and private.current_user_role() in ('student', 'admin'))
    )
);

create policy "posts_write_by_admin"
on public.posts
for all
to authenticated
using (private.is_center_admin(institute_id))
with check (private.is_center_admin(institute_id));

create policy "notifications_select_own"
on public.notifications
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "notifications_update_own"
on public.notifications
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "grade_items_select_by_subject_access"
on public.grade_items
for select
to authenticated
using (private.can_access_subject(subject_id));

create policy "grade_items_write_by_teacher_or_admin"
on public.grade_items
for all
to authenticated
using (
    exists (
        select 1 from public.subjects s
        where s.id = grade_items.subject_id
          and (s.teacher_id = (select auth.uid()) or private.is_center_admin(s.institute_id))
    )
)
with check (
    exists (
        select 1 from public.subjects s
        where s.id = grade_items.subject_id
          and (s.teacher_id = (select auth.uid()) or private.is_center_admin(s.institute_id))
    )
);

create policy "student_grades_select_by_scope"
on public.student_grades
for select
to authenticated
using (
    student_id = (select auth.uid())
    or exists (
        select 1
        from public.grade_items gi
        join public.subjects s on s.id = gi.subject_id
        where gi.id = student_grades.grade_item_id
          and (s.teacher_id = (select auth.uid()) or private.is_center_admin(s.institute_id))
    )
);

create policy "student_grades_write_by_teacher_or_admin"
on public.student_grades
for all
to authenticated
using (
    exists (
        select 1
        from public.grade_items gi
        join public.subjects s on s.id = gi.subject_id
        where gi.id = student_grades.grade_item_id
          and (s.teacher_id = (select auth.uid()) or private.is_center_admin(s.institute_id))
    )
)
with check (
    exists (
        select 1
        from public.grade_items gi
        join public.subjects s on s.id = gi.subject_id
        where gi.id = student_grades.grade_item_id
          and (s.teacher_id = (select auth.uid()) or private.is_center_admin(s.institute_id))
    )
);

create policy "audit_select_by_admin"
on public.admin_audit_log
for select
to authenticated
using (private.is_center_admin(institute_id));

create unique index if not exists enrollments_subject_student_unique
on public.enrollments(subject_id, student_id);

create index if not exists users_institute_role_idx on public.users(institute_id, role);
create index if not exists users_created_by_idx on public.users(created_by);
create index if not exists subjects_institute_idx on public.subjects(institute_id);
create index if not exists subjects_teacher_idx on public.subjects(teacher_id);
create index if not exists subject_schedules_subject_idx on public.subject_schedules(subject_id);
create index if not exists enrollments_subject_idx on public.enrollments(subject_id);
create index if not exists enrollments_student_idx on public.enrollments(student_id);
create index if not exists assignments_subject_idx on public.assignments(subject_id);
create index if not exists assignments_teacher_idx on public.assignments(teacher_id);
create index if not exists submissions_assignment_idx on public.submissions(assignment_id);
create index if not exists submissions_student_idx on public.submissions(student_id);
create index if not exists attendance_subject_student_date_idx on public.attendance(subject_id, student_id, date);
create index if not exists resources_subject_idx on public.resources(subject_id);
create index if not exists events_institute_start_idx on public.events(institute_id, start_time);
create index if not exists events_subject_idx on public.events(subject_id);
create index if not exists posts_institute_audience_created_idx on public.posts(institute_id, audience, created_at desc);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index if not exists email_notifications_status_send_after_idx on public.email_notifications(status, send_after);
create index if not exists grade_items_subject_idx on public.grade_items(subject_id);
create index if not exists student_grades_student_idx on public.student_grades(student_id);
create index if not exists student_grades_grade_item_idx on public.student_grades(grade_item_id);
create index if not exists admin_audit_log_institute_created_idx on public.admin_audit_log(institute_id, created_at desc);


-- -----------------------------------------------------------------------------
-- Local migration: supabase/migrations/20260520000000_add_submission_student_comment.sql
-- -----------------------------------------------------------------------------

alter table public.submissions
add column if not exists student_comment text;


-- -----------------------------------------------------------------------------
-- Local migration: supabase/migrations/20260520001000_make_auth_user_trigger_idempotent.sql
-- -----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    profile_role text;
    profile_institute_id uuid;
    metadata_institute_id text;
begin
    profile_role := coalesce(
        new.raw_app_meta_data->>'role',
        new.raw_user_meta_data->>'role',
        'student'
    );

    if profile_role not in ('student', 'teacher', 'admin') then
        profile_role := 'student';
    end if;

    metadata_institute_id := nullif(coalesce(
        new.raw_app_meta_data->>'institute_id',
        new.raw_user_meta_data->>'institute_id'
    ), '');

    if metadata_institute_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        profile_institute_id := metadata_institute_id::uuid;
    end if;

    insert into public.users (id, email, full_name, role, institute_id, is_active)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        profile_role,
        profile_institute_id,
        true
    )
    on conflict (id) do update set
        email = excluded.email,
        full_name = coalesce(excluded.full_name, public.users.full_name),
        role = excluded.role,
        institute_id = coalesce(excluded.institute_id, public.users.institute_id),
        is_active = coalesce(public.users.is_active, true);

    return new;
end;
$$;


-- -----------------------------------------------------------------------------
-- Local migration: supabase/migrations/20260520002000_add_courses.sql
-- -----------------------------------------------------------------------------

-- Courses/group layer: a course groups subjects and students.
-- Operational access still flows through enrollments so existing assignments,
-- attendance and grades keep working.

create table if not exists public.courses (
    id uuid primary key default gen_random_uuid(),
    institute_id uuid not null references public.institutes(id) on delete cascade,
    name text not null,
    code text,
    description text,
    tutor_id uuid references public.users(id) on delete set null,
    tutoring_subject_id uuid references public.subjects(id) on delete set null,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint courses_name_not_blank check (length(trim(name)) > 0)
);

alter table public.courses
    add column if not exists tutor_id uuid references public.users(id) on delete set null,
    add column if not exists tutoring_subject_id uuid references public.subjects(id) on delete set null;

create unique index if not exists courses_institute_name_unique
on public.courses(institute_id, lower(name));

create table if not exists public.course_subjects (
    id uuid primary key default gen_random_uuid(),
    course_id uuid not null references public.courses(id) on delete cascade,
    subject_id uuid not null references public.subjects(id) on delete cascade,
    created_at timestamptz not null default now(),
    constraint course_subjects_unique unique (course_id, subject_id)
);

create table if not exists public.course_students (
    id uuid primary key default gen_random_uuid(),
    course_id uuid not null references public.courses(id) on delete cascade,
    student_id uuid not null references public.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    constraint course_students_unique unique (course_id, student_id)
);

alter table public.enrollments
    add column if not exists course_id uuid references public.courses(id) on delete set null;

alter table public.courses enable row level security;
alter table public.course_subjects enable row level security;
alter table public.course_students enable row level security;

create or replace function private.is_student_in_course(target_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.course_students cs
        join public.users u on u.id = (select auth.uid())
        where cs.course_id = target_course_id
          and cs.student_id = u.id
          and u.role = 'student'
          and coalesce(u.is_active, true)
    )
$$;

create or replace function private.is_teacher_in_course(target_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.course_subjects cs
        join public.subjects s on s.id = cs.subject_id
        where cs.course_id = target_course_id
          and s.teacher_id = (select auth.uid())
    )
$$;

create or replace function private.can_access_course(target_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.courses c
        where c.id = target_course_id
          and (
            private.is_center_admin(c.institute_id)
            or private.is_student_in_course(c.id)
            or private.is_teacher_in_course(c.id)
          )
    )
$$;

create or replace function private.can_admin_course_subject(target_course_id uuid, target_subject_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.courses c
        join public.subjects s on s.id = target_subject_id
        where c.id = target_course_id
          and s.institute_id = c.institute_id
          and private.is_center_admin(c.institute_id)
    )
$$;

create or replace function private.can_admin_course_tutor(target_institute_id uuid, target_tutor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select target_tutor_id is null or exists (
        select 1
        from public.users u
        where u.id = target_tutor_id
          and u.institute_id = target_institute_id
          and u.role = 'teacher'
          and coalesce(u.is_active, true)
          and private.is_center_admin(target_institute_id)
    )
$$;

create or replace function private.can_admin_course_tutoring_subject(target_institute_id uuid, target_subject_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select target_subject_id is null or exists (
        select 1
        from public.subjects s
        where s.id = target_subject_id
          and s.institute_id = target_institute_id
          and private.is_center_admin(target_institute_id)
    )
$$;

create or replace function private.can_admin_course_student(target_course_id uuid, target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.courses c
        join public.users u on u.id = target_student_id
        where c.id = target_course_id
          and u.institute_id = c.institute_id
          and u.role = 'student'
          and private.is_center_admin(c.institute_id)
    )
$$;

select private.drop_policies_for_table('public.courses'::regclass);
select private.drop_policies_for_table('public.course_subjects'::regclass);
select private.drop_policies_for_table('public.course_students'::regclass);

create policy "courses_select_by_scope"
on public.courses
for select
to authenticated
using (
    private.can_access_course(id)
);

create policy "courses_write_by_admin"
on public.courses
for all
to authenticated
using (private.is_center_admin(institute_id))
with check (
    private.is_center_admin(institute_id)
    and private.can_admin_course_tutor(institute_id, tutor_id)
    and private.can_admin_course_tutoring_subject(institute_id, tutoring_subject_id)
);

create policy "course_subjects_select_by_scope"
on public.course_subjects
for select
to authenticated
using (
    private.can_access_course(course_id)
    or private.can_access_subject(subject_id)
);

create policy "course_subjects_write_by_admin"
on public.course_subjects
for all
to authenticated
using (private.can_admin_course_subject(course_id, subject_id))
with check (private.can_admin_course_subject(course_id, subject_id));

create policy "course_students_select_by_scope"
on public.course_students
for select
to authenticated
using (
    student_id = (select auth.uid())
    or private.can_access_course(course_id)
);

create policy "course_students_write_by_admin"
on public.course_students
for all
to authenticated
using (private.can_admin_course_student(course_id, student_id))
with check (private.can_admin_course_student(course_id, student_id));

create index if not exists courses_institute_active_idx
on public.courses(institute_id, is_active, name);

create index if not exists courses_tutor_idx
on public.courses(tutor_id)
where tutor_id is not null;

create index if not exists courses_tutoring_subject_idx
on public.courses(tutoring_subject_id)
where tutoring_subject_id is not null;

create index if not exists course_subjects_course_idx
on public.course_subjects(course_id);

create index if not exists course_subjects_subject_idx
on public.course_subjects(subject_id);

create index if not exists course_students_course_idx
on public.course_students(course_id);

create index if not exists course_students_student_idx
on public.course_students(student_id);

create index if not exists enrollments_course_idx
on public.enrollments(course_id);


-- -----------------------------------------------------------------------------
-- Local migration: supabase/migrations/20260520150000_optimize_dashboard_queries.sql
-- -----------------------------------------------------------------------------

-- Keep the common dashboard/profile queries on indexed paths.

create index if not exists admin_audit_log_admin_idx
    on public.admin_audit_log (admin_id);

create index if not exists attendance_student_idx
    on public.attendance (student_id);

create index if not exists attendance_student_date_idx
    on public.attendance (student_id, date desc);

create index if not exists events_created_by_idx
    on public.events (created_by)
    where created_by is not null;

create index if not exists events_end_start_idx
    on public.events (end_time, start_time);

create index if not exists justifications_student_idx
    on public.justifications (student_id);

create index if not exists posts_author_idx
    on public.posts (author_id)
    where author_id is not null;

create index if not exists posts_subject_idx
    on public.posts (subject_id)
    where subject_id is not null;

create index if not exists assignments_subject_due_idx
    on public.assignments (subject_id, due_date);

create index if not exists assignments_teacher_due_idx
    on public.assignments (teacher_id, due_date);

create index if not exists submissions_student_submitted_idx
    on public.submissions (student_id, submitted_at desc);

create index if not exists submissions_student_assignment_idx
    on public.submissions (student_id, assignment_id);

create index if not exists submissions_ungraded_assignment_idx
    on public.submissions (assignment_id, submitted_at)
    where grade is null;

create index if not exists student_grades_student_created_idx
    on public.student_grades (student_id, created_at desc);

drop index if exists public.admin_audit_log_institute_created_idx;
drop index if exists public.enrollments_subject_student_unique;


-- -----------------------------------------------------------------------------
-- Notes
-- -----------------------------------------------------------------------------
-- This is a schema-only export generated for review/hand-off. For a byte-for-byte
-- production restore, use Supabase CLI or pg_dump from the live project.
-- Supabase MCP security advisor reported public.justifications with RLS disabled
-- in the live database at export time; this file preserves the project migration
-- state and does not auto-remediate that finding.
