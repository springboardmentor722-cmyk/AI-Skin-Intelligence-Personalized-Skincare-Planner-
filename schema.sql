-- =========================================================================
-- AI Skin Intelligence & Personalized Skincare Planner
-- PostgreSQL schema — matches backend/models/*.py exactly (Milestone 1)
--
-- USE THIS IF: your database has leftover/incompatible tables (e.g. a
-- "users" table with an integer id from an earlier run) and you want to
-- rebuild cleanly with the correct UUID-based schema.
--
-- Recommended usage:
--   1. Drop and recreate the database (safest — wipes anything stale):
--        DROP DATABASE IF EXISTS ai_skin_intelligence;
--        CREATE DATABASE ai_skin_intelligence;
--   2. Connect to it and run this whole file:
--        psql -U postgres -d ai_skin_intelligence -f schema.sql
--   3. Start the backend as usual — `python main.py`. SQLAlchemy's
--      create_all() is a no-op for tables that already exist, and
--      seed.py will insert demo accounts since the roles/users below
--      are pre-seeded with matching data.
--
-- If you don't want to run this file manually at all, you can skip it:
-- dropping and recreating an EMPTY database and just running
-- `python main.py` is enough, since init_db() creates every table for you.
-- This file exists for people who want an explicit, reviewable schema.
-- =========================================================================

-- PostgreSQL 13+ ships gen_random_uuid() in core. If you're on an older
-- version, uncomment the line below instead:
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================================
-- MIGRATING AN EXISTING DATABASE (no need to drop everything)
--
-- Adding Milestone 2 only? Run just the "skin_assessments" and
-- "skincare_routines" CREATE TABLE statements below (search for those
-- two headers) — no need to touch roles/users/skin_profiles/etc.
--
-- Adding Milestone 3 only (bookings, products, orders)? Run the six
-- CREATE TABLE statements for consultant_assignments,
-- dermatologist_appointments, products, product_recommendations, orders,
-- and order_items — everything else is untouched.
--
-- Adding skin photo uploads only?
--   ALTER TABLE skin_profiles ADD COLUMN IF NOT EXISTS skin_photo_url VARCHAR(255);
--
-- NOTE: this file only covers PostgreSQL. Milestone 2 also uses MongoDB
-- for the routine_logs collection, which needs no manual schema setup —
-- core/mongodb.py creates its one index automatically at app startup.
--
-- Everything below rebuilds the full schema from scratch and is only
-- needed if your database is in a broken/inconsistent state.
-- =========================================================================

BEGIN;

-- Drop in dependency order so this script is safely re-runnable.
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS progress_photos CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS product_recommendations CASCADE;
DROP TABLE IF EXISTS product_ingredients CASCADE;
DROP TABLE IF EXISTS ingredient_conflicts CASCADE;
DROP TABLE IF EXISTS ingredients CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS dermatologist_appointments CASCADE;
DROP TABLE IF EXISTS consultant_assignments CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS skincare_routines CASCADE;
DROP TABLE IF EXISTS skin_assessments CASCADE;
DROP TABLE IF EXISTS lifestyle_logs CASCADE;
DROP TABLE IF EXISTS skin_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- =========================================================================
-- roles  (models/role.py)
-- =========================================================================
CREATE TABLE roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50)  NOT NULL,
    description VARCHAR(255),
    CONSTRAINT uq_roles_name UNIQUE (name)
);

CREATE INDEX ix_roles_name ON roles (name);

-- =========================================================================
-- users  (models/user.py)
-- =========================================================================
CREATE TABLE users (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name          VARCHAR(150) NOT NULL,
    email              VARCHAR(150) NOT NULL,
    phone_number       VARCHAR(20)  NOT NULL,
    hashed_password    VARCHAR(255) NOT NULL,

    gender             VARCHAR(20),
    age                INTEGER,
    address            VARCHAR(255),
    city               VARCHAR(100),
    state              VARCHAR(100),
    country            VARCHAR(100),
    profile_photo_url  VARCHAR(255),

    role_id            UUID NOT NULL REFERENCES roles (id),

    terms_accepted     BOOLEAN NOT NULL DEFAULT FALSE,
    is_active          BOOLEAN NOT NULL DEFAULT TRUE,
    is_deleted         BOOLEAN NOT NULL DEFAULT FALSE,

    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE INDEX ix_users_email   ON users (email);
CREATE INDEX ix_users_role_id ON users (role_id);

-- =========================================================================
-- skin_profiles  (models/skin_profile.py) — one-to-one with users
-- =========================================================================
CREATE TABLE skin_profiles (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL REFERENCES users (id),

    skin_type             VARCHAR(50),   -- Normal, Dry, Oily, Combination, Sensitive
    skin_concerns         VARCHAR(255),
    allergies             VARCHAR(255),
    sensitivity_level     VARCHAR(50),
    current_products      VARCHAR(255),
    hydration_level       VARCHAR(50),
    water_intake_liters   DOUBLE PRECISION,
    sun_exposure          VARCHAR(50),
    occupation            VARCHAR(100),
    environment           VARCHAR(100),
    skin_photo_url        VARCHAR(255),  -- served from /uploads/skin_photos/{user_id}/{file}

    is_deleted            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_skin_profiles_user_id UNIQUE (user_id)
);

CREATE INDEX ix_skin_profiles_user_id ON skin_profiles (user_id);

-- =========================================================================
-- lifestyle_logs  (models/lifestyle.py) — many-per-user, time-stamped
-- =========================================================================
CREATE TABLE lifestyle_logs (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                   UUID NOT NULL REFERENCES users (id),

    sleep_hours               DOUBLE PRECISION,
    water_intake_liters       DOUBLE PRECISION,
    exercise_minutes          INTEGER,
    stress_level              VARCHAR(50),   -- Low, Moderate, High
    smoking                   BOOLEAN NOT NULL DEFAULT FALSE,
    alcohol                   BOOLEAN NOT NULL DEFAULT FALSE,
    diet_quality              VARCHAR(50),
    outdoor_exposure_hours    DOUBLE PRECISION,
    screen_time_hours         DOUBLE PRECISION,

    is_deleted                BOOLEAN NOT NULL DEFAULT FALSE,
    logged_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_lifestyle_logs_user_id ON lifestyle_logs (user_id);

-- =========================================================================
-- skin_assessments  (models/assessment.py) — Milestone 2
-- One historical snapshot every time the scoring engine runs.
-- =========================================================================
CREATE TABLE skin_assessments (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                UUID NOT NULL REFERENCES users (id),

    -- Required by the Milestone 2 spec
    overall_score          DOUBLE PRECISION NOT NULL,
    detected_concerns      JSONB NOT NULL DEFAULT '[]',   -- [{"name": "Acne", "severity": "High", ...}]
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Additions beyond the minimal spec: the per-component breakdown, so
    -- the frontend score dashboard doesn't need to recompute history.
    primary_concern        VARCHAR(100),
    skin_condition_score   DOUBLE PRECISION,   -- S_cond   (35%)
    lifestyle_score        DOUBLE PRECISION,   -- L_habits (20%)
    sleep_score            DOUBLE PRECISION,   -- S_sleep  (15%)
    consistency_score      DOUBLE PRECISION,   -- R_consist (20%)
    hydration_score        DOUBLE PRECISION,   -- H_hydro  (10%)
    skin_type              VARCHAR(50),
    is_highly_sensitive    BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX ix_skin_assessments_user_id ON skin_assessments (user_id);
CREATE INDEX ix_skin_assessments_created_at ON skin_assessments (created_at);

-- =========================================================================
-- skincare_routines  (models/routine.py) — Milestone 2
-- One row per generated step. Regenerating deactivates old rows rather
-- than deleting them, so routine history is preserved.
-- =========================================================================
CREATE TABLE skincare_routines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users (id),
    assessment_id   UUID NOT NULL REFERENCES skin_assessments (id),

    time_of_day     VARCHAR(10) NOT NULL,   -- AM, PM, or Weekly
    step_number     INTEGER NOT NULL,
    step_category   VARCHAR(50) NOT NULL,   -- Cleansing, Treatment, Moisturizing, Sun Protection, ...
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    -- Milestone 3: provider routine overwrite ("Prescription/Routine Overwrite Form")
    source          VARCHAR(20) NOT NULL DEFAULT 'auto',  -- 'auto' (decision matrix) or 'provider'
    set_by_id       UUID REFERENCES users (id),            -- consultant/dermatologist, if source='provider'
    note            VARCHAR(300),

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_skincare_routines_user_id ON skincare_routines (user_id);
CREATE INDEX ix_skincare_routines_assessment_id ON skincare_routines (assessment_id);
CREATE INDEX ix_skincare_routines_active ON skincare_routines (user_id, is_active);

-- =========================================================================
-- sessions  (models/audit.py — Session class)
-- =========================================================================
CREATE TABLE sessions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users (id),
    remember_me   BOOLEAN NOT NULL DEFAULT FALSE,
    ip_address    VARCHAR(64),
    user_agent    VARCHAR(255),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at    TIMESTAMPTZ,
    is_revoked    BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX ix_sessions_user_id ON sessions (user_id);

-- =========================================================================
-- audit_logs  (models/audit.py — AuditLog class)
-- =========================================================================
CREATE TABLE audit_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID REFERENCES users (id),   -- nullable: system-level events
    action       VARCHAR(100) NOT NULL,
    details      VARCHAR(500),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_audit_logs_user_id ON audit_logs (user_id);

-- =========================================================================
-- consultant_assignments  (models/booking.py) — Milestone 3
-- An ongoing relationship (no schedule) — the user picks a consultant and
-- it starts immediately as "Active".
-- =========================================================================
CREATE TABLE consultant_assignments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultant_id   UUID NOT NULL REFERENCES users (id),
    client_id       UUID NOT NULL REFERENCES users (id),

    status          VARCHAR(20) NOT NULL DEFAULT 'Active',   -- Active, Completed, Cancelled
    message         VARCHAR(500),

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_consultant_assignments_consultant_id ON consultant_assignments (consultant_id);
CREATE INDEX ix_consultant_assignments_client_id ON consultant_assignments (client_id);

-- =========================================================================
-- dermatologist_appointments  (models/booking.py) — Milestone 3
-- A scheduled, one-off visit with a status workflow (Pending -> Confirmed
-- -> Completed, or Cancelled).
-- =========================================================================
CREATE TABLE dermatologist_appointments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dermatologist_id    UUID NOT NULL REFERENCES users (id),
    patient_id          UUID NOT NULL REFERENCES users (id),

    appointment_date    DATE NOT NULL,
    appointment_time    VARCHAR(10) NOT NULL,   -- "HH:MM", 24h
    reason              VARCHAR(255),
    status              VARCHAR(20) NOT NULL DEFAULT 'Pending',  -- Pending, Confirmed, Completed, Cancelled

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_dermatologist_appointments_dermatologist_id ON dermatologist_appointments (dermatologist_id);
CREATE INDEX ix_dermatologist_appointments_patient_id ON dermatologist_appointments (patient_id);

-- =========================================================================
-- products  (models/product.py) — Milestone 3
-- Real, named skincare products. Product photography is intentionally NOT
-- stored here — the frontend renders a generated category icon instead of
-- scraped brand imagery (see ProductImage.jsx).
-- =========================================================================
CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(150) NOT NULL,
    brand           VARCHAR(100) NOT NULL,
    category        VARCHAR(50) NOT NULL,     -- Cleanser, Serum, Moisturizer, Sunscreen, Toner, Mask, Treatment
    description     VARCHAR(500),

    price           NUMERIC(10, 2) NOT NULL,
    currency        VARCHAR(10) NOT NULL DEFAULT 'INR',
    rating          NUMERIC(2, 1) NOT NULL DEFAULT 4.0,
    review_count    INTEGER NOT NULL DEFAULT 0,

    -- Milestone 3: Recommendation Engine inputs
    concern_tags     JSONB NOT NULL DEFAULT '[]',   -- e.g. ["Acne", "Oiliness"]
    skin_type_tags   JSONB NOT NULL DEFAULT '[]',   -- e.g. ["Oily", "Combination"]

    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_products_category ON products (category);

-- =========================================================================
-- product_recommendations  (models/product.py) — Milestone 3
-- A consultant recommending a specific product to a specific client.
-- =========================================================================
CREATE TABLE product_recommendations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultant_id   UUID NOT NULL REFERENCES users (id),
    client_id       UUID NOT NULL REFERENCES users (id),
    product_id      UUID NOT NULL REFERENCES products (id),

    note            VARCHAR(300),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_product_recommendations_client_id ON product_recommendations (client_id);
CREATE INDEX ix_product_recommendations_consultant_id ON product_recommendations (consultant_id);

-- =========================================================================
-- ingredients  (models/ingredient.py) — Milestone 3, Step 1
-- Knowledge base entry per CATEGORY (Retinoid, AHA/BHA, Vitamin C, ...).
-- `aliases` doubles as the allergy-alias list for the matching engine.
-- =========================================================================
CREATE TABLE ingredients (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              VARCHAR(100) NOT NULL,
    category          VARCHAR(50) NOT NULL,
    aliases           JSONB NOT NULL DEFAULT '[]',
    irritation_risk   VARCHAR(20) NOT NULL DEFAULT 'Low',   -- Low, Medium, High
    description       VARCHAR(300),

    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_ingredients_name UNIQUE (name)
);

CREATE INDEX ix_ingredients_category ON ingredients (category);

-- Many-to-many: which ingredients are in which products.
CREATE TABLE product_ingredients (
    product_id     UUID NOT NULL REFERENCES products (id),
    ingredient_id   UUID NOT NULL REFERENCES ingredients (id),
    PRIMARY KEY (product_id, ingredient_id)
);

-- =========================================================================
-- ingredient_conflicts  (models/ingredient.py) — Milestone 3, Step 1
-- The Chemical Conflict Matrix: category pairs unsafe/risky in the same
-- routine step. Checked in both orderings at lookup time.
-- =========================================================================
CREATE TABLE ingredient_conflicts (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_a    VARCHAR(50) NOT NULL,
    category_b    VARCHAR(50) NOT NULL,
    severity      VARCHAR(20) NOT NULL DEFAULT 'Warning',  -- Warning, Unsafe
    reason        VARCHAR(300) NOT NULL
);

-- =========================================================================
-- orders / order_items  (models/product.py) — Milestone 3
-- Mock checkout — no real payment gateway integration.
-- =========================================================================
CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users (id),

    total_amount    NUMERIC(10, 2) NOT NULL,
    currency        VARCHAR(10) NOT NULL DEFAULT 'INR',
    status          VARCHAR(20) NOT NULL DEFAULT 'Placed',  -- Placed, Shipped, Delivered, Cancelled

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_orders_user_id ON orders (user_id);

CREATE TABLE order_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders (id),
    product_id      UUID NOT NULL REFERENCES products (id),

    quantity        INTEGER NOT NULL DEFAULT 1,
    unit_price      NUMERIC(10, 2) NOT NULL
);

CREATE INDEX ix_order_items_order_id ON order_items (order_id);

-- =========================================================================
-- progress_photos  (models/progress_photo.py) — Milestone 3, Step 3
-- Append-only timeline of dated, tagged photos for before/after
-- comparison. Separate from skin_profiles.skin_photo_url (the single
-- "current" profile photo). Stored on local disk for now — see README
-- for the swap-over notes once AWS S3 / Azure Blob credentials exist.
-- =========================================================================
CREATE TABLE progress_photos (
    id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                         UUID NOT NULL REFERENCES users (id),

    photo_url                       VARCHAR(255) NOT NULL,
    tag                             VARCHAR(50),              -- "Baseline", "Week 4", or custom
    skin_health_score_at_upload     DOUBLE PRECISION,

    uploaded_at                     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_progress_photos_user_id ON progress_photos (user_id);

-- =========================================================================
-- notifications  (models/notification.py) — Notification & Reminder System
-- Two kinds of rows: event-triggered (created immediately by controllers
-- when something happens) and contextual reminders (generated on demand
-- by POST /api/v1/notifications/generate, deduplicated per user/day via
-- `dedupe_key` so refreshing the dashboard doesn't spam duplicates).
-- =========================================================================
CREATE TABLE notifications (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users (id),

    type           VARCHAR(30) NOT NULL,    -- routine_reminder, hydration_reminder, sleep_reminder,
                                             -- progress_alert, product_replenishment, recommendation,
                                             -- referral, appointment_update, routine_updated, platform
    title          VARCHAR(150) NOT NULL,
    message        VARCHAR(500) NOT NULL,
    link_to        VARCHAR(100),            -- frontend route to deep-link to, e.g. "/planner"
    dedupe_key     VARCHAR(150),            -- one reminder per user/kind/day

    is_read        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_notifications_user_id ON notifications (user_id);
CREATE INDEX ix_notifications_dedupe_key ON notifications (dedupe_key);

-- =========================================================================
-- Seed data — matches backend/utils/constants.py exactly.
-- The app's seed.py does this automatically at every startup (it checks
-- for existing rows first), so this section is optional. It's included
-- here only so the schema is immediately usable without starting the app.
--
-- Only roles are inserted below. The product catalog (18 products),
-- ingredient knowledge base (10 categories), and chemical conflict matrix
-- (5 rules) are intentionally NOT duplicated here — they're seeded by
-- backend/seed.py::seed_ingredients()/seed_products() on first run, which
-- also wires up the product<->ingredient many-to-many links. Re-typing
-- that data as raw SQL here would just be a second copy to keep in sync.
-- =========================================================================

INSERT INTO roles (name, description) VALUES
    ('User',                 'User role'),
    ('Skincare Consultant',  'Skincare Consultant role'),
    ('Dermatologist',        'Dermatologist role'),
    ('Administrator',        'Administrator role');

-- NOTE: demo user accounts are intentionally NOT inserted here, because
-- their passwords must be bcrypt-hashed by the application (Passlib) —
-- a hash generated outside the app's exact settings could fail to verify.
-- Simply starting the app (`python main.py`) after this script will have
-- seed.py create the four demo accounts automatically:
--
--   user@demo.com           / User@1234
--   consultant@demo.com     / Consultant@1234
--   dermatologist@demo.com  / Dermatologist@1234
--   admin@demo.com          / Admin@1234

COMMIT;
