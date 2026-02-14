# 🏗️ System Architecture & Visual Overview

## Complete System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1. User uploads PDF from Document page                  │   │
│  │ 2. User clicks "Generate Improved Roadmap"              │   │
│  │ 3. Selects learner level (beginner/intermediate/adv)   │   │
│  │ 4. Displays roadmap with phases, modules, lessons       │   │
│  └──────────────────────────────────────────────────────────┘   │
└────________________↑────────────────────────────────────────────┘
                     │
         HTTP POST /api/v2/roadmap/generate-improved
         + { documentId, learnerLevel }
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                ENHANCED API LAYER (Express)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ enhancedDocumentController.js                            │   │
│  │ ├─ generateImprovedRoadmap()                            │   │
│  │ ├─ getRoadmapStatus()                                   │   │
│  │ ├─ getDetailedRoadmap()                                 │   │
│  │ ├─ getRoadmapPhase()                                    │   │
│  │ ├─ getModuleDetails()                                   │   │
│  │ └─ (6 more endpoints for stats, regenerate, export)    │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
                     │
        Validates document ownership
        Checks GEMINI_API_KEY configured
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                  PDF EXTRACTION LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ pdfParseService.js                                       │   │
│  │ ├─ extractPdfText()     → Raw text content              │   │
│  │ ├─ extractPdfToJson()   → Structured metadata + text    │   │
│  │ └─ getPdfFileSize()     → Size validation               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  OUTPUT: HTML document.pdf → Readable text (30,000+ chars)     │
└─────────────────────────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│              IMPROVED ROADMAP SERVICE (Main Logic)               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ improvedRoadmapService.js                               │   │
│  │                                                          │   │
│  │ STEP 1: Preprocess Content                              │   │
│  │  └─ preprocessContent() → Statistics, sections          │   │
│  │                                                          │   │
│  │ STEP 2: Extract Main Topic                              │   │
│  │  └─ extractMainTopicImproved()                          │   │
│  │      • Calls Gemini with main topic prompt              │   │
│  │      ► Returns: { mainTopic, subTopics, targetLevel }   │   │
│  │                                                          │   │
│  │ STEP 3: Extract Comprehensive Topics                    │   │
│  │  └─ extractComprehensiveTopicsImproved()                │   │
│  │      • Phase 1: 5-6 foundational topics                 │   │
│  │      • Phase 2: 5-6 intermediate topics (different)     │   │
│  │      • Phase 3: 5-6 advanced topics (different)         │   │
│  │      ► Returns: { phases: { 1: [...], 2: [...], ... }} │   │
│  │                                                          │   │
│  │ STEP 4: Generate Topic Content                          │   │
│  │  └─ generateTopicContentImproved()                      │   │
│  │      • For each topic:                                  │   │
│  │        - Detailed paragraphs (from PDF content)         │   │
│  │        - Key points (specific to document)              │   │
│  │        - Definitions (in document context)              │   │
│  │        - Real examples (from document)                  │   │
│  │        - Practical applications                         │   │
│  │                                                          │   │
│  │ STEP 5: Generate Modules                                │   │
│  │  └─ For each phase, create 2-3 modules                  │   │
│  │      • Each module covers subset of phase topics        │   │
│  │                                                          │   │
│  │ STEP 6: Generate Lessons                                │   │
│  │  └─ generateDetailedLessonsImproved()                   │   │
│  │      • 3 lessons per module                             │   │
│  │      • Specific titles (from document)                  │   │
│  │      • Learning objectives                              │   │
│  │      • 4-6 paragraphs detailed content                  │   │
│  │      • Key points (from document)                       │   │
│  │      • Examples with explanations                       │   │
│  │      • Practice activities                              │   │
│  │      • Common misconceptions                            │   │
│  │                                                          │   │
│  │ STEP 7: Generate Assessments                            │   │
│  │  └─ generateModuleAssessmentImproved()                  │   │
│  │      • 8-10 quiz questions per module                   │   │
│  │      • Based on document content                        │   │
│  │      • Progressive difficulty                           │   │
│  │      • Detailed explanations                            │   │
│  │                                                          │   │
│  │ STEP 8: Generate Learning Outcomes                      │   │
│  │  └─ generateLearningOutcomesImproved()                  │   │
│  │      • 4-5 measurable outcomes per module               │   │
│  │      • Using Bloom's taxonomy                           │   │
│  │                                                          │   │
│  │ STEP 9: Assemble Complete Roadmap                       │   │
│  │  └─ Returns: { phases: [...], statistics: {...} }      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│             PROMPT ENGINE (Sophisticated Prompts)                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ improvedGeminiPrompts.js                                │   │
│  │                                                          │   │
│  │ Each prompt is highly specialized:                       │   │
│  │                                                          │   │
│  │ ✓ getMainTopicPrompt()                                  │   │
│  │   → Extracts main subject + sub-topics + level           │   │
│  │                                                          │   │
│  │ ✓ getComprehensiveTopicsPrompt()                        │   │
│  │   → Extracts unique topics per phase                     │   │
│  │                                                          │   │
│  │ ✓ generateTopicContentPrompt()                          │   │
│  │   → Creates detailed content for each topic              │   │
│  │                                                          │   │
│  │ ✓ generateDetailedLessonPrompt()                        │   │
│  │   → Creates complete lesson plan                         │   │
│  │                                                          │   │
│  │ ✓ generateQuizQuestionsPrompt()                         │   │
│  │   → Creates test questions with explanations             │   │
│  │                                                          │   │
│  │ ✓ generateModuleOutcomesPrompt()                        │   │
│  │   → Creates measurable learning outcomes                 │   │
│  │                                                          │   │
│  │ + 2 more specialized prompts                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                     │
        Each prompt includes source content (8-30k chars)
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│              GEMINI API INTEGRATION (Google AI)                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ @google/generative-ai library                           │   │
│  │                                                          │   │
│  │ For each prompt:                                         │   │
│  │  1. Send prompt + document content to Gemini API         │   │
│  │  2. Wait for response (20-90 seconds)                    │   │
│  │  3. Parse JSON from response                             │   │
│  │  4. Validate and structure output                        │   │
│  │  5. Return structured data                               │   │
│  │                                                          │   │
│  │ Timeout: 30-90 seconds per API call                      │   │
│  │ Total Calls: ~10 per roadmap generation                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                     │
    All responses extracted and restructured for next steps
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                  DATA AGGREGATION LAYER                          │
│                                                                   │
│  Combine all components into complete roadmap:                   │
│  ✓ Main topic + sub-topics                                       │
│  ✓ 3 phases with unique topics each                              │
│  ✓ 2-3 modules per phase                                         │
│  ✓ 3 lessons per module with detailed content                    │
│  ✓ 8-10 quiz questions per module                                │
│  ✓ 4-5 learning outcomes per module                              │
│  ✓ Statistics and metadata                                       │
│                                                                   │
│  Final Structure: Roadmap Object (see next page)                 │
└─────────────────────────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                   DATABASE PERSISTENCE                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ MongoDB - Document Collection                           │   │
│  │                                                          │   │
│  │ Update Document with roadmap:                            │   │
│  │  {                                                       │   │
│  │    _id: ObjectId,                                        │   │
│  │    fileName: "document.pdf",                             │   │
│  │    filePath: "/uploads/...",                             │   │
│  │    roadmap: { 🆕                                         │   │
│  │      phases: [...],                                      │   │
│  │      statistics: {...}                                   │   │
│  │    },                                                    │   │
│  │    roadmapGeneratedAt: Date,                             │   │
│  │    roadmapGenerationMethod: "improved-dynamic-pdf-based" │   │
│  │  }                                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                   API RESPONSE LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ HTTP 200 OK                                             │   │
│  │ {                                                        │   │
│  │   "success": true,                                       │   │
│  │   "message": "Improved roadmap generated successfully",  │   │
│  │   "roadmap": { complete roadmap object },               │   │
│  │   "documentId": "...",                                   │   │
│  │   "isEmpty": false                                       │   │
│  │ }                                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                  FRONTEND DISPLAY (React)                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Display Complete Learning Roadmap:                       │   │
│  │                                                          │   │
│  │ ✓ Main Topic: [title]                                   │   │
│  │ ✓ Description: [summary]                                │   │
│  │ ✓ Statistics: [phases, modules, lessons, hours]          │   │
│  │                                                          │   │
│  │ ✓ Phase 1: [name]                                       │   │
│  │    ├─ Module 1: [title]                                 │   │
│  │    │  ├─ Lesson 1: [title]                              │   │
│  │    │  │  ├─ Content...                                  │   │
│  │    │  │  ├─ Key Points...                               │   │
│  │    │  │  ├─ Examples...                                 │   │
│  │    │  │  └─ Activities...                               │   │
│  │    │  ├─ Lesson 2...                                    │   │
│  │    │  ├─ Lesson 3...                                    │   │
│  │    │  └─ Quiz: [8-10 questions]                         │   │
│  │    │                                                    │   │
│  │    └─ Module 2...                                       │   │
│  │                                                          │   │
│  │ ✓ Phase 2: [similar structure]                          │   │
│  │ ✓ Phase 3: [similar structure]                          │   │
│  │                                                          │   │
│  │ Actions Available:                                       │   │
│  │  • View detailed lesson content                          │   │
│  │  • Take quiz for each module                             │   │
│  │  • Track progress                                        │   │
│  │  • Regenerate with different level                       │   │
│  │  • Export roadmap as JSON/PDF                            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                     │
                     ↓
          👤 Learner Studies Roadmap
          📊 Progress is Tracked
          ✅ Goals are Achieved
```

---

## Complete Roadmap Data Structure

```javascript
{
  // Metadata
  "roadmapId": "roadmap_1707832200000",
  "title": "Machine Learning Fundamentals",
  "description": "Comprehensive learning path for ML basics...",
  "mainTopic": "Machine Learning Fundamentals",
  "subTopics": ["Supervised Learning", "Unsupervised Learning"],
  "targetLevel": "intermediate",
  "learnerLevel": "beginner",
  "generatedAt": "2025-02-14T10:30:00Z",
  
  // Learning Phases
  "phases": [
    {
      // Phase 1: Foundation
      "phaseId": "phase_1",
      "phaseName": "Foundation & Core Concepts",
      "phaseDescription": "Learn fundamentals...",
      "phaseTopics": [
        {
          "id": "topic_p1_1",
          "name": "Supervised Learning Fundamentals",
          "description": "Learn about labeled data and models...",
          "keyTerms": ["labeled_data", "features", "labels", "training"],
          "importance": "critical",
          "phase": 1
        }
      ],
      "modules": [
        {
          // Module within Phase
          "moduleId": "mod_p1_m1",
          "moduleTitle": "Module 1: Supervised Learning Basics",
          "moduleDescription": "Introduction to supervised learning",
          "topicsCovered": ["Supervised Learning Fundamentals"],
          "lessons": [
            {
              // Lesson within Module
              "lessonId": "lesson_1",
              "lessonTitle": "Understanding Labeled Data",
              "learningObjectives": [
                "Explain what labeled and unlabeled data means",
                "Identify features and labels in datasets",
                "Apply supervised learning concepts"
              ],
              "introduction": "In this lesson...",
              "mainContent": "Supervised learning is a machine learning paradigm...",
              "keyPoints": [
                "Labeled data consists of examples with known outputs",
                "Features are input variables, labels are output variables",
                "Model learns pattern between features and labels"
              ],
              "examples": [
                {
                  "title": "Email Spam Classification",
                  "description": "Example using email content as features..."
                }
              ],
              "practiceActivities": [
                {
                  "activity": "Identify Features and Labels",
                  "instructions": "Given a dataset, identify which columns...",
                  "expectedOutcome": "Correct identification of features/labels"
                }
              ],
              "commonMisconceptions": [
                "Misconception: More features = better model",
                "Reality: Feature quality matters more than quantity"
              ],
              "summary": "You now understand labeled data and supervised learning",
              "nextSteps": "Next lesson covers regression models",
              "duration": "30-45 minutes"
            }
          ],
          "assessment": {
            "type": "quiz",
            "questions": [
              {
                "id": "q1",
                "question": "What is the primary difference between features and labels?",
                "options": [
                  "Features are inputs, labels are outputs",
                  "Features are outputs, labels are inputs",
                  "They are the same thing",
                  "Features are numerical, labels are categorical"
                ],
                "correctAnswer": "Features are inputs, labels are outputs",
                "explanation": "In supervised learning, features (X) are input variables...",
                "bloomsLevel": "understand"
              }
            ],
            "passingScore": 70
          },
          "learningOutcomes": [
            {
              "outcome": "Identify features and labels in a dataset",
              "description": "Students can distinguish input vs output variables",
              "bloomsLevel": "understand"
            }
          ],
          "estimatedDuration": "6-8 hours",
          "difficulty": "beginner"
        }
      ],
      "estimatedDuration": "8 hours"
    }
  ],
  
  // Statistics
  "statistics": {
    "totalPhases": 3,
    "totalModules": 6,
    "totalLessons": 18,
    "totalAssessmentQuestions": 60,
    "estimatedTotalHours": 24,
    "contentSourced": "PDF-based dynamic extraction"
  }
}
```

---

## Component Interaction Diagram

```
┌──────────────────────────────────────────────────────┐
│ Frontend                                             │
│ (React Components)                                   │
│                                                      │
│ ┌──────────────────────────────────────────────────┐│
│ │ EnhancedRoadmap.jsx                              ││
│ │ - Display phases, modules, lessons               ││
│ │ - Handle user interactions                        ││
│ │ - Call API endpoints                              ││
│ └──────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┘
         ↓ HTTP Requests (JSON) ↑
┌──────────────────────────────────────────────────────┐
│ Backend                                              │
│ (Node.js/Express)                                    │
│                                                      │
│ ┌──────────────────────────────────────────────────┐│
│ │ enhancedDocumentRoutes.js                        ││
│ │ - Route definitions                              ││
│ │ - Middleware (auth)                              ││
│ └──────────────────────────────────────────────────┘│
│          ↓                                           │
│ ┌──────────────────────────────────────────────────┐│
│ │ enhancedDocumentController.js                    ││
│ │ - Request handling                               ││
│ │ - Validation                                     ││
│ │ - Service orchestration                          ││
│ └──────────────────────────────────────────────────┘│
│          ↓                                           │
│ ┌──────────────────────────────────────────────────┐│
│ │ improvedRoadmapService.js                        ││
│ │ - Main orchestration logic                       ││
│ │ - LLM prompt management                          ││
│ │ - Content assembly                               ││
│ └──────────────────────────────────────────────────┘│
│      ↙              ↓              ↘                │
│    ┌────────────┐  ┌─────────────┐  ┌─────────────┐│
│    │ pdfParse   │  │ improvedGeminI │ MongoDB    ││
│    │ Service    │  │ Prompts     │  │ Database   ││
│    │ (Extract)  │  │ (AI Logic)   │  │ (Persist)  ││
│    └────────────┘  └─────────────┘  └─────────────┘│
│         ↓                 ↓                 ↓        │
└──────────────────────────────────────────────────────┘
         ↓                 ↓                 ↓
    ┌─────────┐    ┌────────────┐    ┌──────────────┐
    │ PDF File│    │ Gemini API │    │  MongoDB     │
    │ Storage │    │ (External) │    │ (Database)   │
    └─────────┘    └────────────┘    └──────────────┘
```

---

## Data Flow for Single Request

```
User Action: Click "Generate Roadmap" with learnerLevel="beginner"
              ↓
POST /api/v2/roadmap/generate-improved
{
  documentId: "507f1f77bcf86cd799439011",
  learnerLevel: "beginner"
}
              ↓
enhancedDocumentController.generateImprovedRoadmap()
  1. Validate request (auth, documentId, learnerLevel)
  2. Get document from DB
  3. Extract PDF from file system
  4. Verify PDF has content
              ↓
improvedRoadmapService.generateCompleteRoadmapImproved()
  1. preprocessContent()
     - Get statistics
     - Extract sections
     - Prepare sample
              ↓
  2. extractMainTopicImproved()
     - Call improvedGeminiPrompts.getMainTopicPrompt()
     - Send to Gemini API
     - Parse response → { mainTopic, subTopics, ... }
              ↓
  3. extractComprehensiveTopicsImproved()
     - Call getComprehensiveTopicsPrompt()
     - For 3 phases
     - Send to Gemini API
     - Parse response → { phase1: [...], phase2: [...], ... }
              ↓
  4. For each phase:
     - For each topic:
       - generateTopicContentImproved()
         Send generateTopicContentPrompt()
         Get content details
              ↓
     - generateModulesForPhaseWithTopics()
       - Organize topics into modules (2-3 per phase)
              ↓
     - For each module:
       - generateDetailedLessonsImproved()
         Send generateDetailedLessonPrompt()
         Get 3 lessons per module
              ↓
       - generateModuleAssessmentImproved()
         Send generateQuizQuestionsPrompt()
         Get 8-10 quiz questions
              ↓
       - generateLearningOutcomesImproved()
         Send generateModuleOutcomesPrompt()
         Get 4-5 learning outcomes
              ↓
  5. Assemble complete roadmap
     - Combine all phases, modules, lessons
     - Add statistics
     - Return structured object
              ↓
enhancedDocumentController (continued)
  5. Save roadmap to MongoDB
     document.roadmap = improvedRoadmap
     document.save()
              ↓
  6. Return HTTP 200 with roadmap
              ↓
Frontend receives complete roadmap
  → Display roadmap structure
  → Show phases, modules, lessons
  → User can interact with content
              ↓
Roadmap saved and available for:
  - Future viewing (GET endpoints)
  - Sharing/export
  - Progress tracking
  - Statistics/analytics
```

---

## Error Handling Flow

```
Request Received
    ↓
Is user authenticated? → No → Return 401 Unauthorized
    ↓ Yes
Does document exist? → No → Return 404 Not Found
    ↓ Yes
Is document owner? → No → Return 403 Forbidden
    ↓ Yes
PDF file accessible? → No → Return 404 File Not Found
    ↓ Yes
Extract PDF text
    ↓
Is text > 100 chars? → No → Return 400 Invalid PDF Content
    ↓ Yes
Generate roadmap
    ↓
Did Gemini timeout? → Yes → Return 504 Timeout (retry recommended)
    ↓ No
Did Gemini return error? → Yes → Return 500 with error details
    ↓ No
Roadmap generated successfully
    ↓
Save to database
    ↓
Did save work? → No → Return 500 Database Error
    ↓ Yes
Return 200 with roadmap
```

---

## Key Performance Points

```
Speed Optimization:
├─ PDF Extraction: Parallel read
├─ Content Preprocessing: Single pass
├─ Gemini Prompts: Sequential (required by API)
├─ Lesson Generation: Parallel per module
└─ Database Save: Async after assembly

Memory Optimization:
├─ Stream large PDFs if needed
├─ Chunk content for processing
├─ Don't duplicate content unnecessarily
└─ Clean up temporary structures

API Call Optimization:
├─ Reuse content chunks across prompts
├─ Batch-collect error handling
├─ Implement circuit breaker for API failures
└─ Add caching for identical document request
```

---

This architecture ensures:
✅ **Scalability** - Component-based, easy to scale  
✅ **Maintainability** - Clear separation of concerns  
✅ **Reliability** - Error handling at each level  
✅ **Performance** - Optimized data flow  
✅ **Extensibility** - Easy to add new prompt types or features  

