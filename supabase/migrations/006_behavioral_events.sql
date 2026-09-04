begin;
create table public.visitor_sessions (
  session_id uuid primary key, visitor_id uuid not null,
  lead_id uuid references public.leads(id) on delete set null,
  first_seen_at timestamptz not null default now(), last_seen_at timestamptz not null default now(),
  attribution jsonb not null default '{}', device_type text not null check(device_type in ('mobile','tablet','desktop')),
  analytics_consent boolean not null default false, marketing_consent boolean not null default false
);
create index visitor_sessions_visitor_date_idx on public.visitor_sessions(visitor_id,first_seen_at desc);
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(), visitor_id uuid not null,
  session_id uuid not null references public.visitor_sessions(session_id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  event_name text not null check(event_name in ('page_view','property_view','property_view_30s','property_view_repeat','simulator_started','simulator_step_completed','simulator_completed','whatsapp_click','contact_form_started','contact_form_completed','lead_created')),
  page_path text not null, metadata jsonb not null default '{}', dedupe_key text not null,
  created_at timestamptz not null default now(), unique(session_id,dedupe_key)
);
create index analytics_events_lead_date_idx on public.analytics_events(lead_id,created_at desc);
create index analytics_events_visitor_property_idx on public.analytics_events(visitor_id,property_id,event_name);
create index analytics_events_name_date_idx on public.analytics_events(event_name,created_at desc);
alter table public.visitor_sessions enable row level security;
alter table public.analytics_events enable row level security;
revoke all on public.visitor_sessions, public.analytics_events from anon, authenticated;
grant select on public.visitor_sessions, public.analytics_events to authenticated;
grant all on public.visitor_sessions, public.analytics_events to service_role;
create policy "admins read visitor sessions" on public.visitor_sessions for select to authenticated using(public.is_admin());
create policy "admins read analytics events" on public.analytics_events for select to authenticated using(public.is_admin());

create function public.register_visitor_session(p_session_id uuid,p_visitor_id uuid,p_attribution jsonb,p_device_type text,p_analytics boolean,p_marketing boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.visitor_sessions as s(session_id,visitor_id,attribution,device_type,analytics_consent,marketing_consent)
  values(p_session_id,p_visitor_id,jsonb_strip_nulls(p_attribution),p_device_type,p_analytics,p_marketing)
  on conflict(session_id) do update set attribution = jsonb_strip_nulls(excluded.attribution) || s.attribution,
    last_seen_at = now(), analytics_consent = excluded.analytics_consent, marketing_consent = excluded.marketing_consent
  where s.visitor_id = excluded.visitor_id;
  if not found then raise exception 'session conflict'; end if;
end; $$;
revoke all on function public.register_visitor_session(uuid,uuid,jsonb,text,boolean,boolean) from public,anon,authenticated;
grant execute on function public.register_visitor_session(uuid,uuid,jsonb,text,boolean,boolean) to service_role;

create function public.record_behavior_event(p_id uuid,p_visitor_id uuid,p_session_id uuid,p_name text,p_property_id uuid,p_page_path text,p_metadata jsonb,p_dedupe_key text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare s public.visitor_sessions%rowtype; inserted_id uuid;
begin
  select * into s from public.visitor_sessions where session_id = p_session_id and visitor_id = p_visitor_id;
  if not found then raise exception 'unknown session'; end if;
  if (p_name = 'page_view' or p_name like 'property\_%') and not s.analytics_consent then return false; end if;
  if p_name in ('lead_created','simulator_completed','contact_form_completed') then raise exception 'server-only event'; end if;
  if p_name = 'property_view_repeat' and not exists(
    select 1 from public.analytics_events where visitor_id = p_visitor_id and event_name = 'property_view'
      and property_id = p_property_id and (session_id <> p_session_id or metadata->>'view_id' <> p_metadata->>'view_id')
  ) then return false; end if;
  insert into public.analytics_events(id,visitor_id,session_id,lead_id,property_id,event_name,page_path,metadata,dedupe_key)
    values(p_id,p_visitor_id,p_session_id,s.lead_id,p_property_id,p_name,p_page_path,p_metadata,p_dedupe_key)
    on conflict do nothing returning id into inserted_id;
  update public.visitor_sessions set last_seen_at = now() where session_id = p_session_id;
  return inserted_id is not null;
end; $$;
revoke all on function public.record_behavior_event(uuid,uuid,uuid,text,uuid,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.record_behavior_event(uuid,uuid,uuid,text,uuid,text,jsonb,text) to service_role;

-- Lead and successful conversion events share the transaction, including retries.
create function public.record_lead_conversion() returns trigger
language plpgsql security definer set search_path = '' as $$
declare page text := coalesce(new.payload->>'page_path','/contato'); prop uuid := (new.payload->>'property_id')::uuid;
begin
  if new.session_id is null or new.visitor_id is null then return new; end if;
  update public.visitor_sessions set lead_id = new.lead_id,last_seen_at = now() where session_id = new.session_id and visitor_id = new.visitor_id;
  if not found then raise exception 'missing conversion session'; end if;
  update public.analytics_events set lead_id = new.lead_id where session_id = new.session_id and lead_id is null;
  insert into public.analytics_events(visitor_id,session_id,lead_id,property_id,event_name,page_path,metadata,dedupe_key)
    values(new.visitor_id,new.session_id,new.lead_id,prop,
      case when new.source = 'simulator' then 'simulator_completed' else 'contact_form_completed' end,
      page,jsonb_strip_nulls(jsonb_build_object('simulator_id',new.payload->>'simulator_id')),'submission:' || new.id::text)
    on conflict do nothing;
  if new.is_new then
    insert into public.analytics_events(visitor_id,session_id,lead_id,property_id,event_name,page_path,dedupe_key)
      values(new.visitor_id,new.session_id,new.lead_id,prop,'lead_created',page,'lead:' || new.lead_id::text) on conflict do nothing;
  end if;
  return new;
end; $$;
revoke all on function public.record_lead_conversion() from public,anon,authenticated;
create trigger lead_interaction_conversion after insert on public.lead_interactions for each row execute function public.record_lead_conversion();
commit;
