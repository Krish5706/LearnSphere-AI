# Visual Reference Guide - Quiz System

## 1. Component Hierarchy

```
Document/Dashboard Page
│
├─ TABS: [Summary] [Roadmap] [Quiz & Scores] [Notes]
│
└─ Quiz & Scores Tab
   │
   ├─ ScoreTracker
   │  ├─ Overall Score Card (85/100)
   │  ├─ Performance Metrics (4 cards)
   │  ├─ Phase-wise Breakdown
   │  ├─ Final Assessment Card
   │  └─ Legend
   │
   └─ MODAL (when quiz active)
      └─ QuizInterface
         ├─ Header with Stats
         ├─ Question Display
         ├─ MCQ Options
         ├─ Question Navigator
         └─ Submit/Review
```

---

## 2. Screen Layout - Roadmap Tab

```
┌────────────────────────────────────────────────────────┐
│  LEARNING ROADMAP WITH ASSESSMENT                     │
│  ─────────────────────────────────────────────────────│
│  Beginner  | Follow step-by-step guide for mastery... │
│            | "FILENAME.pdf" - 3 phases, 9 quiz... │
├────────────────────────────────────────────────────────┤
│  Quiz Statistics Bar                                  │
│  [3 Phases] [9 Module Quizzes × 12MCQs]              │
│  [3 Phase Assessments × 30MCQs] [1 Final × 30MCQs]  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ◀ PHASE 1: FUNDAMENTALS & BASICS                 ▼  │
│    Learn core concepts                          0%   │
│                                                        │
│    MODULE 1: Introduction to Basics                  │
│    └─ 2-3 hours | Topics: T1, T2, T3               │
│       [▼ START MODULE QUIZ (12 MCQs)]                │
│                                                        │
│    MODULE 2: Core Concepts                           │
│    └─ 2-3 hours | Topics: T2, T3, T4               │
│       [▼ START MODULE QUIZ (12 MCQs)]                │
│                                                        │
│    MODULE 3: Practical Application                   │
│    └─ 2-3 hours | Topics: T3, T4, T5               │
│       [▼ START MODULE QUIZ (12 MCQs)]                │
│                                                        │
│    ╔═══════════════════════════════════════════════╗ │
│    ║ 🏆 PHASE COMPREHENSIVE ASSESSMENT            ║ │
│    ║ 30 questions covering all phase topics       ║ │
│    ║ [▼ START PHASE ASSESSMENT]                   ║ │
│    ╚═══════════════════════════════════════════════╝ │
│                                                        │
│  ◀ PHASE 2: OTHER PHASE                           ▼  │
│    ...similar structure...                           │
│                                                        │
│  ╔═══════════════════════════════════════════════════╗│
│  ║ 🎓 FINAL ACHIEVEMENT                             ║│
│  ║ Final Comprehensive Assessment (30 MCQ) ║│
│  ║ After completing all phases              ║│
│  ║ [▼ START FINAL ASSESSMENT]                ║│
│  ╚═══════════════════════════════════════════════════╝│
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 3. Screen Layout - Quiz & Scores Tab

```
┌────────────────────────────────────────────────────────┐
│            OVERALL LEARNING SCORE                     │
│ ┌──────────────────────────────────────────────────┐ │
│ │                                                   │ │
│ │                    85                             │ │
│ │                   /100                            │ │
│ │                                                   │ │
│ │ ████████████████░░ 85%                           │ │
│ │                                                   │ │
│ │  42/50 Correct    │  84% Accuracy    │ 2/3 Done │ │
│ │                                                   │ │
│ └──────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────┤
│                                                        │
│ 📈 Learning Progress    🏆 Best Perf    ⚡ Questions  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │   66%    │ │   85%    │ │   150    │ │   84%    │ │
│ │2/3 Phase │ │ Highest  │ │Attempted │ │Accuracy  │ │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
├────────────────────────────────────────────────────────┤
│ PHASE-WISE PERFORMANCE                                │
│                                                        │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ ① PHASE 1: FUNDAMENTALS & BASICS           88% ┃ │
│ ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫ │
│ ┃ Module Quizzes:                              ┃ │
│ ┃ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ ┃ │
│ ┃ │ Module 1    │ │ Module 2    │ │ Module 3│ ┃ │
│ ┃ │   90%       │ │   85%       │ │  88%    │ ┃ │
│ ┃ │ (45/50)     │ │ (42/50)     │ │ (44/50) │ ┃ │
│ ┃ └─────────────┘ └─────────────┘ └─────────┘ ┃ │
│ ┃                                              ┃ │
│ ┃ 🏆 Phase Comprehensive Assessment: ✓ 88%    ┃ │
│ ┃    (44/50 correct)                          ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                                        │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ ② PHASE 2: PRACTICAL APPLICATION            82% ┃ │
│ ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫ │
│ ┃ ...similar layout...                         ┃ │
│ ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫ │
│ ┃ 🏆 Phase Assessment: [Not Started] [Lock]    ┃ │
│ ┃    Complete modules to unlock!               ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                                        │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ ③ PHASE 3: INTEGRATION                      [!] ┃ │
│ ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫ │
│ ┃ Progress: 1 of 1 modules completed              ┃ │
│ ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫ │
│ ┃ [In Progress...]                             ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
├────────────────────────────────────────────────────────┤
│ ╔════════════════════════════════════════════════════╗ │
│ ║ 🎓 FINAL ASSESSMENT                              ║ │
│ ║ Unlock after completing all phases!              ║ │
│ ║ 30 comprehensive MCQs covering full curriculum   ║ │
│ ║ [🔒 Start Final Assessment - Unlock Phase 3]    ║ │
│ ╚════════════════════════════════════════════════════╝ │
│                                                        │
│ Score Legend                                          │
│ 🟢 90-100: Excellent │ 🟢 75-89: Good │            │
│ 🟡 60-74: Satisfactory │ 🔴 <60: Needs Review     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 4. Quiz Taking Interface

```
┌────────────────────────────────────────────────────────┐
│        MODULE 1 QUIZ - Fundamentals Assessment        │
│ ─────────────────────────────────────────────────────│
│                                                        │
│ Progress: ████████░░ 50%                              │
│ Q: 5/10  │  Answered: 5/10  │  Time: 5:30            │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│ ⓹ What is the primary concept of Topic 1?            │
│    [Easy Level] [Topic: Fundamentals]               │
│                                                        │
│ ○ A) Core principle                                   │
│ ◉ B) Secondary aspect          <- SELECTED           │
│ ○ C) Implementation detail                            │
│ ○ D) Historical note                                  │
│                                                        │
├────────────────────────────────────────────────────────┤
│ Question Navigator:                                    │
│ [1] [2] [3] [4] [5✓] [6] [7✓] [8] [9✓] [10✓]      │
│     ✓ = Answered                                      │
│                                                        │
├────────────────────────────────────────────────────────┤
│ [← Previous]    Question 5 of 10    [Next →]          │
│                            (or [Submit Quiz] on Q10)  │
└────────────────────────────────────────────────────────┘
```

---

## 5. Quiz Review Screen

```
┌────────────────────────────────────────────────────────┐
│                 QUIZ COMPLETED! 🎉                    │
│ ─────────────────────────────────────────────────────│
│                                                        │
│                      90%                              │
│                   9 out of 10                         │
│                                                        │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│ │   9/10   │ │ 10 min   │ │   90%    │              │
│ │ Correct  │ │ Time     │ │ Overall  │              │
│ └──────────┘ └──────────┘ └──────────┘              │
│                                                        │
├────────────────────────────────────────────────────────┤
│ DETAILED REVIEW                                        │
│                                                        │
│ ✓ Q1: What is... (Easy)                              │
│   Your: Option A (Correct) ✓                          │
│   Explanation: [Educational text...]                 │
│   ▼ (Expandable)                                      │
│                                                        │
│ ✗ Q2: How would you... (Medium)                      │
│   Your: Option B (Wrong)                              │
│   Correct: Option A                                   │
│   Explanation: [Detailed explanation...]             │
│   ▲ (Expanded)                                        │
│                                                        │
│ ✓ Q3: What is the... (Easy)                          │
│   Your: Option D (Correct) ✓                          │
│   Explanation: [Educational text...]                 │
│   ▼ (Expandable)                                      │
│                                                        │
│ [... more questions ...]                              │
│                                                        │
│ Performance Summary                                   │
│ ┌─────────────────────────────────────────┐         │
│ │ Correct: 9          Accuracy: 90%      │         │
│ │ Incorrect: 1        Quiz Type: Module  │         │
│ │ Total: 10           Time: 10 minutes   │         │
│ └─────────────────────────────────────────┘         │
│                                                        │
└────────────────────────────────────────────────────────┘
                      [Close]
```

---

## 6. Data Flow Diagram

```
User Interaction Flow:

┌─────────────────────────────────────────────────────┐
│ 1. User Views Roadmap                               │
│    └─ See: Phases, Modules, Quiz Buttons            │
└────────────┬────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────┐
│ 2. User Clicks "Start Module Quiz"                 │
│    └─ Button Click Event Fired                     │
└────────────┬────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────┐
│ 3. Frontend: POST /api/quizzes/module               │
│    Send: moduleId, phaseId, topics, etc.           │
└────────────┬────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────┐
│ 4. Backend: Quiz Controller                         │
│    └─ Call QuizService.generateModuleQuiz()        │
└────────────┬────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────┐
│ 5. Quiz Service → Gemini API                        │
│    └─ "Generate 12-15 MCQs"                        │
└────────────┬────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────┐
│ 6. Gemini Response (or Fallback)                   │
│    └─ Questions with options & explanations        │
└────────────┬────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────┐
│ 7. Backend: Create Quiz Document                   │
│    └─ Save to MongoDB                              │
└────────────┬────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────┐
│ 8. Response to Frontend                             │
│    └─ Questions (without answers)                  │
└────────────┬────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────┐
│ 9. Frontend: QuizInterface Rendered                │
│    └─ Display Questions                            │
└────────────┬────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────┐
│ 10. User: Answer Questions & Submit                │
│     └─ Click Submit                                │
└────────────┬────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────┐
│ 11. Frontend: POST /api/quizzes/{id}/submit         │
│     Send: Answers Array                            │
└────────────┬────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────┐
│ 12. Backend: Calculate Score                        │
│     ├─ Compare answers vs correct                  │
│     ├─ Calculate percentage                        │
│     └─ Generate review with explanations           │
└────────────┬────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────┐
│ 13. Backend: Update Database                        │
│     ├─ Save Quiz with scores                       │
│     └─ Update ScoreTracker                         │
└────────────┬────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────┐
│ 14. Response to Frontend                            │
│     ├─ Score & Percentage                          │
│     ├─ Question-by-question review                 │
│     └─ Performance metrics                         │
└────────────┬────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────┐
│ 15. Frontend: QuizReview Rendered                  │
│     ├─ Show Score Card                             │
│     ├─ Show Q&A Review                             │
│     └─ Show Metrics                                │
└────────────┬────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────┐
│ 16. ScoreTracker Updated                            │
│     ├─ Overall score recalculated                  │
│     ├─ Phase score updated                         │
│     └─ Progress metrics refreshed                  │
└────────────────────────────────────────────────────┘
```

---

## 7. Score Update Cascade

```
Module Quiz Submitted (90%)
    │
    ├─ Quiz Document Updated
    │  └─ attempts[] added
    │  └─ bestAttempt set
    │
    └─ ScoreTracker Updated
       ├─ Module Quiz Score: 90%
       │
       ├─ IF all module quizzes done
       │  └─ phaseScore = avg(module scores)
       │
       └─ Overall Score calculated
          └─ overallScore = avg(phaseScores)
             └─ ScoreTracker Dashboard Refreshed


Phase Assessment Submitted (85%)
    │
    ├─ Quiz Document Updated
    │
    └─ ScoreTracker Updated
       ├─ phaseOverallQuiz set: 85%
       ├─ Phase marked as "completed"
       │
       ├─ phaseScore recalculated
       │  └─ avg(module quizzes + phase assessment)
       │
       └─ overallScore recalculated
          └─ avg(all phase scores)
             └─ ScoreTracker Dashboard Refreshed


Final Quiz Submitted (87%)
    │
    ├─ Quiz Document Updated
    │
    └─ ScoreTracker Updated
       ├─ finalAssessment set: 87%
       ├─ Learning marked as "completed"
       │
       ├─ learningProgress.overallCompletion = 100%
       │
       └─ Completion Metrics Updated
          └─ All stats finalized
             └─ Certification Ready
```

---

## 8. Quiz Difficulty Distribution

```
Module Quiz (12-15 Questions)        Phase Quiz (28-32 Questions)

Easy: 4-5 (30%)                      Easy: 8-10 (30%)
Medium: 6-7 (50%)                    Medium: 10-12 (38%)
Hard: 3-4 (20%)                      Hard: 8-10 (32%)

│                                    │
├─ ✓ ✓ ✓ ✓ (Easy)                  ├─ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ (Easy)
├─ ? ? ? ? ? ? (Medium)              ├─ ? ? ? ? ? ? ? ? ? ? ? (Medium)
└─ ! ! ! (Hard)                      └─ ! ! ! ! ! ! ! ! (Hard)


Final Quiz (30-35 Questions)

Easy: 8 (26%)
Medium: 12-14 (42%)
Hard: 8-10 (32%)

│
├─ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ (Easy)
├─ ? ? ? ? ? ? ? ? ? ? ? ? ? ? (Medium)
└─ ! ! ! ! ! ! ! ! (Hard)
```

---

## 9. Color Coding System

```
Score Ranges         Display Color     Icon    Meaning
─────────────────────────────────────────────────────────
90-100              🟢 Green          ⭐     Excellent
75-89               🟢 Light Green    👍     Good
60-74               🟡 Yellow         ✓      Satisfactory
Below 60            🔴 Red            ⚠️     Needs Improvement

Question Status in Quiz
─────────────────────────────────────────────────────────
Not Answered        ○ (empty circle)
Answered            [1] (blue background)
Current Q           [5✓] (blue + checkmark)
All Answered        Ready to Submit

Attempt Quality
─────────────────────────────────────────────────────────
✓ Correct Answer    Green checkmark
✗ Wrong Answer      Red X mark
~ Explanation       Gray text (expandable)
```

---

## 10. Mobile Responsive Layout

```
Mobile (Width < 640px)          Tablet (640-1024px)

QuizInterface:                  EnhancedRoadmap:
┌──────────────┐               ┌─────────────────────┐
│ Q: 5/10 50%  │               │ Phase 1: 88%       │
├──────────────┤               ├─────────────────────┤
│              │               │ Module 1: 90%      │
│ Question:    │               │ Module 2: 85%      │
│ ...text...   │               │ Module 3: 88%      │
│              │               │ [Phase Quiz] ✓88%  │
│ ○ Opt 1      │               └─────────────────────┘
│ ◉ Opt 2      │
│ ○ Opt 3      │               ScoreTracker:
│ ○ Opt 4      │               ┌─────────────────────┐
│              │               │ Overall: 85/100    │
├──────────────┤               │ Progress: 66%      │
│ [Previous]   │               │ Accuracy: 84%      │
│    [Next]    │               │ Phase Scores...    │
└──────────────┘               └─────────────────────┘
```

---

**All visual layouts are responsive and adapt to different screen sizes!**
