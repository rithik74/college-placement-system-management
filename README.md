# 🎓 College Placement Management System (CPMS)

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A modern, full-stack campus recruitment and placement management web platform designed to streamline corporate hiring, student applications, drive announcements, and placement tracking with a glassmorphic dark UI.

Repository: **[https://github.com/rithik74/collrge-placement-system-management](https://github.com/rithik74/collrge-placement-system-management.git)**

---

## 🌟 Key Highlights & Features

### 🏛️ 1. College Placement Coordinator (Admin)
- **Centralized Dashboard**: Live placement rate percentage counter and stats (Students, Placed, Companies, Drives, Applications).
- **Drive Management**: Announce, update, or cancel campus drives with venue, dates, deadlines, and guidelines.
- **Job Opening Review**: Approve or reject job role packages and CTC submissions from partner companies.
- **Student Directory**: Add, update, and search candidate profiles with real-time department and CGPA filtering.
- **Company Credentials Manager**: Create and assign login credentials directly to recruiting partners.
- **Placement Results**: Consolidated tracking of final offers and packages.

### 👨‍🎓 2. Student Candidate Portal
- **Drive Announcements**: Stay informed about scheduled campus placement drives with venue and registration deadlines.
- **Eligible Openings**: Automated CGPA cutoff filter matches students with openings they are eligible for.
- **1-Click Application**: Apply directly to eligible roles with instant validation.
- **Application Tracker**: Monitor real-time status across hiring rounds (*Applied* ➔ *Shortlisted* ➔ *Selected* / *Rejected*).
- **Profile Management**: Maintain academic records, branch, and contact information.

### 🏢 3. Corporate Recruiter Portal
- **Multi-Login Flexibility**: Sign in using either username or corporate email.
- **Self-Registration**: New corporate partners can register their company profiles.
- **Publish Openings**: Post salary packages (LPA), cutoff CGPA requirements, vacancies, and descriptions under scheduled drives.
- **Applicant Review**: Evaluate applicant profiles (CGPA, department, contact).
- **Hiring Decisions**: One-click actions to *Shortlist*, *Select*, or *Reject* candidates, instantly syncing with placement results.

---

## 🏗️ Architecture & Project Structure

```
College Placement Management System app/
│
├── frontend/                     # Modern Glassmorphic Dark-Theme Client
│   ├── index.html                # Portal Landing & Role Selection
│   ├── css/
│   │   └── style.css             # Unified Design System (Plus Jakarta Sans + Inter)
│   ├── js/
│   │   └── api.js                # Shared API client, helpers, toasts & session guard
│   ├── admin/
│   │   ├── login.html            # Admin login interface
│   │   └── dashboard.html        # Placement Coordinator control center
│   ├── student/
│   │   ├── login.html            # Student login
│   │   ├── register.html         # Student registration
│   │   └── dashboard.html        # Candidate portal & application tracker
│   └── company/
│       ├── login.html            # Corporate recruiter login
│       ├── register.html         # Recruiter registration
│       └── dashboard.html        # Job postings & applicant evaluator
│
├── backend/                      # Node.js + Express REST API
│   ├── index.js                  # Application server entrypoint
│   ├── middleware/
│   │   └── auth.js               # Role-based session authorization middleware
│   └── routes/
│       ├── auth.js               # Authentication & session endpoints
│       ├── admin.js              # Coordinator management APIs
│       ├── student.js            # Student profile, browse & apply APIs
│       └── company.js            # Recruiter openings & candidate review APIs
│
├── db/                           # Database Layer
│   ├── connection.js             # MySQL2 promise connection pool
│   ├── schema.sql                # Relational schema (7 normalized tables)
│   ├── setup.js                  # Automated database initialization script
│   ├── migrate.js                # Database migration helper
│   └── reset.js                  # Database rebuilder
│
├── .env.example                  # Environment configuration template
├── .gitignore                    # Git ignore file
└── package.json                  # Dependencies and scripts
```

---

## 🛠️ Technology Stack

- **Frontend**: Semantic HTML5, Vanilla CSS3 (Custom Glassmorphism Design System, CSS Variables, Responsive Grid), Vanilla JavaScript (ES6+ Fetch API, Dynamic DOM).
- **Backend**: Node.js, Express.js, Express-Session.
- **Database**: MySQL 8.x with `mysql2/promise` connection pooling.
- **Security & Auth**: `bcryptjs` for salted password hashing, cookie-based session guards.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MySQL](https://www.mysql.com/) server running locally or remotely

### 1. Clone the Repository
```bash
git clone https://github.com/rithik74/collrge-placement-system-management.git
cd collrge-placement-system-management
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `.env` with your MySQL credentials:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=college_placement_db
DB_PORT=3306
SESSION_SECRET=cpms_super_secret_key_2024
PORT=3000
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Initialize Database
Run the setup script to create database tables and initialize the placement admin account:
```bash
npm run setup-db
```

### 5. Launch Application
```bash
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🌐 Application Portals & URLs

| Portal | URL | Description |
|---|---|---|
| **Landing Portal** | `http://localhost:3000/` | Role selection hero & placement statistics |
| **Admin Login** | `http://localhost:3000/admin/login` | Placement Coordinator sign-in |
| **Admin Dashboard** | `http://localhost:3000/admin/dashboard` | Drives, students, openings & analytics |
| **Student Login** | `http://localhost:3000/student/login` | Student authentication |
| **Student Register** | `http://localhost:3000/student/register` | Student account registration |
| **Student Dashboard** | `http://localhost:3000/student/dashboard` | Browse drives, roles & applications |
| **Company Login** | `http://localhost:3000/company/login` | Recruiter portal sign-in |
| **Company Register** | `http://localhost:3000/company/register` | Partner company registration |
| **Company Dashboard** | `http://localhost:3000/company/dashboard` | Post openings & evaluate applicants |

---

## 🗄️ Database Schema Overview

| Table | Key Columns | Description |
|---|---|---|
| `Admin` | `admin_id`, `username`, `password_hash`, `email` | Placement coordinators |
| `Student` | `student_id`, `name`, `email`, `department`, `year`, `cgpa`, `is_placed` | Registered student candidates |
| `Company` | `company_id`, `name`, `email`, `username`, `industry`, `location` | Corporate recruiting partners |
| `PlacementDrive` | `drive_id`, `drive_title`, `drive_date`, `last_date`, `venue`, `status` | Scheduled campus placement drives |
| `CompanyJobOpening` | `opening_id`, `company_id`, `drive_id`, `role`, `package`, `min_cgpa`, `status` | Job packages submitted by companies |
| `Application` | `application_id`, `student_id`, `opening_id`, `status`, `applied_at` | Student applications to job openings |
| `PlacementResult` | `result_id`, `student_id`, `opening_id`, `package_offered`, `result_date` | Selected candidates & finalized offers |

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
