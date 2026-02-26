#!/usr/bin/env node

/**
 * Test Script for Roadmap Service Improvements
 * Tests the enhanced topic extraction and module generation
 */

require('dotenv').config();
const RoadmapService = require('./services/roadmapService.js');

// Sample educational content about Machine Learning
const sampleContent = `
# Machine Learning Fundamentals

## What is Machine Learning?
Machine Learning is a subset of artificial intelligence that enables systems to learn and improve from experience. 
Machine learning focuses on developing algorithms that can access data and learn from it independently.

## Types of Machine Learning
### Supervised Learning
Supervised learning is a type of machine learning where the algorithm learns from labeled training data. 
It includes regression and classification problems.

#### Linear Regression
Linear regression is used for predicting continuous values. It models the relationship between a dependent variable and one or more independent variables.
The model fits a straight line through the data points: y = mx + b

#### Logistic Regression
Logistic regression is used for binary classification problems. Despite its name, it's a classification algorithm.
It predicts the probability that an instance belongs to a particular class.

#### Decision Trees
Decision trees are versatile algorithms that work for both classification and regression tasks.
They recursively split data into subsets based on feature values to maximize information gain.

#### Support Vector Machines (SVM)
SVM is a powerful supervised learning algorithm used for classification and regression.
It finds the optimal hyperplane that maximally separates different classes.

### Unsupervised Learning
Unsupervised learning algorithms work on unlabeled data to discover hidden patterns and structures.

#### K-Means Clustering
K-Means is an unsupervised algorithm that partitions data into K clusters.
It minimizes the within-cluster sum of squares to group similar data points together.

#### Hierarchical Clustering
Hierarchical clustering creates a dendrogram showing nested clusters at different levels.
It can be agglomerative (bottom-up) or divisive (top-down).

#### Principal Component Analysis (PCA)
PCA is a dimensionality reduction technique that transforms data into a lower-dimensional space.
It identifies the principal components that capture the maximum variance in the data.

### Reinforcement Learning
Reinforcement learning involves an agent learning from interaction with an environment.
The agent receives rewards or penalties based on its actions.

#### Q-Learning Algorithm
Q-Learning learns the optimal policy without a model of the environment.
It updates Q-values based on the Bellman equation.

## Feature Engineering
Feature engineering is the process of selecting and transforming raw data into meaningful features.

### Feature Selection
Feature selection techniques include filter methods, wrapper methods, and embedded methods.
Removing irrelevant features improves model performance and reduces overfitting.

### Feature Normalization
Normalization scales features to a standard range, typically 0 to 1 or -1 to 1.
It prevents features with larger scales from dominating the learning process.

## Model Evaluation

### Cross-Validation
Cross-validation divides data into multiple folds to evaluate model performance more robustly.
K-fold cross-validation is commonly used with K=5 or K=10.

### Confusion Matrix
The confusion matrix shows true positives, true negatives, false positives, and false negatives.
It helps calculate metrics like precision, recall, and F1-score.

### ROC Curves
ROC curves plot true positive rate against false positive rate at various thresholds.
The area under the ROC curve (AUC) measures classifier performance.

## Neural Networks

### Artificial Neural Networks (ANN)
Artificial neural networks are inspired by biological neurons and consist of interconnected nodes.
They learn by adjusting weights through backpropagation.

### Convolutional Neural Networks (CNN)
CNNs are specialized for image processing using convolutional layers.
They extract spatial features through filters that slide across the input.

### Recurrent Neural Networks (RNN)
RNNs process sequential data by maintaining hidden states across time steps.
LSTMs and GRUs are advanced RNN architectures that handle long-term dependencies.

## Deep Learning Optimization

### Gradient Descent Variants
Stochastic Gradient Descent (SGD) updates weights using individual samples.
Mini-batch gradient descent balances computational efficiency and variance reduction.

### Adaptive Learning Rates
Adam optimizer adapts learning rates for each parameter based on first and second moment estimates.
RMSprop uses exponential moving averages to normalize gradients.

## Hyperparameter Tuning
Grid search exhaustively searches over specified parameter values.
Random search and Bayesian optimization handle high-dimensional parameter spaces more efficiently.

## Real-world Applications
Machine learning powers recommendation systems, natural language processing, computer vision, and predictive analytics.
Deep learning has revolutionary applications in autonomous vehicles, medical imaging, and language models.
`;

async function testRoadmapGeneration() {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.error('❌ Error: GEMINI_API_KEY is not set in environment variables');
            process.exit(1);
        }

        console.log('🚀 Starting Roadmap Service Improvement Tests\n');
        console.log('═'.repeat(80));
        
        const roadmapService = new RoadmapService(process.env.GEMINI_API_KEY);
        
        console.log('\n📋 Test Configuration:');
        console.log(`   Sample content length: ${sampleContent.length} characters`);
        console.log(`   Learner level: beginner`);
        console.log(`   Content topic: Machine Learning`);
        
        console.log('\n' + '═'.repeat(80));
        console.log('🔄 Starting roadmap generation...\n');
        
        const startTime = Date.now();
        
        // Generate roadmap using improved service
        let roadmap;
        try {
            roadmap = await roadmapService.generateEnhancedRoadmap(sampleContent, 'beginner');
        } catch (err) {
            console.error('❌ Roadmap generation failed during test:', err.message);
            if (err.message && err.message.toLowerCase().includes('quota')) {
                console.warn('⚠️ Quota error detected. Skipping further tests.');
                process.exit(0);
            }
            throw err;
        }
        
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log('\n' + '═'.repeat(80));
        console.log('📊 RESULTS\n');
        
        // Test 1: Check main document topic extraction
        console.log('✅ TEST 1: Main Document Topic Extraction');
        console.log(`   Main Topic: "${roadmap.documentTitle}"`);
        console.log(`   Status: ${roadmap.documentTitle && roadmap.documentTitle !== 'Learning Document' ? '✓ PASS' : '✗ FAIL'}`);
        
        // Test 2: Check topics extraction
        console.log('\n✅ TEST 2: Topics Extraction');
        console.log(`   Total topics extracted: ${roadmap.mainTopics?.length || 0}`);
        console.log(`   Expected: >= 9 topics (3 per phase)`);
        console.log(`   Status: ${(roadmap.mainTopics?.length || 0) >= 9 ? '✓ PASS' : '⚠ WARN - Low topic count'}`);
        
        // Test 3: Check phase structure
        console.log('\n✅ TEST 3: Phase Structure');
        console.log(`   Phases generated: ${roadmap.learningPath?.length || 0}`);
        roadmap.learningPath?.forEach((phase, idx) => {
            console.log(`   Phase ${idx + 1}: "${phase.phaseName}"`);
            console.log(`      - Topics in phase: ${phase.phaseTopics?.length || 0}`);
            console.log(`      - Modules: ${phase.modules?.length || 0}`);
            if (phase.modules && phase.modules.length > 0) {
                phase.modules.forEach((mod, modIdx) => {
                    console.log(`        Module ${modIdx + 1}: "${mod.moduleTitle}" (${mod.topicsCovered?.length || 0} topics, ${mod.lessons?.length || 0} lessons)`);
                });
            }
        });
        console.log(`   Status: ${(roadmap.learningPath?.length || 0) >= 3 ? '✓ PASS' : '✗ FAIL'}`);
        
        // Test 4: Check module generation
        console.log('\n✅ TEST 4: Module Generation');
        const totalModules = roadmap.learningPath?.reduce((sum, p) => sum + (p.modules?.length || 0), 0) || 0;
        console.log(`   Total modules: ${totalModules}`);
        console.log(`   Expected: >= 6 modules (2+ per phase)`);
        console.log(`   Status: ${totalModules >= 6 ? '✓ PASS' : '⚠ WARN - Low module count'}`);
        
        // Test 5: Check lessons generation
        console.log('\n✅ TEST 5: Lessons Generation');
        const totalLessons = roadmap.learningPath?.reduce((sum, p) => 
            sum + (p.modules?.reduce((m, mod) => m + (mod.lessons?.length || 0), 0) || 0), 0) || 0;
        console.log(`   Total lessons: ${totalLessons}`);
        console.log(`   Status: ${totalLessons >= 6 ? '✓ PASS' : '⚠ INFO'}`);
        
        // Test 6: Check unique topics per phase
        console.log('\n✅ TEST 6: Topic Uniqueness Per Phase');
        let hasUniqueness = true;
        const phaseTopicNames = {};
        roadmap.learningPath?.forEach((phase, idx) => {
            const topicNames = phase.phaseTopics?.map(t => t.name) || [];
            console.log(`   Phase ${idx + 1}: ${topicNames.join(', ')}`);
            phaseTopicNames[idx] = topicNames;
        });
        
        // Check for overlaps
        let overlaps = [];
        for (let i = 0; i < (phaseTopicNames[0]?.length || 0); i++) {
            for (let j = i + 1; j < Object.keys(phaseTopicNames).length; j++) {
                const intersection = phaseTopicNames[i]?.filter(t => phaseTopicNames[j]?.includes(t)) || [];
                if (intersection.length > 0) {
                    overlaps.push(intersection);
                    hasUniqueness = false;
                }
            }
        }
        console.log(`   Status: ${hasUniqueness ? '✓ PASS - All topics unique' : '⚠ WARN - Found ' + overlaps.length + ' overlapping topics'}`);
        
        // Test 7: Check learning outcomes
        console.log('\n✅ TEST 7: Learning Outcomes');
        console.log(`   Learning outcomes generated: ${roadmap.learningOutcomes?.length || 0}`);
        roadmap.learningOutcomes?.forEach((outcome, idx) => {
            console.log(`      ${idx + 1}. ${outcome.outcome}`);
        });
        console.log(`   Status: ${(roadmap.learningOutcomes?.length || 0) >= 3 ? '✓ PASS' : '⚠ WARN'}`);
        
        // Summary
        console.log('\n' + '═'.repeat(80));
        console.log('\n📈 SUMMARY');
        console.log(`   Generation time: ${elapsed}s`);
        console.log(`   Topics: ${roadmap.mainTopics?.length || 0}`);
        console.log(`   Phases: ${roadmap.learningPath?.length || 0}`);
        console.log(`   Modules: ${totalModules}`);
        console.log(`   Lessons: ${totalLessons}`);
        console.log(`   Total key points: ${roadmap.learningOutcomes?.length || 0}`);
        console.log(`   Estimated hours: ${roadmap.studyTimeline?.totalEstimatedHours || 0}`);
        
        const passCount = [
            (roadmap.documentTitle && roadmap.documentTitle !== 'Learning Document'),
            (roadmap.mainTopics?.length || 0) >= 9,
            (roadmap.learningPath?.length || 0) >= 3,
            totalModules >= 6,
            hasUniqueness,
            (roadmap.learningOutcomes?.length || 0) >= 3
        ].filter(Boolean).length;
        
        console.log(`\n✅ Tests Passed: ${passCount}/6`);
        console.log('\n' + '═'.repeat(80) + '\n');
        
        return roadmap;
        
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the test
testRoadmapGeneration();
