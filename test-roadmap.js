/**
 * Roadmap Generation Debugging Script
 * Use this to test roadmap generation with a real PDF
 * 
 * Run: node test-roadmap.js <path-to-pdf> <learner-level>
 * Example: node test-roadmap.js uploads/test.pdf beginner
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pdfParseService = require('./backend/services/pdfParseService');
const RoadmapService = require('./backend/services/roadmapService');

async function testRoadmapGeneration() {
    try {
        const pdfPath = process.argv[2] || 'uploads/test.pdf';
        const learnerLevel = process.argv[3] || 'beginner';

        if (!fs.existsSync(pdfPath)) {
            console.error(`❌ PDF file not found: ${pdfPath}`);
            console.log('\nUsage: node test-roadmap.js <path-to-pdf> <learner-level>');
            console.log('Example: node test-roadmap.js uploads/test.pdf beginner');
            process.exit(1);
        }

        if (!process.env.GEMINI_API_KEY) {
            console.error('❌ GEMINI_API_KEY environment variable is not set');
            console.error('Please add it to your .env file');
            process.exit(1);
        }

        console.log('📄 Starting Roadmap Generation Test');
        console.log(`   PDF: ${pdfPath}`);
        console.log(`   Learner Level: ${learnerLevel}`);
        console.log('\n' + '='.repeat(60) + '\n');

        // Step 1: Extract PDF text
        console.log('📖 Step 1: Extracting PDF content...');
        const pdfText = await pdfParseService.extractPdfText(pdfPath);
        
        if (!pdfText || pdfText.trim().length === 0) {
            console.error('❌ Could not extract text from PDF');
            process.exit(1);
        }
        
        console.log(`✅ Extracted ${pdfText.length} characters from PDF`);
        console.log(`   First 300 chars: ${pdfText.substring(0, 300)}...`);

        // Step 2: Generate roadmap
        console.log('\n' + '='.repeat(60));
        console.log('🗺️ Step 2: Generating enhanced roadmap...\n');
        
        const roadmapService = new RoadmapService(process.env.GEMINI_API_KEY);
        const startTime = Date.now();
        
        const enhancedRoadmap = await roadmapService.generateEnhancedRoadmap(pdfText, learnerLevel);
        
        const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ Roadmap generated in ${generationTime} seconds`);

        // Step 3: Display results
        console.log('\n' + '='.repeat(60));
        console.log('📊 ROADMAP Generation RESULTS\n');

        console.log('📌 Main Topics:');
        enhancedRoadmap.mainTopics.forEach((topic, idx) => {
            console.log(`   ${idx + 1}. ${topic.name}`);
            console.log(`      - Description: ${topic.description}`);
            console.log(`      - Importance: ${topic.importance}`);
            console.log(`      - Difficulty: ${topic.difficulty}\n`);
        });

        console.log('\n🎯 Learning Path Summary:');
        enhancedRoadmap.learningPath.forEach((phase, phaseIdx) => {
            console.log(`\n   Phase ${phaseIdx + 1}: ${phase.phaseName}`);
            console.log(`   - Duration: ${phase.estimatedDuration}`);
            console.log(`   - Objective: ${phase.phaseObjective}`);
            console.log(`   - Modules: ${phase.modules?.length || 0}`);
            
            phase.modules?.forEach((module, modIdx) => {
                console.log(`     • Module ${modIdx + 1}: ${module.moduleTitle}`);
                console.log(`       Lessons: ${module.lessons?.length || 0}`);
                console.log(`       Duration: ${module.estimatedTime}`);
                console.log(`       Topics: ${module.topicsCovered?.join(', ') || 'N/A'}`);
            });
        });

        console.log('\n\n📈 Study Timeline:');
        console.log(`   Total Hours: ${enhancedRoadmap.studyTimeline.totalEstimatedHours}`);
        console.log(`   Recommended Pace: ${enhancedRoadmap.studyTimeline.recommendedPacePerWeek}`);
        enhancedRoadmap.studyTimeline.phaseBreakdown?.forEach((breakdown, idx) => {
            console.log(`   Phase ${idx + 1}: ${breakdown.hours} hours (${breakdown.percentage}%)`);
        });

        console.log('\n\n🎓 Learning Outcomes:');
        enhancedRoadmap.learningOutcomes?.forEach((outcome, idx) => {
            console.log(`   ${idx + 1}. ${outcome.outcome}`);
            console.log(`      ${outcome.description}\n`);
        });

        // Step 4: Save to file for inspection
        const outputFile = `roadmap-output-${Date.now()}.json`;
        fs.writeFileSync(outputFile, JSON.stringify(enhancedRoadmap, null, 2));
        console.log(`\n✅ Full roadmap saved to: ${outputFile}`);

        console.log('\n' + '='.repeat(60));
        console.log('✅ Test completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Test failed with error:');
        console.error(error.message);
        console.error('\nStack trace:');
        console.error(error.stack);
        process.exit(1);
    }
}

testRoadmapGeneration();
