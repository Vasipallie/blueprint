-- Run this once in Supabase SQL editor
-- People are stored separately in team_members.
-- Food collection and attendance are tracked per member in member_operations.

create extension if not exists pgcrypto;

create table if not exists public.team_members (
    id uuid primary key default gen_random_uuid(),
    team_id text not null,
    member_name text not null,
    class_name text,
    section text,
    allegiance text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(team_id, member_name)
);

create table if not exists public.member_operations (
    id bigserial primary key,
    member_id uuid not null unique references public.team_members(id) on delete cascade,
    team_id text not null,
    team_name text,
    team_email text,
    member_name text,
    class_name text,
    section text,
    allegiance text,
    day1_lunch boolean not null default false,
    day1_snack boolean not null default false,
    day2_lunch boolean not null default false,
    day2_snack boolean not null default false,
    attendance_day1 boolean not null default false,
    attendance_day2 boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.admin_settings (
    key text primary key,
    value_json jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
);

create index if not exists team_members_team_id_idx on public.team_members (team_id);
create index if not exists team_members_member_name_idx on public.team_members (member_name);
create index if not exists member_operations_team_id_idx on public.member_operations (team_id);
create index if not exists member_operations_member_name_idx on public.member_operations (member_name);
