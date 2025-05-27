create table public.ratings (
  id uuid not null default extensions.uuid_generate_v4 (),
  recipe_id uuid not null,
  user_id uuid not null,
  rating numeric(2, 1) not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint ratings_pkey primary key (id),
  constraint ratings_recipe_id_user_id_key unique (recipe_id, user_id),
  constraint ratings_recipe_id_fkey foreign KEY (recipe_id) references recipes (id) on delete CASCADE,
  constraint ratings_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint ratings_rating_check check (
    (
      (rating >= (0)::numeric)
      and (rating <= (5)::numeric)
    )
  )
) TABLESPACE pg_default;