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
            short: `You are an expert academic content summarizer. Summarize the uploaded PDF content based on SHORT summary length.

General Instructions:
- Use clear, professional, and easy-to-understand language
- Preserve the original meaning and key ideas from the PDF
- Do NOT add information that is not supported by the document
- Avoid unnecessary repetition
- Ensure logical flow and consistent formatting
- The summary should be suitable for students and professionals

Formatting Rules for SHORT:
- Provide a brief overview (5–7 bullet points)
- Highlight only the most important concepts
- No sub-sections or external references

Output Requirements:
- Well-formatted bullet points
- Clearly separated sections
- Bullet points used appropriately

Content:\n${content}`,
            medium: `You are an expert academic content summarizer. Summarize the uploaded PDF content based on MEDIUM summary length.

General Instructions:
- Use clear, professional, and easy-to-understand language
- Preserve the original meaning and key ideas from the PDF
- Do NOT add information that is not supported by the document
- Avoid unnecessary repetition
- Ensure logical flow and consistent formatting
- The summary should be suitable for students and professionals

Formatting Rules for MEDIUM:
- Provide a structured summary with:
  - Title
  - Short introduction (2–3 lines)
  - Key Concepts (bullet points)
  - Conclusion
- Moderate depth, no external references

Output Requirements:
- Well-formatted
- Clearly separated sections
- Bullet points and paragraphs used appropriately

Content:\n${content}`,
            detailed: `You are an expert academic content summarizer. Summarize the uploaded PDF content based on DETAILED summary length.

General Instructions:
- Use clear, professional, and easy-to-understand language
- Preserve the original meaning and key ideas from the PDF
- Do NOT add information that is not supported by the document
- Avoid unnecessary repetition
- Ensure logical flow and consistent formatting
- The summary should be suitable for students and professionals

Formatting Rules for DETAILED:
- Provide a comprehensive, well-structured summary with:
  - Title
  - Introduction
  - Section-wise breakdown using clear headings
  - Important definitions, explanations, and examples (only if present in the PDF)
  - Key takeaways at the end

External References (ONLY for DETAILED):
- Add a separate section titled **"Further Reading & References"**
- Provide 3–6 high-quality external links related to the main topics
- Use authoritative sources only:
  - Official documentation
  - Research papers
  - Educational websites (e.g., Wikipedia, MDN, GeeksforGeeks, Khan Academy, IEEE, NCBI, etc.)
- Links should help the reader explore the topic in more depth
- Do NOT reference unrelated topics

Output Requirements:
- Well-formatted
- Clearly separated sections
- Bullet points and paragraphs used appropriately
- External links must be clickable and clearly labeled

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
     * Generate mind map structure
     * @param {string} content - The PDF content
     * @returns {Promise<Object>} - Mind map with nodes and edges
     */
    async generateMindMap(content) {
        const prompt = `Analyze this content and create a mind map structure. Return a valid JSON object with:
        - "nodes": Array of objects with {id, label, type ('root'|'main'|'sub'), level}
        - "edges": Array of objects with {id, source, target, label}
        
        The root node represents the main topic. Main nodes are primary concepts. Sub nodes are details.
        
        Return format:
        {
          "nodes": [
            {"id": "1", "label": "Main Topic", "type": "root", "level": 0},
            {"id": "2", "label": "Concept 1", "type": "main", "level": 1},
            {"id": "3", "label": "Detail", "type": "sub", "level": 2}
          ],
          "edges": [
            {"id": "e1-2", "source": "1", "target": "2", "label": "relates to"},
            {"id": "e2-3", "source": "2", "target": "3", "label": "includes"}
          ]
        }
        
        Return ONLY valid JSON, no additional text.
        
        Content:\n${content}`;

        try {
            const result = await this.model.generateContent(prompt);
            let textResponse = result.response.text();
            const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No valid JSON found in response');
            }
            const cleanJson = jsonMatch[0].replace(/```json|```/gi, '').trim();
            return JSON.parse(cleanJson);
        } catch (error) {
            throw new Error(`Failed to generate mind map: ${error.message}`);
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
