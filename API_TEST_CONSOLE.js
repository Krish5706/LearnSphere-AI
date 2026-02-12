/**
 * Quick API Test Helper for Roadmap Generation
 * 
 * Use this to test roadmap generation via API without going through the full UI flow
 * 
 * 1. Copy this code to browser console (F12)
 * 2. Make sure you're logged in
 * 3. Run: testRoadmapAPI("sample content here", "beginner")
 */

// Test roadmap generation via API
async function testRoadmapAPI(content, learnerLevel = "beginner") {
    console.log("🔬 Testing Roadmap Generation API...");
    console.log(`   Content length: ${content.length}`);
    console.log(`   Learner level: ${learnerLevel}`);
    
    try {
        const response = await fetch('/api/documents/test-roadmap', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                content: content,
                learnerLevel: learnerLevel
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log("✅ Roadmap generation successful!");
            console.log("\n📊 Statistics:");
            console.log(`   Generation time: ${data.generationTime}`);
            console.log(`   Topics: ${data.stats.topicsCount}`);
            console.log(`   Phases: ${data.stats.phasesCount}`);
            console.log(`   Modules: ${data.stats.totalModules}`);
            console.log(`   Lessons: ${data.stats.totalLessons}`);
            console.log(`   Hours: ${data.stats.totalEstimatedHours}`);
            
            console.log("\n📌 Main Topics:");
            data.mainTopics.forEach((topic, idx) => {
                console.log(`   ${idx + 1}. ${topic.name}`);
            });
            
            console.log("\n🎯 Phases:");
            data.phaseNames.forEach((phase, idx) => {
                console.log(`   ${idx + 1}. ${phase}`);
            });
            
            if (data.samplePhase) {
                console.log("\n📖 Sample Phase Structure:");
                console.log(`   Phase: ${data.samplePhase.name}`);
                console.log(`   Modules: ${data.samplePhase.modulesCount}`);
                if (data.samplePhase.firstModule) {
                    console.log(`   First Module: ${data.samplePhase.firstModule.name}`);
                    console.log(`   Lessons in first module: ${data.samplePhase.firstModule.lessonsCount}`);
                }
            }
            
            console.log("\n✅ Full response:", data);
            return data;
        } else {
            console.error("❌ API Error:", data.error || data.message);
            console.error("Full response:", data);
            return null;
        }
    } catch (error) {
        console.error("❌ Network Error:", error.message);
        return null;
    }
}

// Example usage
console.log(
    "To test roadmap generation, run:\n\n" +
    "testRoadmapAPI('Artificial Intelligence (AI) is...' , 'beginner')\n\n" +
    "Or copy sample content below and test:\n"
);

// Sample content for testing
const sampleContent = `
Introduction to Machine Learning

Machine Learning Overview
Machine learning is a subset of artificial intelligence (AI) that enables
computers to learn and improve from experience without explicit programming.
It focuses on developing algorithms that can process data, identify patterns,
and make decisions with minimal human supervision.

Types of Machine Learning

Supervised Learning
Supervised learning involves training algorithms on labeled datasets where
the expected output is known. The algorithm learns the mapping function from
input to output variables. Common examples include:
- Regression: Predicting continuous values
- Classification: Categorizing inputs into discrete classes

Unsupervised Learning
Unsupervised learning works with unlabeled data, discovering hidden patterns
and structures. Key techniques include:
- Clustering: Grouping similar data points
- Dimensionality reduction: Reducing feature space

Reinforcement Learning
Reinforcement learning involves training agents to make decisions through
rewards and punishments, commonly used in game AI and robotics.

Key Algorithms

Decision Trees
A supervised learning algorithm that builds a tree-like model of decisions
for both classification and regression problems.

Random Forest
An ensemble method that combines multiple decision trees to improve
prediction accuracy and reduce overfitting.

Neural Networks
A machine learning model inspired by biological neurons that can learn
complex patterns through multiple layers of nodes.

Support Vector Machines (SVM)
A powerful algorithm for both classification and regression tasks that
finds the optimal hyperplane to separate data classes.

Applications of Machine Learning

Healthcare
Machine learning is revolutionizing healthcare through:
- Disease diagnosis systems
- Predictive analytics for patient outcomes
- Drug discovery and development

Finance
Financial institutions use machine learning for:
- Fraud detection
- Algorithmic trading
- Risk assessment
- Customer credit scoring

Transportation
Machine learning powers:
- Autonomous vehicle systems
- Traffic pattern prediction
- Route optimization
- Predictive maintenance

Challenges and Considerations

Data Quality
The success of machine learning depends heavily on data quality, requiring
clean, representative, and unbiased datasets.

Overfitting
Models may memorize training data rather than learning generalizable
patterns, reducing their effectiveness on new data.

Interpretability
Complex models like deep neural networks often lack transparency, making
it difficult to understand how they make decisions.

Computational Resources
Training large models requires significant computational power and storage,
raising concerns about scalability and environmental impact.

Future Directions

Transfer Learning
Techniques for applying knowledge from one task to another, reducing
training time and improving efficiency.

Explainable AI
Developing methods to make AI systems more transparent and understandable
to stakeholders and regulators.

Edge AI
Deploying machine learning models on edge devices for real-time processing
and reduced latency.

Conclusion
Machine learning continues to advance rapidly, offering transformative
potential across industries. As the field matures, focus shifts toward
more robust, fair, and interpretable systems that can be safely deployed
in critical applications.
`;

// Test function
console.log("\n✨ ROADMAP API TEST READY ✨\n");
console.log("Quick test with sample content:");
console.log("testRoadmapAPI(sampleContent, 'beginner')\n");
