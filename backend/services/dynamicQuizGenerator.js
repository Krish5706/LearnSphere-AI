/**
 * Dynamic Quiz Generator Service
 * 
 * Generates highly specific, content-based quizzes by:
 * 1. Extracting key concepts, definitions, and facts from document content
 * 2. Creating questions that test actual knowledge from the document
 * 3. Never using generic or template questions
 * 
 * @author LearnSphere AI
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');

class DynamicQuizGenerator {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is required');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
        this.model = this.genAI.getGenerativeModel({ model: this.modelName });
        
        // Groq fallback
        this.groqApiKey = process.env.GROQ_API_KEY;
        this.groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
        this.groqClient = this.groqApiKey ? new Groq({ apiKey: this.groqApiKey }) : null;
        this.useGroqFallback = false;
    }

    /**
     * Extract key concepts and facts from document content
     * This creates a knowledge base for quiz generation
     */
    async extractContentKnowledge(documentContent, topics = []) {
        const contentSample = documentContent.substring(0, 15000);
        const topicsList = topics.map(t => typeof t === 'string' ? t : t.name).join(', ');

        const prompt = `Analyze this educational document and extract SPECIFIC knowledge for quiz generation.

DOCUMENT CONTENT:
"""
${contentSample}
"""

FOCUS TOPICS: ${topicsList || 'All topics in the document'}

Extract and return as JSON:
{
    "mainSubject": "The primary subject of this document",
    "keyDefinitions": [
        {"term": "specific term", "definition": "exact definition from the document", "context": "how it's used"}
    ],
    "importantFacts": [
        {"fact": "specific fact or concept", "source": "where in content", "importance": "why it matters"}
    ],
    "processes": [
        {"name": "process name", "steps": ["step1", "step2"], "description": "what it accomplishes"}
    ],
    "relationships": [
        {"concept1": "term", "concept2": "term", "relationship": "how they relate"}
    ],
    "examples": [
        {"concept": "what it demonstrates", "example": "the actual example"}
    ],
    "technicalDetails": [
        {"topic": "specific topic", "detail": "technical information", "application": "how it's applied"}
    ],
    "commonMistakes": [
        {"misconception": "what people get wrong", "correct": "the correct understanding"}
    ]
}

IMPORTANT: 
- Extract ONLY information that actually appears in the document
- Be specific - use exact terms, numbers, and definitions from the content
- Aim for 8-12 items per category minimum
- If the document is technical, include technical details
- Include real examples mentioned in the document`;

        try {
            const result = await this.callAI(prompt, 30000);
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                const knowledge = JSON.parse(jsonMatch[0]);
                console.log(`✅ Extracted knowledge: ${knowledge.keyDefinitions?.length || 0} definitions, ${knowledge.importantFacts?.length || 0} facts`);
                return knowledge;
            }
        } catch (error) {
            console.error('Knowledge extraction failed:', error.message);
        }
        
        return null;
    }

    /**
     * Generate dynamic phase quiz based on actual document content
     * @param {Object} phase - Phase information (name, topics, objective)
     * @param {string} documentContent - Full document text
     * @param {Object} extractedKnowledge - Pre-extracted knowledge (optional)
     * @returns {Promise<Array>} - Array of 15 content-specific questions
     */
    async generateDynamicPhaseQuiz(phase, documentContent, extractedKnowledge = null) {
        console.log(`🎯 Generating DYNAMIC quiz for: ${phase.phaseName}`);

        // Get phase-specific content section
        const phaseTopics = phase.phaseTopics?.map(t => t.name || t) || [];
        const contentSection = this.extractRelevantContent(documentContent, phaseTopics);

        // Extract knowledge if not provided
        if (!extractedKnowledge) {
            extractedKnowledge = await this.extractContentKnowledge(contentSection, phaseTopics);
        }

        const knowledgeContext = extractedKnowledge ? JSON.stringify(extractedKnowledge, null, 2) : '';

        const prompt = `You are creating a HIGHLY SPECIFIC quiz based on actual document content. NEVER create generic questions.

PHASE: ${phase.phaseName}
OBJECTIVE: ${phase.phaseObjective || 'Master the concepts'}
SPECIFIC TOPICS: ${phaseTopics.join(', ')}

DOCUMENT CONTENT (use this as the ONLY source for questions):
"""
${contentSection.substring(0, 12000)}
"""

${knowledgeContext ? `
EXTRACTED KNOWLEDGE FROM DOCUMENT:
${knowledgeContext}
` : ''}

TASK: Generate 15 MCQ questions that test SPECIFIC knowledge from this document.

CRITICAL RULES:
1. Every question MUST reference specific content from the document
2. Questions must use exact terms, definitions, numbers mentioned in the document
3. NEVER use generic questions like "What is the purpose of studying X?" or "Why is X important?"
4. Test actual facts, definitions, processes, and examples from the content
5. Wrong options should be plausible but clearly incorrect based on the content
6. Explanations should naturally explain why the answer is correct

QUESTION VARIETY (create diverse, engaging questions - avoid repetitive templates):
- Vary sentence starters: "Which", "How", "What", "Why", "When", "In what way", "Where"
- Mix question styles: direct facts, scenarios, comparisons, cause-effect relationships
- Ask about definitions, characteristics, components, processes, applications
- Probe relationships, distinctions, sequences, or practical implications
- Frame some questions around context or real-world application
- Each question should feel unique, not just a fill-in-the-blank template

IMPORTANT STYLE GUIDELINES:
- NEVER use phrases like "according to the document", "as stated in the text", "mentioned in the document"
- Write questions as if testing general knowledge of the subject, not referencing source material
- Explanations should state the correct answer naturally without citing "the document"
- You may slightly rephrase concepts for variety, but stay factually accurate to the source content

FORMAT (strict JSON array):
[
    {
        "questionId": "q_1",
        "questionText": "A naturally phrased, specific question about the content",
        "options": [
            "The correct answer",
            "A plausible but incorrect alternative",
            "Another reasonable but wrong option",
            "A different incorrect choice"
        ],
        "correctAnswer": "The correct answer",
        "explanation": "This is correct because [natural explanation]...",
        "difficulty": "easy|medium|hard",
        "topic": "${phaseTopics[0] || 'Content Topic'}",
        "contentReference": "Brief reference to the relevant concept"
    }
]

DIFFICULTY DISTRIBUTION:
- 5 easy questions (basic definitions and facts)
- 6 medium questions (understanding and application)
- 4 hard questions (analysis, comparison, and synthesis)

Return ONLY the JSON array, no markdown or explanations.`;

        try {
            const result = await this.callAI(prompt, 45000);
            const questions = this.parseAndValidateQuestions(result, phaseTopics);
            
            if (questions.length >= 10) {
                console.log(`✅ Generated ${questions.length} content-specific questions`);
                return questions;
            }

            // If we got fewer questions, generate more with a focused prompt
            console.log(`⚠️ Only got ${questions.length} questions, generating more...`);
            const additionalQuestions = await this.generateAdditionalQuestions(
                contentSection, 
                phaseTopics, 
                15 - questions.length,
                questions
            );
            
            return [...questions, ...additionalQuestions].slice(0, 15);
        } catch (error) {
            console.error('Dynamic quiz generation failed:', error.message);
            // Retry once with Groq if available
            if (!this.useGroqFallback && this.groqClient) {
                this.useGroqFallback = true;
                return this.generateDynamicPhaseQuiz(phase, documentContent, extractedKnowledge);
            }
            throw error;
        }
    }

    /**
     * Generate dynamic module quiz
     */
    async generateDynamicModuleQuiz(module, topics, documentContent) {
        console.log(`📝 Generating DYNAMIC module quiz for: ${module.moduleTitle}`);

        const topicsList = topics.map(t => typeof t === 'string' ? t : t.name);
        const contentSection = this.extractRelevantContent(documentContent, topicsList);

        const prompt = `Create 15 SPECIFIC quiz questions for this module using ONLY the document content.

MODULE: ${module.moduleTitle}
TOPICS: ${topicsList.join(', ')}
MODULE DESCRIPTION: ${module.moduleDescription || ''}

DOCUMENT CONTENT:
"""
${contentSection.substring(0, 10000)}
"""

RULES:
1. Questions MUST be based on specific content from the source material
2. Use exact terminology and definitions from the text
3. NO generic questions about "importance" or "purpose" or "learning strategies"
4. Test factual knowledge, not opinions or meta-learning
5. Each question must have a clear, unambiguous correct answer

STYLE GUIDELINES:
- NEVER use phrases like "according to the document", "as stated", "mentioned in the text"
- Write questions naturally as if testing subject expertise
- Explanations should NOT cite "the document" - explain answers naturally
- You may creatively rephrase concepts for variety while staying factually accurate

QUESTION VARIETY (create diverse, engaging questions):
- Vary sentence starters: "Which", "How", "What", "Why", "When", "In what way"
- Mix styles: direct facts, scenarios, comparisons, cause-effect, application
- Ask about definitions, processes, examples, specifications, relationships
- Each question should feel unique and naturally phrased

FORMAT (strict JSON array):
[
    {
        "questionId": "q_1",
        "questionText": "Clear factual question about the content?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option A",
        "explanation": "This is correct because [natural explanation]",
        "difficulty": "easy|medium|hard",
        "topic": "Specific topic"
    }
]

Mix: 5 easy, 6 medium, 4 hard questions.
Return ONLY valid JSON array.`;

        try {
            const result = await this.callAI(prompt, 35000);
            const questions = this.parseAndValidateQuestions(result, topicsList);
            
            if (questions.length >= 10) {
                return questions;
            }

            // Generate more if needed
            const additional = await this.generateAdditionalQuestions(
                contentSection, 
                topicsList, 
                15 - questions.length,
                questions
            );
            return [...questions, ...additional].slice(0, 15);
        } catch (error) {
            console.error('Module quiz generation failed:', error.message);
            throw error;
        }
    }

    /**
     * Generate additional questions to reach quota
     */
    async generateAdditionalQuestions(content, topics, count, existingQuestions) {
        if (count <= 0) return [];

        const existingTexts = existingQuestions.map(q => q.questionText.toLowerCase());

        const prompt = `Generate ${count} MORE quiz questions about: ${topics.join(', ')}

ALREADY ASKED (do NOT repeat these themes):
${existingTexts.slice(0, 5).join('\n')}

CONTENT TO USE:
"""
${content.substring(0, 8000)}
"""

Generate ${count} NEW questions testing DIFFERENT aspects of the content.
Focus on: specific facts, numbers, processes, examples, comparisons.

Return ONLY JSON array of questions in this format:
[{"questionId": "q_extra_1", "questionText": "...", "options": [...], "correctAnswer": "...", "explanation": "...", "difficulty": "medium", "topic": "..."}]`;

        try {
            const result = await this.callAI(prompt, 20000);
            return this.parseAndValidateQuestions(result, topics);
        } catch (error) {
            console.error('Additional questions generation failed:', error.message);
            return [];
        }
    }

    /**
     * Generate final comprehensive quiz covering all phases
     */
    async generateDynamicFinalQuiz(phases, documentContent, allTopics = []) {
        console.log('🏆 Generating DYNAMIC final comprehensive quiz...');

        const phaseNames = phases.map(p => p.phaseName).join(', ');
        const topicsList = allTopics.map(t => t.name || t).join(', ');

        const prompt = `Create a comprehensive 30-question final assessment based ENTIRELY on this document.

LEARNING PHASES COVERED: ${phaseNames}
ALL TOPICS: ${topicsList}

DOCUMENT CONTENT:
"""
${documentContent.substring(0, 20000)}
"""

TASK: Generate 30 MCQ questions that comprehensively test mastery of the entire document content.

REQUIREMENTS:
1. Every question MUST be based on specific content from the source material
2. Cover material from all phases proportionally
3. Include questions that synthesize knowledge across topics
4. Test both recall and application of concepts
5. NO generic questions about learning strategies or study methods
6. Questions should test actual facts, definitions, and examples

STYLE GUIDELINES:
- NEVER use phrases like "according to the document", "as stated", "mentioned in the text"
- Write questions naturally as if testing subject expertise
- Explanations should NOT reference "the document" - explain naturally
- You may creatively rephrase for variety while staying factually accurate

QUESTION VARIETY (create diverse, engaging questions):
- Vary sentence starters: "Which", "How", "What", "Why", "When", "In what way"
- Mix styles: direct facts, scenarios, comparisons, cause-effect, synthesis
- Ask about definitions, processes, applications, relationships, implications
- Each question should feel unique and naturally phrased

QUESTION DISTRIBUTION:
- 8 questions from early/foundational content (easy-medium)
- 12 questions from intermediate content (medium)
- 10 questions from advanced content or synthesis (hard)

FORMAT (strict JSON array):
[
    {
        "questionId": "final_q_1",
        "questionText": "Clear factual question testing mastery?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option A",
        "explanation": "This is correct because [natural detailed explanation]",
        "difficulty": "easy|medium|hard",
        "topic": "Topic name",
        "phaseRelevance": "Which phase this relates to"
    }
]

Return ONLY the JSON array.`;

        try {
            const result = await this.callAI(prompt, 60000);
            const questions = this.parseAndValidateQuestions(result, allTopics.map(t => t.name || t));
            
            if (questions.length >= 25) {
                return questions.slice(0, 35);
            }

            console.log(`⚠️ Got ${questions.length} questions, generating more...`);
            const additional = await this.generateAdditionalQuestions(
                documentContent.substring(0, 15000),
                allTopics.map(t => t.name || t),
                30 - questions.length,
                questions
            );
            return [...questions, ...additional].slice(0, 35);
        } catch (error) {
            console.error('Final quiz generation failed:', error.message);
            throw error;
        }
    }

    /**
     * Extract content sections relevant to specific topics
     */
    extractRelevantContent(content, topics) {
        if (!topics || topics.length === 0) {
            return content;
        }

        const chunks = [];
        const chunkSize = 3000;
        const overlap = 500;

        // Create chunks
        for (let i = 0; i < content.length; i += (chunkSize - overlap)) {
            const chunk = content.substring(i, i + chunkSize);
            if (chunk.trim().length > 100) {
                chunks.push(chunk);
            }
        }

        // Score chunks by topic relevance
        const scoredChunks = chunks.map(chunk => {
            const lowerChunk = chunk.toLowerCase();
            let score = 0;
            
            topics.forEach(topic => {
                const topicLower = topic.toLowerCase();
                const matches = (lowerChunk.match(new RegExp(topicLower, 'g')) || []).length;
                score += matches * 2;
                
                // Also check for related words
                const words = topicLower.split(/\s+/);
                words.forEach(word => {
                    if (word.length > 3) {
                        score += (lowerChunk.match(new RegExp(word, 'g')) || []).length;
                    }
                });
            });

            return { chunk, score };
        });

        // Sort by relevance and take top chunks
        scoredChunks.sort((a, b) => b.score - a.score);
        const relevantChunks = scoredChunks.slice(0, Math.min(6, scoredChunks.length));
        
        return relevantChunks.map(c => c.chunk).join('\n\n---\n\n');
    }

    /**
     * Parse and validate quiz questions
     */
    parseAndValidateQuestions(response, expectedTopics = []) {
        try {
            // Clean markdown formatting
            let cleaned = response.trim();
            if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '');
            if (cleaned.startsWith('```')) cleaned = cleaned.replace(/```/g, '');
            cleaned = cleaned.trim();

            // Extract JSON array
            const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                console.warn('No JSON array found in response');
                return [];
            }

            const questions = JSON.parse(jsonMatch[0]);

            // Validate and clean each question
            return questions
                .filter(q => {
                    // Basic validation
                    if (!q || !q.questionText || !q.options || !q.correctAnswer) return false;
                    
                    // Filter out generic questions
                    const genericPatterns = [
                        /what is the (purpose|importance|goal|objective) of (studying|learning)/i,
                        /why is (it|this) important to (study|learn|understand)/i,
                        /how should you approach/i,
                        /what is the (best|most effective) (way|approach|method) to (study|learn)/i,
                        /what (are|is) the key learning outcomes/i,
                        /how can you verify your understanding/i,
                        /what indicates successful completion/i,
                        /what is essential for mastery/i,
                        /what demonstrates complete mastery/i,
                        /how does practice enhance/i,
                        /what approach maximizes retention/i,
                        /how can collaboration enhance/i,
                        /what role does critical thinking play/i,
                        /what is a common (challenge|misconception) when learning/i
                    ];

                    const isGeneric = genericPatterns.some(pattern => pattern.test(q.questionText));
                    if (isGeneric) {
                        console.log(`Filtered generic question: ${q.questionText.substring(0, 50)}...`);
                        return false;
                    }

                    return true;
                })
                .map((q, idx) => ({
                    questionId: q.questionId || `q_${idx + 1}`,
                    questionText: q.questionText.trim(),
                    options: Array.isArray(q.options) 
                        ? q.options.map(o => String(o).trim()) 
                        : [],
                    correctAnswer: String(q.correctAnswer).trim(),
                    explanation: q.explanation || 'Refer to the learning material for more details.',
                    difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) 
                        ? q.difficulty 
                        : 'medium',
                    topic: q.topic || expectedTopics[0] || 'Content',
                    contentReference: q.contentReference || ''
                }))
                .filter(q => {
                    // Ensure answer is in options
                    const hasCorrectAnswer = q.options.some(opt => 
                        opt === q.correctAnswer || 
                        opt.toLowerCase() === q.correctAnswer.toLowerCase()
                    );
                    
                    if (!hasCorrectAnswer && q.options.length === 4) {
                        // Try to fix by making first option the correct answer
                        q.correctAnswer = q.options[0];
                    }
                    
                    return q.options.length === 4;
                });

        } catch (error) {
            console.error('Error parsing questions:', error.message);
            return [];
        }
    }

    /**
     * Call AI with timeout and fallback
     */
    async callAI(prompt, timeoutMs = 30000) {
        if (this.useGroqFallback && this.groqClient) {
            return this.callGroq(prompt, timeoutMs);
        }

        try {
            const result = await Promise.race([
                this.model.generateContent(prompt).then(r => r.response.text().trim()),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('AI timeout')), timeoutMs)
                )
            ]);
            return result;
        } catch (error) {
            // Check for quota errors
            if (error.message.includes('429') || error.message.includes('quota')) {
                console.log('🔄 Switching to Groq fallback...');
                if (this.groqClient) {
                    this.useGroqFallback = true;
                    return this.callGroq(prompt, timeoutMs);
                }
            }
            throw error;
        }
    }

    /**
     * Call Groq API
     */
    async callGroq(prompt, timeoutMs = 30000) {
        if (!this.groqClient) throw new Error('Groq not configured');

        try {
            const response = await Promise.race([
                this.groqClient.chat.completions.create({
                    model: this.groqModel,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert quiz generator. Create questions based ONLY on the provided document content. Never create generic or template questions. Always respond with valid JSON only.'
                        },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 4096
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Groq timeout')), timeoutMs)
                )
            ]);

            return response.choices[0]?.message?.content?.trim() || '';
        } catch (error) {
            console.error('Groq error:', error.message);
            throw error;
        }
    }
}

module.exports = DynamicQuizGenerator;
