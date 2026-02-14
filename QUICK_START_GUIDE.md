# 🚀 Quick Start Guide - Improved Roadmap System

## Installation & Setup

### Step 1: Install Dependencies (if not already installed)
```bash
cd backend
npm install
```

The following packages are required:
- `@google/generative-ai` - For Gemini API calls
- `pdf-parse` - For PDF text extraction
- All other existing dependencies

### Step 2: Verify Environment Configuration
Check your `.env` file in the backend directory:
```bash
GEMINI_API_KEY=your_API_key_here
GEMINI_MODEL=gemini-1.5-pro
MONGODB_URI=your_mongodb_connection_string
PORT=3000
```

### Step 3: Start the Backend Server
```bash
npm start
# or
node server.js
```

You should see:
```
✅ MongoDB Connected: Study Vault is Ready
🚀 LearnSphere-AI Backend spinning on http://localhost:3000
```

## Testing the Improved Roadmap System

### Test 1: Using Postman/Curl

#### Generate Improved Roadmap
```bash
curl -X POST http://localhost:3000/api/v2/roadmap/generate-improved \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "documentId": "your-document-id",
    "learnerLevel": "beginner"
  }'
```

#### Expected Response (200 OK):
```json
{
  "message": "Improved roadmap generated successfully",
  "success": true,
  "roadmap": {
    "roadmapId": "roadmap_...",
    "title": "Main Topic from Your PDF",
    "mainTopic": "Specific topic extracted from document",
    "phases": [
      {
        "phaseId": "phase_1",
        "phaseName": "Foundation & Core Concepts",
        "modules": [
          {
            "moduleTitle": "Module 1: ...",
            "lessons": [
              {
                "lessonTitle": "Real title from your PDF",
                "mainContent": "Content from document..."
              }
            ]
          }
        ]
      }
    ],
    "statistics": { ... }
  }
}
```

### Test 2: Using Frontend

#### Step 1: Get Document ID
First, upload a PDF to get a document ID, then use it in your requests.

#### Step 2: Call the API
```javascript
// In your React component
const generateRoadmap = async () => {
  try {
    const response = await fetch('/api/v2/roadmap/generate-improved', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        documentId: documentId,
        learnerLevel: 'beginner'
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('Roadmap:', data.roadmap);
      // Display roadmap in UI
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
};
```

### Test 3: Verify Roadmap Structure

```javascript
// Check if roadmap was generated correctly
const checkRoadmap = async (documentId) => {
  const status = await fetch(`/api/v2/roadmap/${documentId}/status`, {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());

  console.log('✅ Has Roadmap:', status.hasRoadmap);
  console.log('📊 Phases:', status.structure.phases);
  console.log('📚 Modules:', status.structure.modules);
  console.log('📖 Lessons:', status.structure.lessons);
};
```

## Debugging Guide

### Issue 1: "Cannot extract main topic from PDF"

**Cause**: PDF doesn't have enough readable text content

**Solution**:
1. Verify PDF is text-based (not image-only scanned PDF)
2. Test PDF extraction:
   ```javascript
   const pdfParseService = require('./services/pdfParseService');
   const content = await pdfParseService.extractPdfText(pdfPath);
   console.log('Content length:', content.length);
   console.log('First 500 chars:', content.substring(0, 500));
   ```
3. If content is empty, the PDF needs OCR processing

### Issue 2: Gemini API errors

**Check logs for**:
- `🚨 Gemini API Error` - API call failed
- `API timeout after 30000ms` - Request took too long

**Solutions**:
- Verify GEMINI_API_KEY is correctly set
- Check API quota and billing
- Reduce PDF size (try under 5MB)
- Wait between multiple requests (rate limiting)

### Issue 3: Slow response time

**Normal times**:
- Small PDF (< 500KB): 30-45 seconds
- Medium PDF (500KB-2MB): 45-60 seconds
- Large PDF (2-5MB): 60-90 seconds

**To speed up**:
- Use `gemini-1.5-flash` model (faster, less accurate)
- Use smaller PDFs
- Increase timeout values if needed

### Issue 4: "No topics in phase" or empty modules

**Cause**: Generated topics are empty or invalid

**Debug**:
```javascript
// Check what topics are extracted
const topics = roadmap.phases[0]?.phaseTopics;
console.log('Topics:', topics);

// Check module structure
const modules = roadmap.phases[0]?.modules;
console.log('Modules:', modules);

// If empty, PDF might not have enough textual content
```

## File Locations Reference

```
LearnSphere-AI/
├── backend/
│   ├── services/
│   │   ├── improvedGeminiPrompts.js         # ✨ NEW
│   │   ├── improvedRoadmapService.js        # ✨ NEW
│   │   └── [other services]
│   ├── controllers/
│   │   ├── enhancedDocumentController.js    # ✨ NEW
│   │   └── [other controllers]
│   ├── routes/
│   │   ├── enhancedDocumentRoutes.js        # ✨ NEW
│   │   └── [other routes]
│   ├── server.js                            # ✏️ UPDATED (added routes)
│   └── [other backend files]
├── IMPROVED_ROADMAP_GUIDE.md                # 📖 NEW
├── QUICK_START_GUIDE.md                     # 📖 NEW (this file)
└── [other project files]
```

## Common Improvements You'll See

### Before (Old System):
```
Topic: "Learning Subject"  ❌ Generic
Content: "Learn key concepts" ❌ Generic
Key Points: ["Concept 1", "Concept 2"] ❌ Generic
```

### After (Improved System):
```
Topic: "Understanding Decision Trees in Machine Learning" ✅ Specific
Content: "Decision trees are tree-like models that recursively 
partition the feature space based on feature values. Each internal 
node represents a test on an attribute, each branch represents an 
outcome of the test, and each leaf node represents a class label. 
The algorithm uses information gain (entropy or Gini impurity) to 
select features that best split the data..." ✅ From your PDF
Key Points: [
  "Information Gain uses entropy to measure feature importance",
  "Gini impurity measures probability of misclassification",
  "Pruning prevents overfitting by removing unnecessary branches",
  "Maximum depth controls tree complexity"
] ✅ From your document
```

## Performance Monitoring

### Check System Load
```bash
# Monitor Gemini API costs
# Each request can take 20-90 seconds depending on PDF size

# Monitor MongoDB
# Roadmaps are stored in Document collection under 'roadmap' field
# Use MongoDB Compass to view stored roadmaps
```

### Monitor Response Times
```javascript
console.time('roadmap-generation');
const roadmap = await roadmapService.generateCompleteRoadmapImproved(content, learnerLevel);
console.timeEnd('roadmap-generation');
```

## Next Steps

1. **Test with your PDFs**
   - Upload a test PDF
   - Generate roadmap with `learnerLevel: 'beginner'`
   - Check output structure

2. **Integrate into UI**
   - Update frontend to call `/api/v2/roadmap/generate-improved`
   - Display roadmap phases, modules, lessons
   - Add loading indicators (API can take 60+ seconds)

3. **Add Features**
   - Regenerate with different learner levels
   - Export roadmap as JSON
   - Display roadmap statistics
   - Add learner progress tracking

4. **Optimize**
   - Cache generated roadmaps
   - Add rate limiting
   - Monitor API usage and costs
   - Implement progress indicators

## Example PDF Testing

**Good PDFs for testing**:
- Educational textbooks (CS, Math, Science)
- Course materials and syllabi
- Research papers
- Tutorial documentation
- Technical guides

**Sample test flow**:
1. Upload a 10-page educational PDF
2. Call `/api/v2/roadmap/generate-improved`
3. Wait 45-60 seconds
4. View generated roadmap with 3 phases
5. Check each phase has 2-3 modules
6. Verify each module has 3+ lessons
7. Confirm lessons have detailed content from PDF

## Support & Troubleshooting

### Still having issues?

1. **Check logs**: Look at backend console output for error messages
2. **Verify credentials**: Ensure GEMINI_API_KEY is valid
3. **Test API directly**: Call Gemini API separately to verify it works
4. **Check MongoDB**: Verify document is being saved correctly
5. **Review PDF**: Ensure PDF has readable text content

## Success Criteria

Your implementation is working correctly if:
- ✅ Roadmaps generate without errors
- ✅ Topics are extracted from your PDF (not generic)
- ✅ Lessons have detailed content from your document
- ✅ Key points are specific to your content
- ✅ Assessment questions reference document concepts
- ✅ Multiple learner levels create different roadmaps
- ✅ Roadmaps are saved to MongoDB
- ✅ All phases are unique and well-structured

---

**Happy Learning! 🎓**
