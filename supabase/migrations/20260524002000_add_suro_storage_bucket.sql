-- Public bucket for files attached to Suro posts.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('suro', 'suro', true, 52428800, null)
on conflict (id) do update
set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
