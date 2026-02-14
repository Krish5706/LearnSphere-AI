#!/usr/bin/env node

/**
 * ============================================
 * LearnSphere-AI Authentication Test Script
 * ============================================
 * 
 * This script tests the complete authentication flow:
 * 1. MongoDB connection
 * 2. User Registration
 * 3. User Login
 * 4. Token Validation
 * 
 * Run: node auth-test.js
 */

const axios = require('axios');
const crypto = require('crypto');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const TEST_EMAIL = `test-${Date.now()}@learnsphere.dev`;
const TEST_PASSWORD = 'testpass12345';
const TEST_NAME = 'Test User';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.bold}${colors.blue}=== ${msg} ===${colors.reset}\n`)
};

// Test State
let authToken = null;
let testResults = {
  total: 0,
  passed: 0,
  failed: 0
};

// Helper to make API calls
const apiCall = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status,
      fullError: error.response?.data
    };
  }
};

// Test helper
const test = async (name, fn) => {
  testResults.total++;
  try {
    await fn();
    log.success(name);
    testResults.passed++;
  } catch (error) {
    log.error(`${name}: ${error.message}`);
    testResults.failed++;
  }
};

// ============================================
// TEST SUITE
// ============================================

const main = async () => {
  log.title('LearnSphere-AI Auth Test Suite');

  log.info(`Test Email: ${TEST_EMAIL}`);
  log.info(`Test Password: ${TEST_PASSWORD}`);
  log.info(`API Base URL: ${API_BASE_URL}\n`);

  // Step 1: Test Backend Connection
  log.title('Step 1: Backend Connection Test');
  
  await test('Backend is reachable', async () => {
    const result = await apiCall('GET', '/auth/me');
    // Expected to fail (not logged in), but server should respond
    if (result.status === 401 || result.status !== undefined) {
      throw new Error('Server is reachable');
    }
  });

  // Step 2: Registration Tests
  log.title('Step 2: User Registration Tests');

  let registrationToken = null;

  await test('Register new user with valid credentials', async () => {
    const result = await apiCall('POST', '/auth/register', {
      name: TEST_NAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (!result.success) {
      throw new Error(`Registration failed: ${result.error}`);
    }

    if (!result.data.token) {
      throw new Error('Token not returned from registration');
    }

    if (!result.data.user) {
      throw new Error('User data not returned from registration');
    }

    registrationToken = result.data.token;
    authToken = result.data.token;
  });

  await test('Registration returns correct user fields', async () => {
    if (!registrationToken) {
      throw new Error('No registration token available');
    }

    const result = await apiCall('POST', '/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    const user = result.data.user;
    const requiredFields = ['id', 'name', 'email', 'credits', 'isSubscribed'];
    
    for (const field of requiredFields) {
      if (!(field in user)) {
        throw new Error(`Missing user field: ${field}`);
      }
    }
  });

  await test('Cannot register with same email twice', async () => {
    const result = await apiCall('POST', '/auth/register', {
      name: 'Another User',
      email: TEST_EMAIL,
      password: 'anotherpass123'
    });

    if (result.success) {
      throw new Error('Should not allow duplicate email registration');
    }

    if (!result.error.includes('already exists') && !result.error.includes('duplicate')) {
      throw new Error(`Unexpected error: ${result.error}`);
    }
  });

  // Step 3: Login Tests
  log.title('Step 3: User Login Tests');

  let loginToken = null;

  await test('Login with correct credentials', async () => {
    const result = await apiCall('POST', '/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (!result.success) {
      throw new Error(`Login failed: ${result.error}`);
    }

    if (!result.data.token) {
      throw new Error('Token not returned from login');
    }

    loginToken = result.data.token;
    authToken = result.data.token;
  });

  await test('Login returns correct response structure', async () => {
    if (!loginToken) {
      throw new Error('No login token available');
    }

    const result = await apiCall('POST', '/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (result.data.status !== 'success') {
      throw new Error('Response status is not "success"');
    }

    if (!result.data.token) {
      throw new Error('Token missing from response');
    }

    if (!result.data.user) {
      throw new Error('User data missing from response');
    }
  });

  await test('Login fails with wrong password', async () => {
    const result = await apiCall('POST', '/auth/login', {
      email: TEST_EMAIL,
      password: 'wrongpassword123'
    });

    if (result.success) {
      throw new Error('Should not allow login with wrong password');
    }

    if (!result.error.includes('Invalid') && !result.error.includes('incorrect')) {
      throw new Error(`Unexpected error: ${result.error}`);
    }
  });

  await test('Login fails with non-existent email', async () => {
    const result = await apiCall('POST', '/auth/login', {
      email: 'nonexistent@test.com',
      password: 'somepassword123'
    });

    if (result.success) {
      throw new Error('Should not allow login with non-existent email');
    }

    if (!result.error.includes('Invalid') && !result.error.includes('not found')) {
      throw new Error(`Unexpected error: ${result.error}`);
    }
  });

  // Step 4: Token Validation Tests
  log.title('Step 4: Token Validation Tests');

  await test('Token can be used for authenticated requests', async () => {
    authToken = loginToken;
    const result = await apiCall('GET', '/auth/me');

    if (!result.success) {
      throw new Error(`Failed to fetch authenticated endpoint: ${result.error}`);
    }

    if (!result.data.email === TEST_EMAIL) {
      throw new Error('User data does not match logged-in user');
    }
  });

  await test('Invalid token is rejected', async () => {
    authToken = 'invalid.token.here';
    const result = await apiCall('GET', '/auth/me');

    if (result.success) {
      throw new Error('Invalid token should be rejected');
    }

    if (result.status !== 401) {
      throw new Error(`Expected 401 status, got ${result.status}`);
    }
  });

  // Step 5: Validation Tests
  log.title('Step 5: Input Validation Tests');

  await test('Registration rejects missing name', async () => {
    const result = await apiCall('POST', '/auth/register', {
      email: `test-${Date.now()}@test.com`,
      password: 'testpass123'
      // name missing
    });

    if (result.success) {
      throw new Error('Should reject registration without name');
    }
  });

  await test('Registration rejects short password', async () => {
    const result = await apiCall('POST', '/auth/register', {
      name: 'Test',
      email: `test-${Date.now()}@test.com`,
      password: 'short' // Less than 8 characters
    });

    if (result.success) {
      throw new Error('Should reject password shorter than 8 characters');
    }

    if (!result.error.includes('at least 8') && !result.error.includes('8 character')) {
      throw new Error(`Unexpected error: ${result.error}`);
    }
  });

  await test('Registration rejects invalid email', async () => {
    const result = await apiCall('POST', '/auth/register', {
      name: 'Test',
      email: 'not-an-email',
      password: 'testpass123'
    });

    if (result.success) {
      throw new Error('Should reject invalid email format');
    }
  });

  // Results Summary
  log.title('Test Results Summary');

  const percentage = Math.round((testResults.passed / testResults.total) * 100);
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  console.log(`Success Rate: ${percentage}%\n`);

  if (testResults.failed === 0) {
    log.success('✨ All tests passed! Authentication system is working correctly.');
    process.exit(0);
  } else {
    log.error('🔧 Some tests failed. See details above.');
    process.exit(1);
  }
};

// Run tests
main().catch((err) => {
  log.error(`Unexpected error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
