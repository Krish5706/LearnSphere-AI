# 📝 Prompt Engineering Guide

## Understanding the Improved Prompts

This guide explains each prompt used in the improved roadmap generation system and how they work together to create dynamic, PDF-based content.

## Architecture Overview

```
PDF Content
    ↓
[Preprocessing: Extract, structure, sample]
    ↓
Main Topic Extraction Prompt
    ↓ (identifies main subject + sub-topics)
Comprehensive Topics Extraction Prompt (per phase)
    ↓ (finds 5-6 topics per phase, all from document)
Topic Content Generation Prompt
    ↓ (creates 3-4 paragraph detailed content per topic)
Module Lesson Generation Prompt
    ↓ (creates 3 lessons per module)
Assessment Generation Prompt
    ↓ (creates 8-10 quiz questions)
Learning Outcomes Prompt
    ↓ (creates 4-5 measurable outcomes)
Complete Roadmap
```

## Prompt Details

### 1. Main Topic Extraction Prompt

**Purpose**: Identify what the PDF is fundamentally about

**What it asks Gemini**:
- What is the EXACT main subject this document teaches?
- What are 2-3 related sub-subjects?
- What grade level or expertise level?
- What practical applications are mentioned?
- What unique terminology is central?

**Example Input**:
```
Document about: Machine Learning basics...
```

**Example Output**:
```json
{
  "mainTopic": "Machine Learning Fundamentals",
  "subTopics": ["Supervised Learning", "Unsupervised Learning", "Model Evaluation"],
  "targetLevel": "intermediate",
  "coreTerminology": ["Algorithm", "Feature", "Training", "Prediction"],
  "summary": "This document provides comprehensive introduction to machine learning..."
}
```

**Key Feature**: ✅ No static "Learning Subject" - extracts actual topic

---

### 2. Comprehensive Topics Extraction Prompt

**Purpose**: Extract ALL unique topics from PDF organized by difficulty phases

**What it asks Gemini**:
For Phase 1 (Foundational):
- Find 5-6 foundational topics that appear in the document
- Each topic must be an EXACT phrase from the content
- Include key terms for each topic (extracted from document)
- Mark topics as critical/important

For Phase 2 (Intermediate):
- Find 5-6 DIFFERENT intermediate topics
- Must be completely different from Phase 1 topics
- Focus on building on Phase 1 concepts

For Phase 3 (Advanced):
- Find 5-6 DIFFERENT advanced/specialized topics
- Must be completely different from Phases 1 & 2
- Focus on specialized applications

**Example Output**:
```json
{
  "phase1": [
    {
      "name": "Introduction to Neural Networks",
      "keyTerms": ["neurons", "weights", "activation function"],
      "importance": "critical",
      "documentReference": "Chapter 2, Section 2.1"
    }
  ],
  "phase2": [
    {
      "name": "Convolutional Neural Networks Architecture",
      "keyTerms": ["convolution", "pooling", "filters"],
      "importance": "critical",
      "documentReference": "Chapter 5"
    }
  ],
  "phase3": [
    {
      "name": "GANs for Image Generation",
      "keyTerms": ["generator", "discriminator", "adversarial training"],
      "importance": "critical"
    }
  ]
}
```

**Key Feature**: ✅ Phase 1, 2, 3 have completely different topics - no repetition!

---

### 3. Topic Content Generation Prompt

**Purpose**: Create detailed, specific content for each topic

**What it asks Gemini**:
- Explain this topic using ACTUAL concepts from the source document
- Include 3-4 detailed paragraphs
- Define key terms as they're used in the document context
- Provide real examples from the document
- Show connections to other topics
- Include practical applications mentioned in the document

**Example Topic**: "Decision Trees in Machine Learning"

**Example Output**:
```json
{
  "topic": "Decision Trees in Machine Learning",
  "content": "Decision trees are hierarchical models that recursively partition 
the feature space to create a tree-like structure for both regression and classification 
tasks. Each internal node in the tree represents a decision rule based on a feature, 
each branch represents an outcome of that decision, and each leaf node represents a 
final prediction or class label. The algorithm selects features that best separate 
the data by using information gain, which measures how much a feature reduces entropy 
in the dataset, allowing the algorithm to make optimal splitting decisions. Decision 
trees are particularly valued for their interpretability, as they can be easily 
visualized and explained to non-technical stakeholders, making them ideal for 
applications where model transparency is important...",
  "keyPoints": [
    "Decision trees work by recursively splitting data based on feature values",
    "Information gain uses entropy to select the best features for splitting",
    "Tree pruning prevents overfitting and improves generalization",
    "Decision trees handle both categorical and numerical data effectively"
  ],
  "definitions": {
    "entropy": "Measure of disorder in a dataset; lower entropy means more ordered data",
    "information_gain": "Reduction in entropy after splitting on a feature",
    "pruning": "Process of removing branches that don't improve predictions"
  },
  "examples": [
    {
      "title": "Iris Flower Classification",
      "description": "Using decision tree to classify iris flowers based on sepal length and width..."
    }
  ],
  "connections": "Decision trees are foundational to ensemble methods like Random Forests and Gradient Boosting...",
  "practicalApplications": [
    "Medical diagnosis systems for clinical decision-making",
    "Credit approval decisions in banking",
    "Customer segmentation for targeted marketing"
  ]
}
```

**Key Feature**: ✅ All content from actual document, not generic templates

---

### 4. Detailed Lesson Generation Prompt

**Purpose**: Create complete, implementation-ready lesson plans

**What it asks Gemini**:
- Create a lesson on [topic] using document content
- Include learning objectives
- Write engaging introduction explaining relevance
- Provide 4-6 paragraphs of detailed content
- Include key takeaway points
- Add 2-3 hands-on practice activities
- Address common misconceptions
- Connect to next topic

**Example Lesson Output**:
```json
{
  "lessonTitle": "Implementing Decision Trees: From Theory to Practice",
  "learningObjectives": [
    "Implement a decision tree classifier from scratch",
    "Understand information gain calculation",
    "Apply tree pruning to prevent overfitting"
  ],
  "introduction": "Decision trees are one of the most intuitive machine learning 
algorithms, and in this lesson, we'll move from understanding how they work to 
implementing them in code. You'll learn not just how to use pre-built functions, 
but how the algorithm actually makes decisions at each node.",
  "mainContent": "[4-6 detailed paragraphs from document]",
  "keyPoints": [
    "Always calculate information gain before each split",
    "Beware of overfitting - a deep tree memorizes training data",
    "Feature selection significantly impacts tree structure"
  ],
  "examples": [
    {
      "title": "Binary Classification Example",
      "description": "Step-by-step example of how a decision tree makes decisions..."
    }
  ],
  "practiceActivities": [
    {
      "activity": "Implement Information Gain Calculation",
      "instructions": "Calculate entropy and information gain for a given dataset...",
      "expectedOutcome": "Understand how the algorithm selects the best feature"
    },
    {
      "activity": "Build Tree from Scratch",
      "instructions": "Implement a simple decision tree without using sklearn...",
      "expectedOutcome": "Complete understanding of internal mechanics"
    }
  ],
  "commonMisconceptions": [
    "Misconception: Deeper trees are always better. Reality: Deeper trees overfit",
    "Misconception: Information gain only works with categorical data. Reality: It works with numerical too"
  ],
  "summary": "You now understand how decision trees work internally and can implement them from scratch.",
  "nextSteps": "In the next lesson, we'll learn how Random Forests improve on single decision trees..."
}
```

**Key Feature**: ✅ Lessons are specific, engaging, and based on document content

---

### 5. Quiz Question Generation Prompt

**Purpose**: Create meaningful, document-based assessment questions

**What it asks Gemini**:
- Generate 8-10 multiple-choice questions
- Each question tests understanding of document content
- Use real terminology and examples from the source
- Include wrong but plausible distractors
- Progress from basic to higher-order thinking
- Explain why correct answer is right

**Example Questions Output**:
```json
[
  {
    "id": "q1",
    "question": "What is the primary measure used by decision trees to determine the best feature for splitting at each node?",
    "options": [
      "Information gain",
      "Standard deviation",
      "Mean absolute error",
      "Variance ratio"
    ],
    "correctAnswer": "Information gain",
    "explanation": "Decision trees use information gain, which measures how much a feature reduces entropy in the dataset. This metric helps the algorithm select features that best separate the data. While the other options can be used in other machine learning contexts, information gain is the standard metric for decision trees in classification tasks (as discussed in Chapter 3 of the reference material).",
    "difficultyLevel": "medium",
    "bloomsLevel": "understand",
    "topicsTested": ["Information Gain", "Feature Selection"]
  },
  {
    "id": "q2",
    "question": "When would you use pruning in a decision tree, and why?",
    "options": [
      "To reduce tree size and prevent overfitting on training data",
      "To increase tree depth for better accuracy",
      "To remove features from the dataset",
      "To improve training time without affecting accuracy"
    ],
    "correctAnswer": "To reduce tree size and prevent overfitting on training data",
    "explanation": "Pruning removes branches that don't improve predictions on validation data, preventing overfitting (a tree memorizing training data). As shown in the document's examples, unpruned trees often perform well on training data but poorly on new data. Pruning balances model complexity with generalization ability.",
    "difficultyLevel": "hard",
    "bloomsLevel": "analyze",
    "topicsTested": ["Overfitting", "Pruning"]
  }
]
```

**Key Feature**: ✅ Questions are meaningful and reference document concepts

---

### 6. Learning Outcomes Generation Prompt

**Purpose**: Define measurable learning outcomes for each module

**What it asks Gemini**:
- Create 4-5 measurable outcomes
- Use Bloom's taxonomy (remember → understand → apply → analyze → evaluate → create)
- Make outcomes achievable after completing module
- Base outcomes on actual module content

**Example Output**:
```json
[
  {
    "outcome": "Implement a decision tree classifier using scikit-learn",
    "description": "Students will be able to build and train decision tree models on real datasets, select appropriate parameters, and evaluate model performance.",
    "bloomsLevel": "apply",
    "measurable": true,
    "relatedTopics": ["Decision Trees", "Implementation", "Model Evaluation"]
  },
  {
    "outcome": "Analyze and explain why overfitting occurs in deep decision trees",
    "description": "Students will compare pruned vs unpruned trees, investigate complexity-accuracy tradeoffs, and recommend appropriate tree depths.",
    "bloomsLevel": "analyze",
    "measurable": true,
    "relatedTopics": ["Overfitting", "Pruning", "Regularization"]
  }
]
```

**Key Feature**: ✅ Outcomes are specific and measurable

---

## How Prompts Work Together

### Flow 1: Content Extraction

```
Main Topic Extraction Prompt
↓
"Machine Learning Fundamentals" (from document)
↓
Guides all subsequent prompts to focus on ML

Comprehensive Topics Extraction Prompt
↓
"Phase 1: [Foundational ML topics]"
"Phase 2: [Intermediate ML topics]"
"Phase 3: [Advanced ML topics]"
↓
All topics extracted from the document
```

### Flow 2: Content Generation

```
Topic (e.g., "Decision Trees")
↓
Topic Content Generation Prompt
↓
Detailed content about this specific topic
↓
Lesson Generation Prompt
↓
Creates 2-3 lessons about Decision Trees specifically
↓
Assessment Generation Prompt
↓
Creates quiz questions specifically about Decision Trees
```

## Customizing Prompts

### Add Your Own Focus Areas

**Example**: If you want to emphasize "real-world applications"

```javascript
// In improvedGeminiPrompts.js
static getCustomTopicPrompt(topicName, focusArea, content) {
  return `Generate content about "${topicName}"
  
  SPECIAL FOCUS: ${focusArea}
  
  [rest of prompt...
  
  REQUIREMENTS:
  - Include 2-3 examples of ${focusArea}
  - Explain how this applies in ${focusArea}
  - [...]
}
```

### Adjust Difficulty Level

**For Beginner**:
- Simpler terminology
- More basic examples
- Fewer advanced concepts

**For Advanced**:
- Complex terminology
- Research paper examples
- Advanced connections

## Debugging Prompts

### Check What Gemini Received

```javascript
// Add logging to improvedRoadmapService.js
async callGeminiWithTimeout(prompt, timeoutMs = 30000) {
  console.log('📨 Sending to Gemini:');
  console.log('Prompt length:', prompt.length);
  console.log('First 500 chars:', prompt.substring(0, 500));
  // ... rest of function
}
```

### Verify Prompt Quality

Good prompt indicators:
- ✅ Specific request (not vague)
- ✅ References source content (not generic)
- ✅ Clear output format (JSON, bullet points)
- ✅ Quality requirements (specific, measurable, etc)
- ✅ Examples provided

Bad prompt indicators:
- ❌ Generic instructions
- ❌ Vague requests
- ❌ No format specification
- ❌ No requirements defined
- ❌ Too long/complex

## Performance Optimization

### Reduce Content Samples

```javascript
// Instead of full 30,000 characters
const sample = content.substring(0, 10000);  // Faster processing

// But ensure it has enough context
if (sample.length < 1000) {
  content = content;  // Use full content if sample too small
}
```

### Parallel Prompt Execution

```javascript
// Generate multiple things in parallel
const [lessons, outcomes, assessment] = await Promise.all([
  generateLessons(topics, content),
  generateOutcomes(topics, content),
  generateAssessment(topics, content)
]);
```

### Caching Prompts

```javascript
// Cache extracted topics to avoid re-extraction
const topicsCache = new Map();

async extractComprehensiveTopicsImproved(content, numPhases) {
  const cacheKey = md5(content);  // Hash content for cache key
  
  if (topicsCache.has(cacheKey)) {
    console.log('Using cached topics');
    return topicsCache.get(cacheKey);
  }
  
  // ... normal extraction
  
  topicsCache.set(cacheKey, result);
  return result;
}
```

## Examples: Before and After Prompts

### Example 1: Topic Extraction

**OLD PROMPT** (Generic):
```
Extract topics from this content
```

**NEW PROMPT** (Specific):
```
Extract 5-6 FOUNDATIONAL topics that:
1. Are EXACT phrases from the document
2. Relate to core principles (not advanced)
3. Each has 3-4 key terms from content
4. Marked as critical or important
5. Include document reference location
```

### Example 2: Content Generation

**OLD PROMPT** (Generic):
```
Write about this topic
```

**NEW PROMPT** (Specific):
```
Generate 3-4 detailed paragraphs about "${topicName}":
1. Include real terminology from source
2. Provide concrete examples from document
3. Explain connections to other topics
4. Address practical applications
5. Use definitions as context in document
6. Return structured JSON with all sections
```

## Best Practices for Prompt Engineering

1. **Be Specific**: Narrow, detailed requests outperform vague ones
2. **Include Context**: Reference source material (document content)
3. **Define Format**: Specify exact output format (JSON, list, etc)
4. **Add Examples**: Show what good output looks like
5. **Include Constraints**: Specify must-haves and must-nots
6. **Use Role Prompting**: "You are an expert educator" helps quality
7. **Test Variations**: Try different phrasings to find best results
8. **Monitor Quality**: Log outputs and check for consistency

---

**Master these prompts and you can customize the entire roadmap generation system!**
