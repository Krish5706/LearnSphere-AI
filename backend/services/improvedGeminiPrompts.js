/**
 * Improved Gemini Prompts for Dynamic PDF Processing
 * All prompts are context-aware and based on actual PDF content
 * No static/generic values - everything is extracted from the document
 */

class ImprovedGeminiPrompts {
    /**
     * Extract Main Topic with Deep Analysis
     */
    static getMainTopicPrompt(contentSample) {
        return `You are an expert educational content analyzer. Analyze this document deeply to identify its primary subject.

DOCUMENT CONTENT:
"""
${contentSample}
"""

REQUIREMENTS:
1. Identify the EXACT main subject this document teaches (not generic - specific to content)
2. What are 2-3 related sub-subjects mentioned?
3. What grade level or expertise level does this target?
4. What practical applications are mentioned?
5. What unique terminology or concepts are central?

Return ONLY this JSON (no markdown, no explanation):
{
  "mainTopic": "The specific main subject extracted from content",
  "subTopics": ["Subtopic 1 from content", "Subtopic 2 from content", "Subtopic 3 from content"],
  "targetLevel": "beginner/intermediate/advanced",
  "practicalApplications": ["Real-world application 1", "Application 2"],
  "coreTerminology": ["Term1", "Term2", "Term3", "Term4"],
  "contentType": "textbook/tutorial/course/guide/research-paper",
  "confidence": "high/medium/low",
  "summary": "2-3 sentences on what this document is fundamentally about"
}`;
    }

    /**
     * Extract Comprehensive Topics from PDF
     */
    static getComprehensiveTopicsPrompt(contentSample, numPhases, mainTopic) {
        return `You are a curriculum designer. Extract ACTUAL topics from this "${mainTopic}" document.

IMPORTANT RULES:
- ALL topic names MUST be exact phrases from the document
- Topics must be COMPLETELY DIFFERENT between phases
- Phase 1: Foundational concepts (basic, introductory)
- Phase 2: Intermediate topics (building on phase 1, more complex)
- Phase 3: Advanced topics (specialized, application-focused)
- NO generic names like "Introduction", "Getting Started", or "Overview"
- Each topic must have 4-6 keywords/terms extracted from the document

DOCUMENT:
"""
${contentSample}
"""

Generate EXACTLY ${numPhases} phases with unique topics each.

Return ONLY this JSON (no markdown):
{
  "phase1": [
    {
      "name": "ExactTopicNameFromDocument",
      "description": "What this teaches based on document content",
      "keyTerms": ["term1_from_doc", "term2_from_doc", "term3_from_doc"],
      "importance": "critical",
      "documentReference": "Where in document (e.g., Section 1, Chapter 2)"
    }
  ],
  "phase2": [
    {
      "name": "DifferentAdvancedTopicFromDocument",
      "description": "progression from phase 1",
      "keyTerms": ["different_term1", "different_term2"],
      "importance": "critical",
      "documentReference": "Location in document"
    }
  ],
  "phase3": [
    {
      "name": "AdvancedSpecializedTopic",
      "description": "Expert level content",
      "keyTerms": ["specialized_term1", "specialized_term2"],
      "importance": "critical",
      "documentReference": "Location"
    }
  ]
}`;
    }

    /**
     * Generate Dynamic Content for Topics (Not Generic)
     */
    static generateTopicContentPrompt(topicName, topicKeyTerms, content, phase, phaseDescription) {
        return `You are an expert educational content writer. Generate detailed, specific content for a learning topic.

TOPIC: ${topicName}
PHASE: ${phase} - ${phaseDescription}
KEY TERMS TO FOCUS ON: ${topicKeyTerms.join(', ')}

SOURCE DOCUMENT:
"""
${content}
"""

Generate comprehensive educational content:

{
  "topic": "${topicName}",
  "content": "3-4 DETAILED paragraphs explaining this topic using ACTUAL concepts, definitions, and examples from the source document. Include specific terminology, relationships between concepts, and practical implications.",
  "keyPoints": [
    "Specific key point 1 directly from document",
    "Specific key point 2 directly from document",
    "Specific key point 3 directly from document",
    "Specific key point 4 directly from document"
  ],
  "definitions": {
    "term1": "Specific definition from document context",
    "term2": "What it means in this context",
    "term3": "Detailed definition from source"
  },
  "examples": [
    "Real example from document or derivable from content",
    "Another specific example",
    "Third concrete example"
  ],
  "connections": "How this topic connects to other concepts in the document (2-3 sentences)",
  "practicalApplications": [
    "How this is used in real-world scenarios mentioned in document",
    "Practical application 2",
    "Practical application 3"
  ]
}

REQUIREMENTS:
- Use ONLY information from the source document
- ALL content must be specific, not generic
- Include actual examples from the document or logically derived
- Define terms as they're used in the document context
- Make connections to other topics in the document
- Return ONLY valid JSON`;
    }

    /**
     * Generate Detailed Lesson Content
     */
    static generateDetailedLessonPrompt(lessonTopic, moduleTopics, phaseObjective, content) {
        return `You are an expert online instructor. Create a detailed, engaging lesson on "${lessonTopic}".

CONTEXT:
- Module covers these topics: ${moduleTopics.join(', ')}
- Learning objective: ${phaseObjective}
- This is part of structured learning path

SOURCE EDUCATIONAL MATERIAL:
"""
${content}
"""

Generate ONE comprehensive lesson:

{
  "lessonTitle": "Specific, descriptive title based on content (not generic like 'Lesson 1')",
  "learningObjectives": [
    "After this lesson, students will be able to...",
    "Students will understand...",
    "Students can apply..."
  ],
  "introduction": "2-3 sentences that hook students and explain relevance of this topic",
  "mainContent": "4-6 DETAILED paragraphs covering:
    1. Definition and context
    2. Key concepts and how they work
    3. Important relationships and dependencies
    4. Real examples from document
    5. Common misconceptions
    Use terminology consistently from source document.",
  "keyPoints": [
    "Critical point 1 students must understand",
    "Critical point 2",
    "Critical point 3",
    "Summary point"
  ],
  "examples": [
    {
      "title": "Example 1 Title",
      "description": "Detailed example with explanation"
    },
    {
      "title": "Example 2 Title",
      "description": "Another concrete example"
    }
  ],
  "practiceActivities": [
    {
      "activity": "Specific activity name",
      "instructions": "Step-by-step instructions for hands-on practice",
      "expectedOutcome": "What students should achieve"
    },
    {
      "activity": "Activity 2",
      "instructions": "Detailed activity 2",
      "expectedOutcome": "Outcome"
    }
  ],
  "commonMisconceptions": [
    "Misconception 1: What students might misunderstand and why",
    "Misconception 2: Clarification"
  ],
  "summary": "Brief summary of what was learned",
  "nextSteps": "How this lesson prepares for next topic"
}

REQUIREMENTS:
- Use ACTUAL examples and terminology from source material
- Make it engaging and practical
- Connect to real-world applications mentioned in document
- All activity instructions must be implementable
- Return ONLY valid JSON, no markdown`;
    }

    /**
     * Generate Module Learning Outcomes
     */
    static generateModuleOutcomesPrompt(moduleTopics, content) {
        return `You are a learning outcome specialist. For a module covering: ${moduleTopics.join(', ')}

Create measurable, specific learning outcomes for this module.

SOURCE DOCUMENT:
"""
${content}
"""

Return ONLY this JSON array:

[
  {
    "outcome": "Specific skill or knowledge outcome with action verb",
    "description": "Detailed description of what learner will achieve",
    "bloomsLevel": "remember/understand/apply/analyze/evaluate/create",
    "measurable": true,
    "relatedTopics": ["topic1", "topic2"]
  }
]

REQUIREMENTS:
- Outcomes based on actual document content
- Use Bloom's taxonomy
- Make outcomes measurable and specific
- Include 4-5 outcomes
- Each outcome should be achievable after learning module content
- Return ONLY valid JSON array`;
    }

    /**
     * Generate Quiz Questions Based on Content
     */
    static generateQuizQuestionsPrompt(topics, content, difficultyLevel = 'medium') {
        return `You are an expert educator creating assessment questions. Create ${difficultyLevel === 'medium' ? '8-10' : '5-7'} quiz questions.

Topics to assess: ${topics.join(', ')}
Difficulty: ${difficultyLevel}

SOURCE EDUCATIONAL MATERIAL:
"""
${content}
"""

Generate ${difficultyLevel === 'medium' ? '8-10' : '5-7'} multiple-choice questions that:
- Test understanding of actual document content
- Use real examples and terminology from source
- Progress from basic to higher-order thinking
- Are unambiguous with ONE clear correct answer
- Have 4 plausible options for each

Return ONLY this JSON array:

[
  {
    "id": "q1",
    "question": "Specific question based on document content",
    "options": ["Option A from content", "Option B close but wrong", "Option C wrong", "Option D correct answer"],
    "correctAnswer": "The correct option text",
    "explanation": "Why this is correct and why others are wrong based on source material",
    "difficultyLevel": "${difficultyLevel}",
    "bloomsLevel": "understand/apply/analyze",
    "topicsTested": ["topic1", "topic2"]
  }
]

CRITICAL:
- Questions MUST test understanding of document concepts
- Use exact terminology and examples from source
- Explanations must reference document content
- Return ONLY valid JSON array`;
    }

    /**
     * Extract Discussion Topics
     */
    static generateDiscussionTopicsPrompt(moduleTopics, content) {
        return `Generate thought-provoking discussion topics for learners studying: ${moduleTopics.join(', ')}

DOCUMENT CONTENT:
"""
${content}
"""

Create discussion topics that:
- Encourage deeper thinking about document concepts
- Connect theory to real-world applications
- Promote peer learning
- Are open-ended but focused

Return ONLY this JSON array:

[
  {
    "topic": "Specific discussion question",
    "description": "Why this matters and what to consider",
    "relatedTopics": ["topic1", "topic2"],
    "thinkingLevel": "application/analysis/synthesis"
  }
]`;
    }

    /**
     * Generate Summary Points (Not Generic)
     */
    static generateSummaryPrompt(topics, content) {
        return `Create a comprehensive MODULE SUMMARY for topics: ${topics.join(', ')}

DOCUMENT:
"""
${content}
"""

Return ONLY this JSON:

{
  "title": "Module: [Topics]",
  "overview": "1-2 sentence overview of what this module teaches",
  "mainConcepts": [
    "Concept 1 and its significance",
    "Concept 2 and its significance",
    "Concept 3 and how they relate"
  ],
  "keyTakeaways": [
    "Main takeaway 1 students should retain",
    "Main takeaway 2",
    "Main takeaway 3"
  ],
  "practicalImplications": "How these concepts apply in real situations",
  "readinessForNext": "What students are now prepared to learn",
  "reviewQuestions": [
    "Can you explain...?",
    "How would you apply...?",
    "Why is ... important?"
  ]
}`;
    }

    /**
     * Analyze Document Structure
     */
    static documentStructureAnalysisPrompt(content) {
        return `Analyze the structure and organization of this educational document.

DOCUMENT:
"""
${content}
"""

Return ONLY this JSON:

{
  "structure": {
    "chapters": "How many major sections/chapters?",
    "topics": "What are the main topics covered?",
    "progression": "How does content progress (linear/modular/recursive)?"
  },
  "keyElements": {
    "definitions": "Key concepts and their definitions",
    "theories": "Main theories or frameworks",
    "examples": "Types of examples used",
    "exercises": "Types of learning activities"
  },
  "learningPath": "Recommended sequence for learning",
  "coreKnowledge": ["The 3-5 most important concepts"],
  "supportingKnowledge": ["Supporting concepts and topics"]
}`;
    }

    /**
     * Generate Comprehensive Module Plan
     */
    static generateComprehensiveModulePlanPrompt(phaseObjective, stageTopics, content) {
        return `Design a COMPLETE learning module for objective: "${phaseObjective}"

Topics: ${stageTopics.join(', ')}

DOCUMENT REFERENCE:
"""
${content}
"""

Create a complete module structure:

{
  "moduleOverview": "Comprehensive overview of what module covers",
  "learningObjectives": ["Specific objective 1", "Specific objective 2", "Specific objective 3"],
  "lessons": [
    {
      "lessonNumber": 1,
      "title": "Specific lesson title",
      "duration": "Estimated time",
      "content": "Detailed lesson content (2-3 paragraphs)",
      "keyPoints": ["Point 1", "Point 2", "Point 3"],
      "activities": [
        {
          "name": "Activity name",
          "description": "What students do",
          "time": "Duration"
        }
      ]
    }
  ],
  "assessment": {
    "formative": "Ongoing assessment during module",
    "summative": "Final assessment for module",
    "rubric": "How success is measured"
  },
  "resources": ["Recommended reading", "Additional materials"],
  "connections": "How this module connects to others"
}

REQUIREMENTS:
- 3-4 lessons per module
- All content from document
- Practical and engaging activities
- Clear progression of difficulty
- Return ONLY valid JSON`;
    }
}

module.exports = ImprovedGeminiPrompts;
