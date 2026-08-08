create table public.leads (
  id uuid primary key default gen_random_uuid(), name text not null, phone text not null, email text,
  income_range text, has_fgts boolean, fgts_amount numeric(14,2), has_down_payment boolean, down_payment_amount numeric(14,2),
  region text, property_id uuid references public.properties on delete set null, source text not null default 'site',
  purchase_timeline text, status public.lead_status not null default 'new', notes text, consent_at timestamptz not null,
  assigned_to uuid references public.profiles, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.site_settings (
  id smallint primary key default 1 check(id = 1), site_name text not null, slogan text, whatsapp text, phone text, email text,
  creci text, instagram text, facebook text, rosa_photo_path text, biography text, service_regions text[], address text,
  business_hours text, logo_path text, favicon_path text, google_analytics_id text, search_console_code text,
  meta_pixel_id text, google_maps_key text, maintenance_mode boolean not null default false,
  maintenance_message text, updated_at timestamptz not null default now(), updated_by uuid references public.profiles
);
create table public.admin_activity_logs (id bigint generated always as identity primary key, user_id uuid references public.profiles, action text not null, entity_type text not null, entity_id text, metadata jsonb not null default '{}', created_at timestamptz not null default now());
insert into public.site_settings(id, site_name, slogan, whatsapp, phone, email, creci, instagram, biography, service_regions, address, business_hours)
values(1, 'Meu Apê com Rosa', 'Seu primeiro imóvel começa aqui.', '5511971841288', '(11) 97184-1288', 'rosacorretora16@gmail.com', 'CRECI 117.140-SP', 'rosa.oliveira777', 'Rosa Oliveira é corretora de imóveis desde 2015, com atendimento próximo e experiência na jornada do primeiro imóvel.', array['Zona Sul de São Paulo'], 'São Paulo - SP', 'Segunda a domingo, em horário comercial') on conflict(id) do nothing;
create index leads_status_created_idx on public.leads(status, created_at desc);
