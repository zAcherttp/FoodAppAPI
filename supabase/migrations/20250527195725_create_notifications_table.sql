create table public.notifications (
  id uuid not null,
  recipient_id uuid not null,
  sender_id uuid null,
  type character varying not null,
  content text not null,
  reference_id uuid null,
  reference_type character varying null,
  is_read boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint notifications_pkey primary key (id),
  constraint notifications_recipient_id_fkey foreign KEY (recipient_id) references users (id),
  constraint notifications_sender_id_fkey foreign KEY (sender_id) references users (id)
) TABLESPACE pg_default;