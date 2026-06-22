-- ============================================================
--  RECOMMENDATION SYSTEM — PostgreSQL Schema
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          VARCHAR(20) DEFAULT 'student',
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS institutions (
    id        SERIAL PRIMARY KEY,
    name_kh   TEXT NOT NULL,
    type      TEXT,
    region    TEXT,
    address   TEXT,
    phones    TEXT[],
    image_url TEXT
);

CREATE TABLE IF NOT EXISTS departments (
    id             SERIAL PRIMARY KEY,
    institution_id INT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    name_kh        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS majors (
    id             SERIAL PRIMARY KEY,
    department_id  INT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    institution_id INT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    name_kh        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS scholarships (
    id                   SERIAL PRIMARY KEY,
    institution_id       INT REFERENCES institutions(id) ON DELETE SET NULL,
    scholarship_name     TEXT NOT NULL,
    academic_year        TEXT,
    category             TEXT,
    coverage_percentage  INT,
    total_scholarships   INT,
    eligibility_criteria TEXT[],
    quota_general        INT DEFAULT 0,
    quota_female         INT DEFAULT 0,
    quota_poor           INT DEFAULT 0,
    quota_remote         INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS scholarship_majors (
    id                    SERIAL PRIMARY KEY,
    scholarship_id        INT NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
    major_name_kh         TEXT NOT NULL,
    total_quota           INT DEFAULT 0,
    quota_general         INT DEFAULT 0,
    quota_female          INT DEFAULT 0,
    quota_poor            INT DEFAULT 0,
    quota_remote          INT DEFAULT 0,
    specific_requirements TEXT[]
);

CREATE TABLE IF NOT EXISTS survey_responses (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    study_track     VARCHAR(50),
    gpa_level       VARCHAR(20),
    career_interest TEXT,
    strong_subjects TEXT[],
    free_text       TEXT,
    submitted_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommendations (
    id             SERIAL PRIMARY KEY,
    survey_id      INT NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
    user_id        INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_id INT REFERENCES institutions(id),
    major_id       INT REFERENCES majors(id),
    scholarship_id INT REFERENCES scholarships(id),
    cosine_score   FLOAT,
    rank           INT,
    created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_history (
    id         SERIAL PRIMARY KEY,
    user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role       VARCHAR(10) NOT NULL,
    message    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_inst_region      ON institutions(region);
CREATE INDEX IF NOT EXISTS idx_dept_inst        ON departments(institution_id);
CREATE INDEX IF NOT EXISTS idx_major_dept       ON majors(department_id);
CREATE INDEX IF NOT EXISTS idx_schol_inst       ON scholarships(institution_id);
CREATE INDEX IF NOT EXISTS idx_schol_maj_schol  ON scholarship_majors(scholarship_id);
CREATE INDEX IF NOT EXISTS idx_survey_user      ON survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_rec_user         ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_user        ON chat_history(user_id);

-- Add profile fields to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id             SERIAL PRIMARY KEY,
    user_id        INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_id INT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    created_at     TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, institution_id)
);

CREATE INDEX IF NOT EXISTS idx_fav_user ON favorites(user_id);