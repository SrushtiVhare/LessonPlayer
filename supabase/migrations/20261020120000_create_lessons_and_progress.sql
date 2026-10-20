-- WonderQuest Math: published lessons and per-learner progress.
-- Apply in the Supabase SQL editor, or with the Supabase CLI: supabase db push
-- The service role used by npm run seed bypasses RLS. The browser uses only the anon key.

create extension if not exists pgcrypto;

create table public.lessons (
  id text primary key,
  title text not null,
  topic text not null,
  grade integer not null check (grade between 1 and 8),
  version integer not null check (version >= 1),
  theme jsonb not null,
  lesson_data jsonb not null,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lessons_theme_is_object check (jsonb_typeof(theme) = 'object'),
  constraint lessons_data_is_object check (jsonb_typeof(lesson_data) = 'object')
);

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null references public.lessons (id) on delete cascade,
  lesson_version integer not null check (lesson_version >= 1),
  current_slide_id text not null,
  task_results jsonb not null default '{}'::jsonb,
  completed_tasks integer not null default 0 check (completed_tasks >= 0),
  first_try_correct_count integer not null default 0 check (first_try_correct_count >= 0),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint lesson_progress_one_row_per_user unique (user_id, lesson_id),
  constraint lesson_progress_results_is_object check (jsonb_typeof(task_results) = 'object'),
  constraint lesson_progress_first_try_not_above_completed check (first_try_correct_count <= completed_tasks)
);

create index lessons_published_idx on public.lessons (published);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger lessons_set_updated_at
before update on public.lessons
for each row execute function public.set_updated_at();

create trigger lesson_progress_set_updated_at
before update on public.lesson_progress
for each row execute function public.set_updated_at();

alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;

revoke all on public.lessons from anon, authenticated;
grant select on public.lessons to anon, authenticated;

revoke all on public.lesson_progress from anon, authenticated;
grant select, insert, update, delete on public.lesson_progress to authenticated;

create policy "published lessons are readable"
on public.lessons
for select
to anon, authenticated
using (published = true);

create policy "learners read their own progress"
on public.lesson_progress
for select
to authenticated
using (auth.uid() = user_id);

create policy "learners insert their own progress"
on public.lesson_progress
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "learners update their own progress"
on public.lesson_progress
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "learners delete their own progress"
on public.lesson_progress
for delete
to authenticated
using (auth.uid() = user_id);
