-- BE2 schema after the BE1 foundation and email verification migrations.
-- Prisma migrate deploy applies this migration in order. Validate first on an
-- isolated PostgreSQL schema; do not apply it to the shared DB by hand.
-- Prisma models deliberately omit cross-owner relations; these FKs are authoritative.

CREATE TABLE candidate_profile (
  user_id uuid PRIMARY KEY REFERENCES user_account(id) ON DELETE RESTRICT,
  phone varchar(20),
  headline varchar(160),
  summary text,
  location varchar(160),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 0,
  CONSTRAINT ck_candidate_profile_summary CHECK (summary IS NULL OR char_length(summary) <= 3000),
  CONSTRAINT ck_candidate_profile_version CHECK (version >= 0)
);

CREATE TABLE candidate_skill (
  candidate_id uuid NOT NULL REFERENCES candidate_profile(user_id) ON DELETE RESTRICT,
  skill_id uuid NOT NULL REFERENCES skill(id) ON DELETE RESTRICT,
  PRIMARY KEY (candidate_id, skill_id)
);

CREATE TABLE cv_version (
  id uuid PRIMARY KEY,
  candidate_id uuid NOT NULL REFERENCES candidate_profile(user_id) ON DELETE RESTRICT,
  version_no integer NOT NULL,
  original_name varchar(255) NOT NULL,
  object_key varchar(500) NOT NULL UNIQUE,
  size_bytes bigint,
  mime_type varchar(80),
  checksum_sha256 char(64),
  status varchar(24) NOT NULL,
  scan_attempt_count integer NOT NULL DEFAULT 0,
  scan_locked_until timestamptz,
  scan_next_retry_at timestamptz,
  scan_reason varchar(500),
  upload_expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  ready_at timestamptz,
  deleted_at timestamptz,
  storage_version_id varchar(255),
  upload_attempt_id uuid,
  lease_token uuid,
  delete_requested_at timestamptz,
  version integer NOT NULL DEFAULT 0,
  CONSTRAINT uq_cv_id_owner UNIQUE (id, candidate_id),
  CONSTRAINT uq_cv_owner_version UNIQUE (candidate_id, version_no),
  CONSTRAINT ck_cv_version_no CHECK (version_no > 0),
  CONSTRAINT ck_cv_version CHECK (version >= 0),
  CONSTRAINT ck_cv_scan_attempt CHECK (scan_attempt_count >= 0),
  CONSTRAINT ck_cv_size CHECK (size_bytes IS NULL OR size_bytes BETWEEN 1 AND 10485760),
  CONSTRAINT ck_cv_status CHECK (status IN ('PENDING_UPLOAD','QUARANTINED','SCANNING','READY','REJECTED','DELETE_PENDING','DELETED')),
  CONSTRAINT ck_cv_ready CHECK (status <> 'READY' OR
    (size_bytes IS NOT NULL AND mime_type IS NOT NULL AND mime_type = 'application/pdf'
     AND checksum_sha256 IS NOT NULL AND checksum_sha256 ~ '^[0-9a-f]{64}$'
     AND storage_version_id IS NOT NULL AND ready_at IS NOT NULL)),
  CONSTRAINT ck_cv_deleted CHECK (status <> 'DELETED' OR deleted_at IS NOT NULL)
);
CREATE INDEX cv_version_candidate_id_created_at_id_idx ON cv_version(candidate_id, created_at DESC, id);
CREATE INDEX cv_version_status_scan_next_retry_at_scan_locked_until_idx
  ON cv_version(status, scan_next_retry_at, scan_locked_until);

CREATE TABLE application (
  id uuid PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES job_post(id) ON DELETE RESTRICT,
  candidate_id uuid NOT NULL REFERENCES candidate_profile(user_id) ON DELETE RESTRICT,
  original_cv_version_id uuid NOT NULL,
  current_cv_version_id uuid NOT NULL,
  candidate_snapshot jsonb NOT NULL,
  status varchar(24) NOT NULL,
  cover_letter text,
  result_message text,
  result_published_at timestamptz,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 0,
  CONSTRAINT uq_application_id_owner UNIQUE (id, candidate_id),
  CONSTRAINT uq_application_candidate_job UNIQUE (candidate_id, job_id),
  CONSTRAINT fk_application_original_cv FOREIGN KEY (original_cv_version_id, candidate_id)
    REFERENCES cv_version(id, candidate_id) ON DELETE RESTRICT,
  CONSTRAINT fk_application_current_cv FOREIGN KEY (current_cv_version_id, candidate_id)
    REFERENCES cv_version(id, candidate_id) ON DELETE RESTRICT,
  CONSTRAINT ck_application_version CHECK (version >= 0),
  CONSTRAINT ck_application_status CHECK (status IN
    ('SUBMITTED','SCREENING','SHORTLISTED','INTERVIEW_SCHEDULED','INTERVIEWED','HIRED','REJECTED','WITHDRAWN')),
  CONSTRAINT ck_application_cover CHECK (cover_letter IS NULL OR char_length(cover_letter) <= 3000),
  CONSTRAINT ck_application_snapshot CHECK (
    jsonb_typeof(candidate_snapshot) = 'object'
    AND candidate_snapshot ? 'name' AND jsonb_typeof(candidate_snapshot->'name') = 'string'
    AND candidate_snapshot ? 'email' AND jsonb_typeof(candidate_snapshot->'email') = 'string'
    AND candidate_snapshot ? 'phone' AND jsonb_typeof(candidate_snapshot->'phone') IN ('string','null')
    AND candidate_snapshot ? 'headline' AND jsonb_typeof(candidate_snapshot->'headline') IN ('string','null')
    AND candidate_snapshot - 'name' - 'email' - 'phone' - 'headline' = '{}'::jsonb
  ),
  CONSTRAINT ck_final_result CHECK (
    (status IN ('HIRED','REJECTED') AND result_published_at IS NOT NULL
     AND result_message IS NOT NULL AND char_length(btrim(result_message)) BETWEEN 1 AND 3000)
    OR
    (status NOT IN ('HIRED','REJECTED') AND result_published_at IS NULL AND result_message IS NULL)
  )
);
CREATE INDEX application_job_id_status_submitted_at_id_idx
  ON application(job_id, status, submitted_at DESC, id);
CREATE INDEX application_candidate_id_submitted_at_id_idx
  ON application(candidate_id, submitted_at DESC, id);

CREATE TABLE application_history (
  id uuid PRIMARY KEY,
  application_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  actor_id uuid REFERENCES user_account(id) ON DELETE RESTRICT,
  actor_type varchar(10) NOT NULL,
  event_type varchar(40) NOT NULL,
  from_status varchar(24),
  to_status varchar(24) NOT NULL,
  old_cv_id uuid,
  new_cv_id uuid,
  reason text,
  public_message varchar(3000),
  created_at timestamptz NOT NULL DEFAULT now(),
  aggregate_version integer NOT NULL,
  CONSTRAINT fk_history_application_owner FOREIGN KEY (application_id, candidate_id)
    REFERENCES application(id, candidate_id) ON DELETE RESTRICT,
  CONSTRAINT fk_history_old_cv FOREIGN KEY (old_cv_id, candidate_id)
    REFERENCES cv_version(id, candidate_id) ON DELETE RESTRICT,
  CONSTRAINT fk_history_new_cv FOREIGN KEY (new_cv_id, candidate_id)
    REFERENCES cv_version(id, candidate_id) ON DELETE RESTRICT,
  CONSTRAINT ck_history_actor CHECK (
    (actor_type = 'SYSTEM' AND actor_id IS NULL) OR
    (actor_type = 'USER' AND actor_id IS NOT NULL)),
  CONSTRAINT ck_history_event CHECK (event_type IN
    ('SUBMIT','STATUS_CHANGE','CV_REPLACED','RESULT_PUBLISHED','INTERVIEW_CONFIRMED','INTERVIEW_CANCELLED','WITHDRAW')),
  CONSTRAINT ck_history_from_status CHECK (from_status IS NULL OR from_status IN
    ('SUBMITTED','SCREENING','SHORTLISTED','INTERVIEW_SCHEDULED','INTERVIEWED','HIRED','REJECTED','WITHDRAWN')),
  CONSTRAINT ck_history_to_status CHECK (to_status IN
    ('SUBMITTED','SCREENING','SHORTLISTED','INTERVIEW_SCHEDULED','INTERVIEWED','HIRED','REJECTED','WITHDRAWN')),
  CONSTRAINT ck_history_version CHECK (aggregate_version >= 0),
  CONSTRAINT ck_history_rejection_reason CHECK (
    to_status <> 'REJECTED' OR (reason IS NOT NULL AND char_length(btrim(reason)) > 0))
);
CREATE INDEX application_history_application_id_created_at_id_idx
  ON application_history(application_id, created_at, id);

CREATE TABLE cv_change_request (
  id uuid PRIMARY KEY,
  application_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  new_cv_id uuid NOT NULL,
  base_cv_version_id uuid NOT NULL,
  application_version_at_request integer NOT NULL,
  status varchar(16) NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES user_account(id) ON DELETE RESTRICT,
  reviewed_at timestamptz,
  reason text,
  cancelled_at timestamptz,
  version integer NOT NULL DEFAULT 0,
  CONSTRAINT fk_cv_change_application_owner FOREIGN KEY (application_id, candidate_id)
    REFERENCES application(id, candidate_id) ON DELETE RESTRICT,
  CONSTRAINT fk_cv_change_new_cv FOREIGN KEY (new_cv_id, candidate_id)
    REFERENCES cv_version(id, candidate_id) ON DELETE RESTRICT,
  CONSTRAINT fk_cv_change_base_cv FOREIGN KEY (base_cv_version_id, candidate_id)
    REFERENCES cv_version(id, candidate_id) ON DELETE RESTRICT,
  CONSTRAINT ck_cv_change_status CHECK (status IN ('PENDING','APPROVED','REJECTED','CANCELLED')),
  CONSTRAINT ck_cv_change_version CHECK (version >= 0 AND application_version_at_request >= 0),
  CONSTRAINT ck_cv_change_decision CHECK (
    (status = 'PENDING' AND reviewed_by IS NULL AND reviewed_at IS NULL AND cancelled_at IS NULL)
    OR (status IN ('APPROVED','REJECTED') AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL AND cancelled_at IS NULL)
    OR (status = 'CANCELLED' AND cancelled_at IS NOT NULL AND reason IS NOT NULL
        AND char_length(btrim(reason)) > 0))
);
CREATE UNIQUE INDEX uq_cv_change_pending ON cv_change_request(application_id) WHERE status = 'PENDING';
CREATE INDEX cv_change_request_application_id_requested_at_id_idx
  ON cv_change_request(application_id, requested_at DESC, id);

CREATE TABLE saved_job (
  candidate_id uuid NOT NULL REFERENCES candidate_profile(user_id) ON DELETE RESTRICT,
  job_id uuid NOT NULL REFERENCES job_post(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (candidate_id, job_id)
);
CREATE INDEX saved_job_candidate_id_created_at_job_id_idx
  ON saved_job(candidate_id, created_at DESC, job_id);

CREATE TABLE idempotency_record (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES user_account(id) ON DELETE RESTRICT,
  operation varchar(80) NOT NULL,
  key varchar(100) NOT NULL,
  request_hash char(64) NOT NULL,
  resource_id uuid,
  status varchar(16) NOT NULL,
  response_code smallint,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  completed_at timestamptz,
  CONSTRAINT uq_idempotency_scope UNIQUE (user_id, operation, key),
  CONSTRAINT ck_idempotency_operation CHECK (char_length(btrim(operation)) > 0),
  CONSTRAINT ck_idempotency_key CHECK (char_length(key) BETWEEN 1 AND 100),
  CONSTRAINT ck_idempotency_hash CHECK (request_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT ck_idempotency_expiry CHECK (expires_at >= created_at + interval '24 hours'),
  CONSTRAINT ck_idempotency_state CHECK (
    (status = 'PROCESSING' AND resource_id IS NULL AND response_code IS NULL AND completed_at IS NULL)
    OR (status = 'COMPLETED' AND resource_id IS NOT NULL
        AND response_code IS NOT NULL AND response_code BETWEEN 200 AND 299
        AND completed_at IS NOT NULL))
);
CREATE INDEX idempotency_record_status_expires_at_idx
  ON idempotency_record(status, expires_at);

CREATE OR REPLACE FUNCTION be2_application_immutable_fields() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.candidate_id IS DISTINCT FROM OLD.candidate_id
     OR NEW.job_id IS DISTINCT FROM OLD.job_id
     OR NEW.original_cv_version_id IS DISTINCT FROM OLD.original_cv_version_id
     OR NEW.candidate_snapshot IS DISTINCT FROM OLD.candidate_snapshot
     OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at THEN
    RAISE EXCEPTION 'application immutable fields cannot change' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER tr_application_immutable_fields BEFORE UPDATE ON application
FOR EACH ROW EXECUTE FUNCTION be2_application_immutable_fields();

CREATE OR REPLACE FUNCTION be2_cv_immutable_object() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'READY' AND
     (NEW.object_key IS DISTINCT FROM OLD.object_key
      OR NEW.storage_version_id IS DISTINCT FROM OLD.storage_version_id
      OR NEW.checksum_sha256 IS DISTINCT FROM OLD.checksum_sha256
      OR NEW.size_bytes IS DISTINCT FROM OLD.size_bytes) THEN
    RAISE EXCEPTION 'READY CV content cannot change' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER tr_cv_immutable_object BEFORE UPDATE ON cv_version
FOR EACH ROW EXECUTE FUNCTION be2_cv_immutable_object();

CREATE OR REPLACE FUNCTION be2_history_append_only() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'application history is append-only' USING ERRCODE = '23514';
END;
$$;
CREATE TRIGGER tr_history_append_only BEFORE UPDATE OR DELETE ON application_history
FOR EACH ROW EXECUTE FUNCTION be2_history_append_only();
