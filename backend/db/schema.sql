-- CEREBELLUM: Active Memory System for AI Companions
-- Version: 1.0
-- Created by: Jean Claude + GPT collaboration
-- Purpose: Enable true memory evolution for AI personalities

-- Enable pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main events table - captures all interactions
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  companion_id UUID NOT NULL,
  ts TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL, -- message, call, action, emotion, location
  text TEXT,
  entities JSONB, -- extracted entities: people, places, times
  sentiment REAL, -- -1 to 1
  emotion JSONB, -- {joy: 0.8, surprise: 0.3}
  location JSONB, -- {lat, lng, place_name}
  salience REAL DEFAULT 0, -- importance score
  embedding VECTOR(1536), -- for semantic search
  metadata JSONB -- additional context
);

CREATE INDEX idx_events_user_ts ON events (user_id, ts DESC);
CREATE INDEX idx_events_companion ON events (companion_id, ts DESC);
CREATE INDEX idx_events_embedding ON events USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_events_salience ON events (salience DESC) WHERE salience > 0.5;

-- Semantic facts - extracted knowledge
CREATE TABLE facts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  companion_id UUID NOT NULL,
  key TEXT NOT NULL, -- preference.coffee, routine.morning, etc
  value TEXT NOT NULL,
  confidence REAL DEFAULT 0.5, -- 0 to 1
  scope TEXT DEFAULT 'personal', -- personal, shared, global
  source_events BIGINT[], -- event IDs that support this fact
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- for temporary facts
  UNIQUE(user_id, companion_id, key)
);

CREATE INDEX idx_facts_user_companion ON facts (user_id, companion_id);
CREATE INDEX idx_facts_key ON facts (key);

-- Emotional DNA - personality evolution
CREATE TABLE emotional_dna (
  id BIGSERIAL PRIMARY KEY,
  companion_id UUID NOT NULL UNIQUE,
  happiness_triggers TEXT[] DEFAULT '{}',
  stress_patterns TEXT[] DEFAULT '{}',
  comfort_zones JSONB DEFAULT '[]', -- [{place, sentiment}]
  growth_edges TEXT[] DEFAULT '{}',
  emotional_baseline JSONB, -- {joy: 0.5, energy: 0.7, ...}
  personality_vector VECTOR(512), -- compressed personality embedding
  last_evolution TIMESTAMPTZ DEFAULT NOW()
);

-- Relationships memory
CREATE TABLE relationships (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  companion_id UUID NOT NULL,
  peer_name TEXT NOT NULL, -- name of other person/AI
  peer_type TEXT DEFAULT 'human', -- human, ai, group
  trust_level INT DEFAULT 50, -- 0-100
  shared_moments INT DEFAULT 0,
  inside_jokes JSONB DEFAULT '[]',
  important_dates JSONB DEFAULT '[]', -- birthdays, anniversaries
  conversation_style TEXT, -- formal, casual, playful
  last_interaction TIMESTAMPTZ,
  last_deep_talk TIMESTAMPTZ,
  metadata JSONB,
  UNIQUE(user_id, companion_id, peer_name)
);

CREATE INDEX idx_relationships_user_companion ON relationships (user_id, companion_id);
CREATE INDEX idx_relationships_trust ON relationships (trust_level DESC);

-- Skills and XP system
CREATE TABLE skills_xp (
  user_id UUID NOT NULL,
  companion_id UUID NOT NULL,
  skill TEXT NOT NULL, -- humor, empathy, planning, memory, proactive
  xp INT DEFAULT 0,
  level INT DEFAULT 1,
  unlocked_features TEXT[] DEFAULT '{}',
  last_xp_gain TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(user_id, companion_id, skill)
);

CREATE INDEX idx_skills_level ON skills_xp (level DESC);

-- Daily summaries - Diamond processed
CREATE TABLE daily_summaries (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  companion_id UUID NOT NULL,
  date DATE NOT NULL,
  summary_text TEXT,
  key_moments JSONB, -- [{time, event, emotion, importance}]
  emotional_arc JSONB, -- emotion flow through the day
  learned_facts TEXT[], -- new facts discovered
  relationship_updates JSONB, -- changes in relationships
  compressed_size INT, -- bytes after diamond processing
  original_size INT, -- bytes before compression
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, companion_id, date)
);

CREATE INDEX idx_summaries_date ON daily_summaries (date DESC);

-- Goals and plans
CREATE TABLE goals (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  companion_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'personal', -- personal, shared, reminder
  status TEXT DEFAULT 'active', -- active, paused, completed, failed
  priority INT DEFAULT 5, -- 1-10
  deadline TIMESTAMPTZ,
  progress REAL DEFAULT 0, -- 0-100%
  milestones JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_goals_status ON goals (status) WHERE status = 'active';
CREATE INDEX idx_goals_deadline ON goals (deadline) WHERE deadline IS NOT NULL;

-- AI to AI communication bridge
CREATE TABLE ai_bridge_messages (
  id BIGSERIAL PRIMARY KEY,
  from_companion_id UUID NOT NULL,
  to_companion_id UUID NOT NULL,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  message_type TEXT NOT NULL, -- relay, reminder, check_in, coordinate
  content TEXT NOT NULL,
  context JSONB, -- additional context for the message
  delivered BOOLEAN DEFAULT FALSE,
  delivered_at TIMESTAMPTZ,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bridge_undelivered ON ai_bridge_messages (delivered) WHERE delivered = FALSE;
CREATE INDEX idx_bridge_to ON ai_bridge_messages (to_companion_id, created_at DESC);

-- Memory decay tracking
CREATE TABLE memory_decay (
  event_id BIGINT PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  initial_salience REAL NOT NULL,
  current_salience REAL NOT NULL,
  decay_rate REAL DEFAULT 0.1, -- per day
  last_accessed TIMESTAMPTZ,
  access_count INT DEFAULT 0,
  pinned BOOLEAN DEFAULT FALSE, -- prevents decay
  decay_started_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_decay_current ON memory_decay (current_salience DESC) WHERE pinned = FALSE;

-- Companion personality traits
CREATE TABLE personality_traits (
  companion_id UUID PRIMARY KEY,
  archetype TEXT DEFAULT 'friendly', -- friendly, professional, playful, caring
  communication_style JSONB, -- {formality: 0.3, humor: 0.7, ...}
  response_patterns JSONB, -- common phrases and patterns
  voice_characteristics JSONB, -- for voice synthesis settings
  visual_appearance JSONB, -- avatar customization
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences for companions
CREATE TABLE user_companion_settings (
  user_id UUID NOT NULL,
  companion_id UUID NOT NULL,
  nickname TEXT,
  notification_preferences JSONB,
  privacy_level TEXT DEFAULT 'normal', -- minimal, normal, full
  memory_retention_days INT DEFAULT 90,
  allow_proactive BOOLEAN DEFAULT TRUE,
  allow_ai_bridge BOOLEAN DEFAULT TRUE,
  custom_wake_words TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(user_id, companion_id)
);

-- Analytics for improvement
CREATE TABLE interaction_analytics (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  companion_id UUID NOT NULL,
  date DATE NOT NULL,
  message_count INT DEFAULT 0,
  call_minutes INT DEFAULT 0,
  user_satisfaction REAL, -- derived from sentiment
  companion_helpfulness REAL, -- derived from XP gains
  features_used TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, companion_id, date)
);

-- Functions for memory operations

-- Calculate salience score
CREATE OR REPLACE FUNCTION calculate_salience(
  p_sentiment REAL,
  p_emotion JSONB,
  p_entities JSONB,
  p_text_length INT
) RETURNS REAL AS $$
BEGIN
  RETURN (
    ABS(p_sentiment) * 0.3 +  -- emotional intensity
    COALESCE((p_emotion->>'joy')::REAL, 0) * 0.2 +
    COALESCE((p_emotion->>'surprise')::REAL, 0) * 0.2 +
    CASE WHEN p_entities IS NOT NULL THEN 0.2 ELSE 0 END + -- has entities
    CASE WHEN p_text_length > 100 THEN 0.1 ELSE 0 END -- substantial content
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger to update salience on insert
CREATE OR REPLACE FUNCTION update_event_salience() RETURNS TRIGGER AS $$
BEGIN
  NEW.salience = calculate_salience(
    NEW.sentiment,
    NEW.emotion,
    NEW.entities,
    LENGTH(NEW.text)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_salience
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_event_salience();

-- Diamond processing function placeholder
CREATE OR REPLACE FUNCTION diamond_compress(
  p_user_id UUID,
  p_companion_id UUID,
  p_date DATE
) RETURNS VOID AS $$
BEGIN
  -- This will be implemented in application code
  -- Placeholder for database-level compression logic
  RAISE NOTICE 'Diamond compression for user % companion % on date %', 
    p_user_id, p_companion_id, p_date;
END;
$$ LANGUAGE plpgsql;

-- Memory retrieval function
CREATE OR REPLACE FUNCTION retrieve_memory(
  p_user_id UUID,
  p_companion_id UUID,
  p_context TEXT DEFAULT 'general',
  p_limit INT DEFAULT 10
) RETURNS TABLE(
  event_id BIGINT,
  text TEXT,
  ts TIMESTAMPTZ,
  salience REAL,
  relevance_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.text,
    e.ts,
    e.salience,
    (
      e.salience * 0.4 + -- importance
      EXTRACT(EPOCH FROM (NOW() - e.ts)) / -86400.0 * 0.3 + -- recency
      CASE WHEN e.type = p_context THEN 0.3 ELSE 0 END -- context match
    ) as relevance_score
  FROM events e
  WHERE e.user_id = p_user_id 
    AND e.companion_id = p_companion_id
  ORDER BY relevance_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant appropriate permissions (adjust as needed)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO cerebellum_app;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO cerebellum_app;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO cerebellum_app;

-- Initial seed data will be added in seeds.sql