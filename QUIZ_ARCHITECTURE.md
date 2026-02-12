# Quiz System - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────┐  ┌────────────────────┐               │
│  │ EnhancedRoadmap     │  │ ScoreTracker       │               │
│  │ Component           │  │ Dashboard          │               │
│  │                     │  │                    │               │
│  │ • Phase display     │  │ • Overall score    │               │
│  │ • Module listing    │  │ • Phase breakdown  │               │
│  │ • Module quiz btn   │  │ • Performance      │               │
│  │ • Phase quiz btn    │  │ • Analytics        │               │
│  │ • Final quiz btn    │  │ • Progress tracking│               │
│  └──────────┬──────────┘  └────────┬───────────┘               │
│             │                      │                            │
│             │                      │                            │
│  ┌──────────▼──────────────────────▼─────────┐                │
│  │  QuizInterface Component                   │                │
│  │  (Question Display & Answer Collection)    │                │
│  │                                            │                │
│  │  • Question rendering                     │                │
│  │  • Option selection                       │                │
│  │  • Progress tracking                      │                │
│  │  • Timer management                       │                │
│  │  • Quiz review display                    │                │
│  └─────────────────────┬──────────────────────┘                │
│                        │                                        │
└────────────────────────┼────────────────────────────────────────┘
                         │
                HTTP REST API
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    EXPRESS SERVER                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────┐                 │
│  │ Quiz Routes (/api/quizzes)               │                 │
│  ├──────────────────────────────────────────┤                 │
│  │ • POST /module      - Create module quiz  │                 │
│  │ • POST /phase       - Create phase quiz   │                 │
│  │ • POST /final       - Create final quiz   │                 │
│  │ • GET  /:id         - Get quiz details    │                 │
│  │ • POST /:id/submit  - Submit & score     │                 │
│  │ • GET  /tracker/:id - Get score tracker   │                 │
│  │ • GET  /roadmap/:id - List roadmap quizzes│                 │
│  └─────────────┬────────────────────────────┘                 │
│                │                                                │
│  ┌─────────────▼────────────────────────────┐                 │
│  │ Quiz Controller                          │                 │
│  ├────────────────────────────────────────────┤                 │
│  │ • createModuleQuiz()                      │                 │
│  │ • createPhaseQuiz()                       │                 │
│  │ • createFinalQuiz()                       │                 │
│  │ • getQuiz()                               │                 │
│  │ • submitQuiz()                            │                 │
│  │ • getScoreTracker()                       │                 │
│  │ • updateScoreTracker()                    │                 │
│  └─────────────┬────────────────────────────┘                 │
│                │                                                │
└────────────────┼────────────────────────────────────────────────┘
                 │
        ┌────────▼─────────┐
        │ Service Layer    │
        └────────┬─────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    │            │            │
 ┌──▼──┐  ┌──────▼─────┐  ┌───▼───┐
 │GMini│  │ RoadmapSvc │  │Database│
 │API  │  │            │  │        │
 └─────┘  └────────────┘  │ Models │
    │                      │        │
    │   MCQ Generation     │        │
    │                      │        │
    └──────────┬───────────┤        │
               │           │        │
            Quiz Data      │        │
               │           │        │
        ┌──────▼───────────▼──┐    │
        │  MongoDB Collections │    │
        ├─ Quiz              │    │
        ├─ ScoreTracker      │    │
        ├─ User              │    │
        └────────────────────┘    │
                                  │
                        Stored Data
```

## Data Models Relationship

```
User (Existing)
  └── 1-to-Many --> Roadmap
                      └── 1-to-Many --> Quiz (NEW)
                      │                  ├─ questions[]
                      │                  ├─ attempts[]
                      │                  └─ bestAttempt
                      │
                      └── 1-to-Many --> ScoreTracker (NEW)
                                         ├─ phaseScores[]
                                         │  ├─ moduleQuizzes[]
                                         │  └─ phaseOverallQuiz
                                         ├─ finalAssessment
                                         └─ learningProgress
```

## Quiz Flow Architecture

### Module Quiz Generation & Taking

```
START
  │
  ├─ User clicks "Start Module Quiz"
  │
  ├─ Frontend: GET /api/quizzes/module (params)
  │
  ├─ Backend:
  │  ├─ Validate module data
  │  ├─ Call QuizService.generateModuleQuiz()
  │  ├─ Api call to Gemini: "Generate 12-15 MCQs"
  │  ├─ Parse JSON response
  │  ├─ Create Quiz document in MongoDB
  │  └─ Return quiz with questions
  │
  ├─ Frontend:
  │  ├─ Display QuizInterface
  │  ├─ Show questions one by one
  │  ├─ Track time & progress
  │  └─ User answers questions
  │
  ├─ User clicks "Submit Quiz"
  │
  ├─ Frontend: POST /api/quizzes/{quizId}/submit
  │
  ├─ Backend:
  │  ├─ Compare answers vs correct
  │  ├─ Calculate score
  │  ├─ Update Quiz document
  │  ├─ Update ScoreTracker (phase score)
  │  └─ Return review with explanations
  │
  ├─ Frontend: Display QuizReview
  │  ├─ Show score, time, accuracy
  │  ├─ Show each Q/A with explanation
  │  └─ Show performance metrics
  │
  └─ END
```

### Score Calculation Pipeline

```
Quiz Answer Submission
  │
  ├─ STEP 1: Calculate Quiz Score
  │  ├─ Count correct answers
  │  ├─ percentageScore = (correct/total) * 100
  │  ├─ Store in Quiz.attempts[]
  │  └─ Determine best attempt
  │
  ├─ STEP 2: Update Phase Score
  │  ├─ If module quiz: avg all module quizzes
  │  ├─ If phase quiz: avg (module quizzes + phase quiz)
  │  └─ phaseScore = average
  │
  ├─ STEP 3: Calculate Overall Score
  │  ├─ Get all phase scores
  │  ├─ Filter out zero/empty phases
  │  ├─ overallScore = avg(phaseScores)
  │  └─ Round to nearest integer
  │
  ├─ STEP 4: Update Progress Metrics
  │  ├─ totalQuestionsAttempted += this.questions.length
  │  ├─ totalQuestionsCorrect += correctCount
  │  ├─ averageAccuracy = (totalCorrect/totalAttempted)*100
  │  └─ Update learning progress
  │
  └─ STEP 5: Persist to Database
     ├─ Save Quiz document with scores
     ├─ Save ScoreTracker with aggregated data
     └─ Return calculated metrics to frontend
```

## Quiz Generation Workflow

```
REQUEST: Generate Module Quiz
  │
  ├─ Input:
  │  ├─ Module name & description
  │  ├─ Topics covered in module
  │  ├─ Phase objective
  │  └─ Learner level
  │
  ├─ Call QuizService.generateModuleQuiz()
  │
  ├─ Build Gemini Prompt:
  │  ├─ "Generate 12-15 MCQs"
  │  ├─ "Topics: [topics]"
  │  ├─ "Return JSON format"
  │  ├─ "Include explanations"
  │  └─ "4 options each"
  │
  ├─ API Call to Gemini
  │  ├─ Set 15 second timeout
  │  ├─ Send prompt
  │  └─ Wait for response
  │
  ├─ Parse Response
  │  ├─ Extract JSON from response
  │  ├─ Validate structure
  │  ├─ Check question count
  │  ├─ Verify options/correct answer
  │  └─ If invalid: return default quiz
  │
  ├─ Transform to Quiz Format
  │  ├─ Assign questionIds
  │  ├─ Validate difficulty levels
  │  ├─ Map topics
  │  └─ Add explanations
  │
  └─ Response: 
     └─ Array of 12-15 MCQ objects
```

## State Management in Frontend

```
Document/Dashboard Component State:

state = {
  roadmap: {                           // Main roadmap data
    learningPath: [
      {
        phaseId: "phase_1",
        phaseName: "Fundamentals",
        modules: [...],
        quizzes: {                     // NEW: Quiz metadata
          moduleQuizzes: [...],
          phaseQuiz: {...}
        }
      },
      ...
    ],
    finalQuiz: {...},                  // NEW: Final quiz metadata
    quizStatistics: {                  // NEW: Quiz stats
      totalModuleQuizzes: 9,
      totalPhaseQuizzes: 3,
      hasFinalQuiz: true
    }
  },
  
  activeQuiz: {                        // NEW: Current quiz being taken
    quizId: "...",
    quizTitle: "...",
    questions: [...],
    quizType: "module-quiz"
  },
  
  showQuizInterface: false,            // NEW: Show quiz modal
  roadmapId: "...",                    // NEW: For score tracker
  scoreTracker: {                      // NEW: User scores
    overallScore: 0,
    phaseScores: [...],
    finalAssessment: {...}
  }
}
```

## Error Handling Architecture

```
Try/Catch Flow:

1. QUIZ GENERATION
   └─ Error → Fallback to default quiz
              └─ Default has 3 basic questions
              └─ Still calculates scores

2. QUIZ SUBMISSION
   └─ Error → Show error message
           └─ Tell user to retry
           └─ Quiz still saved locally

3. SCORE TRACKER LOAD
   └─ Error → Show last cached data
           └─ Or show empty tracker
           └─ Allow retry button

4. API TIMEOUT
   └─ 15-20 sec → Fall back to defaults
              └─ Still functional
              └─ Alert user
```

## Performance Considerations

```
Optimization Strategy:

1. LAZY LOADING
   ├─ QuizInterface rendered only when quiz active
   ├─ Questions not fetched until quiz opens
   └─ ScoreTracker fetched only on tab change

2. QUIZ CACHING
   ├─ Generated quizzes stored in MongoDB
   ├─ Same user retaking same quiz: no regeneration
   └─ Saves API calls and time

3. PAGINATION
   ├─ One question shown at a time
   ├─ Not all 30 MCQs in memory simultaneously
   └─ Smooth navigation experience

4. API OPTIMIZATION
   ├─ Timeout: 15-20 seconds max
   ├─ Fallback to default if slow
   └─ Batch operations where possible

5. DATABASE INDEXING
   ├─ Index on (user, roadmapId) for quick queries
   ├─ Index on quizType for filtering
   └─ Index on timestamps for sorting
```

## Scaling Considerations

```
Current Architecture Supports:

• 1000s of concurrent users
• 100,000s of historical quizzes
• Real-time score updates
• Multiple roadmaps per user
• Retry/re-attempt handling

Improvement Areas:

1. CACHING LAYER
   ├─ Redis for quiz metadata
   ├─ Cache score calculations
   └─ Faster retrieval

2. LOAD BALANCING
   ├─ Multiple API instances
   ├─ Distributed database
   └─ Geographic distribution

3. ASYNC PROCESSING
   ├─ Queue quiz generation
   ├─ Background score calculation
   └─ Notification system

4. ANALYTICS
   ├─ Track time per question
   ├─ Difficulty analysis
   ├─ Topic mastery tracking
   └─ Learning patterns
```

## Security Architecture

```
Authentication & Authorization:

1. All quiz endpoints protected
   ├─ Require valid JWT token
   ├─ Validated via authMiddleware
   └─ User ID verified

2. Data Access Control
   ├─ Users see only their quizzes
   ├─ Score data isolated per user
   └─ No cross-user data leakage

3. Answer Validation
   ├─ Verify answers exist in quiz
   ├─ Prevent answer manipulation
   └─ Server-side scoring (no client trust)

4. Rate Limiting
   ├─ Prevent API abuse
   ├─ Quiz generation throttled
   └─ Submission rate controlled
```

## Deployment Checklist

```
Backend Deployment:
✓ Quiz Model created
✓ ScoreTracker Model created
✓ QuizService created
✓ Quiz Controller created
✓ Quiz Routes created
✓ Server updated with quiz routes
✓ Environment variables configured
✓ Database migrations run

Frontend Deployment:
✓ QuizInterface component created
✓ ScoreTracker component created
✓ EnhancedRoadmap component created
✓ Components tested locally
✓ Integrated into Document page
✓ API service configured
✓ Error handling implemented
✓ UI/UX tested

Testing:
□ Unit tests for quiz generation
□ Integration tests for scoring
□ E2E tests for full flow
□ Performance testing
□ Security testing
□ Cross-browser testing

Post-Deployment:
□ Monitor API performance
□ Track error rates
□ User feedback collection
□ Gradual rollout (10% → 50% → 100%)
□ Have rollback plan
```

---

**Architecture Status**: Complete & Ready ✅
