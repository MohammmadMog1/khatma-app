-- =====================================================
-- الخطوة 1: الجداول  (نفّذه مرة واحدة في SQL Editor)
-- =====================================================
create extension if not exists pgcrypto;

create type user_role   as enum ('user', 'admin');
create type part_status as enum ('available', 'reserved', 'completed');
create type log_action  as enum (
  'reserved', 'cancelled', 'completed', 'uncompleted', 'revoked_by_admin'
);

create table users (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  phone            text not null unique,
  role             user_role not null default 'user',
  pin_hash         text,
  pin_failed       int not null default 0,
  pin_locked_until timestamptz,
  created_at       timestamptz not null default now()
);

create table khatmas (
  id         uuid primary key default gen_random_uuid(),
  number     int generated always as identity unique,
  name       text not null,
  is_open    boolean not null default true,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  closed_at  timestamptz
);

create table parts (
  id           uuid primary key default gen_random_uuid(),
  khatma_id    uuid not null references khatmas(id) on delete cascade,
  number       int  not null check (number between 1 and 30),
  status       part_status not null default 'available',
  user_id      uuid references users(id) on delete set null,
  reserved_at  timestamptz,
  completed_at timestamptz,
  unique (khatma_id, number)
);
create index parts_khatma_idx on parts (khatma_id);
create index parts_user_idx   on parts (user_id);

create table part_logs (
  id          uuid primary key default gen_random_uuid(),
  khatma_id   uuid not null references khatmas(id) on delete cascade,
  part_number int  not null,
  user_id     uuid not null references users(id) on delete cascade,
  acted_by    uuid not null references users(id) on delete cascade,
  action      log_action not null,
  created_at  timestamptz not null default now()
);
create index part_logs_khatma_idx on part_logs (khatma_id, created_at desc);
create index part_logs_user_idx   on part_logs (user_id, created_at desc);

create table admin_sessions (
  token      uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null default now() + interval '7 days'
);

-- حماية: تفعيل RLS بدون أي Policy = منع الوصول المباشر للجداول.
-- كل شيء يمر عبر الدوال في الملف التالي.
alter table users          enable row level security;
alter table khatmas        enable row level security;
alter table parts          enable row level security;
alter table part_logs      enable row level security;
alter table admin_sessions enable row level security;
