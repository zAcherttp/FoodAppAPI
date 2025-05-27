create table public.comment_interactions
(
    id uuid not null default extensions.uuid_generate_v4 (),
    comment_id uuid not null,
    user_id uuid not null,
    interaction_type character varying(10) not null,
    created_at timestamp
    with time zone null default now
    (),
  constraint comment_interactions_pkey primary key
    (id),
  constraint comment_interactions_comment_id_user_id_key unique
    (comment_id, user_id),
  constraint comment_interactions_comment_id_fkey foreign KEY
    (comment_id) references comments
    (id) on
    delete CASCADE,
  constraint comment_interactions_user_id_fkey foreign KEY
    (user_id) references users
    (id) on
    delete CASCADE,
  constraint comment_interactions_interaction_type_check check
    (
    (
      (interaction_type)::text = any
    (
        (
          array[
            'like'::character varying,
            'dislike'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;