-- Выполнить один раз в Supabase: SQL Editor -> New query -> Run
create table if not exists sklad_state (
  id int primary key,
  rev int not null default 1,
  state jsonb not null default '{}'::jsonb
);
insert into sklad_state (id, rev, state) values (1, 1, '{}'::jsonb)
on conflict (id) do nothing;
