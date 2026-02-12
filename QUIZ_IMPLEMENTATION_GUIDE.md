# Quiz System & Score Tracker Implementation Guide

## Overview
Complete implementation of a phase-based learning roadmap with integrated MCQ quizzes, score tracking, and performance analytics.

## Features Implemented

### 1. **Database Models**

#### Quiz Model (`backend/models/Quiz.js`)
- Stores quiz questions and user attempts
- Tracks quiz type: `module-quiz`, `phase-quiz`, `final-quiz`
- Records multiple attempts with scoring
- Maintains best attempt tracking

#### ScoreTracker Model (`backend/models/ScoreTracker.js`)
- Comprehensive score tracking per roadmap
- Phase-wise performance breakdown
- Module quiz and phase quiz scores
- Final assessment tracking
- Overall learning progress metrics

### 2. **Backend Services**

#### Quiz Service (`backend/services/quizService.js`)
Generates MCQ quizzes using Gemini API:
- **Module Quizzes**: 12-15 MCQs per module
- **Phase Quizzes**: 28-32 MCQs per phase
- **Final Quiz**: 30-35 MCQs covering entire curriculum
- Difficulty distribution: Easy/Medium/Hard mix
- Automatic fallback to default quizzes if API fails

#### Roadmap Service Enhancement
Added quiz metadata generation:
- `addQuizMetadata()`: Adds quiz information to learning path
- `createFinalQuizMetadata()`: Creates final assessment metadata
- Updated roadmap structure with quiz statistics

### 3. **Backend API Endpoints**

#### Quiz Management
```
POST   /api/quizzes/module        - Create module quiz
POST   /api/quizzes/phase         - Create phase assessment quiz
POST   /api/quizzes/final         - Create final comprehensive quiz
GET    /api/quizzes/:quizId       - Get quiz details
POST   /api/quizzes/:quizId/submit - Submit quiz and calculate score
GET    /api/quizzes/tracker/:roadmapId - Get score tracker
GET    /api/quizzes/roadmap/:roadmapId - Get all quizzes for roadmap
```

All quiz endpoints require authentication via `authMiddleware`.

### 4. **Frontend Components**

#### QuizInterface Component (`forntend/src/components/QuizInterface.jsx`)
Interactive quiz-taking interface:
- Question navigation with progress tracking
- Real-time timer
- Question-level difficulty and topic display
- Answer selection with visual feedback
- Answer review with detailed explanations
- Performance statistics after submission

**Features:**
- Progress bar showing completion percentage
- Question navigator grid
- Time tracking
- Automatic calculation of correctness
- Detailed review with explanations

#### ScoreTracker Component (`forntend/src/components/ScoreTracker.jsx`)
Comprehensive performance dashboard:
- Overall learning score (0-100)
- Questions attempted and accuracy rate
- Phase-wise performance breakdown
- Module quiz results
- Phase assessment scores
- Final assessment status
- Performance metrics (trending, awards, accuracy)

**Features:**
- Visual score indicators with color coding
- Phase completion progress
- Module-level quiz tracking
- Passing/failing states
- Learning progress visualization

#### EnhancedRoadmapComponent (`forntend/src/components/EnhancedRoadmapComponent.jsx`)
Updated roadmap display with quiz integration:
- Phase-based organization
- Collapsible phase sections
- Module listings with difficulty levels
- Module quiz launch buttons
- Phase comprehensive assessment buttons
- Final assessment section
- Quiz statistics display

**Structure:**
```
Roadmap Header
├── Quiz Statistics (phases, quizzes, assessment count)
├── Phases (expandable)
│   ├── Phase Info
│   ├── Learning Modules
│   │   ├── Module Details
│   │   └── Start Module Quiz Button
│   └── Phase Assessment
│       └── Start Phase Quiz Button
└── Final Assessment Section
```

### 5. **Quiz Structure**

#### Module Quiz (12-15 MCQs)
- Tests concepts of a specific module
- Questions from topics covered in that module
- Difficulty mix: 4-5 easy, 6-7 medium, 3-4 hard
- Recommended after completing each module

#### Phase Quiz (28-32 MCQs)
- Comprehensive assessment of entire phase
- Covers all modules and topics in phase
- Tests synthesis and application
- Difficulty mix: 8-10 easy, 10-12 medium, 8-10 hard
- Should be taken after completing all modules

#### Final Quiz (30-35 MCQs)
- Comprehensive final assessment
- Covers entire curriculum across all phases
- Tests mastery and synthesis of all topics
- Difficulty mix: 8 easy, 12-14 medium, 8-10 hard
- Unlocked after completing all phase assessments

### 6. **Score Calculation**

**Per Quiz:**
- Total Score = Number of correct answers
- Percentage Score = (Correct Answers / Total Questions) × 100

**Phase Score:**
- Average of all module quizzes in phase
- Updated when phase quiz is submitted
- Final phase score = Average of (module quiz scores + phase quiz score)

**Overall Score:**
- Average of all phase scores
- Weighted calculation based on completion

**Accuracy Rate:**
- Overall = (Total Correct / Total Attempted) × 100

## Integration Steps

### 1. **Frontend Integration**

Import in your Document/Dashboard page:
```javascript
import QuizInterface from '../components/QuizInterface';
import ScoreTracker from '../components/ScoreTracker';
import EnhancedRoadmapComponent from '../components/EnhancedRoadmapComponent';
```

Add state management:
```javascript
const [activeQuiz, setActiveQuiz] = useState(null);
const [showQuizInterface, setShowQuizInterface] = useState(false);
const [roadmapId, setRoadmapId] = useState(null);
```

Handle quiz launch:
```javascript
const handleStartModuleQuiz = async (phase, module) => {
    try {
        const response = await api.post('/quizzes/module', {
            roadmapId,
            phaseId: phase.phaseId,
            phaseNumber: phases.indexOf(phase) + 1,
            phaseName: phase.phaseName,
            moduleId: module.moduleId,
            moduleName: module.moduleTitle,
            topicsCovered: module.topicsCovered,
            phaseObjective: phase.phaseObjective
        });
        setActiveQuiz({ ...response.data.data, quizId: response.data.data.quizId });
        setShowQuizInterface(true);
    } catch (error) {
        console.error('Error starting quiz:', error);
    }
};

const handleStartPhaseQuiz = async (phase) => {
    try {
        const response = await api.post('/quizzes/phase', {
            roadmapId,
            phaseId: phase.phaseId,
            phaseNumber: phases.indexOf(phase) + 1,
            phaseName: phase.phaseName,
            phaseObjective: phase.phaseObjective,
            modulesInPhase: phase.modules,
            allTopicsInPhase: phase.modules.flatMap(m => m.topicsCovered)
        });
        setActiveQuiz({ ...response.data.data, quizId: response.data.data.quizId });
        setShowQuizInterface(true);
    } catch (error) {
        console.error('Error starting quiz:', error);
    }
};

const handleStartFinalQuiz = async () => {
    try {
        const response = await api.post('/quizzes/final', {
            roadmapId,
            allPhases: roadmap.learningPath,
            allTopics: roadmap.mainTopics
        });
        setActiveQuiz({ ...response.data.data, quizId: response.data.data.quizId });
        setShowQuizInterface(true);
    } catch (error) {
        console.error('Error starting final quiz:', error);
    }
};
```

Render components:
```javascript
{showQuizInterface && activeQuiz && (
    <QuizInterface 
        quizData={activeQuiz}
        onSubmit={(result) => {
            setShowQuizInterface(false);
            // Refresh score tracker
            fetchScoreTracker();
        }}
        onClose={() => setShowQuizInterface(false)}
    />
)}

<ScoreTracker 
    roadmapId={roadmapId}
    onPhaseQuizClick={handleStartPhaseQuiz}
    onFinalQuizClick={handleStartFinalQuiz}
/>

<EnhancedRoadmapComponent 
    roadmap={roadmap}
    fileName={fileName}
    learnerLevel={learnerLevel}
    onStartModuleQuiz={handleStartModuleQuiz}
    onStartPhaseQuiz={handleStartPhaseQuiz}
    onStartFinalQuiz={handleStartFinalQuiz}
/>
```

### 2. **Tab Navigation**

Add a new tab in Document page:
```javascript
const tabs = [
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'roadmap', label: 'Roadmap', icon: Map },
    { id: 'quiz', label: 'Quiz & Scores', icon: BarChart3 },
    { id: 'notes', label: 'Notes', icon: BookText }
];
```

Render score tracker in tab:
```javascript
{activeTab === 'quiz' && (
    <ScoreTracker 
        roadmapId={roadmapId}
        onPhaseQuizClick={handleStartPhaseQuiz}
        onFinalQuizClick={handleStartFinalQuiz}
    />
)}
```

## Data Flow

```
1. User generates roadmap
   ↓
2. Roadmap includes quiz metadata for each module
   ↓
3. User views EnhancedRoadmapComponent
   ↓
4. User clicks "Start Module Quiz"
   ↓
5. Frontend calls POST /api/quizzes/module
   ↓
6. Backend generates 12-15 MCQs using Gemini
   ↓
7. QuizInterface displayed with questions
   ↓
8. User answers questions
   ↓
9. User submits quiz
   ↓
10. Frontend sends answers to POST /api/quizzes/:quizId/submit
    ↓
11. Backend calculates score and updates ScoreTracker
    ↓
12. QuizReview component shows results
    ↓
13. ScoreTracker dashboard updates with new scores
```

## Testing

### Test Module Quiz Flow
1. Generate roadmap
2. Click "Start Module Quiz" on first module
3. Answer 5-6 questions manually
4. Submit and verify score calculation
5. Check ScoreTracker updates

### Test Phase Quiz Flow
1. Complete module quizzes
2. Click "Start Phase Assessment"
3. Answer 15-16 questions
4. Submit and verify phase score calculation
5. Check phase-wise breakdown in ScoreTracker

### Test Final Quiz Flow
1. Complete all phase assessments
2. Click "Start Final Assessment"
3. Answer 15-17 questions
4. Submit and verify final score
5. Check completion status

## API Request Examples

### Create Module Quiz
```bash
POST /api/quizzes/module
{
    "roadmapId": "roadmap_123",
    "phaseId": "phase_1",
    "phaseNumber": 1,
    "phaseName": "Fundamentals",
    "moduleId": "mod_1",
    "moduleName": "Introduction to Basics",
    "topicsCovered": ["Topic 1", "Topic 2"],
    "phaseObjective": "Understand core concepts"
}
```

### Submit Quiz
```bash
POST /api/quizzes/{quizId}/submit
{
    "answers": [
        {
            "questionId": "q_1",
            "selectedAnswer": "Option 1",
            "markedTime": 15000
        }
    ],
    "timeTaken": 20
}
```

### Get Score Tracker
```bash
GET /api/quizzes/tracker/{roadmapId}
```

## Score Display Standards

- **90-100**: Excellent (Green) ⭐
- **75-89**: Good (Light Green) 👍
- **60-74**: Satisfactory (Yellow) ✓
- **Below 60**: Needs Improvement (Red) ⚠️

## Performance Optimization

1. **Quiz Caching**: Quizzes are generated once and stored
2. **Lazy Loading**: Score tracker fetched only when tab active
3. **Pagination**: Questions loaded one at a time in interface
4. **API Timeout**: 15-20 seconds max for quiz generation
5. **Fallback Quizzes**: Default quizzes if API fails

## Error Handling

- API failures fall back to default quizzes
- Invalid quiz data is sanitized
- Missing fields have default values
- Network errors show user-friendly messages

## Future Enhancements

1. Question hints system
2. Plagiarism detection for open-ended questions
3. Adaptive difficulty based on performance
4. Spaced repetition recommendations
5. Peer comparison analytics
6. Certificate generation on completion
7. Quiz scheduling and reminders
8. Mobile app synchronization
