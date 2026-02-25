/**
 * Quiz Service - DYNAMIC CONTENT-BASED QUIZ GENERATION
 * 
 * Generates quizzes based ONLY on actual document content.
 * NO static or template questions are used.
 * 
 * Features:
 * - Content-specific question generation
 * - Multiple AI retry strategies
 * - Groq fallback for quota issues
 * - Question validation and deduplication
 * 
 * @author LearnSphere AI
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const DynamicQuizGenerator = require('./dynamicQuizGenerator');

class QuizService {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is required');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
        this.model = this.genAI.getGenerativeModel({ model: this.modelName });
        
        // ⚡ Initialize Groq as fallback
        this.groqApiKey = process.env.GROQ_API_KEY;
        this.groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
        this.groqClient = this.groqApiKey ? new Groq({ apiKey: this.groqApiKey }) : null;
        this.useGroqFallback = false;
        
        // 🎯 Initialize Dynamic Quiz Generator
        this.dynamicGenerator = new DynamicQuizGenerator(apiKey);
        
        // Cache for extracted knowledge
        this.knowledgeCache = new Map();
    }

    /**
     * Generate MCQ quiz for a module (15 questions) - DYNAMIC CONTENT-BASED
     * @param {Object} module - Module object with name and topics
     * @param {Array} topicsCovered - Topics covered in this module
     * @param {string} phaseObjective - The objective of the phase
     * @param {string} documentContent - The PDF content for context (REQUIRED)
     * @returns {Promise<Array>} - Array of MCQ questions
     */
    async generateModuleQuiz(module, topicsCovered, phaseObjective, documentContent = '') {
        console.log(`📝 Generating DYNAMIC module quiz for: ${module.moduleTitle}...`);
        
        // Document content is REQUIRED for dynamic quiz generation
        if (!documentContent || documentContent.trim().length < 500) {
            throw new Error('Insufficient document content for quiz generation. Please provide document content.');
        }

        try {
            // Use the dynamic generator for content-specific questions
            const questions = await this.dynamicGenerator.generateDynamicModuleQuiz(
                module,
                topicsCovered,
                documentContent
            );

            if (questions.length >= 10) {
                console.log(`✅ Generated ${questions.length} content-specific module questions`);
                return questions;
            }

            // If dynamic generation returned few questions, try direct generation with enhanced prompt
            console.log('⚠️ Dynamic generator returned few questions, trying enhanced generation...');
            return await this.generateEnhancedModuleQuiz(module, topicsCovered, phaseObjective, documentContent);
        } catch (error) {
            console.error('❌ Dynamic module quiz failed:', error.message);
            
            // Retry with enhanced prompt as fallback
            try {
                return await this.generateEnhancedModuleQuiz(module, topicsCovered, phaseObjective, documentContent);
            } catch (retryError) {
                console.error('❌ Enhanced fallback also failed:', retryError.message);
                throw new Error(`Quiz generation failed: ${error.message}. Please try again.`);
            }
        }
    }

    /**
     * Enhanced module quiz generation with content-focused prompt
     */
    async generateEnhancedModuleQuiz(module, topicsCovered, phaseObjective, documentContent) {
        const contentSection = this.extractTopicContent(documentContent, topicsCovered);
        
        const prompt = `Create 15 SPECIFIC quiz questions based ONLY on this document content.

DOCUMENT CONTENT (extract key facts, definitions, and concepts from this):
"""
${contentSection.substring(0, 10000)}
"""

MODULE: ${module.moduleTitle}
TOPICS: ${topicsCovered.join(', ')}
OBJECTIVE: ${phaseObjective}

CRITICAL REQUIREMENTS:
1. Every question MUST test specific content from the document above
2. Use exact terminology, definitions, and facts from the document
3. NEVER create generic questions like "What is the importance of..." or "Why should you..."
4. Test factual recall, understanding, and application of content
5. Wrong options should be plausible alternatives but clearly incorrect per the document

QUESTION VARIETY (use diverse phrasing, avoid repetitive templates):
- Vary how you ask about definitions, features, and characteristics
- Use different sentence starters: "Which", "How", "What", "Why", "When", "In what way"
- Mix direct factual questions with scenario-based or comparative ones
- Ask about causes, effects, relationships, applications, and distinctions
- Frame some questions around real-world context or practical implications

STYLE GUIDELINES:
- NEVER use phrases like "according to the document", "as stated", "mentioned in the text"
- Write questions naturally as testing subject knowledge, not referencing source material
- Explanations should NOT cite "the document" - explain answers naturally
- You may creatively rephrase while staying factually accurate

FORMAT (strict JSON array):
[
    {
        "questionId": "q_1",
        "questionText": "Clear question testing specific knowledge?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option A",
        "explanation": "This is correct because [natural explanation of the answer]",
        "difficulty": "easy|medium|hard",
        "topic": "Specific topic"
    }
]

STYLE: Never use phrases like 'according to the document' or 'as stated'. Write naturally without referencing source material. Slight rephrasing is allowed for variety while staying accurate.

Distribution: 5 easy, 6 medium, 4 hard
Return ONLY valid JSON array.`;

        const result = await this.getContentWithTimeout(prompt, 35000);
        const questions = this.parseQuizResponse(result, 'module');

        if (questions.length < 10) {
            throw new Error('Insufficient questions generated from content');
        }

        console.log(`✅ Generated ${questions.length} enhanced module questions`);
        return questions;
    }

    /**
     * Extract content relevant to specific topics
     */
    extractTopicContent(content, topics) {
        if (!content || !topics || topics.length === 0) {
            return content?.substring(0, 12000) || '';
        }

        const chunks = [];
        const chunkSize = 2500;
        
        for (let i = 0; i < content.length; i += chunkSize) {
            chunks.push(content.substring(i, i + chunkSize));
        }

        // Score and rank chunks by topic relevance
        const scored = chunks.map(chunk => {
            const lower = chunk.toLowerCase();
            let score = 0;
            topics.forEach(topic => {
                const topicLower = (typeof topic === 'string' ? topic : topic.name || '').toLowerCase();
                score += (lower.match(new RegExp(topicLower, 'gi')) || []).length * 3;
                topicLower.split(/\s+/).forEach(word => {
                    if (word.length > 3) {
                        score += (lower.match(new RegExp(word, 'gi')) || []).length;
                    }
                });
            });
            return { chunk, score };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, 5).map(s => s.chunk).join('\n\n---\n\n');
    }

    /**
     * Generate phase-end quiz (covering ONLY topics specific to this phase) - DYNAMIC
     * @param {Object} phase - Phase object with phaseTopics array
     * @param {Array} allTopics - All topics in the roadmap (for fallback)
     * @param {Array} modulesInPhase - All modules in this phase
     * @param {string} documentContent - The PDF content for context (REQUIRED)
     * @returns {Promise<Array>} - Array of MCQ questions
     */
    async generatePhaseQuiz(phase, allTopics, modulesInPhase, documentContent = '') {
        console.log(`📚 Generating DYNAMIC phase quiz for: ${phase.phaseName}...`);

        // Document content is REQUIRED for dynamic quiz generation
        if (!documentContent || documentContent.trim().length < 500) {
            throw new Error('Insufficient document content for quiz generation. Please provide document content.');
        }

        // Use phase-specific topics if available
        let phaseTopicNames = [];
        if (phase.phaseTopics && phase.phaseTopics.length > 0) {
            phaseTopicNames = phase.phaseTopics.map(t => t.name || t);
            console.log(`   Using ${phaseTopicNames.length} phase-specific topics: ${phaseTopicNames.join(', ')}`);
        } else {
            phaseTopicNames = modulesInPhase
                .flatMap(m => m.topicsCovered || [])
                .filter((v, i, a) => a.indexOf(v) === i);
        }

        try {
            // Use dynamic generator for content-specific questions
            const questions = await this.dynamicGenerator.generateDynamicPhaseQuiz(
                {
                    phaseName: phase.phaseName,
                    phaseObjective: phase.phaseObjective,
                    phaseTopics: phase.phaseTopics || phaseTopicNames.map(name => ({ name }))
                },
                documentContent,
                null // Let it extract knowledge fresh
            );

            if (questions.length >= 10) {
                console.log(`✅ Generated ${questions.length} content-specific phase questions`);
                return questions;
            }

            // If dynamic generation returned few questions, try enhanced direct generation
            console.log('⚠️ Dynamic generator returned few questions, trying enhanced generation...');
            return await this.generateEnhancedPhaseQuiz(phase, phaseTopicNames, documentContent);
        } catch (error) {
            console.error('❌ Dynamic phase quiz failed:', error.message);
            
            // Retry with enhanced prompt
            try {
                return await this.generateEnhancedPhaseQuiz(phase, phaseTopicNames, documentContent);
            } catch (retryError) {
                console.error('❌ Enhanced fallback also failed:', retryError.message);
                throw new Error(`Quiz generation failed: ${error.message}. Please try again.`);
            }
        }
    }

    /**
     * Enhanced phase quiz generation with content-focused prompt
     */
    async generateEnhancedPhaseQuiz(phase, topicNames, documentContent) {
        const contentSection = this.extractTopicContent(documentContent, topicNames);
        const topicsList = topicNames.join(', ');

        const prompt = `Create 15 SPECIFIC quiz questions for this learning phase based ONLY on document content.

DOCUMENT CONTENT (your ONLY source for questions):
"""
${contentSection.substring(0, 12000)}
"""

PHASE: ${phase.phaseName}
OBJECTIVE: ${phase.phaseObjective || 'Master the concepts'}
SPECIFIC TOPICS: ${topicsList}

ABSOLUTE REQUIREMENTS:
1. EVERY question must test specific information FROM THE DOCUMENT ABOVE
2. Use exact terms, definitions, facts, examples from the text
3. FORBIDDEN question types:
   - "What is the importance/purpose of studying X?"
   - "Why is it important to learn X?"
   - "What is the best approach to learning?"
   - "How can you verify your understanding?"
   - Any question about learning strategies or study methods
4. QUESTION VARIETY (use diverse phrasing, not fixed templates):
   - Ask about definitions, characteristics, components, or purposes
   - Test understanding of processes, sequences, or methodologies
   - Probe relationships, comparisons, or distinctions between concepts
   - Challenge with application scenarios or real-world implications
   - Vary sentence structure: start with "Which", "How", "What", "Why", "When", "Where"
   - Mix question styles: direct facts, scenario-based, comparison, cause-effect

5. STYLE REQUIREMENTS:
   - NEVER say "according to the document", "as stated in the text", "mentioned", etc.
   - Write questions as general knowledge tests, not citing source material
   - Explanations should be natural, WITHOUT referencing "the document"
   - Slight rephrasing is allowed for variety, but stay factually accurate

FORMAT (strict JSON array):
[
    {
        "questionId": "q_1",
        "questionText": "Specific question testing knowledge of the content?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option A",
        "explanation": "This is correct because [natural explanation without citing document]",
        "difficulty": "easy|medium|hard",
        "topic": "${topicNames[0] || 'Content'}"
    }
]

Distribution: 5 easy, 6 medium, 4 hard
Return ONLY valid JSON array.`;

        const result = await this.getContentWithTimeout(prompt, 40000);
        const questions = this.parseQuizResponse(result, 'phase');

        if (questions.length < 10) {
            throw new Error('Insufficient content-specific questions generated');
        }

        // Filter to ensure questions are about phase topics
        const validQuestions = questions.filter(q => {
            const qText = q.questionText.toLowerCase();
            return topicNames.some(t => 
                qText.includes(t.toLowerCase()) || 
                (q.topic && q.topic.toLowerCase().includes(t.toLowerCase()))
            );
        });

        console.log(`✅ Generated ${validQuestions.length} enhanced phase questions`);
        return validQuestions.length >= 10 ? validQuestions : questions;
    }

    /**
     * Generate final comprehensive quiz (30-35 questions covering entire roadmap) - DYNAMIC
     * @param {Array} phases - All phases
     * @param {Array} allTopics - All main topics
     * @param {string} documentContent - The PDF content (REQUIRED)
     * @returns {Promise<Array>} - Array of 30-35 MCQ questions
     */
    async generateFinalQuiz(phases, allTopics, documentContent = '') {
        console.log(`🏆 Generating DYNAMIC final comprehensive quiz...`);

        // Document content is REQUIRED
        if (!documentContent || documentContent.trim().length < 500) {
            throw new Error('Insufficient document content for final quiz. Please provide document content.');
        }

        try {
            const questions = await this.dynamicGenerator.generateDynamicFinalQuiz(
                phases,
                documentContent,
                allTopics
            );

            if (questions.length >= 25) {
                console.log(`✅ Generated ${questions.length} content-specific final questions`);
                return questions;
            }

            // Try enhanced generation
            return await this.generateEnhancedFinalQuiz(phases, allTopics, documentContent);
        } catch (error) {
            console.error('❌ Dynamic final quiz failed:', error.message);
            
            try {
                return await this.generateEnhancedFinalQuiz(phases, allTopics, documentContent);
            } catch (retryError) {
                throw new Error(`Final quiz generation failed: ${error.message}. Please try again.`);
            }
        }
    }

    /**
     * Enhanced final quiz generation
     */
    async generateEnhancedFinalQuiz(phases, allTopics, documentContent) {
        const topicsList = allTopics.map(t => t.name || t).join(', ');
        const phaseNames = phases.map(p => p.phaseName).join(', ');

        const prompt = `Create 30 comprehensive quiz questions covering the ENTIRE document content.

DOCUMENT CONTENT:
"""
${documentContent.substring(0, 20000)}
"""

PHASES COVERED: ${phaseNames}
ALL TOPICS: ${topicsList}

REQUIREMENTS:
1. ALL questions must come from SPECIFIC content in the material
2. Cover material proportionally from all sections
3. NO generic questions about learning or studying
4. Test factual knowledge

STYLE GUIDELINES:
- NEVER use phrases like "according to the document", "as stated", "mentioned in the text"
- Write questions naturally as if testing subject expertise
- Explanations should NOT reference "the document" - explain naturally
- You may creatively rephrase for variety while staying factually accurate

FORMAT (strict JSON array):
[{"questionId": "final_1", "questionText": "Clear factual question?", "options": [...], "correctAnswer": "...", "explanation": "This is correct because [natural explanation]", "difficulty": "...", "topic": "..."}]

Distribution: 8 easy, 14 medium, 8 hard
Return ONLY valid JSON array.`;

        const result = await this.getContentWithTimeout(prompt, 50000);
        const questions = this.parseQuizResponse(result, 'final');

        if (questions.length < 20) {
            throw new Error('Insufficient final quiz questions generated');
        }

        return questions;
    }

    /**
     * Parse and validate quiz response from API - Enhanced with generic question filtering
     */
    parseQuizResponse(response, quizType) {
        try {
            // Clean markdown formatting
            let cleaned = response.trim();
            if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '');
            if (cleaned.startsWith('```')) cleaned = cleaned.replace(/```/g, '');
            cleaned = cleaned.trim();

            // Extract JSON array
            let jsonMatch = cleaned.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                console.warn(`⚠️ No JSON found in ${quizType} quiz response`);
                return [];
            }

            const questions = JSON.parse(jsonMatch[0]);

            // Filter out generic/template questions
            const genericPatterns = [
                /what (are|is) the (key )?(learning outcomes|purpose|importance|goal|objective)/i,
                /how should you approach/i,
                /why is (it|this) important to (study|learn)/i,
                /what is (the best|essential|a good) (way|approach|method) to/i,
                /how can you verify your understanding/i,
                /what indicates successful completion/i,
                /what (is essential|demonstrates|indicates) for mastery/i,
                /how does practice enhance/i,
                /what approach maximizes retention/i,
                /how can collaboration enhance/i,
                /what role does critical thinking play/i,
                /what is a common (challenge|misconception) when learning/i,
                /what (are|is) the (relationship|connection) between different concepts/i,
                /how (do|does) different phases.*connect/i,
                /what (value|benefit).*completing all/i
            ];

            // Validate and clean questions
            return questions
                .filter(q => {
                    if (!q || !q.questionText || !q.options || !q.correctAnswer) return false;
                    
                    // Filter out generic questions
                    const isGeneric = genericPatterns.some(pattern => pattern.test(q.questionText));
                    if (isGeneric) {
                        console.log(`   Filtered generic: ${q.questionText.substring(0, 50)}...`);
                        return false;
                    }
                    return true;
                })
                .map((q, idx) => ({
                    questionId: q.questionId || `q_${idx + 1}`,
                    questionText: q.questionText.trim(),
                    options: Array.isArray(q.options) ? q.options.map(o => String(o).trim()) : [],
                    correctAnswer: String(q.correctAnswer).trim(),
                    explanation: q.explanation || 'Explanation not provided',
                    difficulty: q.difficulty && ['easy', 'medium', 'hard'].includes(q.difficulty) 
                        ? q.difficulty 
                        : 'medium',
                    topic: q.topic || 'General'
                }))
                .filter(q => 
                    q.options.length === 4 && 
                    q.options.some(opt => opt === q.correctAnswer)
                );

        } catch (error) {
            console.error(`❌ Error parsing ${quizType} quiz:`, error.message);
            return [];
        }
    }

    /**
     * Helper function to call API with timeout and Groq fallback
     */
    async getContentWithTimeout(prompt, timeoutMs = 30000) {
        // ⚡ If already switched to Groq, use it directly
        if (this.useGroqFallback && this.groqClient) {
            return this.callGroqAPI(prompt, timeoutMs);
        }

        try {
            return await Promise.race([
                this.model.generateContent(prompt).then(result => result.response.text().trim()),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('API timeout - try again')), timeoutMs)
                )
            ]);
        } catch (error) {
            console.error('Gemini API error:', error.message);
            
            // ⚡ Check for quota exceeded - switch to Groq
            if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('Quota')) {
                console.log('🔄 Gemini quota exceeded, switching to Groq fallback...');
                if (this.groqClient) {
                    this.useGroqFallback = true;
                    return this.callGroqAPI(prompt, timeoutMs);
                }
            }
            throw error;
        }
    }

    /**
     * ⚡ Call Groq API as fallback
     */
    async callGroqAPI(prompt, timeoutMs = 30000) {
        if (!this.groqClient) {
            throw new Error('Groq client not initialized');
        }

        try {
            const response = await Promise.race([
                this.groqClient.chat.completions.create({
                    model: this.groqModel,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert quiz generator. Always respond with valid JSON arrays only, no markdown or explanations.'
                        },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 4000
                }),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Groq API timeout')), timeoutMs)
                )
            ]);

            return response.choices[0]?.message?.content?.trim() || '';
        } catch (error) {
            console.error('Groq API error:', error.message);
            throw error;
        }
    }

    // NOTE: Static default quiz methods have been REMOVED
    // All quizzes are now generated dynamically from document content
    // If generation fails, an error is thrown instead of using static fallbacks
    
    /**
     * Extract key terms from document content for better quiz targeting
     */
    extractKeyTerms(content) {
        if (!content) return [];
        
        // Extract capitalized words/phrases and technical terms
        const words = content.substring(0, 8000)
            .split(/[\s\n,.;:!?()[\]{}]+/)
            .filter(word => word.length > 4 && word.length < 30)
            .filter(word => /^[A-Z]/.test(word) || /[A-Z]/.test(word.substring(1)))
            .slice(0, 20);
        
        // Get unique terms
        const uniqueTerms = [...new Set(words.map(w => w.replace(/[^a-zA-Z0-9\s]/g, '')))];
        return uniqueTerms.slice(0, 10);
    }

    /**
     * Calculate quiz score
     */
    calculateScore(answers, questions) {
        if (!answers || !questions) return 0;

        let correctCount = 0;
        answers.forEach(answer => {
            const question = questions.find(q => q.questionId === answer.questionId);
            if (question && answer.selectedAnswer === question.correctAnswer) {
                correctCount++;
            }
        });

        return Math.round((correctCount / questions.length) * 100);
    }

    /**
     * Get difficulty distribution
     */
    getDifficultyDistribution(questions) {
        const distribution = {
            easy: questions.filter(q => q.difficulty === 'easy').length,
            medium: questions.filter(q => q.difficulty === 'medium').length,
            hard: questions.filter(q => q.difficulty === 'hard').length
        };
        return distribution;
    }
}

module.exports = QuizService;
