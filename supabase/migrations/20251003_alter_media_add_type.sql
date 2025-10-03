begin;

alter table public.media
  add column if not exists type text not null default 'photo';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'media_type_check'
  ) then
    alter table public.media
      add constraint media_type_check
      check (type in ('photo','document','video'));
  end if;
end $$;

create index if not exists idx_media_type on public.media(type);

update public.media
set type = case
  when mime_type ilike 'image/%' then 'photo'
  when mime_type ilike 'application/%' or mime_type ilike 'text/%' then 'document'
  else 'document'
end
where type = 'photo' and mime_type is not null;

commit;