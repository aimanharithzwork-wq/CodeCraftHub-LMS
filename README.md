# CodeCraftHub - Learning Management System (LMS)

A lightweight, personalized learning platform RESTful API designed for developers to plan, track, and manage their learning journey. Built with **Node.js** and the **Express** framework, storing data in a local JSON text file without requiring an external database.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation Instructions](#installation-instructions)
- [How to Run the Application](#how-to-run-the-application)
- [API Endpoint Documentation](#api-endpoint-documentation)
  - [1. Add a Course (POST)](#1-add-a-course-post)
  - [2. Get All Courses (GET)](#2-get-all-courses-get)
  - [3. Get Course Statistics (GET)](#3-get-course-statistics-get)
  - [4. Get a Specific Course (GET)](#4-get-a-specific-course-get)
  - [5. Update a Course (PUT)](#5-update-a-course-put)
  - [6. Delete a Course (DELETE)](#6-delete-a-course-delete)
- [Data Model](#data-model)
- [Troubleshooting](#troubleshooting)
- [Pushing to GitHub](#pushing-to-github)
- [License](#license)

---

## Project Overview

**CodeCraftHub** provides a lightweight server-side REST API that empowers developers to monitor self-paced study plans. Instead of relying on full-scale databases like MongoDB or PostgreSQL, CodeCraftHub uses a simple `courses.json` file to store records persistently, making it ideal for learning foundational RESTful design, HTTP methods, and JSON file manipulation in Node.js.

---

## Features

- **Full CRUD Support**: Create, Read, Update, and Delete courses via clean RESTful routes.
- **Lightweight Storage**: Zero external database setup needed; courses are persisted in `courses.json`.
- **Auto Initialization**: Automatically detects and creates `courses.json` if it doesn't already exist.
- **Input Validation**: Verifies mandatory fields, date format (`YYYY-MM-DD`), and allowed statuses (`Not Started`, `In Progress`, `Completed`).
- **Comprehensive Error Handling**: Returns appropriate HTTP status codes (200, 201, 400, 404, 500) and readable JSON error messages.
- **[Enhancement] Course Statistics**: Provides a `/api/courses/stats` endpoint summarizing total courses and counts broken down by progress status.

---

## Project Structure

```text
CodeCraftHub Learning Management System/
│
├── app.js               # Main Express application with REST routes & handlers
├── courses.json         # Auto-generated JSON file for storing courses
├── package.json         # Node.js project manifest & dependencies
├── test-api.js          # Automated endpoint testing script
├── .gitignore           # Ignored files (node_modules, etc.)
└── README.md            # Comprehensive documentation & API guide
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v16.0.0 or later recommended; v18+ supported)
- [npm](https://www.npmjs.com/) (Node Package Manager)
- `curl` or an API testing client (e.g., Postman, Thunder Client)

---

## Installation Instructions

1. Clone or navigate to the project directory:
   ```bash
   cd "c:\xampp\htdocs\CodeCraftHub Learning Management System"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

---

## How to Run the Application

Start the Express development server:

```bash
npm start
```

Upon starting, you will see output similar to:

```text
- CodeCraftHub API is starting...
- Data will be stored in: `.../courses.json`
- API is available at: `http://localhost:5000`
```

---

## API Endpoint Documentation

### 1. Add a Course (POST)
Creates a new course entry in `courses.json`.

- **URL**: `/api/courses`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body Parameters**:
  - `name` *(string, required)*: Course name
  - `description` *(string, required)*: Brief course overview
  - `target_date` *(string, required)*: Target completion date in format `YYYY-MM-DD`
  - `status` *(string, required)*: Must be `"Not Started"`, `"In Progress"`, or `"Completed"`

#### Example cURL:
```bash
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Python Basics",
    "description": "Learn Python fundamentals",
    "target_date": "2025-12-31",
    "status": "Not Started"
  }'
```

#### Example Response (201 Created):
```json
{
  "id": 1,
  "name": "Python Basics",
  "description": "Learn Python fundamentals",
  "target_date": "2025-12-31",
  "status": "Not Started",
  "created_at": "2026-10-19T15:00:00.000Z"
}
```

---

### 2. Get All Courses (GET)
Retrieves the list of all courses.

- **URL**: `/api/courses`
- **Method**: `GET`

#### Example cURL:
```bash
curl http://localhost:5000/api/courses
```

#### Example Response (200 OK):
```json
[
  {
    "id": 1,
    "name": "Python Basics",
    "description": "Learn Python fundamentals",
    "target_date": "2025-12-31",
    "status": "Not Started",
    "created_at": "2026-10-19T15:00:00.000Z"
  }
]
```

---

### 3. Get Course Statistics (GET)
Retrieves aggregate statistics for all courses.

- **URL**: `/api/courses/stats`
- **Method**: `GET`

#### Example cURL:
```bash
curl http://localhost:5000/api/courses/stats
```

#### Example Response (200 OK):
```json
{
  "total_courses": 1,
  "by_status": {
    "Not Started": 1,
    "In Progress": 0,
    "Completed": 0
  }
}
```

---

### 4. Get a Specific Course (GET)
Retrieves a single course by its integer ID.

- **URL**: `/api/courses/:id`
- **Method**: `GET`

#### Example cURL:
```bash
curl http://localhost:5000/api/courses/1
```

#### Example Response (200 OK):
```json
{
  "id": 1,
  "name": "Python Basics",
  "description": "Learn Python fundamentals",
  "target_date": "2025-12-31",
  "status": "Not Started",
  "created_at": "2026-10-19T15:00:00.000Z"
}
```

#### Error Response (404 Not Found):
```json
{
  "error": "Course with id 99 not found"
}
```

---

### 5. Update a Course (PUT)
Updates attributes for a course. Supports partial or full property updates.

- **URL**: `/api/courses/:id`
- **Method**: `PUT`
- **Headers**: `Content-Type: application/json`
- **Body Parameters** (Optional/Partial):
  - `name`: string
  - `description`: string
  - `target_date`: string (YYYY-MM-DD)
  - `status`: `"Not Started"` | `"In Progress"` | `"Completed"`

#### Example cURL:
```bash
curl -X PUT http://localhost:5000/api/courses/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "In Progress"
  }'
```

#### Example Response (200 OK):
```json
{
  "id": 1,
  "name": "Python Basics",
  "description": "Learn Python fundamentals",
  "target_date": "2025-12-31",
  "status": "In Progress",
  "created_at": "2026-10-19T15:00:00.000Z"
}
```

---

### 6. Delete a Course (DELETE)
Removes a course from `courses.json`.

- **URL**: `/api/courses/:id`
- **Method**: `DELETE`

#### Example cURL:
```bash
curl -X DELETE http://localhost:5000/api/courses/1
```

#### Example Response (200 OK):
```json
{
  "message": "Course with id 1 deleted successfully",
  "course": {
    "id": 1,
    "name": "Python Basics",
    "description": "Learn Python fundamentals",
    "target_date": "2025-12-31",
    "status": "In Progress",
    "created_at": "2026-10-19T15:00:00.000Z"
  }
}
```

---

## Data Model

| Field | Type | Description | Generation |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Unique identifier for each course | Auto-generated starting from 1 |
| `name` | String | Title of the course | User input (Required) |
| `description` | String | Detailed description of the course | User input (Required) |
| `target_date` | String | Target completion date (`YYYY-MM-DD`) | User input (Required) |
| `status` | String | Current status (`Not Started`, `In Progress`, `Completed`) | User input (Required) |
| `created_at` | String | ISO 8601 creation timestamp | Auto-generated system timestamp |

---

## Troubleshooting

### 1. Port 5000 is already in use (`EADDRINUSE`)
- **Cause**: Another service or prior node instance is bound to port 5000.
- **Solution**: Set the `PORT` environment variable before starting:
  ```powershell
  $env:PORT=5001; npm start
  ```
  Or identify and terminate the process holding port 5000 using PowerShell:
  ```powershell
  Get-NetTCPConnection -LocalPort 5000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
  ```

### 2. Invalid status error (400 Bad Request)
- **Cause**: The `status` property in the request payload does not match one of the allowed strings.
- **Solution**: Ensure your payload status is strictly one of:
  - `"Not Started"`
  - `"In Progress"`
  - `"Completed"` (exact casing and spacing matters).

### 3. Invalid target_date format
- **Cause**: Date provided in formats like `MM/DD/YYYY` or timestamp.
- **Solution**: Supply dates formatted as `YYYY-MM-DD` (e.g., `2025-12-31`).

### 4. `courses.json` corrupted or invalid JSON
- **Cause**: Manual edits in `courses.json` broke valid JSON syntax.
- **Solution**: Reset `courses.json` with an empty array:
  ```json
  []
  ```

---

## Pushing to GitHub

Follow these steps to initialize and push your repository to GitHub:

```bash
git init
git config --global user.email "yourgithub@email.com"
git config --global user.name "Your Name"
git add .
git commit -m "Complete CodeCraftHub learning platform"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

---

## License

This project is licensed under Apache 2.0.
