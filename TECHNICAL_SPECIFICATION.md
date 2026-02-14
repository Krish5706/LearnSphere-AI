/**
 * TECHNICAL SPECIFICATION: Roadmap Topic Extraction Improvements
 * 
 * This document describes the technical implementation of the enhanced
 * topic extraction system for LearnSphere AI learning roadmaps.
 * 
 * Date: February 14, 2026
 * Version: 1.0
 */

// ============================================================================
// 1. ARCHITECTURE OVERVIEW
// ============================================================================

The improved topic extraction system follows a multi-stage pipeline:

Stage 1: Main Extraction (Gemini AI)
   ├─ Optimized prompts (concise, focused)
   ├─ Timeout handling (30-45 seconds)
   └─ JSON response cleanup (markdown removal)

Stage 2: Primary Parsing
   ├─ Regex-based JSON extraction
   ├─ Whitespace normalization
   ├─ Validation (9+ topics required)
   └─ Phase distribution check

Stage 3: Fallback Extraction (Phase-by-Phase)
   ├─ Phase 1: Basics (8 seconds timeout)
   ├─ Phase 2: Applications (8 seconds timeout)
   ├─ Phase 3: Advanced (8 seconds timeout)
   └─ Error handling per-phase

Stage 4: Keyword Extraction (Final Fallback)
   ├─ Capitalized phrase extraction
   ├─ Section header detection
   ├─ Dictionary-based filtering
   └─ Content chunking

// ============================================================================
// 2. IMPROVED EXTRACTION PROMPTS
// ============================================================================

OLD APPROACH (FAILING):
```
You are analyzing educational content about "${mainTopicData.mainTopic}" 
to create a structured learning roadmap... [3000+ character prompt]
```
→ Too verbose, confuses AI, inconsistent results

NEW APPROACH (WORKING):
```
Extract learning topics from this "${mainTopicData.mainTopic}" document 
for ${numPhases} learning phases.

REQUIREMENTS:
- Phase 1: 5-6 FOUNDATIONAL topics
- Phase 2: 5-6 INTERMEDIATE topics (different from Phase 1)
- Phase 3: 5-6 ADVANCED topics (different from Phases 1&2)
- ALL topic names MUST appear in the content
- Return ONLY JSON (no explanation)
```
→ Concise, clear, gets consistent AI responses

// ============================================================================
// 3. JSON RESPONSE HANDLING
// ============================================================================

Problem: Gemini sometimes returns JSON wrapped in markdown code blocks:

```json
{
  "phase1Topics": [...]
}
```

Solution: Multi-step cleanup:

Step 1: Trim whitespace
  result.trim()

Step 2: Remove markdown code blocks
  - Remove "```json" prefix
  - Remove trailing "```"
  - Remove standalone "```"

Step 3: Flexible regex matching
  - Try full object match: /\{[\s\S]*\}/
  - Try end-anchored match: /\{[\s\S]*?}\s*$/

Step 4: Validate JSON structure
  - JSON.parse() with try-catch
  - Check for required fields
  - Validate array lengths

// ============================================================================
// 4. FALLBACK EXTRACTION STRATEGY
// ============================================================================

PHASE-BY-PHASE EXTRACTION:
```
For each phase (i=0 to numPhases-1):
  1. Extract 10KB of content from phase section
  2. Create phase-specific prompt focusing on:
     - Phase 1: "fundamental concepts, core theory, basics, terminology"
     - Phase 2: "practical methods, techniques, real-world use"
     - Phase 3: "advanced strategies, optimization, complex scenarios"
  3. Set shorter timeout (15 seconds)
  4. Parse JSON response
  5. If fails: Fall through to keyword extraction
  6. Store topics for this phase
```

KEYWORD-BASED EXTRACTION:
```
1. Split content into sentences (min 20 chars)
2. Find capitalized phrases matching pattern:
   /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g
3. Filter by:
   - Not equal to main topic
   - Max 4 words per phrase
   - At least 3 characters
4. Limit to requested count
5. Return as fallback topics
```

SECTION DETECTION:
```
Extract potential section headers using patterns:
- Markdown headers: /^#{1,4}\s+(.+)$/gm
- Colon-ending sections: /^(\w[\w\s]{5,}:)$/gm
- Chapter/section markers: /^(Chapter|Section|Unit|Part|Module)/
Return top 20 unique sections
```

// ============================================================================
// 5. TOPIC VALIDATION & FORMATTING
// ============================================================================

Input Validation:
  ├─ Topics must be non-null objects with 'name' property
  ├─ Names must be non-empty strings
  ├─ Trim all string values
  ├─ Parse difficulty as string (easy|medium|hard)
  ├─ Convert keyTerms to string array
  └─ Generate IDs if missing

Type Safety:
  ├─ String(value).trim() for names/descriptions
  ├─ Array.isArray() check for keyTerms
  ├─ Safe defaults for missing fields
  ├─ Phase number assignment
  └─ Uniqueness validation

Uniqueness Requirements:
  ├─ Phase 1 topics must NOT appear in Phase 2 or 3
  ├─ Phase 2 topics must NOT appear in Phase 3
  ├─ All topics within phase must be unique
  ├─ Case-insensitive comparison
  └─ Trim before comparing

// ============================================================================
// 6. MODULE GENERATION FROM TOPICS
// ============================================================================

OLD APPROACH:
  Always create 3 modules
  → Results in empty modules if not enough topics
  → Poor topic distribution

NEW APPROACH:
  1. Calculate module count: max(2, min(3, ceil(topicCount / 2)))
  2. Calculate topics per module: ceil(topicCount / moduleCount)
  3. Create modules only when there are topics
  4. Skip empty module slots
  5. Create default module only if phase would be empty

Example:
  Phase has 5 topics
  → Create 3 modules
  → Module 1: 2 topics
  → Module 2: 2 topics
  → Module 3: 1 topic

  Phase has 2 topics
  → Create 2 modules
  → Module 1: 1 topic
  → Module 2: 1 topic

// ============================================================================
// 7. ERROR HANDLING & LOGGING
// ============================================================================

Timeout Handling:
  - Main extraction: 30-45 seconds
  - Phase extraction: 15 seconds each
  - Lesson generation: 15-20 seconds
  - Description generation: 8-10 seconds
  - Fallback if timeout: Try next strategy

Error Logging:
  - Level 1: ✅ Success messages
  - Level 2: ⚠️ Warning messages (fallback used)
  - Level 3: ❌ Error messages (logged, system continues)
  - Level 4: 🚨 Critical errors (system stops)

Graceful Degradation:
  If Gemini fails
    → Try phase-by-phase extraction
      → Try keyword extraction
        → Use minimal default topics
          → Continue with roadmap

// ============================================================================
// 8. PERFORMANCE OPTIMIZATIONS
// ============================================================================

Content Chunking (RAG-like):
  - Split content into 4KB chunks with 500-char overlap
  - Allow fast retrieval of relevant sections
  - Score chunks by topic keyword matches
  - Return top 3 most relevant chunks

Memory Management:
  - Store chunks in instance variable
  - Reuse chunks for different queries
  - Limit to first 20KB of content per prompt
  - Clean up after processing

Parallel Operations:
  - Cannot parallelize API calls (rate limiting)
  - Sequential phase extraction (ordered, deterministic)
  - Pre-compute content sections upfront
  - Cache main topic extraction

// ============================================================================
// 9. QUALITY METRICS
// ============================================================================

Success Criteria:
  ✅ Topics extracted: >= 9 (3 per phase minimum)
  ✅ Phases with content: 3 (for beginner)
  ✅ Unique topics per phase: 100% (no repeats)
  ✅ Modules generated: >= 6 (2+ per phase)
  ✅ Lessons generated: >= 6 (1+ per module minimum)
  ✅ No empty modules: Always > 0 topics per module
  ✅ No NULL/undefined values: All fields present
  ✅ Extraction time: < 2 minutes

Debugging Information:
  - Console logs show extraction progress
  - Logs indicate which strategy succeeded
  - Phase-by-phase topic counts displayed
  - Final roadmap statistics printed

// ============================================================================
// 10. BACKWARD COMPATIBILITY
// ============================================================================

The improved system maintains backward compatibility:

- Same API endpoints (no changes required)
- Same data model (no schema changes)
- Same learning path structure
- Quizzes work with new topics
- Lessons integrate properly
- Progress tracking unchanged
- Export functionality preserved

Only internal changes to roadmapService.js:
  - Better prompts (same AI model)
  - Better parsing (handles more response formats)
  - Better fallbacks (ensures completion)
  - Better logging (for debugging)

// ============================================================================
// 11. INTEGRATION POINTS
// ============================================================================

Called By:
  - documentControllerNew.js (processPDF function)
    Calls: roadmapService.generateEnhancedRoadmap()

Depends On:
  - GoogleGenerativeAI (@google/generative-ai)
    Uses: generateContent() API
  - MongoDB models (not directly)
  - Environment: GEMINI_API_KEY

Calls:
  - extractMainDocumentTopic() - Get document subject
  - extractComprehensiveTopics() - Extract all topics  
  - extractTopicsFallback() - Fallback extraction
  - generatePhasesWithTopics() - Create phase structure
  - generateModulesForPhaseWithTopics() - Create modules
  - generateLessonsForModule() - Create lesson content
  - QuizService.generatePhaseQuiz() - Create quizzes

// ============================================================================
// 12. TESTING STRATEGY
// ============================================================================

Unit Tests (to implement):
  - extractTopicsFromKeywords() with various inputs
  - formatExtractedTopics() with missing/invalid data
  - Topic uniqueness validation per-phase
  - JSON parsing with various markdown formats

Integration Tests (to implement):
  - Full roadmap generation flow
  - Fallback chain execution
  - Module/lesson generation
  - Quiz creation from topics

Manual Testing:
  - Use test-roadmap-improvements.js
  - Test with different PDF types:
    * Well-structured textbooks (40+ pages)
    * Articles/blogs (5-10 pages)
    * Presentation slides (10-20 slides)
  - Verify topics appear in UI
  - Verify modules have content
  - Verify quizzes are based on topics

// ============================================================================
// 13. FUTURE ENHANCEMENTS
// ============================================================================

Phase 2 Improvements:
  - Custom topic templates
  - User-editable topic list
  - Topic visualization/mind maps
  - Cross-topic prerequisites
  - Topic difficulty adjustment
  - AI-powered topic suggestions

Phase 3 Enhancements:
  - Multi-language support
  - Advanced NLP for topic extraction
  - Automatic topic hierarchy generation
  - Personalized topic recommendations
  - Integration with external knowledge bases
  - Topic relevance scoring

Phase 4 - Project Management:
  - Version control for roadmaps
  - Collaborative editing
  - Community-contributed topics
  - Topic marketplace
  - Expert review system

// ============================================================================

End of Technical Specification
Version: 1.0
Last Updated: February 14, 2026
