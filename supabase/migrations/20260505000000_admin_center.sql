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
