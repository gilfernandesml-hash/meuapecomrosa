create table public.properties (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default ('RMA-' || lpad(nextval('public.property_code_seq')::text, 6, '0')),
  name text not null, full_name text, slug text not null unique, seo_slug text,
  description text, short_description text, property_type text not null default 'apartment',
  profile text, phase text, purpose text not null default 'sale', builder text, developer text,
  address text, number text, neighborhood text, city text not null default 'São Paulo', state char(2) not null default 'SP', zipcode text,
  latitude numeric(10,7), longitude numeric(10,7), area_min numeric(10,2), area_max numeric(10,2),
  bedrooms_min smallint, bedrooms_max smallint, suites_min smallint, suites_max smallint,
  bathrooms_min smallint, bathrooms_max smallint, parking_min smallint, parking_max smallint,
  price numeric(14,2), promotional_price numeric(14,2), price_label text, condominium numeric(12,2), iptu numeric(12,2),
  featured boolean not null default false, featured_order integer, status public.property_status not null default 'draft',
  is_mcmv boolean not null default false, is_his1 boolean not null default false, is_his2 boolean not null default false,
  is_hmp boolean not null default false, is_r2v boolean not null default false, is_nr boolean not null default false, fgts_possible boolean,
  source text not null default 'manual', source_id text, source_url text, last_synced_at timestamptz,
  meta_title text, meta_description text, keywords text[], indexable boolean not null default true,
  view_count bigint not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id), updated_by uuid references public.profiles(id),
  constraint property_price_positive check (price is null or price >= 0),
  constraint property_area_order check (area_min is null or area_max is null or area_max >= area_min)
);

create table public.property_images (id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties on delete cascade, storage_path text not null, public_url text, caption text, alt_text text not null, is_cover boolean not null default false, sort_order integer not null default 0, created_at timestamptz not null default now());
create table public.property_floorplans (id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties on delete cascade, storage_path text not null, public_url text, name text, caption text, alt_text text not null, sort_order integer not null default 0, created_at timestamptz not null default now());
create table public.property_features (id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties on delete cascade, category text not null default 'general', name text not null, sort_order integer not null default 0);
create table public.neighborhoods (id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique, city text not null default 'São Paulo', state char(2) not null default 'SP', seo_text text, mobility_text text, services_text text, faq jsonb not null default '[]', published boolean not null default false, meta_title text, meta_description text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.blog_posts (id uuid primary key default gen_random_uuid(), title text not null, slug text not null unique, excerpt text, content jsonb not null default '{}', cover_path text, status text not null default 'draft' check(status in ('draft','published','archived')), published_at timestamptz, meta_title text, meta_description text, created_by uuid references public.profiles, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.promo_banners (id uuid primary key default gen_random_uuid(), image_path text, title text not null, subtitle text, cta_label text, target_url text, position text not null check(position in ('home','properties','detail','blog')), starts_at timestamptz, ends_at timestamptz, active boolean not null default true, sort_order integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create index properties_public_catalog_idx on public.properties(status, featured desc, featured_order, created_at desc);
create index properties_filters_idx on public.properties(city, neighborhood, price, bedrooms_min, phase);
create index property_images_property_idx on public.property_images(property_id, sort_order);
