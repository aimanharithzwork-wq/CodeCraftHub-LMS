/**
 * Automated test script for CodeCraftHub API
 * Verifies all CRUD operations, validations, error handling, and stats endpoint.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}`;
const DATA_FILE = path.join(__dirname, 'courses.json');

// Helper to make HTTP requests
function request(method, route, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(route, BASE_URL);
    const postData = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('==============================================');
  console.log('🧪 Starting CodeCraftHub API Test Suite');
  console.log('==============================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // Backup existing data if any
  let originalData = null;
  if (fs.existsSync(DATA_FILE)) {
    try { originalData = fs.readFileSync(DATA_FILE, 'utf8'); } catch {}
  }

  try {
    // 1. Reset storage to empty array for testing
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');

    // Test 1: GET /api/courses on empty storage
    const emptyRes = await request('GET', '/api/courses');
    assert(emptyRes.status === 200 && Array.isArray(emptyRes.data) && emptyRes.data.length === 0, 'GET /api/courses returns empty array initially');

    // Test 2: POST /api/courses - Missing required fields validation
    const invalidPost = await request('POST', '/api/courses', { name: 'Node.js Basics' });
    assert(invalidPost.status === 400 && invalidPost.data.error.includes('Missing required field'), 'POST /api/courses fails when required fields are missing');

    // Test 3: POST /api/courses - Invalid status validation
    const invalidStatusPost = await request('POST', '/api/courses', {
      name: 'Node.js Basics',
      description: 'Learn Node',
      target_date: '2025-12-31',
      status: 'UnknownStatus'
    });
    assert(invalidStatusPost.status === 400 && invalidStatusPost.data.error.includes('Invalid status value'), 'POST /api/courses fails with invalid status');

    // Test 4: POST /api/courses - Invalid date format
    const invalidDatePost = await request('POST', '/api/courses', {
      name: 'Node.js Basics',
      description: 'Learn Node',
      target_date: '31-12-2025',
      status: 'Not Started'
    });
    assert(invalidDatePost.status === 400 && invalidDatePost.data.error.includes('Invalid target_date format'), 'POST /api/courses fails with invalid date format');

    // Test 5: POST /api/courses - Valid creation of course 1
    const createRes1 = await request('POST', '/api/courses', {
      name: 'Python Basics',
      description: 'Learn Python fundamentals',
      target_date: '2025-12-31',
      status: 'Not Started'
    });
    assert(
      createRes1.status === 201 &&
      createRes1.data.id === 1 &&
      createRes1.data.name === 'Python Basics' &&
      createRes1.data.status === 'Not Started' &&
      createRes1.data.created_at,
      'POST /api/courses successfully creates first course (id=1)'
    );

    // Test 6: POST /api/courses - Auto-increment id for course 2
    const createRes2 = await request('POST', '/api/courses', {
      name: 'Express Mastery',
      description: 'Master Express REST APIs',
      target_date: '2026-06-30',
      status: 'In Progress'
    });
    assert(createRes2.status === 201 && createRes2.data.id === 2, 'POST /api/courses auto-generates next id (id=2)');

    // Test 7: GET /api/courses - Retrieve all courses
    const allRes = await request('GET', '/api/courses');
    assert(allRes.status === 200 && allRes.data.length === 2, 'GET /api/courses returns 2 created courses');

    // Test 8: GET /api/courses/:id - Retrieve specific course
    const getOneRes = await request('GET', '/api/courses/1');
    assert(getOneRes.status === 200 && getOneRes.data.name === 'Python Basics', 'GET /api/courses/1 retrieves correct course');

    // Test 9: GET /api/courses/:id - 404 for non-existent course
    const notFoundRes = await request('GET', '/api/courses/999');
    assert(notFoundRes.status === 404 && notFoundRes.data.error.includes('not found'), 'GET /api/courses/999 returns 404 for non-existent course');

    // Test 10: PUT /api/courses/:id - Update course status
    const updateRes = await request('PUT', '/api/courses/1', { status: 'In Progress' });
    assert(updateRes.status === 200 && updateRes.data.status === 'In Progress', 'PUT /api/courses/1 updates status to "In Progress"');

    // Test 11: GET /api/courses/stats - Enhancement statistics endpoint
    const statsRes = await request('GET', '/api/courses/stats');
    assert(
      statsRes.status === 200 &&
      statsRes.data.total_courses === 2 &&
      statsRes.data.by_status['In Progress'] === 2 &&
      statsRes.data.by_status['Not Started'] === 0 &&
      statsRes.data.by_status['Completed'] === 0,
      'GET /api/courses/stats returns accurate statistics'
    );

    // Test 12: DELETE /api/courses/:id - Delete course 1
    const deleteRes = await request('DELETE', '/api/courses/1');
    assert(deleteRes.status === 200 && deleteRes.data.course.id === 1, 'DELETE /api/courses/1 deletes course successfully');

    // Test 13: GET /api/courses/1 - Verify course 1 is deleted
    const verifyDeleteRes = await request('GET', '/api/courses/1');
    assert(verifyDeleteRes.status === 404, 'GET /api/courses/1 confirms course was deleted');

    // Test 14: Data persistence in courses.json
    const fileContent = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    assert(fileContent.length === 1 && fileContent[0].id === 2, 'Data correctly persisted to courses.json');

    console.log('\n==============================================');
    console.log(`📊 Test Summary: ${passed} passed, ${failed} failed`);
    console.log('==============================================\n');

    return failed === 0;
  } catch (err) {
    console.error('Fatal error during testing:', err);
    return false;
  } finally {
    // Restore or leave initial sample if empty
    if (originalData) {
      try { fs.writeFileSync(DATA_FILE, originalData, 'utf8'); } catch {}
    }
  }
}

// Run test with app server lifecycle
async function main() {
  let server;
  try {
    // Import and start app
    const app = require('./app');
    // If app already started listening inside app.js, give it 500ms
    await new Promise(r => setTimeout(r, 600));
    const success = await runTests();
    process.exit(success ? 0 : 1);
  } catch (err) {
    console.error('Test runner failure:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runTests };
