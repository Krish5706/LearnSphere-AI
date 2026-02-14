/**
 * Enhanced Roadmap Service
 * Generates comprehensive learning paths with topics, phases, and progress tracking
 * Uses RAG-like approach: Extract content chunks, then generate phase-specific topics
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class RoadmapService {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is required');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.modelName = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
        this.model = this.genAI.getGenerativeModel({ model: this.modelName });
        this.contentChunks = null; // Store content chunks for RAG-like retrieval
    }

    /**
     * Chunk content for better processing (RAG-like approach)
     * @param {string} content - Full PDF content
     * @returns {Array} - Array of content chunks with metadata
     */
    chunkContent(content) {
        const chunks = [];
        const chunkSize = 4000; // Characters per chunk
        const overlap = 500; // Overlap between chunks
        
        for (let i = 0; i < content.length; i += (chunkSize - overlap)) {
            const chunk = content.substring(i, i + chunkSize);
            if (chunk.trim().length > 100) {
                chunks.push({
                    index: chunks.length,
                    text: chunk,
                    startPos: i,
                    endPos: Math.min(i + chunkSize, content.length)
                });
            }
        }
        
        console.log(`📄 Content chunked into ${chunks.length} segments for processing`);
        return chunks;
    }

    /**
     * Extract main document topic/title first
     */
    async extractMainDocumentTopic(content) {
        const contentSample = content.substring(0, 15000);
        
        const prompt = `Analyze this educational document and extract:
1. The MAIN SUBJECT/TOPIC of this entire document (one key subject)
2. A brief summary of what this document teaches

Content sample:
"""
${contentSample}
"""

Return ONLY this JSON (no other text):
{
  "mainTopic": "The single most important subject this document teaches",
  "mainTopicAlternatives": ["related subject 1", "related subject 2"],
  "documentFocus": "Brief description of what this document focuses on",
  "contentType": "type of content (tutorial, textbook, course, guide, etc)"
}`;

        try {
            const result = await this.getContentWithTimeout(prompt, 15000);
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                console.log(`✅ Main Document Topic: "${data.mainTopic}"`);
                return data;
            }
        } catch (error) {
            console.warn('⚠️ Main topic extraction failed:', error.message);
        }
        
        return {
            mainTopic: 'Learning Subject',
            mainTopicAlternatives: [],
            documentFocus: 'Educational content',
            contentType: 'course'
        };
    }

    /**
     * Extract ALL unique topics from content with comprehensive analysis
     * @param {string} content - The PDF content
     * @param {number} numPhases - Number of phases to generate topics for
     * @returns {Promise<Object>} - Object with topics organized by phase
     */
    async extractComprehensiveTopics(content, numPhases = 3) {
        // Store chunks for later use
        this.contentChunks = this.chunkContent(content);
        
        // First extract the main document topic
        const mainTopicData = await this.extractMainDocumentTopic(content);
        
        // Use more content and multiple samples for better extraction
        const contentSample = content.substring(0, 20000);
        
        const prompt = `Extract learning topics from this "${mainTopicData.mainTopic}" document for ${numPhases} learning phases.

REQUIREMENTS:
- Phase 1: 5-6 FOUNDATIONAL topics (basics, definitions, core principles)
- Phase 2: 5-6 INTERMEDIATE topics (completely different from Phase 1)
- Phase 3: 5-6 ADVANCED topics (completely different from Phases 1&2)
- ALL topic names MUST appear exactly in the content below
- NO generic names like "Introduction", "Overview", "Basics"
- Each phase must have DIFFERENT topics

Content sample:
${contentSample}

RETURN ONLY THIS JSON (no markdown, no extra text):
{
  "documentTitle": "${mainTopicData.mainTopic}",
  "phase1Topics": [
    {"name": "TopicName", "description": "brief description", "difficulty": "easy", "keyTerms": ["term1", "term2"]}
  ],
  "phase2Topics": [
    {"name": "DifferentTopic", "description": "brief description", "difficulty": "medium", "keyTerms": ["term1", "term2"]}
  ],
  "phase3Topics": [
    {"name": "AdvancedTopic", "description": "brief description", "difficulty": "hard", "keyTerms": ["term1", "term2"]}
  ]
}`;

        try {
            console.log('🔍 Extracting topics for:', mainTopicData.mainTopic);
            const result = await this.getContentWithTimeout(prompt, 30000);
            
            // Clean up response - remove markdown code blocks and extra whitespace
            let cleanedResult = result.trim();
            if (cleanedResult.startsWith('```json')) cleanedResult = cleanedResult.replace('```json', '').replace('```', '');
            if (cleanedResult.startsWith('```')) cleanedResult = cleanedResult.replace('```', '').replace('```', '');
            cleanedResult = cleanedResult.trim();
            
            // Extract JSON object - more robust matching
            const jsonMatch = cleanedResult.match(/\{[\s\S]*\}/) || cleanedResult.match(/\{[\s\S]*?}\s*$/);
            
            if (!jsonMatch) {
                console.warn('⚠️ No JSON found in response');
                return await this.extractTopicsFallback(content, numPhases, mainTopicData);
            }
            
            try {
                const topicsData = JSON.parse(jsonMatch[0]);
                
                // Validate we have topics for each phase
                const hasPhase1 = topicsData.phase1Topics && Array.isArray(topicsData.phase1Topics) && topicsData.phase1Topics.length > 0;
                const hasPhase2 = topicsData.phase2Topics && Array.isArray(topicsData.phase2Topics) && topicsData.phase2Topics.length > 0;
                const hasPhase3 = topicsData.phase3Topics && Array.isArray(topicsData.phase3Topics) && topicsData.phase3Topics.length > 0;
                
                if (!hasPhase1 || !hasPhase2 || !hasPhase3) {
                    console.warn('⚠️ Missing topics in one or more phases');
                    return await this.extractTopicsFallback(content, numPhases, mainTopicData);
                }
                
                const allTopics = [
                    ...topicsData.phase1Topics,
                    ...topicsData.phase2Topics,
                    ...topicsData.phase3Topics
                ];
                
                if (allTopics.length < numPhases * 3) {
                    console.warn('⚠️ Not enough topics extracted');
                    return await this.extractTopicsFallback(content, numPhases, mainTopicData);
                }
                
                console.log(`✅ Extracted ${allTopics.length} unique topics across ${numPhases} phases`);
                
                return this.formatExtractedTopics(topicsData, numPhases);
                
            } catch (parseError) {
                console.warn('⚠️ JSON parsing error:', parseError.message);
                console.warn('Response was:', jsonMatch[0].substring(0, 200));
                return await this.extractTopicsFallback(content, numPhases, mainTopicData);
            }
        } catch (error) {
            console.error('❌ Topic extraction error:', error.message);
            return await this.extractTopicsFallback(content, numPhases, mainTopicData);
        }
    }

    /**
     * Fallback: Extract topics phase by phase using improved keyword extraction
     */
    async extractTopicsFallback(content, numPhases, mainTopicData = null) {
        console.log('🔄 Using improved fallback: extracting topics from content keywords...');
        
        const mainTopic = mainTopicData?.mainTopic || 'Learning Subject';
        
        // Extract headers and sections from content
        const sections = this.extractSectionsFromContent(content);
        
        // Phase templates
        const phasePrompts = [
            { name: 'Foundation', difficulty: 'easy', focus: 'fundamental concepts, core theory, basics, terminology' },
            { name: 'Application', difficulty: 'medium', focus: 'practical methods, techniques, implementations, real-world use' },
            { name: 'Mastery', difficulty: 'hard', focus: 'advanced strategies, optimization, synthesis, complex scenarios' }
        ];
        
        const phaseTopics = {};
        const contentLength = content.length;
        const chunkSize = Math.floor(contentLength / numPhases);
        
        for (let i = 0; i < numPhases; i++) {
            const phasePrompt = phasePrompts[i] || phasePrompts[0];
            const startPos = i * chunkSize;
            const contentSample = content.substring(startPos, startPos + 10000);
            
            const prompt = `From this "${mainTopic}" content about ${phasePrompt.focus}, extract 5-6 ACTUAL topic names that appear IN THE TEXT.

Topics must be:
- Real phrases/concepts found in the content
- UNIQUE (different from other phases' topics)
- Specific and technical (not "Introduction" or "Overview")
- Ordered from most to least important

Content to analyze:
${contentSample}

Return ONLY this JSON array (no markdown):
[
  {"name": "ActualTopicFromContent", "description": "What it covers", "difficulty": "${phasePrompt.difficulty}", "keyTerms": ["real_term1", "real_term2"]}
]`;

            try {
                const result = await this.getContentWithTimeout(prompt, 15000);
                
                // Clean response
                let cleanedResult = result.trim();
                if (cleanedResult.startsWith('```')) cleanedResult = cleanedResult.substring(3).replace(/```/g, '');
                
                const jsonMatch = cleanedResult.match(/\[[\s\S]*\]/);
                
                if (jsonMatch) {
                    const topics = JSON.parse(jsonMatch[0]);
                    if (Array.isArray(topics) && topics.length > 0) {
                        phaseTopics[`phase${i + 1}Topics`] = topics.slice(0, 6).map((t, idx) => ({
                            id: `topic_p${i + 1}_${idx + 1}`,
                            name: t.name?.trim() || `Topic ${idx + 1}`,
                            description: t.description?.trim() || 'Key concept in ' + mainTopic,
                            difficulty: t.difficulty || phasePrompt.difficulty,
                            importance: idx < 2 ? 'critical' : 'important',
                            keyTerms: Array.isArray(t.keyTerms) ? t.keyTerms : []
                        }));
                        console.log(`   ✅ Phase ${i + 1}: ${phaseTopics[`phase${i + 1}Topics`].length} topics extracted`);
                    }
                }
            } catch (err) {
                console.warn(`   ⚠️ Phase ${i + 1} extraction error:`, err.message);
                
                // Use keyword-based extraction as last resort
                const keywordTopics = this.extractTopicsFromKeywords(contentSample, mainTopic, 5);
                phaseTopics[`phase${i + 1}Topics`] = keywordTopics.map((name, idx) => ({
                    id: `topic_p${i + 1}_${idx + 1}`,
                    name: name,
                    description: `Important concept in ${mainTopic}`,
                    difficulty: phasePrompt.difficulty,
                    importance: 'important',
                    keyTerms: []
                }));
                console.log(`   ✅ Phase ${i + 1}: ${phaseTopics[`phase${i + 1}Topics`].length} topics (keyword extraction)`);
            }
        }
        
        // Ensure all phases have topics
        for (let i = 1; i <= numPhases; i++) {
            if (!phaseTopics[`phase${i}Topics`] || phaseTopics[`phase${i}Topics`].length === 0) {
                console.log(`   ℹ️ Phase ${i} had no topics, using default topics`);
                const phasePrompt = phasePrompts[i - 1] || phasePrompts[0];
                phaseTopics[`phase${i}Topics`] = [
                    {
                        id: `topic_p${i}_1`,
                        name: `${mainTopic} - ${phasePrompt.name} Concepts`,
                        description: `Learn ${phasePrompt.focus.split(',')[0]} of ${mainTopic}`,
                        difficulty: phasePrompt.difficulty,
                        importance: 'critical',
                        keyTerms: []
                    },
                    {
                        id: `topic_p${i}_2`,
                        name: `${mainTopic} - ${phasePrompt.focus.split(',')[1] || 'Key Methods'}`,
                        description: `Understand the ${phasePrompt.focus.split(',')[1] || 'methods'} in ${mainTopic}`,
                        difficulty: phasePrompt.difficulty,
                        importance: 'important',
                        keyTerms: []
                    }
                ];
            }
        }
        
        return this.formatExtractedTopics({ 
            ...phaseTopics, 
            documentTitle: mainTopic,
            mainTopicData 
        }, numPhases);
    }

    /**
     * Extract topics using keyword analysis
     */
    extractTopicsFromKeywords(content, mainTopic, count = 5) {
        // Split into sentences and filter significant phrases
        const sentences = content.split(/[.!?]\s+/).filter(s => s.length > 20);
        const capitalizedPhrases = new Set();
        
        sentences.forEach(sentence => {
            // Find capitalized phrases that might be concepts
            const matches = sentence.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g) || [];
            matches.forEach(match => {
                if (match.length > 3 && match !== mainTopic) {
                    capitalizedPhrases.add(match);
                }
            });
        });
        
        const topicsArray = Array.from(capitalizedPhrases)
            .filter(phrase => phrase.split(' ').length <= 4)
            .slice(0, count);
        
        return topicsArray.length > 0 ? topicsArray : [`${mainTopic} Concepts`, `${mainTopic} Applications`, `${mainTopic} Analysis`];
    }

    /**
     * Extract sections/headers from content
     */
    extractSectionsFromContent(content) {
        const sections = [];
        // Look for common header patterns
        const headerPatterns = [
            /^#{1,4}\s+(.+)$/gm, // Markdown headers
            /^(\w[\w\s]{5,}:)$/gm, // Sections ending with colon
            /^(Chapter|Section|Unit|Part|Module)\s+[\d\w]+.{0,30}$/gm // Chapter/section headers
        ];
        
        headerPatterns.forEach(pattern => {
            const matches = content.match(pattern) || [];
            sections.push(...matches);
        });
        
        return sections.slice(0, 20);
    }

    /**
     * Format extracted topics into consistent structure
     */
    formatExtractedTopics(topicsData, numPhases) {
        const result = {
            documentTitle: topicsData.documentTitle || 'Learning Document',
            allTopics: [],
            topicsByPhase: {}
        };
        
        for (let i = 1; i <= numPhases; i++) {
            const phaseKey = `phase${i}Topics`;
            const phaseTopicArray = (topicsData[phaseKey] || []);
            
            // Ensure each topic has required fields and proper formatting
            const formattedTopics = phaseTopicArray
                .filter(t => t && t.name) // Filter out invalid entries
                .map((t, idx) => ({
                    id: t.id || `topic_p${i}_${idx + 1}`,
                    name: String(t.name).trim(),
                    description: String(t.description || 'Key concept').trim(),
                    difficulty: t.difficulty || 'medium',
                    importance: t.importance || (idx < 2 ? 'critical' : 'important'),
                    keyTerms: Array.isArray(t.keyTerms) ? t.keyTerms.map(kt => String(kt).trim()) : [],
                    phase: i
                }));
            
            result.topicsByPhase[i] = formattedTopics;
            result.allTopics.push(...formattedTopics);
        }
        
        return result;
    }

    async getContentWithTimeout(prompt, timeoutMs = 30000) {
        try {
            const response = await Promise.race([
                this.model.generateContent(prompt).then(result => result.response.text().trim()),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('API timeout after ' + timeoutMs + 'ms')), timeoutMs)
                )
            ]);
            
            if (!response || response.length === 0) {
                throw new Error('Empty API response');
            }
            
            return response;
        } catch (error) {
            console.error('🚨 Gemini API error:', error.message);
            throw error;
        }
    }

    /**
     * Generate context-aware phase names based on main document topic
     */
    async generateContextualPhaseNames(mainTopic, learnerLevel, content) {
        const contentSample = content.substring(0, 8000);
        
        const prompt = `You are designing a learning roadmap for "${mainTopic}".

Create ${learnerLevel === 'beginner' ? 3 : 4} phase NAMES and OBJECTIVES specific to teach "${mainTopic}".

Each phase should:
1. Be specifically about "${mainTopic}" (not generic)
2. Progress: foundation → application → mastery
3. Have descriptive, domain-specific names

Example: If topic is "Machine Learning":
- Phase 1: "ML Foundations & Core Algorithms"
- Phase 2: "Advanced Techniques & Applications"
- Phase 3: "Real-world ML Projects"

Content sample:
${contentSample}

Return ONLY JSON (no markdown or explanation):
{
  "phases": [
    {
      "name": "Phase name specific to ${mainTopic}",
      "objective": "What students will achieve",
      "focus": "Key focus area"
    }
  ]
}`;

        try {
            const result = await this.getContentWithTimeout(prompt, 15000);
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                if (data.phases && Array.isArray(data.phases)) {
                    console.log('✅ Generated contextual phase names');
                    return data.phases;
                }
            }
        } catch (error) {
            console.warn('⚠️ Failed to generate contextual phase names:', error.message);
        }
        
        // Fallback
        return [
            { name: `${mainTopic} Basics`, objective: 'Master foundational concepts', focus: 'foundations' },
            { name: `${mainTopic} in Practice`, objective: 'Apply concepts in real scenarios', focus: 'application' },
            { name: `${mainTopic} Mastery`, objective: 'Achieve expert-level understanding', focus: 'mastery' }
        ];
    }

    /**
     * Generate phases with phase-specific topics
     */
    async generatePhasesWithTopics(topicsData, learnerLevel = 'beginner', content = '') {
        const numPhases = learnerLevel === 'beginner' ? 3 : learnerLevel === 'intermediate' ? 4 : 4;
        const mainTopic = topicsData.documentTitle || 'Learning Subject';
        
        // Generate contextual phase names instead of generic templates
        const generatedPhaseNames = await this.generateContextualPhaseNames(mainTopic, learnerLevel, content);
        
        const phases = [];

        for (let i = 0; i < Math.min(numPhases, generatedPhaseNames.length); i++) {
            const phaseTemplate = generatedPhaseNames[i];
            const phaseTopics = topicsData.topicsByPhase[i + 1] || [];
            
            // Generate detailed phase description using AI if we have content
            let phaseDescription = `Learn and apply concepts: ${phaseTopics.map(t => t.name).join(', ')}`;
            
            if (content && phaseTopics.length > 0) {
                try {
                    const descPrompt = `Write a 1-2 sentence description for a learning phase called "${phaseTemplate.name}" with objective: "${phaseTemplate.objective}".
Topics covered: ${phaseTopics.map(t => t.name).join(', ')}.
Keep it specific and inspiring.
Return ONLY the description text.`;
                    
                    const desc = await this.getContentWithTimeout(descPrompt, 10000);
                    if (desc && desc.length > 20) {
                        phaseDescription = desc.replace(/^["']|["']$/g, '').trim();
                    }
                } catch (e) {
                    // Use default description
                }
            }

            phases.push({
                phaseId: `phase_${i + 1}`,
                phaseName: phaseTemplate.name,
                phaseDescription: phaseDescription,
                phaseObjective: phaseTemplate.objective,
                estimatedDuration: learnerLevel === 'advanced' ? '12 hours' : '8 hours',
                completionCriteria: `Complete all modules and pass the ${phaseTemplate.name} quiz`,
                phaseTopics: phaseTopics, // UNIQUE topics for THIS phase only
                summary: phaseTopics.length > 0 
                    ? `Covers: ${phaseTopics.slice(0, 3).map(t => t.name).join(', ')}`
                    : `${phaseTemplate.focus} concepts and skills`
            });
        }

        console.log(`✅ Generated ${phases.length} contextual phases for "${mainTopic}"`);
        phases.forEach((p, i) => console.log(`   Phase ${i+1}: ${p.phaseName}`));
        return phases;
    }

    /**
     * Generate modules for a specific phase using ITS OWN topics
     */
    async generateModulesForPhaseWithTopics(phase, content = '') {
        const phaseTopics = phase.phaseTopics || [];
        const phaseName = phase.phaseName;
        
        if (phaseTopics.length === 0) {
            console.warn(`⚠️ No topics for phase: ${phaseName}, using basic modules`);
            return this.getBasicModules(phaseName);
        }

        // Determine number of modules based on topic count
        // Always create 2-3 modules per phase for better structure
        const modulesCount = Math.max(2, Math.min(3, Math.ceil(phaseTopics.length / 2)));
        const topicsPerModule = Math.ceil(phaseTopics.length / modulesCount);
        
        const moduleTemplates = [
            { suffix: 'Core Concepts', desc: 'Build foundational understanding', difficulty: 'easy' },
            { suffix: 'Deep Dive', desc: 'Explore concepts in greater detail', difficulty: 'medium' },
            { suffix: 'Practical Application', desc: 'Apply learned concepts through practice', difficulty: 'medium' }
        ];

        const modules = [];
        
        for (let i = 0; i < modulesCount; i++) {
            const template = moduleTemplates[i];
            const startIdx = i * topicsPerModule;
            const moduleTopics = phaseTopics.slice(startIdx, startIdx + topicsPerModule);
            
            // Skip only if we have no topics AND already have some modules
            if (moduleTopics.length === 0 && modules.length > 0) {
                console.log(`   ℹ️ Module ${i + 1}: Skipped (no more topics available)`);
                continue;
            }
            
            // If no module topics, create a default one for this module slot
            if (moduleTopics.length === 0) {
                const topicName = `${phaseName} Topics`;
                modules.push({
                    moduleId: `mod_${phase.phaseId}_${i + 1}`,
                    moduleTitle: `${phaseName}: ${template.suffix}`,
                    moduleDescription: template.desc,
                    topicsCovered: [topicName],
                    topicsData: [{
                        name: topicName,
                        description: template.desc,
                        difficulty: template.difficulty,
                        keyTerms: []
                    }],
                    estimatedTime: '2-3 hours',
                    difficulty: template.difficulty,
                    lessons: [],
                    assessment: {
                        type: 'quiz',
                        description: `Quiz on ${topicName}`,
                        topicsToAssess: [topicName],
                        questions: []
                    }
                });
                console.log(`   📚 Module ${i + 1}: ${modules[modules.length - 1].moduleTitle} (default)`);
                continue;
            }

            const topicNames = moduleTopics.map(t => t.name);
            
            // Generate module description using AI
            let moduleDescription = template.desc;
            if (content && topicNames.length > 0) {
                try {
                    const descPrompt = `Write a single sentence description for a learning module covering: ${topicNames.join(', ')}.
Focus: ${template.desc}
Return ONLY the description text.`;
                    const desc = await this.getContentWithTimeout(descPrompt, 8000);
                    if (desc && desc.length > 15) {
                        moduleDescription = desc.replace(/^["']|["']$/g, '').trim();
                    }
                } catch (e) {
                    // Use default description
                }
            }

            modules.push({
                moduleId: `mod_${phase.phaseId}_${i + 1}`,
                moduleTitle: `${phaseName}: ${topicNames[0]}${topicNames.length > 1 ? ' & More' : ''}`,
                moduleDescription: moduleDescription,
                topicsCovered: topicNames, // UNIQUE topics for THIS module
                topicsData: moduleTopics, // Full topic objects with keyTerms
                estimatedTime: '2-3 hours',
                difficulty: template.difficulty,
                lessons: [],
                assessment: {
                    type: 'quiz',
                    description: `Quiz on ${topicNames.join(', ')}`,
                    topicsToAssess: topicNames,
                    questions: []
                }
            });
            console.log(`   📚 Module ${i + 1}: ${modules[modules.length - 1].moduleTitle}`);
        }

        if (modules.length === 0) {
            console.warn(`⚠️ No modules created even with topics, using default`);
            return this.getBasicModules(phaseName);
        }

        console.log(`   ✅ Created ${modules.length} modules for ${phaseName}`);
        return modules;
    }

    getBasicModules(phaseName) {
        return [{
            moduleId: 'mod_basic_1',
            moduleTitle: `${phaseName}: Overview`,
            moduleDescription: 'Introduction to core concepts',
            topicsCovered: ['Core Concepts'],
            estimatedTime: '2-3 hours',
            difficulty: 'medium',
            lessons: [],
            assessment: { type: 'quiz', description: 'Assessment', questions: [] }
        }];
    }

    /**
     * Generate learning outcomes using AI
     */
    async generateLearningOutcomes(topics, content) {
        try {
            const topicNames = topics.map(t => t.name).join(', ');
            const contentSnippet = content.substring(0, 3000);
            
            const prompt = `Based on this content about ${topicNames}, generate 4-5 specific learning outcomes.

Content:
${contentSnippet}

Return JSON array:
[
  {"outcome": "Specific skill or knowledge gained", "description": "Detailed description of what learner will achieve"}
]

Requirements:
- Outcomes should be specific and measurable
- Based on actual content, not generic
- Cover different levels: understanding, application, analysis

Return ONLY valid JSON array.`;

            const result = await this.getContentWithTimeout(prompt, 10000);
            const jsonMatch = result.match(/\[[\s\S]*\]/);
            
            if (jsonMatch) {
                const outcomes = JSON.parse(jsonMatch[0]);
                return outcomes.slice(0, 5).map(o => ({
                    outcome: o.outcome || 'Learning outcome',
                    description: o.description || 'Description'
                }));
            }
        } catch (error) {
            console.warn('Learning outcomes generation failed:', error.message);
        }
        
        // Fallback
        return [
            { outcome: 'Understand core concepts', description: 'Master fundamental ideas and principles' },
            { outcome: 'Apply knowledge practically', description: 'Use learned concepts in real scenarios' },
            { outcome: 'Analyze and evaluate', description: 'Think critically about the subject matter' }
        ];
    }
    
    getDefaultLessonsWithNames(topicNames, phaseName) {
        const lessons = [];
        const lessonTemplates = [
            { prefix: 'Introduction to', verb: 'Learn the fundamentals and key concepts' },
            { prefix: 'Understanding', verb: 'Deep dive into the principles and theory' },
            { prefix: 'Applying', verb: 'Practice applying concepts in real scenarios' }
        ];
        
        for (let i = 0; i < 3; i++) {
            const template = lessonTemplates[i];
            const topicName = topicNames[i % topicNames.length] || phaseName;
            
            lessons.push({
                lessonId: `les_${i + 1}`,
                lessonTitle: `${template.prefix} ${topicName}`,
                lessonContent: `${template.verb} of ${topicName}. This lesson covers essential aspects that will help you master this topic.`,
                orderInModule: i + 1,
                duration: '20-30 minutes',
                keyPoints: [
                    `Key aspect of ${topicName}`,
                    `Important principle related to ${topicName}`,
                    `Best practices for ${topicName}`
                ],
                resources: [`Study guide for ${topicName}`, `Reference materials`],
                prerequisites: i > 0 ? [`Previous lesson completion`] : [],
                practiceActivities: [
                    { activity: `${topicName} Exercise`, description: `Practice what you learned about ${topicName}` }
                ]
            });
        }
        return lessons;
    }

    /**
     * Generate lessons with real AI content from PDF
     * @param {Object} module - Module info
     * @param {string} phaseObjective - Phase objective
     * @param {number} lessonCount - Number of lessons
     * @param {number} phaseIdx - Phase index for unique IDs
     * @param {number} modIdx - Module index for unique IDs
     * @param {string} content - PDF content for AI generation
     */
    async generateLessonsForModule(module, phaseObjective, lessonCount = 3, phaseIdx = 0, modIdx = 0, content = '') {
        const topicNames = module.topicsCovered || ['Core Concepts'];
        const moduleTitle = module.moduleTitle || 'Learning Module';
        
        // Try to generate with AI if content is available
        if (content && content.length > 100) {
            try {
                const lessons = await this.generateLessonsWithAI(
                    topicNames, 
                    moduleTitle, 
                    phaseObjective, 
                    lessonCount, 
                    phaseIdx, 
                    modIdx, 
                    content
                );
                if (lessons && lessons.length > 0) {
                    return lessons;
                }
            } catch (error) {
                console.warn('AI lesson generation failed, using enhanced defaults:', error.message);
            }
        }
        
        // Fallback to enhanced template-based lessons with unique IDs
        return this.getEnhancedDefaultLessons(topicNames, moduleTitle, lessonCount, phaseIdx, modIdx);
    }

    /**
     * Generate lessons using Gemini AI with real PDF content
     */
    async generateLessonsWithAI(topicNames, moduleTitle, phaseObjective, lessonCount, phaseIdx, modIdx, content) {
        const topicsStr = topicNames.join(', ');
        const contentSnippet = content.substring(0, 8000); // Limit content size
        
        const prompt = `Based on this educational content, generate ${lessonCount} detailed lessons for the module "${moduleTitle}".

Topics to cover: ${topicsStr}
Module Objective: ${phaseObjective}

Source Content:
${contentSnippet}

Generate exactly ${lessonCount} lessons as JSON array:
[
  {
    "lessonTitle": "Specific descriptive title based on actual content",
    "lessonContent": "2-3 paragraph detailed explanation using concepts from the source content. Include definitions, examples, and key insights.",
    "keyPoints": ["Specific key point 1 from content", "Specific key point 2", "Specific key point 3"],
    "practiceActivities": [
      {"activity": "Activity Name", "description": "Detailed activity description based on content"}
    ]
  }
]

Requirements:
- Use ACTUAL concepts, terms, and examples from the source content
- Lesson titles should be specific (e.g., "Understanding Decision Trees and Classification" not "Lesson 1")
- Key points should be real insights, not generic placeholders
- Content should be educational and comprehensive
- Each lesson builds on previous ones

Return ONLY valid JSON array.`;

        console.log(`🤖 Generating AI lessons for: ${moduleTitle}...`);
        const result = await this.getContentWithTimeout(prompt, 20000);
        
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('No JSON found in AI response');
        }
        
        const aiLessons = JSON.parse(jsonMatch[0]);
        
        return aiLessons.map((lesson, idx) => ({
            lessonId: `les_${phaseIdx + 1}_${modIdx + 1}_${idx + 1}`,
            lessonTitle: lesson.lessonTitle || `${topicNames[idx % topicNames.length]} Essentials`,
            lessonContent: lesson.lessonContent || 'Content not available',
            orderInModule: idx + 1,
            duration: '20-30 minutes',
            keyPoints: Array.isArray(lesson.keyPoints) ? lesson.keyPoints : ['Key concept covered'],
            resources: [`Study materials for ${topicNames[idx % topicNames.length]}`],
            prerequisites: idx > 0 ? ['Complete previous lesson'] : [],
            practiceActivities: Array.isArray(lesson.practiceActivities) 
                ? lesson.practiceActivities 
                : [{ activity: 'Practice Exercise', description: 'Apply what you learned' }]
        }));
    }

    /**
     * Enhanced default lessons with unique IDs (fallback)
     */
    getEnhancedDefaultLessons(topicNames, moduleTitle, lessonCount, phaseIdx, modIdx) {
        const lessons = [];
        const lessonTemplates = [
            { prefix: 'Introduction to', verb: 'Learn the fundamentals and key concepts', complexity: 'foundational' },
            { prefix: 'Deep Dive into', verb: 'Explore detailed principles and theory', complexity: 'intermediate' },
            { prefix: 'Applying', verb: 'Practice implementing concepts in real scenarios', complexity: 'applied' },
            { prefix: 'Mastering', verb: 'Advanced techniques and optimization strategies', complexity: 'advanced' }
        ];
        
        for (let i = 0; i < lessonCount; i++) {
            const template = lessonTemplates[i % lessonTemplates.length];
            const topicName = topicNames[i % topicNames.length] || 'Key Concepts';
            
            lessons.push({
                lessonId: `les_${phaseIdx + 1}_${modIdx + 1}_${i + 1}`,
                lessonTitle: `${template.prefix} ${topicName}`,
                lessonContent: `${template.verb} of ${topicName}. This lesson covers essential aspects including definitions, principles, and practical applications.`,
                orderInModule: i + 1,
                duration: '20-30 minutes',
                keyPoints: [
                    `Core principles of ${topicName}`,
                    `Key techniques in ${topicName}`,
                    `Best practices for ${topicName}`
                ],
                resources: [`Study guide for ${topicName}`],
                prerequisites: i > 0 ? ['Complete previous lesson'] : [],
                practiceActivities: [
                    { activity: `${topicName} Exercise`, description: `Practice applying ${topicName} concepts` }
                ]
            });
        }
        return lessons;
    }

    /**
     * Assemble complete learning path from phases - DEPRECATED, use generateEnhancedRoadmap
     */
    async assembleCompleteLearningPath(phases, topics, learnerLevel) {
        console.log('🔗 Assembling complete learning path (legacy)...');
        return phases; // Now handled by generateEnhancedRoadmap
    }

    /**
     * Generate complete enhanced roadmap with unique topics per phase
     */
    async generateEnhancedRoadmap(content, learnerLevel = 'beginner') {
        try {
            console.log('\n========== ROADMAP GENERATION STARTED ==========');
            console.log(`📘 Content length: ${content.length} characters`);
            console.log(`📊 Learner level: ${learnerLevel}`);
            
            // Step 0: Extract main document topic for context
            console.log(`\n🎯 Step 0: Identifying main document topic...`);
            const mainDocumentTopic = await this.extractMainDocumentTopic(content);
            console.log(`✅ Main Topic: "${mainDocumentTopic.mainTopic}"`);
            console.log(`   Content Focus: ${mainDocumentTopic.documentFocus}`);
            
            const numPhases = learnerLevel === 'beginner' ? 3 : 4;
            
            // Step 1: Extract comprehensive topics with phase-specific organization
            console.log(`\n📚 Step 1: Extracting topics for ${numPhases} phases about "${mainDocumentTopic.mainTopic}"...`);
            const topicsData = await this.extractComprehensiveTopics(content, numPhases);
            console.log(`✅ Document: "${topicsData.documentTitle}"`);
            console.log(`✅ Total unique topics: ${topicsData.allTopics.length}`);
            
            for (let i = 1; i <= numPhases; i++) {
                const phaseTopics = topicsData.topicsByPhase[i] || [];
                console.log(`   Phase ${i}: ${phaseTopics.length} topics - ${phaseTopics.map(t => t.name).join(', ')}`);
            }
            
            // Step 2: Generate contextual phases with their unique topics
            console.log(`\n🎯 Step 2: Generating ${numPhases} contextual phases...`);
            const phases = await this.generatePhasesWithTopics(topicsData, learnerLevel, content);
            console.log(`✅ Created ${phases.length} contextual phases specific to "${mainDocumentTopic.mainTopic}"`);
            
            // Step 3: Build learning path with modules and lessons
            console.log(`\n🔗 Step 3: Building learning structure with real content...`);
            const learningPath = [];
            const lessonsPerModule = learnerLevel === 'beginner' ? 3 : 4;
            
            for (let phaseIdx = 0; phaseIdx < phases.length; phaseIdx++) {
                const phase = phases[phaseIdx];
                console.log(`\n  📍 Phase ${phaseIdx + 1}: ${phase.phaseName}`);
                console.log(`     Objective: ${phase.phaseObjective}`);
                console.log(`     Topics (${phase.phaseTopics?.length}): ${phase.phaseTopics?.map(t => t.name).join(', ') || 'None'}`);
                
                // Generate modules using THIS PHASE's unique topics
                const modules = await this.generateModulesForPhaseWithTopics(phase, content);
                
                // Generate AI lessons for each module
                for (let modIdx = 0; modIdx < modules.length; modIdx++) {
                    const module = modules[modIdx];
                    
                    console.log(`     📚 Module ${modIdx + 1}: ${module.moduleTitle}`);
                    console.log(`        Topics: ${module.topicsCovered.join(', ')}`);
                    
                    // Get relevant content for this module's topics
                    const moduleContent = this.getRelevantContentForTopics(module.topicsCovered, content);
                    
                    module.lessons = await this.generateLessonsForModule(
                        module,
                        phase.phaseObjective,
                        lessonsPerModule,
                        phaseIdx,
                        modIdx,
                        moduleContent
                    );
                }
                
                phase.modules = modules;
                learningPath.push(phase);
            }
            console.log(`\n✅ Built learning path with phase-unique topics and real content`);
            
            // Step 4: Add quiz metadata - quizzes are now tied to phase-specific topics
            console.log(`\n📝 Step 4: Adding phase-specific quiz metadata...`);
            const pathWithQuizzes = this.addQuizMetadataWithPhaseTopics(learningPath);
            console.log(`✅ Quiz metadata added (quizzes tied to phase topics)`);
            
            // Study timeline
            const totalHours = learnerLevel === 'beginner' ? 24 : learnerLevel === 'intermediate' ? 36 : 48;
            const hoursPerPhase = Math.round(totalHours / pathWithQuizzes.length);
            const phaseBreakdown = pathWithQuizzes.map((phase) => ({
                phase: `${phase.phaseName}`,
                hours: hoursPerPhase,
                percentage: Math.round((hoursPerPhase / totalHours) * 100)
            }));
            
            // Generate AI-powered learning outcomes
            console.log(`\n🎯 Step 5: Generating learning outcomes for "${mainDocumentTopic.mainTopic}"...`);
            const learningOutcomes = await this.generateLearningOutcomes(topicsData.allTopics, content);
            
            console.log(`\n📊 Step 6: Finalizing roadmap for "${mainDocumentTopic.mainTopic}"...`);
            
            const enhancedRoadmap = {
                completed: false,
                mainDocumentTopic: mainDocumentTopic.mainTopic,
                documentTitle: topicsData.documentTitle || mainDocumentTopic.mainTopic,
                mainTopics: topicsData.allTopics,
                topicsByPhase: topicsData.topicsByPhase,
                learningPath: pathWithQuizzes,
                finalQuiz: this.createFinalQuizMetadataEnhanced(pathWithQuizzes, topicsData),
                prerequisites: [],
                learningOutcomes: learningOutcomes,
                studyTimeline: {
                    totalEstimatedHours: totalHours,
                    recommendedPacePerWeek: learnerLevel === 'beginner' ? '4-6 hours' : '6-8 hours',
                    phaseBreakdown: phaseBreakdown
                },
                progressTracking: {
                    currentPhase: 0,
                    completedModules: [],
                    completedLessons: [],
                    completedQuizzes: [],
                    overallProgress: 0,
                    overallQuizScore: 0
                },
                quizStatistics: {
                    totalModuleQuizzes: pathWithQuizzes.reduce((sum, p) => sum + (p.quizzes?.moduleQuizzes?.length || 0), 0),
                    totalPhaseQuizzes: pathWithQuizzes.length,
                    hasFinalQuiz: true,
                    totalQuestionsEstimate: (pathWithQuizzes.reduce((sum, p) => sum + (p.quizzes?.moduleQuizzes?.length || 0), 0) * 12) + (pathWithQuizzes.length * 30) + 30
                }
            };

            const totalModules = pathWithQuizzes.reduce((sum, p) => sum + (p.modules?.length || 0), 0);
            const totalLessons = pathWithQuizzes.reduce((sum, p) => {
                return sum + (p.modules?.reduce((mSum, m) => mSum + (m.lessons?.length || 0), 0) || 0);
            }, 0);

            console.log(`\n✅ Roadmap generation complete!`);
            console.log(`   Main Topic: "${mainDocumentTopic.mainTopic}"`);
            console.log(`   Document: ${topicsData.documentTitle}`);
            console.log(`   Total Topics: ${topicsData.allTopics.length}`);
            console.log(`   Phases: ${pathWithQuizzes.length}`);
            console.log(`   Modules: ${totalModules}`);
            console.log(`   Lessons: ${totalLessons}`);
            console.log(`   Each phase has UNIQUE topics (no repetition)`);
            console.log('========== ROADMAP GENERATION COMPLETE ==========\n');

            return enhancedRoadmap;
        } catch (error) {
            console.error('❌ Roadmap generation failed:', error.message);
            console.error(error.stack);
            // Return basic roadmap as fallback
            return this.getBasicFallbackRoadmap(learnerLevel);
        }
    }

    /**
     * Get relevant content snippets for specific topics (RAG-like retrieval)
     */
    getRelevantContentForTopics(topicNames, content) {
        if (!this.contentChunks || this.contentChunks.length === 0) {
            return content.substring(0, 12000);
        }
        
        // Score each chunk based on topic keyword matches
        const scoredChunks = this.contentChunks.map(chunk => {
            let score = 0;
            const lowerText = chunk.text.toLowerCase();
            
            for (const topic of topicNames) {
                const topicWords = topic.toLowerCase().split(/\s+/);
                for (const word of topicWords) {
                    if (word.length > 3 && lowerText.includes(word)) {
                        score += 1;
                    }
                }
            }
            
            return { ...chunk, score };
        });
        
        // Get top 3 most relevant chunks
        const topChunks = scoredChunks
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(c => c.text);
        
        return topChunks.join('\n\n---\n\n');
    }

    /**
     * Add quiz metadata with phase-specific topics
     */
    addQuizMetadataWithPhaseTopics(learningPath) {
        return learningPath.map((phase, phaseIdx) => {
            // Get unique topics for THIS phase only
            const phaseTopicNames = phase.phaseTopics?.map(t => t.name) || [];
            
            return {
                ...phase,
                quizzes: {
                    moduleQuizzes: phase.modules?.map((module, modIdx) => ({
                        moduleId: module.moduleId,
                        moduleName: module.moduleTitle,
                        quizType: 'module-quiz',
                        estimatedQuestionCount: 12,
                        topicsCovered: module.topicsCovered || [], // Module-specific topics
                        description: `Assessment covering: ${module.topicsCovered?.join(', ') || 'module content'}`,
                        status: 'not-created'
                    })) || [],
                    phaseQuiz: {
                        phaseId: phase.phaseId,
                        phaseName: phase.phaseName,
                        quizType: 'phase-quiz',
                        estimatedQuestionCount: 30,
                        topicsCovered: phaseTopicNames, // PHASE-SPECIFIC topics only
                        description: `Comprehensive assessment for ${phase.phaseName}. Tests: ${phaseTopicNames.slice(0, 3).join(', ')}${phaseTopicNames.length > 3 ? '...' : ''}`,
                        status: 'not-created'
                    }
                }
            };
        });
    }

    /**
     * Create enhanced final quiz metadata
     */
    createFinalQuizMetadataEnhanced(phases, topicsData) {
        // Collect all unique topics from all phases
        const allTopicNames = topicsData.allTopics.map(t => t.name);
        
        return {
            quizType: 'final-quiz',
            quizTitle: `Final Assessment: ${topicsData.documentTitle || 'Complete Learning Roadmap'}`,
            estimatedQuestionCount: 30,
            topicsCovered: allTopicNames,
            topicsByPhase: Object.entries(topicsData.topicsByPhase).map(([phaseNum, topics]) => ({
                phase: parseInt(phaseNum),
                topics: topics.map(t => t.name)
            })),
            description: `Final comprehensive assessment covering all ${allTopicNames.length} topics from all phases. Tests complete mastery of the learning roadmap.`,
            status: 'not-created',
            passingScore: 70
        };
    }

    getBasicFallbackRoadmap(learnerLevel) {
        const numPhases = learnerLevel === 'beginner' ? 3 : 4;
        const fallbackTopics = {
            documentTitle: 'Learning Document',
            allTopics: [
                { id: 'topic_1', name: 'Core Concepts', description: 'Fundamental concepts', difficulty: 'easy', phase: 1 },
                { id: 'topic_2', name: 'Key Principles', description: 'Important principles', difficulty: 'medium', phase: 2 },
                { id: 'topic_3', name: 'Advanced Topics', description: 'Complex topics', difficulty: 'hard', phase: 3 }
            ],
            topicsByPhase: {
                1: [{ id: 'topic_1', name: 'Core Concepts', description: 'Fundamental concepts', difficulty: 'easy' }],
                2: [{ id: 'topic_2', name: 'Key Principles', description: 'Important principles', difficulty: 'medium' }],
                3: [{ id: 'topic_3', name: 'Advanced Topics', description: 'Complex topics', difficulty: 'hard' }]
            }
        };

        const phases = this.getDefaultPhasesLegacy(learnerLevel);
        phases.forEach((phase, idx) => {
            phase.phaseTopics = fallbackTopics.topicsByPhase[idx + 1] || [];
            phase.modules = this.getBasicModules(phase.phaseName);
        });

        const totalHours = learnerLevel === 'beginner' ? 24 : 36;
        const pathWithQuizzes = this.addQuizMetadataWithPhaseTopics(phases);

        return {
            completed: false,
            documentTitle: 'Learning Document',
            mainTopics: fallbackTopics.allTopics,
            topicsByPhase: fallbackTopics.topicsByPhase,
            learningPath: pathWithQuizzes,
            finalQuiz: this.createFinalQuizMetadataEnhanced(pathWithQuizzes, fallbackTopics),
            prerequisites: [],
            learningOutcomes: [
                { outcome: 'Understand concepts', description: 'Learn the material' },
                { outcome: 'Apply knowledge', description: 'Use what you learned' }
            ],
            studyTimeline: {
                totalEstimatedHours: totalHours,
                recommendedPacePerWeek: '4-6 hours',
                phaseBreakdown: phases.map(p => ({
                    phase: p.phaseName,
                    hours: Math.round(totalHours / phases.length),
                    percentage: Math.round(100 / phases.length)
                }))
            },
            progressTracking: {
                currentPhase: 0,
                completedModules: [],
                completedLessons: [],
                completedQuizzes: [],
                overallProgress: 0,
                overallQuizScore: 0
            },
            quizStatistics: {
                totalModuleQuizzes: pathWithQuizzes.reduce((sum, p) => sum + (p.quizzes?.moduleQuizzes?.length || 0), 0),
                totalPhaseQuizzes: pathWithQuizzes.length,
                hasFinalQuiz: true,
                totalQuestionsEstimate: 150
            }
        };
    }

    /**
     * Legacy default phases for fallback
     */
    getDefaultPhasesLegacy(learnerLevel) {
        if (learnerLevel === 'beginner') {
            return [
                { phaseId: 'phase_1', phaseName: 'Foundation Building', phaseDescription: 'Establish core understanding', phaseObjective: 'Master the basics', estimatedDuration: '8 hours', completionCriteria: 'Complete all modules', summary: 'Core principles', phaseTopics: [] },
                { phaseId: 'phase_2', phaseName: 'Skill Development', phaseDescription: 'Apply knowledge practically', phaseObjective: 'Develop practical skills', estimatedDuration: '8 hours', completionCriteria: 'Complete exercises', summary: 'Practical application', phaseTopics: [] },
                { phaseId: 'phase_3', phaseName: 'Mastery & Integration', phaseDescription: 'Integrate all concepts', phaseObjective: 'Achieve complete mastery', estimatedDuration: '8 hours', completionCriteria: 'Pass final assessment', summary: 'Full integration', phaseTopics: [] }
            ];
        }
        return [
            { phaseId: 'phase_1', phaseName: 'Review', phaseDescription: 'Review foundations', phaseObjective: 'Solidify knowledge', estimatedDuration: '9 hours', completionCriteria: 'Complete review', summary: 'Foundation review', phaseTopics: [] },
            { phaseId: 'phase_2', phaseName: 'Advanced', phaseDescription: 'Explore advanced topics', phaseObjective: 'Master advanced concepts', estimatedDuration: '9 hours', completionCriteria: 'Complete modules', summary: 'Advanced techniques', phaseTopics: [] },
            { phaseId: 'phase_3', phaseName: 'Practice', phaseDescription: 'Apply advanced knowledge', phaseObjective: 'Develop expertise', estimatedDuration: '9 hours', completionCriteria: 'Complete projects', summary: 'Real-world application', phaseTopics: [] },
            { phaseId: 'phase_4', phaseName: 'Mastery', phaseDescription: 'Achieve expert proficiency', phaseObjective: 'Demonstrate competency', estimatedDuration: '9 hours', completionCriteria: 'Pass assessment', summary: 'Expert proficiency', phaseTopics: [] }
        ];
    }
    /**
     * Add quiz metadata to roadmap (legacy - kept for compatibility)
     */
    addQuizMetadata(learningPath, mainTopics) {
        return this.addQuizMetadataWithPhaseTopics(learningPath);
    }

    /**
     * Create final quiz metadata (legacy - kept for compatibility)
     */
    createFinalQuizMetadata(phases, mainTopics) {
        return {
            quizType: 'final-quiz',
            quizTitle: 'Final Comprehensive Assessment',
            estimatedQuestionCount: 30,
            topicsCovered: mainTopics.map(t => t.name || t),
            description: 'Final comprehensive assessment covering all topics from all phases.',
            status: 'not-created',
            passingScore: 70
        };
    }

    /**
     * Update progress tracking for a roadmap
     */
    updateProgress(progressTracking, lessonId, totalLessons) {
        if (!progressTracking.completedLessons.includes(lessonId)) {
            progressTracking.completedLessons.push(lessonId);
        }
        
        progressTracking.overallProgress = Math.round(
            (progressTracking.completedLessons.length / totalLessons) * 100
        );
        
        return progressTracking;
    }

    /**
     * Get roadmap summary for export
     */
    generateRoadmapSummary(enhancedRoadmap) {
        let summary = `# Learning Roadmap Summary\n\n`;
        
        if (enhancedRoadmap.documentTitle) {
            summary += `## ${enhancedRoadmap.documentTitle}\n\n`;
        }
        
        summary += `## Overview\n`;
        summary += `**Total Estimated Time:** ${enhancedRoadmap.studyTimeline?.totalEstimatedHours || 24} hours\n`;
        summary += `**Recommended Pace:** ${enhancedRoadmap.studyTimeline?.recommendedPacePerWeek || '4-6 hours/week'}\n`;
        summary += `**Current Progress:** ${enhancedRoadmap.progressTracking?.overallProgress || 0}%\n\n`;
        
        summary += `## Main Topics\n`;
        enhancedRoadmap.mainTopics?.forEach(topic => {
            summary += `- **${topic.name}** (${topic.importance || topic.difficulty}) - ${topic.description}\n`;
        });
        
        summary += `\n## Learning Phases\n`;
        enhancedRoadmap.learningPath?.forEach((phase, idx) => {
            summary += `\n### Phase ${idx + 1}: ${phase.phaseName}\n`;
            summary += `${phase.phaseDescription}\n`;
            summary += `**Duration:** ${phase.estimatedDuration}\n`;
            
            // Show phase-specific topics
            if (phase.phaseTopics && phase.phaseTopics.length > 0) {
                summary += `**Topics:** ${phase.phaseTopics.map(t => t.name).join(', ')}\n`;
            }
            summary += '\n';
            
            phase.modules?.forEach(mod => {
                summary += `#### ${mod.moduleTitle}\n`;
                summary += `- **Time:** ${mod.estimatedTime}\n`;
                summary += `- **Topics:** ${mod.topicsCovered?.join(', ') || 'N/A'}\n`;
                summary += `- **Lessons:** ${mod.lessons?.length || 0}\n\n`;
            });
        });
        
        summary += `\n## Learning Outcomes\n`;
        enhancedRoadmap.learningOutcomes?.forEach(outcome => {
            summary += `- ${outcome.outcome}\n`;
        });
        
        return summary;
    }
}

module.exports = RoadmapService;
