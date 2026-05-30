-- Stage 5 database migration
-- Target database: PostgreSQL 14+
-- Scope source: stage-4-database-schema-final.md
-- This file intentionally creates only active/supporting tables.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS collaboration;
CREATE SCHEMA IF NOT EXISTS content;
CREATE SCHEMA IF NOT EXISTS workflow;
CREATE SCHEMA IF NOT EXISTS security;
CREATE SCHEMA IF NOT EXISTS system;

CREATE TABLE auth.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(255),
    email varchar(255) NOT NULL,
    username varchar(100),
    password_hash varchar(255) NOT NULL,
    status varchar(50) NOT NULL DEFAULT 'active',
    photo_url text,
    last_login_at timestamptz,
    password_changed_at timestamptz,
    failed_login_attempts integer NOT NULL DEFAULT 0,
    account_locked_at timestamptz,
    lock_reason text,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_username_unique UNIQUE (username),
    CONSTRAINT users_status_check CHECK (status IN ('active', 'inactive', 'suspended', 'locked'))
);

CREATE TABLE auth.roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(100) NOT NULL,
    guard_name varchar(100) NOT NULL DEFAULT 'web',
    display_name varchar(255),
    description text,
    is_system boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT roles_name_unique UNIQUE (name)
);

CREATE TABLE auth.user_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    full_name varchar(255) NOT NULL,
    title_prefix varchar(50),
    title_suffix varchar(100),
    gender varchar(20),
    birth_place varchar(255),
    birth_date date,
    marital_status varchar(50),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id),
    CONSTRAINT user_profiles_gender_check CHECK (gender IS NULL OR gender IN ('male', 'female', 'other')),
    CONSTRAINT user_profiles_marital_status_check CHECK (marital_status IS NULL OR marital_status IN ('single', 'married', 'divorced', 'widowed'))
);

CREATE TABLE auth.user_contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    phone_number varchar(50),
    email_institutional varchar(255),
    email_personal varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT user_contacts_user_id_unique UNIQUE (user_id)
);

CREATE TABLE auth.user_addresses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    address_line1 text,
    address_line2 text,
    city varchar(100),
    province varchar(100),
    postal_code varchar(20),
    country varchar(100) NOT NULL DEFAULT 'Indonesia',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT user_addresses_user_id_unique UNIQUE (user_id)
);

CREATE TABLE auth.user_employments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    employee_id varchar(100),
    lecturer_id varchar(100),
    student_id varchar(100),
    faculty varchar(255),
    department varchar(255),
    study_program varchar(255),
    unit varchar(255),
    office_location varchar(255),
    functional_position varchar(255),
    structural_position varchar(255),
    rank_grade varchar(100),
    employment_status varchar(50),
    employment_start_date date,
    employment_end_date date,
    highest_education varchar(255),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT user_employments_user_id_unique UNIQUE (user_id),
    CONSTRAINT user_employments_employment_status_check CHECK (employment_status IS NULL OR employment_status IN ('active', 'inactive', 'contract', 'permanent', 'retired'))
);

CREATE TABLE auth.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    assigned_by uuid,
    assigned_at timestamptz NOT NULL DEFAULT now(),
    revoked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);

CREATE TABLE auth.login_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    login_at timestamptz NOT NULL DEFAULT now(),
    logout_at timestamptz,
    ip_address varchar(45),
    user_agent text,
    device_fingerprint varchar(255),
    location jsonb,
    login_method varchar(50),
    status varchar(50) NOT NULL DEFAULT 'success',
    failure_reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT login_history_login_method_check CHECK (login_method IS NULL OR login_method IN ('password', 'otp', 'refresh')),
    CONSTRAINT login_history_status_check CHECK (status IN ('success', 'failed', 'logout'))
);

CREATE TABLE auth.session_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    token_hash varchar(255) NOT NULL,
    token_type varchar(50) NOT NULL DEFAULT 'access',
    ip_address varchar(45),
    user_agent text,
    device_fingerprint varchar(255),
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    revoke_reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT session_tokens_token_hash_unique UNIQUE (token_hash),
    CONSTRAINT session_tokens_token_type_check CHECK (token_type IN ('access', 'refresh'))
);

CREATE TABLE auth.otp_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    purpose varchar(50) NOT NULL DEFAULT 'login',
    channel varchar(20) NOT NULL DEFAULT 'email',
    sent_to varchar(255),
    code_hash varchar(255) NOT NULL,
    attempts integer NOT NULL DEFAULT 0,
    max_attempts integer NOT NULL DEFAULT 5,
    expires_at timestamptz NOT NULL,
    consumed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT otp_codes_purpose_check CHECK (purpose IN ('login')),
    CONSTRAINT otp_codes_channel_check CHECK (channel IN ('email'))
);

CREATE TABLE content.topic_document_masters (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_number varchar(255) NOT NULL,
    published_at date,
    revision_number varchar(255),
    is_active boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT topic_document_masters_document_number_unique UNIQUE (document_number)
);

CREATE TABLE system.settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key varchar(255) NOT NULL,
    value jsonb,
    description text,
    updated_by uuid,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT settings_key_unique UNIQUE (key)
);

CREATE TABLE system.clauses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(100) NOT NULL,
    name varchar(255) NOT NULL,
    description text,
    is_active boolean NOT NULL DEFAULT true,
    created_by_user_id uuid,
    updated_by_user_id uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT clauses_code_unique UNIQUE (code)
);

CREATE TABLE collaboration.forum_periods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(255) NOT NULL,
    period_type varchar(20) NOT NULL,
    start_date date,
    end_date date,
    join_code varchar(20),
    is_join_code_active boolean NOT NULL DEFAULT true,
    created_by_user_id uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT forum_periods_join_code_unique UNIQUE (join_code),
    CONSTRAINT forum_periods_period_type_check CHECK (period_type IN ('semester', 'annual', 'custom'))
);

CREATE TABLE collaboration.forum_period_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    forum_period_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role varchar(50) NOT NULL DEFAULT 'member',
    added_by uuid,
    added_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT forum_period_members_role_check CHECK (role IN ('owner', 'admin', 'member'))
);

CREATE TABLE collaboration.forum_period_join_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    forum_period_id uuid NOT NULL,
    requester_user_id uuid NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'pending',
    reviewed_by_user_id uuid,
    reviewed_at timestamptz,
    rejection_reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT forum_period_join_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'))
);

CREATE TABLE collaboration.forums (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    forum_period_id uuid,
    name varchar(255) NOT NULL,
    description text,
    is_locked boolean NOT NULL DEFAULT false,
    is_archived boolean NOT NULL DEFAULT false,
    visibility varchar(50) NOT NULL DEFAULT 'public',
    responsible_user_id uuid,
    join_code varchar(20),
    is_join_code_active boolean NOT NULL DEFAULT true,
    deleted_by uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT forums_join_code_unique UNIQUE (join_code),
    CONSTRAINT forums_visibility_check CHECK (visibility IN ('public', 'private', 'period'))
);

CREATE TABLE collaboration.forum_participants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    forum_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role varchar(50) NOT NULL DEFAULT 'participant',
    is_responsible_user boolean NOT NULL DEFAULT false,
    added_by uuid,
    added_at timestamptz NOT NULL DEFAULT now(),
    removed_at timestamptz,
    removed_by uuid,
    remove_reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT forum_participants_role_check CHECK (role IN ('owner', 'admin', 'participant', 'viewer', 'auditor', 'auditee'))
);

CREATE TABLE content.topics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    forum_id uuid NOT NULL,
    document_master_id uuid,
    title varchar(500) NOT NULL,
    description text,
    status varchar(50) NOT NULL DEFAULT 'draft',
    version_major integer NOT NULL DEFAULT 1,
    version_minor integer NOT NULL DEFAULT 0,
    deadline_at timestamptz,
    is_frozen boolean NOT NULL DEFAULT false,
    frozen_until timestamptz,
    frozen_by_user_id uuid,
    created_by_user_id uuid NOT NULL,
    deleted_by uuid,
    deletion_reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT topics_status_check CHECK (status IN ('draft', 'published', 'in_review', 'approved', 'changes_requested', 'closed', 'reopened', 'frozen'))
);

CREATE TABLE content.input_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id uuid NOT NULL,
    type varchar(50) NOT NULL,
    label varchar(255),
    value text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    order_index integer NOT NULL DEFAULT 0,
    visibility varchar(50) NOT NULL DEFAULT 'visible',
    created_by_user_id uuid,
    deleted_by_user_id uuid,
    deletion_reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT input_items_type_check CHECK (type IN ('text', 'textarea', 'select', 'date', 'number', 'file', 'finding', 'evidence')),
    CONSTRAINT input_items_visibility_check CHECK (visibility IN ('visible', 'hidden'))
);

CREATE TABLE content.topic_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id uuid NOT NULL,
    version_number integer NOT NULL,
    title varchar(500),
    description text,
    status varchar(50),
    snapshot_data jsonb,
    changed_by_user_id uuid,
    change_reason text,
    change_type varchar(50),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT topic_versions_topic_version_unique UNIQUE (topic_id, version_number),
    CONSTRAINT topic_versions_status_check CHECK (status IS NULL OR status IN ('draft', 'published', 'in_review', 'approved', 'changes_requested', 'closed', 'reopened', 'frozen')),
    CONSTRAINT topic_versions_change_type_check CHECK (change_type IS NULL OR change_type IN ('create', 'update', 'workflow', 'revert'))
);

CREATE TABLE workflow.workflow_states (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id uuid NOT NULL,
    from_status varchar(50),
    to_status varchar(50) NOT NULL,
    reason text,
    changed_by_user_id uuid NOT NULL,
    changed_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT workflow_states_from_status_check CHECK (from_status IS NULL OR from_status IN ('draft', 'published', 'in_review', 'approved', 'changes_requested', 'closed', 'reopened', 'frozen')),
    CONSTRAINT workflow_states_to_status_check CHECK (to_status IN ('draft', 'published', 'in_review', 'approved', 'changes_requested', 'closed', 'reopened', 'frozen'))
);

CREATE TABLE content.attachments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    forum_id uuid,
    input_item_id uuid,
    storage_url text NOT NULL,
    filename varchar(500) NOT NULL,
    content_type varchar(100),
    size_bytes bigint,
    checksum varchar(255),
    created_by_user_id uuid NOT NULL,
    deleted_by uuid,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT attachments_owner_check CHECK (forum_id IS NOT NULL OR input_item_id IS NOT NULL)
);

CREATE TABLE content.documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title varchar(255),
    description text,
    original_filename varchar(255) NOT NULL,
    mime_type varchar(255) NOT NULL,
    size_bytes bigint NOT NULL,
    stored_path varchar(500) NOT NULL,
    uploaded_by_user_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);

CREATE TABLE content.user_signatures (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    original_filename varchar(255) NOT NULL,
    mime_type varchar(255) NOT NULL,
    size_bytes bigint NOT NULL,
    stored_path varchar(500) NOT NULL,
    notes text,
    created_by_user_id uuid,
    updated_by_user_id uuid,
    deleted_by_user_id uuid,
    deletion_reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);

CREATE TABLE security.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id uuid,
    entity_type varchar(100) NOT NULL,
    entity_id uuid NOT NULL,
    action varchar(100) NOT NULL,
    severity varchar(50),
    category varchar(100),
    details jsonb NOT NULL DEFAULT '{}'::jsonb,
    ip_address varchar(45),
    user_agent text,
    "timestamp" timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT audit_logs_severity_check CHECK (severity IS NULL OR severity IN ('info', 'warning', 'critical'))
);

ALTER TABLE auth.users
    ADD CONSTRAINT users_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT users_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT users_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE auth.user_profiles ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE auth.user_contacts ADD CONSTRAINT user_contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE auth.user_addresses ADD CONSTRAINT user_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE auth.user_employments ADD CONSTRAINT user_employments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE auth.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES auth.roles(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    ADD CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE auth.login_history ADD CONSTRAINT login_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE auth.session_tokens ADD CONSTRAINT session_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE auth.otp_codes ADD CONSTRAINT otp_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE system.settings ADD CONSTRAINT settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE system.clauses
    ADD CONSTRAINT clauses_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT clauses_updated_by_user_id_fkey FOREIGN KEY (updated_by_user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE collaboration.forum_periods ADD CONSTRAINT forum_periods_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE collaboration.forum_period_members
    ADD CONSTRAINT forum_period_members_forum_period_id_fkey FOREIGN KEY (forum_period_id) REFERENCES collaboration.forum_periods(id) ON UPDATE CASCADE ON DELETE CASCADE,
    ADD CONSTRAINT forum_period_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    ADD CONSTRAINT forum_period_members_added_by_fkey FOREIGN KEY (added_by) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE collaboration.forum_period_join_requests
    ADD CONSTRAINT forum_period_join_requests_forum_period_id_fkey FOREIGN KEY (forum_period_id) REFERENCES collaboration.forum_periods(id) ON UPDATE CASCADE ON DELETE CASCADE,
    ADD CONSTRAINT forum_period_join_requests_requester_user_id_fkey FOREIGN KEY (requester_user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    ADD CONSTRAINT forum_period_join_requests_reviewed_by_user_id_fkey FOREIGN KEY (reviewed_by_user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE collaboration.forums
    ADD CONSTRAINT forums_forum_period_id_fkey FOREIGN KEY (forum_period_id) REFERENCES collaboration.forum_periods(id) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT forums_responsible_user_id_fkey FOREIGN KEY (responsible_user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT forums_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE collaboration.forum_participants
    ADD CONSTRAINT forum_participants_forum_id_fkey FOREIGN KEY (forum_id) REFERENCES collaboration.forums(id) ON UPDATE CASCADE ON DELETE CASCADE,
    ADD CONSTRAINT forum_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    ADD CONSTRAINT forum_participants_added_by_fkey FOREIGN KEY (added_by) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT forum_participants_removed_by_fkey FOREIGN KEY (removed_by) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE content.topics
    ADD CONSTRAINT topics_forum_id_fkey FOREIGN KEY (forum_id) REFERENCES collaboration.forums(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    ADD CONSTRAINT topics_document_master_id_fkey FOREIGN KEY (document_master_id) REFERENCES content.topic_document_masters(id) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT topics_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    ADD CONSTRAINT topics_frozen_by_user_id_fkey FOREIGN KEY (frozen_by_user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT topics_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE content.input_items
    ADD CONSTRAINT input_items_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES content.topics(id) ON UPDATE CASCADE ON DELETE CASCADE,
    ADD CONSTRAINT input_items_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT input_items_deleted_by_user_id_fkey FOREIGN KEY (deleted_by_user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE content.topic_versions
    ADD CONSTRAINT topic_versions_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES content.topics(id) ON UPDATE CASCADE ON DELETE CASCADE,
    ADD CONSTRAINT topic_versions_changed_by_user_id_fkey FOREIGN KEY (changed_by_user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE workflow.workflow_states
    ADD CONSTRAINT workflow_states_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES content.topics(id) ON UPDATE CASCADE ON DELETE CASCADE,
    ADD CONSTRAINT workflow_states_changed_by_user_id_fkey FOREIGN KEY (changed_by_user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE content.attachments
    ADD CONSTRAINT attachments_forum_id_fkey FOREIGN KEY (forum_id) REFERENCES collaboration.forums(id) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT attachments_input_item_id_fkey FOREIGN KEY (input_item_id) REFERENCES content.input_items(id) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT attachments_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    ADD CONSTRAINT attachments_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE content.documents ADD CONSTRAINT documents_uploaded_by_user_id_fkey FOREIGN KEY (uploaded_by_user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE content.user_signatures
    ADD CONSTRAINT user_signatures_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    ADD CONSTRAINT user_signatures_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT user_signatures_updated_by_user_id_fkey FOREIGN KEY (updated_by_user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT user_signatures_deleted_by_user_id_fkey FOREIGN KEY (deleted_by_user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE security.audit_logs ADD CONSTRAINT audit_logs_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE SET NULL;

CREATE UNIQUE INDEX user_roles_user_role_active_unique ON auth.user_roles (user_id, role_id) WHERE revoked_at IS NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX forum_period_members_period_user_active_unique ON collaboration.forum_period_members (forum_period_id, user_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX period_join_requests_pending_unique ON collaboration.forum_period_join_requests (forum_period_id, requester_user_id) WHERE status = 'pending' AND deleted_at IS NULL;
CREATE UNIQUE INDEX forum_participants_forum_user_active_unique ON collaboration.forum_participants (forum_id, user_id) WHERE deleted_at IS NULL;

CREATE INDEX users_status_deleted_idx ON auth.users (status, deleted_at);
CREATE INDEX users_name_idx ON auth.users (name);
CREATE INDEX user_profiles_full_name_idx ON auth.user_profiles (full_name);
CREATE INDEX user_contacts_phone_idx ON auth.user_contacts (phone_number);
CREATE INDEX user_employments_identity_idx ON auth.user_employments (employee_id, lecturer_id, student_id);
CREATE INDEX user_roles_user_role_idx ON auth.user_roles (user_id, role_id);
CREATE INDEX login_history_user_login_at_idx ON auth.login_history (user_id, login_at DESC);
CREATE INDEX login_history_status_login_at_idx ON auth.login_history (status, login_at DESC);
CREATE INDEX session_tokens_user_active_idx ON auth.session_tokens (user_id, revoked_at, expires_at);
CREATE INDEX otp_codes_user_active_idx ON auth.otp_codes (user_id, purpose, consumed_at, expires_at);
CREATE INDEX forum_periods_created_at_idx ON collaboration.forum_periods (created_at DESC);
CREATE INDEX forum_period_members_period_user_idx ON collaboration.forum_period_members (forum_period_id, user_id);
CREATE INDEX period_join_requests_period_status_idx ON collaboration.forum_period_join_requests (forum_period_id, status, created_at DESC);
CREATE INDEX forums_period_created_idx ON collaboration.forums (forum_period_id, created_at DESC);
CREATE INDEX forums_state_idx ON collaboration.forums (is_locked, is_archived, deleted_at);
CREATE INDEX forum_participants_forum_user_idx ON collaboration.forum_participants (forum_id, user_id);
CREATE INDEX topic_document_masters_active_idx ON content.topic_document_masters (is_active);
CREATE INDEX topics_forum_status_created_idx ON content.topics (forum_id, status, created_at DESC);
CREATE INDEX topics_creator_created_idx ON content.topics (created_by_user_id, created_at DESC);
CREATE INDEX topics_deadline_idx ON content.topics (deadline_at);
CREATE INDEX input_items_topic_order_idx ON content.input_items (topic_id, order_index);
CREATE INDEX input_items_type_visibility_idx ON content.input_items (type, visibility);
CREATE INDEX workflow_states_topic_changed_idx ON workflow.workflow_states (topic_id, changed_at DESC);
CREATE INDEX attachments_forum_created_idx ON content.attachments (forum_id, created_at DESC);
CREATE INDEX attachments_input_item_idx ON content.attachments (input_item_id);
CREATE INDEX attachments_filename_idx ON content.attachments (filename);
CREATE INDEX documents_uploader_created_idx ON content.documents (uploaded_by_user_id, created_at DESC);
CREATE INDEX user_signatures_user_active_idx ON content.user_signatures (user_id, deleted_at);
CREATE INDEX clauses_active_code_idx ON system.clauses (is_active, code);
CREATE INDEX audit_logs_actor_timestamp_idx ON security.audit_logs (actor_user_id, "timestamp" DESC);
CREATE INDEX audit_logs_entity_timestamp_idx ON security.audit_logs (entity_type, entity_id, "timestamp" DESC);
CREATE INDEX audit_logs_action_category_idx ON security.audit_logs (action, category, "timestamp" DESC);

CREATE INDEX topics_search_idx ON content.topics USING gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '')));
CREATE INDEX input_items_search_idx ON content.input_items USING gin (to_tsvector('simple', coalesce(label, '') || ' ' || coalesce(value, '')));
CREATE INDEX documents_search_idx ON content.documents USING gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(original_filename, '') || ' ' || coalesce(description, '')));
CREATE INDEX clauses_search_idx ON system.clauses USING gin (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, '')));

COMMIT;

-- DOWN / ROLLBACK
-- Run the statements below manually as a rollback script, or split them into
-- a separate down migration in the chosen backend framework.
--
-- BEGIN;
-- DROP SCHEMA IF EXISTS security CASCADE;
-- DROP SCHEMA IF EXISTS workflow CASCADE;
-- DROP SCHEMA IF EXISTS content CASCADE;
-- DROP SCHEMA IF EXISTS collaboration CASCADE;
-- DROP SCHEMA IF EXISTS system CASCADE;
-- DROP SCHEMA IF EXISTS auth CASCADE;
-- COMMIT;
