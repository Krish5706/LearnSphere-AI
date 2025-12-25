/**
 * Utility script to list available Gemini models for your API key
 * Run: node list-models.js
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("❌ GEMINI_API_KEY not found in .env file");
    process.exit(1);
}

async function listModels() {
    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        
        // Try to get available models by attempting to use common ones
        const commonModels = [
            "gemini-3-pro-preview",
            "gemini-3-flash-preview",
            "gemini-2.5-flash",
            "gemini-2.0-flash-exp",
            "gemini-1.5-pro",
            "gemini-1.5-flash",
            "gemini-pro",
            "gemini-pro-vision"
        ];

        console.log("🔍 Testing available models...\n");

        for (const modelName of commonModels) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                // Try a simple test call
                await model.generateContent("test");
                
                console.log(`✅ ${modelName} - AVAILABLE`);
            } catch (err) {
                if (err.message && err.message.includes("404")) {
                    console.log(`❌ ${modelName} - NOT FOUND`);
                } else if (err.message && err.message.includes("API key")) {
                    console.log(`⚠️  ${modelName} - API KEY ERROR`);
                } else {
                    console.log(`⚠️  ${modelName} - ERROR: ${err.message.substring(0, 50)}...`);
                }
            }
        }

        console.log("\n💡 Use the AVAILABLE model name in your GEMINI_MODEL env variable");
        console.log("💡 Gemini 3 models have enhanced reasoning capabilities built-in");
    } catch (error) {
        console.error("Error:", error.message);
    }
}

listModels();

