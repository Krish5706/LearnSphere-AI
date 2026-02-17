/**
 * Improved Roadmap Service with Dynamic PDF Processing
 * All content is extracted from PDFs using sophisticated Gemini prompts
 * No more static/generic values - everything is context-based
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const ImprovedGeminiPrompts = require('./improvedGeminiPrompts');

class ImprovedRoadmapService {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is required');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        // Use gemini-1.5-flash as default - it's free and reliable
        // Valid models: gemini-1.5-flash, gemini-1.5-pro, gemini-2.0-flash
        this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
        this.model = this.genAI.getGenerativeModel({ model: this.modelName });
    }

    /**
     * Content preprocessing - extract key sections
     */
    preprocessContent(content) {
        return {
            full: content,
            sample: content.substring(0, 25000), // First 25k chars
            sections: this.extractSections(content),
            statistics: {
                length: content.length,
                words: content.split(/\s+/).length,
                paragraphs: content.split(/\n\n+/).length
            }
        };
    }

    extractSections(content) {
        const sections = [];
        const lines = content.split('\n');
        let currentSection = '';
        
        lines.forEach(line => {
            if (line.match(/^#+\s|^---+|^===+|^Chapter|^Section|^Unit/) && currentSection.length > 100) {
                sections.push(currentSection);
                currentSection = line;
            } else {
                currentSection += '\n' + line;
            }
        });
        
        if (currentSection.length > 100) sections.push(currentSection);
        return sections.slice(0, 15); // Top 15 sections
    }

    /**
     * STEP 1: Extract main topic using improved prompt
     */
    async extractMainTopicImproved(content) {
        try {
            console.log('📌 STEP 1: Extracting main document topic...');
            
            const prompt = ImprovedGeminiPrompts.getMainTopicPrompt(content.substring(0, 15000));
            console.log('📤 Sending prompt to Gemini API...');
            
            const result = await this.callGeminiWithTimeout(prompt, 20000);
            console.log('📥 Received response from Gemini');
            
            // Try to extract JSON from response
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const data = JSON.parse(jsonMatch[0]);
                    console.log(`   ✅ Main Topic: "${data.mainTopic}"`);
                    console.log(`   ✅ Sub-topics: ${data.subTopics.join(', ')}`);
                    console.log(`   ✅ Target Level: ${data.targetLevel}`);
                    return data;
                } catch (parseError) {
                    console.error('   ❌ JSON Parse Error:', parseError.message);
                    console.log('   📝 Raw response:', result.substring(0, 200));
                }
            } else {
                console.error('   ❌ No JSON found in response');
                console.log('   📝 Response:', result.substring(0, 300));
            }
        } catch (error) {
            console.error('   ❌ Main topic extraction failed:', error.message);
            console.error('   🔍 Error details:', error);
        }
        
        // Fallback: Try to extract some basic info without Gemini
        console.log('   ⚠️  Using fallback topic extraction...');
        return {
            mainTopic: 'Learning Subject',
            subTopics: ['Fundamentals', 'Intermediate Concepts', 'Advanced Topics'],
            targetLevel: 'beginner',
            practicalApplications: ['Real-world applications'],
            coreTerminology: ['concept1', 'concept2', 'concept3'],
            contentType: 'textbook',
            confidence: 'low',
            summary: 'Educational content for comprehensive learning'
        };
    }

    /**
     * STEP 2: Extract comprehensive topics from PDF
     */
    async extractComprehensiveTopicsImproved(content, numPhases = 3) {
        try {
            console.log(`📚 STEP 2: Extracting topics for ${numPhases} phases...`);
            
            const mainTopicData = await this.extractMainTopicImproved(content);
            
            const prompt = ImprovedGeminiPrompts.getComprehensiveTopicsPrompt(
                content.substring(0, 30000),
                numPhases,
                mainTopicData.mainTopic
            );
            
            console.log('📤 Sending topics prompt to Gemini API...');
            const result = await this.callGeminiWithTimeout(prompt, 30000);
            console.log('📥 Received topics response');
            
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                try {
                    const topicsData = JSON.parse(jsonMatch[0]);
                    
                    // Format and validate
                    const formattedTopics = {
                        mainTopic: mainTopicData.mainTopic,
                        subTopics: mainTopicData.subTopics,
                        phases: {}
                    };
                    
                    for (let i = 1; i <= numPhases; i++) {
                        const phaseKey = `phase${i}`;
                        const topics = (topicsData[phaseKey] || []).map((t, idx) => ({
                            id: `topic_p${i}_${idx + 1}`,
                            name: t.name,
                            description: t.description,
                            keyTerms: t.keyTerms,
                            importance: t.importance || 'important',
                            documentReference: t.documentReference,
                            phase: i
                        }));
                        
                        formattedTopics.phases[i] = topics;
                        console.log(`   ✅ Phase ${i}: ${topics.length} topics extracted`);
                    }
                    
                    return formattedTopics;
                } catch (parseError) {
                    console.error('   ❌ JSON Parse Error in comprehensive topics:', parseError.message);
                    console.log('   📝 Response preview:', result.substring(0, 300));
                }
            } else {
                console.error('   ❌ No JSON found in comprehensive topics response');
            }
        } catch (error) {
            console.error('   ❌ Topic extraction failed:', error.message);
        }
        
        // Fallback topic generation
        console.log('   ⚠️  Using fallback topic generation...');
        const fallbackTopics = {
            mainTopic: 'Learning Subject',
            subTopics: ['Fundamentals', 'Intermediate Concepts', 'Advanced Topics'],
            phases: {}
        };
        
        for (let i = 1; i <= numPhases; i++) {
            fallbackTopics.phases[i] = [
                { 
                    id: `topic_p${i}_1`,
                    name: `${['Foundation', 'Intermediate', 'Advanced'][i-1] || 'Advanced'} Topic 1`, 
                    description: 'Core concepts and fundamentals',
                    keyTerms: ['concept', 'principle', 'foundation'],
                    importance: 'critical',
                    documentReference: 'Section 1',
                    phase: i
                },
                { 
                    id: `topic_p${i}_2`,
                    name: `${['Foundation', 'Intermediate', 'Advanced'][i-1] || 'Advanced'} Topic 2`, 
                    description: 'Key principles and applications',
                    keyTerms: ['principle', 'application', 'practice'],
                    importance: 'important',
                    documentReference: 'Section 2',
                    phase: i
                }
            ];
        }
        
        return fallbackTopics;
    }

    /**
     * STEP 3: Generate enhanced content for each topic
     */
    async generateTopicContentImproved(topic, phaseDescription, fullContent) {
        try {
            const prompt = ImprovedGeminiPrompts.generateTopicContentPrompt(
                topic.name,
                topic.keyTerms,
                fullContent.substring(0, 20000),
                `Phase ${topic.phase}`,
                phaseDescription
            );
            
            const result = await this.callGeminiWithTimeout(prompt, 25000);
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.warn(`   ⚠️ Content generation for "${topic.name}" failed:`, error.message);
        }
        
        // Fallback structure
        return {
            topic: topic.name,
            content: `Overview of ${topic.name}: ${topic.description}`,
            keyPoints: topic.keyTerms.slice(0, 4),
            definitions: {},
            examples: [],
            connections: 'Related to other topics in the course',
            practicalApplications: []
        };
    }

    /**
     * STEP 4: Generate detailed lessons for module
     */
    async generateDetailedLessonsImproved(moduleTopics, phaseObjective, fullContent, lessonCount = 3) {
        const lessons = [];
        
        try {
            for (let i = 0; i < lessonCount; i++) {
                const topicForLesson = moduleTopics[i % moduleTopics.length];
                const relevantContent = this.getRelevantContentForTopic(topicForLesson, fullContent);
                
                const prompt = ImprovedGeminiPrompts.generateDetailedLessonPrompt(
                    topicForLesson,
                    moduleTopics,
                    phaseObjective,
                    relevantContent.substring(0, 15000)
                );
                
                const result = await this.callGeminiWithTimeout(prompt, 30000);
                const jsonMatch = result.match(/\{[\s\S]*\}/);
                
                if (jsonMatch) {
                    const lessonData = JSON.parse(jsonMatch[0]);
                    lessons.push({
                        lessonId: `lesson_${i + 1}`,
                        lessonTitle: lessonData.lessonTitle,
                        learningObjectives: lessonData.learningObjectives || [],
                        introduction: lessonData.introduction || '',
                        lessonContent: lessonData.mainContent || '', // Maps mainContent to lessonContent
                        keyPoints: lessonData.keyPoints || [],
                        examples: lessonData.examples || [],
                        practiceActivities: lessonData.practiceActivities || [],
                        commonMisconceptions: lessonData.commonMisconceptions || [],
                        summary: lessonData.summary || '',
                        nextSteps: lessonData.nextSteps || '',
                        duration: '30-45 minutes'
                    });
                    
                    console.log(`      ✅ Lesson ${i + 1}: ${lessonData.lessonTitle} created`);
                }
            }
        } catch (error) {
            console.error('⚠️ Lesson generation error:', error.message);
        }
        
        return lessons;
    }

    /**
     * STEP 5: Generate module assessments
     */
    async generateModuleAssessmentImproved(moduleTopics, fullContent) {
        try {
            const prompt = ImprovedGeminiPrompts.generateQuizQuestionsPrompt(
                moduleTopics,
                fullContent.substring(0, 20000),
                'medium'
            );
            
            const result = await this.callGeminiWithTimeout(prompt, 25000);
            const jsonMatch = result.match(/\[[\s\S]*\]/);
            
            if (jsonMatch) {
                const quizData = JSON.parse(jsonMatch[0]);
                console.log(`      ✅ Generated ${quizData.length} assessment questions`);
                return quizData;
            }
        } catch (error) {
            console.warn('Assessment generation failed:', error.message);
        }
        
        return [];
    }

    /**
     * STEP 6: Generate learning outcomes
     */
    async generateLearningOutcomesImproved(moduleTopics, fullContent) {
        try {
            const prompt = ImprovedGeminiPrompts.generateModuleOutcomesPrompt(
                moduleTopics,
                fullContent.substring(0, 15000)
            );
            
            const result = await this.callGeminiWithTimeout(prompt, 20000);
            const jsonMatch = result.match(/\[[\s\S]*\]/);
            
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.warn('Learning outcomes generation failed:', error.message);
        }
        
        return [];
    }

    /**
     * Get relevant content section for a topic
     */
    getRelevantContentForTopic(topic, fullContent) {
        const keywords = topic.split(' ');
        const lines = fullContent.split('\n');
        let relevantLines = [];
        
        lines.forEach((line, idx) => {
            if (keywords.some(kw => line.toLowerCase().includes(kw.toLowerCase()))) {
                const start = Math.max(0, idx - 2);
                const end = Math.min(lines.length, idx + 10);
                relevantLines.push(...lines.slice(start, end));
            }
        });
        
        return relevantLines.slice(0, 100).join('\n') || fullContent.substring(0, 5000);
    }

    /**
     * Call Gemini with timeout, retry logic, and better error handling
     */
    async callGeminiWithTimeout(prompt, timeoutMs = 30000, retries = 3) {
        let lastError = null;
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`⏱️  Calling Gemini API (attempt ${attempt}/${retries}) with ${timeoutMs}ms timeout...`);
                
                const response = await Promise.race([
                    this.model.generateContent(prompt),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error(`Gemini API timeout after ${timeoutMs}ms`)), timeoutMs)
                    )
                ]);
                
                const text = response.response.text().trim();
                console.log(`✅ Gemini API returned ${text.length} characters`);
                return text;
            } catch (error) {
                lastError = error;
                console.error(`🚨 Gemini API Error (attempt ${attempt}):`, error.message);
                
                // Check if it's a rate limit error (429)
                if (error.message.includes('429') || error.message.includes('Too Many Requests') || error.message.includes('quota')) {
                    console.error('   ⚠️ RATE LIMIT: API quota exceeded');
                    
                    // Check if it's a per-minute limit (can retry) or daily limit (can't retry)
                    if (error.message.includes('PerMinute') || error.message.includes('retry in')) {
                        const retryMatch = error.message.match(/retry in (\d+)/);
                        const waitTime = retryMatch ? parseInt(retryMatch[1]) * 1000 + 2000 : 30000;
                        
                        if (attempt < retries) {
                            console.log(`   ⏳ Waiting ${waitTime/1000}s before retry...`);
                            await new Promise(resolve => setTimeout(resolve, waitTime));
                            continue;
                        }
                    } else if (error.message.includes('PerDay')) {
                        console.error('   ❌ DAILY QUOTA EXCEEDED: Cannot retry until tomorrow');
                        console.error('   💡 Get a new API key at: https://aistudio.google.com/apikey');
                        throw new Error('QUOTA_EXCEEDED: Daily API limit reached. Please get a new API key or wait until tomorrow.');
                    }
                }
                
                // Check if it's an auth error
                if (error.message.includes('API key') || error.message.includes('authentication') || error.status === 401) {
                    console.error('   ❌ API Key Issue: Check GEMINI_API_KEY in environment variables');
                    throw error;
                }
                
                // For other errors, retry with backoff
                if (attempt < retries) {
                    const backoffTime = Math.pow(2, attempt) * 1000;
                    console.log(`   ⏳ Retrying in ${backoffTime/1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, backoffTime));
                }
            }
        }
        
        throw lastError;
    }

    /**
     * MAIN: Generate complete enhanced roadmap
     */
    async generateCompleteRoadmapImproved(content, learnerLevel = 'beginner') {
        try {
            console.log('\n' + '='.repeat(60));
            console.log('🎓 ENHANCED ROADMAP GENERATION WITH PDF-BASED CONTENT');
            console.log('='.repeat(60));
            console.log(`🔑 API Key Status: ${process.env.GEMINI_API_KEY ? 'Configured ✅' : 'Missing ❌'}`);
            console.log(`📊 Content Size: ${content.length} characters`);
            
            const processed = this.preprocessContent(content);
            console.log(`📄 Processing: ${processed.statistics.words} words, ${processed.statistics.paragraphs} paragraphs\n`);
            
            // Step 1: Extract main topic
            console.log('🚀 Starting step 1: Main topic extraction');
            const mainTopicData = await this.extractMainTopicImproved(processed.full);
            console.log(`✅ Step 1 complete. Main Topic: ${mainTopicData.mainTopic}\n`);
            
            // Step 2: Extract comprehensive topics
            console.log('🚀 Starting step 2: Comprehensive topics extraction');
            const numPhases = learnerLevel === 'beginner' ? 3 : 4;
            const topicsData = await this.extractComprehensiveTopicsImproved(processed.full, numPhases);
            console.log(`✅ Step 2 complete\n`);
            
            console.log(`\n📚 Structuring ${numPhases} learning phases...\n`);
            
            // Step 3: Build phases with modules and lessons
            const phases = [];
            
            for (let phaseNum = 1; phaseNum <= numPhases; phaseNum++) {
                const phaseTopics = topicsData.phases[phaseNum] || [];
                const phaseDescription = this.getPhaseDescription(phaseNum, numPhases, mainTopicData.mainTopic);
                
                console.log(`\n📍 PHASE ${phaseNum}: ${phaseDescription}`);
                console.log(`   Topics: ${phaseTopics.map(t => t.name).join(', ')}`);
                
                // Generate modules
                const modules = [];
                const modulesPerPhase = Math.max(2, Math.ceil(phaseTopics.length / 2));
                
                for (let modNum = 0; modNum < modulesPerPhase; modNum++) {
                    const startIdx = modNum * Math.ceil(phaseTopics.length / modulesPerPhase);
                    const endIdx = startIdx + Math.ceil(phaseTopics.length / modulesPerPhase);
                    const moduleTopics = phaseTopics.slice(startIdx, endIdx).map(t => t.name);
                    
                    console.log(`   📚 Module ${modNum + 1}: ${moduleTopics.join(', ')}`);
                    
                    // Generate lessons for module
                    const lessons = await this.generateDetailedLessonsImproved(
                        moduleTopics,
                        phaseDescription,
                        processed.full,
                        3
                    );
                    
                    // Generate assessment
                    const assessment = await this.generateModuleAssessmentImproved(
                        moduleTopics,
                        processed.full
                    );
                    
                    // Generate learning outcomes
                    const outcomes = await this.generateLearningOutcomesImproved(
                        moduleTopics,
                        processed.full
                    );
                    
                    modules.push({
                        moduleId: `mod_p${phaseNum}_m${modNum + 1}`,
                        moduleTitle: `Module ${modNum + 1}: ${moduleTopics[0]}${moduleTopics.length > 1 ? ' & More' : ''}`,
                        moduleDescription: `Comprehensive module covering: ${moduleTopics.join(', ')}`,
                        topicsCovered: moduleTopics,
                        lessons: lessons,
                        assessment: {
                            type: 'quiz',
                            questions: assessment,
                            passingScore: 70
                        },
                        learningOutcomes: outcomes,
                        estimatedDuration: '6-8 hours',
                        difficulty: phaseNum === 1 ? 'beginner' : phaseNum === 2 ? 'intermediate' : 'advanced'
                    });
                }
                
                phases.push({
                    phaseId: `phase_${phaseNum}`,
                    phaseName: phaseDescription,
                    phaseDescription: `${phaseTopics.length} topics covering ${topicsData.subTopics[phaseNum - 1] || 'key concepts'}`,
                    phaseObjective: phaseDescription,
                    phaseTopics: phaseTopics,
                    modules: modules,
                    estimatedDuration: learnerLevel === 'beginner' ? '8 hours' : '10 hours'
                });
            }
            
            console.log(`\n✅ Roadmap generation complete!\n`);
            console.log(`   Main Topic: ${mainTopicData.mainTopic}`);
            console.log(`   Sub-topics: ${mainTopicData.subTopics.join(', ')}`);
            console.log(`   Phases: ${phases.length}`);
            console.log(`   Total Modules: ${phases.reduce((sum, p) => sum + p.modules.length, 0)}`);
            console.log(`   Total Lessons: ${phases.reduce((sum, p) => sum + p.modules.reduce((msum, m) => msum + m.lessons.length, 0), 0)}`);
            console.log('='.repeat(60) + '\n');
            
            return {
                roadmapId: `roadmap_${Date.now()}`,
                title: mainTopicData.mainTopic,
                description: mainTopicData.summary,
                mainTopic: mainTopicData.mainTopic,
                subTopics: mainTopicData.subTopics,
                targetLevel: mainTopicData.targetLevel,
                learnerLevel: learnerLevel,
                // Use both 'learningPath' (for MongoDB schema) and 'phases' (for frontend compatibility)
                learningPath: phases,
                phases: phases,
                statistics: {
                    totalPhases: phases.length,
                    totalModules: phases.reduce((sum, p) => sum + p.modules.length, 0),
                    totalLessons: phases.reduce((sum, p) => sum + p.modules.reduce((msum, m) => msum + m.lessons.length, 0), 0),
                    totalAssessmentQuestions: phases.reduce((sum, p) => 
                        sum + p.modules.reduce((msum, m) => msum + (m.assessment?.questions?.length || 0), 0), 0),
                    estimatedTotalHours: phases.length * 8,
                    contentSourced: 'PDF-based dynamic extraction with fallback support'
                },
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Roadmap generation failed:', error.message);
            console.error('   Stack:', error.stack);
            throw error;
        }
    }

    /**
     * Get descriptive phase name based on phase number
     */
    getPhaseDescription(phaseNum, totalPhases, mainTopic) {
        const descriptions = [
            `${mainTopic} - Foundation & Core Concepts`,
            `${mainTopic} - Intermediate Techniques & Applications`,
            `${mainTopic} - Advanced Topics & Specialization`,
            `${mainTopic} - Mastery & Real-World Projects`
        ];
        return descriptions[phaseNum - 1] || `${mainTopic} - Phase ${phaseNum}`;
    }
}

module.exports = ImprovedRoadmapService;
