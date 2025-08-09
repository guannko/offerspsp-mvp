-- PULSE ENGINE SCHEMA EXTENSION
-- Adds life rhythm capabilities to AI companions
-- Created by: Boris + GPT + Jean Claude collaboration
-- Purpose: Make AI companions truly alive with circadian rhythms

-- Pulse definitions catalog
CREATE TABLE pulse_definitions (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  action_type TEXT NOT NULL, -- notification, call, ar_hint, background_task
  default_importance REAL DEFAULT 0.5, -- 0 to 1
  default_urgency REAL DEFAULT 0.5, -- 0 to 1
  category TEXT, -- health, social, focus, memory, routine
  payload JSONB, -- template for action
  conditions JSONB, -- when this pulse can trigger
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-specific pulse schedules
CREATE TABLE pulse_schedules (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  companion_id UUID NOT NULL,
  pulse_definition_id BIGINT REFERENCES pulse_definitions(id),
  enabled BOOLEAN DEFAULT TRUE,
  frequency TEXT, -- daily, weekly, hourly, adaptive
  time_windows JSONB, -- [{start: "08:00", end: "09:00", days: [1,2,3,4,5]}]
  priority INT DEFAULT 5, -- 1-10
  last_triggered TIMESTAMPTZ,
  next_scheduled TIMESTAMPTZ,
  custom_conditions JSONB, -- user-specific triggers
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, companion_id, pulse_definition_id)
);

CREATE INDEX idx_pulse_schedules_next ON pulse_schedules (next_scheduled) 
  WHERE enabled = TRUE;

-- Pulse execution logs
CREATE TABLE pulse_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  companion_id UUID NOT NULL,
  pulse_definition_id BIGINT REFERENCES pulse_definitions(id),
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  delivery_channel TEXT, -- notification, call, message, ar
  context_snapshot JSONB, -- time, location, health, battery, etc
  score REAL, -- calculated importance score
  user_reaction TEXT, -- accepted, dismissed, snoozed, disabled
  reaction_time_ms INT, -- how quickly user reacted
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pulse_logs_user_time ON pulse_logs (user_id, companion_id, triggered_at DESC);
CREATE INDEX idx_pulse_logs_reaction ON pulse_logs (user_reaction) 
  WHERE user_reaction IS NOT NULL;

-- Quiet windows (do not disturb periods)
CREATE TABLE quiet_windows (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  companion_id UUID NOT NULL,
  name TEXT, -- "Sleep", "Work", "Family time"
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  days_of_week INT[], -- 0=Sunday, 6=Saturday
  allow_critical BOOLEAN DEFAULT TRUE, -- allow emergency pulses
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, companion_id, name)
);

-- User pulse preferences
CREATE TABLE pulse_preferences (
  user_id UUID NOT NULL,
  companion_id UUID NOT NULL,
  mode TEXT DEFAULT 'standard', -- quiet, standard, proactive
  daily_pulse_limit INT DEFAULT 20,
  min_interval_minutes INT DEFAULT 30,
  health_integration BOOLEAN DEFAULT FALSE,
  location_integration BOOLEAN DEFAULT FALSE,
  calendar_integration BOOLEAN DEFAULT FALSE,
  learning_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(user_id, companion_id)
);

-- Bio signals cache (optional, for health integration)
CREATE TABLE bio_signals_cache (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  source TEXT NOT NULL, -- apple_health, google_fit, fitbit
  signal_type TEXT NOT NULL, -- steps, heart_rate, sleep, activity
  value JSONB NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, source, signal_type, recorded_at)
);

CREATE INDEX idx_bio_signals_user_time ON bio_signals_cache (user_id, recorded_at DESC);

-- Pulse learning data
CREATE TABLE pulse_learning (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  companion_id UUID NOT NULL,
  pulse_definition_id BIGINT REFERENCES pulse_definitions(id),
  success_rate REAL DEFAULT 0.5, -- 0 to 1
  avg_reaction_time_ms INT,
  total_delivered INT DEFAULT 0,
  total_accepted INT DEFAULT 0,
  total_dismissed INT DEFAULT 0,
  optimal_times TIME[], -- learned best times to deliver
  optimal_contexts JSONB, -- learned best contexts
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, companion_id, pulse_definition_id)
);

-- Functions for pulse management

-- Calculate pulse score
CREATE OR REPLACE FUNCTION calculate_pulse_score(
  p_pulse_id BIGINT,
  p_user_id UUID,
  p_companion_id UUID,
  p_context JSONB
) RETURNS REAL AS $$
DECLARE
  v_score REAL := 0;
  v_time_fit REAL;
  v_context_fit REAL;
  v_burnout_risk REAL;
  v_quiet_penalty REAL;
BEGIN
  -- Time fitness (simplified)
  v_time_fit := CASE 
    WHEN EXTRACT(HOUR FROM NOW()) BETWEEN 7 AND 22 THEN 0.8
    WHEN EXTRACT(HOUR FROM NOW()) BETWEEN 6 AND 7 THEN 0.5
    WHEN EXTRACT(HOUR FROM NOW()) BETWEEN 22 AND 23 THEN 0.3
    ELSE 0.1 -- Night time
  END;
  
  -- Context fitness (check battery, network, etc)
  v_context_fit := CASE
    WHEN (p_context->>'battery_level')::INT > 20 THEN 0.7
    ELSE 0.3
  END;
  
  -- Burnout risk (check recent pulse frequency)
  SELECT COUNT(*) / 10.0 INTO v_burnout_risk
  FROM pulse_logs
  WHERE user_id = p_user_id 
    AND companion_id = p_companion_id
    AND triggered_at > NOW() - INTERVAL '1 hour';
  
  v_burnout_risk := LEAST(1.0, v_burnout_risk);
  
  -- Quiet window penalty
  SELECT CASE WHEN COUNT(*) > 0 THEN 0.9 ELSE 0 END INTO v_quiet_penalty
  FROM quiet_windows
  WHERE user_id = p_user_id
    AND companion_id = p_companion_id
    AND EXTRACT(HOUR FROM NOW())::INT BETWEEN 
        EXTRACT(HOUR FROM start_time)::INT AND 
        EXTRACT(HOUR FROM end_time)::INT;
  
  -- Calculate final score
  v_score := (v_time_fit * 0.3 + v_context_fit * 0.3) * (1 - v_burnout_risk * 0.5) * (1 - v_quiet_penalty);
  
  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Night mode check (22:30 - 06:30)
CREATE OR REPLACE FUNCTION is_night_mode() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXTRACT(HOUR FROM NOW()) >= 22.5 OR EXTRACT(HOUR FROM NOW()) < 6.5;
END;
$$ LANGUAGE plpgsql;

-- Get next pulse candidates
CREATE OR REPLACE FUNCTION get_pulse_candidates(
  p_user_id UUID,
  p_companion_id UUID,
  p_limit INT DEFAULT 5
) RETURNS TABLE(
  pulse_id BIGINT,
  pulse_name TEXT,
  score REAL,
  action_type TEXT,
  payload JSONB
) AS $$
BEGIN
  -- Skip most pulses during night mode
  IF is_night_mode() THEN
    RETURN QUERY
    SELECT 
      pd.id,
      pd.name,
      0.1::REAL as score, -- Low score for night
      pd.action_type,
      pd.payload
    FROM pulse_definitions pd
    WHERE pd.category = 'critical' -- Only critical pulses at night
    LIMIT 1;
  ELSE
    RETURN QUERY
    SELECT 
      pd.id,
      pd.name,
      calculate_pulse_score(pd.id, p_user_id, p_companion_id, '{}'::JSONB) as score,
      pd.action_type,
      pd.payload
    FROM pulse_definitions pd
    JOIN pulse_schedules ps ON pd.id = ps.pulse_definition_id
    WHERE ps.user_id = p_user_id
      AND ps.companion_id = p_companion_id
      AND ps.enabled = TRUE
      AND (ps.next_scheduled IS NULL OR ps.next_scheduled <= NOW())
    ORDER BY score DESC
    LIMIT p_limit;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Initial pulse definitions (seed data)
INSERT INTO pulse_definitions (name, action_type, category, payload) VALUES
  ('morning_greeting', 'notification', 'routine', '{"message": "Good morning! Ready for a great day?"}'),
  ('hydration_reminder', 'notification', 'health', '{"message": "Time for a glass of water! 💧"}'),
  ('stretch_break', 'notification', 'health', '{"message": "Quick stretch break - 30 seconds!"}'),
  ('focus_session', 'notification', 'focus', '{"message": "Ready for a 25-min focus session?"}'),
  ('social_check', 'call', 'social', '{"message": "Want to call mom? Its been 7 days"}'),
  ('evening_wind_down', 'notification', 'routine', '{"message": "Time to wind down. How was your day?"}'),
  ('sleep_preparation', 'notification', 'health', '{"message": "Preparing for sleep mode. Sweet dreams soon!"}');

-- Default quiet window (night mode)
INSERT INTO quiet_windows (user_id, companion_id, name, start_time, end_time, days_of_week) 
VALUES 
  ('00000000-0000-0000-0000-000000000000', -- default for all users
   '00000000-0000-0000-0000-000000000000',
   'Night Mode',
   '22:30:00',
   '06:30:00',
   ARRAY[0,1,2,3,4,5,6]); -- All days

-- Grant permissions
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO cerebellum_app;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO cerebellum_app;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO cerebellum_app;