create table public.comments (
  id uuid not null default extensions.uuid_generate_v4 (),
  recipe_id uuid not null,
  user_id uuid not null,
  content text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  likes integer null default 0,
  dislikes integer null default 0,
  constraint comments_pkey primary key (id),
  constraint comments_recipe_id_fkey foreign KEY (recipe_id) references recipes (id) on delete CASCADE,
  constraint comments_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;