-- Base de datos CardioBeat
CREATE DATABASE IF NOT EXISTS cardiobeat_db;
USE cardiobeat_db;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  role ENUM('student', 'professional', 'admin') DEFAULT 'student',
  bio TEXT,
  profile_photo VARCHAR(255),
  cover_photo VARCHAR(255),
  location VARCHAR(100),
  website VARCHAR(255),
  linkedin VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_media (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  media_type ENUM('avatar', 'cover', 'case', 'post') DEFAULT 'avatar',
  file_path VARCHAR(255) NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de experiencia profesional
CREATE TABLE IF NOT EXISTS professional_experience (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  location VARCHAR(100),
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de educación
CREATE TABLE IF NOT EXISTS education (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  institution VARCHAR(255) NOT NULL,
  degree VARCHAR(255) NOT NULL,
  field_of_study VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de certificaciones
CREATE TABLE IF NOT EXISTS certifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  issuing_organization VARCHAR(255) NOT NULL,
  issue_date DATE NOT NULL,
  expiration_date DATE,
  credential_id VARCHAR(255),
  credential_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de conexiones (relaciones entre usuarios)
CREATE TABLE IF NOT EXISTS connections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requester_id INT NOT NULL,
  receiver_id INT NOT NULL,
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_connection (requester_id, receiver_id)
);

-- Tabla de posts
CREATE TABLE IF NOT EXISTS posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  image_url VARCHAR(255),
  video_url VARCHAR(255),
  visibility ENUM('public', 'connections', 'private') DEFAULT 'public',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS post_media (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  media_type ENUM('image', 'video', 'audio') DEFAULT 'image',
  file_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Tabla de likes en posts
CREATE TABLE IF NOT EXISTS post_likes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_like (post_id, user_id)
);

-- Tabla de comentarios en posts
CREATE TABLE IF NOT EXISTS post_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de conversaciones
CREATE TABLE IF NOT EXISTS conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  participant1_id INT NOT NULL,
  participant2_id INT NOT NULL,
  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (participant1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (participant2_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_conversation (participant1_id, participant2_id)
);

-- Tabla de mensajes
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('connection_request', 'connection_accepted', 'post_like', 'post_comment', 'message', 'mention', 'follow') NOT NULL,
  related_user_id INT,
  related_post_id INT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (related_post_id) REFERENCES posts(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS follows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  follower_id INT NOT NULL,
  following_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_follow (follower_id, following_id),
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de tokens de verificacion de email
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  email VARCHAR(255) NOT NULL,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  INDEX idx_evt_user_email (user_id, email),
  INDEX idx_evt_expires_at (expires_at)
);

-- Tabla de tokens de recuperacion de contrasena
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  email VARCHAR(255) NOT NULL,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP NULL,
  updated_at TIMESTAMP NULL,
  INDEX idx_prt_user_email (user_id, email),
  INDEX idx_prt_expires_at (expires_at)
);

-- Tabla de focos cardíacos
CREATE TABLE IF NOT EXISTS cardiac_focus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  description TEXT,
  abbreviation VARCHAR(10),
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de sonidos cardíacos
CREATE TABLE IF NOT EXISTS heart_sounds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  audio_file VARCHAR(255) NOT NULL,
  focus_id INT,
  sound_type ENUM('normal', 'soplo', 'clic', 'galope', 'roce', 'otro') DEFAULT 'normal',
  pathology VARCHAR(255),
  duration INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (focus_id) REFERENCES cardiac_focus(id) ON DELETE SET NULL
);

-- Tabla de casos clínicos
CREATE TABLE IF NOT EXISTS clinical_cases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  patient_age INT,
  patient_gender ENUM('M', 'F', 'Otro'),
  symptoms TEXT,
  diagnosis TEXT,
  sound_id INT,
  difficulty ENUM('básico', 'intermedio', 'avanzado') DEFAULT 'básico',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sound_id) REFERENCES heart_sounds(id) ON DELETE SET NULL
);

-- Tabla de casos prácticos inteligentes (borradores/publicados)
CREATE TABLE IF NOT EXISTS smart_cases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_by INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  patient_context TEXT,
  description TEXT NOT NULL,
  symptoms TEXT,
  diagnosis_questions TEXT,
  diagnosis_hint VARCHAR(255),
  icd_hint VARCHAR(255),
  source_query VARCHAR(255),
  source_condition VARCHAR(255),
  status ENUM('draft', 'pending_review', 'published', 'rejected') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at TIMESTAMP NULL,
  reviewed_by INT NULL,
  reviewed_at TIMESTAMP NULL,
  reviewer_notes TEXT,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de progreso de usuarios
CREATE TABLE IF NOT EXISTS user_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  case_id INT,
  sound_id INT,
  completed BOOLEAN DEFAULT FALSE,
  score INT,
  time_spent INT,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (case_id) REFERENCES clinical_cases(id) ON DELETE SET NULL,
  FOREIGN KEY (sound_id) REFERENCES heart_sounds(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS case_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  case_id INT NOT NULL,
  score INT,
  feedback TEXT,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (case_id) REFERENCES clinical_cases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ecg_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  rhythm VARCHAR(50),
  bpm INT,
  duration_seconds INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insertar focos cardíacos
INSERT INTO cardiac_focus (name, location, abbreviation, description) VALUES
('Foco Aórtico', 'Segundo espacio intercostal paraesternal derecho', '2EICD', 'Aquí se escuchan mejor los ruidos de la válvula aórtica'),
('Foco Pulmonar', 'Segundo espacio intercostal paraesternal izquierdo', '2EICI', 'Aquí se escuchan mejor los ruidos de la válvula pulmonar'),
('Foco Tricuspídeo', 'Apéndice xifoides', 'ERB', 'Aquí se escuchan mejor los ruidos de la válvula tricúspide'),
('Foco Mitral', 'Quinto espacio intercostal línea medioclavicular izquierda', '5EICI', 'También llamado foco apexiano, aquí se escuchan mejor los ruidos de la válvula mitral'),
('Foco Aórtico Accesorio', 'Tercer espacio intercostal izquierdo', '3EICI', 'También llamado foco de Erb, útil para detectar insuficiencia aórtica');

-- Insertar sonidos de ejemplo
INSERT INTO heart_sounds (title, description, audio_file, focus_id, sound_type, pathology) VALUES
('Ruidos Cardíacos Normales', 'Sonido de corazón sano con S1 y S2 claramente audibles', 'normal_heart.mp3', 1, 'normal', NULL),
('Soplo Sistólico - Estenosis Aórtica', 'Soplo sistólico eyectivo en foco aórtico', 'soplo_estenosis_aortica.mp3', 1, 'soplo', 'Estenosis Aórtica'),
('Soplo Diastólico - Insuficiencia Mitral', 'Soplo diastólico en foco mitral', 'soplo_insuficiencia_mitral.mp3', 4, 'soplo', 'Insuficiencia Mitral'),
('Clic de Apertura - Estenosis Mitral', 'Clic de apertura seguido de soplo diastólico', 'clic_estenosis_mitral.mp3', 4, 'clic', 'Estenosis Mitral'),
('Galope S3', 'Tercer ruido cardíaco patológico', 'galope_s3.mp3', 4, 'galope', 'Insuficiencia Cardíaca'),
('Roce Pericárdico', 'Sonido de roce pericárdico característico', 'roce_pericardico.mp3', NULL, 'roce', 'Pericarditis');

-- Insertar casos clínicos
INSERT INTO clinical_cases (title, description, patient_age, patient_gender, symptoms, diagnosis, sound_id, difficulty) VALUES
('Caso 1: Estenosis Aórtica en Anciano', 'Paciente de 75 años con síncope de esfuerzo', 75, 'M', 'Síncope de esfuerzo, disnea, angina', 'Estenosis Aórtica Severa', 2, 'intermedio'),
('Caso 2: Insuficiencia Mitral Aguda', 'Mujer de 45 años con disnea súbita', 45, 'F', 'Disnea aguda, ortopnea, edema pulmonar', 'Insuficiencia Mitral Aguda', 3, 'avanzado'),
('Caso 3: Corazón Sano', 'Paciente joven asintomático para chequeo rutinario', 25, 'M', 'Ninguno, chequeo rutinario', 'Normal', 1, 'básico');

-- Insertar usuario demo
-- Contraseña: cardio123 (hasheada)
INSERT INTO users (email, password, name, role) VALUES
('demo@cardiobeat.com', '$2a$10$Ye17MtJmpUuX9MHou4bRx.MHhZsypueC1IwBQSJKvivZRGraS5dhq', 'Usuario Demo', 'student'),
('admin@cardiobeat.com', '$2a$10$Ye17MtJmpUuX9MHou4bRx.MHhZsypueC1IwBQSJKvivZRGraS5dhq', 'Administrador', 'admin');
