alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.property_floorplans enable row level security;
alter table public.property_features enable row level security;
alter table public.neighborhoods enable row level security;
alter table public.blog_posts enable row level security;
alter table public.promo_banners enable row level security;
alter table public.leads enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_activity_logs enable row level security;

create policy "public available properties" on public.properties for select using (status = 'available');
create policy "public property images" on public.property_images for select using (exists(select 1 from public.properties p where p.id = property_id and p.status = 'available'));
create policy "public property floorplans" on public.property_floorplans for select using (exists(select 1 from public.properties p where p.id = property_id and p.status = 'available'));
create policy "public property features" on public.property_features for select using (exists(select 1 from public.properties p where p.id = property_id and p.status = 'available'));
create policy "public neighborhoods" on public.neighborhoods for select using (published);
create policy "public blog" on public.blog_posts for select using (status = 'published');
create policy "public current banners" on public.promo_banners for select using (active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at >= now()));
create policy "public site settings" on public.site_settings for select using (true);
create policy "public creates leads" on public.leads for insert with check (consent_at is not null and length(name) between 2 and 120 and length(phone) between 8 and 30);

create policy "admins profiles" on public.profiles for all using (public.is_admin()) with check (public.is_admin());
create policy "admins properties" on public.properties for all using (public.is_admin()) with check (public.is_admin());
create policy "admins images" on public.property_images for all using (public.is_admin()) with check (public.is_admin());
create policy "admins floorplans" on public.property_floorplans for all using (public.is_admin()) with check (public.is_admin());
create policy "admins features" on public.property_features for all using (public.is_admin()) with check (public.is_admin());
create policy "admins neighborhoods" on public.neighborhoods for all using (public.is_admin()) with check (public.is_admin());
create policy "admins blog" on public.blog_posts for all using (public.is_admin()) with check (public.is_admin());
create policy "admins banners" on public.promo_banners for all using (public.is_admin()) with check (public.is_admin());
create policy "admins leads" on public.leads for all using (public.is_admin()) with check (public.is_admin());
create policy "admins settings" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "admins activity" on public.admin_activity_logs for select using (public.is_admin());
create policy "admins write activity" on public.admin_activity_logs for insert with check (public.is_admin());

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types) values
('property-images','property-images',true,10485760,array['image/jpeg','image/png','image/webp','image/avif']),
('property-floorplans','property-floorplans',true,10485760,array['image/jpeg','image/png','image/webp','application/pdf']),
('site-assets','site-assets',true,5242880,array['image/jpeg','image/png','image/webp','image/svg+xml']) on conflict(id) do nothing;
create policy "public media read" on storage.objects for select using (bucket_id in ('property-images','property-floorplans','site-assets'));
create policy "admin media insert" on storage.objects for insert with check (bucket_id in ('property-images','property-floorplans','site-assets') and public.is_admin());
create policy "admin media update" on storage.objects for update using (public.is_admin()) with check (public.is_admin());
create policy "admin media delete" on storage.objects for delete using (public.is_admin());

create or replace function public.duplicate_property(source_property_id uuid) returns uuid language plpgsql security definer set search_path = '' as $$
declare new_id uuid; base_slug text;
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  select slug into base_slug from public.properties where id = source_property_id;
  insert into public.properties(name, full_name, slug, description, short_description, property_type, profile, phase, purpose, builder, developer, address, number, neighborhood, city, state, zipcode, latitude, longitude, area_min, area_max, bedrooms_min, bedrooms_max, suites_min, suites_max, bathrooms_min, bathrooms_max, parking_min, parking_max, price, promotional_price, price_label, condominium, iptu, is_mcmv, is_his1, is_his2, is_hmp, is_r2v, is_nr, fgts_possible, source, status, created_by, updated_by)
  select name || ' (cópia)', full_name, base_slug || '-copia-' || substr(gen_random_uuid()::text,1,8), description, short_description, property_type, profile, phase, purpose, builder, developer, address, number, neighborhood, city, state, zipcode, latitude, longitude, area_min, area_max, bedrooms_min, bedrooms_max, suites_min, suites_max, bathrooms_min, bathrooms_max, parking_min, parking_max, price, promotional_price, price_label, condominium, iptu, is_mcmv, is_his1, is_his2, is_hmp, is_r2v, is_nr, fgts_possible, source, 'draft', auth.uid(), auth.uid() from public.properties where id = source_property_id returning id into new_id;
  insert into public.property_images(property_id, storage_path, public_url, caption, alt_text, is_cover, sort_order) select new_id, storage_path, public_url, caption, alt_text, is_cover, sort_order from public.property_images where property_id = source_property_id;
  insert into public.property_features(property_id, category, name, sort_order) select new_id, category, name, sort_order from public.property_features where property_id = source_property_id;
  return new_id;
end; $$;
