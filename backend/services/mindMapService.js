/**
 * Deterministic Mind Map Generation Service
 * Converts PDF text to hierarchical mind map using fixed rules (No LLM, No API)
*/

class MindMapService {
    constructor() {
        // Basic stop words list for statistical fallback
        this.stopWords = new Set([
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
            'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there',
            'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no',
            'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
            'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well',
            'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'page', 'pages'
        ]);
    }

    /**
     * Main entry point: Generate mind map from PDF text
     * @param {string} pdfText - Extracted PDF text
     * @returns {Object} - Mind map with nodes and edges
     */
    generateMindMap(pdfText) {
        try {
            console.log('🧠 [MINDMAP SERVICE] Starting hybrid mind map generation...');
            console.log('🧠 [MINDMAP SERVICE] PDF text length:', pdfText?.length || 0);

            if (!pdfText || pdfText.trim().length === 0) {
                throw new Error('PDF text is empty or undefined');
            }

            // Step 1: Split into lines, preserve formatting
            const lines = this._splitIntoLines(pdfText);
            console.log('🧠 [MINDMAP SERVICE] Split into', lines.length, 'lines');

            // Step 2: Try Rule-Based Approach
            let rootNode = this._identifyRootNode(lines);
            console.log('🧠 [MINDMAP SERVICE] Root node identified:', rootNode);

            let nodes = [];
            let edges = [];
            let method = 'Rule-Based';

            // Always process lines, even if root was fallback
            const result = this._processLines(lines, rootNode);
            nodes = result.nodes;
            edges = result.edges;
            console.log('🧠 [MINDMAP SERVICE] Rule-based processing complete:', nodes.length, 'nodes,', edges.length, 'edges');

            // Step 3: Statistical Fallback (Hybrid)
            // If rule-based failed or produced too few nodes, use statistical extraction
            if (nodes.length < 5) {
                console.log('🧠 [MINDMAP SERVICE] Rule-based parsing yielded low results. Switching to statistical extraction...');
                const statResult = this._generateStatisticalMindMap(pdfText);
                if (statResult.nodes.length > nodes.length) {
                    nodes = statResult.nodes;
                    edges = statResult.edges;
                    method = 'Statistical (Hybrid)';
                    console.log('🧠 [MINDMAP SERVICE] Statistical fallback applied:', nodes.length, 'nodes,', edges.length, 'edges');
                }
            }

            // Ensure we have at least a basic mind map
            if (nodes.length === 0) {
                console.log('🧠 [MINDMAP SERVICE] No nodes generated, creating fallback mind map');
                nodes = [{
                    id: 'root',
                    data: { label: 'Document Content' },
                    position: { x: 0, y: 0 },
                    type: 'default'
                }];
                edges = [];
                method = 'Fallback';
            }

            console.log(`🧠 [MINDMAP SERVICE] Mind map generated successfully: ${nodes.length} nodes, ${edges.length} edges using ${method} method`);

            // Preprocess and validate the final result for React Flow v12 compatibility
            const processedResult = this._preprocessMindMapResult(nodes, edges, method);

            console.log('🧠 [MINDMAP SERVICE] Returning processed mind map result:', JSON.stringify(processedResult, null, 2));
            return processedResult;

        } catch (error) {
            console.error('🧠 [MINDMAP SERVICE] Mind map generation error:', error);
            console.error('🧠 [MINDMAP SERVICE] Error stack:', error.stack);

            // Return a basic fallback mind map even on error
            const fallbackMindMap = {
                nodes: [{
                    id: 'root',
                    data: { label: 'Error: Could not generate mind map' },
                    position: { x: 0, y: 0 },
                    type: 'default'
                }],
                edges: [],
                metadata: {
                    generatedAt: new Date().toISOString(),
                    method: 'Error Fallback',
                    nodeCount: 1,
                    edgeCount: 0,
                    error: error.message
                }
            };

            console.log('🧠 [MINDMAP SERVICE] Returning error fallback mind map');
            return fallbackMindMap;
        }
    }

    /**
     * Split text into lines, preserving indentation and formatting
     */
    _splitIntoLines(text) {
        return text.split('\n')
            .map(line => ({
                text: line,
                trimmed: line.trim(),
                indent: line.length - line.trimStart().length
            }))
            .filter(line => line.trimmed.length > 0);
    }

    /**
     * STEP 1: Identify Root Node
     * First meaningful line that is not empty, <10 words, not page number
     */
    _identifyRootNode(lines) {
        for (const line of lines) {
            const words = line.trimmed.split(/\s+/);

            // Skip if empty, too long, or looks like page number
            if (words.length === 0 || words.length >= 20) continue;
            if (this._isPageNumber(line.trimmed)) continue;

            return {
                id: 'root',
                label: this._normalizeLabel(line.trimmed),
                originalText: line.trimmed
            };
        }
        
        // Fallback: Use the first non-empty line if reasonable, otherwise generic
        if (lines.length > 0 && lines[0].trimmed.length < 80) {
            return { id: 'root', label: this._normalizeLabel(lines[0].trimmed), originalText: lines[0].trimmed };
        }

        return { id: 'root', label: 'Central Topic', originalText: '' };
    }

    /**
     * Check if line looks like a page number
     */
    _isPageNumber(text) {
        // Simple heuristics for page numbers
        return /^\d+$/.test(text.trim()) ||
               /^Page \d+$/i.test(text.trim()) ||
               /^\d+\/\d+$/.test(text.trim());
    }

    /**
     * STEP 2 & 3: Process lines to create Level-1 and Level-2 nodes
     */
    _processLines(lines, rootNode) {
        const nodes = [this._createNodeObject(rootNode, { x: 0, y: 0 })];
        const edges = [];
        let currentParent = rootNode;
        let nodeCounter = 1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Skip the root line
            if (line.trimmed === rootNode.originalText) continue;

            // Skip noise
            if (this._isNoise(line.trimmed)) continue;

            const level1Node = this._detectLevel1Node(line);
            if (level1Node) {
                // Create Level-1 node
                const nodeId = `node_${nodeCounter++}`;
                const position = this._calculatePosition(nodes.length, 1);
                const node = this._createNodeObject({
                    id: nodeId,
                    label: this._normalizeLabel(level1Node.label),
                    originalText: line.trimmed
                }, position);

                nodes.push(node);
                edges.push({
                    id: `edge_${rootNode.id}_${nodeId}`,
                    source: rootNode.id,
                    target: nodeId
                });

                currentParent = { id: nodeId, label: level1Node.label };
                continue;
            }

            const level2Node = this._detectLevel2Node(line, currentParent);
            if (level2Node) {
                // Create Level-2 node
                const nodeId = `node_${nodeCounter++}`;
                const position = this._calculatePosition(nodes.length, 2);
                const node = this._createNodeObject({
                    id: nodeId,
                    label: this._normalizeLabel(level2Node.label),
                    originalText: line.trimmed
                }, position);

                nodes.push(node);
                edges.push({
                    id: `edge_${currentParent.id}_${nodeId}`,
                    source: currentParent.id,
                    target: nodeId
                });
            }
        }

        return { nodes, edges };
    }

    /**
     * Detect Level-1 Node (Main Topics)
     */
    _detectLevel1Node(line) {
        const text = line.trimmed;

        // Check conditions
        const startsWithNumbering = /^(\d+\.?\s*)+[A-Z]/.test(text) ||
                                   /^[IVXLCD]+\.\s*[A-Z]/i.test(text) ||
                                   /^[A-Z]\.\s*[A-Z]/i.test(text);

        const endsWithColon = text.endsWith(':') && !text.includes('.');

        const isTitleCase = /^[A-Z][a-z]*(\s+[A-Z][a-z]*)*:?$/.test(text);

        const wordCount = text.split(/\s+/).length;
        const isShort = wordCount <= 12;

        const isFullyCapitalized = text === text.toUpperCase() && text.length > 3;

        if (startsWithNumbering || endsWithColon || isTitleCase || isShort || isFullyCapitalized) {
            return {
                label: text.replace(/^(\d+\.?\s*)+/, '').replace(/^([IVXLCD]+\.\s*)/i, '').replace(/^([A-Z]\.\s*)/i, '').replace(':', '').trim()
            };
        }

        return null;
    }

    /**
     * Detect Level-2 Node (Subtopics)
     */
    _detectLevel2Node(line, currentParent) {
        if (!currentParent) return null;

        const text = line.trimmed;

        // Must follow a Level-1 node (currentParent exists)
        const startsWithBullet = /^[-•*]\s/.test(text);
        const startsWithLetterList = /^[a-z]\)\s/i.test(text);
        const isIndented = line.indent >= 2;
        const wordCount = text.split(/\s+/).length;
        const isSentenceFragment = wordCount <= 8 && !text.endsWith('.');

        if (startsWithBullet || startsWithLetterList || isIndented || isSentenceFragment) {
            return {
                label: text.replace(/^[-•*]\s/, '').replace(/^[a-z]\)\s/i, '').trim()
            };
        }

        return null;
    }

    /**
     * STEP 4: Check if line is noise to ignore
     */
    _isNoise(text) {
        // Too long
        if (text.length > 120) return true;

        // Contains URLs
        if (/(http|https|www\.)/i.test(text)) return true;

        // Copyright symbols
        if (/©|®|™/.test(text)) return true;

        // Page numbers (already checked, but additional patterns)
        if (/^\d+$/.test(text) || /^Page \d+/i.test(text)) return true;

        // Repeated headers/footers (simple check for very short repeated patterns)
        // This is basic - in a real implementation, you'd track frequency
        if (text.length < 5 && /^\W+$/.test(text)) return true;

        return false;
    }

    /**
     * STEP 5: Normalize Labels
     */
    _normalizeLabel(text) {
        return text
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .trim()
            .toLowerCase()
            .replace(/\b\w/g, l => l.toUpperCase()) // Sentence case
            .split(/\s+/)
            .slice(0, 8) // Limit to 8 words
            .join(' ');
    }

    /**
     * Create node object for React Flow
     */
    _createNodeObject(nodeData, position) {
        return {
            id: nodeData.id,
            data: { label: nodeData.label },
            position: position,
            type: 'default'
        };
    }

    /**
     * Calculate position for hierarchical layout
     */
    _calculatePosition(nodeIndex, level) {
        const baseRadius = level === 1 ? 200 : 350;
        const angle = (nodeIndex * 2 * Math.PI) / 8; // Distribute around circle

        return {
            x: Math.cos(angle) * baseRadius,
            y: Math.sin(angle) * baseRadius
        };
    }

    /**
     * STATISTICAL FALLBACK: Generate nodes based on word frequency
     */
    _generateStatisticalMindMap(text) {
        const nodes = [];
        const edges = [];
        
        // 1. Create Root
        const rootId = 'root';
        nodes.push(this._createNodeObject({ id: rootId, label: 'Main Concepts' }, { x: 0, y: 0 }));

        // 2. Extract Keywords (Frequency Analysis)
        const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
        const freq = {};
        words.forEach(w => {
            if (!this.stopWords.has(w)) {
                freq[w] = (freq[w] || 0) + 1;
            }
        });

        // Get top 6 keywords
        const topKeywords = Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);

        // 3. Create Nodes from Keywords
        topKeywords.forEach((item, idx) => {
            const word = item[0];
            const nodeId = `main_${idx}`;
            const label = word.charAt(0).toUpperCase() + word.slice(1);
            const position = this._calculatePosition(idx, 1);

            nodes.push(this._createNodeObject({ id: nodeId, label }, position));
            edges.push({
                id: `e_${rootId}_${nodeId}`,
                source: rootId,
                target: nodeId,
                label: 'relates to'
            });

            // Find a related context sentence for a sub-node
            const sentenceRegex = new RegExp(`[^.?!]*\\b${word}\\b[^.?!]*[.?!]`, 'i');
            const match = text.match(sentenceRegex);
            if (match) {
                const subNodeId = `sub_${idx}`;
                const subLabel = match[0].trim().split(/\s+/).slice(0, 6).join(' ') + '...';
                const subPos = this._calculatePosition(idx, 2); // Simplified positioning
                
                nodes.push(this._createNodeObject({ id: subNodeId, label: subLabel }, subPos));
                edges.push({ id: `e_${nodeId}_${subNodeId}`, source: nodeId, target: subNodeId });
            }
        });

        return { nodes, edges };
    }

    /**
     * Preprocess mind map result for React Flow v12 compatibility
     * Ensures all nodes and edges are in the proper structure
     */
    _preprocessMindMapResult(nodes, edges, method) {
        // Preprocess nodes to ensure React Flow v12 compatibility
        const processedNodes = nodes.map((node, index) => {
            // Ensure required properties exist
            const processedNode = {
                id: node.id || `node_${index}`,
                type: node.type || 'default',
                position: node.position || { x: index * 150, y: index * 100 },
                data: node.data || {},
                ...node // Allow overriding defaults
            };

            // Ensure data.label exists for display
            if (!processedNode.data.label) {
                processedNode.data.label = node.label || node.id || `Node ${index + 1}`;
            }

            // Ensure position is valid
            if (!processedNode.position || typeof processedNode.position.x !== 'number' || typeof processedNode.position.y !== 'number') {
                processedNode.position = { x: index * 150, y: index * 100 };
            }

            return processedNode;
        });

        // Preprocess edges to ensure proper structure
        const processedEdges = edges.map((edge, index) => ({
            id: edge.id || `edge_${index}`,
            source: edge.source || edge.from,
            target: edge.target || edge.to,
            ...edge // Allow additional properties
        })).filter(edge => edge.source && edge.target); // Filter out invalid edges

        return {
            nodes: processedNodes,
            edges: processedEdges,
            metadata: {
                generatedAt: new Date().toISOString(),
                method: method,
                nodeCount: processedNodes.length,
                edgeCount: processedEdges.length
            }
        };
    }
}

module.exports = new MindMapService();
