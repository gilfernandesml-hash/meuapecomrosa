create extension if not exists pgcrypto;
create type public.property_status as enum ('draft','available','reserved','sold','inactive');
create type public.lead_status as enum ('new','contacted','qualified','visit','proposal','financing','sale','lost');
create sequence public.property_code_seq start 1;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null default 'editor' check (role in ('admin','editor')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and active and role in ('admin','editor'));
$$;
