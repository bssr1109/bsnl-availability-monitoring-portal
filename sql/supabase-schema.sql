create extension if not exists "uuid-ossp";

create table profiles (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  role text not null check (role in ('Admin','Field Officer','Management Viewer')),
  ssa text,
  sdca text,
  created_at timestamptz not null default now()
);

create table field_officer_sdca_mapping (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references profiles(id),
  sdca text not null
);

create table sites (
  id uuid primary key default uuid_generate_v4(),
  ssa text not null,
  sdca text not null,
  bts_id text not null unique,
  bts_name text not null,
  ip_id text,
  technology text,
  site_type text,
  vendor text,
  field_officer_id uuid references profiles(id),
  critical boolean not null default false,
  battery_backup_hours numeric not null default 0,
  transmission_paths integer not null default 1
);

create table bts_master (
  id uuid primary key default uuid_generate_v4(),
  site_id text not null unique,
  field_officer_staff_no text,
  field_officer_name text,
  active boolean not null default true,
  source text,
  updated_at timestamptz not null default now()
);

create table upload_batches (
  id uuid primary key default uuid_generate_v4(),
  file_name text not null,
  uploaded_by uuid references profiles(id),
  uploaded_at timestamptz not null default now(),
  fingerprint text not null unique,
  row_count integer not null,
  incident_count integer not null
);

create table raw_alarm_records (
  id uuid primary key default uuid_generate_v4(),
  batch_id uuid not null references upload_batches(id),
  source_row_number integer not null,
  raw jsonb not null,
  normalized jsonb not null
);

create table outage_incidents (
  id uuid primary key default uuid_generate_v4(),
  batch_id uuid references upload_batches(id),
  site_id uuid references sites(id),
  bts_id text not null,
  outage_date date not null,
  down_time timestamptz not null,
  up_time timestamptz not null,
  duration_minutes integer not null,
  alarm_code text,
  alarm_category text,
  description text,
  raw_record_ids uuid[] not null default '{}',
  major boolean not null default false,
  unique (bts_id, down_time, up_time, alarm_category)
);

create table outage_remarks (
  id uuid primary key default uuid_generate_v4(),
  incident_id uuid not null unique references outage_incidents(id),
  field_officer_id uuid references profiles(id),
  primary_cause text not null,
  detailed_reason text,
  fault_location text,
  action_taken text,
  restoration_details text,
  restored_by text,
  team_or_vendor text,
  restoration_type text check (restoration_type in ('Temporary','Permanent')),
  material_used text,
  delay_reason text,
  responsibility text,
  preventive_action text,
  attachment_placeholder text,
  further_action_for_temporary text,
  updated_at timestamptz not null default now()
);

create table improvement_proposals (
  id uuid primary key default uuid_generate_v4(),
  incident_id uuid references outage_incidents(id),
  site_id uuid references sites(id),
  field_officer_id uuid references profiles(id),
  improvement_required boolean not null,
  no_justification text,
  improvement_type text,
  technical_proposal text,
  existing_arrangement text,
  observed_problem text,
  affected_sites integer,
  traffic_affected text,
  expected_benefit text,
  availability_improvement_expected text,
  material_requirement text,
  route_length_rkm numeric,
  estimated_cost numeric,
  priority text check (priority in ('Low','Medium','High','Critical')),
  target_completion_date date,
  status text check (status in ('Draft','Submitted','Approved','In Progress','Completed','Rejected')),
  proposal_letter_number text,
  proposal_date date,
  submitted_to_office text,
  approval_reference text,
  work_order_reference text,
  completion_date date
);

create table proposal_updates (
  id uuid primary key default uuid_generate_v4(),
  proposal_id uuid not null references improvement_proposals(id),
  status text not null,
  note text,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

create table eod_submissions (
  id uuid primary key default uuid_generate_v4(),
  field_officer_id uuid references profiles(id),
  sdca text not null,
  date date not null,
  submitted_at timestamptz not null,
  late boolean not null default false,
  locked boolean not null default true,
  reopened_at timestamptz,
  reopened_by uuid references profiles(id),
  reopen_reason text,
  unique (field_officer_id, date)
);

create table attachments (
  id uuid primary key default uuid_generate_v4(),
  incident_id uuid references outage_incidents(id),
  file_name text not null,
  url text not null,
  uploaded_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  created_at timestamptz not null default now(),
  details jsonb not null default '{}'
);

create index idx_sites_sdca on sites(sdca);
create index idx_bts_master_site_id on bts_master(site_id);
create index idx_incidents_site_date on outage_incidents(site_id, outage_date);
create index idx_remarks_field_officer on outage_remarks(field_officer_id);
create index idx_proposals_status on improvement_proposals(status);
