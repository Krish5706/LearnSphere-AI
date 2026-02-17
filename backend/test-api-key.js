/**
 * API Key Diagnostic Script
 * Run this to test if your GEMINI_API_KEY is valid
 * 
 * Usage: node test-api-key.js
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs');

console.log('='.repeat(60));
console.log('🔍 GEMINI API KEY DIAGNOSTIC');
console.log('='.repeat(60));

// Try to load .env from different locations
const envPaths = [
    path.join(__dirname, '.env'),
    path.join(__dirname, '../.env'),
    path.join(process.cwd(), '.env'),
    'd:/Github/LearnSphere-AI/backend/.env'
];

console.log('\n📁 Checking .env file locations:');
for (const envPath of envPaths) {
    const exists = fs.existsSync(envPath);
    console.log(`   ${exists ? '✅' : '❌'} ${envPath}`);
    if (exists) {
        console.log(`      File exists! Loading from: ${envPath}`);
        require('dotenv').config({ path: envPath });
        break;
    }
}

console.log('\n📝 Current environment variables:');
console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'SET (' + process.env.GEMINI_API_KEY.length + ' chars)' : 'NOT SET'}`);
console.log(`   GEMINI_MODEL: ${process.env.GEMINI_MODEL || 'NOT SET (using default)'}`);

// Check if API key exists
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.log('\n❌ GEMINI_API_KEY is NOT set in environment variables!');
    console.log('   Please add GEMINI_API_KEY=your_key_here to backend/.env file');
    console.log('\n   To get an API key:');
    console.log('   1. Go to https://aistudio.google.com/app/apikey');
    console.log('   2. Create a new API key');
    console.log('   3. Copy it to your .env file');
    process.exit(1);
}

console.log('\n✅ API Key is present in environment');
console.log(`   Key length: ${apiKey.length} characters`);
console.log(`   Key prefix: ${apiKey.substring(0, 4)}...`);

// Check key format
if (!apiKey.startsWith('AI')) {
    console.log('\n⚠️  WARNING: API key does not start with "AI" - this might be an invalid key');
}

// Try to initialize the AI
console.log('\n🚀 Testing API key with Google Generative AI...');

try {
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log('   ✅ GoogleGenerativeAI initialized successfully');
    
    // Try to get a model
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    console.log(`   📦 Using model: ${modelName}`);
    
    const model = genAI.getGenerativeModel({ model: modelName });
    console.log('   ✅ Model retrieved successfully');
    
    // Try a simple request
    console.log('\n📤 Sending test request to Gemini API...');
    
    model.generateContent('Say "Hello" if you receive this message')
        .then(result => {
            console.log('   ✅ API request successful!');
            console.log('\n' + '='.repeat(60));
            console.log('🎉 YOUR API KEY IS WORKING CORRECTLY!');
            console.log('='.repeat(60));
            console.log('\nIf you still get "Invalid API key configuration" errors:');
            console.log('1. Restart your backend server');
            console.log('2. Clear any cached environment variables');
            console.log('3. Check if there are multiple .env files');
            process.exit(0);
        })
        .catch(err => {
            console.error('\n❌ API Request Failed:');
            console.error('   Error:', err.message);
            
            if (err.message.includes('API_KEY_INVALID') || err.message.includes('API key not valid')) {
                console.error('\n🔴 INVALID API KEY');
                console.error('   Your API key is invalid or expired.');
                console.error('   Get a new key from: https://aistudio.google.com/app/apikey');
            } else if (err.message.includes('PERMISSION_DENIED') || err.message.includes('permission')) {
                console.error('\n🔴 PERMISSION DENIED');
                console.error('   Your API key does not have access to this model.');
                console.error('   Try using "gemini-1.5-flash" model instead.');
            } else if (err.message.includes('quota') || err.message.includes('429')) {
                console.error('\n🔴 QUOTA EXCEEDED');
                console.error('   You have exceeded your API quota.');
                console.error('   Wait until tomorrow or get a new API key.');
            } else if (err.message.includes('network') || err.message.includes('fetch')) {
                console.error('\n🔴 NETWORK ERROR');
                console.error('   Cannot connect to Google API.');
                console.error('   Check your internet connection.');
            }
            
            process.exit(1);
        });
        
} catch (err) {
    console.error('\n❌ Initialization Failed:');
    console.error('   Error:', err.message);
    
    if (err.message.includes('API_KEY_INVALID')) {
        console.error('\n🔴 The API key format is invalid.');
        console.error('   Make sure you copied the full key correctly.');
    }
    
    process.exit(1);
}
