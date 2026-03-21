#!/usr/bin/env node

/**
 * 🧪 PAYMENT FLOW E2E TEST
 * Tests: User Registration → Login → Payment Initiation → OTP Verification
 * 
 * Run: node test-payment-flow.js
 */

require('dotenv').config();
const http = require('http');

// HTTP request helper
function httpRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: `/api${path}`,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (token) {
            options.headers.Authorization = `Bearer ${token}`;
        }
        
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: body ? JSON.parse(body) : {}
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: { raw: body }
                    });
                }
            });
        });
        
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

// Test data
const testUser = {
    name: 'Test Payment User',
    email: `test_${Date.now()}@learnsphere.local`,
    password: 'TestPayment123'
};

let testState = {
    token: null,
    userId: null,
    credits: null,
    paymentSessionId: null,
    otp: null,
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    blue: '\x1b[34m',
    gray: '\x1b[90m'
};

function log(msg, color = 'reset') {
    console.log(colors[color] + msg + colors.reset);
}

function logSection(title) {
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(`  ${title}`, 'cyan');
    log(`${'='.repeat(60)}\n`, 'cyan');
}

function logSuccess(title, obj = null) {
    log(`✅ ${title}`, 'green');
    if (obj) log(JSON.stringify(obj, null, 2), 'gray');
}

function logError(title, obj = null) {
    log(`❌ ${title}`, 'red');
    if (obj) log(JSON.stringify(obj, null, 2), 'gray');
}

function logInfo(msg) {
    log(`ℹ️  ${msg}`, 'blue');
}

async function test(name, fn) {
    try {
        log(`\n→ ${name}...`, 'yellow');
        await fn();
    } catch (err) {
        logError(`Test failed: ${err.message}`);
        process.exit(1);
    }
}

// TEST FUNCTIONS

async function testRegister() {
    const res = await httpRequest('POST', '/auth/register', testUser);
    
    if (res.status !== 201) {
        throw new Error(`Expected 201, got ${res.status}: ${res.data?.message}`);
    }
    
    testState.token = res.data.token;
    testState.userId = res.data.user.id;
    testState.credits = res.data.user.credits;
    
    logSuccess('User registered', {
        email: res.data.user.email,
        credits: res.data.user.credits,
        token: res.data.token.substring(0, 20) + '...'
    });
}

async function testLogin() {
    const res = await httpRequest('POST', '/auth/login', {
        email: testUser.email,
        password: testUser.password
    });
    
    if (res.status !== 200) {
        throw new Error(`Expected 200, got ${res.status}: ${res.data?.message}`);
    }
    
    testState.token = res.data.token;
    
    logSuccess('User logged in', {
        email: res.data.user.email,
        credits: res.data.user.credits
    });
}

async function testGetMe() {
    const res = await httpRequest('GET', '/auth/me', null, testState.token);
    
    if (res.status !== 200) {
        throw new Error(`Expected 200, got ${res.status}: ${res.data?.message}`);
    }
    
    logSuccess('User profile fetched', {
        name: res.data.name,
        email: res.data.email,
        credits: res.data.credits,
        isSubscribed: res.data.isSubscribed
    });
}

async function testPaymentInitiate() {
    const planKey = 'premium_pro';
    
            otp: testState.otp
        },
        testState.token
    );
    
    if (res.status !== 200) {
        throw new Error(`Expected 200, got ${res.status}: ${res.data?.message}`);
    }
    
    logSuccess('Payment confirmed', {
        planName: res.data.upgrade.planName,
        creditsAdded: res.data.upgrade.creditsAdded,
        previousCredits: res.data.upgrade.previousCredits,
        currentCredits: res.data.upgrade.currentCredits,
        transactionId: res.data.payment.transactionId
    });
    
    logSuccess('User updated after payment', {
        email: res.data.user.email,
        credits: res.data.user.credits,
        isSubscribed: res.data.user.isSubscribed
    });
}

async function testInvalidOtp() {
    const res = await httpRequest('POST', '/auth/demo-payment/initiate',
        {
            planKey: 'starter_plus',
            paymentMethod: 'upi',
            paymentDetails: { upiId: 'test@upi' }
        },
        testState.token
    );
    
    if (res.status !== 200) {
        throw new Error(`Payment initiation failed: ${res.data?.message}`);
    }
    
    const newSessionId = res.data.paymentSessionId;
    
    // Try with wrong OTP
    const confirmRes = await httpRequest('POST', '/auth/demo-payment/confirm',
        {
            paymentSessionId: newSessionId,
            otp: '000000'
        },
        testState.token
    );
    
    if (confirmRes.status === 400 && confirmRes.data?.message?.includes('OTP')) {
        logSuccess('Invalid OTP properly rejected', { message: confirmRes.data.message });
    } else {
        throw new Error('Invalid OTP should be rejected but got: ' + confirmRes.status);
    }
}

async function testUnauthorizedAccess() {
    const res = await httpRequest('GET', '/auth/me', null, 'invalid_token');
    
    if (res.status === 401) {
        logSuccess('Unauthorized request properly rejected', { message: res.data?.message });
    } else {
        throw new Error('Should reject invalid token but got: ' + res.status);
    }
}

// MAIN TEST RUNNER

async function runTests() {
    logSection('🎯 PAYMENT & EMAIL OTP INTEGRATION TEST');
    
    logInfo(`Testing with email: ${testUser.email}`);
    logInfo(`Server: http://localhost:3000`);
    logInfo(`SMTP: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
    
    try {
        // Basic auth tests
        logSection('AUTHENTICATION');
        await test('Register new user', testRegister);
        await test('Login with credentials', testLogin);
        await test('Get current user profile', testGetMe);
        
        // Payment flow tests
        logSection('PAYMENT FLOW');
        await test('Initiate payment (Credit Card)', testPaymentInitiate);
        
        if (testState.otp) {
            logInfo('Using demo OTP for testing (Ethereal fallback mode)');
            await test('Confirm payment with OTP', testPaymentConfirm);
        } else {
            logInfo('Real SMTP mode: Check email inbox for 6-digit OTP');
            logInfo('To complete test: Replace testState.otp with received OTP');
        }
        
        // Error handling tests
        logSection('ERROR HANDLING');
        await test('Reject invalid OTP', testInvalidOtp);
        await test('Reject unauthorized access', testUnauthorizedAccess);
        
        // Final report
        logSection('TEST SUMMARY');
        logSuccess('All tests passed! ✨', {
            'Registration': '✅',
            'Login': '✅',
            'Get Profile': '✅',
            'Payment Initiation': '✅',
            'Payment Confirmation': testState.otp ? '✅' : '⏳ (manual)',
            'Error Handling': '✅',
            'Security': '✅'
        });
        
        logInfo('Frontend is ready to test premium upgrade flow!');
        logInfo('Open http://localhost:5173 and click "Upgrade to Premium"');
        
    } catch (err) {
        logSection('TEST FAILED');
        logError(err.message);
        process.exit(1);
    }
}

// Run tests
runTests();
