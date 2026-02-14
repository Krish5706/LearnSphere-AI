#!/bin/bash
# LearnSphere AI - Quick Setup for Roadmap Improvements

echo "🚀 LearnSphere AI - Roadmap Topic Extraction Setup"
echo "=================================================="
echo ""

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Creating .env file..."
    cp backend/.env.example backend/.env 2>/dev/null || echo "backend/.env file not found"
fi

# Check Node.js
echo "✅ Checking Node.js..."
node --version

# Check npm packages
echo "✅ Checking npm packages..."
cd backend
npm list @google/generative-ai 2>/dev/null | head -1

# Instructions for API key
echo ""
echo "📋 SETUP CHECKLIST:"
echo "=================="
echo ""
echo "1️⃣  Add GEMINI_API_KEY to backend/.env file:"
echo "    GEMINI_API_KEY=your_actual_api_key_here"
echo ""
echo "2️⃣  Get your API key from: https://makersuite.google.com/app/apikey"
echo ""
echo "3️⃣  Start the backend:"
echo "    cd backend"
echo "    npm start"
echo ""
echo "4️⃣  Start the frontend (in new terminal):"
echo "    cd forntend"
echo "    npm run dev"
echo ""
echo "5️⃣  Upload a PDF and select 'Roadmap' processing"
echo ""
echo "6️⃣  Check the Topics tab to see extracted topics!"
echo ""

# Check if GEMINI_API_KEY is set
if [ -z "$GEMINI_API_KEY" ]; then
    echo "⚠️  GEMINI_API_KEY environment variable not set"
    echo "📝 Add it to backend/.env file"
else
    echo "✅ GEMINI_API_KEY is set"
fi

echo ""
echo "📚 Documentation Files:"
echo "====================="
echo "- ROADMAP_IMPROVEMENTS.md  - Technical details of all improvements"
echo "- ROADMAP_USER_GUIDE.md    - User-friendly feature overview"
echo "- test-roadmap-improvements.js - Test script to validate improvements"
echo ""
