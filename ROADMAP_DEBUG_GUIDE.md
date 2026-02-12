# Roadmap Generation - Debug & Test Guide

## 🆘 Issue: Roadmap Not Created (Empty)

If you're seeing a roadmap with empty phases, follow this guide to identify and fix the issue.

---

## ✅ Quick Test

### 1. Test Roadmap Generation Locally

```bash
cd /path/to/LearnSphere-AI

# Test with a sample PDF
node test-roadmap.js uploads/sample.pdf beginner

# Or with intermediate level
node test-roadmap.js uploads/sample.pdf intermediate
```

This script will:
- Extract PDF content
- Generate enhanced roadmap
- Display all topics, phases, modules, and lessons
- Save full output to `roadmap-output-*.json`

### 2. Check Backend Logs

When generating via the web interface, watch the terminal for these logs:

```
========== ROADMAP GENERATION STARTED ==========
📚 Step 1: Extracting main topics from content...
✅ Found X topics: Topic1, Topic2, ...

🎯 Step 2: Generating learning phases for beginner level...
✅ Created 3 phases

🔗 Step 3: Building complete learning structure...
📚 Step 3.1: Processing Phase 1/3: Foundations & Basics...
📖 Generating... lessons...
✅ Built complete learning path

📊 Step 4: Assembling final roadmap structure...
✅ Roadmap generation complete!
========== ROADMAP GENERATION COMPLETE ==========
```

---

## 🔧 Common Issues & Solutions

### Issue 1: No Topics Extracted

**Symptom**: "Found 0 topics"

**Causes**:
1. PDF text extraction failed
2. PDF content is empty/corrupted
3. API rate limit exceeded

**Solutions**:
```bash
# Check if PDF can be read
node -e "
const pdf = require('pdf-parse');
const fs = require('fs');
const dataBuffer = fs.readFileSync('uploads/sample.pdf');
pdf(dataBuffer).then(data => {
  console.log('Pages:', data.numpages);
  console.log('Text length:', data.text.length);
  console.log('First 500 chars:', data.text.substring(0, 500));
}).catch(err => console.error('Error:', err.message));
"
```

### Issue 2: Phases are Empty

**Symptom**: Phases show but no modules/lessons inside

**Causes**:
1. Phase generation API call failed
2. Module/lesson generation timed out
3. JSON parsing error

**Solutions**:
- Check API rate limits (count API calls)
- Increase timeout in RoadmapService
- Check if GEMINI_MODEL is correct

### Issue 3: API Errors

**502/503 Errors**:
- Gemini API is down or rate-limited
- Check: https://status.developers.google.com/

**401 Unauthorized**:
- Invalid GEMINI_API_KEY in .env
- Solution: Regenerate API key from Google AI Studio

**429 Too Many Requests**:
- API quota exceeded
- Wait a few minutes before retrying
- Consider upgrading API plan

---

## 🔍 Deep Debugging

### Enable Verbose Logging

Edit `backend/services/roadmapService.js` and add more console.logs:

```javascript
async extractMainTopics(content) {
    const prompt = `...`;
    console.log('📝 Topics prompt:', prompt.substring(0, 300));
    
    const result = await this.model.generateContent(prompt);
    const textResponse = result.response.text();
    
    console.log('📥 API Response:', textResponse.substring(0, 500));
    console.log('📥 Full response length:', textResponse.length);
    
    // ... rest of code
}
```

### Check MongoDB Persistence

```bash
# Connect to MongoDB and check saved document
mongosh

# In mongo shell:
use learnsphere
db.documents.findOne({processingType: "roadmap"})

# Check if enhancedRoadmap is present and has data
db.documents.findOne({processingType: "roadmap"}).enhancedRoadmap
```

### Test Each Step Individually

Create a file `debug-steps.js`:

```javascript
require('dotenv').config();
const RoadmapService = require('./backend/services/roadmapService');
const fs = require('fs');

async function debugSteps() {
    const sampleContent = fs.readFileSync('sample-content.txt', 'utf8');
    const service = new RoadmapService(process.env.GEMINI_API_KEY);

    try {
        // Test 1: Extract topics
        console.log('Test 1: Extracting topics...');
        const topics = await service.extractMainTopics(sampleContent);
        console.log('✅ Topics:', topics);
        console.log('Topics count:', topics.length);

        if (topics.length === 0) {
            console.error('❌ No topics extracted!');
            return;
        }

        // Test 2: Generate phases
        console.log('\nTest 2: Generating phases...');
        const phases = await service.generatePhases(topics, 'beginner');
        console.log('✅ Phases:', phases);
        console.log('Phases count:', phases.length);

        if (phases.length === 0) {
            console.error('❌ No phases generated!');
            return;
        }

        // Test 3: Generate modules for first phase
        console.log('\nTest 3: Generating modules for first phase...');
        const modules = await service.generateModulesForPhase(phases[0], topics);
        console.log('✅ Modules:', modules);
        console.log('Modules count:', modules.length);

        // Test 4: Generate lessons for first module
        if (modules.length > 0) {
            console.log('\nTest 4: Generating lessons for first module...');
            const lessons = await service.generateLessonsForModule(modules[0], phases[0].phaseObjective, 3);
            console.log('✅ Lessons:', lessons);
            console.log('Lessons count:', lessons.length);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

debugSteps();
```

Then run:
```bash
node debug-steps.js
```

---

## 🚀 Performance Optimization

If generation is slow (>60 seconds):

### Reduce Content Size

Edit `roadmapService.js`:
```javascript
// Reduce from 20000 to 10000 characters
async extractMainTopics(content) {
    const prompt = `...${content.substring(0, 10000)}`;
```

### Reduce Module/Lesson Count

Edit `assembleCompleteLearningPath`:
```javascript
const lessonsPerModule = learnerLevel === 'beginner' ? 2 : 3; // Reduce from 3/4
```

### Use Faster Model

Edit `.env`:
```
GEMINI_MODEL=gemini-1.5-flash  # Faster than pro
```

---

## 📋 Checklist for Verification

- [ ] `.env` has valid `GEMINI_API_KEY`
- [ ] PDF file is valid and has readable text
- [ ] Backend console shows all log statements
- [ ] `enhancedRoadmap` field exists in MongoDB document
- [ ] `learningPath` array is not empty in `enhancedRoadmap`
- [ ] Each phase has `phaseId`, `phaseName`, `modules`
- [ ] Each module has `moduleId`, `moduleTitle`, `lessons`
- [ ] Each lesson has `lessonId`, `lessonTitle`

---

## 📞 Advanced Support

### Check API Response Directly

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');

require('dotenv').config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

async function testAPI() {
    const response = await model.generateContent(`
    Extract 5 topics from this text: "This is a simple test."
    
    Return as JSON array with fields: name, description, difficulty, importance
    Return ONLY JSON.
    `);
    
    console.log('Response:', response.response.text());
}

testAPI();
```

---

## 🎯 Expected Output Structure

When working correctly, you should see:

```json
{
  "enhancedRoadmap": {
    "completed": false,
    "mainTopics": [
      {
        "id": "topic_1",
        "name": "Topic Name",
        "description": "Description",
        "difficulty": "easy",
        "importance": "critical"
      }
    ],
    "learningPath": [
      {
        "phaseId": "phase_1",
        "phaseName": "Foundations",
        "modules": [
          {
            "moduleId": "mod_1_1",
            "moduleTitle": "Module Name",
            "lessons": [
              {
                "lessonId": "les_1",
                "lessonTitle": "Lesson Title",
                "lessonContent": "Content"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

## ✅ Troubleshooting Checklist

Run these in order:

1. ✅ Test PDF extraction: `node test-roadmap.js uploads/sample.pdf beginner`
2. ✅ Check console output for all generation steps
3. ✅ Verify `roadmap-output-*.json` has complete structure
4. ✅ Check MongoDB for saved document
5. ✅ Test frontend by refreshing roadmap page

---

**Last Updated**: February 12, 2026
**Status**: Troubleshooting Guide
