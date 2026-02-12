/**
 * Quiz Service
 * Generates quizzes with MCQs for each module and phase
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class QuizService {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is required');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.modelName = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
        this.model = this.genAI.getGenerativeModel({ model: this.modelName });
    }

    /**
     * Generate MCQ quiz for a module (10-15 questions)
     * @param {Object} module - Module object with name and topics
     * @param {Array} topicsCovered - Topics covered in this module
     * @param {string} phaseObjective - The objective of the phase
     * @returns {Promise<Array>} - Array of MCQ questions
     */
    async generateModuleQuiz(module, topicsCovered, phaseObjective) {
        try {
            console.log(`📝 Generating module quiz for: ${module.moduleTitle}...`);
            
            const prompt = `Generate 12-15 multiple choice questions for this module:
Module: ${module.moduleTitle}
Topics: ${topicsCovered.join(', ')}
Objective: ${phaseObjective}

Format strictly as JSON array:
[
  {
    "questionId": "q_1",
    "questionText": "Question with clear problem statement?",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": "Option 1",
    "explanation": "Why this is correct. Detailed explanation.",
    "difficulty": "easy",
    "topic": "Specific topic name"
  }
]

Requirements:
- 12-15 questions total
- Mix of difficulty levels: 4-5 easy, 6-7 medium, 3-4 hard
- Each question tests concepts from topics covered
- Options are strings, one must match correctAnswer exactly
- Explanations are educational and detailed
- One correct answer per question

Return ONLY valid JSON array, no other text.`;

            const result = await this.getContentWithTimeout(prompt, 15000);
            const questions = this.parseQuizResponse(result, 'module');

            if (questions.length === 0) {
                console.warn('⚠️  Using fallback quiz');
                return this.getDefaultModuleQuiz(topicsCovered);
            }

            console.log(`✅ Generated ${questions.length} module questions`);
            return questions;
        } catch (error) {
            console.error('❌ Module quiz generation failed:', error.message);
            return this.getDefaultModuleQuiz(topicsCovered);
        }
    }

    /**
     * Generate phase-end quiz (30 questions covering all topics of the phase)
     * @param {Object} phase - Phase object
     * @param {Array} allTopics - All topics in the roadmap
     * @param {Array} modulesInPhase - All modules in this phase
     * @returns {Promise<Array>} - Array of 30 MCQ questions
     */
    async generatePhaseQuiz(phase, allTopics, modulesInPhase) {
        try {
            console.log(`📚 Generating phase quiz for: ${phase.phaseName}...`);

            const topicsList = modulesInPhase
                .flatMap(m => m.topicsCovered || [])
                .filter((v, i, a) => a.indexOf(v) === i)
                .join(', ');

            const prompt = `Generate 28-32 comprehensive multiple choice questions for this learning phase:

Phase: ${phase.phaseName}
Phase Objective: ${phase.phaseObjective}
Topics Covered: ${topicsList}

Format strictly as JSON array:
[
  {
    "questionId": "q_1",
    "questionText": "Question testing understanding?",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": "Option 1",
    "explanation": "Detailed explanation of why this answer is correct.",
    "difficulty": "easy",
    "topic": "Topic name"
  }
]

Requirements:
- 28-32 questions total (approximately 30)
- Difficulty distribution: 8-10 easy, 10-12 medium, 8-10 hard
- Cover ALL topics mentioned
- Comprehensive assessment of phase learning outcomes
- Questions build on module quizzes but go deeper
- Each question tests synthesis and application
- Options are strings, exactness matters for correctAnswer
- Explanations are detailed and educational

Return ONLY valid JSON array, no other text.`;

            const result = await this.getContentWithTimeout(prompt, 20000);
            const questions = this.parseQuizResponse(result, 'phase');

            if (questions.length === 0) {
                return this.getDefaultPhaseQuiz(topicsList);
            }

            console.log(`✅ Generated ${questions.length} phase questions`);
            return questions;
        } catch (error) {
            console.error('❌ Phase quiz generation failed:', error.message);
            return this.getDefaultPhaseQuiz('');
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

            const result = await this.getContentWithTimeout(prompt, 20000);
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
     * Helper function to call API with timeout
     */
    async getContentWithTimeout(prompt, timeoutMs = 15000) {
        return Promise.race([
            this.model.generateContent(prompt).then(result => result.response.text().trim()),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('API timeout')), timeoutMs)
            )
        ]);
    }

    /**
     * Default fallback quiz for module
     */
    getDefaultModuleQuiz(topicsCovered) {
        const topics = topicsCovered.join(' and ');
        return [
            {
                questionId: 'q_1',
                questionText: `What is the primary concept of ${topicsCovered[0] || 'this topic'}?`,
                options: ['Core principle', 'Secondary aspect', 'Implementation detail', 'Historical note'],
                correctAnswer: 'Core principle',
                explanation: `The primary concept relates to understanding the fundamental aspects of ${topicsCovered[0] || 'this topic'}.`,
                difficulty: 'easy',
                topic: topicsCovered[0] || 'General'
            },
            {
                questionId: 'q_2',
                questionText: `How would you apply knowledge of ${topicsCovered[0] || 'this topic'} in practice?`,
                options: ['Direct application', 'Theoretical only', 'Historical context', 'Not applicable'],
                correctAnswer: 'Direct application',
                explanation: `Practical application of ${topicsCovered[0] || 'this topic'} is essential for real-world scenarios.`,
                difficulty: 'medium',
                topic: topicsCovered[0] || 'General'
            },
            {
                questionId: 'q_3',
                questionText: `What is the relationship between ${topicsCovered[0] || 'concept A'} and ${topicsCovered[1] || 'concept B'}?`,
                options: ['Complementary', 'Unrelated', 'Contradictory', 'Sequential only'],
                correctAnswer: 'Complementary',
                explanation: `These concepts work together to form a comprehensive understanding of the subject matter.`,
                difficulty: 'medium',
                topic: topicsCovered[1] || 'General'
            }
        ];
    }

    /**
     * Default fallback for phase quiz
     */
    getDefaultPhaseQuiz(topicsList) {
        return [
            {
                questionId: 'q_1',
                questionText: 'What are the key learning outcomes of this phase?',
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
