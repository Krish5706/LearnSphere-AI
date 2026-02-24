/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROFESSIONAL GEMINI PROMPTS FOR COURSERA-STYLE LEARNING ROADMAP
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Structure: COURSE → PHASES → MODULES → LESSONS → TOPICS (with Detailed Content)
 * 
 * CRITICAL PRINCIPLES:
 * 1. ALL content is extracted ONLY from the PDF - ZERO static/default values
 * 2. Every response must be derived from actual document content
 * 3. If document doesn't have enough content, indicate gaps - don't fill with generic
 * 4. Full PDF content is sent for processing - no truncation of important data
 * 
 * @author LearnSphere AI
 * @version 2.0.0
 */

class ImprovedGeminiPrompts {
    
    // ============================================================================
    // SECTION 1: COMPLETE COURSE ANALYSIS & STRUCTURE EXTRACTION
    // ============================================================================

    /**
     * Master Analysis - Deep Analysis of Entire Document
     * This extracts the complete structure and maps ALL content
     */
    static getCourseAnalysisPrompt(fullContent) {
        return `You are an expert educational curriculum architect. Perform COMPREHENSIVE analysis of this document.

═══════════════════════════════════════════════════════════════════════════════
COMPLETE DOCUMENT CONTENT:
═══════════════════════════════════════════════════════════════════════════════
${fullContent}
═══════════════════════════════════════════════════════════════════════════════

YOUR TASK: Extract the COMPLETE structure and content map of this document.

ANALYSIS REQUIREMENTS:
1. Identify the EXACT course/subject title from the document
2. Extract ALL chapters, sections, and subsections with their hierarchy
3. Identify the target audience and prerequisite knowledge mentioned
4. Map every key concept, terminology, and definition found
5. List all practical examples, case studies, and exercises
6. Determine the logical learning progression

═══════════════════════════════════════════════════════════════════════════════
STRICT RULES (FOLLOW EXACTLY):
═══════════════════════════════════════════════════════════════════════════════
✗ DO NOT generate or invent topics not explicitly in the document
✗ DO NOT use generic terms like "Introduction", "Overview", "Getting Started"
✗ DO NOT add external information not present in the document
✓ Use EXACT phrases and terminology from the document
✓ Quote directly from the document when possible
✓ Reference specific section/chapter locations

Return ONLY this JSON structure (no markdown, no explanation):

{
    "courseTitle": "Exact title/subject from document (quoted if possible)",
    "courseSubtitle": "Secondary title or tagline if present",
    "courseDescription": "Description using document's own words",
    "documentMetadata": {
        "totalWords": 0,
        "totalChapters": 0,
        "totalSections": 0,
        "hasTableOfContents": true,
        "hasIndex": true,
        "hasGlossary": true,
        "documentType": "textbook/manual/guide/tutorial/reference/course-material"
    },
    "targetAudience": {
        "explicitlyStated": "What the document says about its audience",
        "inferredLevel": "beginner/intermediate/advanced/expert",
        "prerequisites": ["Listed prerequisites from document"],
        "assumedKnowledge": ["What knowledge is assumed"]
    },
    "chapters": [
        {
            "chapterNumber": 1,
            "title": "Exact chapter title from document",
            "startLocation": "Page/section reference",
            "sections": [
                {
                    "sectionNumber": "1.1",
                    "title": "Exact section title",
                    "mainTopics": ["Topic 1 from section", "Topic 2"],
                    "keyTermsDefined": ["term1", "term2"],
                    "hasExamples": true,
                    "hasExercises": true
                }
            ],
            "chapterSummary": "What this chapter teaches",
            "estimatedReadingTime": "X minutes"
        }
    ],
    "allConceptsExtracted": {
        "foundational": ["Basic concept 1 from doc", "Basic concept 2"],
        "intermediate": ["Building concept 1", "Building concept 2"],
        "advanced": ["Complex concept 1", "Complex concept 2"]
    },
    "terminologyExtracted": [
        {
            "term": "Term from document",
            "definition": "Exact definition as stated",
            "location": "Where defined in document",
            "relatedTerms": ["related1", "related2"]
        }
    ],
    "examplesFound": [
        {
            "title": "Example title/description",
            "type": "worked-example/case-study/scenario/illustration",
            "location": "Chapter/section reference",
            "concepts demonstrated": ["concept1", "concept2"]
        }
    ],
    "exercisesFound": [
        {
            "title": "Exercise title",
            "type": "practice/review/application/project",
            "location": "Chapter/section reference",
            "skillsTested": ["skill1", "skill2"]
        }
    ],
    "learningProgression": {
        "suggestedPath": "How document suggests learning the material",
        "dependencies": "What builds on what",
        "phase1Content": ["Chapters/sections for foundations"],
        "phase2Content": ["Chapters/sections for intermediate"],
        "phase3Content": ["Chapters/sections for advanced"]
    },
    "uniqueFeatures": {
        "specialSections": ["Any special sections like tips, notes, warnings"],
        "pedagogicalApproach": "Teaching method used",
        "visualElements": "Diagrams, charts, figures mentioned"
    }
}`;
    }

    /**
     * Extract Main Topic - Quick Analysis for Smaller Documents
     */
    static getMainTopicPrompt(contentSample) {
        return `You are an expert document analyzer. Extract the PRIMARY SUBJECT from this document.

═══════════════════════════════════════════════════════════════════════════════
DOCUMENT CONTENT:
═══════════════════════════════════════════════════════════════════════════════
${contentSample}
═══════════════════════════════════════════════════════════════════════════════

EXTRACTION REQUIREMENTS (STRICT - Document Content Only):
1. Find the EXACT main subject using the document's own terminology
2. Extract 3-5 sub-topics that are EXPLICITLY mentioned
3. Determine expertise level based on vocabulary and depth
4. List practical applications STATED in the document
5. Extract core terminology that appears repeatedly

CRITICAL: Return ONLY information that EXISTS in the document.

Return ONLY this JSON (no markdown, no code blocks):
{
    "mainTopic": "Exact main subject from document (use document's words)",
    "mainTopicSource": "Where in document this was identified",
    "subTopics": [
        {
            "name": "Subtopic directly from content",
            "location": "Where mentioned"
        }
    ],
    "targetLevel": "beginner/intermediate/advanced",
    "levelEvidence": "Why this level (based on document language)",
    "practicalApplications": [
        {
            "application": "Application mentioned in doc",
            "context": "Where/how mentioned"
        }
    ],
    "coreTerminology": [
        {
            "term": "Term from doc",
            "frequency": "How often appears",
            "definition": "If defined in document"
        }
    ],
    "contentType": "textbook/tutorial/course/guide/research-paper/manual/reference",
    "summary": "2-3 sentences summarizing document purpose using document's language"
}`;
    }

    // ============================================================================
    // SECTION 2: PHASE GENERATION (Course → Phases)
    // ============================================================================

    /**
     * Generate Learning Phases from Document Analysis
     */
    static generatePhasesPrompt(courseAnalysis, fullContent, numPhases = 3) {
        const analysisJson = typeof courseAnalysis === 'string' 
            ? courseAnalysis 
            : JSON.stringify(courseAnalysis, null, 2);
        
        return `You are a professional curriculum architect designing a Coursera-style learning path.

═══════════════════════════════════════════════════════════════════════════════
DOCUMENT ANALYSIS:
═══════════════════════════════════════════════════════════════════════════════
${analysisJson}

═══════════════════════════════════════════════════════════════════════════════
FULL DOCUMENT CONTENT:
═══════════════════════════════════════════════════════════════════════════════
${fullContent}
═══════════════════════════════════════════════════════════════════════════════

TASK: Design ${numPhases} LEARNING PHASES covering ALL document content.

═══════════════════════════════════════════════════════════════════════════════
PHASE DESIGN PRINCIPLES:
═══════════════════════════════════════════════════════════════════════════════
• Phase 1 (FOUNDATIONS): Core concepts, definitions, basic principles
  - Cover: First ~30% of document content
  - Goal: Build foundational understanding
  
• Phase 2 (APPLICATION): Intermediate concepts, practical implementation
  - Cover: Middle ~40% of document content
  - Goal: Apply knowledge to real scenarios
  
• Phase 3 (MASTERY): Advanced topics, complex applications, expertise
  - Cover: Final ~30% of document content
  - Goal: Achieve expert-level understanding

═══════════════════════════════════════════════════════════════════════════════
STRICT REQUIREMENTS:
═══════════════════════════════════════════════════════════════════════════════
✓ ALL content from document MUST be assigned to a phase
✓ NO phase content should overlap
✓ Phase names must reflect actual document terminology
✓ Map specific chapters/sections to each phase
✓ Calculate realistic time estimates based on content volume

Return ONLY this JSON:
{
    "courseName": "Exact course name from document",
    "totalPhases": ${numPhases},
    "documentCoverage": {
        "chaptersAssigned": "all/partial",
        "estimatedCoverage": "100%",
        "contentDistribution": "how content is split across phases"
    },
    "phases": [
        {
            "phaseId": "phase_1",
            "phaseNumber": 1,
            "phaseName": "Name using document terminology",
            "phaseObjective": "Clear objective from document content",
            "phaseDescription": "What learner achieves in this phase",
            "difficulty": "beginner",
            "chaptersIncluded": [
                {
                    "chapterRef": "Chapter 1: [Title]",
                    "sectionsIncluded": ["1.1", "1.2"],
                    "topicsCovered": ["topic from chapter"]
                }
            ],
            "keyConceptsCovered": [
                {
                    "concept": "Concept from document",
                    "definition": "As defined in document",
                    "importance": "Why critical to learn first"
                }
            ],
            "learningOutcomes": [
                "By end of phase, learner will understand [specific concept]",
                "Learner will be able to [specific skill from doc]",
                "Learner will know [specific knowledge from doc]"
            ],
            "estimatedHours": 0,
            "moduleCount": 0,
            "contentSummary": "Summary of phase content from document",
            "prerequisites": [],
            "progressMilestone": "What completion of this phase unlocks"
        }
    ],
    "progressionLogic": "How phases build on each other based on document structure",
    "completionBenefits": "What learner achieves after all phases"
}`;
    }

    // ============================================================================
    // SECTION 3: MODULE GENERATION (Phases → Modules)
    // ============================================================================

    /**
     * Generate Modules for a Phase
     */
    static generateModulesPrompt(phaseData, relevantContent, moduleCount = 3) {
        const phaseJson = typeof phaseData === 'string' 
            ? phaseData 
            : JSON.stringify(phaseData, null, 2);
        
        return `You are designing LEARNING MODULES for a Coursera-style course phase.

═══════════════════════════════════════════════════════════════════════════════
PHASE INFORMATION:
═══════════════════════════════════════════════════════════════════════════════
${phaseJson}

═══════════════════════════════════════════════════════════════════════════════
DOCUMENT CONTENT FOR THIS PHASE:
═══════════════════════════════════════════════════════════════════════════════
${relevantContent}
═══════════════════════════════════════════════════════════════════════════════

TASK: Create ${moduleCount} LEARNING MODULES for this phase.

═══════════════════════════════════════════════════════════════════════════════
MODULE DESIGN (Coursera Week-Style):
═══════════════════════════════════════════════════════════════════════════════
• Each module = ONE complete learning unit (like one Coursera week)
• Module duration: 2-4 hours of content
• Modules have: Objectives → Lessons → Quiz → Assignment
• NO content overlap between modules
• Each module has 3-4 lessons

═══════════════════════════════════════════════════════════════════════════════
STRICT REQUIREMENTS:
═══════════════════════════════════════════════════════════════════════════════
✓ Module titles from ACTUAL document sections/topics
✓ Each module maps to specific document sections
✓ ALL phase content must be distributed across modules
✓ Include document-specific terminology throughout

Return ONLY this JSON:
{
    "phaseId": "${phaseData.phaseId || 'phase_1'}",
    "phaseName": "${phaseData.phaseName || 'Phase'}",
    "totalModules": ${moduleCount},
    "modules": [
        {
            "moduleId": "mod_1",
            "moduleNumber": 1,
            "moduleName": "Module title from document content",
            "moduleDescription": "What this module covers (from document)",
            "estimatedMinutes": 120,
            "documentSections": [
                {
                    "sectionRef": "Section reference",
                    "contentCovered": "What from this section"
                }
            ],
            "learningObjectives": [
                "Understand [specific concept from doc]",
                "Apply [specific skill from doc]",
                "Analyze [specific topic from doc]"
            ],
            "topicsCovered": [
                {
                    "topicId": "t1",
                    "topicName": "EXACT topic name from document",
                    "topicDescription": "Description from document",
                    "keyTerms": ["term1 from doc", "term2 from doc"],
                    "importance": "critical/high/medium",
                    "estimatedMinutes": 30
                }
            ],
            "conceptsIntroduced": [
                {
                    "concept": "Concept from document",
                    "definition": "Document's definition",
                    "relatedTo": ["other concepts"]
                }
            ],
            "lessonsCount": 3,
            "lessonTopics": ["Lesson 1 focus", "Lesson 2 focus", "Lesson 3 focus"],
            "moduleQuiz": {
                "questionCount": 5,
                "topicsCovered": ["topics quiz will test"],
                "passingScore": 70
            },
            "practicalComponent": {
                "hasAssignment": true,
                "assignmentType": "exercise/project/case-study",
                "assignmentBasis": "Based on what from document"
            },
            "prerequisiteModules": [],
            "skillsGained": ["Skill 1 from content", "Skill 2"]
        }
    ],
    "moduleProgression": "How modules connect and build knowledge"
}`;
    }

    // ============================================================================
    // SECTION 4: LESSON GENERATION (Modules → Lessons)
    // ============================================================================

    /**
     * Generate Detailed Lessons for a Module
     */
    static generateLessonsPrompt(moduleData, relevantContent) {
        const moduleJson = typeof moduleData === 'string' 
            ? moduleData 
            : JSON.stringify(moduleData, null, 2);
        
        const lessonCount = moduleData.lessonsCount || 3;
        
        return `You are an expert online instructor creating DETAILED LESSONS.

═══════════════════════════════════════════════════════════════════════════════
MODULE INFORMATION:
═══════════════════════════════════════════════════════════════════════════════
${moduleJson}

═══════════════════════════════════════════════════════════════════════════════
DOCUMENT CONTENT FOR THIS MODULE:
═══════════════════════════════════════════════════════════════════════════════
${relevantContent}
═══════════════════════════════════════════════════════════════════════════════

TASK: Create ${lessonCount} DETAILED LESSONS for this module.

═══════════════════════════════════════════════════════════════════════════════
LESSON STRUCTURE (Like Coursera Video Lecture):
═══════════════════════════════════════════════════════════════════════════════
Each lesson includes:
1. HOOK: Why this matters (from document context)
2. OBJECTIVES: What you'll learn (3-4 specific items)
3. CONTENT: Main material (4-6 paragraphs from document)
4. EXAMPLES: Real examples (FROM the document)
5. KEY POINTS: Critical takeaways (3-5 points)
6. PRACTICE: Activity to reinforce learning
7. SUMMARY: Brief wrap-up

Lesson duration: 15-30 minutes equivalent

═══════════════════════════════════════════════════════════════════════════════
STRICT REQUIREMENTS:
═══════════════════════════════════════════════════════════════════════════════
✓ ALL lesson content must come from the document
✓ Use EXACT terminology from the document
✓ Include ONLY examples that exist in the document
✓ Define terms as the document defines them
✓ Each lesson covers ONE clear topic

Return ONLY this JSON:
{
    "moduleId": "${moduleData.moduleId || 'mod_1'}",
    "moduleName": "${moduleData.moduleName || 'Module'}",
    "totalLessons": ${lessonCount},
    "lessons": [
        {
            "lessonId": "les_1",
            "lessonNumber": 1,
            "lessonTitle": "Specific title from document content",
            "lessonDuration": "20 minutes",
            "lessonType": "concept/application/analysis/synthesis",
            "documentReference": "Which section(s) this covers",
            "introduction": {
                "hook": "Engaging opening that explains relevance",
                "context": "Where this fits in the learning journey",
                "preview": "What you will learn (overview)"
            },
            "learningObjectives": [
                "After this lesson, you will understand [specific concept]",
                "You will be able to [specific skill]",
                "You will know [specific knowledge]"
            ],
            "mainContent": {
                "sections": [
                    {
                        "sectionTitle": "Section heading from document",
                        "content": "Detailed paragraph explaining concept - use document content",
                        "keyTermsUsed": {
                            "term": "definition from document"
                        }
                    },
                    {
                        "sectionTitle": "Next section",
                        "content": "Continue explanation with document content",
                        "keyTermsUsed": {}
                    }
                ],
                "totalContentParagraphs": 4,
                "conceptsCovered": ["concept1", "concept2"]
            },
            "examples": [
                {
                    "exampleTitle": "Example from document",
                    "exampleType": "worked/illustration/case-study",
                    "scenario": "The specific scenario/context",
                    "demonstration": "Step-by-step example as in document",
                    "explanation": "Why this example works",
                    "keyLesson": "What to remember from this"
                }
            ],
            "keyPoints": [
                "Most important takeaway 1 (from document)",
                "Most important takeaway 2",
                "Most important takeaway 3"
            ],
            "terminology": [
                {
                    "term": "Term introduced in this lesson",
                    "definition": "Document's definition",
                    "usage": "How it's used in context"
                }
            ],
            "commonMisconceptions": [
                {
                    "misconception": "What learners might misunderstand",
                    "clarification": "The correct understanding"
                }
            ],
            "practiceActivity": {
                "activityType": "reflection/application/analysis/hands-on",
                "title": "Activity title",
                "instructions": "Step-by-step what to do",
                "expectedOutcome": "What success looks like",
                "timeRequired": "10 minutes"
            },
            "summary": "2-3 sentence summary of lesson content",
            "nextLessonPreview": "How this prepares for next lesson",
            "additionalResources": "Any resources mentioned in document"
        }
    ],
    "moduleConclusion": {
        "keyPointsSummary": ["All critical points from all lessons"],
        "conceptsMastered": ["Concepts learner should now understand"],
        "skillsAcquired": ["Skills learner can now apply"],
        "readyForQuiz": "Summary of what quiz will test"
    }
}`;
    }

    // ============================================================================
    // SECTION 5: DETAILED TOPIC CONTENT GENERATION
    // ============================================================================

    /**
     * Generate Comprehensive Topic Content
     */
    static generateTopicContentPrompt(topicName, topicContext, documentContent, phase, module) {
        const contextJson = typeof topicContext === 'object' 
            ? JSON.stringify(topicContext, null, 2) 
            : topicContext;
        
        return `You are creating COMPREHENSIVE LEARNING CONTENT for a specific topic.

═══════════════════════════════════════════════════════════════════════════════
TOPIC DETAILS:
═══════════════════════════════════════════════════════════════════════════════
Topic Name: ${topicName}
Phase: ${phase}
Module: ${module}
Context: ${contextJson}

═══════════════════════════════════════════════════════════════════════════════
DOCUMENT CONTENT (PRIMARY SOURCE - USE THIS):
═══════════════════════════════════════════════════════════════════════════════
${documentContent}
═══════════════════════════════════════════════════════════════════════════════

TASK: Create COMPREHENSIVE educational content for "${topicName}".

═══════════════════════════════════════════════════════════════════════════════
CONTENT DEPTH REQUIREMENTS:
═══════════════════════════════════════════════════════════════════════════════
1. OPENING: Context and importance (from document)
2. DEEP EXPLANATION: 4-6 paragraphs (document content)
3. TERMINOLOGY: All terms with document definitions
4. EXAMPLES: 2-3 concrete examples FROM document
5. CONNECTIONS: How topic relates to others in document
6. APPLICATIONS: Real-world uses STATED in document
7. SUMMARY: Key takeaways from document

═══════════════════════════════════════════════════════════════════════════════
ABSOLUTE RULES:
═══════════════════════════════════════════════════════════════════════════════
✗ DO NOT add information not in the document
✗ DO NOT paraphrase heavily - use document language
✗ DO NOT make up examples
✓ Quote from document where appropriate
✓ Reference document sections
✓ Use exact terminology

Return ONLY this JSON:
{
    "topic": "${topicName}",
    "phase": "${phase}",
    "module": "${module}",
    "topicType": "concept/skill/procedure/theory/application",
    "overview": {
        "introduction": "Why this topic matters - from document context",
        "prerequisiteKnowledge": ["What learner should know before this"],
        "relevanceStatement": "How this fits in the bigger picture"
    },
    "coreContent": {
        "explanation": "Comprehensive 4-6 paragraph explanation using document content verbatim where possible. Cover: 1) What it is, 2) How it works, 3) Why it matters, 4) How to use it, 5) Common applications, 6) Key considerations.",
        "sections": [
            {
                "heading": "Section heading",
                "content": "Detailed explanation from document",
                "documentSource": "Which part of document this comes from"
            }
        ]
    },
    "terminology": {
        "term1": {
            "definition": "EXACT definition from document",
            "context": "How term is used",
            "example": "Example of usage from document",
            "documentLocation": "Where defined"
        }
    },
    "examples": [
        {
            "title": "Example title/identifier from document",
            "type": "worked-example/case-study/scenario/illustration",
            "description": "What this example demonstrates",
            "fullExample": "Complete example as it appears in document",
            "explanation": "Step-by-step breakdown",
            "keyInsight": "What this teaches"
        }
    ],
    "conceptConnections": {
        "relatedTopics": ["Topic 1 from same document", "Topic 2"],
        "dependsOn": ["Concepts this topic requires understanding of"],
        "enablesLearning": ["What topics this prepares you for"],
        "connectionExplanation": "How these topics interconnect"
    },
    "practicalApplications": [
        {
            "application": "Real-world use mentioned in document",
            "context": "When/where applied",
            "howTo": "How to apply",
            "documentReference": "Where this is discussed"
        }
    ],
    "keyTakeaways": [
        "Critical point 1 from document",
        "Critical point 2 from document",
        "Critical point 3 from document",
        "Critical point 4 from document"
    ],
    "selfAssessment": {
        "comprehensionQuestions": [
            "Can you explain [X] in your own words?",
            "What is the relationship between [A] and [B]?",
            "Why is [concept] important?"
        ],
        "applicationChallenges": [
            "Try applying [concept] to [scenario]",
            "Solve: [problem based on document content]"
        ]
    },
    "documentReferences": {
        "primarySections": ["Main document sections used"],
        "supplementarySections": ["Additional relevant sections"]
    }
}`;
    }

    // ============================================================================
    // SECTION 6: COMPREHENSIVE TOPICS EXTRACTION (All Topics at Once)
    // ============================================================================

    /**
     * Extract ALL Topics Organized by Phase
     */
    static getComprehensiveTopicsPrompt(fullContent, numPhases, mainTopic, courseAnalysis = null) {
        const analysisContext = courseAnalysis 
            ? `\nCOURSE ANALYSIS CONTEXT:\n${JSON.stringify(courseAnalysis, null, 2)}\n` 
            : '';
        
        return `You are extracting ALL LEARNABLE TOPICS from a document for phase-based learning.

═══════════════════════════════════════════════════════════════════════════════
MAIN SUBJECT: ${mainTopic}
${analysisContext}
═══════════════════════════════════════════════════════════════════════════════
COMPLETE DOCUMENT CONTENT (ANALYZE ENTIRELY):
═══════════════════════════════════════════════════════════════════════════════
${fullContent}
═══════════════════════════════════════════════════════════════════════════════

TASK: Extract EVERY learnable topic and organize into ${numPhases} phases.

═══════════════════════════════════════════════════════════════════════════════
WHAT IS A "TOPIC"?
═══════════════════════════════════════════════════════════════════════════════
• A distinct concept, skill, or knowledge area
• Something that can be learned and assessed
• Has its own definition/explanation in the document
• Can stand alone as a learning unit

═══════════════════════════════════════════════════════════════════════════════
PHASE DISTRIBUTION:
═══════════════════════════════════════════════════════════════════════════════
Phase 1 (FOUNDATIONS ${Math.round(100/numPhases)}%):
  - Basic concepts, definitions, introductory material
  - Prerequisites for everything else
  - Foundational terminology
  
Phase 2 (IMPLEMENTATION ${Math.round(100/numPhases)}%):
  - Practical applications, methods, techniques
  - Building on Phase 1 concepts
  - Real-world usage
  
Phase 3 (MASTERY ${100 - 2*Math.round(100/numPhases)}%):
  - Advanced topics, complex applications
  - Expert-level understanding
  - Synthesis and evaluation

═══════════════════════════════════════════════════════════════════════════════
CRITICAL REQUIREMENTS:
═══════════════════════════════════════════════════════════════════════════════
✓ Scan ENTIRE document - not just beginning
✓ Include ALL chapters, sections, subsections
✓ Topic names EXACTLY as they appear in document
✓ NO topic in multiple phases
✓ Minimum 5-8 topics per phase
✓ Every concept mentioned should be captured

Return ONLY this JSON:
{
    "mainTopic": "${mainTopic}",
    "totalTopicsExtracted": 0,
    "documentCoverageAssessment": {
        "percentageCovered": "percentage of document mapped to topics",
        "coverageNotes": "any content not mapped and why"
    },
    "phase1": {
        "phaseId": "phase_1",
        "phaseName": "Foundations of ${mainTopic}",
        "phaseDescription": "Core concepts and fundamentals",
        "difficulty": "beginner",
        "estimatedHours": 0,
        "documentSectionsCovered": ["Section references"],
        "topics": [
            {
                "topicId": "p1_t1",
                "name": "EXACT topic name from document",
                "nameSource": "Where this name appears in document",
                "description": "What this topic covers - from document",
                "keyTerms": ["term from doc", "another term"],
                "definitionInDoc": "How document defines/describes this topic",
                "estimatedMinutes": 30,
                "importance": "critical/high/medium",
                "documentSection": "Specific section reference",
                "prerequisites": ["None for Phase 1 foundational topics"],
                "learningObjectives": ["What learner will know/do"],
                "hasExamplesInDoc": true,
                "hasExercisesInDoc": false,
                "contentType": "concept/skill/procedure/theory/definition"
            }
        ]
    },
    "phase2": {
        "phaseId": "phase_2",
        "phaseName": "Applying ${mainTopic}",
        "phaseDescription": "Practical applications and intermediate concepts",
        "difficulty": "intermediate",
        "estimatedHours": 0,
        "documentSectionsCovered": ["Section references"],
        "topics": []
    },
    "phase3": {
        "phaseId": "phase_3",
        "phaseName": "Mastering ${mainTopic}",
        "phaseDescription": "Advanced applications and expertise",
        "difficulty": "advanced",
        "estimatedHours": 0,
        "documentSectionsCovered": ["Section references"],
        "topics": []
    },
    "topicDependencies": {
        "dependencyMap": {
            "topic_id": {
                "requires": ["prerequisite_topic_ids"],
                "enablesLearning": ["topics that need this first"]
            }
        }
    },
    "qualityAssurance": {
        "allSectionsMapped": true,
        "noGenericTopics": true,
        "allTopicsFromDocument": true,
        "unmappedContentIfAny": "description of any unmapped content"
    }
}`;
    }

    // ============================================================================
    // SECTION 7: ASSESSMENT GENERATION
    // ============================================================================

    /**
     * Generate Module Quiz
     */
    static generateModuleQuizPrompt(moduleData, lessonSummaries, documentContent) {
        const moduleJson = typeof moduleData === 'object' 
            ? JSON.stringify(moduleData, null, 2) 
            : moduleData;
        const lessonsJson = typeof lessonSummaries === 'object' 
            ? JSON.stringify(lessonSummaries, null, 2) 
            : lessonSummaries;
        
        return `You are creating a MODULE ASSESSMENT QUIZ.

═══════════════════════════════════════════════════════════════════════════════
MODULE INFORMATION:
═══════════════════════════════════════════════════════════════════════════════
${moduleJson}

LESSONS COVERED:
${lessonsJson}

═══════════════════════════════════════════════════════════════════════════════
DOCUMENT CONTENT (For Answer Verification):
═══════════════════════════════════════════════════════════════════════════════
${documentContent}
═══════════════════════════════════════════════════════════════════════════════

TASK: Create 8-10 multiple-choice questions testing module content.

═══════════════════════════════════════════════════════════════════════════════
QUIZ DESIGN PRINCIPLES:
═══════════════════════════════════════════════════════════════════════════════
• Question distribution: 30% easy, 50% medium, 20% hard
• Cover ALL lessons proportionally
• Test UNDERSTANDING, not just memorization
• Include application and analysis questions
• All answers MUST be verifiable from document

Question Types:
1. Conceptual: "What does X mean?"
2. Application: "How would you use X?"
3. Analysis: "Why does X happen?"
4. Comparison: "How does X differ from Y?"
5. Scenario: "Given situation Z, what happens?"

═══════════════════════════════════════════════════════════════════════════════
ABSOLUTE REQUIREMENTS:
═══════════════════════════════════════════════════════════════════════════════
✓ All questions based on document content
✓ Correct answers provable from document
✓ Explanations cite document
✓ No ambiguous questions
✓ All options plausible but only one correct

Return ONLY this JSON:
{
    "moduleId": "${moduleData.moduleId || 'mod_1'}",
    "quizTitle": "Module ${moduleData.moduleNumber || 1} Quiz: ${moduleData.moduleName || 'Module'}",
    "instructions": "Select the best answer for each question",
    "totalQuestions": 10,
    "passingScore": 70,
    "timeLimit": "20 minutes",
    "difficultyDistribution": {
        "easy": 3,
        "medium": 5,
        "hard": 2
    },
    "questions": [
        {
            "questionId": "q1",
            "questionNumber": 1,
            "questionType": "conceptual/application/analysis/comparison/scenario",
            "difficulty": "easy/medium/hard",
            "bloomsLevel": "remember/understand/apply/analyze/evaluate",
            "question": "Clear, specific question based on document",
            "questionContext": "Any necessary context for the question",
            "options": [
                {"id": "a", "text": "Option A text", "isCorrect": false},
                {"id": "b", "text": "Option B text", "isCorrect": false},
                {"id": "c", "text": "Option C text", "isCorrect": true},
                {"id": "d", "text": "Option D text", "isCorrect": false}
            ],
            "correctAnswer": "c",
            "explanation": {
                "whyCorrect": "Why the correct answer is right (cite document)",
                "whyOthersWrong": "Brief explanation of why other options are wrong",
                "documentReference": "Where in document this is covered"
            },
            "topicTested": "Which topic this question tests",
            "lessonReference": "Which lesson covered this"
        }
    ],
    "quizSummary": {
        "topicsCovered": ["Topic 1", "Topic 2"],
        "lessonsAssessed": ["Lesson 1", "Lesson 2"],
        "skillsTested": ["Skill 1", "Skill 2"],
        "ifFailed": "Recommendation: Review lessons X, Y, Z"
    }
}`;
    }

    /**
     * Generate Phase Assessment
     */
    static generatePhaseAssessmentPrompt(phaseData, modulesSummary, fullContent) {
        return `Create a COMPREHENSIVE PHASE-END ASSESSMENT.

═══════════════════════════════════════════════════════════════════════════════
PHASE: ${JSON.stringify(phaseData, null, 2)}

MODULES COMPLETED: ${JSON.stringify(modulesSummary, null, 2)}
═══════════════════════════════════════════════════════════════════════════════

DOCUMENT CONTENT:
${fullContent}
═══════════════════════════════════════════════════════════════════════════════

TASK: Create comprehensive 15-question phase assessment.

REQUIREMENTS:
• Questions from ALL modules
• 20% harder than module quizzes
• Include cross-module integration questions
• Test cumulative understanding

Return ONLY this JSON:
{
    "phaseId": "${phaseData.phaseId}",
    "assessmentTitle": "${phaseData.phaseName} - Comprehensive Assessment",
    "totalQuestions": 15,
    "passingScore": 75,
    "timeLimit": "45 minutes",
    "sections": [
        {
            "sectionTitle": "Module Review: [Module Name]",
            "questionCount": 3,
            "questions": [
                {
                    "questionId": "q1",
                    "question": "Question text",
                    "options": [
                        {"id": "a", "text": "Option A"},
                        {"id": "b", "text": "Option B"},
                        {"id": "c", "text": "Option C"},
                        {"id": "d", "text": "Option D"}
                    ],
                    "correctAnswer": "a",
                    "explanation": "Why correct",
                    "difficulty": "medium"
                }
            ]
        }
    ],
    "integrationQuestions": {
        "description": "Questions testing connections across modules",
        "questions": []
    },
    "gradingRubric": {
        "excellent": "90-100%: Fully prepared for next phase",
        "good": "75-89%: Solid understanding, proceed with optional review",
        "needsWork": "60-74%: Review recommended before continuing",
        "retry": "Below 60%: Re-study required"
    },
    "completionCertificate": {
        "awarded": "On passing",
        "description": "Certificate of completion for ${phaseData.phaseName}"
    }
}`;
    }

    /**
     * Generate Quiz Questions (Simplified version)
     */
    static generateQuizQuestionsPrompt(topics, content, difficultyLevel = 'medium') {
        const topicsList = Array.isArray(topics) ? topics.join(', ') : topics;
        const questionCount = '15';
        
        return `Create ${questionCount} quiz questions for assessing these topics: ${topicsList}

═══════════════════════════════════════════════════════════════════════════════
DOCUMENT CONTENT (SOURCE OF ALL ANSWERS):
═══════════════════════════════════════════════════════════════════════════════
${content}
═══════════════════════════════════════════════════════════════════════════════

REQUIREMENTS:
• Questions test UNDERSTANDING of document content
• Use EXACT terminology from document
• All answers verifiable from document
• Mix of difficulty levels
• Each question has 4 options, ONE correct

Return ONLY this JSON array:

[
    {
        "id": "q1",
        "question": "Specific question from document content",
        "options": [
            "Option A from content",
            "Option B (plausible but wrong)",
            "Option C (plausible but wrong)",
            "Option D - correct answer"
        ],
        "correctAnswer": "Option D - correct answer",
        "explanation": "Why correct - reference document",
        "difficultyLevel": "${difficultyLevel}",
        "bloomsLevel": "understand/apply/analyze",
        "topicsTested": ["topic1", "topic2"],
        "documentReference": "Where covered in document"
    }
]`;
    }

    // ============================================================================
    // SECTION 8: LEARNING OUTCOMES & SUPPLEMENTARY
    // ============================================================================

    /**
     * Generate Module Learning Outcomes
     */
    static generateModuleOutcomesPrompt(moduleTopics, documentContent) {
        const topicsList = Array.isArray(moduleTopics) 
            ? moduleTopics.join(', ') 
            : moduleTopics;
        
        return `Create MEASURABLE LEARNING OUTCOMES for a module covering: ${topicsList}

═══════════════════════════════════════════════════════════════════════════════
DOCUMENT CONTENT:
═══════════════════════════════════════════════════════════════════════════════
${documentContent}
═══════════════════════════════════════════════════════════════════════════════

TASK: Create specific, measurable outcomes using Bloom's Taxonomy.

BLOOM'S TAXONOMY LEVELS:
1. Remember: Recall facts and basic concepts
2. Understand: Explain ideas or concepts
3. Apply: Use information in new situations
4. Analyze: Draw connections among ideas
5. Evaluate: Justify a decision or course of action
6. Create: Produce new or original work

OUTCOME FORMAT:
"[Action Verb] + [Specific Content] + [Context/Condition]"

Examples:
- "Define the key components of X as described in the document"
- "Apply the principles of Y to solve real-world problems"
- "Analyze the relationship between A and B"

Return ONLY this JSON:
{
    "moduleTopics": "${topicsList}",
    "totalOutcomes": 5,
    "outcomes": [
        {
            "outcomeId": "lo_1",
            "statement": "Learner will be able to [action verb] [specific content from doc]",
            "actionVerb": "define/explain/apply/analyze/evaluate/create",
            "bloomsLevel": "remember/understand/apply/analyze/evaluate/create",
            "topicReference": "Which topic this relates to",
            "contentBasis": "What document content this outcome is based on",
            "assessmentMethod": "How this outcome can be assessed",
            "successCriteria": "What demonstrates achievement"
        }
    ],
    "competencies": [
        {
            "competencyName": "Competency gained",
            "description": "What this competency enables",
            "relatedOutcomes": ["lo_1", "lo_2"]
        }
    ]
}`;
    }

    /**
     * Generate Discussion Topics
     */
    static generateDiscussionTopicsPrompt(moduleData, documentContent) {
        const moduleInfo = typeof moduleData === 'object' 
            ? JSON.stringify(moduleData.topicsCovered || moduleData, null, 2)
            : moduleData;
        
        return `Generate ENGAGING DISCUSSION TOPICS for peer learning.

MODULE CONTEXT: ${moduleInfo}

DOCUMENT CONTENT:
${documentContent}

Create discussion topics that:
1. Promote critical thinking about document concepts
2. Encourage real-world application
3. Create peer learning opportunities
4. Are open-ended but focused

Return ONLY this JSON:
{
    "discussionCount": 3,
    "discussions": [
        {
            "discussionId": "d1",
            "topic": "Thought-provoking question related to content",
            "context": "Background and why this matters",
            "guidingQuestions": [
                "Sub-question to explore one angle",
                "Sub-question for another perspective"
            ],
            "relatedConcepts": ["concept1", "concept2"],
            "discussionObjective": "What should be learned",
            "thinkingLevel": "analysis/evaluation/synthesis",
            "suggestedLength": "2-3 paragraphs"
        }
    ]
}`;
    }

    /**
     * Generate Module Summary
     */
    static generateSummaryPrompt(topics, content) {
        const topicsList = Array.isArray(topics) ? topics.join(', ') : topics;
        
        return `Create a comprehensive MODULE SUMMARY for topics: ${topicsList}

═══════════════════════════════════════════════════════════════════════════════
DOCUMENT CONTENT:
═══════════════════════════════════════════════════════════════════════════════
${content}
═══════════════════════════════════════════════════════════════════════════════

Return ONLY this JSON:
{
    "summaryTitle": "Module Summary: ${topicsList}",
    "overview": "2-3 sentence overview of what this module taught",
    "keyConceptsReview": [
        {
            "concept": "Concept name from document",
            "definition": "Brief definition",
            "importance": "Why this matters"
        }
    ],
    "skillsAcquired": [
        {
            "skill": "Skill name",
            "application": "How to apply"
        }
    ],
    "importantTerminology": {
        "term1": "definition",
        "term2": "definition"
    },
    "keyTakeaways": [
        "Main takeaway 1",
        "Main takeaway 2",
        "Main takeaway 3"
    ],
    "practicalImplications": "How to apply this knowledge",
    "commonMistakes": "Mistakes to avoid",
    "nextSteps": "What to learn next",
    "quickReview": {
        "topPoints": ["Point 1", "Point 2", "Point 3"],
        "mustRemember": ["Critical item 1", "Critical item 2"]
    },
    "selfTestQuestions": [
        "Can you explain [X]?",
        "How would you apply [Y]?",
        "Why is [Z] important?"
    ]
}`;
    }

    /**
     * Document Structure Analysis
     */
    static documentStructureAnalysisPrompt(content) {
        return `Analyze the structure and organization of this educational document.

═══════════════════════════════════════════════════════════════════════════════
DOCUMENT:
═══════════════════════════════════════════════════════════════════════════════
${content}
═══════════════════════════════════════════════════════════════════════════════

Return ONLY this JSON:
{
    "structure": {
        "chapterCount": 0,
        "sectionCount": 0,
        "hasTableOfContents": true,
        "hasIndex": false,
        "progression": "linear/modular/hierarchical"
    },
    "chapters": [
        {
            "number": 1,
            "title": "Chapter title",
            "sections": ["Section 1.1", "Section 1.2"]
        }
    ],
    "keyElements": {
        "definitions": ["Key terms defined"],
        "theories": ["Theories/frameworks presented"],
        "examples": ["Types of examples used"],
        "exercises": ["Types of exercises/activities"]
    },
    "learningPath": "Recommended sequence for learning",
    "coreKnowledge": ["Most important concepts"],
    "supportingKnowledge": ["Supporting concepts"]
}`;
    }

    // ============================================================================
    // SECTION 9: COMPLETE ROADMAP GENERATION
    // ============================================================================

    /**
     * Generate Complete Course Roadmap (Master Prompt)
     */
    static generateCompleteRoadmapPrompt(courseAnalysis, fullContent) {
        const analysisJson = typeof courseAnalysis === 'object'
            ? JSON.stringify(courseAnalysis, null, 2)
            : courseAnalysis;
        
        return `You are an expert instructional designer creating a COMPLETE COURSERA-STYLE ROADMAP.

═══════════════════════════════════════════════════════════════════════════════
COURSE ANALYSIS:
═══════════════════════════════════════════════════════════════════════════════
${analysisJson}

═══════════════════════════════════════════════════════════════════════════════
COMPLETE DOCUMENT CONTENT:
═══════════════════════════════════════════════════════════════════════════════
${fullContent}
═══════════════════════════════════════════════════════════════════════════════

TASK: Create a COMPLETE learning roadmap with this structure:

COURSE
├── PHASE 1: Foundations
│   ├── Module 1.1 (Week 1)
│   │   ├── Lesson 1.1.1 (Video 1)
│   │   │   └── Topics with Content
│   │   ├── Lesson 1.1.2 (Video 2)
│   │   └── Module Quiz
│   ├── Module 1.2 (Week 2)
│   └── Phase 1 Comprehensive Exam
├── PHASE 2: Application
│   ├── Module 2.1
│   ├── Module 2.2
│   └── Phase 2 Comprehensive Exam
└── PHASE 3: Mastery
    ├── Module 3.1
    ├── Module 3.2
    └── Final Course Assessment

═══════════════════════════════════════════════════════════════════════════════
CRITICAL REQUIREMENTS:
═══════════════════════════════════════════════════════════════════════════════
✓ 100% document content coverage
✓ NO generic/static content - all from document
✓ Clear beginner → advanced progression
✓ Every element has specific learning objectives
✓ All topics/terms/examples from document

Return ONLY this JSON:
{
    "roadmap": {
        "courseTitle": "Exact course title from document",
        "courseDescription": "Description from document",
        "courseLevel": "beginner-to-advanced",
        "totalEstimatedHours": 0,
        "totalPhases": 3,
        "certificateType": "Completion Certificate",
        "phases": [
            {
                "phaseId": "phase_1",
                "phaseNumber": 1,
                "phaseName": "Foundations of [Subject]",
                "phaseDescription": "What this phase covers",
                "estimatedHours": 0,
                "phaseObjective": "Clear objective",
                "modules": [
                    {
                        "moduleId": "mod_1_1",
                        "moduleNumber": 1,
                        "moduleName": "Module name from content",
                        "moduleDescription": "Description",
                        "estimatedMinutes": 180,
                        "documentSections": ["Sections covered"],
                        "learningObjectives": ["Objective 1", "Objective 2"],
                        "lessons": [
                            {
                                "lessonId": "les_1_1_1",
                                "lessonNumber": 1,
                                "lessonTitle": "Lesson title from content",
                                "duration": "20 mins",
                                "topicsCovered": ["Topic 1", "Topic 2"],
                                "keyTerms": ["Term 1", "Term 2"]
                            }
                        ],
                        "moduleQuiz": {
                            "questionCount": 5,
                            "passingScore": 70,
                            "timeLimit": "10 mins"
                        }
                    }
                ],
                "phaseAssessment": {
                    "type": "Comprehensive Exam",
                    "questionCount": 15,
                    "passingScore": 75
                },
                "phaseLearningOutcomes": ["Outcome 1", "Outcome 2"],
                "phaseCompletion": {
                    "requiredScore": 75,
                    "unlocks": "Phase 2"
                }
            }
        ]
    },
    "progressMilestones": [
        {
            "milestoneId": "m1",
            "milestoneName": "Phase 1 Complete",
            "trigger": "Pass Phase 1 Assessment",
            "reward": "Foundations Badge"
        }
    ],
    "estimatedTimelines": {
        "intensive": "X weeks (10+ hrs/week)",
        "regular": "X weeks (5-8 hrs/week)",
        "relaxed": "X weeks (2-4 hrs/week)"
    },
    "courseCompletion": {
        "requirements": ["Pass all phase assessments", "Complete all modules"],
        "certificate": "Course Completion Certificate",
        "skills": ["Skills gained upon completion"]
    }
}`;
    }

    /**
     * Comprehensive Module Plan
     */
    static generateComprehensiveModulePlanPrompt(phaseObjective, stageTopics, content) {
        const topicsList = Array.isArray(stageTopics) ? stageTopics.join(', ') : stageTopics;
        
        return `Design a COMPLETE learning module for objective: "${phaseObjective}"

Topics to cover: ${topicsList}

═══════════════════════════════════════════════════════════════════════════════
DOCUMENT CONTENT:
═══════════════════════════════════════════════════════════════════════════════
${content}
═══════════════════════════════════════════════════════════════════════════════

Return ONLY this JSON:
{
    "moduleOverview": "Comprehensive overview of what module covers",
    "moduleObjective": "${phaseObjective}",
    "estimatedDuration": "X hours",
    "learningObjectives": [
        "Specific objective 1 from content",
        "Specific objective 2 from content",
        "Specific objective 3 from content"
    ],
    "lessons": [
        {
            "lessonNumber": 1,
            "title": "Specific lesson title from content",
            "duration": "20-30 minutes",
            "content": "Detailed lesson content (2-3 paragraphs from document)",
            "keyPoints": ["Point 1 from doc", "Point 2", "Point 3"],
            "topicsCovered": ["Topic 1", "Topic 2"],
            "practiceActivity": {
                "name": "Activity name",
                "description": "What students do",
                "duration": "10 minutes"
            }
        }
    ],
    "assessment": {
        "formative": "Ongoing checks during module",
        "summative": "Final module quiz",
        "rubric": {
            "excellent": "90-100%",
            "proficient": "75-89%",
            "developing": "60-74%",
            "needsImprovement": "Below 60%"
        }
    },
    "moduleResources": {
        "required": ["Document sections to read"],
        "supplementary": ["Additional resources from document"]
    },
    "moduleSummary": "Brief summary of learning achieved"
}`;
    }

    // ============================================================================
    // SECTION 10: CHUNK PROCESSING (For Large Documents)
    // ============================================================================

    /**
     * Analyze Content Chunk
     */
    static getChunkAnalysisPrompt(chunkContent, chunkIndex, totalChunks, previousAnalysis = null) {
        const prevContext = previousAnalysis 
            ? `\nPREVIOUS CHUNKS SUMMARY:\n${JSON.stringify(previousAnalysis, null, 2)}\n`
            : '';
        
        return `Analyze document chunk ${chunkIndex + 1} of ${totalChunks}.
${prevContext}
═══════════════════════════════════════════════════════════════════════════════
CHUNK CONTENT:
═══════════════════════════════════════════════════════════════════════════════
${chunkContent}
═══════════════════════════════════════════════════════════════════════════════

Extract from this chunk:
{
    "chunkIndex": ${chunkIndex},
    "chunkOf": ${totalChunks},
    "topicsFound": ["Topics in this chunk"],
    "conceptsIntroduced": ["New concepts here"],
    "termsDefined": {"term": "definition"},
    "examplesFound": ["Examples in chunk"],
    "sectionsIdentified": ["Chapter/section headers"],
    "continuedFromPrevious": ["Topics continuing"],
    "continuesInNext": ["Topics likely continuing"],
    "chunkSummary": "What this chunk covers"
}`;
    }

    /**
     * Merge Chunk Analyses
     */
    static getMergeAnalysesPrompt(chunkAnalyses, fullContentSample) {
        return `Merge these chunk analyses into unified document analysis.

═══════════════════════════════════════════════════════════════════════════════
CHUNK ANALYSES:
═══════════════════════════════════════════════════════════════════════════════
${JSON.stringify(chunkAnalyses, null, 2)}

CONTENT SAMPLE:
${fullContentSample}

Create unified analysis:
{
    "unifiedTopics": ["All unique topics"],
    "topicProgression": "How topics develop",
    "conceptHierarchy": {"main": ["sub"]},
    "allTerminology": {"term": "def"},
    "allExamples": ["All examples"],
    "documentFlow": "Start to end narrative",
    "recommendedLearningSequence": ["Ordered topic list"]
}`;
    }

    /**
     * Verify Extraction Quality
     */
    static verifyExtractionPrompt(extractedData, originalContent) {
        return `Verify extracted learning content accuracy.

EXTRACTED:
${JSON.stringify(extractedData, null, 2)}

ORIGINAL:
${originalContent}

Check and return:
{
    "accuracy": "high/medium/low",
    "coverage": "X% of document covered",
    "missingTopics": ["Topics missed"],
    "incorrectContent": ["Inaccuracies found"],
    "genericContentFound": ["Any generic/invented content"],
    "recommendations": ["How to improve"]
}`;
    }
}

module.exports = ImprovedGeminiPrompts;
