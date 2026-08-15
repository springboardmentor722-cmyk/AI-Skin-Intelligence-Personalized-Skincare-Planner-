-- ============================================================
-- MILESTONE 2 – New Tables for Assessment, Routine & Logs
-- ============================================================

-- 1. skin_assessments – stores historical score snapshots
CREATE TABLE IF NOT EXISTS skin_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    overall_score FLOAT NOT NULL,
    detected_concerns JSONB NOT NULL DEFAULT '[]',
    breakdown JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. skincare_routines – stores generated routine steps per user
CREATE TABLE IF NOT EXISTS skincare_routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES skin_assessments(id) ON DELETE SET NULL,
    time_of_day VARCHAR(10) NOT NULL CHECK (time_of_day IN ('AM', 'PM', 'Weekly')),
    step_number INTEGER NOT NULL,
    step_category VARCHAR(100) NOT NULL,
    step_description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. routine_logs – tracks daily step completions
CREATE TABLE IF NOT EXISTS routine_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    routine_step_id UUID NOT NULL REFERENCES skincare_routines(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    water_intake_ml INTEGER DEFAULT 0,
    sleep_hours DECIMAL(3,1) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, routine_step_id, log_date)
);

-- 4. routine_step_matrix – seeded lookup: skin_type → default steps
CREATE TABLE IF NOT EXISTS routine_step_matrix (
    id SERIAL PRIMARY KEY,
    skin_type VARCHAR(50) NOT NULL,
    time_of_day VARCHAR(10) NOT NULL CHECK (time_of_day IN ('AM', 'PM', 'Weekly')),
    step_order INTEGER NOT NULL,
    step_category VARCHAR(100) NOT NULL,
    step_description TEXT,
    is_harsh BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_skin_assessments_user_id ON skin_assessments(user_id);
CREATE INDEX idx_skin_assessments_created_at ON skin_assessments(created_at);
CREATE INDEX idx_skincare_routines_user_id ON skincare_routines(user_id);
CREATE INDEX idx_skincare_routines_assessment_id ON skincare_routines(assessment_id);
CREATE INDEX idx_routine_logs_user_id ON routine_logs(user_id);
CREATE INDEX idx_routine_logs_log_date ON routine_logs(log_date);
CREATE INDEX idx_routine_logs_routine_step_id ON routine_logs(routine_step_id);