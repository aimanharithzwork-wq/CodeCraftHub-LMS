/**
 * CodeCraftHub - Personal Learning Goal Tracker API
 * 
 * A simple RESTful API built with Node.js and Express to track
 * developer courses using a local JSON file for data persistence.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 5000;

// Path to the JSON data storage file
const DATA_FILE = path.join(__dirname, 'courses.json');

// Middleware to parse JSON request bodies
app.use(express.json());

// List of allowed status values
const ALLOWED_STATUSES = ['Not Started', 'In Progress', 'Completed'];

// Date regex for YYYY-MM-DD validation
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Helper function to ensure courses.json exists.
 * If the file doesn't exist, it creates an empty JSON array file.
 */
function initializeDataFile() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
      console.log(`Created new data file at: ${DATA_FILE}`);
    }
  } catch (err) {
    console.error('Error initializing data file:', err.message);
  }
}

/**
 * Helper function to read courses from the JSON file.
 * Returns an array of courses.
 */
function readCourses() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      initializeDataFile();
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading courses.json:', err.message);
    throw new Error('Unable to read data from storage');
  }
}

/**
 * Helper function to write courses array to the JSON file.
 */
function writeCourses(courses) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(courses, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing to courses.json:', err.message);
    throw new Error('Unable to save data to storage');
  }
}

// Initialize data storage on startup
initializeDataFile();

// ==========================================
// ROUTES & ENDPOINTS
// ==========================================

/**
 * Root route - Welcome / health check
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the CodeCraftHub Learning Platform API',
    endpoints: {
      getAllCourses: 'GET /api/courses',
      getCourseById: 'GET /api/courses/:id',
      getCourseStats: 'GET /api/courses/stats',
      createCourse: 'POST /api/courses',
      updateCourse: 'PUT /api/courses/:id',
      deleteCourse: 'DELETE /api/courses/:id'
    }
  });
});

/**
 * [BONUS / CHALLENGE] GET /api/courses/stats
 * Returns statistics about courses:
 * - Total number of courses
 * - Number of courses by status (Not Started, In Progress, Completed)
 * 
 * Note: Must be placed before /api/courses/:id so 'stats' is not parsed as an ID.
 */
app.get('/api/courses/stats', (req, res) => {
  try {
    const courses = readCourses();

    const stats = {
      total_courses: courses.length,
      by_status: {
        'Not Started': courses.filter(c => c.status === 'Not Started').length,
        'In Progress': courses.filter(c => c.status === 'In Progress').length,
        'Completed': courses.filter(c => c.status === 'Completed').length
      }
    };

    res.status(200).json(stats);
  } catch (err) {
    res.status(500).json({ error: 'File read/write error: ' + err.message });
  }
});

/**
 * POST /api/courses
 * Add a new course
 * 
 * Required body fields:
 * - name: string
 * - description: string
 * - target_date: string (YYYY-MM-DD)
 * - status: "Not Started" | "In Progress" | "Completed"
 */
app.post('/api/courses', (req, res) => {
  try {
    const { name, description, target_date, status } = req.body;

    // Check for missing required fields
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!description) missingFields.push('description');
    if (!target_date) missingFields.push('target_date');
    if (!status) missingFields.push('status');

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required field(s): ${missingFields.join(', ')}`
      });
    }

    // Validate target_date format (YYYY-MM-DD)
    if (!DATE_REGEX.test(target_date) || isNaN(Date.parse(target_date))) {
      return res.status(400).json({
        error: 'Invalid target_date format. Expected YYYY-MM-DD (e.g., 2025-12-31)'
      });
    }

    // Validate status value
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status value. Must be one of: ${ALLOWED_STATUSES.map(s => `"${s}"`).join(', ')}`
      });
    }

    const courses = readCourses();

    // Auto-generate ID starting from 1
    const nextId = courses.length > 0 
      ? Math.max(...courses.map(c => Number(c.id) || 0)) + 1 
      : 1;

    // Build the new course object
    const newCourse = {
      id: nextId,
      name: name.trim(),
      description: description.trim(),
      target_date: target_date.trim(),
      status: status.trim(),
      created_at: new Date().toISOString()
    };

    courses.push(newCourse);
    writeCourses(courses);

    res.status(201).json(newCourse);
  } catch (err) {
    res.status(500).json({ error: 'File read/write error: ' + err.message });
  }
});

/**
 * GET /api/courses
 * Retrieve all courses
 */
app.get('/api/courses', (req, res) => {
  try {
    const courses = readCourses();
    res.status(200).json(courses);
  } catch (err) {
    res.status(500).json({ error: 'File read/write error: ' + err.message });
  }
});

/**
 * GET /api/courses/:id
 * Retrieve a specific course by its ID
 */
app.get('/api/courses/:id', (req, res) => {
  try {
    const courseId = parseInt(req.params.id, 10);

    if (isNaN(courseId)) {
      return res.status(400).json({ error: 'Course ID must be a valid number' });
    }

    const courses = readCourses();
    const course = courses.find(c => c.id === courseId);

    if (!course) {
      return res.status(404).json({ error: `Course with id ${courseId} not found` });
    }

    res.status(200).json(course);
  } catch (err) {
    res.status(500).json({ error: 'File read/write error: ' + err.message });
  }
});

/**
 * PUT /api/courses/:id
 * Update an existing course by its ID
 * Supports partial or full updates
 */
app.put('/api/courses/:id', (req, res) => {
  try {
    const courseId = parseInt(req.params.id, 10);

    if (isNaN(courseId)) {
      return res.status(400).json({ error: 'Course ID must be a valid number' });
    }

    const courses = readCourses();
    const courseIndex = courses.findIndex(c => c.id === courseId);

    if (courseIndex === -1) {
      return res.status(404).json({ error: `Course with id ${courseId} not found` });
    }

    const { name, description, target_date, status } = req.body;

    // Validate status if provided
    if (status !== undefined) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
          error: `Invalid status value. Must be one of: ${ALLOWED_STATUSES.map(s => `"${s}"`).join(', ')}`
        });
      }
      courses[courseIndex].status = status;
    }

    // Validate target_date if provided
    if (target_date !== undefined) {
      if (!DATE_REGEX.test(target_date) || isNaN(Date.parse(target_date))) {
        return res.status(400).json({
          error: 'Invalid target_date format. Expected YYYY-MM-DD (e.g., 2025-12-31)'
        });
      }
      courses[courseIndex].target_date = target_date;
    }

    // Update optional fields if provided
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ error: 'Course name cannot be empty' });
      }
      courses[courseIndex].name = name.trim();
    }

    if (description !== undefined) {
      if (!description.trim()) {
        return res.status(400).json({ error: 'Course description cannot be empty' });
      }
      courses[courseIndex].description = description.trim();
    }

    // Save updated courses back to JSON file
    writeCourses(courses);

    res.status(200).json(courses[courseIndex]);
  } catch (err) {
    res.status(500).json({ error: 'File read/write error: ' + err.message });
  }
});

/**
 * DELETE /api/courses/:id
 * Delete a course by its ID
 */
app.delete('/api/courses/:id', (req, res) => {
  try {
    const courseId = parseInt(req.params.id, 10);

    if (isNaN(courseId)) {
      return res.status(400).json({ error: 'Course ID must be a valid number' });
    }

    const courses = readCourses();
    const courseIndex = courses.findIndex(c => c.id === courseId);

    if (courseIndex === -1) {
      return res.status(404).json({ error: `Course with id ${courseId} not found` });
    }

    const deletedCourse = courses.splice(courseIndex, 1)[0];
    writeCourses(courses);

    res.status(200).json({
      message: `Course with id ${courseId} deleted successfully`,
      course: deletedCourse
    });
  } catch (err) {
    res.status(500).json({ error: 'File read/write error: ' + err.message });
  }
});

// Fallback 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start the server
app.listen(PORT, () => {
  console.log('- CodeCraftHub API is starting...');
  console.log(`- Data will be stored in: \`${DATA_FILE}\``);
  console.log(`- API is available at: \`http://localhost:${PORT}\``);
});

module.exports = app;
