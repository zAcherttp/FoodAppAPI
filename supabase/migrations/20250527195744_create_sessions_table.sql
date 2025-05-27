create table public.sessions (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  token text null,
  user_agent text null,
  ip_address text null,
  is_valid boolean null default true,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint sessions_pkey primary key (id),
  constraint sessions_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_sessions_token on public.sessions using btree (token) TABLESPACE pg_default;

create index IF not exists idx_sessions_user_id on public.sessions using btree (user_id) TABLESPACE pg_default;