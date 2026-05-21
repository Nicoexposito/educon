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
