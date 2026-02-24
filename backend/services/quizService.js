/**
 * Quiz Service
 * Generates quizzes with MCQs for each module and phase
 * ⚡ GROQ FALLBACK: Automatically switches to Groq when Gemini quota exceeded
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');

class QuizService {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is required');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        // Use gemini-1.5-flash as default - it's free and reliable
        this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
        this.model = this.genAI.getGenerativeModel({ model: this.modelName });
        
        // ⚡ Initialize Groq as fallback
        this.groqApiKey = process.env.GROQ_API_KEY;
        this.groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
        this.groqClient = this.groqApiKey ? new Groq({ apiKey: this.groqApiKey }) : null;
        this.useGroqFallback = false;
    }

    /**
     * Generate MCQ quiz for a module (15 questions)
     * @param {Object} module - Module object with name and topics
     * @param {Array} topicsCovered - Topics covered in this module
     * @param {string} phaseObjective - The objective of the phase
     * @param {string} documentContent - The PDF content for context
     * @returns {Promise<Array>} - Array of MCQ questions
     */
    async generateModuleQuiz(module, topicsCovered, phaseObjective, documentContent = '') {
        try {
            console.log(`📝 Generating module quiz for: ${module.moduleTitle}...`);
            
            // Use document content for context (limit to prevent token overflow)
            const contentSnippet = documentContent ? documentContent.substring(0, 8000) : '';
            
            const prompt = `You are creating a quiz based on the following study material content.

STUDY MATERIAL CONTENT:
${contentSnippet || 'No specific content provided - use general knowledge about the topics.'}

MODULE INFORMATION:
Module: ${module.moduleTitle}
Topics to cover: ${topicsCovered.join(', ')}
Learning Objective: ${phaseObjective}

TASK: Generate 15 multiple choice questions that test understanding of the ACTUAL CONTENT from the study material above. Questions should be specific to the material, not generic.

Format strictly as JSON array:
[
  {
    "questionId": "q_1",
    "questionText": "Specific question about the study material content?",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": "Option 1",
    "explanation": "Detailed explanation referencing the study material.",
    "difficulty": "easy",
    "topic": "Specific topic name from the content"
  }
]

Requirements:
- 15 questions total
- Questions must be based on ACTUAL content from the study material
- Mix difficulty: 5 easy, 6 medium, 4 hard
- Each question tests specific concepts from the material
- Options must be plausible and one must match correctAnswer exactly
- Explanations should reference the study material
- Include technical questions if the content is technical

Return ONLY valid JSON array, no other text.`;

            const result = await this.getContentWithTimeout(prompt, 25000);
            const questions = this.parseQuizResponse(result, 'module');

            if (questions.length === 0) {
                console.warn('⚠️  Using fallback quiz');
                return this.getDefaultModuleQuiz(topicsCovered, documentContent);
            }

            console.log(`✅ Generated ${questions.length} module questions`);
            return questions;
        } catch (error) {
            console.error('❌ Module quiz generation failed:', error.message);
            return this.getDefaultModuleQuiz(topicsCovered, documentContent);
        }
    }

    /**
     * Generate phase-end quiz (covering ONLY topics specific to this phase)
     * @param {Object} phase - Phase object with phaseTopics array
     * @param {Array} allTopics - All topics in the roadmap (for fallback)
     * @param {Array} modulesInPhase - All modules in this phase
     * @param {string} documentContent - The PDF content for context
     * @returns {Promise<Array>} - Array of MCQ questions
     */
    async generatePhaseQuiz(phase, allTopics, modulesInPhase, documentContent = '') {
        try {
            console.log(`📚 Generating phase quiz for: ${phase.phaseName}...`);

            // Use phase-specific topics if available (from new roadmap structure)
            let phaseTopicNames = [];
            
            if (phase.phaseTopics && phase.phaseTopics.length > 0) {
                // New structure: phase has its own unique topics
                phaseTopicNames = phase.phaseTopics.map(t => t.name || t);
                console.log(`   Using ${phaseTopicNames.length} phase-specific topics: ${phaseTopicNames.join(', ')}`);
            } else {
                // Fallback: derive from modules
                phaseTopicNames = modulesInPhase
                    .flatMap(m => m.topicsCovered || [])
                    .filter((v, i, a) => a.indexOf(v) === i);
            }
            
            const topicsList = phaseTopicNames.join(', ');
            
            // Use document content for context (limit to prevent token overflow)
            const contentSnippet = documentContent ? documentContent.substring(0, 12000) : '';

            const prompt = `You are creating a phase assessment quiz based on study material.

STUDY MATERIAL CONTENT:
${contentSnippet || 'Use general knowledge about the topics listed below.'}

PHASE INFORMATION:
Phase: ${phase.phaseName}
Phase Objective: ${phase.phaseObjective}
SPECIFIC TOPICS FOR THIS PHASE: ${topicsList}

IMPORTANT: Generate questions ONLY about the specific topics listed above. These topics are unique to this phase and should not overlap with other phases.

TASK: Generate 15 multiple choice questions that test understanding of the SPECIFIC TOPICS listed above, using content from the study material.

Format strictly as JSON array:
[
  {
    "questionId": "q_1",
    "questionText": "Specific question about one of the phase topics?",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": "Option 1",
    "explanation": "Detailed explanation referencing the study material.",
    "difficulty": "easy",
    "topic": "One of the specific phase topics"
  }
]

Requirements:
- 15 questions total
- Questions MUST be about the SPECIFIC TOPICS listed: ${topicsList}
- Each question's "topic" field must match one of the phase topics
- Difficulty distribution: 5 easy, 6 medium, 4 hard
- Test understanding based on the study material content
- Options must be plausible with one correct answer
- Explanations should reference the study material

Return ONLY valid JSON array, no other text.`;

            const result = await this.getContentWithTimeout(prompt, 35000);
            const questions = this.parseQuizResponse(result, 'phase');

            if (questions.length === 0) {
                return this.getDefaultPhaseQuiz(topicsList, documentContent);
            }

            // Verify questions are about the correct phase topics
            const validQuestions = questions.filter(q => {
                const questionTopic = (q.topic || '').toLowerCase();
                return phaseTopicNames.some(t => 
                    questionTopic.includes(t.toLowerCase()) || 
                    t.toLowerCase().includes(questionTopic) ||
                    q.questionText.toLowerCase().includes(t.toLowerCase())
                );
            });

            if (validQuestions.length < questions.length) {
                console.log(`   Filtered ${questions.length - validQuestions.length} off-topic questions`);
            }

            console.log(`✅ Generated ${validQuestions.length} phase questions for topics: ${topicsList}`);
            return validQuestions.length > 0 ? validQuestions : questions;
        } catch (error) {
            console.error('❌ Phase quiz generation failed:', error.message);
            return this.getDefaultPhaseQuiz(allTopics.map(t => t.name || t).join(', '), documentContent);
        }
    }

    /**
     * Generate final comprehensive quiz (30-35 questions covering entire roadmap)
     * @param {Array} phases - All phases
     * @param {Array} allTopics - All main topics
     * @returns {Promise<Array>} - Array of 30-35 MCQ questions
     */
    async generateFinalQuiz(phases, allTopics) {
        try {
            console.log(`🏆 Generating final comprehensive quiz...`);

            const topicsList = allTopics.map(t => t.name).join(', ');

            const prompt = `Generate 30-35 final assessment questions covering the entire learning roadmap:

Learning Roadmap Phases: ${phases.map(p => p.phaseName).join(', ')}
All Topics: ${topicsList}

Format strictly as JSON array:
[
  {
    "questionId": "q_1",
    "questionText": "Comprehensive question testing mastery?",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": "Option 1",
    "explanation": "Thorough explanation of the answer and its significance.",
    "difficulty": "medium",
    "topic": "Topic name"
  }
]

Requirements:
- 30-35 questions (final assessment size)
- Difficulty distribution: 8 easy, 12-14 medium, 8-10 hard
- Questions span entire learning roadmap
- Test synthesis, critical thinking, and application
- Cover learning outcomes from all phases
- Advanced questions test depth of understanding
- Options are strings, exactness matters
- Explanations connect to broader learning goals

Return ONLY valid JSON array, no other text.`;

            const result = await this.getContentWithTimeout(prompt, 45000);
            const questions = this.parseQuizResponse(result, 'final');

            if (questions.length === 0) {
                return this.getDefaultFinalQuiz();
            }

            console.log(`✅ Generated ${questions.length} final questions`);
            return questions;
        } catch (error) {
            console.error('❌ Final quiz generation failed:', error.message);
            return this.getDefaultFinalQuiz();
        }
    }

    /**
     * Parse and validate quiz response from API
     */
    parseQuizResponse(response, quizType) {
        try {
            // Extract JSON from response
            let jsonMatch = response.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                console.warn(`⚠️  No JSON found in ${quizType} quiz response`);
                return [];
            }

            const questions = JSON.parse(jsonMatch[0]);

            // Validate and clean questions
            return questions
                .filter(q => q && q.questionText && q.options && q.correctAnswer)
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

    /**
     * Default fallback quiz for module - extracts key terms from content
     */
    getDefaultModuleQuiz(topicsCovered, documentContent = '') {
        const topics = Array.isArray(topicsCovered) ? topicsCovered : [];
        const mainTopic = topics[0] || 'this subject';
        
        // Extract some key terms from document content if available
        const keyTerms = this.extractKeyTerms(documentContent);
        const term1 = keyTerms[0] || mainTopic;
        const term2 = keyTerms[1] || topics[1] || 'related concepts';
        const term3 = keyTerms[2] || topics[2] || 'applications';
        
        return [
            {
                questionId: 'q_1',
                questionText: `What is the fundamental concept of ${term1}?`,
                options: [
                    `Understanding the core principles of ${term1}`,
                    'A minor detail in the subject',
                    'An unrelated historical fact',
                    'A deprecated concept'
                ],
                correctAnswer: `Understanding the core principles of ${term1}`,
                explanation: `${term1} represents a fundamental concept that forms the foundation of this subject area.`,
                difficulty: 'easy',
                topic: term1
            },
            {
                questionId: 'q_2',
                questionText: `How does ${term1} relate to ${term2}?`,
                options: [
                    'They work together to achieve the learning objectives',
                    'They are completely unrelated',
                    'One replaces the other',
                    'They are contradictory concepts'
                ],
                correctAnswer: 'They work together to achieve the learning objectives',
                explanation: `${term1} and ${term2} are interconnected concepts that complement each other in this subject.`,
                difficulty: 'medium',
                topic: term2
            },
            {
                questionId: 'q_3',
                questionText: `What is a practical application of ${term3}?`,
                options: [
                    'Solving real-world problems in this domain',
                    'Only theoretical understanding',
                    'Historical documentation',
                    'No practical use'
                ],
                correctAnswer: 'Solving real-world problems in this domain',
                explanation: `${term3} has direct practical applications in solving real-world problems.`,
                difficulty: 'medium',
                topic: term3
            },
            {
                questionId: 'q_4',
                questionText: `Why is understanding ${mainTopic} important?`,
                options: [
                    'It provides essential knowledge for advanced concepts',
                    'It is not important',
                    'Only for historical interest',
                    'Required for certification only'
                ],
                correctAnswer: 'It provides essential knowledge for advanced concepts',
                explanation: `Understanding ${mainTopic} is crucial as it forms the basis for more advanced learning.`,
                difficulty: 'easy',
                topic: mainTopic
            },
            {
                questionId: 'q_5',
                questionText: `What is the best approach to mastering ${mainTopic}?`,
                options: [
                    'Practice with examples and hands-on exercises',
                    'Memorize all definitions',
                    'Skip to advanced topics',
                    'Read once and move on'
                ],
                correctAnswer: 'Practice with examples and hands-on exercises',
                explanation: 'Active practice and hands-on experience are the most effective ways to master any subject.',
                difficulty: 'easy',
                topic: 'Learning Strategy'
            },
            {
                questionId: 'q_6',
                questionText: `What are the key components of ${term1}?`,
                options: [
                    'Core principles, methods, and applications',
                    'Only theoretical concepts',
                    'Historical background only',
                    'None of the above'
                ],
                correctAnswer: 'Core principles, methods, and applications',
                explanation: `${term1} encompasses core principles, methodologies, and their practical applications.`,
                difficulty: 'medium',
                topic: term1
            },
            {
                questionId: 'q_7',
                questionText: `How can ${term2} be applied in real-world scenarios?`,
                options: [
                    'Through practical implementation and problem-solving',
                    'Only in academic settings',
                    'It cannot be applied practically',
                    'Through memorization only'
                ],
                correctAnswer: 'Through practical implementation and problem-solving',
                explanation: `${term2} has direct applications in solving real-world problems and challenges.`,
                difficulty: 'medium',
                topic: term2
            },
            {
                questionId: 'q_8',
                questionText: `What is the relationship between ${term1} and ${term3}?`,
                options: [
                    'They are interconnected and complement each other',
                    'They are completely independent',
                    'One contradicts the other',
                    'No relationship exists'
                ],
                correctAnswer: 'They are interconnected and complement each other',
                explanation: `${term1} and ${term3} work together to provide a comprehensive understanding of the subject.`,
                difficulty: 'hard',
                topic: term3
            },
            {
                questionId: 'q_9',
                questionText: `What is a common misconception about ${mainTopic}?`,
                options: [
                    'That it requires only memorization without understanding',
                    'That practice is necessary',
                    'That concepts build on each other',
                    'That application matters'
                ],
                correctAnswer: 'That it requires only memorization without understanding',
                explanation: 'A common misconception is that subjects can be mastered through memorization alone, when understanding is crucial.',
                difficulty: 'medium',
                topic: mainTopic
            },
            {
                questionId: 'q_10',
                questionText: `What advanced concepts build upon ${term1}?`,
                options: [
                    'Higher-level theories and complex applications',
                    'Basic definitions only',
                    'Unrelated topics',
                    'No advanced concepts exist'
                ],
                correctAnswer: 'Higher-level theories and complex applications',
                explanation: `Understanding ${term1} forms the foundation for more advanced theories and complex applications.`,
                difficulty: 'hard',
                topic: term1
            },
            {
                questionId: 'q_11',
                questionText: `What skills are developed when studying ${term2}?`,
                options: [
                    'Critical thinking and analytical abilities',
                    'Only memorization skills',
                    'Physical skills only',
                    'No skills are developed'
                ],
                correctAnswer: 'Critical thinking and analytical abilities',
                explanation: `Studying ${term2} develops critical thinking and analytical skills essential for problem-solving.`,
                difficulty: 'medium',
                topic: term2
            },
            {
                questionId: 'q_12',
                questionText: `How does ${mainTopic} contribute to overall learning?`,
                options: [
                    'Provides foundational knowledge for advanced studies',
                    'Has no contribution',
                    'Only useful for exams',
                    'Limited to theory only'
                ],
                correctAnswer: 'Provides foundational knowledge for advanced studies',
                explanation: `${mainTopic} provides essential foundational knowledge that supports advanced learning.`,
                difficulty: 'easy',
                topic: mainTopic
            },
            {
                questionId: 'q_13',
                questionText: `What is the most effective way to review ${term3}?`,
                options: [
                    'Active recall and spaced repetition',
                    'Reading notes once',
                    'Skipping review entirely',
                    'Passive observation'
                ],
                correctAnswer: 'Active recall and spaced repetition',
                explanation: 'Active recall and spaced repetition are scientifically proven methods for effective learning retention.',
                difficulty: 'easy',
                topic: term3
            },
            {
                questionId: 'q_14',
                questionText: `What challenges might one face when learning ${mainTopic}?`,
                options: [
                    'Connecting theory to practice and building intuition',
                    'Finding resources is impossible',
                    'No challenges exist',
                    'The topic is too simple'
                ],
                correctAnswer: 'Connecting theory to practice and building intuition',
                explanation: 'Common challenges include bridging theoretical knowledge with practical application and developing intuition.',
                difficulty: 'hard',
                topic: mainTopic
            },
            {
                questionId: 'q_15',
                questionText: `How can you verify your understanding of ${term1}?`,
                options: [
                    'By explaining it to others and solving problems',
                    'By re-reading the same material',
                    'By waiting for test results',
                    'Understanding cannot be verified'
                ],
                correctAnswer: 'By explaining it to others and solving problems',
                explanation: 'Teaching others and applying knowledge to problems are effective ways to verify understanding.',
                difficulty: 'hard',
                topic: term1
            }
        ];
    }
    
    /**
     * Extract key terms from document content
     */
    extractKeyTerms(content) {
        if (!content) return [];
        
        // Simple extraction of capitalized words/phrases and technical terms
        const words = content.substring(0, 5000)
            .split(/[\s\n,.;:!?()[\]{}]+/)
            .filter(word => word.length > 4 && word.length < 30)
            .filter(word => /^[A-Z]/.test(word) || /[A-Z]/.test(word.substring(1)))
            .slice(0, 10);
        
        // Get unique terms
        const uniqueTerms = [...new Set(words.map(w => w.replace(/[^a-zA-Z0-9\s]/g, '')))];
        return uniqueTerms.slice(0, 5);
    }

    /**
     * Default fallback for phase quiz
     */
    getDefaultPhaseQuiz(topicsList, documentContent = '') {
        const topics = typeof topicsList === 'string' 
            ? topicsList.split(', ').filter(t => t.trim())
            : [];
        const mainTopic = topics[0] || 'this subject';
        
        // Extract key terms from content
        const keyTerms = this.extractKeyTerms(documentContent);
        const term1 = keyTerms[0] || mainTopic;
        const term2 = keyTerms[1] || topics[1] || 'core concepts';
        const term3 = keyTerms[2] || topics[2] || 'applications';
        const topicName = topics[0] || 'this subject';
        
        return [
            {
                questionId: 'q_1',
                questionText: `What are the key learning outcomes of this phase about ${topicName}?`,
                options: ['Mastery of concepts', 'Theoretical knowledge', 'Practical skills', 'All of the above'],
                correctAnswer: 'All of the above',
                explanation: 'A complete phase includes theoretical knowledge, practical skills, and concept mastery.',
                difficulty: 'medium',
                topic: 'Phase Overview'
            },
            {
                questionId: 'q_2',
                questionText: 'How should you approach the topics in this phase?',
                options: ['Sequentially', 'Randomly', 'By difficulty', 'Horizontally across modules'],
                correctAnswer: 'Sequentially',
                explanation: 'Following the sequential structure ensures proper foundation building.',
                difficulty: 'easy',
                topic: 'Learning Strategy'
            },
            {
                questionId: 'q_3',
                questionText: `What is the primary purpose of studying ${topicName}?`,
                options: ['Understanding fundamentals', 'Memorizing facts', 'Passing exams', 'Historical knowledge'],
                correctAnswer: 'Understanding fundamentals',
                explanation: 'The primary purpose is to build a solid foundational understanding.',
                difficulty: 'easy',
                topic: topicName
            },
            {
                questionId: 'q_4',
                questionText: `How does ${topicName} connect to practical applications?`,
                options: ['Through real-world implementations', 'Only in theory', 'Not applicable', 'Historical context only'],
                correctAnswer: 'Through real-world implementations',
                explanation: 'Concepts learned should be applicable to real-world scenarios.',
                difficulty: 'medium',
                topic: topicName
            },
            {
                questionId: 'q_5',
                questionText: 'What is essential for mastery in this phase?',
                options: ['Practice and repetition', 'Reading alone', 'Watching videos', 'Taking notes'],
                correctAnswer: 'Practice and repetition',
                explanation: 'Active practice reinforces learning more effectively than passive consumption.',
                difficulty: 'medium',
                topic: 'Learning Strategy'
            },
            {
                questionId: 'q_6',
                questionText: `Which skill is most developed through studying ${topicName}?`,
                options: ['Critical thinking', 'Memorization', 'Speed reading', 'Note-taking'],
                correctAnswer: 'Critical thinking',
                explanation: 'Deep study develops critical thinking and analytical skills.',
                difficulty: 'medium',
                topic: topicName
            },
            {
                questionId: 'q_7',
                questionText: 'What indicates successful completion of this phase?',
                options: ['Ability to apply concepts independently', 'Finishing all readings', 'Time spent studying', 'Number of notes taken'],
                correctAnswer: 'Ability to apply concepts independently',
                explanation: 'True mastery is demonstrated through independent application.',
                difficulty: 'hard',
                topic: 'Assessment'
            },
            {
                questionId: 'q_8',
                questionText: `What is a common challenge when learning ${topicName}?`,
                options: ['Connecting theory to practice', 'Finding materials', 'Time management', 'Teacher availability'],
                correctAnswer: 'Connecting theory to practice',
                explanation: 'Bridging theoretical knowledge with practical application is often challenging.',
                difficulty: 'hard',
                topic: topicName
            },
            {
                questionId: 'q_9',
                questionText: 'How can you verify your understanding of this phase?',
                options: ['Self-assessment and quizzes', 'Re-reading content', 'Asking others', 'Waiting for results'],
                correctAnswer: 'Self-assessment and quizzes',
                explanation: 'Active self-assessment helps identify knowledge gaps.',
                difficulty: 'easy',
                topic: 'Assessment'
            },
            {
                questionId: 'q_10',
                questionText: `What is the relationship between different concepts in ${topicName}?`,
                options: ['Interconnected and building', 'Isolated topics', 'Contradictory', 'Unrelated'],
                correctAnswer: 'Interconnected and building',
                explanation: 'Concepts typically build upon each other in a structured curriculum.',
                difficulty: 'hard',
                topic: topicName
            },
            {
                questionId: 'q_11',
                questionText: `What is a key principle of ${topicName} that should be understood first?`,
                options: ['Foundational concepts and definitions', 'Advanced applications', 'Historical context only', 'None of the above'],
                correctAnswer: 'Foundational concepts and definitions',
                explanation: 'Starting with foundational concepts ensures a solid base for advanced learning.',
                difficulty: 'easy',
                topic: topicName
            },
            {
                questionId: 'q_12',
                questionText: `How does practice enhance understanding of ${topicName}?`,
                options: ['Reinforces concepts and reveals gaps', 'Has no effect', 'Only useful for exams', 'Slows down learning'],
                correctAnswer: 'Reinforces concepts and reveals gaps',
                explanation: 'Active practice reinforces learning and helps identify areas needing more attention.',
                difficulty: 'medium',
                topic: 'Learning Strategy'
            },
            {
                questionId: 'q_13',
                questionText: 'What approach maximizes retention of learned material?',
                options: ['Spaced repetition and active recall', 'Cramming before assessment', 'Passive reading', 'Highlighting text'],
                correctAnswer: 'Spaced repetition and active recall',
                explanation: 'Spaced repetition and active recall are proven techniques for long-term retention.',
                difficulty: 'medium',
                topic: 'Learning Strategy'
            },
            {
                questionId: 'q_14',
                questionText: `What is the most important outcome of mastering ${topicName}?`,
                options: ['Ability to apply knowledge independently', 'Completing assessments', 'Memorizing definitions', 'Reading all materials'],
                correctAnswer: 'Ability to apply knowledge independently',
                explanation: 'True mastery means being able to apply knowledge independently in various contexts.',
                difficulty: 'hard',
                topic: topicName
            },
            {
                questionId: 'q_15',
                questionText: 'How can collaboration enhance learning in this phase?',
                options: ['Through discussion and peer teaching', 'It has no benefit', 'Only for social purposes', 'Slows individual progress'],
                correctAnswer: 'Through discussion and peer teaching',
                explanation: 'Collaborative learning through discussion and teaching others deepens understanding.',
                difficulty: 'medium',
                topic: 'Learning Strategy'
            }
        ];
    }

    /**
     * Default fallback for final quiz
     */
    getDefaultFinalQuiz() {
        return [
            {
                questionId: 'q_1',
                questionText: 'What is the comprehensive objective of this entire learning roadmap?',
                options: ['Master core concepts', 'Develop practical skills', 'Understand applications', 'All of the above'],
                correctAnswer: 'All of the above',
                explanation: 'The complete roadmap integrates all aspects of learning.',
                difficulty: 'medium',
                topic: 'Overall Assessment'
            },
            {
                questionId: 'q_2',
                questionText: 'How can you apply all learned concepts together?',
                options: ['Synthesis and integration', 'Isolated application', 'Theoretical review', 'Historical perspective'],
                correctAnswer: 'Synthesis and integration',
                explanation: 'The final stage requires integrating all learned concepts into a coherent understanding.',
                difficulty: 'hard',
                topic: 'Application'
            },
            {
                questionId: 'q_3',
                questionText: 'What demonstrates complete mastery of the learning roadmap?',
                options: ['Ability to teach others', 'Completing all modules', 'Memorizing content', 'Taking notes'],
                correctAnswer: 'Ability to teach others',
                explanation: 'The highest level of understanding is demonstrated by teaching others.',
                difficulty: 'hard',
                topic: 'Mastery'
            },
            {
                questionId: 'q_4',
                questionText: 'Which approach best ensures long-term retention?',
                options: ['Spaced repetition and practice', 'Cramming before tests', 'Reading once', 'Passive observation'],
                correctAnswer: 'Spaced repetition and practice',
                explanation: 'Spaced repetition strengthens neural pathways for long-term memory.',
                difficulty: 'medium',
                topic: 'Learning Strategy'
            },
            {
                questionId: 'q_5',
                questionText: 'What is the value of completing all phases before the final assessment?',
                options: ['Builds comprehensive understanding', 'Saves time', 'Reduces stress', 'Improves grades'],
                correctAnswer: 'Builds comprehensive understanding',
                explanation: 'Each phase contributes to the complete picture needed for mastery.',
                difficulty: 'easy',
                topic: 'Learning Strategy'
            },
            {
                questionId: 'q_6',
                questionText: 'How should you handle gaps identified during learning?',
                options: ['Review and practice weak areas', 'Skip and move forward', 'Memorize answers', 'Ignore them'],
                correctAnswer: 'Review and practice weak areas',
                explanation: 'Addressing gaps strengthens overall understanding.',
                difficulty: 'easy',
                topic: 'Self-Assessment'
            },
            {
                questionId: 'q_7',
                questionText: 'What role does critical thinking play in the learning process?',
                options: ['Essential for deep understanding', 'Optional skill', 'Only for exams', 'Not important'],
                correctAnswer: 'Essential for deep understanding',
                explanation: 'Critical thinking enables analysis and application beyond memorization.',
                difficulty: 'medium',
                topic: 'Critical Thinking'
            },
            {
                questionId: 'q_8',
                questionText: 'What is the best way to prepare for practical application?',
                options: ['Hands-on practice', 'Reading textbooks', 'Watching videos', 'Taking notes'],
                correctAnswer: 'Hands-on practice',
                explanation: 'Practical skills are developed through active hands-on experience.',
                difficulty: 'medium',
                topic: 'Application'
            },
            {
                questionId: 'q_9',
                questionText: 'How do different phases of learning connect?',
                options: ['Build progressively on each other', 'Are independent', 'Can be done in any order', 'Are redundant'],
                correctAnswer: 'Build progressively on each other',
                explanation: 'Learning is structured to build upon previous knowledge.',
                difficulty: 'easy',
                topic: 'Structure'
            },
            {
                questionId: 'q_10',
                questionText: 'What indicates readiness for advanced topics?',
                options: ['Solid foundation in basics', 'Interest in learning', 'Available time', 'Teacher recommendation'],
                correctAnswer: 'Solid foundation in basics',
                explanation: 'Advanced learning requires mastery of fundamental concepts.',
                difficulty: 'hard',
                topic: 'Progression'
            }
        ];
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
