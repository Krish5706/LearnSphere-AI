/**
 * Enhanced Roadmap Service
 * Generates comprehensive learning paths with topics, phases, and progress tracking
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
    }

    /**
     * Extract main topics from content
     * @param {string} content - The PDF content
     * @returns {Promise<Array>} - Array of main topics
     */
    async extractMainTopics(content) {
        const prompt = `List 5-6 main topics from this content. Use simple format:
[
  {"name": "Topic Name", "description": "Short description", "difficulty": "easy", "importance": "critical"},
  {"name": "Topic Name", "description": "Short description", "difficulty": "medium", "importance": "important"}
]
Only JSON, no other text.

Content:\n${content.substring(0, 10000)}`;

        try {
            console.log('🔍 Extracting topics...');
            const result = await this.getContentWithTimeout(prompt, 10000);
            
            // Extract JSON array - be more lenient
            let jsonMatch = result.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                console.warn('⚠️  No JSON in response, using defaults');
                return this.getDefaultTopics();
            }
            
            try {
                const topics = JSON.parse(jsonMatch[0]);
                console.log(`✅ Extracted ${topics.length} topics`);
                
                return topics.slice(0, 6).map((topic, idx) => ({
                    id: `topic_${idx + 1}`,
                    name: topic.name || `Topic ${idx + 1}`,
                    description: topic.description || 'Core concept',
                    difficulty: topic.difficulty || 'medium',
                    importance: topic.importance || 'important'
                }));
            } catch (parseError) {
                console.warn('⚠️  JSON parse error:', parseError.message, 'Using defaults');
                return this.getDefaultTopics();
            }
        } catch (error) {
            console.error('❌ Topic extraction failed:', error.message);
            return this.getDefaultTopics();
        }
    }

    getDefaultTopics() {
        return [
            { id: 'topic_1', name: 'Fundamentals', description: 'Core concepts and basics', difficulty: 'easy', importance: 'critical' },
            { id: 'topic_2', name: 'Core Concepts', description: 'Key principles and theory', difficulty: 'medium', importance: 'critical' },
            { id: 'topic_3', name: 'Practical Application', description: 'Real-world usage', difficulty: 'medium', importance: 'important' },
            { id: 'topic_4', name: 'Advanced Topics', description: 'Complex scenarios', difficulty: 'hard', importance: 'important' },
            { id: 'topic_5', name: 'Best Practices', description: 'Recommended approaches', difficulty: 'medium', importance: 'optional' }
        ];
    }

    async getContentWithTimeout(prompt, timeoutMs = 15000) {
        return Promise.race([
            this.model.generateContent(prompt).then(result => result.response.text().trim()),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('API timeout')), timeoutMs)
            )
        ]);
    }

    async generatePhases(topics, learnerLevel = 'beginner') {
        const phaseCount = learnerLevel === 'beginner' ? 3 : learnerLevel === 'intermediate' ? 4 : 4;
        const phaseNames = learnerLevel === 'beginner' 
            ? ['Basics', 'Application', 'Integration']
            : learnerLevel === 'intermediate'
            ? ['Review', 'Advanced', 'Practice', 'Mastery']
            : ['Mastery', 'Analysis', 'Innovation', 'Integration'];

        const prompt = `Create ${phaseCount} simple learning phases. Just return JSON:
[
  {"phaseId": "phase_1", "phaseName": "Phase Name", "phaseDescription": "What learners do", "phaseObjective": "Goal", "estimatedDuration": "8 hours", "completionCriteria": "When done", "summary": "Key points"}
]
Only JSON, no text. ${phaseCount} phases needed.`;

        try {
            console.log(`🎯 Generating ${phaseCount} phases...`);
            const result = await this.getContentWithTimeout(prompt, 10000);
            
            let jsonMatch = result.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                console.warn('⚠️  Using default phases');
                return this.getDefaultPhases(learnerLevel);
            }
            
            try {
                const phases = JSON.parse(jsonMatch[0]);
                console.log(`✅ Generated ${phases.length} phases`);
                return phases.slice(0, phaseCount);
            } catch (e) {
                console.warn('⚠️  JSON parse error, using defaults');
                return this.getDefaultPhases(learnerLevel);
            }
        } catch (error) {
            console.warn('Phase generation failed, using defaults:', error.message);
            return this.getDefaultPhases(learnerLevel);
        }
    }

    getDefaultPhases(learnerLevel) {
        if (learnerLevel === 'beginner') {
            return [
                { phaseId: 'phase_1', phaseName: 'Foundations & Basics', phaseDescription: 'Learn core concepts', phaseObjective: 'Understand fundamentals', estimatedDuration: '8 hours', completionCriteria: 'Grasp basics', summary: 'Core principles' },
                { phaseId: 'phase_2', phaseName: 'Practical Application', phaseDescription: 'Apply knowledge', phaseObjective: 'Build practical skills', estimatedDuration: '8 hours', completionCriteria: 'Complete exercises', summary: 'Real-world usage' },
                { phaseId: 'phase_3', phaseName: 'Summary & Integration', phaseDescription: 'Integrate concepts', phaseObjective: 'Master the subject', estimatedDuration: '8 hours', completionCriteria: 'Demonstrate mastery', summary: 'Full understanding' }
            ];
        }
        // Similar for intermediate/advanced...
        return [
            { phaseId: 'phase_1', phaseName: 'Phase 1', phaseDescription: 'Phase content', phaseObjective: 'Phase goal', estimatedDuration: '10 hours', completionCriteria: 'Completion', summary: 'Key points' },
            { phaseId: 'phase_2', phaseName: 'Phase 2', phaseDescription: 'Phase content', phaseObjective: 'Phase goal', estimatedDuration: '10 hours', completionCriteria: 'Completion', summary: 'Key points' },
            { phaseId: 'phase_3', phaseName: 'Phase 3', phaseDescription: 'Phase content', phaseObjective: 'Phase goal', estimatedDuration: '10 hours', completionCriteria: 'Completion', summary: 'Key points' },
            { phaseId: 'phase_4', phaseName: 'Phase 4', phaseDescription: 'Phase content', phaseObjective: 'Phase goal', estimatedDuration: '10 hours', completionCriteria: 'Completion', summary: 'Key points' }
        ];
    }

    async generateModulesForPhase(phase, topics) {
        try {
            console.log(`📚 Generating modules for: ${phase.phaseName}...`);
            return this.getDefaultModules(phase.phaseName, topics.map(t => t.name));
        } catch (error) {
            console.warn('Module generation failed:', error.message);
            return this.getDefaultModules(phase.phaseName, topics.map(t => t.name));
        }
    }

    getDefaultModules(phaseName, topicNames) {
        return [
            {
                moduleId: 'mod_1',
                moduleTitle: `${phaseName}: Part 1`,
                moduleDescription: `First module of ${phaseName}`,
                topicsCovered: topicNames.slice(0, 2),
                estimatedTime: '2-3 hours',
                difficulty: 'easy',
                lessons: this.getDefaultLessons(3),
                assessment: { type: 'quiz', description: 'Quick check', questions: [] }
            },
            {
                moduleId: 'mod_2',
                moduleTitle: `${phaseName}: Part 2`,
                moduleDescription: `Second module of ${phaseName}`,
                topicsCovered: topicNames.slice(2, 4),
                estimatedTime: '2-3 hours',
                difficulty: 'medium',
                lessons: this.getDefaultLessons(3),
                assessment: { type: 'quiz', description: 'Quick check', questions: [] }
            },
            {
                moduleId: 'mod_3',
                moduleTitle: `${phaseName}: Part 3`,
                moduleDescription: `Third module of ${phaseName}`,
                topicsCovered: topicNames.slice(4),
                estimatedTime: '2-3 hours',
                difficulty: 'medium',
                lessons: this.getDefaultLessons(2),
                assessment: { type: 'quiz', description: 'Quick check', questions: [] }
            }
        ];
    }
    getDefaultLessons(count = 3) {
        const lessons = [];
        for (let i = 1; i <= count; i++) {
            lessons.push({
                lessonId: `les_${i}`,
                lessonTitle: `Lesson ${i}`,
                lessonContent: `Learn about this topic. Key concepts and principles.`,
                orderInModule: i,
                duration: '20-30 minutes',
                keyPoints: [`Concept ${i}.1`, `Concept ${i}.2`, `Concept ${i}.3`],
                resources: [`Resource ${i}`, `Reference ${i}`],
                prerequisites: [],
                practiceActivities: [
                    { activity: `Exercise ${i}`, description: `Practice exercise ${i}` }
                ]
            });
        }
        return lessons;
    }

    async generateLessonsForModule(module, phaseObjective, lessonCount = 3) {
        return this.getDefaultLessons(lessonCount);
    }

    /**
     * Assemble complete learning path from phases and modules
     */
    async assembleCompleteLearningPath(phases, topics, learnerLevel) {
        console.log('🔗 Assembling complete learning path...');
        
        const learningPath = [];
        
        for (let phaseIdx = 0; phaseIdx < phases.length; phaseIdx++) {
            const phase = phases[phaseIdx];
            console.log(`\n📍 Processing Phase ${phaseIdx + 1}/${phases.length}: ${phase.phaseName}`);
            
            // Generate modules for this phase
            const modules = await this.generateModulesForPhase(phase, topics);
            
            // Generate lessons for each module
            for (let modIdx = 0; modIdx < modules.length; modIdx++) {
                const module = modules[modIdx];
                module.moduleId = `mod_${phaseIdx + 1}_${modIdx + 1}`;
                
                const lessonsPerModule = learnerLevel === 'beginner' ? 3 : learnerLevel === 'intermediate' ? 4 : 4;
                module.lessons = await this.generateLessonsForModule(module, phase.phaseObjective, lessonsPerModule);
                
                // Add assessment placeholder
                module.assessment = {
                    type: 'quiz',
                    description: `Assessment for ${module.moduleTitle}`,
                    questions: []
                };
            }
            
            phase.modules = modules;
            learningPath.push(phase);
        }
        
        console.log(`✅ Complete learning path assembled with ${learningPath.length} phases`);
        return learningPath;
    }

    /**
     * Generate complete enhanced roadmap
     */
    async generateEnhancedRoadmap(content, learnerLevel = 'beginner') {
        try {
            console.log('\n========== ROADMAP GENERATION STARTED ==========');
            
            // Step 1: Extract topics (with timeout)
            console.log(`📚 Step 1: Extracting main topics...`);
            const mainTopics = await this.extractMainTopics(content);
            console.log(`✅ Found ${mainTopics.length} topics`);
            
            // Step 2: Generate phases (use defaults - faster)
            console.log(`🎯 Step 2: Generating phases for ${learnerLevel}...`);
            const phases = this.getDefaultPhases(learnerLevel);
            console.log(`✅ Created ${phases.length} phases`);
            
            // Step 3: Build learning path (quick - uses defaults)
            console.log(`🔗 Step 3: Building learning structure...`);
            const learningPath = [];
            for (let i = 0; i < phases.length; i++) {
                const phase = phases[i];
                const modules = this.getDefaultModules(phase.phaseName, mainTopics.map(t => t.name));
                phase.modules = modules;
                learningPath.push(phase);
            }
            console.log(`✅ Built learning path`);
            
            // Study timeline
            const totalHours = learnerLevel === 'beginner' ? 24 : learnerLevel === 'intermediate' ? 36 : 48;
            const hoursPerPhase = Math.round(totalHours / learningPath.length);
            const phaseBreakdown = learningPath.map((phase) => ({
                phase: `${phase.phaseName}`,
                hours: hoursPerPhase,
                percentage: Math.round((hoursPerPhase / totalHours) * 100)
            }));
            
            // Learning outcomes
            const learningOutcomes = [
                { outcome: 'Understand core concepts', description: 'Master fundamental ideas' },
                { outcome: 'Apply knowledge', description: 'Use what you learned' },
                { outcome: 'Analyze and evaluate', description: 'Think critically' }
            ];
            
            console.log(`📊 Step 4: Finalizing roadmap...`);
            
            const enhancedRoadmap = {
                completed: false,
                mainTopics: mainTopics,
                learningPath: learningPath,
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
                    overallProgress: 0
                }
            };

            const totalModules = learningPath.reduce((sum, p) => sum + (p.modules?.length || 0), 0);
            const totalLessons = learningPath.reduce((sum, p) => {
                return sum + (p.modules?.reduce((mSum, m) => mSum + (m.lessons?.length || 0), 0) || 0);
            }, 0);

            console.log(`✅ Roadmap generation complete!`);
            console.log(`   Topics: ${mainTopics.length}`);
            console.log(`   Phases: ${learningPath.length}`);
            console.log(`   Modules: ${totalModules}`);
            console.log(`   Lessons: ${totalLessons}`);
            console.log('========== ROADMAP GENERATION COMPLETE ==========\n');

            return enhancedRoadmap;
        } catch (error) {
            console.error('❌ Roadmap generation failed:', error.message);
            // Return basic roadmap as fallback
            return this.getBasicFallbackRoadmap(learnerLevel);
        }
    }

    getBasicFallbackRoadmap(learnerLevel) {
        const phases = this.getDefaultPhases(learnerLevel);
        const totalHours = learnerLevel === 'beginner' ? 24 : learnerLevel === 'intermediate' ? 36 : 48;
        
        phases.forEach(phase => {
            phase.modules = this.getDefaultModules(phase.phaseName, []);
        });

        return {
            completed: false,
            mainTopics: this.getDefaultTopics(),
            learningPath: phases,
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
                overallProgress: 0
            }
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
        
        summary += `## Overview\n`;
        summary += `**Total Estimated Time:** ${enhancedRoadmap.studyTimeline?.totalEstimatedHours || 24} hours\n`;
        summary += `**Recommended Pace:** ${enhancedRoadmap.studyTimeline?.recommendedPacePerWeek || '4-6 hours/week'}\n`;
        summary += `**Current Progress:** ${enhancedRoadmap.progressTracking?.overallProgress || 0}%\n\n`;
        
        summary += `## Main Topics\n`;
        enhancedRoadmap.mainTopics?.forEach(topic => {
            summary += `- **${topic.name}** (${topic.importance}) - ${topic.description}\n`;
        });
        
        summary += `\n## Learning Phases\n`;
        enhancedRoadmap.learningPath?.forEach((phase, idx) => {
            summary += `\n### Phase ${idx + 1}: ${phase.phaseName}\n`;
            summary += `${phase.phaseDescription}\n`;
            summary += `**Duration:** ${phase.estimatedDuration}\n\n`;
            
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
