-- Run this once in Supabase SQL editor
-- People are stored separately in team_members.
-- Food collection and attendance are tracked per member in member_operations.

create extension if not exists pgcrypto;

create table if not exists public.team_members (
    id uuid primary key default gen_random_uuid(),
    team_id text not null,
    member_name text not null,
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

-- Electronics inventory and loans
create table if not exists public.electronics_inventory (
    id bigserial primary key,
    slug text not null unique,
    name text not null,
    category text not null,
    image_url text,
    total_stock integer not null default 0,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.electronics_loans (
    id bigserial primary key,
    team_id text not null,
    team_name text,
    team_email text,
    item_id bigint not null references public.electronics_inventory(id) on delete restrict,
    item_name text not null,
    status text not null default 'pending' check (status in ('pending', 'fulfilled', 'returned')),
    requested_at timestamptz not null default now(),
    fulfilled_at timestamptz,
    returned_at timestamptz,
    fulfilled_by text,
    returned_by text,
    notes text
);

create index if not exists electronics_inventory_category_idx on public.electronics_inventory (category);
create index if not exists electronics_loans_team_id_idx on public.electronics_loans (team_id);
create index if not exists electronics_loans_status_idx on public.electronics_loans (status);
create index if not exists electronics_loans_item_id_idx on public.electronics_loans (item_id);

insert into public.electronics_inventory (slug, name, category, image_url, total_stock, notes)
values
    ('lcd', 'LCD', 'Output', 'https://placehold.co/640x480/101820/f5eecf?text=LCD', 8, 'Loan item. Must be returned.'),
    ('led-matrix', 'LED MATRIX', 'Output', 'https://placehold.co/640x480/0f1b2d/a7ffeb?text=LED+MATRIX', 6, 'Loan item. Must be returned.'),
    ('water-sensor', 'Water sensor', 'Output', 'https://placehold.co/640x480/10263a/c7f9ff?text=Water+sensor', 10, 'Loan item. Must be returned.'),
    ('relay', 'Relay', 'Output', 'https://placehold.co/640x480/2b1b0f/ffd9a3?text=Relay', 12, 'Loan item. Must be returned.'),
    ('arduino', 'Arduino', 'Output', 'https://placehold.co/640x480/1f2a0f/f3ff9f?text=Arduino', 10, 'Loan item. Must be returned.'),
    ('servo', 'Servo', 'Output', 'https://placehold.co/640x480/271433/f7d6ff?text=Servo', 10, 'Loan item. Must be returned.'),
    ('rgb-light', 'RGB Light', 'Output', 'https://placehold.co/640x480/2a0f17/ffd1de?text=RGB+Light', 10, 'Loan item. Must be returned.'),
    ('motor-driver', 'Motor Driver', 'Output', 'https://placehold.co/640x480/202020/fff0c2?text=Motor+Driver', 8, 'Loan item. Must be returned.'),
    ('stepper-motor', 'Stepper motor', 'Output', 'https://placehold.co/640x480/0f2222/c9fff5?text=Stepper+motor', 8, 'Loan item. Must be returned.'),
    ('7-segment-display', '7 segment display', 'Output', 'https://placehold.co/640x480/1a0f25/e6c9ff?text=7+segment+display', 12, 'Loan item. Must be returned.'),
    ('joystick', 'Joystick', 'Input', 'https://placehold.co/640x480/151515/ffe8a3?text=Joystick', 10, 'Loan item. Must be returned.'),
    ('button-matrix', 'button matrix', 'Input', 'https://placehold.co/640x480/17253a/c2e6ff?text=button+matrix', 10, 'Loan item. Must be returned.'),
    ('ir-sensor', 'ir sensor', 'Input', 'https://placehold.co/640x480/2a140f/ffcfbd?text=ir+sensor', 10, 'Loan item. Must be returned.'),
    ('rfid', 'RFID', 'Input', 'https://placehold.co/640x480/0e2330/c3f3ff?text=RFID', 10, 'Loan item. Must be returned.'),
    ('microphone', 'Microphone', 'Input', 'https://placehold.co/640x480/1e1222/f5d0ff?text=Microphone', 10, 'Loan item. Must be returned.'),
    ('humidity-sensor', 'Humidity sensor', 'Input', 'https://placehold.co/640x480/112a24/cbffe8?text=Humidity+sensor', 10, 'Loan item. Must be returned.'),
    ('nfc-cards', 'NFC Cards', 'Input', 'https://placehold.co/640x480/252012/fff1c8?text=NFC+Cards', 20, 'Loan item. Must be returned.')
on conflict (slug) do nothing;
