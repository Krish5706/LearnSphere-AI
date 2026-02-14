# 🎓 Improved Roadmap Generation System

## Overview

The LearnSphere-AI platform now includes an **Enhanced Roadmap Generation System** that creates dynamic, PDF-based learning paths. Everything is extracted from your actual documents using sophisticated AI prompts - **no more static or generic content**.

## What's New?

### ✨ Key Improvements

1. **Dynamic Topic Extraction** - All topics are extracted from your PDF content
2. **Intelligent Prompt Engineering** - Sophisticated Gemini prompts designed to extract real information
3. **Content-Based Generation** - Lessons, key points, and assessments are based on document content
4. **No Static Values** - Everything adapts to your specific document
5. **Comprehensive Modules** - Detailed lessons with examples, key points, and activities
6. **Phase-Based Learning** - Progressive learning paths (Foundation → Application → Mastery)

## File Structure

```
backend/services/
├── improvedGeminiPrompts.js       # 🆕 All prompt templates
├── improvedRoadmapService.js      # 🆕 Enhanced roadmap generation
backend/controllers/
├── enhancedDocumentController.js  # 🆕 API endpoints
backend/routes/
├── enhancedDocumentRoutes.js      # 🆕 Route definitions
```

## How It Works

### Step-by-Step Process

```
1. PDF Upload
   ↓
2. Extract Main Topic (from document)
   ↓
3. Extract Comprehensive Topics (3-4 phases)
   ↓
4. Generate Detailed Content (using actual PDF content)
   ↓
5. Generate Module Descriptions
   ↓
6. Generate Lessons with Real Examples
   ↓
7. Create Assessments
   ↓
8. Generate Learning Outcomes
   ↓
9. Return Complete Roadmap
```

## API Endpoints

### 1. Generate Improved Roadmap
**POST** `/api/v2/roadmap/generate-improved`

Request body:
```json
{
  "documentId": "your-document-id",
  "learnerLevel": "beginner"  // "beginner" | "intermediate" | "advanced"
}
```

Response:
```json
{
  "message": "Improved roadmap generated successfully",
  "success": true,
  "roadmap": {
    "roadmapId": "roadmap_...",
    "title": "Main Topic from PDF",
    "description": "Summary of content",
    "mainTopic": "Extracted main topic",
    "subTopics": ["Sub-topic 1", "Sub-topic 2"],
    "targetLevel": "difficulty_from_pdf",
    "phases": [
      {
        "phaseId": "phase_1",
        "phaseName": "Foundation & Core Concepts",
        "phaseDescription": "Topics in this phase",
        "phaseTopics": [...],
        "modules": [
          {
            "moduleId": "mod_p1_m1",
            "moduleTitle": "Module Title",
            "moduleDescription": "From document content",
            "lessons": [
              {
                "lessonId": "lesson_1",
                "lessonTitle": "Real title from document",
                "learningObjectives": [...],
                "mainContent": "3-4 paragraphs from document",
                "keyPoints": ["Actual key points"],
                "examples": [...],
                "practiceActivities": [...],
                "commonMisconceptions": [...]
              }
            ],
            "assessment": {
              "questions": [...]  // Quiz questions based on content
            },
            "learningOutcomes": [...]
          }
        ]
      }
    ],
    "statistics": {
      "totalPhases": 3,
      "totalModules": 6,
      "totalLessons": 18,
      "totalAssessmentQuestions": 50+,
      "estimatedTotalHours": 24,
      "contentSourced": "PDF-based dynamic extraction"
    }
  }
}
```

### 2. Get Roadmap Status
**GET** `/api/v2/roadmap/:documentId/status`

Response:
```json
{
  "hasRoadmap": true,
  "generatedAt": "2024-02-14T10:30:00Z",
  "method": "improved-dynamic-pdf-based",
  "structure": {
    "mainTopic": "Main subject",
    "phases": 3,
    "modules": 6,
    "lessons": 18
  }
}
```

### 3. Get Detailed Roadmap
**GET** `/api/v2/roadmap/:documentId/detailed`

Returns complete roadmap with all phases, modules, lessons, and assessments.

### 4. Get Phase Details
**GET** `/api/v2/roadmap/:documentId/phase/:phaseId`

Returns specific phase with all modules and topics.

### 5. Get Module Details
**GET** `/api/v2/roadmap/:documentId/phase/:phaseId/module/:moduleId`

Returns complete module with all lessons, assessments, and learning outcomes.

### 6. Regenerate Roadmap
**POST** `/api/v2/roadmap/:documentId/regenerate`

Request body:
```json
{
  "learnerLevel": "advanced"  // Change learner level and regenerate
}
```

### 7. Get Roadmap Statistics
**GET** `/api/v2/roadmap/:documentId/stats`

Returns statistics about the roadmap (phases, modules, lessons, questions, estimated hours, etc).

### 8. Export Roadmap as JSON
**GET** `/api/v2/roadmap/:documentId/export`

Downloads roadmap as a JSON file for backup or external use.

## Prompt Details

### Main Topic Extraction Prompt
The system analyzes the first 15,000 characters to identify:
- The EXACT main subject (not generic)
- Related sub-topics (2-3 related areas)
- Target expertise level (beginner/intermediate/advanced)
- Practical applications mentioned in document
- Core terminology and unique concepts

**Result:** No more "Learning Subject" - you get the actual topic from your PDF!

### Comprehensive Topics Extraction
For each phase, the system:
1. Extracts ACTUAL topic names from the document (not generic names like "Introduction")
2. Creates completely different topics for each phase
3. Includes 4-6 key terms per topic extracted from the document
4. References where each topic appears in the document
5. Marks topics as critical or important based on content

**Result:** Phase 1, 2, and 3 have different, document-specific topics!

### Topic Content Generation
For each topic, the system generates:
- 3-4 DETAILED paragraphs explaining concepts
- Key points directly from document
- Definitions of terms as used in the document
- Real examples from the document or logically derived
- Connections to other topics in the document
- Practical real-world applications

**Result:** Rich, document-grounded content - not templated!

### Lesson Generation
Each lesson includes:
- Specific descriptive title (from document content)
- Learning objectives tailored to topic
- Introduction explaining relevance
- 4-6 paragraphs of detailed content
- Key takeaway points
- Real examples with explanations
- 2-3 hands-on practice activities
- Common misconceptions and clarifications
- How it prepares for next topic

**Result:** Complete, ready-to-use lesson plans!

### Assessment Generation
Quiz questions are:
- Based on actual document content
- Using real terminology and examples
- Progressing from basic to higher-order thinking
- Unambiguous with ONE clear correct answer
- Include explanations referencing source material

**Result:** Meaningful assessments, not generic trivia!

## Usage Example

### Frontend (React)

```javascript
// 1. Generate improved roadmap
const response = await fetch('/api/v2/roadmap/generate-improved', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    documentId: documentId,
    learnerLevel: 'beginner'
  })
});

const data = await response.json();
const roadmap = data.roadmap;

// 2. Display phases
roadmap.phases.forEach(phase => {
  console.log(`Phase: ${phase.phaseName}`);
  
  // 3. Display modules
  phase.modules.forEach(module => {
    console.log(`  Module: ${module.moduleTitle}`);
    
    // 4. Display lessons
    module.lessons.forEach(lesson => {
      console.log(`    Lesson: ${lesson.lessonTitle}`);
      console.log(`    Content: ${lesson.mainContent}`);
      console.log(`    Key Points:`, lesson.keyPoints);
    });
  });
});

// 5. Get statistics
const statsResponse = await fetch(`/api/v2/roadmap/${documentId}/stats`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const stats = await statsResponse.json();
console.log(`Total Lessons: ${stats.stats.totalLessons}`);
```

## Configuration

### Environment Variables
```bash
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-1.5-pro  # or gemini-1.5-flash for faster processing
MONGODB_URI=your_mongodb_connection_string
PORT=3000
```

## Performance Tips

1. **PDF Size**: Keep PDFs under 10MB for best results
2. **Content Length**: PDFs should have at least 100 characters of readable text
3. **API Rate Limiting**: Gemini API has rate limits - space out bulk generations
4. **Caching**: Generated roadmaps are saved to database - no need to regenerate
5. **Learner Levels**:
   - `beginner`: 3 phases, simpler topics
   - `intermediate`: 4 phases, moderate complexity
   - `advanced`: 4 phases, complex topics

## Troubleshooting

### "Cannot extract main topic from PDF"
- Ensure PDF has at least 100 characters of readable text
- Check if PDF is corrupted or has only images
- Try uploading a different PDF

### "Gemini API timeout"
- Your PDF might be too large or complex
- Try reducing PDF file size
- Wait a few minutes and retry

### "Empty roadmap structure"
- PDF doesn't have enough educational content
- Try with more comprehensive educational material
- Check if PDF extracts text properly (not image-only PDF)

### "No topics in phase"
- Document might not cover enough distinct topics
- PDF might be too short
- Try with more detailed source material

## Best Practices

1. **Use Quality PDFs**: Use OCR-processed PDFs, not scanned images
2. **Structured Content**: PDFs with clear sections/chapters work best
3. **Domain-Specific Material**: Best results with educational/technical documents
4. **Reasonable Size**: 5-20 pages usually generates optimal roadmaps
5. **Educational Focus**: Works best with learning/teaching materials

## Future Enhancements

- [ ] Multi-language support
- [ ] Custom phase names
- [ ] Interactive roadmap builder
- [ ] Export to multiple formats (PDF, HTML, EPUB)
- [ ] Collaborative roadmap editing
- [ ] Progress tracking integration
- [ ] Adaptive learning paths based on quiz performance

## Support

For issues or feature requests:
1. Check troubleshooting section above
2. Verify GEMINI_API_KEY is configured
3. Check MongoDB connection
4. Review server logs for detailed error messages
5. Test with a known-good PDF

---

**Note**: This system replaces the older static roadmap generation with a fully dynamic, AI-powered approach that adapts to your specific document content. All topics, lessons, and assessments are extracted from and based on your uploaded PDFs.
