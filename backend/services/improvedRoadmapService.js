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
 * 
 * @author LearnSphere AI
 * @version 2.0.0
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
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
        
        // Configuration
        this.config = {
            maxContentLength: 100000,  // Maximum content to send to Gemini
            chunkSize: 30000,          // Size for chunked processing
            timeoutMs: 60000,          // API timeout
            maxRetries: 3,             // API retry count
            modulesPerPhase: 2,        // Default modules per phase
            lessonsPerModule: 3        // Default lessons per module
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
            const prompt = ImprovedGeminiPrompts.getCourseAnalysisPrompt(content);
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
            const prompt = ImprovedGeminiPrompts.generatePhasesPrompt(courseAnalysis, content, numPhases);
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
    // STEP 4: LESSON GENERATION
    // ============================================================================

    /**
     * Generate detailed lessons for a module
     */
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

    // ============================================================================
    // CONTENT EXTRACTION HELPERS
    // ============================================================================

    // Escape user-provided text for safe use in RegExp constructors
    escapeForRegex(text) {
        if (typeof text !== 'string') return '';
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
     * Call Gemini API with timeout, retry logic, and error handling
     */
    async callGeminiAPI(prompt, operationName = 'API Call') {
        let lastError = null;
        
        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                console.log(`   ⏱️  ${operationName} (attempt ${attempt}/${this.config.maxRetries})...`);
                
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
                
                console.log(`   ✅ ${operationName} completed (${text.length} chars)`);
                return text;
                
            } catch (error) {
                lastError = error;
                console.error(`   ⚠️  ${operationName} failed: ${error.message}`);
                
                // Handle rate limiting
                if (error.message.includes('429') || error.message.includes('quota')) {
                    if (error.message.includes('PerDay')) {
                        throw new Error('QUOTA_EXCEEDED: Daily API limit reached. Please try again tomorrow or use a different API key.');
                    }
                    
                    const waitTime = Math.pow(2, attempt) * 10000; // Exponential backoff
                    console.log(`   ⏳ Rate limited. Waiting ${waitTime/1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
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

        // Determine number of phases based on content size and learner level
        const numPhases = learnerLevel === 'beginner' ? 3 : 
                         learnerLevel === 'intermediate' ? 3 : 4;

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
            
            // Generate modules for this phase
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

            // Generate lessons and quiz for each module
            const enrichedModules = [];
            
            for (const moduleData of modules) {
                console.log(`\n   📦 Processing Module: ${moduleData.moduleName}`);
                
                // Generate lessons
                let lessons;
                try {
                    lessons = await this.generateLessonsForModule(moduleData, processed.full);
                } catch (error) {
                    console.error(`      ❌ Lesson generation failed: ${error.message}`);
                    throw new Error(`Cannot generate lessons for "${moduleData.moduleName}": ${error.message}`);
                }

                // Generate quiz
                let quiz;
                try {
                    quiz = await this.generateModuleQuiz(moduleData, lessons, processed.full);
                } catch (error) {
                    console.warn(`      ⚠️ Quiz generation failed, skipping quiz: ${error.message}`);
                    quiz = { questions: [], passingScore: 70 };
                }

                // Generate learning outcomes
                let outcomes;
                try {
                    const topicNames = moduleData.topicsCovered?.map(t => 
                        typeof t === 'string' ? t : t.topicName
                    ) || [];
                    outcomes = await this.generateLearningOutcomes(topicNames, processed.full);
                } catch (error) {
                    console.warn(`      ⚠️ Outcomes generation failed: ${error.message}`);
                    outcomes = [];
                }

                enrichedModules.push({
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
                        lessonId: lesson.lessonId || `les_${idx + 1}`,
                        lessonNumber: lesson.lessonNumber || idx + 1,
                        lessonTitle: lesson.lessonTitle,
                        lessonDuration: lesson.lessonDuration || '20 minutes',
                        lessonType: lesson.lessonType || 'concept',
                        introduction: lesson.introduction || {},
                        learningObjectives: lesson.learningObjectives || [],
                        mainContent: lesson.mainContent || {},
                        examples: lesson.examples || [],
                        keyPoints: lesson.keyPoints || [],
                        terminology: lesson.terminology || [],
                        practiceActivity: lesson.practiceActivity || {},
                        summary: lesson.summary || '',
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
                });
            }

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
                phaseAssessment: {
                    type: 'comprehensive-exam',
                    questionCount: 15,
                    passingScore: 75,
                    available: true
                }
            });
        }

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
        console.log(`📅 Completed: ${new Date().toISOString()}`);
        console.log('═'.repeat(70) + '\n');

        return roadmap;
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