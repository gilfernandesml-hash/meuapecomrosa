-- Apply on a reviewed database, before deploying the new lead API. No rows are deleted.
begin;

create or replace function public.normalize_lead_phone(value text) returns text
language plpgsql immutable set search_path = '' as $$
declare digits text := regexp_replace(coalesce(value, ''), '[^0-9]', '', 'g');
begin
  if left(digits, 2) = '00' then digits := substr(digits, 3); end if;
  if length(digits) in (10, 11) then digits := '55' || digits; end if;
  if digits !~ '^55[1-9][0-9]([2-5][0-9]{7}|9[0-9]{8})$' or substr(digits, 5) ~ '^([0-9])\1+$' then return null; end if;
  return digits;
end; $$;

alter table public.leads
  add column phone_normalized text generated always as (public.normalize_lead_phone(phone)) stored,
  add column email_normalized text generated always as (nullif(lower(btrim(email)), '')) stored,
  add column income_amount numeric(14,2) check (income_amount >= 0),
  add column down_payment_range text,
  add column bedrooms text check (bedrooms in ('studio','1','2','3+')),
  add column purchase_mode text check (purchase_mode in ('alone','joint')),
  add column origin_page text,
  add column landing_page text,
  add column referrer text,
  add column utm_source text,
  add column utm_medium text,
  add column utm_campaign text,
  add column utm_content text,
  add column utm_term text,
  add column visitor_id uuid,
  add column session_id uuid,
  add column last_interaction_at timestamptz;

create index leads_phone_normalized_idx on public.leads(phone_normalized);
create index leads_email_normalized_idx on public.leads(email_normalized);

create table public.lead_interactions (
  id uuid primary key,
  lead_id uuid not null references public.leads(id) on delete restrict,
  visitor_id uuid, session_id uuid,
  source text not null,
  payload jsonb not null,
  previous_values jsonb,
  is_new boolean not null,
  created_at timestamptz not null default now()
);
create index lead_interactions_lead_date_idx on public.lead_interactions(lead_id, created_at desc);
alter table public.lead_interactions enable row level security;
create policy "admins read lead interactions" on public.lead_interactions for select to authenticated using (public.is_admin());
revoke all on public.lead_interactions from anon, authenticated;
grant select on public.lead_interactions to authenticated;
grant all on public.lead_interactions to service_role;

-- Remove the public insert path, preserving authenticated administrator operations and RLS.
drop policy if exists "public creates leads" on public.leads;
revoke all on public.leads from anon;
grant select, insert, update, delete on public.leads to authenticated;
grant all on public.leads to service_role;

create table public.request_rate_limits (
  key text primary key,
  count integer not null,
  expires_at timestamptz not null
);
create index request_rate_limits_expiry_idx on public.request_rate_limits(expires_at);
alter table public.request_rate_limits enable row level security;
revoke all on public.request_rate_limits from anon, authenticated;
grant all on public.request_rate_limits to service_role;

create function public.consume_public_rate_limit(p_key text, p_limit integer, p_seconds integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare consumed integer;
begin
  if p_limit < 1 or p_seconds < 1 or length(p_key) > 200 then raise exception 'invalid rate limit'; end if;
  delete from public.request_rate_limits where expires_at < now() - interval '1 day';
  insert into public.request_rate_limits as r(key,count,expires_at)
  values(p_key,1,now() + make_interval(secs => p_seconds))
  on conflict(key) do update set
    count = case when r.expires_at <= now() then 1 else least(r.count + 1, p_limit + 1) end,
    expires_at = case when r.expires_at <= now() then now() + make_interval(secs => p_seconds) else r.expires_at end
  returning count into consumed;
  return consumed <= p_limit;
end; $$;
revoke all on function public.consume_public_rate_limit(text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_public_rate_limit(text,integer,integer) to service_role;

create function public.capture_lead(p_payload jsonb, p_request_id uuid, p_visitor_id uuid, p_session_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  old public.leads%rowtype;
  saved public.leads%rowtype;
  prior public.lead_interactions%rowtype;
  normalized text := public.normalize_lead_phone(p_payload->>'phone');
  normalized_email text := nullif(lower(btrim(p_payload->>'email')), '');
  lock_key text;
  fresh boolean := false;
  attribution jsonb := coalesce(p_payload->'attribution', '{}'::jsonb);
begin
  if normalized is null or length(btrim(p_payload->>'name')) not between 2 and 120 or coalesce(p_payload->>'consent','') <> 'true' then
    raise exception 'invalid lead';
  end if;
  -- Ordered transaction locks serialize duplicate requests and competing identity matches.
  perform pg_advisory_xact_lock(hashtextextended('request:' || p_request_id::text, 0));
  select * into prior from public.lead_interactions where id = p_request_id;
  if found then return jsonb_build_object('id',prior.lead_id,'created',false,'replayed',true); end if;
  for lock_key in select unnest(array['phone:' || normalized, 'email:' || coalesce(normalized_email, normalized)]) order by 1 loop
    perform pg_advisory_xact_lock(hashtextextended(lock_key,0));
  end loop;
  select * into old from public.leads
    where phone_normalized = normalized and coalesce(last_interaction_at,updated_at,created_at) >= now() - interval '30 days'
    order by coalesce(last_interaction_at,updated_at,created_at) desc, id limit 1 for update;
  if old.id is null and normalized_email is not null then
    -- Email only enriches a single legacy record without a valid, conflicting telephone.
    if (select count(*) from public.leads where email_normalized = normalized_email and phone_normalized is null
        and coalesce(last_interaction_at,updated_at,created_at) >= now() - interval '30 days') = 1 then
      select * into old from public.leads where email_normalized = normalized_email and phone_normalized is null
        and coalesce(last_interaction_at,updated_at,created_at) >= now() - interval '30 days' for update;
    end if;
  end if;
  if old.id is null then
    insert into public.leads(name,phone,email,source,consent_at)
    values(btrim(p_payload->>'name'),normalized,normalized_email,coalesce(p_payload->>'source','contact'),now()) returning * into saved;
    fresh := true;
  else saved := old;
  end if;

  update public.leads set
    phone = case when phone_normalized is null then normalized else phone end,
    email = coalesce(nullif(btrim(email),''), normalized_email),
    income_range = coalesce(nullif(p_payload->>'income_range',''),income_range),
    income_amount = coalesce((p_payload->>'income_amount')::numeric,income_amount),
    has_fgts = coalesce((p_payload->>'has_fgts')::boolean,has_fgts),
    fgts_amount = coalesce((p_payload->>'fgts_amount')::numeric,fgts_amount),
    has_down_payment = coalesce((p_payload->>'has_down_payment')::boolean,has_down_payment),
    down_payment_amount = coalesce((p_payload->>'down_payment_amount')::numeric,down_payment_amount),
    down_payment_range = coalesce(nullif(p_payload->>'down_payment_range',''),down_payment_range),
    purchase_mode = coalesce(p_payload->>'purchase_mode',purchase_mode),
    bedrooms = coalesce(p_payload->>'bedrooms',bedrooms),
    region = coalesce(nullif(p_payload->>'region',''),region),
    purchase_timeline = coalesce(nullif(p_payload->>'purchase_timeline',''),purchase_timeline),
    property_id = coalesce((p_payload->>'property_id')::uuid,property_id),
    origin_page = coalesce(nullif(origin_page,''),p_payload->>'origin_page',p_payload->>'page_path'),
    landing_page = coalesce(nullif(landing_page,''),nullif(attribution->>'landing_page','')),
    referrer = coalesce(nullif(referrer,''),nullif(attribution->>'referrer','')),
    utm_source = coalesce(nullif(utm_source,''),nullif(attribution->>'utm_source','')),
    utm_medium = coalesce(nullif(utm_medium,''),nullif(attribution->>'utm_medium','')),
    utm_campaign = coalesce(nullif(utm_campaign,''),nullif(attribution->>'utm_campaign','')),
    utm_content = coalesce(nullif(utm_content,''),nullif(attribution->>'utm_content','')),
    utm_term = coalesce(nullif(utm_term,''),nullif(attribution->>'utm_term','')),
    visitor_id = coalesce(visitor_id,p_visitor_id), session_id = coalesce(session_id,p_session_id),
    last_interaction_at = now(), updated_at = now()
  where id = saved.id returning * into saved;

  insert into public.lead_interactions(id,lead_id,visitor_id,session_id,source,payload,previous_values,is_new)
  values(p_request_id,saved.id,p_visitor_id,p_session_id,coalesce(p_payload->>'source','contact'),p_payload,
    case when fresh then null else to_jsonb(old) end,fresh);
  return jsonb_build_object('id',saved.id,'created',fresh,'replayed',false);
end; $$;
revoke all on function public.capture_lead(jsonb,uuid,uuid,uuid) from public, anon, authenticated;
grant execute on function public.capture_lead(jsonb,uuid,uuid,uuid) to service_role;
commit;
