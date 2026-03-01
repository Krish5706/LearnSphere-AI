/**
 * Flashcard Controller
 * 
 * Handles all flashcard and SRS operations:
 * - CRUD operations for flashcards
 * - Study session management
 * - Review submission with SM-2 algorithm
 * - Statistics and analytics
 * - AI-powered flashcard generation
 */

const Flashcard = require('../models/Flashcard');
const Document = require('../models/Document');
const SRSService = require('../services/srsService');
const mongoose = require('mongoose');

// Initialize SRS Service
const srsService = new SRSService(process.env.GEMINI_API_KEY);

/**
 * Create a new flashcard manually
 * POST /api/flashcards
 */
exports.createFlashcard = async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            front, 
            back, 
            hint, 
            explanation, 
            tags, 
            deck, 
            documentId 
        } = req.body;

        // Validation
        if (!front || !back) {
            return res.status(400).json({
                success: false,
                message: 'Front and back content are required'
            });
        }

        const flashcard = await Flashcard.create({
            user: userId,
            document: documentId || null,
            deck: deck || 'Default Deck',
            front: front.trim(),
            back: back.trim(),
            hint: hint?.trim() || null,
            explanation: explanation?.trim() || null,
            tags: tags || [],
            source: {
                type: 'manual'
            }
        });

        console.log(`✅ Flashcard created: ${flashcard._id}`);

        res.status(201).json({
            success: true,
            message: 'Flashcard created successfully',
            data: flashcard
        });

    } catch (error) {
        console.error('❌ Create flashcard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create flashcard',
            error: error.message
        });
    }
};

/**
 * Create multiple flashcards at once
 * POST /api/flashcards/bulk
 */
exports.createBulkFlashcards = async (req, res) => {
    try {
        const userId = req.user.id;
        const { flashcards, deck, documentId } = req.body;

        if (!Array.isArray(flashcards) || flashcards.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Flashcards array is required'
            });
        }

        // Prepare flashcards with user ownership
        const cardsToCreate = flashcards.map(card => ({
            user: userId,
            document: documentId || null,
            deck: deck || card.deck || 'Default Deck',
            front: card.front.trim(),
            back: card.back.trim(),
            hint: card.hint?.trim() || null,
            explanation: card.explanation?.trim() || null,
            tags: card.tags || [],
            source: card.source || { type: 'manual' }
        }));

        const createdCards = await Flashcard.insertMany(cardsToCreate);

        console.log(`✅ Bulk created ${createdCards.length} flashcards`);

        res.status(201).json({
            success: true,
            message: `${createdCards.length} flashcards created successfully`,
            data: {
                count: createdCards.length,
                flashcards: createdCards
            }
        });

    } catch (error) {
        console.error('❌ Bulk create error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create flashcards',
            error: error.message
        });
    }
};

/**
 * Generate flashcards from document using AI
 * POST /api/flashcards/generate
 */
exports.generateFlashcards = async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            documentId, 
            count = 10, 
            difficulty = 'medium',
            focusAreas = [],
            deck = 'AI Generated',
            autoSave = true,
            replaceExisting = true // By default, replace existing cards in the same deck for this document
        } = req.body;

        console.log(`🎯 Generating ${count} flashcards from document: ${documentId}`);

        // Get document content
        const document = await Document.findOne({ _id: documentId, user: userId });
        
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        const content = document.pdfMetadata?.extractedText;
        if (!content || content.length < 500) {
            return res.status(400).json({
                success: false,
                message: 'Document content is insufficient for flashcard generation'
            });
        }

        // Check for existing cards and optionally delete them
        if (replaceExisting && autoSave) {
            const deletedCount = await Flashcard.deleteMany({
                user: userId,
                document: documentId,
                deck: deck
            });
            if (deletedCount.deletedCount > 0) {
                console.log(`🗑️ Replaced ${deletedCount.deletedCount} existing flashcards in deck: ${deck}`);
            }
        }

        // Generate flashcards using AI
        const generatedCards = await srsService.generateFlashcardsFromContent(content, {
            count,
            difficulty,
            focusAreas,
            documentTitle: document.fileName
        });

        if (generatedCards.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Failed to generate flashcards from content'
            });
        }

        let savedCards = [];

        if (autoSave) {
            // Save generated cards to database
            const cardsToSave = generatedCards.map(card => ({
                user: userId,
                document: documentId,
                deck: deck,
                front: card.front,
                back: card.back,
                hint: card.hint,
                explanation: card.explanation,
                tags: card.tags,
                source: {
                    type: 'ai-generated',
                    context: document.fileName
                }
            }));

            savedCards = await Flashcard.insertMany(cardsToSave);
            console.log(`✅ Generated and saved ${savedCards.length} flashcards`);
        }

        res.status(201).json({
            success: true,
            message: `Generated ${generatedCards.length} flashcards${autoSave ? ' and saved to deck' : ''}`,
            data: {
                count: generatedCards.length,
                flashcards: autoSave ? savedCards : generatedCards,
                deck: deck,
                documentId: documentId
            }
        });

    } catch (error) {
        console.error('❌ Generate flashcards error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate flashcards',
            error: error.message
        });
    }
};

/**
 * Generate flashcards from document key points
 * POST /api/flashcards/generate-from-keypoints
 */
exports.generateFromKeyPoints = async (req, res) => {
    try {
        const userId = req.user.id;
        const { documentId, deck = 'Key Points' } = req.body;

        const document = await Document.findOne({ _id: documentId, user: userId });
        
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        if (!document.keyPoints || document.keyPoints.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No key points found in document. Please process the document first.'
            });
        }

        console.log(`🎯 Generating flashcards from ${document.keyPoints.length} key points`);

        const generatedCards = await srsService.generateFromKeyPoints(
            document.keyPoints,
            document.fileName
        );

        // Save cards
        const cardsToSave = generatedCards.map(card => ({
            user: userId,
            document: documentId,
            deck: deck,
            front: card.front,
            back: card.back,
            hint: card.hint,
            tags: card.tags,
            source: {
                type: 'ai-generated',
                context: 'Key Points'
            }
        }));

        const savedCards = await Flashcard.insertMany(cardsToSave);

        res.status(201).json({
            success: true,
            message: `Generated ${savedCards.length} flashcards from key points`,
            data: {
                count: savedCards.length,
                flashcards: savedCards
            }
        });

    } catch (error) {
        console.error('❌ Generate from key points error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate flashcards from key points',
            error: error.message
        });
    }
};

/**
 * Get all flashcards for user
 * GET /api/flashcards
 */
exports.getFlashcards = async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            deck, 
            documentId, 
            status, 
            tags,
            search,
            page = 1, 
            limit = 50,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = { user: userId, isArchived: false };
        
        if (deck) query.deck = deck;
        if (documentId) query.document = documentId;
        if (status) query.status = status;
        if (tags) query.tags = { $in: tags.split(',') };
        if (search) {
            query.$or = [
                { front: { $regex: search, $options: 'i' } },
                { back: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const [flashcards, total] = await Promise.all([
            Flashcard.find(query)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('document', 'fileName')
                .lean(),
            Flashcard.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data: {
                flashcards,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });

    } catch (error) {
        console.error('❌ Get flashcards error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get flashcards',
            error: error.message
        });
    }
};

/**
 * Get all decks for user
 * GET /api/flashcards/decks
 */
exports.getDecks = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const decks = await Flashcard.aggregate([
            { $match: { user: userId, isArchived: false } },
            { 
                $group: {
                    _id: '$deck',
                    count: { $sum: 1 },
                    // Due count: cards that are NOT new but have nextReviewDate <= now
                    dueCount: {
                        $sum: {
                            $cond: [
                                { 
                                    $and: [
                                        { $ne: ['$status', 'new'] },
                                        { $lte: ['$nextReviewDate', new Date()] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    // New count: cards that have never been reviewed
                    newCount: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'new'] }, 1, 0]
                        }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: decks.map(d => ({
                name: d._id,
                count: d.count,
                dueCount: d.dueCount,
                newCount: d.newCount
            }))
        });

    } catch (error) {
        console.error('❌ Get decks error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get decks',
            error: error.message
        });
    }
};

/**
 * Get cards due for review (study session)
 * GET /api/flashcards/due
 */
exports.getDueCards = async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            deck, 
            documentId, 
            limit = 50,
            includeNew = true 
        } = req.query;

        const dueCards = await srsService.getDueCards(userId, {
            deck,
            documentId,
            limit: parseInt(limit),
            includeNew: includeNew === 'true'
        });

        // Get optimal study order
        const orderedCards = srsService.getOptimalStudyOrder(dueCards);
        const recommendedTime = srsService.getRecommendedStudyTime(orderedCards);

        res.status(200).json({
            success: true,
            data: {
                cards: orderedCards,
                count: orderedCards.length,
                recommendedStudyTime: recommendedTime,
                message: orderedCards.length > 0 
                    ? `You have ${orderedCards.length} cards to review`
                    : 'No cards due for review! Great job!'
            }
        });

    } catch (error) {
        console.error('❌ Get due cards error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get due cards',
            error: error.message
        });
    }
};

/**
 * Submit review for a flashcard (SRS update)
 * POST /api/flashcards/:cardId/review
 */
exports.submitReview = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const { cardId } = req.params;
        const { quality, responseTime = 0 } = req.body;

        // Validate quality rating
        if (quality === undefined || quality < 0 || quality > 5) {
            return res.status(400).json({
                success: false,
                message: 'Quality rating must be between 0 and 5'
            });
        }

        const flashcard = await Flashcard.findOne({ _id: cardId, user: userId });

        if (!flashcard) {
            return res.status(404).json({
                success: false,
                message: 'Flashcard not found'
            });
        }

        // Calculate next review using SM-2 algorithm
        const reviewResult = srsService.calculateNextReview(flashcard, quality, responseTime);

        // Update flashcard with new SRS values
        flashcard.easeFactor = reviewResult.easeFactor;
        flashcard.interval = reviewResult.interval;
        flashcard.repetitions = reviewResult.repetitions;
        flashcard.lapses = reviewResult.lapses;
        flashcard.status = reviewResult.status;
        flashcard.maturityLevel = reviewResult.maturityLevel;
        flashcard.nextReviewDate = reviewResult.nextReviewDate;
        flashcard.lastReviewDate = new Date();

        // Update statistics
        flashcard.totalReviews += 1;
        if (reviewResult.isSuccess) {
            flashcard.correctCount += 1;
            flashcard.streak += 1;
            flashcard.longestStreak = Math.max(flashcard.longestStreak, flashcard.streak);
        } else {
            flashcard.incorrectCount += 1;
            flashcard.streak = 0;
        }

        // Update average response time
        if (responseTime > 0) {
            const totalTime = flashcard.averageResponseTime * (flashcard.totalReviews - 1) + responseTime;
            flashcard.averageResponseTime = Math.round(totalTime / flashcard.totalReviews);
        }

        // Add to review history (keep last 50)
        flashcard.reviewHistory.push({
            reviewedAt: new Date(),
            quality,
            responseTime,
            previousInterval: reviewResult.previousInterval,
            newInterval: reviewResult.interval,
            previousEaseFactor: reviewResult.previousEaseFactor,
            newEaseFactor: reviewResult.easeFactor
        });

        // Trim history to 50 entries
        if (flashcard.reviewHistory.length > 50) {
            flashcard.reviewHistory = flashcard.reviewHistory.slice(-50);
        }

        await flashcard.save();

        console.log(`✅ Review submitted: Card ${cardId}, Quality: ${quality}, Next: ${reviewResult.interval} days`);

        res.status(200).json({
            success: true,
            message: 'Review submitted successfully',
            data: {
                cardId: flashcard._id,
                quality,
                isSuccess: reviewResult.isSuccess,
                newInterval: reviewResult.interval,
                nextReviewDate: reviewResult.nextReviewDate,
                easeFactor: reviewResult.easeFactor,
                status: reviewResult.status,
                maturityLevel: reviewResult.maturityLevel,
                streak: flashcard.streak
            }
        });

    } catch (error) {
        console.error('❌ Submit review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit review',
            error: error.message
        });
    }
};

/**
 * Submit batch reviews (for offline sync)
 * POST /api/flashcards/reviews/batch
 */
exports.submitBatchReviews = async (req, res) => {
    try {
        const userId = req.user.id;
        const { reviews } = req.body;

        if (!Array.isArray(reviews) || reviews.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Reviews array is required'
            });
        }

        const results = [];
        const errors = [];

        for (const review of reviews) {
            try {
                const flashcard = await Flashcard.findOne({ 
                    _id: review.cardId, 
                    user: userId 
                });

                if (!flashcard) {
                    errors.push({ cardId: review.cardId, error: 'Card not found' });
                    continue;
                }

                const reviewResult = srsService.calculateNextReview(
                    flashcard, 
                    review.quality, 
                    review.responseTime || 0
                );

                // Update flashcard
                Object.assign(flashcard, {
                    easeFactor: reviewResult.easeFactor,
                    interval: reviewResult.interval,
                    repetitions: reviewResult.repetitions,
                    lapses: reviewResult.lapses,
                    status: reviewResult.status,
                    maturityLevel: reviewResult.maturityLevel,
                    nextReviewDate: reviewResult.nextReviewDate,
                    lastReviewDate: review.reviewedAt || new Date(),
                    totalReviews: flashcard.totalReviews + 1,
                    correctCount: flashcard.correctCount + (reviewResult.isSuccess ? 1 : 0),
                    incorrectCount: flashcard.incorrectCount + (reviewResult.isSuccess ? 0 : 1)
                });

                await flashcard.save();
                results.push({ cardId: review.cardId, success: true });

            } catch (err) {
                errors.push({ cardId: review.cardId, error: err.message });
            }
        }

        res.status(200).json({
            success: true,
            message: `Processed ${results.length} reviews`,
            data: {
                processed: results.length,
                errors: errors.length,
                results,
                errors
            }
        });

    } catch (error) {
        console.error('❌ Batch review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process batch reviews',
            error: error.message
        });
    }
};

/**
 * Get study statistics
 * GET /api/flashcards/stats
 */
exports.getStudyStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const { deck, documentId, days = 30 } = req.query;

        const stats = await srsService.getStudyStats(userId, {
            deck,
            documentId,
            days: parseInt(days)
        });

        res.status(200).json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('❌ Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get statistics',
            error: error.message
        });
    }
};

/**
 * Get review forecast
 * GET /api/flashcards/forecast
 */
exports.getReviewForecast = async (req, res) => {
    try {
        const userId = req.user.id;
        const { days = 14 } = req.query;

        const forecast = await srsService.getReviewForecast(userId, parseInt(days));

        res.status(200).json({
            success: true,
            data: forecast
        });

    } catch (error) {
        console.error('❌ Get forecast error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get review forecast',
            error: error.message
        });
    }
};

/**
 * Get single flashcard
 * GET /api/flashcards/:cardId
 */
exports.getFlashcard = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cardId } = req.params;

        const flashcard = await Flashcard.findOne({ _id: cardId, user: userId })
            .populate('document', 'fileName');

        if (!flashcard) {
            return res.status(404).json({
                success: false,
                message: 'Flashcard not found'
            });
        }

        res.status(200).json({
            success: true,
            data: flashcard
        });

    } catch (error) {
        console.error('❌ Get flashcard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get flashcard',
            error: error.message
        });
    }
};

/**
 * Update flashcard
 * PUT /api/flashcards/:cardId
 */
exports.updateFlashcard = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cardId } = req.params;
        const { front, back, hint, explanation, tags, deck } = req.body;

        const flashcard = await Flashcard.findOne({ _id: cardId, user: userId });

        if (!flashcard) {
            return res.status(404).json({
                success: false,
                message: 'Flashcard not found'
            });
        }

        // Update fields if provided
        if (front) flashcard.front = front.trim();
        if (back) flashcard.back = back.trim();
        if (hint !== undefined) flashcard.hint = hint?.trim() || null;
        if (explanation !== undefined) flashcard.explanation = explanation?.trim() || null;
        if (tags) flashcard.tags = tags;
        if (deck) flashcard.deck = deck;

        await flashcard.save();

        res.status(200).json({
            success: true,
            message: 'Flashcard updated successfully',
            data: flashcard
        });

    } catch (error) {
        console.error('❌ Update flashcard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update flashcard',
            error: error.message
        });
    }
};

/**
 * Delete flashcard
 * DELETE /api/flashcards/:cardId
 */
exports.deleteFlashcard = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cardId } = req.params;

        const result = await Flashcard.findOneAndDelete({ _id: cardId, user: userId });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Flashcard not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Flashcard deleted successfully'
        });

    } catch (error) {
        console.error('❌ Delete flashcard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete flashcard',
            error: error.message
        });
    }
};

/**
 * Archive/Unarchive flashcard
 * PATCH /api/flashcards/:cardId/archive
 */
exports.toggleArchive = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cardId } = req.params;
        const { archive = true } = req.body;

        const flashcard = await Flashcard.findOneAndUpdate(
            { _id: cardId, user: userId },
            { isArchived: archive },
            { new: true }
        );

        if (!flashcard) {
            return res.status(404).json({
                success: false,
                message: 'Flashcard not found'
            });
        }

        res.status(200).json({
            success: true,
            message: `Flashcard ${archive ? 'archived' : 'unarchived'} successfully`,
            data: flashcard
        });

    } catch (error) {
        console.error('❌ Archive flashcard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to archive flashcard',
            error: error.message
        });
    }
};

/**
 * Suspend/Unsuspend flashcard
 * PATCH /api/flashcards/:cardId/suspend
 */
exports.toggleSuspend = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cardId } = req.params;
        const { suspend = true } = req.body;

        const flashcard = await Flashcard.findOne({ _id: cardId, user: userId });

        if (!flashcard) {
            return res.status(404).json({
                success: false,
                message: 'Flashcard not found'
            });
        }

        flashcard.status = suspend ? 'suspended' : 'new';
        await flashcard.save();

        res.status(200).json({
            success: true,
            message: `Flashcard ${suspend ? 'suspended' : 'unsuspended'} successfully`,
            data: flashcard
        });

    } catch (error) {
        console.error('❌ Suspend flashcard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to suspend flashcard',
            error: error.message
        });
    }
};

/**
 * Reset flashcard progress
 * POST /api/flashcards/:cardId/reset
 */
exports.resetFlashcard = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cardId } = req.params;

        const flashcard = await Flashcard.findOne({ _id: cardId, user: userId });

        if (!flashcard) {
            return res.status(404).json({
                success: false,
                message: 'Flashcard not found'
            });
        }

        // Reset SRS values
        flashcard.easeFactor = 2.5;
        flashcard.interval = 0;
        flashcard.repetitions = 0;
        flashcard.lapses = 0;
        flashcard.status = 'new';
        flashcard.maturityLevel = 'new';
        flashcard.nextReviewDate = new Date();
        flashcard.lastReviewDate = null;
        flashcard.totalReviews = 0;
        flashcard.correctCount = 0;
        flashcard.incorrectCount = 0;
        flashcard.streak = 0;
        flashcard.reviewHistory = [];

        await flashcard.save();

        res.status(200).json({
            success: true,
            message: 'Flashcard progress reset successfully',
            data: flashcard
        });

    } catch (error) {
        console.error('❌ Reset flashcard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset flashcard',
            error: error.message
        });
    }
};

/**
 * Delete all cards in a deck
 * DELETE /api/flashcards/deck/:deckName
 */
exports.deleteDeck = async (req, res) => {
    try {
        const userId = req.user.id;
        const { deckName } = req.params;

        const result = await Flashcard.deleteMany({ 
            user: userId, 
            deck: deckName 
        });

        res.status(200).json({
            success: true,
            message: `Deleted ${result.deletedCount} cards from deck "${deckName}"`,
            data: { deletedCount: result.deletedCount }
        });

    } catch (error) {
        console.error('❌ Delete deck error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete deck',
            error: error.message
        });
    }
};

/**
 * Rename a deck
 * PATCH /api/flashcards/deck/:deckName/rename
 */
exports.renameDeck = async (req, res) => {
    try {
        const userId = req.user.id;
        const { deckName } = req.params;
        const { newName } = req.body;

        if (!newName) {
            return res.status(400).json({
                success: false,
                message: 'New deck name is required'
            });
        }

        const result = await Flashcard.updateMany(
            { user: userId, deck: deckName },
            { deck: newName }
        );

        res.status(200).json({
            success: true,
            message: `Renamed deck from "${deckName}" to "${newName}"`,
            data: { modifiedCount: result.modifiedCount }
        });

    } catch (error) {
        console.error('❌ Rename deck error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to rename deck',
            error: error.message
        });
    }
};

/**
 * Evaluate user answer with AI
 * POST /api/flashcards/evaluate-answer
 * 
 * Uses Gemini AI to check if user's answer is correct,
 * allowing for typos, grammar mistakes, and different wording
 */
exports.evaluateAnswer = async (req, res) => {
    try {
        const { userAnswer, correctAnswer, question } = req.body;

        if (!userAnswer || !correctAnswer || !question) {
            return res.status(400).json({
                success: false,
                message: 'userAnswer, correctAnswer, and question are required'
            });
        }

        const result = await srsService.evaluateAnswer(userAnswer, correctAnswer, question);

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('❌ Evaluate answer error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to evaluate answer',
            error: error.message
        });
    }
};
