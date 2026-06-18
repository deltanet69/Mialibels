### Supabase Data
url : https://ziijftyfmhpnlqcfhtht.supabase.co
Anon key : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaWpmdHlmbWhwbmxxY2ZodGh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3Njc2ODAsImV4cCI6MjA5NjM0MzY4MH0.69DiCQqFppXmQBkTK-pVMotIlGTvRr6SDEZazYte-iQ

### Frontend Database ###

# posts
- id
- title
- content
- thumbnail
- category
- slug
- author
- reading_time
- view_count
- tags
- created_at
- updated_at

# galleries
- id
- title
- description
- image
- category
- created_at
- updated_at

# contacts
- id
- name
- email
- phone
- subject
- message
- created_at
- updated_at

# banners
- id
- title
- description
- image
- created_at
- updated_at

# testimonials
- id
- name
- position
- message
- image
- created_at
- updated_at

# staffs
- id
- name
- position
- description
- image
- created_at
- updated_at

# students
- id
- name
- student_number
- position
- image
- class
- parent_name
- parent_phone
- parent_email
- description
- created_at 
- updated_at


### Admin Database ###

# User admin
- id
- name
- email
- password
- role
- created_at
- updated_at

-------------


SQL 

-- ==================== FRONTEND TABLES ====================

CREATE TABLE posts (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    thumbnail VARCHAR(500),
    category VARCHAR(100) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    author VARCHAR(255) NOT NULL,
    reading_time INT DEFAULT 1,
    view_count INT DEFAULT 0,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE galleries (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image VARCHAR(500) NOT NULL,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE contacts (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE banners (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image VARCHAR(500) NOT NULL,
    link VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE testimonials (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    image VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE staffs (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    description TEXT,
    image VARCHAR(500),
    email VARCHAR(255),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE students (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    student_number VARCHAR(100) UNIQUE NOT NULL,
    class VARCHAR(50) NOT NULL,
    position VARCHAR(255),
    image VARCHAR(500),
    parent_name VARCHAR(255) NOT NULL,
    parent_phone VARCHAR(50) NOT NULL,
    parent_email VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ==================== ADMIN TABLES ====================

CREATE TABLE admins (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ==================== KEUANGAN TABLES ====================

CREATE TABLE student_accounts (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id VARCHAR(255) UNIQUE NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    balance INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE saving_transactions (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id VARCHAR(255) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    account_id VARCHAR(255) NOT NULL REFERENCES student_accounts(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAWAL')),
    amount INT NOT NULL CHECK (amount > 0),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE spp_payments (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id VARCHAR(255) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    account_id VARCHAR(255) NOT NULL REFERENCES student_accounts(id) ON DELETE CASCADE,
    month VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    amount INT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PAID', 'UNPAID', 'LATE')),
    paid_at TIMESTAMP,
    due_date TIMESTAMP NOT NULL,
    late_fee INT DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, month, year)
);

CREATE TABLE school_finances (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    description VARCHAR(255) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    amount INT NOT NULL CHECK (amount > 0),
    category VARCHAR(100) NOT NULL,
    transaction_date TIMESTAMP NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ==================== INDEXES FOR PERFORMANCE ====================

CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_galleries_category ON galleries(category);
CREATE INDEX idx_students_class ON students(class);
CREATE INDEX idx_students_student_number ON students(student_number);
CREATE INDEX idx_spp_payments_student ON spp_payments(student_id);
CREATE INDEX idx_spp_payments_status ON spp_payments(status);
CREATE INDEX idx_saving_transactions_student ON saving_transactions(student_id);
CREATE INDEX idx_school_finances_date ON school_finances(transaction_date);