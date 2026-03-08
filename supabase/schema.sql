-- PayPeriod Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── User Profiles ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_profiles (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  pay_frequency    TEXT NOT NULL CHECK (pay_frequency IN ('bi-weekly', 'weekly', 'semi-monthly', 'monthly')),
  anchor_pay_date  DATE NOT NULL,
  income_per_period DECIMAL(10,2) NOT NULL DEFAULT 0,
  side_income      DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Bills ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bills (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL CHECK (char_length(name) <= 40),
  amount      DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  due_day     INTEGER CHECK (due_day BETWEEN 1 AND 28),
  frequency   TEXT NOT NULL CHECK (frequency IN ('monthly', 'bi-weekly', 'weekly', 'semi-monthly')),
  category    TEXT NOT NULL CHECK (category IN (
    'housing', 'utilities', 'auto', 'insurance', 'subscriptions',
    'health', 'taxes', 'discretionary', 'debt', 'family', 'other'
  )),
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Extra Items ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS extra_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  period_index INTEGER NOT NULL,
  amount       DECIMAL(10,2) NOT NULL,
  note         TEXT CHECK (char_length(note) <= 100),
  category     TEXT CHECK (category IN (
    'housing', 'utilities', 'auto', 'insurance', 'subscriptions',
    'health', 'taxes', 'discretionary', 'debt', 'family', 'other'
  )),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Row-Level Security (RLS) ─────────────────────────────────────────────────

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE extra_items ENABLE ROW LEVEL SECURITY;

-- User profiles: users can only see/edit their own profile
CREATE POLICY "users_own_profile" ON user_profiles
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Bills: users can only see/edit their own bills
CREATE POLICY "users_own_bills" ON bills
  USING (user_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()));

-- Extra items: users can only see/edit their own extra items
CREATE POLICY "users_own_extras" ON extra_items
  USING (user_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()));

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_user_id ON user_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_user_status ON bills(user_id, status);
CREATE INDEX IF NOT EXISTS idx_extra_items_user_id ON extra_items(user_id);
CREATE INDEX IF NOT EXISTS idx_extra_items_period ON extra_items(user_id, period_index);
