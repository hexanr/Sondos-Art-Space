-- =============================================
-- Sondos Art Space - Database Schema
-- =============================================

CREATE DATABASE IF NOT EXISTS sondos_artspace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sondos_artspace;

-- =============================================
-- جدول المستخدم الأدمن
-- =============================================
CREATE TABLE IF NOT EXISTS admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إدراج أدمن افتراضي (set your own password hash)
INSERT INTO admin (username, password, email) VALUES
('sondos', 'REPLACE_WITH_BCRYPT_HASH', 'admin@example.com');

-- =============================================
-- جدول الخدمات
-- =============================================
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    sort_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO services (title, description, icon, sort_order) VALUES
('Logo Design', 'Distinctive logos that capture your brand\'s essence and leave a lasting impression.', 'logo', 1),
('Visual Identity', 'Complete brand systems — colors, typography, and guidelines for a cohesive look.', 'identity', 2),
('Product Packaging', 'Packaging design that stands out on shelves and tells your product\'s story.', 'packaging', 3),
('Brand Strategy', 'Thoughtful positioning and creative direction to build brands that resonate.', 'strategy', 4);

-- =============================================
-- جدول الأعمال (Portfolio)
-- =============================================
CREATE TABLE IF NOT EXISTS portfolio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    image_path VARCHAR(300),
    client_name VARCHAR(150),
    year YEAR,
    is_featured TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO portfolio (title, description, category, client_name, year, is_featured) VALUES
('Brand Identity Project', 'Complete visual identity design for a local business.', 'Brand Identity', 'Client A', 2024, 1),
('Product Packaging', 'Premium packaging design for a cosmetics brand.', 'Packaging', 'Client B', 2024, 1),
('Logo Design', 'Modern logo design for a tech startup.', 'Logo Design', 'Client C', 2025, 1),
('Visual System', 'Full brand system with guidelines and assets.', 'Visual System', 'Client D', 2025, 0);

-- =============================================
-- جدول رسائل التواصل
-- =============================================
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    subject VARCHAR(250),
    message TEXT NOT NULL,
    service_interest VARCHAR(100),
    is_read TINYINT(1) DEFAULT 0,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- جدول الإحصائيات
-- =============================================
CREATE TABLE IF NOT EXISTS stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    label VARCHAR(100) NOT NULL,
    value VARCHAR(50) NOT NULL,
    sort_order INT DEFAULT 0
);

INSERT INTO stats (label, value, sort_order) VALUES
('Years of Experience', '5+', 1),
('Projects Delivered', '30+', 2),
('Client Satisfaction', '100%', 3),
('Happy Clients', '20+', 4);

-- =============================================
-- جدول معلومات الموقع
-- =============================================
CREATE TABLE IF NOT EXISTS site_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO site_settings (setting_key, setting_value) VALUES
('site_name', 'Sondos Art Space'),
('owner_name', 'Sondos Mohammed'),
('email', 'admin@example.com'),
('instagram', '@sondos_art_space'),
('twitter', '@sondaiartspace'),
('linkedin', 'Sondos Mohamed'),
('behance', 'Sondos Art Space'),
('hero_title', 'Design that feels like Magic'),
('hero_subtitle', 'I specialize in logos, visual identities, and product packaging.'),
('about_text', 'I am Sondos Mohammed, a graphic designer with five years of experience in the field.');

-- =============================================
-- جدول صور المشاريع (متعددة لكل مشروع)
-- =============================================
CREATE TABLE IF NOT EXISTS portfolio_images (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    portfolio_id INT NOT NULL,
    image_path   VARCHAR(500) NOT NULL,
    sort_order   INT DEFAULT 0,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (portfolio_id) REFERENCES portfolio(id) ON DELETE CASCADE,
    INDEX idx_portfolio_id (portfolio_id)
);

-- إضافة عمود title_ar إذا لم يكن موجوداً
ALTER TABLE portfolio ADD COLUMN IF NOT EXISTS title_ar VARCHAR(200) DEFAULT '';

-- مجلد رفع الصور (ملاحظة: أنشئه يدوياً في السيرفر)
-- mkdir -p uploads/portfolio && chmod 755 uploads/portfolio
