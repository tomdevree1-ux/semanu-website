-- 0038_leads_portal_access.sql
-- Retire the legacy /admin panel by surfacing the contact/start form `leads` table in
-- the new portal instead, permission-gated. ADDITIVE. Mirrors the 0037 posture:
-- permission-gated SELECT, NO write policies (service-role writes via permission-checked
-- server actions). `leads.status` already exists, so no schema change to the table.
-- Authority: AMAI_PORTAL_MASTER_PLAN.md (P4: migrate leads/orders under permissions,
-- retire old /admin). Never edit an applied migration; add a new one.

-- RLS: leads already has RLS enabled; add a permission-gated SELECT (defense in depth —
-- the portal reads via the service role + requirePermission, this guards direct access).
alter table public.leads enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='leads' and policyname='leads_select') then
    execute $p$create policy leads_select on public.leads for select to authenticated using (has_permission('leads.read') or is_platform_super_admin())$p$;
  end if;
end $$;

-- permissions (module + label NOT NULL)
insert into public.permissions (key, module, label) values
  ('leads.read',   'leads', 'View contact and start form leads'),
  ('leads.manage', 'leads', 'Update lead status (new, read, archived, spam)')
on conflict (key) do nothing;

-- role grants: admin both; analyst/reviewer/read_only read only (mirror acquisition).
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on (
       (r.key = 'admin' and p.key in ('leads.read','leads.manage'))
    or (r.key in ('analyst','reviewer','read_only') and p.key = 'leads.read')
)
where not exists (
  select 1 from public.role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id
);

-- ROLLBACK:
--   drop policy if exists leads_select on public.leads;
--   delete from public.role_permissions rp using public.permissions p
--     where rp.permission_id = p.id and p.key in ('leads.read','leads.manage');
--   delete from public.permissions where key in ('leads.read','leads.manage');
