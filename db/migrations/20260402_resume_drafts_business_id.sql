alter table resume_drafts
  add column if not exists resume_id text;

update resume_drafts
set resume_id = 'legacy_' || id::text
where resume_id is null or btrim(resume_id) = '';

alter table resume_drafts
  alter column resume_id set not null;

create unique index if not exists idx_resume_drafts_resume_id_unique
  on resume_drafts(resume_id);

alter table resume_drafts
  add column if not exists profile_photo_url text;
