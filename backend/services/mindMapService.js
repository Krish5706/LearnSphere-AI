/**
 * LLM-Free Mind Map Generation Service
 * Complete offline pipeline: PDF → Structure Detection → Keywords → Clustering → Hierarchy → JSON
 */

const natural = require('natural');
const { Matrix } = require('ml-matrix');
const { distance } = require('ml-distance');

class MindMapService {
    constructor() {
        // Initialize NLP tools
        this.tokenizer = new natural.WordTokenizer();
        this.stemmer = natural.PorterStemmer;
        this.stopwords = natural.stopwords;
        
        // Academic domain words to boost
        this.academicTerms = new Set([
            'definition', 'concept', 'theory', 'principle', 'method', 'approach',
            'analysis', 'synthesis', 'evaluation', 'application', 'implementation',
            'structure', 'function', 'process', 'system', 'model', 'framework',
            'algorithm', 'protocol', 'standard', 'specification', 'architecture'
        ]);
    }

    /**
     * Main entry point: Generate mind map from PDF text
     * @param {string} pdfText - Extracted PDF text
     * @returns {Promise<Object>} - Mind map with nodes, edges, and confidence
     */
    async generateMindMap(pdfText) {
        try {
            console.log('🧠 Starting LLM-free mind map generation...');
            
            // Step 1: Clean and preprocess text
            const cleanedText = this._preprocessText(pdfText);
            
            // Step 2: Rule-based structure detection
            const structure = this._detectStructure(cleanedText);
            console.log(`📋 Detected ${structure.headings.length} headings, ${structure.sections.length} sections`);
            
            // Step 3: Extract keywords and keyphrases
            const keywords = this._extractKeywords(cleanedText, 30);
            const keyphrases = this._extractKeyphrases(cleanedText, 20);
            console.log(`🔑 Extracted ${keywords.length} keywords, ${keyphrases.length} keyphrases`);
            
            // Step 4: Build semantic similarity matrix
            const sentences = this._splitIntoSentences(cleanedText);
            const similarityMatrix = this._buildSimilarityMatrix(sentences);
            
            // Step 5: Cluster related concepts
            const clusters = this._clusterConcepts(keywords, keyphrases, similarityMatrix, sentences);
            console.log(`🎯 Created ${clusters.length} concept clusters`);
            
            // Step 6: Auto-label clusters
            const labeledClusters = this._labelClusters(clusters, keywords, keyphrases);
            
            // Step 7: Infer hierarchy
            const hierarchy = this._inferHierarchy(structure, labeledClusters, keywords);
            
            // Step 8: Calculate confidence score
            const confidence = this._calculateConfidence(structure, clusters, keywords);
            
            // Step 9: Build final mind map structure
            const mindMap = this._buildMindMapJSON(hierarchy, confidence);
            
            console.log(`✅ Mind map generated: ${mindMap.nodes.length} nodes, ${mindMap.edges.length} edges`);
            
            return mindMap;
            
        } catch (error) {
            console.error('Mind map generation error:', error);
            throw new Error(`Failed to generate mind map: ${error.message}`);
        }
    }

    /**
     * Preprocess text: clean, normalize, remove noise
     */
    _preprocessText(text) {
        return text
            .replace(/\s+/g, ' ')           // Normalize whitespace
            .replace(/[^\w\s\.\,\:\;\!\?\-]/g, ' ') // Remove special chars
            .replace(/\d+\.\d+/g, '')       // Remove version numbers
            .trim();
    }

    /**
     * Rule-based structure detection
     * Detects headings, sections, lists based on patterns
     */
    _detectStructure(text) {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const headings = [];
        const sections = [];
        let currentSection = null;

        lines.forEach((line, index) => {
            // Detect headings: numbered, ALL CAPS, or short lines with colons
            const isNumberedHeading = /^(\d+\.?\s+)+[A-Z]/.test(line);
            const isAllCaps = line === line.toUpperCase() && line.length < 100 && line.length > 5;
            const isShortWithColon = line.length < 80 && line.endsWith(':') && !line.includes('.');
            const isBoldPattern = /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*:?$/.test(line) && line.length < 60;

            if (isNumberedHeading || isAllCaps || isShortWithColon || isBoldPattern) {
                headings.push({
                    text: line.replace(/^(\d+\.?\s+)+/, '').replace(':', '').trim(),
                    level: this._detectHeadingLevel(line),
                    lineIndex: index
                });

                if (currentSection) {
                    sections.push(currentSection);
                }
                currentSection = {
                    heading: line.replace(/^(\d+\.?\s+)+/, '').replace(':', '').trim(),
                    content: [],
                    startIndex: index
                };
            } else if (currentSection) {
                currentSection.content.push(line);
            }
        });

        if (currentSection) {
            sections.push(currentSection);
        }

        return { headings, sections };
    }

    /**
     * Detect heading level (1-3) based on formatting
     */
    _detectHeadingLevel(line) {
        const numberedMatch = line.match(/^(\d+\.?\s+)+/);
        if (numberedMatch) {
            const depth = numberedMatch[0].split(/\.|\s+/).filter(s => s).length;
            return Math.min(depth, 3);
        }
        if (line === line.toUpperCase()) return 1;
        if (line.endsWith(':')) return 2;
        return 2;
    }

    /**
     * Extract keywords using TF-IDF
     */
    _extractKeywords(text, count = 30) {
        const sentences = this._splitIntoSentences(text);
        const allTerms = [];
        
        // Tokenize and count terms
        const termFreq = {};
        const docFreq = {};
        
        sentences.forEach(sentence => {
            const tokens = this.tokenizer.tokenize(sentence.toLowerCase());
            const uniqueTerms = new Set();
            
            tokens.forEach(token => {
                const stemmed = this.stemmer.stem(token);
                if (token.length > 2 && !this.stopwords.includes(token)) {
                    termFreq[stemmed] = (termFreq[stemmed] || 0) + 1;
                    uniqueTerms.add(stemmed);
                }
            });
            
            uniqueTerms.forEach(term => {
                docFreq[term] = (docFreq[term] || 0) + 1;
            });
        });

        // Calculate TF-IDF scores
        const tfidfScores = {};
        const totalDocs = sentences.length;
        
        Object.keys(termFreq).forEach(term => {
            const tf = termFreq[term] / Object.keys(termFreq).length;
            const idf = Math.log(totalDocs / (docFreq[term] || 1));
            let score = tf * idf;
            
            // Boost academic terms
            if (this.academicTerms.has(term)) {
                score *= 1.5;
            }
            
            tfidfScores[term] = score;
        });

        // Get top keywords
        const sorted = Object.entries(tfidfScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, count)
            .map(([term, score]) => ({ term, score }));

        return sorted;
    }

    /**
     * Extract keyphrases (multi-word terms) using RAKE-like algorithm
     */
    _extractKeyphrases(text, count = 20) {
        const sentences = this._splitIntoSentences(text);
        const phraseFreq = {};
        
        sentences.forEach(sentence => {
            const tokens = this.tokenizer.tokenize(sentence.toLowerCase());
            const phrases = [];
            
            // Extract 2-3 word phrases
            for (let i = 0; i < tokens.length - 1; i++) {
                const word1 = tokens[i];
                const word2 = tokens[i + 1];
                
                if (word1 && word2 && 
                    !this.stopwords.includes(word1) && 
                    !this.stopwords.includes(word2) &&
                    word1.length > 2 && word2.length > 2) {
                    phrases.push(`${word1} ${word2}`);
                }
                
                if (i < tokens.length - 2) {
                    const word3 = tokens[i + 2];
                    if (word3 && !this.stopwords.includes(word3) && word3.length > 2) {
                        phrases.push(`${word1} ${word2} ${word3}`);
                    }
                }
            }
            
            phrases.forEach(phrase => {
                phraseFreq[phrase] = (phraseFreq[phrase] || 0) + 1;
            });
        });

        // Score phrases by frequency and length
        const scoredPhrases = Object.entries(phraseFreq)
            .map(([phrase, freq]) => ({
                phrase,
                score: freq * (phrase.split(' ').length * 0.5) // Boost longer phrases
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, count);

        return scoredPhrases;
    }

    /**
     * Split text into sentences
     */
    _splitIntoSentences(text) {
        return text
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 10);
    }

    /**
     * Build semantic similarity matrix using TF-IDF vectors
     */
    _buildSimilarityMatrix(sentences) {
        const n = sentences.length;
        const matrix = new Matrix(n, n);
        
        // Build TF-IDF vectors for each sentence
        const vectors = sentences.map(sentence => {
            const tokens = this.tokenizer.tokenize(sentence.toLowerCase());
            const termFreq = {};
            
            tokens.forEach(token => {
                const stemmed = this.stemmer.stem(token);
                if (token.length > 2 && !this.stopwords.includes(token)) {
                    termFreq[stemmed] = (termFreq[stemmed] || 0) + 1;
                }
            });
            
            return termFreq;
        });

        // Calculate cosine similarity
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    matrix.set(i, j, 1.0);
                } else {
                    const similarity = this._cosineSimilarity(vectors[i], vectors[j]);
                    matrix.set(i, j, similarity);
                }
            }
        }

        return matrix;
    }

    /**
     * Calculate cosine similarity between two term frequency vectors
     */
    _cosineSimilarity(vec1, vec2) {
        const allTerms = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        allTerms.forEach(term => {
            const val1 = vec1[term] || 0;
            const val2 = vec2[term] || 0;
            dotProduct += val1 * val2;
            norm1 += val1 * val1;
            norm2 += val2 * val2;
        });

        if (norm1 === 0 || norm2 === 0) return 0;
        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    /**
     * Cluster related concepts using agglomerative clustering
     */
    _clusterConcepts(keywords, keyphrases, similarityMatrix, sentences) {
        const clusters = [];
        const used = new Set();
        
        // Group by semantic similarity
        const threshold = 0.3; // Minimum similarity to cluster
        
        keywords.forEach((kw, i) => {
            if (used.has(i)) return;
            
            const cluster = {
                keywords: [kw.term],
                keyphrases: [],
                sentences: [],
                id: `cluster_${i}`
            };
            
            // Find similar keywords
            keywords.forEach((otherKw, j) => {
                if (i !== j && !used.has(j)) {
                    // Simple similarity: check if terms appear together in sentences
                    const cooccurrence = this._checkCooccurrence(kw.term, otherKw.term, sentences);
                    if (cooccurrence > threshold) {
                        cluster.keywords.push(otherKw.term);
                        used.add(j);
                    }
                }
            });
            
            // Add related keyphrases
            keyphrases.forEach(kp => {
                const phraseWords = kp.phrase.split(' ');
                if (phraseWords.some(w => cluster.keywords.some(k => k.includes(w) || w.includes(k)))) {
                    cluster.keyphrases.push(kp.phrase);
                }
            });
            
            if (cluster.keywords.length > 0) {
                clusters.push(cluster);
                used.add(i);
            }
        });

        // Merge small clusters
        return this._mergeSmallClusters(clusters, 2);
    }

    /**
     * Check co-occurrence of two terms in sentences
     */
    _checkCooccurrence(term1, term2, sentences) {
        let cooccurrenceCount = 0;
        sentences.forEach(sentence => {
            const lowerSentence = sentence.toLowerCase();
            if (lowerSentence.includes(term1) && lowerSentence.includes(term2)) {
                cooccurrenceCount++;
            }
        });
        return cooccurrenceCount / sentences.length;
    }

    /**
     * Merge clusters with fewer than minSize items
     */
    _mergeSmallClusters(clusters, minSize) {
        const largeClusters = [];
        const smallClusters = [];
        
        clusters.forEach(cluster => {
            if (cluster.keywords.length >= minSize) {
                largeClusters.push(cluster);
            } else {
                smallClusters.push(cluster);
            }
        });
        
        // Merge small clusters into nearest large cluster
        smallClusters.forEach(small => {
            let bestMatch = null;
            let bestScore = 0;
            
            largeClusters.forEach(large => {
                const score = this._clusterSimilarity(small, large);
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = large;
                }
            });
            
            if (bestMatch && bestScore > 0.2) {
                bestMatch.keywords.push(...small.keywords);
                bestMatch.keyphrases.push(...small.keyphrases);
            } else {
                // Keep as separate if no good match
                largeClusters.push(small);
            }
        });
        
        return largeClusters;
    }

    /**
     * Calculate similarity between two clusters
     */
    _clusterSimilarity(cluster1, cluster2) {
        const terms1 = new Set(cluster1.keywords);
        const terms2 = new Set(cluster2.keywords);
        const intersection = [...terms1].filter(t => terms2.has(t)).length;
        const union = new Set([...terms1, ...terms2]).size;
        return union > 0 ? intersection / union : 0;
    }

    /**
     * Auto-label clusters using most frequent/important keywords
     */
    _labelClusters(clusters, keywords, keyphrases) {
        return clusters.map((cluster, index) => {
            // Find best label from keywords
            const keywordScores = {};
            cluster.keywords.forEach(term => {
                const kw = keywords.find(k => k.term === term);
                if (kw) {
                    keywordScores[term] = kw.score;
                }
            });
            
            const sortedKeywords = Object.entries(keywordScores)
                .sort((a, b) => b[1] - a[1]);
            
            let label = sortedKeywords[0]?.[0] || cluster.keywords[0] || `Topic ${index + 1}`;
            
            // Try to find a keyphrase that matches
            const matchingPhrase = keyphrases.find(kp => {
                const phraseWords = kp.phrase.split(' ');
                return phraseWords.some(w => cluster.keywords.some(k => k.includes(w) || w.includes(k)));
            });
            
            if (matchingPhrase && matchingPhrase.score > 2) {
                label = matchingPhrase.phrase;
            }
            
            // Capitalize and clean label
            label = label
                .split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
            
            return {
                ...cluster,
                label: label.length > 50 ? label.substring(0, 50) + '...' : label
            };
        });
    }

    /**
     * Infer hierarchy from structure and clusters
     */
    _inferHierarchy(structure, clusters, keywords) {
        const hierarchy = {
            root: null,
            mainNodes: [],
            subNodes: []
        };
        
        // Use first major heading as root, or create from top keywords
        if (structure.headings.length > 0) {
            const mainHeading = structure.headings[0];
            hierarchy.root = {
                id: 'root',
                label: mainHeading.text || this._createRootLabel(keywords),
                type: 'root',
                level: 0
            };
        } else {
            hierarchy.root = {
                id: 'root',
                label: this._createRootLabel(keywords),
                type: 'root',
                level: 0
            };
        }
        
        // Map clusters to main nodes
        clusters.slice(0, 8).forEach((cluster, index) => {
            hierarchy.mainNodes.push({
                id: `main_${index + 1}`,
                label: cluster.label,
                type: 'main',
                level: 1,
                cluster: cluster,
                parentId: 'root'
            });
        });
        
        // Create sub-nodes from remaining clusters or keyphrases
        clusters.slice(8, 15).forEach((cluster, index) => {
            // Find parent based on keyword overlap
            const parent = this._findBestParent(cluster, hierarchy.mainNodes);
            hierarchy.subNodes.push({
                id: `sub_${index + 1}`,
                label: cluster.label,
                type: 'sub',
                level: 2,
                cluster: cluster,
                parentId: parent?.id || 'root'
            });
        });
        
        return hierarchy;
    }

    /**
     * Create root label from top keywords
     */
    _createRootLabel(keywords) {
        const topTerms = keywords.slice(0, 3).map(k => k.term);
        return topTerms
            .map(t => t.charAt(0).toUpperCase() + t.slice(1))
            .join(' & ') || 'Document Topics';
    }

    /**
     * Find best parent node for a cluster
     */
    _findBestParent(cluster, mainNodes) {
        let bestParent = null;
        let bestScore = 0;
        
        mainNodes.forEach(main => {
            const score = this._clusterSimilarity(cluster, main.cluster);
            if (score > bestScore) {
                bestScore = score;
                bestParent = main;
            }
        });
        
        return bestParent || mainNodes[0];
    }

    /**
     * Calculate confidence score
     */
    _calculateConfidence(structure, clusters, keywords) {
        let structureScore = 0.5; // Base score
        if (structure.headings.length > 0) structureScore = 0.8;
        if (structure.sections.length > 3) structureScore = 0.9;
        
        const keywordDensity = Math.min(keywords.length / 30, 1.0);
        const clusterCohesion = Math.min(clusters.length / 10, 1.0);
        
        const confidence = 
            structureScore * 0.4 +
            keywordDensity * 0.3 +
            clusterCohesion * 0.3;
        
        return Math.round(confidence * 100);
    }

    /**
     * Calculate positions for mind map nodes in a hierarchical layout
     */
    _calculateNodePositions(hierarchy) {
        const positions = {};
        const centerX = 0;
        const centerY = 0;

        // Root node at center
        positions[hierarchy.root.id] = { x: centerX, y: centerY };

        // Main nodes in a circle around root
        const mainNodeCount = hierarchy.mainNodes.length;
        const mainRadius = 200; // Distance from center

        hierarchy.mainNodes.forEach((main, index) => {
            const angle = (2 * Math.PI * index) / mainNodeCount;
            positions[main.id] = {
                x: centerX + mainRadius * Math.cos(angle),
                y: centerY + mainRadius * Math.sin(angle)
            };
        });

        // Sub-nodes around their parent main nodes
        const subRadius = 150; // Distance from parent

        hierarchy.subNodes.forEach((sub) => {
            const parentPos = positions[sub.parentId];
            if (parentPos) {
                // Count sub-nodes for this parent
                const siblings = hierarchy.subNodes.filter(s => s.parentId === sub.parentId);
                const siblingIndex = siblings.findIndex(s => s.id === sub.id);
                const siblingCount = siblings.length;

                // Position sub-nodes in a smaller circle around parent
                const angle = (2 * Math.PI * siblingIndex) / siblingCount;
                positions[sub.id] = {
                    x: parentPos.x + subRadius * Math.cos(angle),
                    y: parentPos.y + subRadius * Math.sin(angle)
                };
            } else {
                // Fallback if parent not found
                positions[sub.id] = { x: centerX + 300, y: centerY + (Math.random() - 0.5) * 200 };
            }
        });

        return positions;
    }

    /**
     * Build final mind map JSON structure
     */
    _buildMindMapJSON(hierarchy, confidence) {
        const nodes = [];
        const edges = [];

        // Calculate positions for all nodes
        const positions = this._calculateNodePositions(hierarchy);

        // Add root node
        nodes.push({
            id: hierarchy.root.id,
            data: { label: hierarchy.root.label },
            type: hierarchy.root.type,
            level: hierarchy.root.level,
            position: positions[hierarchy.root.id] || { x: 0, y: 0 }
        });

        // Add main nodes
        hierarchy.mainNodes.forEach((main) => {
            nodes.push({
                id: main.id,
                data: { label: main.label },
                type: main.type,
                level: main.level,
                position: positions[main.id] || { x: 0, y: 0 }
            });

            edges.push({
                id: `e_${hierarchy.root.id}_${main.id}`,
                source: hierarchy.root.id,
                target: main.id,
                label: ''
            });
        });

        // Add sub-nodes
        hierarchy.subNodes.forEach((sub) => {
            nodes.push({
                id: sub.id,
                data: { label: sub.label },
                type: sub.type,
                level: sub.level,
                position: positions[sub.id] || { x: 0, y: 0 }
            });

            edges.push({
                id: `e_${sub.parentId}_${sub.id}`,
                source: sub.parentId,
                target: sub.id,
                label: ''
            });
        });

        return {
            nodes,
            edges,
            confidence,
            metadata: {
                generatedAt: new Date().toISOString(),
                method: 'LLM-Free Statistical NLP',
                nodeCount: nodes.length,
                edgeCount: edges.length
            }
        };
    }
}

module.exports = new MindMapService();

