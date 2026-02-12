/**
 * Test script for roadmap generation
 * Usage: node test-roadmap.js [pdfPath] [learnerLevel]
 * Example: node test-roadmap.js uploads/sample.pdf beginner
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const RoadmapService = require('./services/roadmapService');

async function runTest() {
    console.log('\n🔬 ROADMAP GENERATION TEST\n');
    
    // Check API Key
    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ ERROR: GEMINI_API_KEY not found in .env file');
        console.error('   Please add: GEMINI_API_KEY=your_actual_key');
        process.exit(1);
    }
    console.log('✅ GEMINI_API_KEY found\n');

    // Get file path from arguments
    let filePath = process.argv[2] || 'uploads/sample.pdf';
    let learnerLevel = process.argv[3] || 'beginner';

    // Resolve absolute path
    if (!path.isAbsolute(filePath)) {
        filePath = path.join(__dirname, filePath);
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
        console.error(`❌ ERROR: File not found: ${filePath}`);
        console.error('\nTrying with sample content instead...\n');
        
        // Use sample content if file doesn't exist
        const sampleContent = `
Introduction to Machine Learning

Machine Learning Overview
Machine learning is a subset of artificial intelligence (AI) that enables computers to learn 
and improve from experience without explicit programming. It focuses on developing algorithms 
that can process data, identify patterns, and make decisions with minimal human supervision.

Types of Machine Learning

Supervised Learning
Supervised learning involves training algorithms on labeled datasets where the expected output 
is known. The algorithm learns the mapping function from input to output variables.

Unsupervised Learning
Unsupervised learning works with unlabeled data, discovering hidden patterns and structures. 
Key techniques include clustering and dimensionality reduction.

Reinforcement Learning
Reinforcement learning involves training agents to make decisions through rewards and punishments, 
commonly used in game AI and robotics.

Core Algorithms

Decision Trees
A supervised learning algorithm that builds a tree-like model of decisions for both 
classification and regression problems.

Random Forest
An ensemble method that combines multiple decision trees to improve prediction accuracy 
and reduce overfitting.

Neural Networks
A machine learning model inspired by biological neurons that can learn complex patterns 
through multiple layers of nodes.

Support Vector Machines
A powerful algorithm for both classification and regression tasks that finds the optimal 
hyperplane to separate data classes.

Deep Learning
Deep learning uses neural networks with multiple hidden layers to learn representations 
of data at multiple levels of abstraction.

Applications

Healthcare: Disease diagnosis and prediction systems
Finance: Fraud detection and algorithmic trading
Transportation: Autonomous vehicles and traffic prediction
Retail: Recommendation systems and customer segmentation

Challenges

Data Quality: Success depends on clean and representative datasets
Overfitting: Models may memorize data rather than learning generalizable patterns
Interpretability: Complex models lack transparency in decision making
Computational Resources: Training large models requires significant computational power

Future Directions

Transfer Learning: Applying knowledge from one task to another
Explainable AI: Making AI systems more transparent and understandable
Edge AI: Deploying machine learning on edge devices
Federated Learning: Training models across decentralized data sources
        `;

        console.log(`📊 Using sample content (${sampleContent.length} characters)\n`);
        await testRoadmapGeneration(sampleContent, learnerLevel);
        return;
    }

    // Read file content
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        console.log(`📄 File: ${filePath}`);
        console.log(`   Size: ${fileContent.length} characters\n`);
        
        await testRoadmapGeneration(fileContent, learnerLevel);
    } catch (error) {
        console.error(`❌ Error reading file: ${error.message}`);
        process.exit(1);
    }
}

async function testRoadmapGeneration(content, learnerLevel) {
    try {
        console.log(`⚙️  Initializing RoadmapService...\n`);
        const roadmapService = new RoadmapService(process.env.GEMINI_API_KEY);
        
        console.log(`🚀 Starting roadmap generation for "${learnerLevel}" level...\n`);
        const startTime = Date.now();
        
        const roadmap = await roadmapService.generateEnhancedRoadmap(content, learnerLevel);
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log(`\n✅ GENERATION SUCCESSFUL in ${duration}s\n`);
        console.log('=' .repeat(60));
        console.log('📊 ROADMAP STATISTICS');
        console.log('=' .repeat(60));
        
        // Statistics
        const totalModules = roadmap.learningPath?.reduce((sum, p) => sum + (p.modules?.length || 0), 0) || 0;
        const totalLessons = roadmap.learningPath?.reduce((sum, p) => {
            return sum + (p.modules?.reduce((mSum, m) => mSum + (m.lessons?.length || 0), 0) || 0);
        }, 0) || 0;
        
        console.log(`\n📚 Topics: ${roadmap.mainTopics?.length || 0}`);
        if (roadmap.mainTopics?.length > 0) {
            roadmap.mainTopics.forEach((t, idx) => {
                console.log(`   ${idx + 1}. ${t.name} (${t.difficulty} / ${t.importance})`);
            });
        }
        
        console.log(`\n🎯 Phases: ${roadmap.learningPath?.length || 0}`);
        if (roadmap.learningPath?.length > 0) {
            roadmap.learningPath.forEach((p, idx) => {
                console.log(`   ${idx + 1}. ${p.phaseName}`);
                console.log(`      Duration: ${p.estimatedDuration}`);
                console.log(`      Modules: ${p.modules?.length || 0}`);
            });
        }
        
        console.log(`\n🔗 Modules: ${totalModules}`);
        console.log(`📖 Lessons: ${totalLessons}`);
        console.log(`⏱️  Total Hours: ${roadmap.studyTimeline?.totalEstimatedHours || 'N/A'}`);
        console.log(`📅 Pace: ${roadmap.studyTimeline?.recommendedPacePerWeek || 'N/A'}`);
        
        console.log(`\n🎓 Learning Outcomes: ${roadmap.learningOutcomes?.length || 0}`);
        if (roadmap.learningOutcomes?.length > 0) {
            roadmap.learningOutcomes.forEach((o, idx) => {
                console.log(`   ${idx + 1}. ${o.outcome}`);
            });
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('✨ Full Roadmap Object:');
        console.log('='.repeat(60) + '\n');
        console.log(JSON.stringify(roadmap, null, 2));
        
        // Summary
        if (totalModules === 0 || totalLessons === 0) {
            console.log('\n⚠️  WARNING: Roadmap generated but appears empty!');
            console.log('   - Topics found:', roadmap.mainTopics?.length || 0);
            console.log('   - Modules found:', totalModules);
            console.log('   - Lessons found:', totalLessons);
        }
        
    } catch (error) {
        console.error('\n❌ GENERATION FAILED');
        console.error('Error:', error.message);
        console.error('\nFull error:');
        console.error(error);
        process.exit(1);
    }
}

// Run test
runTest().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
