-- College Placement Management System — Full Schema
CREATE DATABASE IF NOT EXISTS college_placement_db;
USE college_placement_db;

-- College Placement Coordinator login
CREATE TABLE IF NOT EXISTS Admin (
  admin_id      INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student accounts
CREATE TABLE IF NOT EXISTS Student (
  student_id    INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  department    VARCHAR(100),
  year          INT CHECK (year BETWEEN 1 AND 4),
  cgpa          DECIMAL(4,2) CHECK (cgpa BETWEEN 0 AND 10),
  phone         VARCHAR(15),
  is_placed     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Company accounts
CREATE TABLE IF NOT EXISTS Company (
  company_id      INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(150) NOT NULL,
  email           VARCHAR(150) NOT NULL UNIQUE,
  username        VARCHAR(100) UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  location        VARCHAR(200),
  phone           VARCHAR(15),
  website         VARCHAR(255),
  industry        VARCHAR(100),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Placement Drives created by College Admin
CREATE TABLE IF NOT EXISTS PlacementDrive (
  drive_id      INT AUTO_INCREMENT PRIMARY KEY,
  drive_title   VARCHAR(200) NOT NULL,
  drive_date    DATE NOT NULL,
  last_date     DATE,
  venue         VARCHAR(200),
  description   TEXT,
  status        ENUM('Open','Closed','Completed','Cancelled') DEFAULT 'Open',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job Openings submitted by Companies for a specific Drive
CREATE TABLE IF NOT EXISTS CompanyJobOpening (
  opening_id    INT AUTO_INCREMENT PRIMARY KEY,
  company_id    INT NOT NULL,
  drive_id      INT NOT NULL,
  role          VARCHAR(150) NOT NULL,
  package       DECIMAL(10,2) NOT NULL,
  min_cgpa      DECIMAL(4,2)  NOT NULL,
  vacancies     INT DEFAULT 1,
  description   TEXT,
  status        ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES Company(company_id) ON DELETE CASCADE,
  FOREIGN KEY (drive_id)   REFERENCES PlacementDrive(drive_id) ON DELETE CASCADE
);

-- Student Applications to a Job Opening
CREATE TABLE IF NOT EXISTS Application (
  application_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id     INT NOT NULL,
  opening_id     INT NOT NULL,
  status         ENUM('Applied','Shortlisted','Selected','Rejected') DEFAULT 'Applied',
  applied_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  remarks        TEXT,
  FOREIGN KEY (student_id) REFERENCES Student(student_id)            ON DELETE CASCADE,
  FOREIGN KEY (opening_id) REFERENCES CompanyJobOpening(opening_id)  ON DELETE CASCADE,
  UNIQUE KEY unique_app (student_id, opening_id)
);

-- Final Placement Results
CREATE TABLE IF NOT EXISTS PlacementResult (
  result_id       INT AUTO_INCREMENT PRIMARY KEY,
  student_id      INT NOT NULL,
  opening_id      INT NOT NULL,
  package_offered DECIMAL(10,2) NOT NULL,
  joining_date    DATE,
  remarks         TEXT,
  result_date     DATE DEFAULT (CURDATE()),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES Student(student_id)           ON DELETE CASCADE,
  FOREIGN KEY (opening_id) REFERENCES CompanyJobOpening(opening_id) ON DELETE CASCADE,
  UNIQUE KEY unique_result (student_id, opening_id)
);
