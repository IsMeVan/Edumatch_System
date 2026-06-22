CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_code VARCHAR(6),
    verification_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE institutions (
    id SERIAL PRIMARY KEY,
    name_kh VARCHAR(255),
    name_en VARCHAR(255),
    type VARCHAR(50),
    region VARCHAR(100),
    address TEXT,
    phones TEXT[],
    logo_url TEXT,
    image_url TEXT
);

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER REFERENCES institutions(id),
    name_kh VARCHAR(255),
    name_en VARCHAR(255)
);

CREATE TABLE majors (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER REFERENCES institutions(id),
    department_id INTEGER REFERENCES departments(id),
    name_kh VARCHAR(255),
    name_en VARCHAR(255)
);

CREATE TABLE major_descriptions (
    id SERIAL PRIMARY KEY,
    major_id INTEGER REFERENCES majors(id),
    prerequisites TEXT,
    skills_and_knowledge TEXT,
    career_opportunities TEXT,
    description TEXT
);

CREATE TABLE scholarships (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER REFERENCES institutions(id),
    scholarship_name VARCHAR(255),
    coverage_percentage INTEGER,
    description TEXT,
    requirements TEXT
);

CREATE TABLE scholarship_majors (
    id SERIAL PRIMARY KEY,
    scholarship_id INTEGER REFERENCES scholarships(id),
    major_id INTEGER REFERENCES majors(id)
);

CREATE TABLE survey_responses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    career_interest TEXT,
    subjects TEXT,
    skills TEXT,
    goals TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    major_id INTEGER REFERENCES majors(id),
    similarity_score DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    school_id INTEGER REFERENCES institutions(id),
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES chat_conversations(id),
    user_id INTEGER REFERENCES users(id),
    role VARCHAR(10),
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    conversation_id INTEGER REFERENCES chat_conversations(id),
    summary TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    institution_id INTEGER REFERENCES institutions(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    subject VARCHAR(255),
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);