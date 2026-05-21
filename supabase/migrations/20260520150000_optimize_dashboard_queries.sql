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
