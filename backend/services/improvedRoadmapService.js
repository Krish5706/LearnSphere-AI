/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PROFESSIONAL COURSERA-STYLE ROADMAP SERVICE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Generates comprehensive learning paths with:
 * - COURSE → PHASES → MODULES → LESSONS → TOPICS structure
 * - Full PDF content extraction and processing
 * - NO static/default fallbacks - all content from document
 * - Professional Coursera-like learning experience
 * - ⚡ GROQ FALLBACK: Automatically switches to Groq when Gemini quota exceeded
 * 
 * @author LearnSphere AI
 * @version 2.1.0
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const ImprovedGeminiPrompts = require('./improvedGeminiPrompts');

class ImprovedRoadmapService {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is required for roadmap generation');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        // Use gemini-1.5-flash as default - it's free and reliable
        // Valid models: gemini-1.5-flash, gemini-1.5-pro, gemini-2.0-flash
        this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
        this.model = this.genAI.getGenerativeModel({ model: this.modelName });
        
        // ⚡ Initialize Groq as fallback
        this.groqApiKey = process.env.GROQ_API_KEY;
        this.groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
        this.groqClient = this.groqApiKey ? new Groq({ apiKey: this.groqApiKey }) : null;
        this.useGroqFallback = false; // Will be set to true when Gemini quota exceeded
        
        // Configuration - ⚡ OPTIMIZED for faster generation
        this.config = {
            maxContentLength: 50000,   // Reduced for faster processing
            chunkSize: 15000,          // Smaller chunks = faster API calls
            timeoutMs: 60000,          // 60s timeout - faster failure detection
            maxRetries: 2,             // Reduced retries for speed
            batchPromptMaxChars: 15000, // Smaller context = faster response
            analysisMaxChars: 20000,   // Reduced for faster analysis
            modulesPerPhase: 2,        // Default modules per phase
            lessonsPerModule: 2,       // Reduced lessons per module for speed
            concurrency: 4             // Increased parallelization
        };
        // In-memory response cache: key=SHA256(prompt), value={response, timestamp}
        this.responseCache = new Map();
        this.cacheConfig = {
            enableCache: true,
            ttlMs: 3600000 // 1 hour cache TTL
        };
    }

    // ============================================================================
    // SCHEMA SANITIZATION - Fix data types for Mongoose compatibility
    // ============================================================================

    /**
     * ⚡ CRITICAL FIX: Sanitize roadmap data to match Mongoose schema
     * - Converts topicsCovered from array of objects to array of strings
     * - Converts introduction from {} to "" 
     * - Handles all nested phases/modules/lessons
     */
    sanitizeRoadmapForSchema(roadmap) {
        if (!roadmap) return roadmap;

        const sanitizeTopicsCovered = (topics) => {
            if (!Array.isArray(topics)) return [];
            return topics.map(topic => {
                if (typeof topic === 'string') return topic;
                if (typeof topic === 'object' && topic !== null) {
                    // Extract topicName or name from object
                    return topic.topicName || topic.name || topic.title || 
                           (typeof topic === 'object' ? JSON.stringify(topic).substring(0, 100) : String(topic));
                }
                return String(topic);
            }).filter(t => t && t.length > 0);
        };

        const sanitizeLesson = (lesson) => {
            if (!lesson) return lesson;
            return {
                ...lesson,
                // Convert introduction from object to string
                introduction: typeof lesson.introduction === 'string' 
                    ? lesson.introduction 
                    : (lesson.introduction && typeof lesson.introduction === 'object' && Object.keys(lesson.introduction).length > 0)
                        ? JSON.stringify(lesson.introduction)
                        : '',
                // Ensure other string fields are strings
                lessonContent: typeof lesson.lessonContent === 'string' 
                    ? lesson.lessonContent 
                    : (lesson.mainContent && typeof lesson.mainContent === 'string' ? lesson.mainContent : ''),
                summary: typeof lesson.summary === 'string' ? lesson.summary : '',
                // Ensure arrays are arrays of strings
                learningObjectives: Array.isArray(lesson.learningObjectives) 
                    ? lesson.learningObjectives.map(o => typeof o === 'string' ? o : String(o))
                    : [],
                keyPoints: Array.isArray(lesson.keyPoints)
                    ? lesson.keyPoints.map(k => typeof k === 'string' ? k : String(k))
                    : [],
                prerequisites: Array.isArray(lesson.prerequisites)
                    ? lesson.prerequisites.map(p => typeof p === 'string' ? p : String(p))
                    : [],
                resources: Array.isArray(lesson.resources)
                    ? lesson.resources.map(r => typeof r === 'string' ? r : String(r))
                    : [],
                commonMisconceptions: Array.isArray(lesson.commonMisconceptions)
                    ? lesson.commonMisconceptions.map(m => typeof m === 'string' ? m : String(m))
                    : []
            };
        };

        const sanitizeModule = (module) => {
            if (!module) return module;
            return {
                ...module,
                // Convert topicsCovered to array of strings
                topicsCovered: sanitizeTopicsCovered(module.topicsCovered),
                // Sanitize all lessons
                lessons: Array.isArray(module.lessons) 
                    ? module.lessons.map(sanitizeLesson)
                    : [],
                // Ensure estimatedTime/estimatedDuration are strings
                estimatedTime: typeof module.estimatedTime === 'string' 
                    ? module.estimatedTime 
                    : String(module.estimatedTime || module.estimatedMinutes ? `${module.estimatedMinutes} minutes` : '60 minutes'),
                estimatedDuration: typeof module.estimatedDuration === 'string'
                    ? module.estimatedDuration
                    : String(module.estimatedDuration || '')
            };
        };

        const sanitizePhase = (phase) => {
            if (!phase) return phase;
            return {
                ...phase,
                // Sanitize all modules
                modules: Array.isArray(phase.modules)
                    ? phase.modules.map(sanitizeModule)
                    : [],
                // Ensure string fields
                estimatedDuration: typeof phase.estimatedDuration === 'string'
                    ? phase.estimatedDuration
                    : String(phase.estimatedHours ? `${phase.estimatedHours} hours` : ''),
                completionCriteria: typeof phase.completionCriteria === 'string'
                    ? phase.completionCriteria
                    : '',
                summary: typeof phase.summary === 'string' ? phase.summary : ''
            };
        };

        // Sanitize both phases and learningPath arrays
        if (Array.isArray(roadmap.phases)) {
            roadmap.phases = roadmap.phases.map(sanitizePhase);
        }
        if (Array.isArray(roadmap.learningPath)) {
            roadmap.learningPath = roadmap.learningPath.map(sanitizePhase);
        }

        // Ensure subTopics is array of strings
        if (Array.isArray(roadmap.subTopics)) {
            roadmap.subTopics = roadmap.subTopics.map(t => 
                typeof t === 'string' ? t : (t?.name || t?.topicName || String(t))
            );
        }

        // ⚡ Ensure studyTimeline is properly formatted for Document model
        if (roadmap.studyTimeline) {
            roadmap.studyTimeline = {
                totalEstimatedHours: typeof roadmap.studyTimeline.totalEstimatedHours === 'number' 
                    ? roadmap.studyTimeline.totalEstimatedHours 
                    : parseInt(roadmap.studyTimeline.totalEstimatedHours) || 24,
                recommendedPacePerWeek: typeof roadmap.studyTimeline.recommendedPacePerWeek === 'string'
                    ? roadmap.studyTimeline.recommendedPacePerWeek
                    : '4-6 hours/week',
                phaseBreakdown: Array.isArray(roadmap.studyTimeline.phaseBreakdown)
                    ? roadmap.studyTimeline.phaseBreakdown.map(pb => ({
                        phase: String(pb.phase || pb.phaseName || 'Phase'),
                        hours: typeof pb.hours === 'number' ? pb.hours : parseInt(pb.hours) || 8,
                        percentage: typeof pb.percentage === 'number' ? pb.percentage : parseInt(pb.percentage) || 0
                    }))
                    : []
            };
        } else if (roadmap.phases && Array.isArray(roadmap.phases)) {
            // Generate default studyTimeline from phases if not provided
            const totalHours = roadmap.phases.reduce((sum, p) => sum + (p.estimatedHours || 8), 0);
            roadmap.studyTimeline = {
                totalEstimatedHours: totalHours,
                recommendedPacePerWeek: '4-6 hours/week',
                phaseBreakdown: roadmap.phases.map((p, idx) => {
                    const hours = p.estimatedHours || Math.ceil(totalHours / roadmap.phases.length);
                    return {
                        phase: p.phaseName || `Phase ${idx + 1}`,
                        hours: hours,
                        percentage: Math.round((hours / totalHours) * 100)
                    };
                })
            };
        }

        // ⚡ Ensure learningOutcomes is properly formatted (array of objects with outcome and description)
        if (Array.isArray(roadmap.learningOutcomes)) {
            roadmap.learningOutcomes = roadmap.learningOutcomes.map(outcome => {
                if (typeof outcome === 'string') {
                    // Convert plain string to proper format
                    return {
                        outcome: outcome,
                        description: 'Key learning objective for this course'
                    };
                }
                return {
                    outcome: typeof outcome.outcome === 'string' ? outcome.outcome : String(outcome),
                    description: typeof outcome.description === 'string' ? outcome.description : String(outcome.description || outcome)
                };
            });
        } else {
            // Ensure learningOutcomes is always an array
            roadmap.learningOutcomes = [];
        }

        console.log('✅ Roadmap sanitized for schema compatibility');
        return roadmap;
    }

    /**
     * ⚡ Generate study timeline with phase breakdown for proper frontend display
     * Converts phase data into the format expected by the Document model
     * @param {Array} phases - Array of phase objects with estimatedHours
     * @param {Object} statistics - Statistics object with estimatedTotalHours
     * @returns {Object} studyTimeline in proper format for Document model
     */
    generateStudyTimeline(phases, statistics) {
        const totalHours = statistics.estimatedTotalHours || 24;
        
        // Calculate phase breakdown with hours and percentages
        const phaseBreakdown = phases.map(phase => {
            const phaseHours = phase.estimatedHours || (totalHours / phases.length);
            const percentage = Math.round((phaseHours / totalHours) * 100);
            
            return {
                phase: phase.phaseName || `Phase ${phase.phaseNumber}`,
                hours: Math.ceil(phaseHours),
                percentage: percentage
            };
        });
        
        // Ensure percentages add up to 100
        const totalPercentage = phaseBreakdown.reduce((sum, pb) => sum + pb.percentage, 0);
        if (totalPercentage !== 100 && phaseBreakdown.length > 0) {
            const diff = 100 - totalPercentage;
            phaseBreakdown[phaseBreakdown.length - 1].percentage += diff;
        }
        
        // Determine recommended pace based on learner level and total hours
        const recommendedPacePerWeek = totalHours <= 20 
            ? '4-6 hours/week' 
            : totalHours <= 40 
            ? '6-8 hours/week' 
            : '8-10 hours/week';
        
        return {
            totalEstimatedHours: Math.ceil(totalHours),
            recommendedPacePerWeek: recommendedPacePerWeek,
            phaseBreakdown: phaseBreakdown
        };
    }

    // ============================================================================
    // CONTENT PREPROCESSING
    // ============================================================================

    /**
     * Preprocess and prepare PDF content for AI processing
     * Extracts full content without truncating important information
     */
    preprocessContent(content) {
        const fullContent = content.trim();
        const words = fullContent.split(/\s+/).filter(w => w.length > 0);
        const paragraphs = fullContent.split(/\n\n+/).filter(p => p.trim().length > 0);
        const sections = this.extractDocumentSections(fullContent);
        
        return {
            full: fullContent,
            // For large documents, create a summary sample but keep full content available
            sample: fullContent.length > this.config.maxContentLength 
                ? this.createSmartSample(fullContent) 
                : fullContent,
            sections: sections,
            chapters: this.identifyChapters(fullContent),
            statistics: {
                totalCharacters: fullContent.length,
                totalWords: words.length,
                totalParagraphs: paragraphs.length,
                totalSections: sections.length,
                estimatedReadingTime: Math.ceil(words.length / 200) + ' minutes'
            }
        };
    }

    /**
     * Create intelligent sample from large documents
     * Ensures beginning, middle, and end are represented
     */
    createSmartSample(content) {
        const maxLength = this.config.maxContentLength;
        if (content.length <= maxLength) return content;
        
        const partSize = Math.floor(maxLength / 3);
        const beginning = content.substring(0, partSize);
        const middle = content.substring(
            Math.floor(content.length / 2) - partSize / 2,
            Math.floor(content.length / 2) + partSize / 2
        );
        const end = content.substring(content.length - partSize);
        
        return `${beginning}\n\n[... Document continues ...]\n\n${middle}\n\n[... Document continues ...]\n\n${end}`;
    }

    /**
     * Extract document sections based on formatting
     */
    extractDocumentSections(content) {
        const sections = [];
        const lines = content.split('\n');
        let currentSection = { title: '', content: '' };
        
        const headerPatterns = [
            /^#{1,6}\s+(.+)$/,                    // Markdown headers
            /^(Chapter|Section|Unit|Part)\s+\d+/i, // Chapter/Section headers
            /^(\d+\.)+\s+(.+)$/,                  // Numbered sections
            /^[A-Z][A-Z\s]{5,}$/                  // ALL CAPS headers
        ];
        
        lines.forEach((line, idx) => {
            const isHeader = headerPatterns.some(pattern => pattern.test(line.trim()));
            
            if (isHeader && currentSection.content.length > 100) {
                sections.push({ ...currentSection });
                currentSection = { title: line.trim(), content: '' };
            } else {
                currentSection.content += line + '\n';
            }
        });
        
        if (currentSection.content.length > 100) {
            sections.push(currentSection);
        }
        
        return sections;
    }

    /**
     * Identify chapters in the document
     */
    identifyChapters(content) {
        const chapters = [];
        const chapterPattern = /(?:^|\n)(Chapter|Section|Unit|Part|Module)\s*(\d+)[:\s]*([^\n]*)/gi;
        let match;
        
        while ((match = chapterPattern.exec(content)) !== null) {
            chapters.push({
                type: match[1],
                number: match[2],
                title: match[3].trim(),
                position: match.index
            });
        }
        
        return chapters;
    }

    // ============================================================================
    // STEP 1: COURSE ANALYSIS
    // ============================================================================

    /**
     * Perform deep analysis of the document
     * Returns comprehensive course structure
     */
    async performCourseAnalysis(content) {
        console.log('\n📊 STEP 1: Deep Course Analysis');
        console.log('═'.repeat(50));
        
        try {
            // ⚡ Cap content to avoid timeout on large documents
            const cappedContent = this.capContent(content, this.config.analysisMaxChars);
            console.log(`   📄 Content size: ${content.length} chars (capped to ${cappedContent.length} for analysis)`);
            const prompt = ImprovedGeminiPrompts.getCourseAnalysisPrompt(cappedContent);
            const response = await this.callGeminiAPI(prompt, 'Course Analysis');
            
            const analysis = this.tryParseOrFallback(response, 'Course Analysis', null);
            
            if (analysis && analysis.courseTitle) {
                console.log(`   ✅ Course: "${analysis.courseTitle}"`);
                console.log(`   ✅ Chapters Found: ${analysis.chapters?.length || 0}`);
                console.log(`   ✅ Target Audience: ${analysis.targetAudience?.inferredLevel || 'Not specified'}`);
                return analysis;
            }
            
            throw new Error('Course analysis returned incomplete data');
        } catch (error) {
            console.error(`   ❌ Course Analysis Error: ${error.message}`);
            throw new Error(`Failed to analyze document: ${error.message}. Please ensure the PDF contains readable educational content.`);
        }
    }

    /**
     * Extract main topic (simplified analysis for smaller documents)
     */
    async extractMainTopic(content) {
        console.log('\n📌 Extracting Main Topic...');
        
        try {
            const prompt = ImprovedGeminiPrompts.getMainTopicPrompt(content);
            const response = await this.callGeminiAPI(prompt, 'Main Topic Extraction');
            
            const topicData = this.tryParseOrFallback(response, 'Main Topic Extraction', null);
            
            if (topicData && topicData.mainTopic) {
                console.log(`   ✅ Main Topic: "${topicData.mainTopic}"`);
                console.log(`   ✅ Content Type: ${topicData.contentType || 'educational'}`);
                return topicData;
            }
            
            throw new Error('Could not extract main topic from document');
        } catch (error) {
            console.error(`   ❌ Topic Extraction Error: ${error.message}`);
            throw new Error(`Failed to extract topic: ${error.message}`);
        }
    }

    // ============================================================================
    // STEP 2: PHASE GENERATION
    // ============================================================================

    /**
     * Generate learning phases based on course analysis
     */
    async generatePhases(courseAnalysis, content, numPhases = 3) {
        console.log(`\n📚 STEP 2: Generating ${numPhases} Learning Phases`);
        console.log('═'.repeat(50));
        
        try {
            // ⚡ Cap content to avoid timeout on large documents
            const cappedContent = this.capContent(content, this.config.analysisMaxChars);
            console.log(`   📄 Content size: ${content.length} chars (capped to ${cappedContent.length} for phase generation)`);
            const prompt = ImprovedGeminiPrompts.generatePhasesPrompt(courseAnalysis, cappedContent, numPhases);
            const response = await this.callGeminiAPI(prompt, 'Phase Generation');
            
            const phasesData = this.tryParseOrFallback(response, 'Phase Generation', { phases: [] });
            
            if (phasesData && phasesData.phases && phasesData.phases.length > 0) {
                phasesData.phases.forEach((phase, idx) => {
                    console.log(`   ✅ Phase ${idx + 1}: ${phase.phaseName}`);
                    console.log(`      - Objectives: ${phase.learningOutcomes?.length || 0}`);
                    console.log(`      - Estimated Hours: ${phase.estimatedHours || 'TBD'}`);
                });
                return phasesData;
            }
            
            throw new Error('Phase generation returned incomplete data');
        } catch (error) {
            console.error(`   ❌ Phase Generation Error: ${error.message}`);
            throw new Error(`Failed to generate learning phases: ${error.message}`);
        }
    }

    // ============================================================================
    // STEP 3: MODULE GENERATION
    // ============================================================================

    /**
     * Generate modules for a specific phase
     */
    async generateModulesForPhase(phaseData, content, moduleCount = 2) {
        console.log(`\n   📦 Generating ${moduleCount} Modules for: ${phaseData.phaseName}`);
        
        try {
            // Get relevant content for this phase
            const relevantContent = this.getRelevantContentForPhase(phaseData, content);
            
            const prompt = ImprovedGeminiPrompts.generateModulesPrompt(phaseData, relevantContent, moduleCount);
            const response = await this.callGeminiAPI(prompt, `Modules for Phase ${phaseData.phaseNumber}`);
            
            const modulesData = this.tryParseOrFallback(response, `Modules for Phase ${phaseData.phaseNumber}`, { modules: [] });
            
            if (modulesData && modulesData.modules && modulesData.modules.length > 0) {
                modulesData.modules.forEach((mod, idx) => {
                    console.log(`      ✅ Module ${idx + 1}: ${mod.moduleName}`);
                });
                return modulesData.modules;
            }
            
            throw new Error('Module generation returned incomplete data');
        } catch (error) {
            console.error(`      ❌ Module Generation Error: ${error.message}`);
            throw new Error(`Failed to generate modules: ${error.message}`);
        }
    }

    // ============================================================================
    // STEP 4B: BATCHED MODULE+LESSON+QUIZ+OUTCOMES GENERATION (OPTIMIZED)
    // ============================================================================

    /**
     * ⚡ MASSIVELY FASTER: Generate lessons + quiz + outcomes for a module in ONE API call
     * Combines what previously took 4 separate calls into 1 structured batch request
     */
    async generateModuleBatchContent(moduleData, phaseData, content) {
        const moduleName = moduleData.moduleName;
        console.log(`\n      ⚡ Batch-generating lessons+quiz+outcomes for: ${moduleName}`);
        
        try {
            // ⚡ Cap content to token budget
            const cappedContent = this.capContent(content);
            
            // Build batch prompt: request all 3 outputs in one JSON response
            const batchPrompt = `You are an expert educational content designer. Generate structured educational content ONLY as valid JSON.

**Phase:** ${phaseData.phaseName}
**Module:** ${moduleName}
**Duration:** ${moduleData.estimatedMinutes || 180} minutes
**Difficulty:** ${phaseData.difficulty || 'intermediate'}

**PDF Context (first ${cappedContent.length} chars):**
${cappedContent}

**TASK: Generate lessons, outcomes, and quiz in ONE structured JSON response.**

Return ONLY this JSON structure (no explanations, no markdown, valid JSON only):
{
  "lessons": [
    {
      "lessonTitle": "...",
      "lessonDuration": "...",
      "learningObjectives": ["objective 1", "objective 2"],
      "mainContent": "concise 2-3 sentence explanation",
      "keyPoints": ["point 1", "point 2"],
      "examples": ["example 1"],
      "summary": "concise recap"
    }
  ],
  "learningOutcomes": ["outcome 1", "outcome 2"],
  "quiz": {
    "quizTitle": "Module Quiz",
    "questions": [
      {
        "question": "...?",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": "A"
      }
    ],
    "passingScore": 70
  }
}`;

            const response = await this.callGeminiAPI(batchPrompt, `Batch content for ${moduleName}`);
            const batchData = this.tryParseOrFallback(response, `Batch for ${moduleName}`, { 
                lessons: [], 
                learningOutcomes: [], 
                quiz: { questions: [], passingScore: 70 } 
            });

            const lessons = (batchData && batchData.lessons) || [];
            const outcomes = (batchData && batchData.learningOutcomes) || [];
            const quiz = (batchData && batchData.quiz) || { questions: [], passingScore: 70 };

            if (lessons.length > 0) {
                console.log(`         ✅ Generated ${lessons.length} lessons, ${outcomes.length} outcomes, ${quiz.questions?.length || 0} quiz q's`);
            }

            return { lessons, outcomes, quiz };
        } catch (error) {
            console.error(`         ❌ Batch generation failed: ${error.message}`);
            return { lessons: [], outcomes: [], quiz: { questions: [], passingScore: 70 } };
        }
    }

    /**
     * ⚡ Enrich a module with lessons, quiz, and outcomes using batched generation
     * This is called in parallel (mapWithConcurrency) for speed
     */
    async enrichModuleWithBatchContent(moduleData, phaseData, content) {
        console.log(`\n   📦 Processing Module: ${moduleData.moduleName}`);
        
        // ⚡ Batch-generate lessons + quiz + outcomes in ONE call
        const batchContent = await this.generateModuleBatchContent(moduleData, phaseData, content);
        const lessons = batchContent.lessons || [];
        const outcomes = batchContent.outcomes || [];
        const quiz = batchContent.quiz || { questions: [], passingScore: 70 };

        // Build enriched module structure
        return {
            moduleId: moduleData.moduleId,
            moduleNumber: moduleData.moduleNumber,
            moduleName: moduleData.moduleName,
            moduleDescription: moduleData.moduleDescription,
            estimatedMinutes: moduleData.estimatedMinutes || 180,
            difficulty: phaseData.difficulty || 'intermediate',
            topicsCovered: moduleData.topicsCovered || [],
            learningObjectives: moduleData.learningObjectives || [],
            // Actionable steps for learners for this module
            actionSteps: moduleData.actionSteps || (moduleData.learningObjectives || []).map((lo, idx) => ({
                stepId: `step_${moduleData.moduleId || moduleData.moduleNumber}_${idx + 1}`,
                description: typeof lo === 'string' ? lo : (lo.description || lo),
                expectedDurationMinutes: 30
            })),
            // Explicit dependency list (module ids or names)
            dependencies: moduleData.dependencies || [],
            lessons: lessons.map((lesson, idx) => ({
                // Use moduleId to ensure unique lessonId across all modules
                lessonId: lesson.lessonId || `les_${moduleData.moduleId || moduleData.moduleNumber}_${idx + 1}`,
                lessonNumber: lesson.lessonNumber || idx + 1,
                lessonTitle: lesson.lessonTitle,
                lessonDuration: lesson.lessonDuration || '20 minutes',
                lessonType: lesson.lessonType || 'concept',
                // ⚡ FIX: Ensure introduction is always a string, not an object
                introduction: typeof lesson.introduction === 'string' ? lesson.introduction : '',
                learningObjectives: lesson.learningObjectives || [],
                // ⚡ FIX: Convert mainContent to string if object
                mainContent: typeof lesson.mainContent === 'string' ? lesson.mainContent : 
                    (typeof lesson.mainContent === 'object' ? JSON.stringify(lesson.mainContent) : ''),
                lessonContent: typeof lesson.lessonContent === 'string' ? lesson.lessonContent :
                    (typeof lesson.mainContent === 'string' ? lesson.mainContent : ''),
                examples: lesson.examples || [],
                keyPoints: lesson.keyPoints || [],
                terminology: lesson.terminology || [],
                practiceActivity: lesson.practiceActivity || {},
                summary: typeof lesson.summary === 'string' ? lesson.summary : '',
                commonMisconceptions: lesson.commonMisconceptions || []
            })),
            assessment: {
                type: 'quiz',
                quizTitle: quiz.quizTitle || `${moduleData.moduleName} Quiz`,
                questions: quiz.questions || [],
                passingScore: quiz.passingScore || 70,
                timeLimit: quiz.timeLimit || '15 minutes'
            },
            learningOutcomes: outcomes,
            // Measurable outcomes for this module (KPI placeholders)
            measurableOutcomes: (outcomes || []).map((o, i) => ({
                id: `mo_${moduleData.moduleId || moduleData.moduleNumber}_${i + 1}`,
                description: typeof o === 'string' ? o : (o.description || o),
                metric: 'comprehension_score',
                target: 0.8
            })),
            skillsGained: moduleData.skillsGained || []
        };
    }

    async generateLessonsForModule(moduleData, content) {
        const lessonCount = moduleData.lessonsCount || this.config.lessonsPerModule;
        console.log(`\n      📝 Generating ${lessonCount} Lessons for: ${moduleData.moduleName}`);
        
        try {
            // Get relevant content for this module
            const relevantContent = this.getRelevantContentForModule(moduleData, content);
            
            const prompt = ImprovedGeminiPrompts.generateLessonsPrompt(moduleData, relevantContent);
            const response = await this.callGeminiAPI(prompt, `Lessons for ${moduleData.moduleName}`);
            
            const lessonsData = this.tryParseOrFallback(response, `Lessons for ${moduleData.moduleName}`, { lessons: [] });
            
            if (lessonsData && lessonsData.lessons && lessonsData.lessons.length > 0) {
                lessonsData.lessons.forEach((lesson, idx) => {
                    console.log(`         ✅ Lesson ${idx + 1}: ${lesson.lessonTitle}`);
                });
                return lessonsData.lessons;
            }
            
            throw new Error('Lesson generation returned incomplete data');
        } catch (error) {
            console.error(`         ❌ Lesson Generation Error: ${error.message}`);
            throw new Error(`Failed to generate lessons: ${error.message}`);
        }
    }

    // ============================================================================
    // STEP 5: ASSESSMENT GENERATION
    // ============================================================================

    /**
     * Generate quiz for a module
     */
    async generateModuleQuiz(moduleData, lessonsData, content) {
        console.log(`      📋 Generating Quiz for: ${moduleData.moduleName}`);
        
        try {
            const relevantContent = this.getRelevantContentForModule(moduleData, content);
            
            const prompt = ImprovedGeminiPrompts.generateModuleQuizPrompt(
                moduleData, 
                lessonsData, 
                relevantContent
            );
            const response = await this.callGeminiAPI(prompt, `Quiz for ${moduleData.moduleName}`);
            
            const quizData = this.tryParseOrFallback(response, `Quiz for ${moduleData.moduleName}`, { questions: [], passingScore: 70 });
            
            if (quizData && quizData.questions && quizData.questions.length > 0) {
                console.log(`         ✅ Generated ${quizData.questions.length} questions`);
                return quizData;
            }
            
            throw new Error('Quiz generation returned no questions');
        } catch (error) {
            console.error(`         ❌ Quiz Generation Error: ${error.message}`);
            throw new Error(`Failed to generate quiz: ${error.message}`);
        }
    }

    /**
     * Generate learning outcomes for a module
     */
    async generateLearningOutcomes(moduleTopics, content) {
        console.log(`      🎯 Generating Learning Outcomes...`);
        
        try {
            const topicsList = Array.isArray(moduleTopics) ? moduleTopics : [moduleTopics];
            const prompt = ImprovedGeminiPrompts.generateModuleOutcomesPrompt(topicsList, content);
            const response = await this.callGeminiAPI(prompt, 'Learning Outcomes');
            
            const outcomes = this.tryParseOrFallback(response, 'Learning Outcomes', { outcomes: [] });
            
            if (outcomes) {
                const outcomeList = outcomes.outcomes || outcomes;
                console.log(`         ✅ Generated ${Array.isArray(outcomeList) ? outcomeList.length : 0} outcomes`);
                return outcomeList;
            }
            
            throw new Error('Learning outcomes generation failed');
        } catch (error) {
            console.error(`         ❌ Outcomes Error: ${error.message}`);
            throw new Error(`Failed to generate learning outcomes: ${error.message}`);
        }
    }

    /**
     * ⚡ Generate comprehensive learning outcomes for entire course from PDF content
     * Extracts main outcomes that learners will achieve after completing the course
     * @param {string} courseTitle - Title of the course
     * @param {Array} phases - All phases in the roadmap
     * @param {string} content - PDF content to extract outcomes from
     * @returns {Promise<Array>} Array of learning outcomes with outcome and description
     */
    async generateCourseOutcomes(courseTitle, phases, content) {
        console.log('\n🎯 Generating Course-Level Learning Outcomes...');
        
        try {
            // Get phase objectives and topics as context
            const phaseContext = phases.map(p => ({
                phase: p.phaseName,
                objective: p.phaseObjective,
                topics: p.learningOutcomes || []
            })).map(p => `Phase: ${p.phase} - Objective: ${p.objective}`).join('\n');
            
            // Cap content for token efficiency
            const cappedContent = this.capContent(content);
            
            const prompt = `You are an expert curriculum designer. Generate 5-7 comprehensive learning outcomes for a course titled "${courseTitle}".

These outcomes should represent what learners will be able to do after completing ALL phases of this course.

**Phase Context:**
${phaseContext}

**Course Content Sample:**
${cappedContent}

Return ONLY this valid JSON (no explanations, no markdown):
{
  "outcomes": [
    {
      "outcome": "Active verb (e.g., Understand, Apply, Analyze, Create) + specific skill/knowledge",
      "description": "Concrete explanation of what learners can do or understand"
    }
  ]
}

Important:
- Start outcomes with action verbs (Bloom's taxonomy): Understand, Apply, Analyze, Evaluate, Create
- Each outcome must be specific and measurable
- Descriptions should be 1-2 sentences
- No generic outcomes like "Learn the material"
- Focus on real, practical competencies`;

            const response = await this.callGeminiAPI(prompt, 'Course-Level Learning Outcomes');
            const outcomes = this.tryParseOrFallback(response, 'Course Learning Outcomes', { outcomes: [] });
            
            if (outcomes && Array.isArray(outcomes.outcomes) && outcomes.outcomes.length > 0) {
                const formatted = outcomes.outcomes.slice(0, 7).map((o, idx) => ({
                    id: `outcome_${idx + 1}`,
                    outcome: typeof o.outcome === 'string' ? o.outcome : String(o.outcome || `Learning Outcome ${idx + 1}`),
                    description: typeof o.description === 'string' ? o.description : String(o.description || 'Key learning objective for this course')
                }));
                
                console.log(`   ✅ Generated ${formatted.length} course-level learning outcomes`);
                formatted.forEach((o, idx) => {
                    console.log(`      ${idx + 1}. ${o.outcome.substring(0, 60)}...`);
                });
                
                return formatted;
            }
            
            console.warn('   ⚠️ No outcomes generated, using fallback');
            return this.generateFallbackOutcomes(courseTitle, phases);
            
        } catch (error) {
            console.error(`   ⚠️ Course outcomes generation failed: ${error.message}`);
            return this.generateFallbackOutcomes(courseTitle, phases);
        }
    }

    /**
     * Generate fallback learning outcomes based on phases
     * Used when API fails or returns empty results
     */
    generateFallbackOutcomes(courseTitle, phases) {
        const baseOutcomes = [
            {
                id: 'outcome_1',
                outcome: `Master the Fundamentals of ${courseTitle}`,
                description: `Develop a strong foundational understanding of core concepts and principles. Learn terminology and foundational theories that underpin the subject matter.`
            },
            {
                id: 'outcome_2',
                outcome: `Apply Knowledge to Practical Scenarios`,
                description: `Use learned concepts to solve real-world problems and complete practical tasks. Demonstrate ability to apply theoretical knowledge in practical settings.`
            },
            {
                id: 'outcome_3',
                outcome: `Analyze Complex Topics and Make Informed Decisions`,
                description: `Break down complex topics into components, analyze relationships, and use this understanding to make informed decisions and recommendations.`
            }
        ];

        // Add phase-specific outcomes based on phase objectives
        if (phases.length > 0) {
            phases.forEach((phase, idx) => {
                if (phase.phaseObjective) {
                    baseOutcomes.push({
                        id: `outcome_${baseOutcomes.length + 1}`,
                        outcome: `${phase.phaseName} Competency`,
                        description: phase.phaseObjective.substring(0, 150) + (phase.phaseObjective.length > 150 ? '...' : '')
                    });
                }
            });
        }

        return baseOutcomes.slice(0, 7);
    }

    // ============================================================================
    // CONTENT EXTRACTION HELPERS
    // ============================================================================

    // Escape user-provided text for safe use in RegExp constructors
    escapeForRegex(text) {
        if (typeof text !== 'string') return '';
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // ⚡ Cap content to N characters for batched prompts (token optimization)
    capContent(content, maxChars = this.config.batchPromptMaxChars) {
        if (!content || content.length <= maxChars) return content;
        // Return first maxChars characters, truncate at sentence boundary to avoid mid-word cuts
        const truncated = content.substring(0, maxChars);
        const lastPeriod = truncated.lastIndexOf('.');
        return lastPeriod > 0 ? truncated.substring(0, lastPeriod + 1) : truncated;
    }

    // ⚡ Concurrency helper: run N items with up to M concurrent tasks
    async mapWithConcurrency(items, asyncFn, concurrency = this.config.concurrency) {
        if (!items || items.length === 0) return [];
        const results = new Array(items.length);
        const executing = [];

        for (let i = 0; i < items.length; i++) {
            const promise = Promise.resolve(items[i]).then(item => asyncFn(item, i))
                .then(result => { results[i] = result; });
            executing.push(promise);

            if (executing.length >= concurrency) {
                await Promise.race(executing);
                // Remove settled promises
                executing.splice(0, executing.findIndex(p => !p.settled));
                executing.length = executing.filter((p, idx) => {
                    try { p.settled; return true; } catch { return false; }
                }).length;
            }
        }

        await Promise.all(executing);
        return results;
    }

    // ⚡ Simple prompt hash cache: avoid re-requesting identical prompts
    getPromptHash(prompt) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(prompt).digest('hex');
    }

    getCachedResponse(prompt) {
        if (!this.cacheConfig.enableCache) return null;
        const hash = this.getPromptHash(prompt);
        const cached = this.responseCache.get(hash);
        if (cached && Date.now() - cached.timestamp < this.cacheConfig.ttlMs) {
            console.log('   💾 Cache hit');
            return cached.response;
        }
        return null;
    }

    setCachedResponse(prompt, response) {
        if (!this.cacheConfig.enableCache) return;
        const hash = this.getPromptHash(prompt);
        this.responseCache.set(hash, { response, timestamp: Date.now() });
    }

    /**
     * Get relevant content for a specific phase
     */
    getRelevantContentForPhase(phaseData, fullContent) {
        const chaptersIncluded = phaseData.chaptersIncluded || [];
        
        if (chaptersIncluded.length === 0) {
            // Divide content by phase number
            const phaseNum = phaseData.phaseNumber || 1;
            const totalPhases = 3;
            const chunkSize = Math.floor(fullContent.length / totalPhases);
            const start = (phaseNum - 1) * chunkSize;
            const end = phaseNum === totalPhases ? fullContent.length : phaseNum * chunkSize;
            return fullContent.substring(start, end);
        }
        
        // Try to find chapter content
        let relevantContent = '';
        chaptersIncluded.forEach(chapter => {
            const chapterRef = typeof chapter === 'string' ? chapter : chapter.chapterRef;
            const pattern = new RegExp(`${chapterRef}[\\s\\S]*?(?=Chapter|Section|$)`, 'i');
            const match = fullContent.match(pattern);
            if (match) {
                relevantContent += match[0] + '\n\n';
            }
        });
        
        return relevantContent.length > 500 ? relevantContent : fullContent.substring(0, this.config.chunkSize);
    }

    /**
     * Get relevant content for a specific module
     */
    getRelevantContentForModule(moduleData, fullContent) {
        const topics = moduleData.topicsCovered || [];
        const sections = moduleData.documentSections || [];
        
        let relevantContent = '';
        
        // Search for topic-related content
        topics.forEach(topic => {
            const topicName = typeof topic === 'string' ? topic : topic.topicName;
            const keywords = topicName.split(' ').filter(w => w.length > 3);
            
            keywords.forEach(keyword => {
                const safe = this.escapeForRegex(keyword);
                const pattern = new RegExp(`[^.]*${safe}[^.]*\\.`, 'gi');
                const matches = fullContent.match(pattern);
                if (matches) {
                    relevantContent += matches.slice(0, 5).join(' ') + '\n\n';
                }
            });
        });
        
        // If not enough content found, use section references
        if (relevantContent.length < 1000) {
            sections.forEach(section => {
                const sectionRef = typeof section === 'string' ? section : section.sectionRef;
                const startIdx = fullContent.indexOf(sectionRef);
                if (startIdx !== -1) {
                    relevantContent += fullContent.substring(startIdx, startIdx + 3000) + '\n\n';
                }
            });
        }
        
        return relevantContent.length > 500 ? relevantContent : fullContent.substring(0, this.config.chunkSize);
    }

    // ============================================================================
    // API COMMUNICATION
    // ============================================================================

    /**
     * Call Gemini API with timeout, retry logic, error handling, and caching
     * ⚡ MUCH FASTER: caches responses by prompt hash to avoid re-requesting identical prompts
     * ⚡ GROQ FALLBACK: Automatically switches to Groq when Gemini quota exceeded
     */
    async callGeminiAPI(prompt, operationName = 'API Call') {
        // ⚡ Check cache first
        const cached = this.getCachedResponse(prompt);
        if (cached) return cached;

        // ⚡ If Gemini quota exceeded, use Groq directly
        if (this.useGroqFallback) {
            return this.callGroqAPI(prompt, operationName);
        }

        let lastError = null;
        const startTime = Date.now();
        
        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                console.log(`   ⏱️  ${operationName} [Gemini] (attempt ${attempt}/${this.config.maxRetries})...`);
                
                const response = await Promise.race([
                    this.model.generateContent(prompt),
                    new Promise((_, reject) =>
                        setTimeout(
                            () => reject(new Error(`Timeout after ${this.config.timeoutMs}ms`)), 
                            this.config.timeoutMs
                        )
                    )
                ]);
                
                const text = response.response.text().trim();
                
                if (!text || text.length === 0) {
                    throw new Error('Empty response from API');
                }
                
                const elapsed = Date.now() - startTime;
                console.log(`   ✅ ${operationName} completed (${text.length} chars, ${elapsed}ms)`);
                
                // ⚡ Cache the response
                this.setCachedResponse(prompt, text);
                
                return text;
                
            } catch (error) {
                lastError = error;
                console.error(`   ⚠️  ${operationName} failed: ${error.message}`);
                
                // Handle rate limiting / quota exceeded - FALLBACK TO GROQ
                if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('Quota')) {
                    console.log(`   🔄 Gemini quota exceeded, switching to Groq fallback...`);
                    
                    if (this.groqClient) {
                        this.useGroqFallback = true;
                        return this.callGroqAPI(prompt, operationName);
                    } else {
                        throw new Error('QUOTA_EXCEEDED: Daily Gemini API limit reached and no Groq API key configured. Please add GROQ_API_KEY to .env or try again tomorrow.');
                    }
                }
                
                // Handle auth errors
                if (error.message.includes('API key') || error.message.includes('401')) {
                    throw new Error('INVALID_API_KEY: Please check your GEMINI_API_KEY configuration.');
                }
                
                // Retry with backoff for other errors
                if (attempt < this.config.maxRetries) {
                    const backoffTime = Math.pow(2, attempt) * 2000;
                    console.log(`   ⏳ Retrying in ${backoffTime/1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, backoffTime));
                }
            }
        }
        
        throw new Error(`${operationName} failed after ${this.config.maxRetries} attempts: ${lastError?.message}`);
    }

    /**
     * ⚡ GROQ FALLBACK: Call Groq API when Gemini quota is exceeded
     */
    async callGroqAPI(prompt, operationName = 'API Call') {
        if (!this.groqClient) {
            throw new Error('Groq client not initialized. Please add GROQ_API_KEY to .env');
        }

        const startTime = Date.now();
        
        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                console.log(`   ⏱️  ${operationName} [Groq/${this.groqModel}] (attempt ${attempt}/${this.config.maxRetries})...`);
                
                const response = await Promise.race([
                    this.groqClient.chat.completions.create({
                        model: this.groqModel,
                        messages: [
                            {
                                role: 'system',
                                content: 'You are an expert educational content designer. Always respond with valid JSON only, no markdown code blocks or explanations.'
                            },
                            {
                                role: 'user',
                                content: prompt
                            }
                        ],
                        temperature: 0.7,
                        max_tokens: 8000
                    }),
                    new Promise((_, reject) =>
                        setTimeout(
                            () => reject(new Error(`Timeout after ${this.config.timeoutMs}ms`)), 
                            this.config.timeoutMs
                        )
                    )
                ]);
                
                const text = response.choices[0]?.message?.content?.trim() || '';
                
                if (!text || text.length === 0) {
                    throw new Error('Empty response from Groq API');
                }
                
                const elapsed = Date.now() - startTime;
                console.log(`   ✅ ${operationName} [Groq] completed (${text.length} chars, ${elapsed}ms)`);
                
                // ⚡ Cache the response
                this.setCachedResponse(prompt, text);
                
                return text;
                
            } catch (error) {
                console.error(`   ⚠️  ${operationName} [Groq] failed: ${error.message}`);
                
                // Handle Groq rate limiting
                if (error.message.includes('429') || error.message.includes('rate')) {
                    const waitTime = Math.pow(2, attempt) * 5000;
                    console.log(`   ⏳ Groq rate limited. Waiting ${waitTime/1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }
                
                if (attempt < this.config.maxRetries) {
                    const backoffTime = Math.pow(2, attempt) * 2000;
                    console.log(`   ⏳ Retrying Groq in ${backoffTime/1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, backoffTime));
                } else {
                    throw new Error(`${operationName} [Groq] failed after ${this.config.maxRetries} attempts: ${error.message}`);
                }
            }
        }
    }

    /**
     * Parse JSON from API response
     */
    parseJSONResponse(response) {
        try {
            // Robust JSON parsing: attempt to extract the first balanced JSON object/array
            const cleanResponse = String(response || '');

            function extractBalanced(startChar) {
                const openChar = startChar;
                const closeChar = openChar === '{' ? '}' : ']';
                const first = cleanResponse.indexOf(openChar);
                if (first === -1) return null;

                let inString = false;
                let escape = false;
                let depth = 0;

                for (let i = first; i < cleanResponse.length; i++) {
                    const ch = cleanResponse[i];

                    if (inString) {
                        if (escape) {
                            escape = false;
                        } else if (ch === '\\') {
                            escape = true;
                        } else if (ch === '"') {
                            inString = false;
                        }
                        continue;
                    }

                    if (ch === '"') {
                        inString = true;
                        continue;
                    }

                    if (ch === openChar) {
                        depth++;
                    } else if (ch === closeChar) {
                        depth--;
                        if (depth === 0) {
                            return cleanResponse.substring(first, i + 1);
                        }
                    }
                }

                return null;
            }

            function tryParseCandidate(candidate) {
                if (!candidate) return null;
                let s = candidate
                    .replace(/```json\s*/gi, '')
                    .replace(/```\s*/gi, '')
                    .replace(/[\x00-\x1F\x7F]/g, ' ') // remove control characters
                    .trim();

                // First attempt: direct parse
                try {
                    return JSON.parse(s);
                } catch (e) {
                    // Try simple cleanup: remove trailing commas before closing braces/brackets
                    const cleaned = s.replace(/,\s*(?=[}\]])/g, '');
                    try {
                        return JSON.parse(cleaned);
                    } catch (e2) {
                        // As a last resort, return null to let caller handle
                        return null;
                    }
                }
            }

            try {
                // Try object then array extraction
                const objCandidate = extractBalanced('{');
                const arrCandidate = extractBalanced('[');

                let parsed = tryParseCandidate(objCandidate) || tryParseCandidate(arrCandidate);

                if (parsed !== null) return parsed;

                // If no balanced candidate parsed, try to parse entire response after cleanup
                const fallback = cleanResponse
                    .replace(/```json\s*/gi, '')
                    .replace(/```\s*/gi, '')
                    .replace(/[\x00-\x1F\x7F]/g, ' ')
                    .trim();

                try {
                    return JSON.parse(fallback);
                } catch (finalErr) {
                    console.error(`   ⚠️  JSON Parse Error: ${finalErr.message}`);
                    console.error(`   Response preview: ${cleanResponse.substring(0, 300)}...`);
                    throw new Error(`Failed to parse API response: ${finalErr.message}`);
                }
            } catch (err) {
                console.error(`   ⚠️  JSON Parse Error: ${err.message}`);
                console.error(`   Response preview: ${cleanResponse.substring(0, 300)}...`);
                throw new Error(`Failed to parse API response: ${err.message}`);
            }
        } catch (error) {
            console.error(`   ⚠️  JSON Parse Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Safe JSON parse wrapper: returns parsed value or a provided fallback.
     * fallback can be a value or a function that returns a value (optionally using the error).
     */
    tryParseOrFallback(response, operationName = 'Parse', fallback = null) {
        try {
            return this.parseJSONResponse(response);
        } catch (e) {
            console.warn(`   ⚠️  ${operationName} parse failed: ${e.message}`);
            if (typeof fallback === 'function') {
                try {
                    return fallback(e);
                } catch (ferr) {
                    console.warn(`   ⚠️  Fallback generator failed: ${ferr.message}`);
                    return null;
                }
            }
            return fallback;
        }
    }

    // ============================================================================
    // MAIN ROADMAP GENERATION
    // ============================================================================

    /**
     * Generate Complete Coursera-Style Roadmap
     * This is the main entry point for roadmap generation
     */
    async generateCompleteRoadmapImproved(content, learnerLevel = 'beginner') {
        console.log('\n');
        console.log('═'.repeat(70));
        console.log('🎓 COURSERA-STYLE ROADMAP GENERATION');
        console.log('═'.repeat(70));
        console.log(`📅 Started: ${new Date().toISOString()}`);
        console.log(`🔑 API Key: ${process.env.GEMINI_API_KEY ? 'Configured ✅' : 'Missing ❌'}`);
        console.log(`📊 Content Size: ${content.length.toLocaleString()} characters`);
        console.log(`🎯 Learner Level: ${learnerLevel}`);
        console.log('═'.repeat(70));

        // Preprocess content
        const processed = this.preprocessContent(content);
        console.log(`\n📄 Document Statistics:`);
        console.log(`   Words: ${processed.statistics.totalWords.toLocaleString()}`);
        console.log(`   Paragraphs: ${processed.statistics.totalParagraphs}`);
        console.log(`   Sections: ${processed.statistics.totalSections}`);
        console.log(`   Est. Reading Time: ${processed.statistics.estimatedReadingTime}`);

        // ⚡ OPTIMIZED: Reduced phases for faster generation
        // 2 phases for beginner/intermediate, 3 for advanced (faster than before)
        const numPhases = learnerLevel === 'advanced' ? 3 : 2;

        // STEP 1: Course Analysis
        console.log('\n' + '─'.repeat(50));
        let courseAnalysis;
        try {
            courseAnalysis = await this.performCourseAnalysis(processed.sample);
        } catch (error) {
            console.error('❌ Course analysis failed, trying simplified extraction...');
            const mainTopic = await this.extractMainTopic(processed.sample);
            courseAnalysis = {
                courseTitle: mainTopic.mainTopic,
                courseDescription: mainTopic.summary,
                targetAudience: { inferredLevel: mainTopic.targetLevel },
                chapters: [],
                allConceptsExtracted: {
                    foundational: mainTopic.subTopics?.slice(0, 2) || [],
                    intermediate: mainTopic.subTopics?.slice(2, 4) || [],
                    advanced: mainTopic.subTopics?.slice(4) || []
                }
            };
        }

        // STEP 2: Generate Phases
        console.log('\n' + '─'.repeat(50));
        const phasesData = await this.generatePhases(courseAnalysis, processed.full, numPhases);

        // STEP 3: Build complete roadmap with modules and lessons
        console.log('\n' + '─'.repeat(50));
        console.log('📚 STEP 3: Building Modules & Lessons');
        console.log('═'.repeat(50));

        const phases = [];
        
        for (const phaseData of phasesData.phases) {
            console.log(`\n📍 Processing Phase ${phaseData.phaseNumber}: ${phaseData.phaseName}`);
            
            // ⚡ Generate modules for this phase
            let modules;
            try {
                modules = await this.generateModulesForPhase(
                    phaseData, 
                    processed.full, 
                    this.config.modulesPerPhase
                );
            } catch (error) {
                console.error(`   ❌ Module generation failed: ${error.message}`);
                throw new Error(`Cannot generate modules for "${phaseData.phaseName}": ${error.message}`);
            }

            // Ensure each module has a unique moduleId (fallback if AI didn't provide one)
            modules = modules.map((m, idx) => {
                const baseId = phaseData.phaseId || `phase_${phaseData.phaseNumber}`;
                // use existing moduleId or construct from phase and index
                const moduleId = m.moduleId || `mod_${baseId}_${idx + 1}`;
                return {
                    ...m,
                    moduleId,
                    moduleNumber: m.moduleNumber || idx + 1
                };
            });

            // ⚡ PARALLELIZE: Generate enriched content (lessons+quiz+outcomes) for each module in parallel
            const enrichedModules = await this.mapWithConcurrency(
                modules,
                async (moduleData) => this.enrichModuleWithBatchContent(moduleData, phaseData, processed.full),
                this.config.concurrency
            );

            // Extract unique topics from all modules and lessons in this phase
            const phaseTopicsSet = new Map();
            enrichedModules.forEach(module => {
                // From module's topicsCovered
                (module.topicsCovered || []).forEach(topic => {
                    if (typeof topic === 'string') {
                        const topicName = topic.trim();
                        if (!phaseTopicsSet.has(topicName.toLowerCase())) {
                            phaseTopicsSet.set(topicName.toLowerCase(), {
                                id: `topic_${phaseData.phaseId}_${phaseTopicsSet.size + 1}`,
                                name: topicName,
                                description: `Part of ${module.moduleTitle || 'this module'}`,
                                difficulty: module.difficulty || 'intermediate',
                                keyTerms: []
                            });
                        }
                    }
                });
                // From lesson titles within modules
                (module.lessons || []).forEach(lesson => {
                    if (lesson.title) {
                        const topicName = lesson.title.trim();
                        if (!phaseTopicsSet.has(topicName.toLowerCase())) {
                            phaseTopicsSet.set(topicName.toLowerCase(), {
                                id: `topic_${phaseData.phaseId}_${phaseTopicsSet.size + 1}`,
                                name: topicName,
                                description: lesson.summary || lesson.introduction || 'Core learning topic',
                                difficulty: lesson.difficulty || 'intermediate',
                                keyTerms: lesson.learningObjectives?.slice(0, 3) || []
                            });
                        }
                    }
                });
            });

            const phaseTopics = Array.from(phaseTopicsSet.values());

            phases.push({
                phaseId: phaseData.phaseId,
                phaseNumber: phaseData.phaseNumber,
                phaseName: phaseData.phaseName,
                phaseDescription: phaseData.phaseDescription,
                phaseObjective: phaseData.phaseObjective,
                difficulty: phaseData.difficulty,
                estimatedHours: phaseData.estimatedHours || enrichedModules.length * 3,
                // Recommended duration (days) assuming ~3 study hours/day
                recommendedDurationDays: Math.max(1, Math.round((phaseData.estimatedHours || enrichedModules.length * 3) / 3)),
                chaptersIncluded: phaseData.chaptersIncluded || [],
                learningOutcomes: phaseData.learningOutcomes || [],
                modules: enrichedModules,
                // ⚡ Phase-level topics extracted from modules and lessons
                phaseTopics: phaseTopics,
                phaseAssessment: {
                    type: 'comprehensive-exam',
                    questionCount: 15,
                    passingScore: 75,
                    available: true
                }
            });
        }

        // ⚡ Extract all topics from phases for top-level subTopics
        const allTopics = [];
        phases.forEach((phase, phaseIdx) => {
            // Add phase topics
            if (phase.phaseTopics && phase.phaseTopics.length > 0) {
                phase.phaseTopics.forEach(topic => {
                    allTopics.push({
                        ...topic,
                        phase: phaseIdx + 1,
                        phaseName: phase.phaseName
                    });
                });
            }
            // Also extract topics from modules
            if (phase.modules) {
                phase.modules.forEach(module => {
                    if (module.topicsCovered && module.topicsCovered.length > 0) {
                        module.topicsCovered.forEach(topicName => {
                            const topicExists = allTopics.some(t => 
                                t.name && t.name.toLowerCase() === String(topicName).toLowerCase()
                            );
                            if (!topicExists) {
                                allTopics.push({
                                    id: module.moduleId || `topic_${phaseIdx}_${allTopics.length}`,
                                    name: topicName,
                                    description: module.moduleDescription || `Topic in ${phase.phaseName}`,
                                    difficulty: module.difficulty || 'intermediate',
                                    phase: phaseIdx + 1,
                                    phaseName: phase.phaseName
                                });
                            }
                        });
                    }
                });
            }
        });

        // Calculate statistics
        const statistics = {
            totalPhases: phases.length,
            totalModules: phases.reduce((sum, p) => sum + p.modules.length, 0),
            totalLessons: phases.reduce((sum, p) => 
                sum + p.modules.reduce((msum, m) => msum + m.lessons.length, 0), 0
            ),
            totalQuizQuestions: phases.reduce((sum, p) => 
                sum + p.modules.reduce((msum, m) => msum + (m.assessment?.questions?.length || 0), 0), 0
            ),
            estimatedTotalHours: phases.reduce((sum, p) => sum + (p.estimatedHours || 0), 0),
            contentSource: 'Full PDF extraction - No static content',
            generationMethod: 'Coursera-style professional roadmap'
        };

        // ⚡ Generate study timeline with phase breakdown for frontend
        const studyTimeline = this.generateStudyTimeline(phases, statistics);

        // ⚡ Generate course-level learning outcomes from PDF content
        console.log('\n' + '─'.repeat(50));
        const learningOutcomes = await this.generateCourseOutcomes(courseAnalysis.courseTitle, phases, processed.full);

        // Build final roadmap
        const roadmap = {
            roadmapId: `roadmap_${Date.now()}`,
            version: '2.0.0',
            
            // Course Info
            courseTitle: courseAnalysis.courseTitle,
            courseDescription: courseAnalysis.courseDescription,
            courseLevel: learnerLevel,
            targetAudience: courseAnalysis.targetAudience,
            
            // Main Topic (for backward compatibility)
            title: courseAnalysis.courseTitle,
            mainTopic: courseAnalysis.courseTitle,
            description: courseAnalysis.courseDescription,
            
            // Learning Structure
            phases: phases,
            learningPath: phases, // Alias for compatibility
            
            // Progress & Milestones
            progressMilestones: phases.map((p, idx) => ({
                milestoneId: `milestone_${idx + 1}`,
                milestoneName: `Complete ${p.phaseName}`,
                phaseId: p.phaseId,
                trigger: 'Pass phase assessment',
                reward: idx === phases.length - 1 ? 'Course Certificate' : `Phase ${idx + 1} Badge`
            })),
            
            // Statistics
            statistics: statistics,
            
            // ⚡ Course-level learning outcomes (aggregated from PDF extraction)
            learningOutcomes: learningOutcomes,
            
            // ⚡ Study Timeline with proper format for Document model
            studyTimeline: studyTimeline,
            
            // ⚡ Top-level subTopics extracted from all phases and modules
            subTopics: allTopics,
            // Alias for compatibility with frontend (Topics tab uses mainTopics)
            mainTopics: allTopics,
            
            // High-level course objective and timeline guidance
            courseObjective: courseAnalysis.courseObjective || courseAnalysis.courseDescription || `Learn ${courseAnalysis.courseTitle}`,
            timeline: {
                // Estimated total days assuming ~3 hours/day study
                estimatedTotalDays: Math.max(1, Math.round(statistics.estimatedTotalHours / 3 || 1)),
                recommendedPacingHoursPerDay: 3,
                startDate: null,
                endDate: null,
                perPhase: phases.map(p => ({
                    phaseId: p.phaseId,
                    recommendedDurationDays: p.recommendedDurationDays || 0
                }))
            },
            // Top-level action steps (aggregated from modules)
            actionSteps: phases.flatMap(p => p.modules.flatMap(m => m.actionSteps || [])),
            
            // Metadata
            generatedAt: new Date().toISOString(),
            learnerLevel: learnerLevel,
            documentStatistics: processed.statistics
        };

        // Final summary
        console.log('\n');
        console.log('═'.repeat(70));
        console.log('✅ ROADMAP GENERATION COMPLETE');
        console.log('═'.repeat(70));
        console.log(`📚 Course: ${roadmap.courseTitle}`);
        console.log(`📊 Statistics:`);
        console.log(`   • Phases: ${statistics.totalPhases}`);
        console.log(`   • Modules: ${statistics.totalModules}`);
        console.log(`   • Lessons: ${statistics.totalLessons}`);
        console.log(`   • Quiz Questions: ${statistics.totalQuizQuestions}`);
        console.log(`   • Est. Duration: ${statistics.estimatedTotalHours} hours`);
        console.log(`🎯 Learning Outcomes: ${learningOutcomes.length} outcomes extracted`);
        console.log(`⏱️  Timeline: ${studyTimeline.totalEstimatedHours} hours total, ${studyTimeline.recommendedPacePerWeek}`);
        console.log(`📅 Completed: ${new Date().toISOString()}`);
        console.log('═'.repeat(70) + '\n');

        // ⚡ CRITICAL: Sanitize roadmap data to match Mongoose schema before returning
        return this.sanitizeRoadmapForSchema(roadmap);
    }

    /**
     * Quick roadmap generation (for smaller documents or previews)
     */
    async generateQuickRoadmap(content, learnerLevel = 'beginner') {
        console.log('\n⚡ Quick Roadmap Generation Mode\n');
        
        const processed = this.preprocessContent(content);
        
        // Extract main topic and comprehensive topics directly
        const mainTopic = await this.extractMainTopic(processed.sample);
        
        // Use comprehensive topics prompt
        const topicsPrompt = ImprovedGeminiPrompts.getComprehensiveTopicsPrompt(
            processed.full,
            3,
            mainTopic.mainTopic
        );
        
        const topicsResponse = await this.callGeminiAPI(topicsPrompt, 'Quick Topics Extraction');
        const topicsData = this.tryParseOrFallback(topicsResponse, 'Quick Topics Extraction', {});
        
        // Build simplified phases
        const phases = [];
        for (let i = 1; i <= 3; i++) {
            const phaseTopics = topicsData[`phase${i}`]?.topics || [];
            
            phases.push({
                phaseId: `phase_${i}`,
                phaseNumber: i,
                phaseName: topicsData[`phase${i}`]?.phaseName || `Phase ${i}`,
                phaseDescription: topicsData[`phase${i}`]?.phaseDescription || '',
                difficulty: ['beginner', 'intermediate', 'advanced'][i - 1],
                topics: phaseTopics,
                estimatedHours: Math.ceil(phaseTopics.length * 0.5)
            });
        }
        
        return {
            roadmapId: `quick_roadmap_${Date.now()}`,
            courseTitle: mainTopic.mainTopic,
            courseDescription: mainTopic.summary,
            phases: phases,
            generatedAt: new Date().toISOString(),
            mode: 'quick'
        };
    }
}

module.exports = ImprovedRoadmapService;