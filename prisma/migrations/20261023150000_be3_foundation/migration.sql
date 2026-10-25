-- BE3 schema: Interview, Evaluation, Outbox, Notification, Email Delivery, Audit
-- Requires btree_gist extension for exclusion constraint on interview_reservation

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1. Interview table (UC03, UC08)
CREATE TABLE interview (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES application(id) ON DELETE RESTRICT,
  created_by uuid NOT NULL REFERENCES user_account(id) ON DELETE RESTRICT,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  status varchar(16) NOT NULL,
  room_key varchar(150) NOT NULL UNIQUE,
  provider_room_id varchar(255),
  cancel_reason text,
  outcome_reason varchar(1000),
  replaces_interview_id uuid REFERENCES interview(id) ON DELETE RESTRICT,
  expires_at timestamptz NOT NULL,
  access_generation integer NOT NULL DEFAULT 0,
  room_access_state varchar(20) NOT NULL DEFAULT 'ACTIVE',
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by uuid REFERENCES user_account(id) ON DELETE RESTRICT,
  version integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_interview_status CHECK (status IN ('PROPOSED', 'CONFIRMED', 'DECLINED', 'EXPIRED', 'CANCELLED', 'COMPLETED', 'NO_SHOW')),
  CONSTRAINT ck_interview_room_access CHECK (room_access_state IN ('ACTIVE', 'REVOKE_PENDING', 'REVOKED')),
  CONSTRAINT ck_interview_duration CHECK (end_at - start_at BETWEEN interval '15 minutes' AND interval '120 minutes'),
  CONSTRAINT ck_interview_version CHECK (version >= 0),
  CONSTRAINT ck_interview_generation CHECK (access_generation >= 0),
  CONSTRAINT ck_interview_cancelled CHECK (
    (status = 'CANCELLED' AND cancelled_at IS NOT NULL AND cancel_reason IS NOT NULL)
    OR (status <> 'CANCELLED')
  ),
  CONSTRAINT ck_interview_completed CHECK (
    (status IN ('COMPLETED', 'NO_SHOW') AND completed_at IS NOT NULL)
    OR (status NOT IN ('COMPLETED', 'NO_SHOW'))
  ),
  CONSTRAINT ck_interview_no_self_replace CHECK (replaces_interview_id IS NULL OR replaces_interview_id <> id)
);

CREATE INDEX interview_application_id_status_idx ON interview(application_id, status);
CREATE INDEX interview_start_at_end_at_idx ON interview(start_at, end_at);
CREATE INDEX interview_replaces_interview_id_idx ON interview(replaces_interview_id);
CREATE UNIQUE INDEX uq_replacement_pending
  ON interview(replaces_interview_id)
  WHERE status = 'PROPOSED' AND replaces_interview_id IS NOT NULL;

-- 2. Interview Participant table (UC08, UC13)
CREATE TABLE interview_participant (
  interview_id uuid NOT NULL REFERENCES interview(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES user_account(id) ON DELETE RESTRICT,
  participant_role varchar(16) NOT NULL,
  response varchar(12) NOT NULL DEFAULT 'PENDING',
  responded_at timestamptz,
  attendance varchar(12) NOT NULL DEFAULT 'UNKNOWN',
  attendance_reason varchar(1000),
  attendance_recorded_by uuid REFERENCES user_account(id) ON DELETE RESTRICT,
  attendance_recorded_at timestamptz,
  version integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (interview_id, user_id),
  CONSTRAINT uq_interview_user_role UNIQUE (interview_id, user_id, participant_role),
  CONSTRAINT ck_participant_role CHECK (participant_role IN ('CANDIDATE', 'INTERVIEWER')),
  CONSTRAINT ck_participant_response CHECK (response IN ('PENDING', 'ACCEPTED', 'DECLINED')),
  CONSTRAINT ck_participant_attendance CHECK (attendance IN ('UNKNOWN', 'ATTENDED', 'ABSENT')),
  CONSTRAINT ck_participant_attendance_absent CHECK (attendance <> 'ABSENT' OR attendance_reason IS NOT NULL),
  CONSTRAINT ck_participant_version CHECK (version >= 0)
);

CREATE INDEX interview_participant_user_id_interview_id_idx ON interview_participant(user_id, interview_id);
CREATE UNIQUE INDEX uq_interview_candidate
  ON interview_participant(interview_id)
  WHERE participant_role = 'CANDIDATE';

-- 3. Interview Reservation table (UC08)
CREATE TABLE interview_reservation (
  interview_id uuid NOT NULL REFERENCES interview(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES user_account(id) ON DELETE RESTRICT,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz,
  release_reason varchar(100),
  PRIMARY KEY (interview_id, user_id),
  CONSTRAINT fk_reservation_participant FOREIGN KEY (interview_id, user_id)
    REFERENCES interview_participant(interview_id, user_id) ON DELETE RESTRICT,
  CONSTRAINT ck_reservation_time CHECK (end_at > start_at),
  CONSTRAINT ck_reservation_release CHECK (released_at IS NULL OR release_reason IS NOT NULL),
  CONSTRAINT ex_user_time EXCLUDE USING gist (
    user_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&
  ) WHERE (released_at IS NULL)
);

CREATE INDEX interview_reservation_user_id_start_at_end_at_idx ON interview_reservation(user_id, start_at, end_at);

-- 4. Evaluation table (UC13)
CREATE TABLE evaluation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL REFERENCES interview(id) ON DELETE RESTRICT,
  interviewer_id uuid NOT NULL,
  participant_role varchar(16) NOT NULL DEFAULT 'INTERVIEWER',
  technical_score smallint NOT NULL,
  communication_score smallint NOT NULL,
  fit_score smallint NOT NULL,
  recommendation varchar(16) NOT NULL,
  internal_note text NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 0,
  CONSTRAINT fk_evaluation_participant FOREIGN KEY (interview_id, interviewer_id, participant_role)
    REFERENCES interview_participant(interview_id, user_id, participant_role) ON DELETE RESTRICT,
  CONSTRAINT uq_evaluation_interview_interviewer UNIQUE (interview_id, interviewer_id),
  CONSTRAINT ck_evaluation_role CHECK (participant_role = 'INTERVIEWER'),
  CONSTRAINT ck_evaluation_scores CHECK (
    technical_score BETWEEN 1 AND 5
    AND communication_score BETWEEN 1 AND 5
    AND fit_score BETWEEN 1 AND 5
  ),
  CONSTRAINT ck_evaluation_recommendation CHECK (recommendation IN ('HIRE', 'HOLD', 'REJECT')),
  CONSTRAINT ck_evaluation_note CHECK (char_length(btrim(internal_note)) BETWEEN 1 AND 5000),
  CONSTRAINT ck_evaluation_version CHECK (version >= 0)
);

CREATE INDEX evaluation_interview_id_submitted_at_idx ON evaluation(interview_id, submitted_at);

-- 5. Outbox Event table (UC15, WORKER-01)
CREATE TABLE outbox_event (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type varchar(40) NOT NULL,
  aggregate_id uuid NOT NULL,
  event_type varchar(60) NOT NULL,
  payload jsonb NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'PENDING',
  attempt_count integer NOT NULL DEFAULT 0,
  next_retry_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  last_error_code varchar(80),
  lease_token uuid,
  schema_version integer NOT NULL DEFAULT 1,
  aggregate_version integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  CONSTRAINT ck_outbox_status CHECK (status IN ('PENDING', 'PROCESSING', 'DONE', 'FAILED')),
  CONSTRAINT ck_outbox_attempt CHECK (attempt_count >= 0),
  CONSTRAINT ck_outbox_schema_version CHECK (schema_version > 0),
  CONSTRAINT ck_outbox_aggregate_version CHECK (aggregate_version >= 0)
);

CREATE INDEX outbox_event_status_next_retry_at_locked_until_idx ON outbox_event(status, next_retry_at, locked_until);
CREATE INDEX outbox_event_aggregate_type_aggregate_id_idx ON outbox_event(aggregate_type, aggregate_id);

-- 6. Notification table (UC15)
CREATE TABLE notification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_account(id) ON DELETE RESTRICT,
  event_id uuid NOT NULL REFERENCES outbox_event(id) ON DELETE RESTRICT,
  title varchar(160) NOT NULL,
  content varchar(1000) NOT NULL,
  target_type varchar(24) NOT NULL,
  target_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  CONSTRAINT uq_notification_user_event UNIQUE (user_id, event_id),
  CONSTRAINT ck_notification_target_type CHECK (target_type IN ('APPLICATION', 'INTERVIEW', 'COMPANY', 'JOB'))
);

CREATE INDEX notification_user_id_read_at_created_at_id_idx ON notification(user_id, read_at, created_at DESC, id);

-- 7. Email Delivery table (UC15, WORKER-01)
CREATE TABLE email_delivery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES outbox_event(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES user_account(id) ON DELETE RESTRICT,
  template_code varchar(60) NOT NULL,
  recipient_email varchar(254) NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'PENDING',
  provider_message_id varchar(255),
  attempt_count integer NOT NULL DEFAULT 0,
  sent_at timestamptz,
  last_error_code varchar(80),
  locked_until timestamptz,
  lease_token uuid,
  next_retry_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_email_delivery_event_user_template UNIQUE (event_id, user_id, template_code),
  CONSTRAINT ck_email_delivery_status CHECK (status IN ('PENDING', 'SENDING', 'SENT', 'FAILED')),
  CONSTRAINT ck_email_delivery_attempt CHECK (attempt_count >= 0)
);

CREATE INDEX email_delivery_status_next_retry_at_locked_until_idx ON email_delivery(status, next_retry_at, locked_until);

-- 8. Audit Log table (UC10)
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES user_account(id) ON DELETE RESTRICT,
  action varchar(60) NOT NULL,
  entity_type varchar(40) NOT NULL,
  entity_id uuid NOT NULL,
  reason varchar(1000),
  trace_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_log_entity_type_entity_id_created_at_idx ON audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX audit_log_actor_id_created_at_idx ON audit_log(actor_id, created_at DESC);
CREATE INDEX audit_log_trace_id_idx ON audit_log(trace_id);

CREATE OR REPLACE FUNCTION audit_log_prevent_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_log_immutable
BEFORE UPDATE OR DELETE ON audit_log
FOR EACH ROW EXECUTE FUNCTION audit_log_prevent_modification();
