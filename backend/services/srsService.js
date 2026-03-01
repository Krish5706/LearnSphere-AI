/**
 * Spaced Repetition Service (SRS)
 * 
 * Implements the SM-2 Algorithm for optimal memory retention
 * 
 * SM-2 Algorithm (SuperMemo 2):
 * - Quality ratings: 0-5 (0-2 = failure, 3-5 = success)
 * - EF (Ease Factor): Starts at 2.5, adjusts based on responses
 * - Interval calculation based on repetitions and EF
 * 
 * Quality Ratings:
 * 0 - Complete blackout, no recall
 * 1 - Incorrect, but recognized answer
 * 2 - Incorrect, but answer seemed easy to recall
 * 3 - Correct with serious difficulty
 * 4 - Correct after hesitation
 * 5 - Perfect response, immediate recall
 * 
 * User-Friendly Mapping:
 * "Again" (0) - Complete failure, restart
 * "Hard"  (2) - Difficult recall
 * "Good"  (3) - Correct with effort  
 * "Easy"  (5) - Perfect recall
 */

const Flashcard = require('../models/Flashcard');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class SRSService {
    constructor(apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        
        // SM-2 Configuration
        this.config = {
            initialEaseFactor: 2.5,
            minEaseFactor: 1.3,
            maxEaseFactor: 3.0,
            graduatingInterval: 1,      // First successful review = 1 day
            easyBonus: 1.3,             // Multiplier for "Easy" rating
            hardIntervalMultiplier: 1.2,
            lapseInterval: 1,           // Return to 1 day after lapse
            maxInterval: 365,           // Maximum interval in days
            newCardsPerDay: 20,         // Default new cards per day
            reviewsPerDay: 100,         // Default reviews per day
        };

        // Maturity thresholds (in days)
        this.maturityThresholds = {
            young: 7,      // 7+ days = young
            mature: 21,    // 21+ days = mature
            mastered: 60   // 60+ days = mastered
        };
    }

    /**
     * SM-2 Algorithm Implementation
     * 
     * Core formula:
     * EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
     * 
     * Where:
     * EF' = new ease factor
     * EF = old ease factor
     * q = quality of response (0-5)
     * 
     * @param {Object} card - Current flashcard state
     * @param {Number} quality - User's quality rating (0-5)
     * @param {Number} responseTime - Time taken to respond (ms)
     * @returns {Object} Updated card parameters
     */
    calculateNextReview(card, quality, responseTime = 0) {
        // Store previous values for history
        const previousInterval = card.interval;
        const previousEaseFactor = card.easeFactor;
        
        // Initialize current values
        let easeFactor = card.easeFactor || this.config.initialEaseFactor;
        let interval = card.interval || 0;
        let repetitions = card.repetitions || 0;
        let lapses = card.lapses || 0;
        let status = card.status || 'new';

        // Calculate new ease factor using SM-2 formula
        // Only adjust EF for quality >= 3 (successful recall)
        const newEaseFactor = this.calculateEaseFactor(easeFactor, quality);
        
        // Determine if this is a successful recall
        const isSuccess = quality >= 3;

        if (isSuccess) {
            // Successful recall
            repetitions += 1;
            
            // Calculate new interval
            if (repetitions === 1) {
                interval = 1;  // First success: 1 day
            } else if (repetitions === 2) {
                interval = 6;  // Second success: 6 days
            } else {
                // Subsequent successes: multiply by ease factor
                interval = Math.round(interval * newEaseFactor);
            }

            // Apply easy bonus for perfect recall
            if (quality === 5) {
                interval = Math.round(interval * this.config.easyBonus);
            }

            // Apply hard penalty
            if (quality === 3) {
                interval = Math.round(interval * this.config.hardIntervalMultiplier * 0.8);
            }

            // Update status progression
            if (status === 'new' || status === 'learning') {
                status = 'learning';
                if (repetitions >= 2) {
                    status = 'review';
                }
            } else if (status === 'relearning') {
                status = 'review';
            }

        } else {
            // Failed recall (quality < 3)
            repetitions = 0;  // Reset repetition count
            interval = this.config.lapseInterval;  // Reset to short interval
            
            // If was in review state, this is a lapse
            if (status === 'review' || status === 'graduated') {
                lapses += 1;
                status = 'relearning';
            } else {
                status = 'learning';
            }
        }

        // Cap interval at maximum
        interval = Math.min(interval, this.config.maxInterval);
        
        // Calculate next review date
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + interval);
        nextReviewDate.setHours(4, 0, 0, 0);  // Schedule for 4 AM to group reviews

        // Determine maturity level based on interval
        const maturityLevel = this.calculateMaturityLevel(interval);

        // Check for graduation to mastered
        if (status === 'review' && interval >= this.maturityThresholds.mastered) {
            status = 'graduated';
        }

        return {
            easeFactor: Math.max(newEaseFactor, this.config.minEaseFactor),
            interval,
            repetitions,
            lapses,
            status,
            maturityLevel,
            nextReviewDate,
            
            // For history tracking
            previousInterval,
            previousEaseFactor,
            newEaseFactor: Math.max(newEaseFactor, this.config.minEaseFactor),
            
            // Stats
            isSuccess,
            quality,
            responseTime
        };
    }

    /**
     * Calculate new Ease Factor using SM-2 formula
     */
    calculateEaseFactor(currentEF, quality) {
        // SM-2 EF calculation
        // EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
        const q = quality;
        const newEF = currentEF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
        
        // Clamp EF to valid range
        return Math.max(this.config.minEaseFactor, Math.min(newEF, this.config.maxEaseFactor));
    }

    /**
     * Calculate maturity level based on interval
     */
    calculateMaturityLevel(interval) {
        if (interval >= this.maturityThresholds.mastered) return 'mastered';
        if (interval >= this.maturityThresholds.mature) return 'mature';
        if (interval >= this.maturityThresholds.young) return 'young';
        return 'new';
    }

    /**
     * Get due cards for review
     */
    async getDueCards(userId, options = {}) {
        const { 
            limit = 50, 
            deck = null,
            includeNew = true,
            documentId = null 
        } = options;

        const now = new Date();
        
        // Base query for due cards
        const query = {
            user: userId,
            nextReviewDate: { $lte: now },
            isArchived: false,
            status: { $nin: ['suspended'] }
        };

        if (deck) query.deck = deck;
        if (documentId) query.document = documentId;
        if (!includeNew) query.status = { $nin: ['new', 'suspended'] };

        // Fetch cards sorted by priority
        // Priority: overdue > learning > new
        const cards = await Flashcard.find(query)
            .sort({ 
                status: 1,  // learning before review
                nextReviewDate: 1  // oldest due first
            })
            .limit(limit)
            .lean();

        // Calculate additional metrics for each card
        return cards.map(card => ({
            ...card,
            overdueBy: this.calculateOverdueDays(card.nextReviewDate),
            difficultyLabel: this.getDifficultyLabel(card.easeFactor),
            predictedRetention: this.predictRetention(card)
        }));
    }

    /**
     * Calculate how many days a card is overdue
     */
    calculateOverdueDays(nextReviewDate) {
        const now = new Date();
        const diff = now - new Date(nextReviewDate);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        return Math.max(0, days);
    }

    /**
     * Get difficulty label from ease factor
     */
    getDifficultyLabel(easeFactor) {
        if (easeFactor >= 2.4) return 'Easy';
        if (easeFactor >= 2.0) return 'Medium';
        if (easeFactor >= 1.7) return 'Hard';
        return 'Very Hard';
    }

    /**
     * Predict retention probability using forgetting curve
     * Based on Ebbinghaus forgetting curve
     */
    predictRetention(card) {
        if (!card.lastReviewDate) return 100;
        
        const now = new Date();
        const daysSinceReview = (now - new Date(card.lastReviewDate)) / (1000 * 60 * 60 * 24);
        
        // Stability factor based on repetitions and ease factor
        const stability = card.interval * (card.easeFactor / 2.5);
        
        // R = e^(-t/S) where t = time, S = stability
        const retention = Math.exp(-daysSinceReview / stability);
        
        return Math.round(retention * 100);
    }

    /**
     * Get study statistics for a user
     */
    async getStudyStats(userId, options = {}) {
        const { deck = null, documentId = null, days = 30 } = options;

        const baseQuery = { user: userId, isArchived: false };
        if (deck) baseQuery.deck = deck;
        if (documentId) baseQuery.document = documentId;

        // Get all cards
        const allCards = await Flashcard.find(baseQuery).lean();

        // Calculate statistics
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const stats = {
            totalCards: allCards.length,
            
            // Card states
            newCards: allCards.filter(c => c.status === 'new').length,
            learningCards: allCards.filter(c => ['learning', 'relearning'].includes(c.status)).length,
            reviewCards: allCards.filter(c => c.status === 'review').length,
            graduatedCards: allCards.filter(c => c.status === 'graduated').length,
            suspendedCards: allCards.filter(c => c.status === 'suspended').length,

            // Maturity distribution
            maturity: {
                new: allCards.filter(c => c.maturityLevel === 'new').length,
                young: allCards.filter(c => c.maturityLevel === 'young').length,
                mature: allCards.filter(c => c.maturityLevel === 'mature').length,
                mastered: allCards.filter(c => c.maturityLevel === 'mastered').length
            },

            // Due cards
            dueToday: allCards.filter(c => 
                new Date(c.nextReviewDate) <= now && 
                c.status !== 'suspended'
            ).length,
            dueThisWeek: allCards.filter(c => {
                const dueDate = new Date(c.nextReviewDate);
                const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                return dueDate <= weekFromNow && c.status !== 'suspended';
            }).length,

            // Performance metrics
            totalReviews: allCards.reduce((sum, c) => sum + c.totalReviews, 0),
            averageEaseFactor: allCards.length > 0 
                ? allCards.reduce((sum, c) => sum + c.easeFactor, 0) / allCards.length 
                : 2.5,
            totalLapses: allCards.reduce((sum, c) => sum + c.lapses, 0),
            
            // Retention rate
            overallRetention: this.calculateOverallRetention(allCards),

            // Streak info
            longestStreak: Math.max(...allCards.map(c => c.longestStreak), 0),
            averageStreak: allCards.length > 0
                ? allCards.reduce((sum, c) => sum + c.streak, 0) / allCards.length
                : 0,

            // Time-based stats
            averageResponseTime: this.calculateAverageResponseTime(allCards),

            // Difficulty distribution
            difficulty: {
                easy: allCards.filter(c => c.easeFactor >= 2.4).length,
                medium: allCards.filter(c => c.easeFactor >= 2.0 && c.easeFactor < 2.4).length,
                hard: allCards.filter(c => c.easeFactor >= 1.7 && c.easeFactor < 2.0).length,
                veryHard: allCards.filter(c => c.easeFactor < 1.7).length
            }
        };

        return stats;
    }

    /**
     * Calculate overall retention rate
     */
    calculateOverallRetention(cards) {
        const totalCorrect = cards.reduce((sum, c) => sum + c.correctCount, 0);
        const totalIncorrect = cards.reduce((sum, c) => sum + c.incorrectCount, 0);
        const total = totalCorrect + totalIncorrect;
        
        if (total === 0) return 100;
        return Math.round((totalCorrect / total) * 100);
    }

    /**
     * Calculate average response time
     */
    calculateAverageResponseTime(cards) {
        const cardsWithTime = cards.filter(c => c.averageResponseTime > 0);
        if (cardsWithTime.length === 0) return 0;
        
        const totalTime = cardsWithTime.reduce((sum, c) => sum + c.averageResponseTime, 0);
        return Math.round(totalTime / cardsWithTime.length);
    }

    /**
     * Get forecast of upcoming reviews
     */
    async getReviewForecast(userId, days = 14) {
        const now = new Date();
        const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        const cards = await Flashcard.find({
            user: userId,
            nextReviewDate: { $gte: now, $lte: endDate },
            isArchived: false,
            status: { $nin: ['suspended'] }
        }).lean();

        // Group by day
        const forecast = {};
        for (let i = 0; i < days; i++) {
            const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
            const dateKey = date.toISOString().split('T')[0];
            forecast[dateKey] = 0;
        }

        cards.forEach(card => {
            const dateKey = new Date(card.nextReviewDate).toISOString().split('T')[0];
            if (forecast[dateKey] !== undefined) {
                forecast[dateKey]++;
            }
        });

        return Object.entries(forecast).map(([date, count]) => ({
            date,
            count,
            dayName: new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
        }));
    }

    /**
     * Generate flashcards from document content using AI
     */
    async generateFlashcardsFromContent(content, options = {}) {
        const {
            count = 10,
            difficulty = 'medium',
            focusAreas = [],
            documentTitle = 'Document'
        } = options;

        const prompt = `You are an expert educational content creator specializing in creating effective flashcards for spaced repetition learning.

Analyze the following document content and create ${count} high-quality flashcards.

DOCUMENT CONTENT:
${content.substring(0, 15000)}

REQUIREMENTS:
1. Create exactly ${count} flashcards
2. Difficulty level: ${difficulty}
3. ${focusAreas.length > 0 ? `Focus on these areas: ${focusAreas.join(', ')}` : 'Cover the most important concepts'}

FLASHCARD GUIDELINES:
- Front: Clear, specific question or prompt (not too long)
- Back: Concise, accurate answer
- Hint: Optional helpful clue without giving away the answer
- Explanation: Brief context or elaboration for deeper understanding
- Tags: 2-3 relevant topic tags

IMPORTANT:
- Questions should test understanding, not just memorization
- Include a mix of conceptual and factual questions
- Make questions specific enough to have clear answers
- Avoid questions that are too broad or vague

Return ONLY a valid JSON array with this structure:
[
  {
    "front": "Question or prompt text",
    "back": "Answer text",
    "hint": "Optional hint",
    "explanation": "Why this answer is correct or additional context",
    "tags": ["tag1", "tag2"],
    "difficulty": "easy|medium|hard"
  }
]

JSON ONLY - NO OTHER TEXT:`;

        try {
            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();
            
            // Extract JSON from response
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('No valid JSON array found in response');
            }

            const flashcards = JSON.parse(jsonMatch[0]);
            
            // Validate and clean flashcards
            return flashcards.filter(card => 
                card.front && 
                card.back && 
                card.front.length > 5 && 
                card.back.length > 1
            ).map(card => ({
                front: card.front.trim(),
                back: card.back.trim(),
                hint: card.hint?.trim() || null,
                explanation: card.explanation?.trim() || null,
                tags: Array.isArray(card.tags) ? card.tags.map(t => t.toLowerCase().trim()) : [],
                source: {
                    type: 'ai-generated',
                    context: documentTitle
                }
            }));

        } catch (error) {
            console.error('❌ AI flashcard generation failed:', error.message);
            throw new Error('Failed to generate flashcards: ' + error.message);
        }
    }

    /**
     * Generate flashcards from key points
     */
    async generateFromKeyPoints(keyPoints, documentTitle = 'Document') {
        const flashcards = [];

        for (const point of keyPoints) {
            // Create a question from the key point
            const flashcard = await this.createQuestionFromPoint(point);
            if (flashcard) {
                flashcard.source = {
                    type: 'ai-generated',
                    context: documentTitle
                };
                flashcards.push(flashcard);
            }
        }

        return flashcards;
    }

    /**
     * Create a question from a key point
     */
    async createQuestionFromPoint(keyPoint) {
        const prompt = `Convert this key point into a flashcard for studying:

KEY POINT: "${keyPoint}"

Create ONE flashcard with:
- front: A clear question testing understanding of this point
- back: A concise, accurate answer
- hint: Optional hint
- tags: 2-3 relevant tags

Return ONLY valid JSON:
{
  "front": "...",
  "back": "...",
  "hint": "...",
  "tags": ["..."]
}`;

        try {
            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();
            
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return null;

            const card = JSON.parse(jsonMatch[0]);
            return {
                front: card.front,
                back: card.back,
                hint: card.hint || null,
                tags: card.tags || []
            };
        } catch (error) {
            console.error('Error creating flashcard from point:', error.message);
            return null;
        }
    }

    /**
     * Optimize study session based on user performance
     */
    getOptimalStudyOrder(cards) {
        // Priority scoring for cards
        return cards.sort((a, b) => {
            // Calculate priority score
            const scoreA = this.calculatePriorityScore(a);
            const scoreB = this.calculatePriorityScore(b);
            return scoreB - scoreA;  // Higher priority first
        });
    }

    /**
     * Calculate priority score for a card
     */
    calculatePriorityScore(card) {
        let score = 0;

        // Overdue cards get highest priority
        const overdueDays = this.calculateOverdueDays(card.nextReviewDate);
        score += overdueDays * 10;

        // Learning cards get priority over review cards
        if (card.status === 'learning' || card.status === 'relearning') {
            score += 50;
        }

        // Cards with low ease factor (difficult) get priority
        if (card.easeFactor < 2.0) {
            score += 20;
        }

        // Cards with lapses get priority
        score += card.lapses * 5;

        // New cards get some priority for introduction
        if (card.status === 'new') {
            score += 30;
        }

        return score;
    }

    /**
     * Get recommended study duration based on due cards
     */
    getRecommendedStudyTime(dueCards) {
        const avgTimePerCard = 30; // seconds
        const totalSeconds = dueCards.length * avgTimePerCard;
        const minutes = Math.ceil(totalSeconds / 60);

        if (minutes < 5) return '< 5 minutes';
        if (minutes < 15) return '5-15 minutes';
        if (minutes < 30) return '15-30 minutes';
        if (minutes < 60) return '30-60 minutes';
        return '60+ minutes';
    }

    /**
     * AI-based answer evaluation
     * Compares user's answer with correct answer using Gemini
     * Handles typos, grammar mistakes, and partial matches
     * 
     * @param {String} userAnswer - User's submitted answer
     * @param {String} correctAnswer - The correct answer from flashcard
     * @param {String} question - The question for context
     * @returns {Object} { correct: boolean, feedback: string, confidence: number }
     */
    async evaluateAnswer(userAnswer, correctAnswer, question) {
        try {
            // Quick check for empty answers
            if (!userAnswer || !userAnswer.trim()) {
                return {
                    correct: false,
                    feedback: 'No answer provided',
                    confidence: 100
                };
            }

            // Quick exact match check (case-insensitive)
            const normalize = (s) => s.toLowerCase().trim().replace(/[^\w\s]/g, '');
            if (normalize(userAnswer) === normalize(correctAnswer)) {
                return {
                    correct: true,
                    feedback: 'Perfect answer!',
                    confidence: 100
                };
            }

            // Use AI for semantic comparison
            const prompt = `You are an educational answer evaluator. Compare the student's answer with the correct answer for this flashcard question.

Question: "${question}"

Correct Answer: "${correctAnswer}"

Student's Answer: "${userAnswer}"

Evaluate if the student's answer is CORRECT. Consider:
- The core meaning/concept must be correct
- Allow for typos, spelling mistakes, grammar errors
- Allow for different wording if the meaning is the same  
- Partial answers: if student gave main point but missed minor details, still mark correct
- If student's answer captures the essential knowledge, it's correct

Respond with ONLY valid JSON (no markdown, no code blocks):
{"correct": true/false, "feedback": "brief explanation", "confidence": 85}

The confidence should be 0-100 indicating how sure you are.`;

            const result = await this.model.generateContent(prompt);
            const response = result.response.text().trim();
            
            // Parse JSON response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    correct: Boolean(parsed.correct),
                    feedback: parsed.feedback || '',
                    confidence: parsed.confidence || 80
                };
            }

            // Fallback: check if response contains "correct": true
            const isCorrect = response.toLowerCase().includes('"correct": true') || 
                             response.toLowerCase().includes('"correct":true');
            return {
                correct: isCorrect,
                feedback: 'AI evaluation completed',
                confidence: 70
            };

        } catch (error) {
            console.error('AI answer evaluation error:', error);
            
            // Fallback to simple keyword matching
            const userWords = userAnswer.toLowerCase().split(/\s+/).filter(w => w.length > 2);
            const correctWords = correctAnswer.toLowerCase().split(/\s+/).filter(w => w.length > 2);
            const matched = correctWords.filter(w => 
                userWords.some(uw => uw.includes(w) || w.includes(uw))
            );
            const similarity = matched.length / Math.max(correctWords.length, 1);
            
            return {
                correct: similarity >= 0.5,
                feedback: 'Evaluated using keyword matching',
                confidence: Math.round(similarity * 100)
            };
        }
    }
}

module.exports = SRSService;
