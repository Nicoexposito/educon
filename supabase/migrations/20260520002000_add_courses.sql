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
