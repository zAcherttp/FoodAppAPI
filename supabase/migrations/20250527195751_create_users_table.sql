create table public.users (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  email text not null,
  password text not null,
  password_reset_token text null,
  password_reset_expires timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  date_of_birth date null,
  country text null,
  url_avatar text null,
  saved_recipes jsonb null,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email)
) TABLESPACE pg_default;