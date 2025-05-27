create table public.recipes (
  id uuid not null default gen_random_uuid (),
  title text not null default 'NOT NULL'::text,
  author text null,
  image_url text null,
  ingredients jsonb null,
  instructions jsonb null,
  created_at timestamp with time zone null,
  updated_at timestamp with time zone null,
  comments jsonb null,
  rating jsonb null,
  tags jsonb null,
  time text null,
  embedding public.vector null,
  constraint recipes_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_recipes_embedding_hnsw on public.recipes using hnsw (embedding vector_cosine_ops) TABLESPACE pg_default;