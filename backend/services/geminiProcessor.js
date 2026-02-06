/**
 * Gemini AI Processing Service
 * Handles all AI-powered content generation for PDFs
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiProcessor {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is required');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.modelName = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
        this.model = this.genAI.getGenerativeModel({ model: this.modelName });
    }

    /**
     * Generate different summary types
     * @param {string} content - The PDF content
     * @param {string} type - 'short' | 'medium' | 'detailed'
     * @returns {Promise<string>} - Generated summary
     */
    async generateSummary(content, type = 'short') {
        const prompts = {
            short: `You are an expert aca
            demic content summarizer. Summarize the uploaded PDF content based on SHORT summary length.

Output Requirements:
- Use Markdown for formatting.
- Provide a brief overview with 5-7 bullet points.
- Highlight only the most important concepts.

Content:\n${content}`,
            medium: `You are an expert academic content summarizer. Summarize the uploaded PDF content based on MEDIUM summary length.

Output Requirements:
- Use Markdown for formatting.
- Provide a structured summary with a title, a short introduction (2-3 lines), key concepts (bullet points), and a conclusion.

Content:\n${content}`,
            detailed: `You are an expert academic content summarizer. Summarize the uploaded PDF content based on DETAILED summary length.

Output Requirements:
- Use Markdown for formatting.
- Provide a comprehensive, well-structured summary with a title, introduction, section-wise breakdown with clear headings, important definitions and examples, and key takeaways.
- Include a 'Further Reading & References' section with 3-6 high-quality external links to authoritative sources (e.g., official documentation, research papers, educational websites).

Content:\n${content}`
        };

        try {
            const result = await this.model.generateContent(prompts[type] || prompts.short);
            return result.response.text();
        } catch (error) {
            throw new Error(`Failed to generate ${type} summary: ${error.message}`);
        }
    }

    /**
     * Generate quiz questions with multiple choice
     * @param {string} content - The PDF content
     * @param {number} count - Number of questions (default: 5)
     * @returns {Promise<Array>} - Array of quiz questions
     */
    async generateQuiz(content, count = 5) {
        const prompt = `Generate exactly ${count} multiple-choice quiz questions based on this content. 
        
        Return a valid JSON array with this structure:
        [
          {
            "id": "q1",
            "question": "Question text?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "Option A",
            "explanation": "Why this is correct"
          }
        ]
        
        Ensure questions test understanding, not just memory.
        Return ONLY valid JSON, no additional text.
        
        Content:\n${content}`;

        try {
            const result = await this.model.generateContent(prompt);
            let textResponse = result.response.text();
            const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('No valid JSON found in response');
            }
            const cleanJson = jsonMatch[0].replace(/```json|```/gi, '').trim();
            return JSON.parse(cleanJson);
        } catch (error) {
            throw new Error(`Failed to generate quiz: ${error.message}`);
        }
    }

    
    /**
     * Extract key points from content
     * @param {string} content - The PDF content
     * @param {number} count - Number of key points (default: 8)
     * @returns {Promise<Array>} - Array of key points
     */
    async extractKeyPoints(content, count = 8) {
        const prompt = `Extract exactly ${count} key bullet points from this content. 
        Each point should be concise (1 sentence) and important.
        
        Return a valid JSON array of strings only:
        ["Point 1", "Point 2", "Point 3", ...]
        
        Return ONLY valid JSON, no additional text.
        
        Content:\n${content}`;

        try {
            const result = await this.model.generateContent(prompt);
            let textResponse = result.response.text();
            const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('No valid JSON found in response');
            }
            const cleanJson = jsonMatch[0].replace(/```json|```/gi, '').trim();
            return JSON.parse(cleanJson);
        } catch (error) {
            throw new Error(`Failed to extract key points: ${error.message}`);
        }
    }

    /**
     * Analyze quiz answers and provide performance insights
     * @param {Array} quizzes - Original quiz questions
     * @param {Array} answers - User answers with format {questionId, selectedAnswer}
     * @param {string} content - Original PDF content
     * @returns {Promise<Object>} - Analysis with score, topics to focus on, etc.
     */
    async analyzeQuizPerformance(quizzes, answers, content) {
        const answeredQuestions = quizzes.map((q, idx) => ({
            ...q,
            userAnswer: answers[idx]?.selectedAnswer || '',
            isCorrect: answers[idx]?.selectedAnswer === q.correctAnswer,
        }));

        const score = answeredQuestions.filter(q => q.isCorrect).length;
        const percentage = Math.round((score / quizzes.length) * 100);

        // Identify weak areas
        const wrongAnswers = answeredQuestions.filter(q => !q.isCorrect);
        
        let topicsToFocus = [];
        if (wrongAnswers.length > 0) {
            const focusPrompt = `Based on these quiz questions that the user got WRONG, identify 3-5 key topics/areas they should focus on more.
            
            Wrong questions:
            ${wrongAnswers.map(q => `Q: ${q.question}\nUser answered: ${q.userAnswer}\nCorrect: ${q.correctAnswer}`).join('\n\n')}
            
            Return a JSON array of objects: [{"topic": "Topic Name", "reason": "Why to focus on this"}]
            Return ONLY valid JSON, no additional text.`;

            try {
                const result = await this.model.generateContent(focusPrompt);
                let textResponse = result.response.text();
                const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    const cleanJson = jsonMatch[0].replace(/```json|```/gi, '').trim();
                    topicsToFocus = JSON.parse(cleanJson);
                }
            } catch (error) {
                console.error('Error analyzing topics to focus:', error.message);
            }
        }

        return {
            score,
            totalQuestions: quizzes.length,
            percentage,
            answeredQuestions,
            topicsToFocus,
            performanceLevel: this._getPerformanceLevel(percentage),
            feedback: this._getPerformanceFeedback(percentage),
        };
    }

    /**
     * Get performance level based on percentage
     * @private
     */
    _getPerformanceLevel(percentage) {
        if (percentage >= 90) return 'Excellent';
        if (percentage >= 75) return 'Good';
        if (percentage >= 60) return 'Fair';
        if (percentage >= 50) return 'Needs Work';
        return 'Poor';
    }

    /**
     * Generate learning roadmap
     * @param {string} content - The PDF content
     * @param {number} steps - Number of roadmap steps (default: 5)
     * @param {string} learnerLevel - 'beginner', 'intermediate', or 'advanced'
     * @returns {Promise<Array>} - Array of roadmap steps
     */
    async generateRoadmap(content, steps = 5, learnerLevel = 'beginner') {
        const levelPrompts = {
            beginner: `Create a comprehensive BEGINNER level learning roadmap with exactly 9 sections based on this content.

🟢 BEGINNER LEVEL ROADMAP STRUCTURE:

1. Roadmap Overview
   - Learning purpose
   - What the learner will achieve
   - Target audience level (Beginner / Intermediate / Advanced)

2. Prerequisites (If Applicable)
   - Prior knowledge required
   - Concepts assumed from the document

3. Learning Phases (Progressive)
   Phase 1: Core Foundations
   - Objective: Establish fundamental understanding
   - Topics: Core concept 1, Core concept 2, Core concept 3
   - Key Skills Developed: Skill 1, Skill 2
   - Learning Outcomes: Outcome 1, Outcome 2

   Phase 2: Applied Understanding
   - Objective: Apply and connect concepts
   - Topics: Applied concept 1, Applied concept 2
   - Key Skills Developed: Skill 3, Skill 4
   - Learning Outcomes: Outcome 3, Outcome 4

   Phase 3: Advanced & Strategic Mastery
   - Objective: Develop deep and analytical expertise
   - Topics: Advanced concept 1, Advanced concept 2
   - Key Skills Developed: Skill 5, Skill 6
   - Learning Outcomes: Outcome 5, Outcome 6

4. Learning Flow & Dependencies
   - Recommended study order
   - Concept dependencies
   - Progression logic

5. Practice & Reinforcement (Optional)
   - Self-assessment activities
   - Reflection or review checkpoints
   - Knowledge consolidation steps

6. Completion Milestones
   - Phase completion indicators
   - Mastery checkpoints

7. Final Competency Outcomes
   - After completing this roadmap, the learner can:
   - Competency 1
   - Competency 2
   - Competency 3

8. Suggested Study Timeline (Optional)
   - Phase 1: X
   - Phase 2: X
   - Phase 3: X

9. Notes & Constraints
   - Based strictly on the uploaded PDF
   - No external content included
   - Adaptable pacing based on learner needs

Return a valid JSON array with this structure:
[
  {
    "step": 1,
    "title": "Roadmap Overview",
    "description": "Learning purpose and what the learner will achieve",
    "estimatedTime": "1-2 hours",
    "resources": ["Resource 1", "Resource 2"],
    "link": "https://example.com/resource"
  }
]`,

            intermediate: `Create an INTERMEDIATE level learning roadmap with exactly 5 steps based on this content.

🟡 INTERMEDIATE LEVEL ROADMAP STRUCTURE:
1. Roadmap Overview
   - Purpose and expected skill growth
   - Assumes basic familiarity with the topic

2. Knowledge Refresh (Optional)
   - Objective: Align understanding
   - Focus Areas: Review of key fundamentals, Clarification of common gaps

3. Applied Concepts
   - Objective: Apply and connect ideas
   - Topics: Concept application, Relationships between concepts
   - Skills Developed: Practical understanding, Analytical thinking
   - Learning Outcomes: Apply knowledge to examples, Explain interconnections

4. Problem-Solving & Interpretation
   - Objective: Use knowledge actively
   - Topics: Case-based reasoning, Interpretation of data or arguments
   - Skills Developed: Critical thinking, Problem-solving
   - Learning Outcomes: Solve moderate-level problems, Interpret outcomes correctly

5. Intermediate Completion Milestone
   - Confident application of concepts
   - Prepared for advanced learning

Return a valid JSON array with this structure:
[
  {
    "step": 1,
    "title": "Roadmap Overview",
    "description": "Purpose and expected skill growth",
    "estimatedTime": "2-3 hours",
    "resources": ["Resource 1", "Resource 2"],
    "link": "https://example.com/resource"
  }
]`,

            advanced: `Create an ADVANCED level learning roadmap with exactly 6 steps based on this content.

🔵 ADVANCED LEVEL ROADMAP STRUCTURE:
1. Roadmap Overview
   - Focus on mastery and depth
   - Assumes strong prior knowledge

2. Deep Conceptual Analysis
   - Objective: Achieve expert-level understanding
   - Topics: Complex theories, Detailed frameworks or models
   - Skills Developed: Deep analysis, Conceptual synthesis
   - Learning Outcomes: Analyze complex ideas, Compare multiple approaches

3. Strategic & Critical Thinking
   - Objective: Evaluate and reason at a high level
   - Topics: Trade-offs and implications, Strengths and limitations
   - Skills Developed: Evaluation, Strategic reasoning
   - Learning Outcomes: Critically assess concepts, Justify decisions or conclusions

4. Mastery & Insight Generation
   - Objective: Go beyond the document
   - Topics: Insight extraction, Advanced interpretation
   - Skills Developed: Insight generation, Thought leadership
   - Learning Outcomes: Generate original insights, Form expert-level conclusions

5. Advanced Completion Milestone
   - Mastery of subject matter
   - Ability to teach or apply strategically

6. External Reading Resources
   - Recommended advanced readings and research papers
   - Scholarly articles and expert publications
   - Cutting-edge developments and future directions

Return a valid JSON array with this structure:
[
  {
    "step": 1,
    "title": "Roadmap Overview",
    "description": "Focus on mastery and depth",
    "estimatedTime": "3-4 hours",
    "resources": ["Resource 1", "Resource 2"],
    "link": "https://example.com/resource"
  }
]`
        };

        const prompt = `${levelPrompts[learnerLevel] || levelPrompts.beginner}

🔒 UNIVERSAL RULES (For All Levels):
- Use only content from the uploaded PDF
- Do not mix levels in a single roadmap
- Maintain consistent structure and tone
- Keep learning outcomes measurable
- Ensure PDF-ready formatting
- Provide 2-3 relevant resources per step
- Include realistic time estimates
- Return ONLY valid JSON, no additional text.

Content:\n${content}`;

        try {
            const result = await this.model.generateContent(prompt);
            let textResponse = result.response.text();
            const jsonMatch = textResponse.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('No valid JSON found in response');
            }
            const cleanJson = jsonMatch[0].replace(/```json|```/gi, '').trim();
            return JSON.parse(cleanJson);
        } catch (error) {
            throw new Error(`Failed to generate roadmap: ${error.message}`);
        }
    }

    /**
     * Get performance feedback
     * @private
     */
    _getPerformanceFeedback(percentage) {
        if (percentage >= 90) return 'Outstanding performance! You have mastered this material.';
        if (percentage >= 75) return 'Great job! You have a solid understanding. Review the weaker areas.';
        if (percentage >= 60) return 'Good effort! Focus on the topics marked below for improvement.';
        if (percentage >= 50) return 'You\'re on the right track. More study needed on key concepts.';
        return 'This material needs more review. Focus on fundamentals first.';
    }
}

module.exports = GeminiProcessor;
