# Lesson Selection Validation System

## Overview

The Lesson Selection Validation System enforces strict rules to ensure **only explicitly selected lessons** are processed by the system. This prevents auto-mapping, inference-based additions, or cross-phase contamination.

## Core Rules

### Rule 1: No Auto-Selection
When a user selects lessons from Phase 1, the system **MUST NOT** automatically select corresponding lessons from Phase 2 or other phases.

```javascript
// ❌ WRONG: Auto-selecting Phase 2 when Phase 1 is selected
if (selectedLessonsPhase1.length > 0) {
  addPhase2Lessons(); // VIOLATION!
}

// ✅ CORRECT: Each phase is independent
const phase1 = filterByPhase(selections, 'phase_1');
const phase2 = filterByPhase(selections, 'phase_2'); // Independent
```

### Rule 2: Explicit Selections Only
**Only process the exact lessons the user selected**. Return no more, no less.

```javascript
// ❌ WRONG: Returning more lessons than selected
return allLessons.filter(lesson => lesson.isRelevant); // Auto-inference!

// ✅ CORRECT: Return exactly what was selected
const selectedIds = new Set(userSelectedIds);
return allLessons.filter(lesson => selectedIds.has(lesson.id));
```

### Rule 3: No Inference or Mapping
Do not infer additional selections based on lesson relationships, prerequisites, or dependencies.

```javascript
// ❌ WRONG: Inferring related lessons
const selected = [lesson1];
const related = getRelatedLessons(lesson1); // VIOLATION!
return [...selected, ...related];

// ✅ CORRECT: Return only what was explicitly selected
return [lesson1]; // Only what user selected
```

### Rule 4: Phase Independence
Each phase is a completely independent scope. A selection in Phase 1 has **zero impact** on Phase 2.

```javascript
// ❌ WRONG: Cross-phase dependency
const phase1Selected = [...];
const phase2Auto = phase1Selected.map(l => getMappedPhase2Lesson(l)); // VIOLATION!

// ✅ CORRECT: Phases are independent
const phase1Selected = filterByPhase(selections, 'phase_1');
const phase2Selected = filterByPhase(selections, 'phase_2'); // Completely independent
```

### Rule 5: Exact Selection Matching
If a user manually selects multiple lessons, return **ONLY** those exact lessons. No additions, no removals.

```javascript
// ❌ WRONG: Modifying selections
const userSelected = [les_1, les_2, les_3];
return userSelected.filter(l => l.isEssential); // Removed les_3!

// ✅ CORRECT: Return exactly what was selected
const userSelected = [les_1, les_2, les_3];
return userSelected; // Unchanged
```

### Rule 6: Clarify, Don't Assume
When unclear, ask the user instead of making assumptions.

```javascript
// ❌ WRONG: Assuming all lessons are needed
if (userSelectsPhase1) {
  selectAllLessons(); // Assumption!
}

// ✅ CORRECT: Require explicit selections
if (!selectedLessonIds || selectedLessonIds.length === 0) {
  return error("Explicit lesson selections required");
}
```

## Implementation

### 1. Validation Service

**Location**: `backend/services/lessonSelectionValidator.js`

Provides core validation functions:

```javascript
const LessonSelectionValidator = require('./services/lessonSelectionValidator');

// Validate and filter lessons
const result = LessonSelectionValidator.validateAndFilterLessons(
  allLessons,
  selectedLessonIds
);

// Filter by phase (independently)
const phaseResult = LessonSelectionValidator.filterLessonsByPhaseStrict(
  allLessons,
  'phase_1',
  selectedIds
);

// Multi-phase validation
const multiPhase = LessonSelectionValidator.validateMultiPhaseSelections(
  allLessons,
  { phase_1: [ids], phase_2: [ids] }
);

// Detect violations
const violations = LessonSelectionValidator.reportSelectionViolations(
  expectedLessons,
  actualReturnedLessons
);
```

### 2. Middleware

**Location**: `backend/middleware/lessonSelectionMiddleware.js`

Middleware functions for route protection:

```javascript
const {
  validateLessonSelection,
  enforceExplicitSelection,
  wrapLessonResponse,
  reportSelectionViolations
} = require('./middleware/lessonSelectionMiddleware');

// Use in routes
router.post('/lessons/filter', 
  validateLessonSelection,
  enforceExplicitSelection,
  reportSelectionViolations,
  controller.filterLessons
);
```

### 3. Controller

**Location**: `backend/controllers/lessonSelectionController.js`

Provides endpoints for lesson filtering:

- `filterLessonsBySelection()` - Filter by explicit selections
- `validateSelections()` - Validate multi-phase selections
- `getLessonsByPhase()` - Get phase lessons with optional filtering
- `getFilteredRoadmap()` - Get filtered roadmap

### 4. Routes

**Location**: `backend/routes/lessonSelectionRoutes.js`

Accessible endpoints:

```
POST   /api/lessons/filter                - Filter by selections
POST   /api/lessons/validate-selections   - Validate selections
GET    /api/lessons/:documentId/phase/:phaseId - Get phase lessons
POST   /api/lessons/:documentId/filter-roadmap - Get filtered roadmap
GET    /api/lessons/docs/rules            - View validation rules
```

## API Usage Examples

### Filter Lessons by Explicit Selection

```bash
POST /api/lessons/filter
Content-Type: application/json

{
  "documentId": "doc_123",
  "selectedLessonIds": ["les_1_1_1", "les_1_1_2", "les_2_1_1"],
  "phaseId": "phase_1"
}
```

**Response** (success):
```json
{
  "success": true,
  "message": "Successfully validated 3 explicit lesson selections",
  "selectedLessons": [
    { "lessonId": "les_1_1_1", "title": "...", "phaseId": "phase_1" },
    { "lessonId": "les_1_1_2", "title": "...", "phaseId": "phase_1" }
  ],
  "validation": {
    "allSelectionsExplicit": true,
    "totalSelected": 2,
    "phasesRepresented": ["phase_1"],
    "warnings": []
  }
}
```

### Validate Multi-Phase Selections

```bash
POST /api/lessons/validate-selections
Content-Type: application/json

{
  "documentId": "doc_123",
  "phaseSelections": {
    "phase_1": ["les_1_1_1", "les_1_1_2"],
    "phase_2": ["les_2_1_1"]
  }
}
```

**Response** (success):
```json
{
  "success": true,
  "message": "Selection validation complete",
  "validation": {
    "totalPhases": 2,
    "totalLessonsSelected": 3,
    "phasesWithSelections": ["phase_1", "phase_2"],
    "warnings": [
      "Selections span 2 phases. Remember: Each phase is treated independently."
    ]
  },
  "selectedByPhase": {
    "phase_1": {
      "success": true,
      "totalSelected": 2,
      "totalAvailable": 6,
      "warnings": []
    },
    "phase_2": {
      "success": true,
      "totalSelected": 1,
      "totalAvailable": 6,
      "warnings": []
    }
  }
}
```

## Violation Detection

The system detects and reports violations:

```javascript
// Detect if system is returning more lessons than selected
const violations = LessonSelectionValidator.reportSelectionViolations(
  expectedLessons,      // What user selected
  returnedLessons       // What system returned
);

if (violations.isViolation) {
  console.error(`❌ VIOLATION: ${violations.unauthorizedAdditions} unselected lessons returned`);
  // Log unauthorized additions
  console.error(`Unauthorized: ${violations.unauthorizedLessons}`);
}
```

Response includes violation warnings:
```json
{
  "success": false,
  "message": "Violations detected",
  "__violations": {
    "detected": true,
    "message": "System returned more lessons than user selected",
    "selectedCount": 2,
    "returnedCount": 5,
    "unauthorized": 3
  }
}
```

## Integration Guide

### 1. Add Routes to Server

In `backend/server.js`:

```javascript
const lessonSelectionRoutes = require('./routes/lessonSelectionRoutes');
app.use('/api/lessons', lessonSelectionRoutes);
```

### 2. Use in Existing Endpoints

Wrap responses:

```javascript
const { wrapLessonResponse } = require('./middleware/lessonSelectionMiddleware');
const LessonSelectionValidator = require('./services/lessonSelectionValidator');

// In your endpoint
const selectedIds = req.body.selectedLessonIds;
const lessons = getFilteredLessons();

// Validate before returning
const response = wrapLessonResponse(selectedIds, lessons);
res.json(response);
```

### 3. Use in Controllers

```javascript
const LessonSelectionValidator = require('../services/lessonSelectionValidator');

// Validate selections
const result = LessonSelectionValidator.validateAndFilterLessons(
  allLessons,
  selectedLessonIds
);

if (!result.success) {
  return res.status(400).json(result);
}

return res.json(result);
```

## Response Validation

Always check for violations in responses:

```javascript
const response = await fetch('/api/lessons/filter', {
  method: 'POST',
  body: JSON.stringify({
    documentId: 'doc_123',
    selectedLessonIds: ['les_1', 'les_2']
  })
});

const data = await response.json();

// Check for violations
if (data.__violations && data.__violations.detected) {
  console.error('Selection violations detected:', data.__violations);
} else if (data.success) {
  console.log('Valid selection:', data.selectedLessons);
}
```

## Testing

### Test Case 1: Single Phase Selection
```javascript
// User selects 2 lessons from Phase 1
selectedLessonIds = ['les_1_1_1', 'les_1_1_2'];
phaseId = 'phase_1';

// System should return ONLY these 2 lessons
// NOT add any Phase 2 lessons
// NOT infer related lessons
```

### Test Case 2: Multi-Phase Selection
```javascript
// User explicitly selects from different phases
phaseSelections = {
  'phase_1': ['les_1_1_1', 'les_1_1_2'],
  'phase_2': ['les_2_1_1']
};

// System should:
// ✅ Return exactly these 3 lessons
// ✅ Treat each phase independently
// ❌ NOT add Phase 2 lessons just because Phase 1 was selected
// ❌ NOT infer matching lessons in Phase 2
```

### Test Case 3: No Cross-Phase Interference
```javascript
// Phase 1 lesson 'Basics' is selected
selectedLessonIds = ['les_1_1_1_basics'];

// System should NOT select:
// ❌ 'Advanced Basics' from Phase 2
// ❌ 'Applying Basics' from Phase 3
// ❌ Any other "related" lessons

// System SHOULD return:
// ✅ Only 'les_1_1_1_basics'
```

## Monitoring

Enable logging for violations:

```javascript
// In middleware
const reportSelectionViolations = (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    if (data.__violations?.detected) {
      console.error('🚨 SELECTION VIOLATION:', {
        selectedCount: data.__violations.selectedCount,
        returnedCount: data.__violations.returnedCount,
        unauthorized: data.__violations.unauthorized,
        timestamp: new Date()
      });
    }
    return originalJson(data);
  };
  next();
};
```

## Error Messages

### No Selections
```json
{
  "success": false,
  "message": "No explicit lesson selections provided",
  "error": "INVALID_SELECTIONS"
}
```

### Invalid Selection
```json
{
  "success": false,
  "message": "Invalid lesson selections: les_invalid_1, les_invalid_2",
  "validation": {
    "invalidSelections": ["les_invalid_1", "les_invalid_2"]
  }
}
```

### Phase Not Found
```json
{
  "success": false,
  "message": "No lessons found for phase: phase_999"
}
```

## Best Practices

1. **Always validate**: Use `validateAndFilterLessons()` before returning any lessons
2. **Report violations**: Check for `__violations` in responses
3. **Phase independence**: Never map or link selections across phases
4. **Explicit only**: Reject empty selections with clear error messages
5. **Audit trail**: Log all selection requests and violations
6. **Clarify ambiguity**: Ask users for explicit selections rather than guessing

## Support

For questions or issues with lesson selection validation, refer to:
- `backend/services/lessonSelectionValidator.js` - Core validation logic
- `backend/middleware/lessonSelectionMiddleware.js` - Middleware implementations
- `backend/controllers/lessonSelectionController.js` - API endpoints
- `backend/routes/lessonSelectionRoutes.js` - Route definitions
